import { database, getTable } from '#lib/server/db/queries/_core.ts';
import { realtimeHub, syncTopics } from '#lib/server/realtime/hub.ts';
import { eq, sql } from 'drizzle-orm';

type DurableSyncOperation = 'create' | 'update' | 'delete' | 'delta';

interface SyncedMutationOptions<TResult> {
	entityType: string;
	operation: DurableSyncOperation;
	deviceId: string;
	operationId?: string;
	describe: (result: TResult) => {
		phcId: string;
		entityId: string;
		payload: unknown;
		clientUpdatedAt?: Date | number;
	};
}

export interface DurableSyncDescriptor {
	phcId: string;
	deviceId: string;
	operationId: string;
	entityType: string;
	entityId: string;
	operation: DurableSyncOperation;
	payload: unknown;
	clientUpdatedAt?: Date | number;
}

function asDate(value: Date | number | undefined): Date {
	if (value instanceof Date) return value;
	return new Date(value ?? Date.now());
}

/**
 * Allocates the next cursor while holding the PHC row lock. Because later
 * writers cannot allocate until the current transaction commits or rolls back,
 * visible versions remain gap-free and commit-ordered within a PHC.
 */
export async function allocateSyncVersion(tx: typeof database, phcId: string): Promise<number> {
	const phcs = getTable('phcs');
	const [updated] = await tx
		.update(phcs)
		.set({ syncVersion: sql`${phcs.syncVersion} + 1` })
		.where(eq(phcs.id, phcId))
		.returning({ version: phcs.syncVersion });

	const version = Number(updated?.version);
	if (!Number.isSafeInteger(version) || version < 1) {
		throw new Error('Unable to allocate a durable sync version');
	}
	return version;
}

/** Appends one durable outbox row inside the caller's domain transaction. */
export async function appendSyncOperation(
	tx: typeof database,
	descriptor: DurableSyncDescriptor
): Promise<number> {
	const syncOperations = getTable('syncOperations');
	const version = await allocateSyncVersion(tx, descriptor.phcId);
	await tx.insert(syncOperations).values({
		phcId: descriptor.phcId,
		deviceId: descriptor.deviceId,
		operationId: descriptor.operationId,
		version,
		entityType: descriptor.entityType,
		entityId: descriptor.entityId,
		operation: descriptor.operation,
		payload: JSON.stringify(descriptor.payload),
		clientUpdatedAt: asDate(descriptor.clientUpdatedAt)
	});
	return version;
}

/**
 * Commits a domain mutation and its durable sync record atomically, then emits
 * a payload-free wake-up signal only after the transaction succeeds.
 */
export async function commitSyncedMutation<TResult>(
	options: SyncedMutationOptions<TResult>,
	mutate: (tx: typeof database) => Promise<TResult>
): Promise<TResult> {
	const committed = await database.transaction(async (tx: typeof database) => {
		const result = await mutate(tx);
		const descriptor = options.describe(result);
		const version = await appendSyncOperation(tx, {
			phcId: descriptor.phcId,
			deviceId: options.deviceId,
			operationId: options.operationId ?? crypto.randomUUID(),
			entityType: options.entityType,
			entityId: descriptor.entityId,
			operation: options.operation,
			payload: descriptor.payload,
			clientUpdatedAt: asDate(descriptor.clientUpdatedAt)
		});
		return { result, descriptor, version };
	});

	realtimeHub.publish(syncTopics.phc(committed.descriptor.phcId), {
		entityType: options.entityType,
		entityId: committed.descriptor.entityId,
		operation: options.operation === 'delta' ? 'update' : options.operation
	});

	return committed.result;
}

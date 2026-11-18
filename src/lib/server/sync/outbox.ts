import { database, getTable } from '#lib/server/db/queries/_core.ts';
import { realtimeHub, syncTopics } from '#lib/server/realtime/hub.ts';

type DurableSyncOperation = 'create' | 'update' | 'delete' | 'delta';

interface SyncedMutationOptions<TResult> {
	entityType: string;
	operation: DurableSyncOperation;
	deviceId: string;
	describe: (result: TResult) => {
		phcId: string;
		entityId: string;
		payload: unknown;
		clientUpdatedAt?: Date | number;
	};
}

function asDate(value: Date | number | undefined): Date {
	if (value instanceof Date) return value;
	return new Date(value ?? Date.now());
}

/**
 * Commits a domain mutation and its durable sync record atomically, then emits
 * a payload-free wake-up signal only after the transaction succeeds.
 */
export async function commitSyncedMutation<TResult>(
	options: SyncedMutationOptions<TResult>,
	mutate: (tx: typeof database) => Promise<TResult>
): Promise<TResult> {
	const syncOperations = getTable('syncOperations');
	const committed = await database.transaction(async (tx: typeof database) => {
		const result = await mutate(tx);
		const descriptor = options.describe(result);
		await tx.insert(syncOperations).values({
			phcId: descriptor.phcId,
			deviceId: options.deviceId,
			entityType: options.entityType,
			entityId: descriptor.entityId,
			operation: options.operation,
			payload: JSON.stringify(descriptor.payload),
			clientUpdatedAt: asDate(descriptor.clientUpdatedAt)
		});
		return { result, descriptor };
	});

	realtimeHub.publish(syncTopics.phc(committed.descriptor.phcId), {
		entityType: options.entityType,
		entityId: committed.descriptor.entityId,
		operation: options.operation === 'delta' ? 'update' : options.operation
	});

	return committed.result;
}

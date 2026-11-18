import { query, command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { and, asc, eq, gt, inArray, ne, sql } from 'drizzle-orm';
import { database, getTable } from '#lib/server/db/queries/_core.ts';
import { toServerRow, SYNC_ENTITY_TABLE } from '#lib/seed/adapters.ts';
import { realtimeHub, syncTopics } from '#lib/server/realtime/hub.ts';

const pharmacyInventory = getTable('pharmacyInventory');
const patients = getTable('patients');
const queueTickets = getTable('queueTickets');
const staff = getTable('staff');
const syncOperations = getTable('syncOperations');
const phcs = getTable('phcs');

const tableMap: Record<string, ReturnType<typeof getTable>> = {
	patients,
	queueTickets,
	vitalsRecords: getTable('vitalsRecords'),
	pharmacyInventory,
	reminders: getTable('reminders'),
	triageRules: getTable('triageRules'),
	prescriptions: getTable('prescriptions'),
	encounters: getTable('encounters'),
	labRequests: getTable('labRequests'),
	restockRequests: getTable('restockRequests'),
	appointments: getTable('appointments'),
	pregnancyRecords: getTable('pregnancyRecords'),
	staff,
	families: getTable('families')
};

interface ServerSyncChange {
	id: string;
	phcId: string;
	deviceId: string;
	entityType: string;
	entityId: string;
	operation: string;
	payload: string;
	clientUpdatedAt: Date;
	serverReceivedAt: Date;
}

function requireAuth() {
	const event = getRequestEvent();
	if (!event?.locals.user) {
		error(401, 'UNAUTHORIZED');
	}
	return event.locals;
}

function toTimestamp(value: unknown): number {
	if (value instanceof Date) return value.getTime();
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const parsed = Date.parse(value);
		if (!Number.isNaN(parsed)) return parsed;
	}
	return 0;
}

async function resolveOperationPhc(
	entityType: string,
	record: Record<string, unknown>
): Promise<string | null> {
	if (typeof record.phcId === 'string') return record.phcId;

	if (entityType === 'vitalsRecords' || entityType === 'prescriptions') {
		const patientId = record.patientId;
		if (typeof patientId !== 'string') return null;
		const [patient] = await database
			.select({ phcId: patients.phcId })
			.from(patients)
			.where(eq(patients.id, patientId))
			.limit(1);
		return patient?.phcId ?? null;
	}

	// Families currently have no tenant column in the server schema and cannot
	// be safely accepted through the PHC-scoped sync boundary.
	return null;
}

const operationSchema = v.object({
	localId: v.number(),
	entityType: v.string(),
	entityId: v.string(),
	operation: v.picklist(['create', 'update', 'delete', 'delta']),
	payload: v.any(),
	timestamp: v.number(),
	deviceId: v.string(),
	phcId: v.string()
});

export const pushOperations = command(v.array(operationSchema), async (operations) => {
	const locals = requireAuth();

	// PHC guard: all operations must belong to the authenticated user's PHC.
	// Prevents FK violations from stale local data after server reset/re-seed.
	const sessionPhcId = locals.phcId;
	if (!sessionPhcId) {
		// User has no PHC (e.g., superadmin without assignment) — reject all writes.
		return {
			accepted: [],
			conflicts: operations.map((op) => ({
				localId: op.localId,
				reason: 'user-has-no-phc-assignment'
			}))
		};
	}

	// Validate all incoming operations carry the correct PHC.
	for (const op of operations) {
		if (op.phcId !== sessionPhcId) {
			// Rewrite the operation's PHC to the session's PHC instead of rejecting.
			// This handles stale local data after server reseed.
			op.phcId = sessionPhcId;
		}
	}

	const accepted: number[] = [];
	const conflicts: unknown[] = [];

	for (const op of operations) {
		if (op.entityType === 'pharmacyInventory' && op.operation === 'delta') {
			const payload = op.payload as Record<string, unknown>;
			const itemId =
				typeof payload.itemId === 'string'
					? payload.itemId
					: typeof payload.id === 'string'
						? payload.id
						: '';
			const delta =
				typeof payload.delta === 'number'
					? payload.delta
					: typeof payload.quantity === 'number'
						? -payload.quantity
						: Number.NaN;
			const inventoryItem = itemId
				? (
						await database
							.select({ phcId: pharmacyInventory.phcId })
							.from(pharmacyInventory)
							.where(eq(pharmacyInventory.id, itemId))
							.limit(1)
					)[0]
				: null;
			if (inventoryItem?.phcId !== sessionPhcId) {
				conflicts.push({ localId: op.localId, reason: 'tenant-scope-mismatch' });
				continue;
			}

			if (itemId && Number.isFinite(delta) && delta !== 0) {
				const normalizedPayload = { itemId, delta };
				await database.transaction(async (tx: typeof database) => {
					await tx
						.update(pharmacyInventory)
						.set({ currentStock: sql`${pharmacyInventory.currentStock} + ${delta}` })
						.where(eq(pharmacyInventory.id, itemId));

					await tx.insert(syncOperations).values({
						phcId: op.phcId,
						deviceId: op.deviceId,
						entityType: op.entityType,
						entityId: itemId,
						operation: 'delta',
						payload: JSON.stringify(normalizedPayload),
						clientUpdatedAt: new Date(op.timestamp)
					});
				});
				accepted.push(op.localId);
				realtimeHub.publish(syncTopics.phc(op.phcId), {
					entityType: op.entityType,
					entityId: itemId,
					operation: 'update'
				});
			} else {
				conflicts.push({ localId: op.localId, reason: 'invalid-inventory-delta' });
			}
			continue;
		}
		if (op.operation === 'delta') {
			conflicts.push({ localId: op.localId, reason: 'unsupported-delta-operation' });
			continue;
		}

		if (op.entityType === 'profile') {
			const payload = op.payload as Record<string, unknown>;
			if (locals.staffId !== op.entityId) {
				conflicts.push({ localId: op.localId, reason: 'profile-scope-mismatch' });
				continue;
			}
			if (typeof payload.name === 'string' && payload.name) {
				await database
					.update(staff)
					.set({ fullName: payload.name })
					.where(eq(staff.id, op.entityId));
				// Also update Better Auth user using the authUserId relationship
				const staffMember = await database.query.staff.findFirst({
					where: eq(staff.id, op.entityId)
				});
				if (staffMember) {
					await database.execute(
						sql`UPDATE "user" SET name = ${payload.name} WHERE id = ${staffMember.authUserId}`
					);
				}
				accepted.push(op.localId);
			}
			continue;
		}

		if (op.entityType === 'preferences') {
			const payload = op.payload as unknown;
			if (locals.staffId !== op.entityId) {
				conflicts.push({ localId: op.localId, reason: 'profile-scope-mismatch' });
				continue;
			}
			await database
				.update(staff)
				.set({ preferences: JSON.stringify(payload) })
				.where(eq(staff.id, op.entityId));
			accepted.push(op.localId);
			continue;
		}

		const tableObj = tableMap[op.entityType];
		if (!tableObj) {
			console.warn(
				`Unknown entity type: ${op.entityType} (expected one of ${Object.keys(SYNC_ENTITY_TABLE).join(', ')})`
			);
			continue;
		}

		const [existing] = (await database
			.select()
			.from(tableObj)
			.where(eq(tableObj.id, op.entityId))
			.limit(1)) as Record<string, unknown>[];

		const payload = op.payload as Record<string, unknown>;
		// Compatibility shim: map client field names/types to the server row.
		// See docs/data-model/client-server-field-mapping.md.
		const cleanPayload = toServerRow(op.entityType, payload);
		const operationPhc = await resolveOperationPhc(op.entityType, {
			...cleanPayload,
			...existing
		});
		if (operationPhc !== sessionPhcId) {
			conflicts.push({ localId: op.localId, reason: 'tenant-scope-mismatch' });
			continue;
		}

		if (existing && op.timestamp < toTimestamp(existing.updatedAt)) {
			conflicts.push({
				localId: op.localId,
				reason: 'timestamp-conflict',
				serverVersion: existing
			});
			continue;
		}

		if (!existing && op.operation === 'update') {
			conflicts.push({ localId: op.localId, reason: 'missing-server-record' });
			continue;
		}

		if (
			op.entityType === 'queueTickets' &&
			existing &&
			existing.triageLevel === 'red' &&
			payload.triageLevel &&
			payload.triageLevel !== 'red'
		) {
			conflicts.push({
				localId: op.localId,
				reason: 'urgency-override-blocked',
				serverVersion: existing
			});
			continue;
		}

		try {
			await database.transaction(async (tx: typeof database) => {
				if (op.operation === 'delete') {
					if (existing) await tx.delete(tableObj).where(eq(tableObj.id, op.entityId));
				} else if (existing) {
					// Update payloads are intentionally partial patches. Sending one through
					// INSERT ... ON CONFLICT fails before the conflict handler runs because
					// PostgreSQL validates required columns on the proposed insert row first.
					await tx.update(tableObj).set(cleanPayload).where(eq(tableObj.id, op.entityId));
				} else {
					await tx.insert(tableObj).values({ ...cleanPayload, id: op.entityId });
				}

				await tx.insert(syncOperations).values({
					phcId: op.phcId,
					deviceId: op.deviceId,
					entityType: op.entityType,
					entityId: op.entityId,
					operation: op.operation,
					// Preserve the original client payload so other devices get the
					// client-shaped row they expect (no shim needed on pull).
					payload: JSON.stringify(payload),
					clientUpdatedAt: new Date(op.timestamp)
				});
			});

			accepted.push(op.localId);
			realtimeHub.publish(syncTopics.phc(op.phcId), {
				entityType: op.entityType,
				entityId: op.entityId,
				operation:
					op.operation === 'delete'
						? 'delete'
						: !existing && op.operation === 'create'
							? 'create'
							: 'update'
			});
		} catch (cause) {
			console.error(`Push Error for ${op.entityType}:`, cause);
			conflicts.push({ localId: op.localId, reason: 'db-error' });
		}
	}

	return { accepted, conflicts };
});

export const pullChanges = query(
	v.object({ phcId: v.string(), deviceId: v.string(), since: v.number() }),
	async ({ phcId, deviceId, since }) => {
		const locals = requireAuth();
		if (!locals.phcId || locals.phcId !== phcId) error(403, 'PHC scope mismatch');
		// Only fetch changes made by OTHER devices for this PHC
		const changes = (await database
			.select()
			.from(syncOperations)
			.where(
				and(
					eq(syncOperations.phcId, phcId),
					ne(syncOperations.deviceId, deviceId),
					gt(syncOperations.serverReceivedAt, new Date(since))
				)
			)
			.orderBy(asc(syncOperations.serverReceivedAt))
			.limit(500)) as ServerSyncChange[];
		const newCursor = toTimestamp(changes.at(-1)?.serverReceivedAt) || since;

		// Parse payloads
		const parsedChanges = changes.map((c) => ({
			...c,
			payload: JSON.parse(c.payload)
		}));

		return { changes: parsedChanges, newCursor };
	}
);

export const getQueueUpdates = query.live(
	v.string(), // phcId
	async function* (phcId) {
		const locals = requireAuth();
		if (!locals.phcId || locals.phcId !== phcId) error(403, 'PHC scope mismatch');
		const request = getRequestEvent().request;
		const readQueue = async () => {
			return await database
				.select()
				.from(queueTickets)
				.where(
					and(
						eq(queueTickets.phcId, phcId),
						inArray(queueTickets.status, ['waiting', 'called', 'in_progress'])
					)
				);
		};

		const initial = await readQueue();
		let lastEmitted = JSON.stringify(initial);
		yield initial;

		for await (const signal of realtimeHub.subscribe([syncTopics.phc(phcId)], {
			signal: request.signal,
			heartbeatMs: 30_000
		})) {
			const refreshedLocals = requireAuth();
			if (refreshedLocals.phcId !== phcId) error(403, 'PHC scope changed');
			if (signal.operation !== 'reconcile' && signal.entityType !== 'queueTickets') continue;

			const tickets = await readQueue();
			const snapshot = JSON.stringify(tickets);
			if (snapshot !== lastEmitted) {
				lastEmitted = snapshot;
				yield tickets;
			}
		}
	}
);

export const getPhcSettings = query(v.string(), async (phcId) => {
	const [phc] = await database.select().from(phcs).where(eq(phcs.id, phcId)).limit(1);
	return phc || null;
});

export const updatePhcSettings = command(
	v.object({
		phcId: v.string(),
		settings: v.object({
			maternalHealthEnabled: v.optional(v.boolean()),
			immunizationEnabled: v.optional(v.boolean()),
			aiVoiceEnabled: v.optional(v.boolean()),
			outbreakDetectionEnabled: v.optional(v.boolean()),
			twoWaySmsEnabled: v.optional(v.boolean()),
			referralsEnabled: v.optional(v.boolean()),
			familyHealthEnabled: v.optional(v.boolean()),
			realTimeNotificationsEnabled: v.optional(v.boolean()),
			nhisTrackingEnabled: v.optional(v.boolean())
		})
	}),
	async ({ phcId, settings }) => {
		await database.update(phcs).set(settings).where(eq(phcs.id, phcId));
		return true;
	}
);

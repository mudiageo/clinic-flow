import { query, command } from '$app/server';
import * as v from 'valibot';
import { db as serverDb } from '$lib/server/db';
import { sql, eq, inArray, gt, and } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { pharmacyInventory, syncOperations } from '$lib/server/db/schema';

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
	const accepted: number[] = [];
	const conflicts: unknown[] = [];

	const tableMap: Record<string, any> = {
		patients: schema.patients,
		queueTickets: schema.queueTickets,
		vitalsRecords: schema.vitalsRecords,
		pharmacyInventory: schema.pharmacyInventory,
		reminders: schema.reminders,
		triageRules: schema.triageRules,
		prescriptions: schema.prescriptions
	};

	for (const op of operations) {
		if (op.entityType === 'pharmacyInventory' && op.operation === 'delta') {
			const payload = op.payload as any;
			if (payload.itemId && payload.delta) {
				await serverDb
					.update(pharmacyInventory)
					.set({ currentStock: sql`${pharmacyInventory.currentStock} + ${payload.delta}` })
					.where(eq(pharmacyInventory.id, payload.itemId));
				accepted.push(op.localId);

				// Log to syncOperations for other devices
				await serverDb.insert(syncOperations).values({
					phcId: op.phcId,
					deviceId: op.deviceId,
					entityType: op.entityType,
					entityId: payload.itemId,
					operation: 'delta',
					payload: JSON.stringify(payload),
					clientUpdatedAt: new Date(op.timestamp)
				});
			}
			continue;
		}

		const tableObj = tableMap[op.entityType];
		if (!tableObj) {
			console.warn(`Unknown entity type: ${op.entityType}`);
			continue;
		}

		const queryProp = op.entityType as keyof typeof serverDb.query;
		const q = serverDb.query[queryProp] as any;
		const existing = q
			? await q.findFirst({
					where: (t: any, { eq }: any) => eq(t.id, op.entityId)
				})
			: null;

		const payload = op.payload as Record<string, any>;
		const { syncStatus, serverUpdatedAt, ...cleanPayload } = payload;

		// Fix timestamps
		for (const [k, v] of Object.entries(cleanPayload)) {
			if (
				[
					'dob',
					'recordedAt',
					'calledAt',
					'completedAt',
					'visitDate',
					'dueDate',
					'sentAt',
					'dispensedAt'
				].includes(k) &&
				typeof v === 'number'
			) {
				cleanPayload[k] = new Date(v);
			}
		}

		if (!existing || op.timestamp >= (existing.updatedAt?.getTime() || 0)) {
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
				await serverDb
					.insert(tableObj)
					.values({ ...cleanPayload, id: op.entityId })
					.onConflictDoUpdate({ target: tableObj.id, set: cleanPayload });

				accepted.push(op.localId);

				await serverDb.insert(syncOperations).values({
					phcId: op.phcId,
					deviceId: op.deviceId,
					entityType: op.entityType,
					entityId: op.entityId,
					operation: op.operation,
					payload: JSON.stringify(cleanPayload),
					clientUpdatedAt: new Date(op.timestamp)
				});
			} catch (e) {
				console.error(`Push Error for ${op.entityType}:`, e);
				conflicts.push({ localId: op.localId, reason: 'db-error' });
			}
		} else {
			conflicts.push({
				localId: op.localId,
				reason: 'timestamp-conflict',
				serverVersion: existing
			});
		}
	}

	const affectedPhcIds = new Set(
		operations
			.filter((o) => o.entityType === 'queueTickets')
			.map((o) => o.phcId)
			.filter(Boolean)
	);
	for (const phcId of affectedPhcIds) {
		if (phcId) {
			void getQueueUpdates(phcId as string).reconnect();
		}
	}

	return { accepted, conflicts };
});

export const pullChanges = query(
	v.object({ phcId: v.string(), deviceId: v.string(), since: v.number() }),
	async ({ phcId, deviceId, since }) => {
		// Only fetch changes made by OTHER devices for this PHC
		const changes = await serverDb.query.syncOperations.findMany({
			where: (t, { and, eq, gt, ne }) =>
				and(eq(t.phcId, phcId), ne(t.deviceId, deviceId), gt(t.serverReceivedAt, new Date(since))),
			orderBy: (t, { asc }) => asc(t.serverReceivedAt),
			limit: 500 // Batch limit
		});
		const newCursor = changes.at(-1)?.serverReceivedAt?.getTime() ?? since;

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
		let lastEmitted: string | null = null;
		while (true) {
			const tickets = await serverDb.query.queueTickets.findMany({
				where: (t, { eq, inArray }) =>
					eq(t.phcId, phcId) && inArray(t.status, ['waiting', 'called', 'in_progress'])
			});
			const snapshot = JSON.stringify(tickets);
			if (snapshot !== lastEmitted) {
				lastEmitted = snapshot;
				yield tickets;
			}
			await new Promise((r) => setTimeout(r, 2000));
		}
	}
);

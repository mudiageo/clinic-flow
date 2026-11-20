import { getRequestEvent, query } from '$app/server';
import { desc, eq } from 'drizzle-orm';
import { database, getTable } from '#lib/server/db/queries/_core.ts';
import { requirePermission } from '#lib/server/permissions.ts';
import { aggregateSyncHealth, type SyncHealthSnapshot } from '#lib/server/sync-health.ts';

const EMPTY: SyncHealthSnapshot = {
	devices: [],
	recent: [],
	totals: { devices: 0, syncedDevices: 0, operations: 0 }
};

/**
 * PHC-scoped, read-only sync projection backed by durable device and
 * sync_operations rows. No live-only or fabricated data is used here.
 */
export const getSyncHealth = query(async (): Promise<SyncHealthSnapshot> => {
	await requirePermission('view:sync_health');

	const event = getRequestEvent();
	if (!event.locals.phcId) return EMPTY;

	const phcId = event.locals.phcId;
	const devicesTable = getTable('devices');
	const operationsTable = getTable('syncOperations');

	const [devices, operations] = await Promise.all([
		database
			.select()
			.from(devicesTable)
			.where(eq(devicesTable.phcId, phcId))
			.orderBy(desc(devicesTable.lastSyncAt)),
		database
			.select()
			.from(operationsTable)
			.where(eq(operationsTable.phcId, phcId))
			.orderBy(desc(operationsTable.serverReceivedAt))
			.limit(100)
	]);

	return aggregateSyncHealth(devices, operations);
});

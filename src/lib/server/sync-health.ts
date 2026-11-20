/**
 * Pure aggregation for the sync-health page. Kept separate from the remote so it
 * can be tested without a request context or database.
 */

export interface SyncDeviceInput {
	id: string;
	name: string;
	role: string | null;
	status: string | null;
	lastSyncAt: Date | string | null;
}

export interface SyncOperationInput {
	id: string;
	deviceId: string;
	entityType: string;
	operation: string;
	version: number;
	serverReceivedAt: Date | string;
}

export interface DeviceSyncRow {
	id: string;
	name: string;
	role: string | null;
	status: string | null;
	lastSyncAt: string | null;
	operationCount: number;
	lastOperationAt: string | null;
}

export interface RecentSyncRow {
	id: string;
	deviceId: string;
	device: string;
	entityType: string;
	operation: string;
	version: number;
	receivedAt: string;
}

export interface SyncHealthSnapshot {
	devices: DeviceSyncRow[];
	recent: RecentSyncRow[];
	totals: {
		devices: number;
		syncedDevices: number;
		operations: number;
	};
}

const MAX_RECENT_ROWS = 20;

function toIso(value: Date | string | null | undefined): string | null {
	if (!value) return null;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Builds a durable, read-only projection from device records and the server's
 * sync_operations table. No fabricated rows or statuses are produced.
 */
export function aggregateSyncHealth(
	devices: SyncDeviceInput[],
	operations: SyncOperationInput[]
): SyncHealthSnapshot {
	const deviceById = new Map(devices.map((device) => [device.id, device]));
	const counts = new Map<string, { count: number; lastAt: string | null }>();

	for (const operation of operations) {
		const receivedAt = toIso(operation.serverReceivedAt);
		const current = counts.get(operation.deviceId) ?? { count: 0, lastAt: null };
		current.count += 1;
		if (receivedAt && (!current.lastAt || receivedAt > current.lastAt)) {
			current.lastAt = receivedAt;
		}
		counts.set(operation.deviceId, current);
	}

	const deviceRows: DeviceSyncRow[] = devices.map((device) => {
		const stats = counts.get(device.id);
		const lastOperationAt = stats?.lastAt ?? null;
		return {
			id: device.id,
			name: device.name,
			role: device.role,
			status: device.status,
			lastSyncAt: toIso(device.lastSyncAt) ?? lastOperationAt,
			operationCount: stats?.count ?? 0,
			lastOperationAt
		};
	});

	// Operations from a device that has since been removed still get a labelled row.
	const recent: RecentSyncRow[] = operations.slice(0, MAX_RECENT_ROWS).map((operation) => {
		const device = deviceById.get(operation.deviceId);
		return {
			id: operation.id,
			deviceId: operation.deviceId,
			device: device?.name ?? `Removed device (${operation.deviceId.slice(0, 8)})`,
			entityType: operation.entityType,
			operation: operation.operation,
			version: operation.version,
			receivedAt: toIso(operation.serverReceivedAt) ?? ''
		};
	});

	return {
		devices: deviceRows,
		recent,
		totals: {
			devices: deviceRows.length,
			syncedDevices: deviceRows.filter((row) => row.lastSyncAt !== null).length,
			operations: operations.length
		}
	};
}

import { describe, expect, it } from 'vitest';
import { aggregateSyncHealth } from './sync-health';

const devices = [
	{
		id: 'device-1',
		name: 'Reception Tablet',
		role: 'kiosk',
		status: 'approved',
		lastSyncAt: new Date('2026-11-20T10:00:00.000Z')
	},
	{
		id: 'device-2',
		name: 'Pharmacy Terminal',
		role: 'pharmacy_terminal',
		status: 'approved',
		lastSyncAt: null
	}
];

const operations = [
	{
		id: 'op-1',
		deviceId: 'device-1',
		entityType: 'patient',
		operation: 'create',
		version: 1,
		serverReceivedAt: new Date('2026-11-20T09:00:00.000Z')
	},
	{
		id: 'op-2',
		deviceId: 'device-1',
		entityType: 'vitals',
		operation: 'update',
		version: 2,
		serverReceivedAt: new Date('2026-11-20T10:00:00.000Z')
	},
	{
		id: 'op-3',
		deviceId: 'removed-device',
		entityType: 'encounter',
		operation: 'create',
		version: 3,
		serverReceivedAt: new Date('2026-11-19T10:00:00.000Z')
	}
];

describe('aggregateSyncHealth', () => {
	it('counts durable operations and derives per-device sync rows', () => {
		const snapshot = aggregateSyncHealth(devices, operations);

		expect(snapshot.totals).toEqual({ devices: 2, syncedDevices: 1, operations: 3 });
		expect(snapshot.devices[0]).toMatchObject({
			name: 'Reception Tablet',
			operationCount: 2,
			lastOperationAt: '2026-11-20T10:00:00.000Z'
		});
	});

	it('uses the newest durable operation when a device has no lastSyncAt', () => {
		const snapshot = aggregateSyncHealth([devices[1]], operations);
		expect(snapshot.devices[0].lastSyncAt).toBeNull();
		expect(snapshot.devices[0].operationCount).toBe(0);
		expect(snapshot.totals.syncedDevices).toBe(0);
	});

	it('labels operations from removed devices without inventing a device name', () => {
		const snapshot = aggregateSyncHealth(devices, operations);
		const row = snapshot.recent.find((item) => item.deviceId === 'removed-device');
		expect(row?.device).toBe('Removed device (removed-)');
	});
});

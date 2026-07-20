import { db } from '$lib/local-db/db';
import { pushOperations, pullChanges } from '../../routes/sync/sync.remote';

// Generate a stable device ID for sync segregation
function getDeviceId() {
	if (typeof localStorage === 'undefined') return 'unknown';
	let deviceId = localStorage.getItem('clinicflow_device_id');
	if (!deviceId) {
		deviceId = crypto.randomUUID();
		localStorage.setItem('clinicflow_device_id', deviceId);
	}
	return deviceId;
}

class SyncStore {
	online = $state(typeof navigator !== 'undefined' ? navigator.onLine : true);
	pendingCount = $state(0);
	lastSyncedAt = $state<number | null>(null);

	private phcId: string | null = null;
	private cursor = 0;
	private intervalHandle: ReturnType<typeof setInterval> | null = null;
	private deviceId = getDeviceId();
	private bc: BroadcastChannel | null = null;

	constructor() {
		if (typeof window !== 'undefined') {
			window.addEventListener('online', () => {
				this.online = true;
				this.flush();
			});
			window.addEventListener('offline', () => {
				this.online = false;
			});
			this.refreshPendingCount();

			// Load saved cursor
			const savedCursor = localStorage.getItem('clinicflow_sync_cursor');
			if (savedCursor) this.cursor = parseInt(savedCursor, 10);

			// Auto flush every 30s
			this.intervalHandle = setInterval(() => this.flush(), 30_000);

			// Setup BroadcastChannel for cross-tab sync triggers
			this.bc = new BroadcastChannel('clinicflow_sync_channel');
			this.bc.onmessage = (event) => {
				if (event.data === 'sync_requested') {
					this.flush();
				}
			};
		}
	}

	setPhcId(phcId: string) {
		this.phcId = phcId;
	}

	async refreshPendingCount() {
		this.pendingCount = await db.syncLog.where('synced').equals(0).count();
	}

	async flush() {
		if (!this.online || !this.phcId) return;

		// --- PUSH ---
		const pending = await db.syncLog.where('synced').equals(0).toArray();
		if (pending.length > 0) {
			// Chunking (simple implementation)
			const chunkSize = 50;
			for (let i = 0; i < pending.length; i += chunkSize) {
				const batch = pending.slice(i, i + chunkSize);
				try {
					// Format for remote
					const formattedBatch = batch.map((b) => ({
						localId: b.localId!,
						entityType: b.entityType,
						entityId: b.entityId,
						operation: b.operation as any,
						payload: b.payload,
						timestamp: b.timestamp,
						deviceId: this.deviceId,
						phcId: this.phcId!
					}));

					const { accepted, conflicts } = await pushOperations(formattedBatch);

					// Mark as synced locally
					if (accepted.length > 0) {
						await db.syncLog.bulkUpdate(
							accepted.map((localId) => ({ key: localId, changes: { synced: 1 } }))
						);
					}

					// Handle conflicts by logging them
					for (const conflict of conflicts) {
						console.warn('Sync Conflict:', conflict);
						// Update local DB to mark conflict
						const conf = conflict as { localId: number; serverVersion?: any; reason?: string };
						const logEntry = batch.find((b) => b.localId === conf.localId);
						if (logEntry) {
							const table = (db as any)[logEntry.entityType];
							if (table) {
								await table.update(logEntry.entityId, { syncStatus: 'conflict' });
							}
						}
					}
				} catch (e) {
					console.error('Push batch failed:', e);
					break; // Stop on first network error, retry next time
				}
			}
			await this.refreshPendingCount();
		}

		// --- PULL ---
		try {
			const { changes, newCursor } = await pullChanges({
				phcId: this.phcId,
				deviceId: this.deviceId,
				since: this.cursor
			});

			for (const change of changes) {
				const table = (db as any)[change.entityType];
				if (table) {
					const payload = change.payload;
					payload.syncStatus = 'synced'; // Overwrite with synced state

					if (change.operation === 'create' || change.operation === 'update') {
						// Format JS timestamps
						for (const [k, v] of Object.entries(payload)) {
							if (
								[
									'dob',
									'recordedAt',
									'calledAt',
									'completedAt',
									'visitDate',
									'dueDate',
									'sentAt',
									'dispensedAt',
									'createdAt'
								].includes(k) &&
								typeof v === 'string'
							) {
								payload[k] = new Date(v).getTime();
							}
						}
						await table.put(payload);
					} else if (change.operation === 'delete') {
						await table.delete(change.entityId);
					}
				}
			}

			if (newCursor > this.cursor) {
				this.cursor = newCursor;
				localStorage.setItem('clinicflow_sync_cursor', newCursor.toString());
			}

			this.lastSyncedAt = Date.now();
		} catch (e) {
			console.error('Pull changes failed:', e);
		}
	}

	requestSyncAcrossTabs() {
		this.flush();
		if (this.bc) {
			this.bc.postMessage('sync_requested');
		}
	}
}

export const syncStore = new SyncStore();

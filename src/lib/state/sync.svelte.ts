import { db, type SyncLogEntry } from '#lib/local-db/db.ts';
import { pushOperations, pullChanges } from '../../routes/sync/sync.remote';
import { toast } from 'svelte-sonner';
import { settingsStore } from '#lib/state/settings.svelte.ts';
import { toClientRow } from '#lib/seed/adapters.ts';
import { shouldApplyRemoteChange } from '#lib/sync/conflict-resolution.ts';
import { WakeupScheduler } from '#lib/sync/wakeup-scheduler.ts';
import { watchRealtimeSignals } from '#lib/remote/realtime-sync.remote.ts';
import type { Table } from 'dexie';

type SyncableRecord = Record<string, unknown> & {
	id?: string;
	updatedAt?: unknown;
	syncStatus?: unknown;
};

type SyncableTable = Table<SyncableRecord, string>;

function isAuthError(cause: unknown): boolean {
	if (!cause || typeof cause !== 'object') return false;
	const value = cause as { status?: unknown; message?: unknown };
	return (
		value.status === 401 ||
		(typeof value.message === 'string' &&
			(value.message.includes('401') || value.message.includes('UNAUTHORIZED')))
	);
}

function toTimestamp(value: unknown): number {
	if (value instanceof Date) return value.getTime();
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const parsed = Date.parse(value);
		if (!Number.isNaN(parsed)) return parsed;
	}
	return Date.now();
}

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
	isSyncing = $state(false);
	conflicts = $state<{ id: string; entityType: string; reason: string }[]>([]);
	realtimeState = $state<'idle' | 'connecting' | 'live' | 'stale' | 'offline' | 'error'>('idle');
	lastRealtimeAt = $state<number | null>(null);

	private phcId: string | null = null;
	private cursor = 0;
	private intervalHandle: ReturnType<typeof setTimeout> | null = null;
	private deviceId = getDeviceId();
	private bc: BroadcastChannel | null = null;
	private syncAgain = false;
	private wakeupScheduler = new WakeupScheduler(() => void this.flush());
	private liveResource: ReturnType<typeof watchRealtimeSignals> | null = null;
	private liveIterator: AsyncIterator<unknown> | null = null;
	private liveGeneration = 0;

	constructor() {
		if (typeof window !== 'undefined') {
			window.addEventListener('online', () => {
				this.online = true;
				this.realtimeState = this.liveResource ? 'connecting' : 'idle';
				void this.liveResource?.reconnect();
				void this.flush();
			});
			window.addEventListener('offline', () => {
				this.online = false;
				this.realtimeState = 'offline';
			});
			void this.refreshPendingCount();

			// Auto flush using dynamic interval
			const pollLoop = () => {
				void this.flush();
				const interval = (settingsStore.current?.syncPollInterval || 15) * 1000;
				this.intervalHandle = setTimeout(pollLoop, Math.max(5000, interval));
			};
			this.intervalHandle = setTimeout(pollLoop, 15_000);

			// Setup BroadcastChannel for cross-tab sync triggers
			this.bc = new BroadcastChannel('clinicflow_sync_channel');
			this.bc.onmessage = (event) => {
				if (event.data === 'sync_requested') {
					void this.flush();
				}
			};
		}
	}

	setPhcId(phcId: string) {
		if (this.phcId === phcId) return;
		this.phcId = phcId;
		if (typeof localStorage !== 'undefined') {
			const savedCursor = localStorage.getItem(this.cursorKey(phcId));
			this.cursor = savedCursor ? Number.parseInt(savedCursor, 10) || 0 : 0;
		}
	}

	connect(phcId: string): void {
		if (this.liveResource && this.phcId === phcId) return;
		this.disconnect(false);
		this.setPhcId(phcId);
		this.realtimeState = this.online ? 'connecting' : 'offline';

		const generation = ++this.liveGeneration;
		const resource = watchRealtimeSignals();
		const iterator = resource[Symbol.asyncIterator]();
		this.liveResource = resource;
		this.liveIterator = iterator;
		void this.consumeRealtimeSignals(iterator, generation);
	}

	disconnect(clearPhc = true): void {
		this.liveGeneration += 1;
		this.wakeupScheduler.cancel();
		void this.liveIterator?.return?.(undefined);
		this.liveIterator = null;
		this.liveResource = null;
		this.realtimeState = 'idle';
		if (clearPhc) this.phcId = null;
	}

	private cursorKey(phcId: string): string {
		return `clinicflow_sync_cursor:${phcId}`;
	}

	private async consumeRealtimeSignals(
		iterator: AsyncIterator<unknown>,
		generation: number
	): Promise<void> {
		try {
			while (generation === this.liveGeneration) {
				const result = await iterator.next();
				if (result.done || generation !== this.liveGeneration) break;
				this.realtimeState = 'live';
				this.lastRealtimeAt = Date.now();
				this.scheduleRealtimeSync();
			}
			if (generation === this.liveGeneration) {
				this.realtimeState = this.online ? 'stale' : 'offline';
			}
		} catch (cause) {
			if (generation !== this.liveGeneration) return;
			console.error('Realtime sync signal stream failed:', cause);
			this.realtimeState = this.online ? 'error' : 'offline';
		}
	}

	private scheduleRealtimeSync(): void {
		if (this.wakeupScheduler.notify(this.isSyncing) === 'sync-again') this.syncAgain = true;
	}

	async refreshPendingCount() {
		this.pendingCount = await db.syncLog.where('synced').equals(0).count();
	}

	async flush(): Promise<void> {
		if (!this.online || !this.phcId) return;
		if (this.isSyncing) {
			this.syncAgain = true;
			return;
		}

		this.isSyncing = true;
		try {
			do {
				this.syncAgain = false;
				await this.syncOnce(this.phcId);
			} while (this.syncAgain && this.online && this.phcId);
		} finally {
			this.isSyncing = false;
		}
	}

	private async syncOnce(phcId: string): Promise<void> {
		const pending = await db.syncLog.where('synced').equals(0).toArray();
		if (pending.length > 0) {
			const chunkSize = 50;
			for (let i = 0; i < pending.length; i += chunkSize) {
				const batch = pending.slice(i, i + chunkSize);
				try {
					const formattedBatch = batch.map((entry) => {
						if (entry.localId === undefined) throw new Error('Sync operation has no local id');
						return {
							localId: entry.localId,
							entityType: entry.entityType,
							entityId: entry.entityId,
							operation: entry.operation,
							payload: entry.payload,
							timestamp: entry.timestamp,
							deviceId: this.deviceId,
							phcId
						};
					});

					const { accepted, conflicts } = await pushOperations(formattedBatch);
					if (accepted.length > 0) {
						await db.syncLog.bulkUpdate(
							accepted.map((localId) => ({ key: localId, changes: { synced: 1 } }))
						);
						await this.markAcceptedRecordsSynced(batch, accepted);
					}

					for (const conflict of conflicts) {
						if (!conflict || typeof conflict !== 'object' || !('localId' in conflict)) continue;
						const localId = Number(conflict.localId);
						const reason = 'reason' in conflict ? String(conflict.reason) : 'Server rejection';
						const logEntry = batch.find((entry) => entry.localId === localId);
						if (!logEntry) continue;

						console.warn('Sync Conflict:', conflict);
						toast.warning('Sync conflict detected and marked for review');
						await db.syncLog.update(localId, { synced: 1 });
						await this.getTable(logEntry.entityType)?.update(logEntry.entityId, {
							syncStatus: 'conflict'
						});
						this.conflicts.push({
							id: logEntry.entityId,
							entityType: logEntry.entityType,
							reason
						});
					}
				} catch (cause) {
					console.error('Push batch failed:', cause);
					if (isAuthError(cause)) {
						toast.error('Session expired. Please log in again to continue syncing.');
						if (typeof window !== 'undefined') window.location.href = '/login';
						return;
					}
					toast.error('Sync failed. Will retry later.');
					break;
				}
			}
			await this.refreshPendingCount();
		}

		await this.pullAllChanges(phcId);
	}

	private async pullAllChanges(phcId: string): Promise<void> {
		try {
			let hasMore = true;
			while (hasMore) {
				const previousCursor = this.cursor;
				const { changes, newCursor } = await pullChanges({
					phcId,
					deviceId: this.deviceId,
					since: previousCursor
				});

				for (const change of changes) await this.applyRemoteChange(change);

				if (newCursor > previousCursor) {
					this.cursor = newCursor;
					localStorage.setItem(this.cursorKey(phcId), String(newCursor));
				}

				hasMore = changes.length === 500 && newCursor > previousCursor;
			}
			this.lastSyncedAt = Date.now();
		} catch (cause) {
			console.error('Pull changes failed:', cause);
			if (isAuthError(cause)) {
				toast.error('Session expired. Please log in again to continue syncing.');
				if (typeof window !== 'undefined') window.location.href = '/login';
			}
		}
	}

	private async applyRemoteChange(change: {
		entityType: string;
		entityId: string;
		operation: string;
		payload: unknown;
		clientUpdatedAt: unknown;
	}): Promise<void> {
		const table = this.getTable(change.entityType);
		if (!table) return;
		const localRecord = await table.get(change.entityId);
		if (!shouldApplyRemoteChange(localRecord, change.clientUpdatedAt)) return;

		if (change.operation === 'delete') {
			await table.delete(change.entityId);
			return;
		}

		if (change.operation === 'delta') {
			if (!localRecord || !change.payload || typeof change.payload !== 'object') return;
			const delta = Number('delta' in change.payload ? change.payload.delta : 0);
			const currentStock = Number(localRecord.currentStock);
			if (!Number.isFinite(delta) || !Number.isFinite(currentStock)) return;
			await table.update(change.entityId, {
				currentStock: currentStock + delta,
				updatedAt: toTimestamp(change.clientUpdatedAt),
				syncStatus: 'synced'
			});
			return;
		}

		if (change.operation !== 'create' && change.operation !== 'update') return;
		if (!change.payload || typeof change.payload !== 'object') return;

		const payload = toClientRow(
			change.entityType,
			change.payload as Record<string, unknown>
		) as SyncableRecord;
		payload.syncStatus = 'synced';
		if (change.operation === 'create') {
			await table.put({ ...payload, id: change.entityId });
		} else {
			// Update sync entries are partial patches. Merge them into the cached
			// record rather than replacing the row and dropping required fields.
			await table.update(change.entityId, payload);
		}
	}

	private async markAcceptedRecordsSynced(
		batch: SyncLogEntry[],
		accepted: number[]
	): Promise<void> {
		const acceptedIds = new Set(accepted);
		const records: SyncLogEntry[] = [];
		for (const entry of batch) {
			if (entry.localId === undefined || !acceptedIds.has(entry.localId)) continue;
			if (
				!records.some(
					(candidate) =>
						candidate.entityType === entry.entityType && candidate.entityId === entry.entityId
				)
			)
				records.push(entry);
		}

		for (const entry of records) {
			const remaining = await db.syncLog
				.where('entityId')
				.equals(entry.entityId)
				.filter((candidate) => candidate.entityType === entry.entityType && candidate.synced === 0)
				.count();
			if (remaining === 0) {
				await this.getTable(entry.entityType)?.update(entry.entityId, { syncStatus: 'synced' });
			}
		}
	}

	private getTable(entityType: string): SyncableTable | undefined {
		return (db as unknown as Record<string, SyncableTable | undefined>)[entityType];
	}

	requestSyncAcrossTabs() {
		void this.flush();
		if (this.bc) {
			this.bc.postMessage('sync_requested');
		}
	}
}

export const syncStore = new SyncStore();

import { db, type LocalSyncConflict, type SyncLogEntry } from '#lib/local-db/db.ts';
import { pushOperations, pullChanges } from '../../routes/sync/sync.remote';
import { toast } from 'svelte-sonner';
import { settingsStore } from '#lib/state/settings.svelte.ts';
import { toClientRow } from '#lib/seed/adapters.ts';
import { shouldApplyRemoteChange } from '#lib/sync/conflict-resolution.ts';
import { WakeupScheduler } from '#lib/sync/wakeup-scheduler.ts';
import { watchRealtimeSignals } from '#lib/remote/realtime-sync.remote.ts';
import type { Table } from 'dexie';
import { calculateSyncHealth } from '#lib/dashboard/metrics.ts';
import { drainChangeFeed, readFreshQuery, type ChangeBatch } from '#lib/sync/change-feed.ts';
import { registerSyncTrigger } from '#lib/sync/sync-trigger.ts';

type SyncableRecord = Record<string, unknown> & {
	id?: string;
	updatedAt?: unknown;
	syncStatus?: unknown;
	serverVersion?: unknown;
};

type SyncableTable = Table<SyncableRecord, string>;

type DataFreshnessState = 'idle' | 'syncing' | 'current' | 'stale' | 'offline' | 'error';

interface RemoteSyncChange {
	version: number;
	entityType: string;
	entityId: string;
	operation: string;
	payload: unknown;
	clientUpdatedAt: unknown;
}

interface AcceptedVersion {
	localId: number;
	entityType: string;
	entityId: string;
	version: number;
}

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
	conflicts = $state<LocalSyncConflict[]>([]);
	realtimeState = $state<'idle' | 'connecting' | 'live' | 'stale' | 'offline' | 'error'>('idle');
	dataState = $state<DataFreshnessState>('idle');
	lastSyncError = $state<string | null>(null);
	lastRealtimeAt = $state<number | null>(null);
	syncHealth = $derived(
		calculateSyncHealth({
			online: this.online,
			realtimeState: this.realtimeState,
			dataState: this.dataState,
			pendingCount: this.pendingCount,
			conflictCount: this.conflicts.length,
			hasSynced: this.lastSyncedAt !== null
		})
	);

	private phcId: string | null = null;
	private cursor = 0;
	private cursorReady: Promise<void> = Promise.resolve();
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
			registerSyncTrigger(() => this.requestSyncAcrossTabs());
			window.addEventListener('online', () => {
				this.online = true;
				this.realtimeState = this.liveResource ? 'connecting' : 'idle';
				this.dataState = 'stale';
				void this.liveResource?.reconnect();
				void this.flush();
			});
			window.addEventListener('offline', () => {
				this.online = false;
				this.realtimeState = 'offline';
				this.dataState = 'offline';
			});
			window.addEventListener('focus', () => void this.flush());
			document.addEventListener('visibilitychange', () => {
				if (document.visibilityState === 'visible') void this.flush();
			});
			void this.refreshPendingCount();
			void this.refreshConflicts();

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
					this.scheduleRealtimeSync();
				}
			};
		}
	}

	setPhcId(phcId: string) {
		if (this.phcId === phcId) return;
		this.phcId = phcId;
		this.cursor = 0;
		this.cursorReady = this.loadCursor(phcId);
	}

	connect(phcId: string): void {
		if (this.liveResource && this.phcId === phcId) return;
		this.disconnect(false);
		this.setPhcId(phcId);
		this.realtimeState = this.online ? 'connecting' : 'offline';
		this.dataState = this.online ? 'stale' : 'offline';

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
		this.dataState = clearPhc ? 'idle' : this.dataState;
		if (clearPhc) this.phcId = null;
	}

	private cursorKey(phcId: string): string {
		return `sync_cursor_v3:${phcId}`;
	}

	private async loadCursor(phcId: string): Promise<void> {
		const saved = await db.syncMetadata.get(this.cursorKey(phcId));
		if (this.phcId !== phcId) return;
		this.cursor = saved?.cursor ?? 0;
		// The old timestamp cursor is intentionally not reused. Version zero replays
		// the durable feed without deleting pending local changes.
		localStorage.removeItem(`clinicflow_sync_cursor:${phcId}`);
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

	async refreshConflicts() {
		this.conflicts = await db.syncConflicts
			.filter((conflict) => conflict.resolvedAt === null)
			.toArray();
	}

	async flush(): Promise<void> {
		if (!this.online || !this.phcId) {
			if (!this.online) this.dataState = 'offline';
			return;
		}
		if (this.isSyncing) {
			this.syncAgain = true;
			return;
		}

		const phcId = this.phcId;
		await this.cursorReady;
		if (this.phcId !== phcId) return;

		this.isSyncing = true;
		this.dataState = 'syncing';
		this.lastSyncError = null;
		try {
			do {
				this.syncAgain = false;
				await this.syncOnce(phcId);
			} while (this.syncAgain && this.online && this.phcId);
			this.dataState = 'current';
			this.lastSyncedAt = Date.now();
		} catch (cause) {
			console.error('Synchronization failed:', cause);
			this.lastSyncError = cause instanceof Error ? cause.message : 'Unknown synchronization error';
			this.dataState = this.online ? 'error' : 'offline';
			if (isAuthError(cause)) {
				toast.error('Session expired. Please log in again to continue syncing.');
				window.location.href = '/login';
			} else {
				toast.error('Sync failed. Cached data may be stale; retrying automatically.');
			}
		} finally {
			this.isSyncing = false;
		}
	}

	private async syncOnce(phcId: string): Promise<void> {
		if (this.cursor === 0) {
			// Upgrade/fresh-client bootstrap: establish authoritative base versions
			// before legacy pending edits are pushed.
			await this.pullAllChanges(phcId, true);
		}

		while (true) {
			const batch = await db.syncLog.where('synced').equals(0).limit(50).toArray();
			if (batch.length === 0) break;
			const formattedBatch = batch.map((entry) => {
				if (entry.localId === undefined) throw new Error('Sync operation has no local id');
				return {
					localId: entry.localId,
					operationId: entry.operationId,
					entityType: entry.entityType,
					entityId: entry.entityId,
					operation: entry.operation,
					payload: entry.payload,
					timestamp: entry.timestamp,
					baseVersion: entry.baseVersion,
					deviceId: this.deviceId,
					phcId
				};
			});

			const { accepted, acceptedVersions, conflicts } = await pushOperations(formattedBatch);
			if (accepted.length > 0) {
				await db.syncLog.bulkUpdate(
					accepted.map((localId) => ({ key: localId, changes: { synced: 1 } }))
				);
				await this.markAcceptedRecordsSynced(batch, accepted, acceptedVersions);
			}

			for (const conflict of conflicts) {
				if (!conflict || typeof conflict !== 'object' || !('localId' in conflict)) continue;
				const localId = Number(conflict.localId);
				const reason = 'reason' in conflict ? String(conflict.reason) : 'Server rejection';
				const logEntry = batch.find((entry) => entry.localId === localId);
				if (!logEntry) continue;

				await this.handleConflict(logEntry, reason, conflict);
			}
			if (accepted.length + conflicts.length === 0) {
				throw new Error('Server did not resolve the pending sync batch');
			}
		}
		await this.refreshPendingCount();

		await this.pullAllChanges(phcId, false);
	}

	private async pullAllChanges(phcId: string, rebasePending: boolean): Promise<void> {
		this.cursor = await drainChangeFeed<RemoteSyncChange>({
			initialCursor: this.cursor,
			pull: async (since) => {
				const resource = pullChanges({ phcId, since });
				return (await readFreshQuery(resource)) as ChangeBatch<RemoteSyncChange>;
			},
			applyBatch: async (batch) => {
				await this.applyRemoteBatch(phcId, batch.changes, batch.newCursor, rebasePending);
			}
		});
	}

	private async applyRemoteBatch(
		phcId: string,
		changes: RemoteSyncChange[],
		newCursor: number,
		rebasePending: boolean
	): Promise<void> {
		const domainTables = changes
			.map((change) => this.getTable(change.entityType))
			.filter((table): table is SyncableTable => table !== undefined);
		const transactionTables = [db.syncMetadata, db.syncLog, ...new Set(domainTables)];

		await db.transaction('rw', transactionTables, async () => {
			for (const change of changes) await this.applyRemoteChange(change, rebasePending);
			await db.syncMetadata.put({
				key: this.cursorKey(phcId),
				cursor: newCursor,
				updatedAt: Date.now()
			});
		});
	}

	private async applyRemoteChange(change: RemoteSyncChange, rebasePending: boolean): Promise<void> {
		const table = this.getTable(change.entityType);
		if (!table) return;
		const localRecord = await table.get(change.entityId);
		if (rebasePending) {
			const pending = await db.syncLog
				.where('entityId')
				.equals(change.entityId)
				.filter((entry) => entry.entityType === change.entityType && entry.synced === 0)
				.count();
			if (pending > 0) {
				await db.syncLog
					.where('entityId')
					.equals(change.entityId)
					.filter((entry) => entry.entityType === change.entityType && entry.synced === 0)
					.modify({ baseVersion: change.version });
				if (localRecord) await table.update(change.entityId, { serverVersion: change.version });
				return;
			}
		}
		if (!shouldApplyRemoteChange(localRecord, change.version, change.clientUpdatedAt)) return;

		if (change.operation === 'delete') {
			await table.delete(change.entityId);
			return;
		}

		if (change.operation === 'delta') {
			if (!localRecord || !change.payload || typeof change.payload !== 'object') {
				throw new Error(`Cannot apply delta for missing ${change.entityType}:${change.entityId}`);
			}
			const delta = Number('delta' in change.payload ? change.payload.delta : 0);
			const currentStock = Number(localRecord.currentStock);
			const authoritativeStock = Number(
				'currentStock' in change.payload ? change.payload.currentStock : Number.NaN
			);
			if (!Number.isFinite(delta) || !Number.isFinite(currentStock)) {
				throw new Error(`Invalid inventory delta for ${change.entityId}`);
			}
			await table.update(change.entityId, {
				currentStock: Number.isFinite(authoritativeStock)
					? authoritativeStock
					: currentStock + delta,
				updatedAt: toTimestamp(change.clientUpdatedAt),
				syncStatus: 'synced',
				serverVersion: change.version
			});
			return;
		}

		if (change.operation !== 'create' && change.operation !== 'update') {
			throw new Error(`Unsupported sync operation: ${change.operation}`);
		}
		if (!change.payload || typeof change.payload !== 'object') {
			throw new Error(`Invalid payload for ${change.entityType}:${change.entityId}`);
		}

		const payload = toClientRow(
			change.entityType,
			change.payload as Record<string, unknown>
		) as SyncableRecord;
		payload.syncStatus = 'synced';
		payload.serverVersion = change.version;
		if (change.operation === 'create') {
			await table.put({ ...payload, id: change.entityId });
		} else {
			// Update sync entries are partial patches. Merge them into the cached
			// record rather than replacing the row and dropping required fields.
			const updated = await table.update(change.entityId, payload);
			if (updated === 0) {
				throw new Error(`Cannot apply update for missing ${change.entityType}:${change.entityId}`);
			}
		}
	}

	private async handleConflict(
		logEntry: SyncLogEntry,
		reason: string,
		conflict: object
	): Promise<void> {
		console.warn('Sync conflict:', conflict);
		const serverVersion =
			'serverVersion' in conflict && Number.isSafeInteger(Number(conflict.serverVersion))
				? Number(conflict.serverVersion)
				: 0;
		const serverRecord = 'serverRecord' in conflict ? conflict.serverRecord : null;
		const previous = await db.syncConflicts
			.where('operationId')
			.equals(logEntry.operationId)
			.first();

		if (!previous) {
			await db.syncConflicts.add({
				id: crypto.randomUUID(),
				operationId: logEntry.operationId,
				entityType: logEntry.entityType,
				entityId: logEntry.entityId,
				operation: logEntry.operation,
				reason,
				localPayload: logEntry.payload,
				serverRecord,
				serverVersion,
				createdAt: Date.now(),
				resolvedAt: null
			});
		}

		const table = this.getTable(logEntry.entityType);
		if (table) {
			if (serverRecord && typeof serverRecord === 'object') {
				const authoritative = toClientRow(
					logEntry.entityType,
					serverRecord as Record<string, unknown>
				) as SyncableRecord;
				await table.put({
					...authoritative,
					id: logEntry.entityId,
					syncStatus: 'synced',
					serverVersion
				});
			} else {
				await table.delete(logEntry.entityId);
			}
		}
		if (logEntry.localId !== undefined) await db.syncLog.update(logEntry.localId, { synced: 1 });
		if (serverVersion > 0) {
			await db.syncLog
				.where('entityId')
				.equals(logEntry.entityId)
				.filter(
					(candidate) => candidate.entityType === logEntry.entityType && candidate.synced === 0
				)
				.modify({ baseVersion: serverVersion });
		}
		await this.refreshConflicts();
		toast.warning(
			`${logEntry.entityType} edit conflicted (${reason}). The local edit is preserved for review.`
		);
	}

	async acceptServerVersion(conflictId: string): Promise<void> {
		await db.syncConflicts.update(conflictId, { resolvedAt: Date.now() });
		await this.refreshConflicts();
	}

	async retryLocalVersion(conflictId: string): Promise<void> {
		const conflict = await db.syncConflicts.get(conflictId);
		if (!conflict || conflict.resolvedAt !== null) return;
		const table = this.getTable(conflict.entityType);
		if (!table) throw new Error(`Unknown conflict entity: ${conflict.entityType}`);
		const timestamp = Date.now();
		const operationId = crypto.randomUUID();
		const queuedPayload =
			conflict.localPayload && typeof conflict.localPayload === 'object'
				? {
						...(conflict.localPayload as Record<string, unknown>),
						updatedAt: timestamp,
						syncStatus: 'pending',
						serverVersion: conflict.serverVersion
					}
				: conflict.localPayload;

		await db.transaction('rw', table, db.syncLog, db.syncConflicts, async () => {
			if (conflict.operation === 'delete') {
				await table.delete(conflict.entityId);
			} else if (queuedPayload && typeof queuedPayload === 'object') {
				if (conflict.operation === 'create') {
					await table.put({ ...queuedPayload, id: conflict.entityId });
				} else {
					const updated = await table.update(conflict.entityId, queuedPayload);
					if (updated === 0) await table.put({ ...queuedPayload, id: conflict.entityId });
				}
			}

			await db.syncLog.add({
				operationId,
				entityType: conflict.entityType,
				entityId: conflict.entityId,
				operation: conflict.operation,
				payload: queuedPayload,
				timestamp,
				baseVersion: conflict.serverVersion,
				synced: 0
			});
			await db.syncConflicts.update(conflictId, { resolvedAt: timestamp });
		});

		await this.refreshConflicts();
		this.requestSyncAcrossTabs();
	}

	async reconcileFromBeginning(): Promise<void> {
		if (!this.phcId) return;
		await this.cursorReady;
		await db.syncMetadata.delete(this.cursorKey(this.phcId));
		this.cursor = 0;
		this.dataState = this.online ? 'stale' : 'offline';
		await this.flush();
	}

	private async markAcceptedRecordsSynced(
		batch: SyncLogEntry[],
		accepted: number[],
		versions: AcceptedVersion[]
	): Promise<void> {
		const acceptedIds = new Set(accepted);
		const versionByLocalId = new Map(versions.map((item) => [item.localId, item.version]));
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
			const version = Math.max(
				0,
				...batch
					.filter(
						(candidate) =>
							candidate.localId !== undefined &&
							acceptedIds.has(candidate.localId) &&
							candidate.entityType === entry.entityType &&
							candidate.entityId === entry.entityId
					)
					.map((candidate) => versionByLocalId.get(candidate.localId ?? -1) ?? 0)
			);
			if (version > 0) {
				for (const candidate of batch) {
					if (candidate.entityType === entry.entityType && candidate.entityId === entry.entityId) {
						candidate.baseVersion = Math.max(candidate.baseVersion, version);
					}
				}
				await db.syncLog
					.where('entityId')
					.equals(entry.entityId)
					.filter(
						(candidate) => candidate.entityType === entry.entityType && candidate.synced === 0
					)
					.modify({ baseVersion: version });
			}
			const remaining = await db.syncLog
				.where('entityId')
				.equals(entry.entityId)
				.filter((candidate) => candidate.entityType === entry.entityType && candidate.synced === 0)
				.count();
			await this.getTable(entry.entityType)?.update(entry.entityId, {
				syncStatus: remaining === 0 ? 'synced' : 'pending',
				...(version > 0 ? { serverVersion: version } : {})
			});
		}
	}

	private getTable(entityType: string): SyncableTable | undefined {
		return (db as unknown as Record<string, SyncableTable | undefined>)[entityType];
	}

	requestSyncAcrossTabs() {
		this.scheduleRealtimeSync();
		if (this.bc) {
			this.bc.postMessage('sync_requested');
		}
	}
}

export const syncStore = new SyncStore();

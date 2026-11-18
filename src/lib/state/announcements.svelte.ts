import { liveQuery } from 'dexie';
import { toast } from 'svelte-sonner';
import {
	acknowledgeAnnouncement,
	getMyAnnouncements,
	markAnnouncementRead,
	watchAnnouncements
} from '#lib/remote/announcements.remote.ts';
import {
	db,
	type LocalAnnouncement,
	type LocalAnnouncementReceiptOperation
} from '#lib/local-db/db.ts';
import type { AnnouncementConnectionState, AnnouncementView } from '#lib/types/announcements.ts';

type LiveResource = ReturnType<typeof watchAnnouncements>;
type CacheSubscription = { unsubscribe(): void };

class AnnouncementStore {
	items = $state<LocalAnnouncement[]>([]);
	connectionState = $state<AnnouncementConnectionState>('idle');
	lastUpdatedAt = $state<number | null>(null);

	unreadCount = $derived(this.items.filter((item) => item.readAt === null).length);
	criticalAnnouncements = $derived(
		this.items.filter(
			(item) =>
				item.severity === 'critical' && item.requiresAcknowledgement && item.acknowledgedAt === null
		)
	);

	#userId: string | null = null;
	#generation = 0;
	#liveResource: LiveResource | null = null;
	#liveIterator: AsyncIterator<AnnouncementView[]> | null = null;
	#cacheSubscription: CacheSubscription | null = null;
	#disposeConnectionEffect: (() => void) | null = null;
	#networkSnapshotApplied = false;
	#flushingReceipts = false;

	async connect(userId: string): Promise<void> {
		if (this.#userId === userId && this.#liveResource) return;
		this.disconnect();

		this.#userId = userId;
		this.#networkSnapshotApplied = false;
		const generation = ++this.#generation;
		this.connectionState = navigator.onLine ? 'connecting' : 'offline';
		this.#subscribeToCache(userId);

		window.addEventListener('online', this.#handleOnline);
		window.addEventListener('offline', this.#handleOffline);

		if (navigator.onLine) {
			try {
				await this.refresh();
				await this.flushReceiptQueue();
			} catch {
				this.connectionState = 'stale';
			}
		}

		if (generation !== this.#generation) return;
		this.#startLiveStream(generation);
	}

	disconnect(): void {
		this.#generation += 1;
		window.removeEventListener('online', this.#handleOnline);
		window.removeEventListener('offline', this.#handleOffline);
		this.#cacheSubscription?.unsubscribe();
		this.#cacheSubscription = null;
		this.#disposeConnectionEffect?.();
		this.#disposeConnectionEffect = null;
		void this.#liveIterator?.return?.();
		this.#liveIterator = null;
		this.#liveResource = null;
		this.#userId = null;
		this.items = [];
		this.connectionState = 'idle';
		this.lastUpdatedAt = null;
	}

	async refresh(): Promise<void> {
		if (!this.#userId || !navigator.onLine) return;
		const snapshot = await getMyAnnouncements();
		await this.#applySnapshot(snapshot);
	}

	async markRead(announcementId: string): Promise<void> {
		const item = this.items.find((announcement) => announcement.announcementId === announcementId);
		if (!item || item.readAt !== null) return;

		const readAt = Date.now();
		await db.announcements.update(item.cacheId, { readAt });
		await this.#sendOrQueueReceipt(announcementId, 'read');
	}

	async acknowledge(announcementId: string): Promise<void> {
		const item = this.items.find((announcement) => announcement.announcementId === announcementId);
		if (!item || item.acknowledgedAt !== null) return;

		const acknowledgedAt = Date.now();
		await db.announcements.update(item.cacheId, {
			readAt: item.readAt ?? acknowledgedAt,
			acknowledgedAt
		});
		await this.#sendOrQueueReceipt(announcementId, 'acknowledge');
	}

	async markAllRead(): Promise<void> {
		for (const item of this.items.filter((announcement) => announcement.readAt === null)) {
			await this.markRead(item.announcementId);
		}
	}

	async open(item: LocalAnnouncement): Promise<void> {
		await this.markRead(item.announcementId);
		if (item.actionUrl) window.location.href = item.actionUrl;
	}

	async flushReceiptQueue(): Promise<void> {
		if (!this.#userId || !navigator.onLine || this.#flushingReceipts) return;
		this.#flushingReceipts = true;

		try {
			const queued = await db.announcementReceiptQueue
				.where('userId')
				.equals(this.#userId)
				.sortBy('createdAt');

			for (const operation of queued) {
				try {
					if (operation.operation === 'acknowledge') {
						await acknowledgeAnnouncement(operation.announcementId);
					} else {
						await markAnnouncementRead(operation.announcementId);
					}
					if (operation.localId !== undefined) {
						await db.announcementReceiptQueue.delete(operation.localId);
					}
				} catch {
					break;
				}
			}
		} finally {
			this.#flushingReceipts = false;
		}
	}

	#subscribeToCache(userId: string): void {
		this.#cacheSubscription = liveQuery(() =>
			db.announcements.where('userId').equals(userId).sortBy('createdAt')
		).subscribe({
			next: (rows) => {
				this.items = rows.reverse();
			},
			error: () => {
				this.connectionState = 'error';
			}
		});
	}

	#startLiveStream(generation: number): void {
		const resource = watchAnnouncements();
		this.#liveResource = resource;
		this.#disposeConnectionEffect = $effect.root(() => {
			$effect(() => {
				if (generation !== this.#generation) return;
				if (!navigator.onLine) this.connectionState = 'offline';
				else this.connectionState = resource.connected ? 'live' : 'connecting';
			});
		});

		const iterator = resource[Symbol.asyncIterator]();
		this.#liveIterator = iterator;
		void this.#consumeLiveStream(iterator, generation);
	}

	async #consumeLiveStream(
		iterator: AsyncIterator<AnnouncementView[]>,
		generation: number
	): Promise<void> {
		try {
			while (generation === this.#generation) {
				const result = await iterator.next();
				if (result.done || generation !== this.#generation) break;
				await this.#applySnapshot(result.value);
			}
		} catch (error) {
			if (generation === this.#generation) {
				console.error('Announcement live stream failed:', error);
				this.connectionState = navigator.onLine ? 'error' : 'offline';
			}
		}
	}

	async #applySnapshot(snapshot: AnnouncementView[]): Promise<void> {
		const userId = this.#userId;
		if (!userId) return;

		const cached = await db.announcements.where('userId').equals(userId).toArray();
		const cachedById = new Map(cached.map((item) => [item.announcementId, item]));
		const firstNetworkSnapshot = !this.#networkSnapshotApplied;
		const now = Date.now();
		const nextRows: LocalAnnouncement[] = snapshot.map((item) => {
			const previous = cachedById.get(item.id);
			return {
				cacheId: `${userId}:${item.id}`,
				userId,
				announcementId: item.id,
				title: item.title,
				body: item.body,
				severity: item.severity,
				audience: item.audience,
				targetPhcId: item.targetPhcId,
				status: item.status,
				requiresAcknowledgement: item.requiresAcknowledgement,
				actionLabel: item.actionLabel,
				actionUrl: item.actionUrl,
				scheduledFor: item.scheduledFor,
				publishedAt: item.publishedAt,
				expiresAt: item.expiresAt,
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
				readAt: item.readAt ?? previous?.readAt ?? null,
				acknowledgedAt: item.acknowledgedAt ?? previous?.acknowledgedAt ?? null,
				notifiedAt: previous?.notifiedAt ?? (firstNetworkSnapshot ? now : null)
			};
		});

		const nextIds = new Set(nextRows.map((item) => item.announcementId));
		const staleKeys = cached
			.filter((item) => !nextIds.has(item.announcementId))
			.map((item) => item.cacheId);

		await db.transaction('rw', db.announcements, async () => {
			if (nextRows.length > 0) await db.announcements.bulkPut(nextRows);
			if (staleKeys.length > 0) await db.announcements.bulkDelete(staleKeys);
		});

		if (!firstNetworkSnapshot) {
			for (const item of nextRows.filter((row) => row.notifiedAt === null)) {
				this.#notify(item);
				await db.announcements.update(item.cacheId, { notifiedAt: now });
			}
		}

		this.#networkSnapshotApplied = true;
		this.lastUpdatedAt = now;
	}

	#notify(item: LocalAnnouncement): void {
		toast(item.title, {
			description: item.body,
			duration: item.severity === 'critical' ? 15_000 : 8_000,
			action: item.actionUrl
				? {
						label: item.actionLabel || 'View',
						onClick: () => {
							void this.open(item);
						}
					}
				: undefined
		});

		if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
			const notification = new Notification(item.title, {
				body: item.body,
				icon: '/favicon.png'
			});
			notification.onclick = () => {
				window.focus();
				void this.open(item);
			};
		}
	}

	async #sendOrQueueReceipt(
		announcementId: string,
		operation: LocalAnnouncementReceiptOperation['operation']
	): Promise<void> {
		if (!this.#userId) return;

		if (navigator.onLine) {
			try {
				if (operation === 'acknowledge') await acknowledgeAnnouncement(announcementId);
				else await markAnnouncementRead(announcementId);
				return;
			} catch {
				// Persist below and retry on reconnect.
			}
		}

		const existing = await db.announcementReceiptQueue
			.where('[userId+announcementId]')
			.equals([this.#userId, announcementId])
			.toArray();

		if (operation === 'read' && existing.some((item) => item.operation === 'acknowledge')) return;
		for (const item of existing) {
			if (item.localId !== undefined) await db.announcementReceiptQueue.delete(item.localId);
		}

		await db.announcementReceiptQueue.add({
			userId: this.#userId,
			announcementId,
			operation,
			createdAt: Date.now()
		});
	}

	#handleOnline = () => {
		this.connectionState = 'connecting';
		void this.#liveResource?.reconnect();
		void this.refresh();
		void this.flushReceiptQueue();
	};

	#handleOffline = () => {
		this.connectionState = 'offline';
	};
}

export const announcementStore = new AnnouncementStore();

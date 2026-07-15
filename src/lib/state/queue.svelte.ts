import { db, type LocalQueueTicket } from '$lib/local-db/db';
import { LocalCollection } from './local-collection.svelte';
import { syncStore } from './sync.svelte';

class QueueStore extends LocalCollection<LocalQueueTicket> {
	constructor() {
		super(db.queueTickets, 'queueTickets', () =>
			db.queueTickets.where('status').anyOf(['waiting', 'called', 'in_progress']).toArray()
		);
	}

	sortedQueue = $derived(
		[...this.items].sort((a, b) => {
			const priority = { red: 0, amber: 1, green: 2, unassigned: 3 };
			if (priority[a.triageLevel] !== priority[b.triageLevel]) {
				return priority[a.triageLevel] - priority[b.triageLevel];
			}
			return a.createdAt - b.createdAt;
		})
	);

	nextTicket = $derived(this.sortedQueue[0] ?? null);

	async callNext(): Promise<void> {
		const next = this.nextTicket;
		if (!next) return;
		await this.update(next.id, {
			status: 'called',
			calledAt: Date.now()
		} as Partial<LocalQueueTicket>);
		syncStore.requestSyncAcrossTabs();
	}

	async applyTriageFlag(
		ticketId: string,
		level: 'green' | 'amber' | 'red',
		reason: string
	): Promise<void> {
		const current = this.get(ticketId);
		// urgency-override: never downgrade a red flag via a later lower-priority write
		if (current?.triageLevel === 'red' && level !== 'red') return;
		await this.update(ticketId, {
			triageLevel: level,
			triageReason: reason
		} as Partial<LocalQueueTicket>);
		syncStore.requestSyncAcrossTabs();
	}

	async markDone(ticketId: string): Promise<void> {
		await this.update(ticketId, {
			status: 'done',
			completedAt: Date.now()
		} as Partial<LocalQueueTicket>);
		syncStore.requestSyncAcrossTabs();
	}

	async markNoShow(ticketId: string): Promise<void> {
		await this.update(ticketId, {
			status: 'no_show',
			completedAt: Date.now()
		} as Partial<LocalQueueTicket>);
		syncStore.requestSyncAcrossTabs();
	}
}

export const queueStore = new QueueStore();

import { db, type LocalLabRequest } from '$lib/local-db/db';
import { LocalCollection } from './local-collection.svelte';

class LabRequestStore extends LocalCollection<LocalLabRequest> {
	constructor() {
		super(db.labRequests, 'labRequests', () => db.labRequests.toArray());
	}

	get pendingRequests() {
		return this.sortedItems.filter((r) => r.status === 'pending');
	}

	get processingRequests() {
		return this.sortedItems.filter((r) => r.status === 'processing');
	}

	get completedRequests() {
		return this.sortedItems.filter((r) => r.status === 'completed');
	}

	get sortedItems() {
		return [...this.items].sort((a, b) => {
			// Sort by urgency first (stat -> urgent -> routine)
			const urgencyPriority = { stat: 0, urgent: 1, routine: 2 };
			if (urgencyPriority[a.urgency] !== urgencyPriority[b.urgency]) {
				return urgencyPriority[a.urgency] - urgencyPriority[b.urgency];
			}
			// Then sort by requested time (oldest first for FIFO)
			return a.createdAt - b.createdAt;
		});
	}
}

export const labRequestStore = new LabRequestStore();

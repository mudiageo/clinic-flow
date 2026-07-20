import { db, type LocalRestockRequest } from '$lib/local-db/db';
import { LocalCollection } from './local-collection.svelte';

class RestockStore extends LocalCollection<LocalRestockRequest> {
	constructor() {
		super(db.restockRequests, 'restockRequests', () => db.restockRequests.toArray());
	}

	get pending() {
		return this.items.filter((r) => r.status === 'pending');
	}

	forInventoryItem(itemId: string) {
		return this.items.filter((r) => r.inventoryItemId === itemId);
	}
}

export const restockStore = new RestockStore();

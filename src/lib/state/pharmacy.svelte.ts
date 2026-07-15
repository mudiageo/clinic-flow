import { db, type LocalPharmacyInventory } from '$lib/local-db/db';
import { LocalCollection } from './local-collection.svelte';

class PharmacyStore extends LocalCollection<LocalPharmacyInventory> {
	constructor() {
		super(db.pharmacyInventory, 'pharmacyInventory', () => db.pharmacyInventory.toArray());
	}

	get lowStock(): LocalPharmacyInventory[] {
		return this.items.filter((item) => item.currentStock <= item.lowStockThreshold);
	}

	async deltaDecrement(id: string, qty: number): Promise<void> {
		const item = this.get(id);
		if (!item) return;

		const newStock = Math.max(0, item.currentStock - qty);
		await this.update(id, { currentStock: newStock });

		// Delta-tag the operation in the sync log specifically
		// Look up the last sync log entry and update its operation to 'delta' if it is ours
		const lastEntry = await db.syncLog.where('entityId').equals(id).last();

		if (lastEntry && lastEntry.operation === 'update') {
			await db.syncLog.update(lastEntry.localId!, {
				operation: 'delta',
				payload: { id, quantity: qty } // Specify the delta decrement quantity
			});
		}
	}
}

export const pharmacyStore = new PharmacyStore();

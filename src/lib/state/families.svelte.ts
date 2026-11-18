import { db, type LocalFamily } from '#lib/local-db/db.ts';
import { LocalCollection } from './local-collection.svelte';

class FamilyStore extends LocalCollection<LocalFamily> {
	constructor() {
		super(db.families, 'families', () => db.families.toArray());
	}

	forPhc(phcId: string): LocalFamily[] {
		return this.items
			.filter((family) => family.phcId === phcId)
			.sort((a, b) =>
				(a.householdName ?? 'Unnamed household').localeCompare(
					b.householdName ?? 'Unnamed household'
				)
			);
	}
}

export const familyStore = new FamilyStore();

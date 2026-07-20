import { db, type LocalEncounter } from '$lib/local-db/db';
import { LocalCollection } from './local-collection.svelte';

class EncounterStore extends LocalCollection<LocalEncounter> {
	constructor() {
		super(db.encounters, 'encounters', () => db.encounters.toArray());
	}

	get sortedItems() {
		return [...this.items].sort((a, b) => b.visitDate - a.visitDate);
	}
}

export const encounterStore = new EncounterStore();

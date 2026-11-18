import { db, type LocalOutreachRecord } from '#lib/local-db/db.ts';
import type { OutreachActivityType } from '#lib/outreach/types.ts';
import { LocalCollection } from './local-collection.svelte';
import { sessionStore } from './session.svelte.ts';

interface NewOutreachRecord {
	activityType: OutreachActivityType;
	community: string;
	occurredAt: number;
	householdsVisited: number;
	peopleReached: number;
	immunizationsGiven: number;
	bednetsDistributed: number;
	notes: string | null;
}

class OutreachStore extends LocalCollection<LocalOutreachRecord> {
	constructor() {
		super(db.outreachRecords, 'outreachRecords', () => db.outreachRecords.toArray());
	}

	forPhc(phcId: string): LocalOutreachRecord[] {
		return this.items
			.filter((record) => record.phcId === phcId)
			.sort((a, b) => b.occurredAt - a.occurredAt);
	}

	async log(data: NewOutreachRecord): Promise<string> {
		const phcId = sessionStore.activePhcId;
		const recordedByStaffId = sessionStore.staffId;
		if (!phcId || !recordedByStaffId) throw new Error('A PHC staff session is required');

		return await this.create({
			...data,
			phcId,
			recordedByStaffId,
			createdAt: Date.now()
		});
	}
}

export const outreachStore = new OutreachStore();

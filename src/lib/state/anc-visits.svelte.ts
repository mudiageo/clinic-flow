import { LocalCollection } from './local-collection.svelte';
import { db, type LocalAncVisit } from '#lib/local-db/db.ts';
import { validateAncVisitInput, type AncVisitInput } from '#lib/clinical/anc-visits.ts';
import { sessionStore } from './session.svelte.ts';

export type { AncVisitInput } from '#lib/clinical/anc-visits.ts';

class AncVisitsStore extends LocalCollection<LocalAncVisit> {
	constructor() {
		super(db.ancVisits, 'ancVisits', () => db.ancVisits.toArray());
	}

	async logVisit(input: AncVisitInput): Promise<string> {
		const visit = validateAncVisitInput(input);
		const phcId = sessionStore.activePhcId;
		const recordedByStaffId = sessionStore.staffId;
		if (!recordedByStaffId) {
			throw new Error('Cannot log ANC visit: no staff member is signed in.');
		}

		return this.create({
			phcId,
			patientId: visit.patientId,
			pregnancyRecordId: visit.pregnancyRecordId,
			visitNumber: visit.visitNumber,
			visitDate: visit.visitDate,
			systolicBp: visit.systolicBp,
			diastolicBp: visit.diastolicBp,
			weightKg: visit.weightKg,
			fetalHeartRateBpm: visit.fetalHeartRateBpm,
			fundalHeightCm: visit.fundalHeightCm,
			notes: visit.notes,
			recordedByStaffId,
			createdAt: Date.now(),
			serverUpdatedAt: null
		});
	}

	forPregnancy(pregnancyRecordId: string): LocalAncVisit[] {
		return this.items
			.filter((visit) => visit.pregnancyRecordId === pregnancyRecordId)
			.sort((a, b) => b.visitDate - a.visitDate);
	}

	latestForPregnancy(pregnancyRecordId: string): LocalAncVisit | undefined {
		return this.forPregnancy(pregnancyRecordId)[0];
	}
}

export const ancVisitsStore = new AncVisitsStore();

import { LocalCollection } from './local-collection.svelte';
import { db, type LocalPregnancyRecord } from '$lib/local-db/db';

class PregnancyStore extends LocalCollection<LocalPregnancyRecord> {
	constructor() {
		super(db.pregnancyRecords, 'pregnancyRecords');
	}

	async createRecord(patientId: string, lmpDate: number | null, eddDate: number | null, gravida: number | null, parity: number | null) {
		const id = crypto.randomUUID();
		const phcId = typeof localStorage !== 'undefined' ? localStorage.getItem('phcId') || 'demo-phc-1' : 'demo-phc-1';
		
		const record: LocalPregnancyRecord = {
			id,
			patientId,
			phcId,
			lmpDate,
			eddDate,
			status: 'active',
			gravida,
			parity,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			syncStatus: 'pending'
		};

		await this.insert(record);
		return id;
	}

	async updateRecordStatus(id: string, status: 'active' | 'delivered' | 'miscarriage' | 'transferred') {
		await this.update(id, { status, updatedAt: Date.now() });
	}

	getActiveRecordForPatient(patientId: string) {
		return this.items.find(r => r.patientId === patientId && r.status === 'active');
	}
	
	getAllRecordsForPatient(patientId: string) {
		return this.items.filter(r => r.patientId === patientId).sort((a, b) => b.createdAt - a.createdAt);
	}
}

export const pregnancyStore = new PregnancyStore();

import { db, type LocalPatient } from '#lib/local-db/db.ts';
import { nextClinicId } from '#lib/sync/id-allocation.ts';
import { LocalCollection } from './local-collection.svelte';

class PatientStore extends LocalCollection<LocalPatient> {
	constructor() {
		super(db.patients, 'patients', () =>
			db.patients.filter((patient) => patient.deleted === false).toArray()
		);
	}

	get sortedItems(): LocalPatient[] {
		return [...this.items].sort((a, b) => a.name.localeCompare(b.name));
	}

	search(term: string): LocalPatient[] {
		const t = term.trim().toLowerCase();
		if (!t) return [];
		return this.items.filter(
			(p) =>
				p.name.toLowerCase().includes(t) ||
				p.phone?.includes(t) ||
				p.clinicId.toLowerCase().includes(t)
		);
	}

	findByClinicId(clinicId: string): LocalPatient | undefined {
		return this.items.find((p) => p.clinicId.toLowerCase() === clinicId.toLowerCase());
	}

	/** Allocate a unique, deterministic clinic ID for a new patient. */
	allocateClinicId(prefix: string): string {
		return nextClinicId(
			prefix,
			this.items.map((patient) => patient.clinicId)
		);
	}

	familyMembers(familyId: string): LocalPatient[] {
		return this.items.filter((p) => p.familyId === familyId);
	}
}

export const patientStore = new PatientStore();

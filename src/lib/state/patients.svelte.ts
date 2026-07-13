import { db, type LocalPatient } from '$lib/local-db/db';
import { LocalCollection } from './local-collection.svelte';

class PatientStore extends LocalCollection<LocalPatient> {
  constructor() {
    super(db.patients, 'patients', () => db.patients.where('deleted').equals(0).toArray());
  }

  search(term: string): LocalPatient[] {
    const t = term.trim().toLowerCase();
    if (!t) return [];
    return this.items.filter(
      (p) => p.name.toLowerCase().includes(t) || p.phone?.includes(t) || p.clinicId.toLowerCase().includes(t)
    );
  }

  findByClinicId(clinicId: string): LocalPatient | undefined {
    return this.items.find((p) => p.clinicId.toLowerCase() === clinicId.toLowerCase());
  }

  familyMembers(familyId: string): LocalPatient[] {
    return this.items.filter((p) => p.familyId === familyId);
  }
}

export const patientStore = new PatientStore();

import { db, type LocalPrescription } from '$lib/local-db/db';
import { LocalCollection } from './local-collection.svelte';

class PrescriptionStore extends LocalCollection<LocalPrescription> {
  constructor() {
    super(db.prescriptions, 'prescriptions', () => db.prescriptions.toArray());
  }

  get pending() {
    return this.items.filter(p => p.status === 'pending');
  }

  forPatient(patientId: string) {
    return this.items.filter(p => p.patientId === patientId);
  }
}

export const prescriptionStore = new PrescriptionStore();

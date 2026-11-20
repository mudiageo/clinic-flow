import { LocalCollection } from './local-collection.svelte';
import { db, type LocalImmunizationRecord } from '#lib/local-db/db.ts';
import { sessionStore } from './session.svelte.ts';

interface ImmunizationRecordInput {
	patientId: string;
	appointmentId?: string | null;
	vaccineName: string;
	doseNumber: number;
	administeredAt: number;
	batchNumber?: string | null;
	expiryDate?: number | null;
	route?: string | null;
	notes?: string | null;
}

interface ImmunizationCorrectionInput {
	vaccineName?: string;
	doseNumber?: number;
	administeredAt?: number;
	batchNumber?: string | null;
	expiryDate?: number | null;
	route?: string | null;
	notes?: string | null;
}

function trimmedOptional(value: string | null | undefined): string | null {
	if (value == null) return null;
	const trimmed = value.trim();
	return trimmed === '' ? null : trimmed;
}

class ImmunizationRecordsStore extends LocalCollection<LocalImmunizationRecord> {
	constructor() {
		super(db.immunizationRecords, 'immunizationRecords', () => db.immunizationRecords.toArray());
	}

	private currentStaffId(): string {
		const staffId = sessionStore.staffId;
		if (!staffId) throw new Error('Cannot record immunization: no staff member is signed in.');
		return staffId;
	}

	async record(input: ImmunizationRecordInput) {
		const phcId = sessionStore.activePhcId;
		const recordedByStaffId = this.currentStaffId();

		return this.create({
			phcId,
			patientId: input.patientId.trim(),
			appointmentId: trimmedOptional(input.appointmentId),
			vaccineName: input.vaccineName.trim(),
			doseNumber: input.doseNumber,
			administeredAt: input.administeredAt,
			batchNumber: trimmedOptional(input.batchNumber),
			expiryDate: input.expiryDate ?? null,
			route: trimmedOptional(input.route),
			recordedByStaffId,
			correctionOf: null,
			notes: trimmedOptional(input.notes),
			createdAt: Date.now(),
			serverUpdatedAt: null
		});
	}

	async correct(originalId: string, input: ImmunizationCorrectionInput) {
		const original = this.get(originalId);
		if (!original) throw new Error(`Cannot correct missing immunization record ${originalId}`);
		const recordedByStaffId = this.currentStaffId();

		// Corrections are additive: the original record is never modified.
		return this.create({
			phcId: original.phcId,
			patientId: original.patientId,
			appointmentId: original.appointmentId,
			vaccineName:
				input.vaccineName !== undefined ? input.vaccineName.trim() : original.vaccineName,
			doseNumber: input.doseNumber ?? original.doseNumber,
			administeredAt: input.administeredAt ?? original.administeredAt,
			batchNumber:
				input.batchNumber !== undefined ? trimmedOptional(input.batchNumber) : original.batchNumber,
			expiryDate: input.expiryDate !== undefined ? input.expiryDate : original.expiryDate,
			route: input.route !== undefined ? trimmedOptional(input.route) : original.route,
			recordedByStaffId,
			correctionOf: originalId,
			notes: input.notes !== undefined ? trimmedOptional(input.notes) : original.notes,
			createdAt: Date.now(),
			serverUpdatedAt: null
		});
	}

	forPatient(patientId: string) {
		return this.items
			.filter((record) => record.patientId === patientId)
			.sort((a, b) => b.administeredAt - a.administeredAt);
	}
}

export const immunizationRecordsStore = new ImmunizationRecordsStore();

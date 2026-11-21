/** Shared client-side validation for staff-entered ANC visit values. */

export interface AncVisitInput {
	patientId: string;
	pregnancyRecordId: string;
	visitNumber?: number | '' | null;
	visitDate: number;
	systolicBp?: number | '' | null;
	diastolicBp?: number | '' | null;
	weightKg?: number | '' | null;
	fetalHeartRateBpm?: number | '' | null;
	fundalHeightCm?: number | '' | null;
	notes?: string | null;
}

export interface NormalizedAncVisitInput {
	patientId: string;
	pregnancyRecordId: string;
	visitNumber: number | null;
	visitDate: number;
	systolicBp: number | null;
	diastolicBp: number | null;
	weightKg: number | null;
	fetalHeartRateBpm: number | null;
	fundalHeightCm: number | null;
	notes: string | null;
}

function requiredString(value: string, label: string, maxLength = 160): string {
	const trimmed = value.trim();
	if (!trimmed) throw new Error(`${label} is required.`);
	if (trimmed.length > maxLength) throw new Error(`${label} is too long.`);
	return trimmed;
}

function optionalNumber(
	value: number | '' | null | undefined,
	label: string,
	min: number,
	max: number
): number | null {
	if (value === null || value === undefined || value === '') return null;
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new Error(`${label} must be a valid number.`);
	}
	if (value < min || value > max) {
		throw new Error(`${label} must be between ${min} and ${max}.`);
	}
	return value;
}

function optionalNotes(value: string | null | undefined): string | null {
	if (value == null) return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (trimmed.length > 500) throw new Error('Notes must be 500 characters or fewer.');
	return trimmed;
}

export function validateAncVisitInput(input: AncVisitInput): NormalizedAncVisitInput {
	const patientId = requiredString(input.patientId, 'Patient');
	const pregnancyRecordId = requiredString(input.pregnancyRecordId, 'Pregnancy record');

	if (!Number.isFinite(input.visitDate) || input.visitDate <= 0) {
		throw new Error('A valid visit date is required.');
	}
	if (input.visitDate > Date.now() + 24 * 60 * 60 * 1000) {
		throw new Error('Visit date cannot be more than one day in the future.');
	}

	let visitNumber: number | null = null;
	if (input.visitNumber !== null && input.visitNumber !== undefined && input.visitNumber !== '') {
		if (!Number.isInteger(input.visitNumber) || input.visitNumber < 1 || input.visitNumber > 8) {
			throw new Error('Visit number must be between 1 and 8.');
		}
		visitNumber = input.visitNumber;
	}

	return {
		patientId,
		pregnancyRecordId,
		visitNumber,
		visitDate: input.visitDate,
		systolicBp: optionalNumber(input.systolicBp, 'Systolic BP', 50, 300),
		diastolicBp: optionalNumber(input.diastolicBp, 'Diastolic BP', 20, 200),
		weightKg: optionalNumber(input.weightKg, 'Weight', 1, 400),
		fetalHeartRateBpm: optionalNumber(input.fetalHeartRateBpm, 'Fetal heart rate', 50, 250),
		fundalHeightCm: optionalNumber(input.fundalHeightCm, 'Fundal height', 5, 60),
		notes: optionalNotes(input.notes)
	};
}

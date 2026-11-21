import { describe, expect, it } from 'vite-plus/test';
import { validateAncVisitInput, type AncVisitInput } from './anc-visits.ts';

const valid: AncVisitInput = {
	patientId: '  patient-1  ',
	pregnancyRecordId: 'pregnancy-1',
	visitNumber: 3,
	visitDate: Date.now() - 60_000,
	systolicBp: 118,
	diastolicBp: 76,
	weightKg: 62.5,
	fetalHeartRateBpm: 142,
	fundalHeightCm: 26,
	notes: '  verified against register  '
};

describe('validateAncVisitInput', () => {
	it('normalizes staff-entered values', () => {
		const result = validateAncVisitInput(valid);
		expect(result.patientId).toBe('patient-1');
		expect(result.visitNumber).toBe(3);
		expect(result.weightKg).toBe(62.5);
		expect(result.notes).toBe('verified against register');
	});

	it('treats blank optional inputs as null', () => {
		const result = validateAncVisitInput({
			patientId: 'patient-1',
			pregnancyRecordId: 'pregnancy-1',
			visitDate: valid.visitDate,
			visitNumber: '',
			systolicBp: '',
			notes: ''
		});
		expect(result.visitNumber).toBeNull();
		expect(result.systolicBp).toBeNull();
		expect(result.notes).toBeNull();
	});

	it('rejects missing identifiers and out-of-range clinical values', () => {
		expect(() => validateAncVisitInput({ ...valid, patientId: '' })).toThrow();
		expect(() => validateAncVisitInput({ ...valid, visitNumber: 9 })).toThrow();
		expect(() => validateAncVisitInput({ ...valid, fetalHeartRateBpm: 400 })).toThrow();
		expect(() =>
			validateAncVisitInput({ ...valid, visitDate: Date.now() + 10 * 86_400_000 })
		).toThrow();
	});
});

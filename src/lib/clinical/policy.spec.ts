import { describe, expect, it } from 'vite-plus/test';
import {
	canWriteClinical,
	clinicalFeatureEnabled,
	clinicalWritePolicy,
	normalizeClinicalPayload
} from './policy.ts';

const flags = {
	immunizationEnabled: true,
	coldChainEnabled: true,
	maternalHealthEnabled: true
};

describe('clinical write policy', () => {
	it('maps each clinical entity to its permission and feature flag', () => {
		expect(clinicalWritePolicy('immunizationRecords')).toEqual({
			permission: 'manage:immunization',
			flag: 'immunizationEnabled'
		});
		expect(clinicalWritePolicy('temperatureLogs')).toEqual({
			permission: 'manage:cold_chain',
			flag: 'coldChainEnabled'
		});
		expect(clinicalWritePolicy('ancVisits')).toEqual({
			permission: 'manage:anc',
			flag: 'maternalHealthEnabled'
		});
		expect(clinicalWritePolicy('patients')).toBeNull();
	});

	it('requires the matching permission, with superadmin override', () => {
		expect(canWriteClinical('immunizationRecords', 'nurse', ['manage:immunization'])).toBe(true);
		expect(canWriteClinical('temperatureLogs', 'pharmacy', ['manage:cold_chain'])).toBe(true);
		expect(canWriteClinical('immunizationRecords', 'nurse', ['manage:cold_chain'])).toBe(false);
		expect(canWriteClinical('temperatureLogs', 'pharmacy', [])).toBe(false);
		expect(canWriteClinical('ancVisits', 'nurse_midwife', ['manage:anc'])).toBe(true);
		expect(canWriteClinical('ancVisits', 'nurse', ['view:anc'])).toBe(false);
		expect(canWriteClinical('temperatureLogs', 'superadmin', [])).toBe(true);
		// Non-clinical entities are unaffected by this gate.
		expect(canWriteClinical('patients', 'receptionist', [])).toBe(true);
	});

	it('fails closed when the PHC flag is disabled or missing', () => {
		expect(clinicalFeatureEnabled('immunizationRecords', flags)).toBe(true);
		expect(clinicalFeatureEnabled('temperatureLogs', flags)).toBe(true);
		expect(clinicalFeatureEnabled('ancVisits', flags)).toBe(true);
		expect(clinicalFeatureEnabled('ancVisits', { ...flags, maternalHealthEnabled: false })).toBe(
			false
		);
		expect(
			clinicalFeatureEnabled('immunizationRecords', { ...flags, immunizationEnabled: false })
		).toBe(false);
		expect(clinicalFeatureEnabled('temperatureLogs', { ...flags, coldChainEnabled: false })).toBe(
			false
		);
		expect(clinicalFeatureEnabled('temperatureLogs', null)).toBe(false);
		expect(clinicalFeatureEnabled('patients', null)).toBe(true);
	});
});

describe('clinical payload normalization', () => {
	const immunization = {
		phcId: 'phc-1',
		patientId: 'patient-1',
		vaccineName: '  BCG  ',
		doseNumber: 1,
		administeredAt: 1_700_000_000_000,
		batchNumber: '  ',
		route: 'IM',
		notes: '  verified  ',
		createdAt: 1_700_000_000_000,
		updatedAt: 1_700_000_000_000,
		syncStatus: 'pending'
	};

	it('normalizes a valid immunization record and preserves audit fields', () => {
		const result = normalizeClinicalPayload('immunizationRecords', immunization);
		expect(result).not.toBeNull();
		expect(result?.vaccineName).toBe('BCG');
		expect(result?.batchNumber).toBeNull();
		expect(result?.notes).toBe('verified');
		expect(result?.administeredAt).toBeInstanceOf(Date);
		// Callers merge normalized fields into the original payload, which retains these.
		expect(immunization.phcId).toBe('phc-1');
		expect(immunization.createdAt).toBe(1_700_000_000_000);
	});

	it('rejects missing, malformed or out-of-range immunization values', () => {
		expect(
			normalizeClinicalPayload('immunizationRecords', { ...immunization, vaccineName: '' })
		).toBeNull();
		expect(
			normalizeClinicalPayload('immunizationRecords', { ...immunization, doseNumber: 9 })
		).toBeNull();
		expect(
			normalizeClinicalPayload('immunizationRecords', {
				...immunization,
				administeredAt: 'not-a-date'
			})
		).toBeNull();
		expect(normalizeClinicalPayload('immunizationRecords', { patientId: 'p' })).toBeNull();
		expect(normalizeClinicalPayload('patients', immunization)).toBeNull();
	});

	it('normalizes a valid temperature log', () => {
		const result = normalizeClinicalPayload('temperatureLogs', {
			fridgeLabel: '  Fridge A ',
			temperatureCelsius: 4.1,
			recordedAt: 1_700_000_000_000,
			notes: ''
		});
		expect(result).not.toBeNull();
		expect(result?.fridgeLabel).toBe('Fridge A');
		expect(result?.temperatureCelsius).toBe(4.1);
		expect(result?.recordedAt).toBeInstanceOf(Date);
		expect(result?.notes).toBeNull();
	});

	it('rejects implausible temperatures and missing required fields', () => {
		expect(
			normalizeClinicalPayload('temperatureLogs', {
				fridgeLabel: 'Fridge A',
				temperatureCelsius: 500,
				recordedAt: 1_700_000_000_000
			})
		).toBeNull();
		expect(
			normalizeClinicalPayload('temperatureLogs', { temperatureCelsius: 4, recordedAt: 1 })
		).toBeNull();
	});

	it('normalizes a valid ANC visit and rejects invalid clinical values', () => {
		const ancVisit = {
			patientId: 'patient-1',
			pregnancyRecordId: 'pregnancy-1',
			visitNumber: 2,
			visitDate: 1_700_000_000_000,
			systolicBp: 120,
			diastolicBp: 80,
			weightKg: 65.5,
			fetalHeartRateBpm: 140,
			fundalHeightCm: 28,
			notes: '  routine visit  '
		};

		const result = normalizeClinicalPayload('ancVisits', ancVisit);
		expect(result).not.toBeNull();
		expect(result?.visitDate).toBeInstanceOf(Date);
		expect(result?.notes).toBe('routine visit');
		expect(result?.weightKg).toBe(65.5);

		expect(
			normalizeClinicalPayload('ancVisits', { ...ancVisit, pregnancyRecordId: '' })
		).toBeNull();
		expect(normalizeClinicalPayload('ancVisits', { ...ancVisit, visitNumber: 9 })).toBeNull();
		expect(
			normalizeClinicalPayload('ancVisits', { ...ancVisit, fetalHeartRateBpm: 400 })
		).toBeNull();
		expect(
			normalizeClinicalPayload('ancVisits', {
				...ancVisit,
				visitDate: Date.now() + 10 * 24 * 60 * 60 * 1000
			})
		).toBeNull();
	});

	it('allows partial payloads for updates but validates supplied fields', () => {
		expect(
			normalizeClinicalPayload('temperatureLogs', { temperatureCelsius: 5 }, true)
		).not.toBeNull();
		expect(
			normalizeClinicalPayload('temperatureLogs', { temperatureCelsius: 500 }, true)
		).toBeNull();
		expect(
			normalizeClinicalPayload('immunizationRecords', { notes: 'reviewed' }, true)
		).not.toBeNull();
	});

	it('does not clear optional fields omitted from a partial update', () => {
		const result = normalizeClinicalPayload(
			'immunizationRecords',
			{ notes: 'reviewed', doseNumber: 2 },
			true
		);
		expect(result).not.toBeNull();
		expect(result).not.toHaveProperty('batchNumber');
		expect(result).not.toHaveProperty('expiryDate');
		expect(result).not.toHaveProperty('route');

		const tempResult = normalizeClinicalPayload('temperatureLogs', { temperatureCelsius: 5 }, true);
		expect(tempResult).not.toHaveProperty('notes');
	});
});

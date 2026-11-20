import { describe, expect, it } from 'vite-plus/test';
import { checkTenantScope, resolvesViaPatient } from './tenant-scope.ts';

describe('tenant scope', () => {
	const sessionPhcId = 'session-phc';

	it('accepts a new record whose client payload carried a placeholder PHC id', () => {
		// The server overwrites phcId with the session PHC for non-patient entities,
		// so the bogus client value must not reject a create.
		expect(
			checkTenantScope({
				entityType: 'queueTickets',
				existingPhcId: undefined,
				patientPhcId: null,
				sessionPhcId
			})
		).toBe('ok');

		expect(
			checkTenantScope({
				entityType: 'patients',
				existingPhcId: undefined,
				patientPhcId: null,
				sessionPhcId
			})
		).toBe('ok');
	});

	it('accepts an update to an existing record in the same PHC', () => {
		expect(
			checkTenantScope({
				entityType: 'queueTickets',
				existingPhcId: sessionPhcId,
				patientPhcId: null,
				sessionPhcId
			})
		).toBe('ok');
	});

	it('rejects modifying an existing record owned by another PHC', () => {
		expect(
			checkTenantScope({
				entityType: 'queueTickets',
				existingPhcId: 'other-phc',
				patientPhcId: null,
				sessionPhcId
			})
		).toBe('tenant-scope-mismatch');
	});

	it('scopes patient-linked entities by their patient PHC', () => {
		expect(resolvesViaPatient('vitalsRecords')).toBe(true);
		expect(resolvesViaPatient('prescriptions')).toBe(true);

		expect(
			checkTenantScope({
				entityType: 'vitalsRecords',
				existingPhcId: undefined,
				patientPhcId: sessionPhcId,
				sessionPhcId
			})
		).toBe('ok');

		expect(
			checkTenantScope({
				entityType: 'prescriptions',
				existingPhcId: undefined,
				patientPhcId: 'other-phc',
				sessionPhcId
			})
		).toBe('tenant-scope-mismatch');
	});

	it('rejects cross-PHC writes for clinical records', () => {
		for (const entityType of ['immunizationRecords', 'temperatureLogs']) {
			expect(resolvesViaPatient(entityType)).toBe(false);
			expect(
				checkTenantScope({
					entityType,
					existingPhcId: 'other-phc',
					patientPhcId: null,
					sessionPhcId
				})
			).toBe('tenant-scope-mismatch');
			expect(
				checkTenantScope({
					entityType,
					existingPhcId: undefined,
					patientPhcId: null,
					sessionPhcId
				})
			).toBe('ok');
		}
	});
});

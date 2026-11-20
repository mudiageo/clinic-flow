import { describe, expect, it } from 'vite-plus/test';
import {
	extractEncounterDependency,
	orderOperationsForDependencies,
	type OperationForDependency
} from './operation-dependencies';

function op(entityType: string, overrides: Partial<OperationForDependency> = {}) {
	return { entityType, operation: 'create', ...overrides };
}

describe('orderOperationsForDependencies', () => {
	it('pushes patients and encounters before dependent records', () => {
		const operations = [
			op('vitalsRecords', { entityId: 'vitals-1' }),
			op('queueTickets', { entityId: 'ticket-1' }),
			op('encounters', { entityId: 'encounter-1' }),
			op('patients', { entityId: 'patient-1' })
		];

		expect(orderOperationsForDependencies(operations).map((entry) => entry.entityType)).toEqual([
			'patients',
			'encounters',
			'vitalsRecords',
			'queueTickets'
		]);
	});

	it('pushes appointments before immunizations that reference them', () => {
		const operations = [
			op('immunizationRecords', { entityId: 'immunization-1' }),
			op('patients', { entityId: 'patient-1' }),
			op('appointments', { entityId: 'appointment-1' })
		];

		expect(orderOperationsForDependencies(operations).map((entry) => entry.entityId)).toEqual([
			'patient-1',
			'appointment-1',
			'immunization-1'
		]);
	});

	it('keeps the original order inside the same rank', () => {
		const operations = [
			op('vitalsRecords', { entityId: 'vitals-1' }),
			op('reminders', { entityId: 'reminder-1' }),
			op('queueTickets', { entityId: 'ticket-1' }),
			op('prescriptions', { entityId: 'prescription-1' })
		];

		expect(orderOperationsForDependencies(operations).map((entry) => entry.entityId)).toEqual([
			'vitals-1',
			'reminder-1',
			'ticket-1',
			'prescription-1'
		]);
	});
});

describe('extractEncounterDependency', () => {
	it.each(['vitalsRecords', 'queueTickets', 'labRequests', 'prescriptions'])(
		'extracts the encounter and patient from %s',
		(entityType) => {
			expect(
				extractEncounterDependency(
					op(entityType, {
						payload: { encounterId: 'encounter-1', patientId: 'patient-1', triageLevel: 'green' }
					})
				)
			).toEqual({ encounterId: 'encounter-1', patientId: 'patient-1' });
		}
	);

	it('returns the encounter with a null patient when the payload omits one', () => {
		expect(
			extractEncounterDependency(op('queueTickets', { payload: { encounterId: 'encounter-1' } }))
		).toEqual({ encounterId: 'encounter-1', patientId: null });
	});

	it('ignores unrelated entities, deletes, and malformed encounter ids', () => {
		expect(
			extractEncounterDependency(
				op('reminders', { payload: { encounterId: 'encounter-1', patientId: 'patient-1' } })
			)
		).toBeNull();
		expect(
			extractEncounterDependency(
				op('vitalsRecords', {
					operation: 'delete',
					payload: { encounterId: 'encounter-1', patientId: 'patient-1' }
				})
			)
		).toBeNull();
		expect(
			extractEncounterDependency(op('vitalsRecords', { payload: { encounterId: 123 } }))
		).toBeNull();
	});
});

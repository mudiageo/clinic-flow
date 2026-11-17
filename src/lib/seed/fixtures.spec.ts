import { describe, expect, it } from 'vite-plus/test';
import {
	buildAllFixtures,
	buildFixtures,
	CANONICAL_TRIAGE_RULES,
	PHC_PROFILES,
	seedId
} from './fixtures.ts';

const NOW = new Date('2026-11-17T09:00:00.000Z').getTime();

describe('seed fixtures', () => {
	it('are deterministic for a given profile and time', () => {
		const a = buildFixtures(PHC_PROFILES[0], NOW);
		const b = buildFixtures(PHC_PROFILES[0], NOW);
		expect(JSON.stringify(a) === JSON.stringify(b)).toBe(true);
	});

	it('produce three distinct PHC profiles by default', () => {
		const all = buildAllFixtures(NOW);
		expect(all.length).toBe(3);
		expect(new Set(all.map((f) => f.phcId)).size).toBe(3);
		expect(new Set(all.map((f) => f.profile.slug)).size).toBe(3);
	});

	it('derive stable, well-formed UUIDs', () => {
		const id = seedId('example:key');
		expect(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)).toBe(
			true
		);
		expect(seedId('example:key')).toBe(id);
		expect(seedId('example:other')).not.toBe(id);
	});

	for (const profile of PHC_PROFILES) {
		describe(profile.slug, () => {
			const f = buildFixtures(profile, NOW);

			it('has no duplicate ids across any entity', () => {
				const ids = [
					...f.authUsers.map((x) => x.id),
					...f.staff.map((x) => x.id),
					...f.families.map((x) => x.id),
					...f.patients.map((x) => x.id),
					...f.encounters.map((x) => x.id),
					...f.vitalsRecords.map((x) => x.id),
					...f.queueTickets.map((x) => x.id),
					...f.pharmacyInventory.map((x) => x.id),
					...f.prescriptions.map((x) => x.id),
					...f.labRequests.map((x) => x.id),
					...f.restockRequests.map((x) => x.id),
					...f.reminders.map((x) => x.id),
					...f.appointments.map((x) => x.id),
					...f.pregnancyRecords.map((x) => x.id),
					...f.triageRules.map((x) => x.id),
					...f.serverOnly.devices.map((x) => x.id),
					...f.serverOnly.smsInbox.map((x) => x.id),
					...f.serverOnly.auditLog.map((x) => x.id)
				];
				expect(new Set(ids).size).toBe(ids.length);
			});

			it('uses unique clinic ids', () => {
				const clinicIds = f.patients.map((p) => p.clinicId);
				expect(new Set(clinicIds).size).toBe(clinicIds.length);
			});

			it('resolves every foreign key', () => {
				const families = new Set(f.families.map((x) => x.id));
				const patients = new Set(f.patients.map((x) => x.id));
				const staff = new Set(f.staff.map((x) => x.id));
				const encounters = new Set(f.encounters.map((x) => x.id));
				const inventory = new Set(f.pharmacyInventory.map((x) => x.id));

				for (const p of f.patients) {
					if (p.familyId) expect(families.has(p.familyId)).toBe(true);
					if (p.guardianId) expect(patients.has(p.guardianId)).toBe(true);
					expect(p.phcId).toBe(f.phcId);
				}
				for (const e of f.encounters) {
					expect(patients.has(e.patientId)).toBe(true);
					if (e.recordedByStaffId) expect(staff.has(e.recordedByStaffId)).toBe(true);
				}
				for (const v of f.vitalsRecords) {
					expect(encounters.has(v.encounterId)).toBe(true);
					expect(patients.has(v.patientId)).toBe(true);
				}
				for (const q of f.queueTickets) {
					expect(patients.has(q.patientId)).toBe(true);
					if (q.encounterId) expect(encounters.has(q.encounterId)).toBe(true);
				}
				for (const rx of f.prescriptions) {
					expect(patients.has(rx.patientId)).toBe(true);
					expect(encounters.has(rx.encounterId)).toBe(true);
					expect(inventory.has(rx.inventoryId)).toBe(true);
				}
				for (const lab of f.labRequests) {
					expect(staff.has(lab.requestedByStaffId)).toBe(true);
				}
				for (const item of f.serverOnly.smsInbox) {
					if (item.patientId) expect(patients.has(item.patientId)).toBe(true);
				}
			});

			it('uses valid enum values and non-negative stock', () => {
				for (const p of f.patients) expect(['male', 'female', 'other']).toContain(p.sex);
				for (const q of f.queueTickets) {
					expect(['waiting', 'called', 'in_progress', 'done', 'no_show']).toContain(q.status);
					expect(['unassigned', 'green', 'amber', 'red']).toContain(q.triageLevel);
				}
				for (const item of f.pharmacyInventory) {
					expect(item.currentStock).toBeGreaterThanOrEqual(0);
					expect(item.lowStockThreshold).toBeGreaterThan(0);
				}
				for (const r of f.triageRules) {
					expect(['green', 'amber', 'red']).toContain(r.resultingLevel);
					expect(['gte', 'lte', 'gt', 'lt']).toContain(r.operator);
				}
			});

			it('uses coherent dates', () => {
				for (const a of f.appointments) expect(Number.isFinite(a.scheduledAt)).toBe(true);
				for (const r of f.reminders) {
					expect(r.dueDate).toBeGreaterThan(NOW);
					if (r.status === 'sent') expect(r.sentAt).not.toBeNull();
					if (r.status === 'scheduled') expect(r.sentAt).toBeNull();
				}
				for (const p of f.pregnancyRecords) {
					if (p.lmpDate && p.eddDate) expect(p.eddDate).toBeGreaterThan(p.lmpDate);
				}
			});
		});
	}

	it('ships one canonical triage rule set with no duplicate conditions', () => {
		const keys = CANONICAL_TRIAGE_RULES.map(
			(r) => `${r.field}:${r.operator}:${r.threshold}:${r.requiresPregnant}`
		);
		expect(new Set(keys).size).toBe(keys.length);
		for (const f of buildAllFixtures(NOW)) expect(f.triageRules.length).toBe(keys.length);
	});

	it('places the outbreak cohort only in Egor', () => {
		const egor = buildFixtures(
			PHC_PROFILES.find((p) => p.slug === 'egor')!,
			NOW
		);
		const others = buildAllFixtures(NOW).filter((f) => f.profile.slug !== 'egor');
		expect(egor.profile.outbreak).toBe(true);
		expect(egor.queueTickets.filter((q) => q.department === 'epi').length).toBeGreaterThanOrEqual(
			5
		);
		for (const f of others) expect(f.profile.outbreak).toBe(false);
	});
});

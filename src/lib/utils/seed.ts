/**
 * Browser-side demo data seeder, driven by the same fixture catalogue as the
 * Postgres seeder. Writes are idempotent (`bulkPut` on deterministic ids) and
 * scoped to the currently connected PHC.
 */

import { db, type Table } from '#lib/local-db/db.ts';
import { sessionStore } from '#lib/state/session.svelte.ts';
import { buildFixtures, PHC_PROFILES, seedId } from '#lib/seed/fixtures.ts';

export type DemoSeedResult = {
	phcId: string;
	profile: string;
	counts: Record<string, number>;
};

const LEGACY_PHC_IDS = ['PHC-DEMO', 'demo-phc-1'];

/** Remove rows written by the old client seeder so no orphan demo data remains. */
async function purgeLegacyDemoRows() {
	for (const table of [
		db.patients,
		db.queueTickets,
		db.vitalsRecords,
		db.pharmacyInventory,
		db.labRequests,
		db.reminders,
		db.encounters,
		db.prescriptions,
		db.restockRequests,
		db.appointments,
		db.pregnancyRecords,
		db.triageRules,
		db.staff
	] as unknown as Array<Table<{ phcId: string }, string>>) {
		await table.where('phcId').anyOf(LEGACY_PHC_IDS).delete();
	}
}

export async function seedDemoData(): Promise<DemoSeedResult> {
	const storedPhcId =
		typeof localStorage !== 'undefined' ? localStorage.getItem('clinicflow_phc_id') : null;
	const currentPhcId = sessionStore.phcId || storedPhcId;

	const profile =
		PHC_PROFILES.find((p) => seedId(`${p.slug}:phc`) === currentPhcId) ?? PHC_PROFILES[0];
	const fixtures = buildFixtures(profile);
	const phcId = currentPhcId || fixtures.phcId;

	const counts: Record<string, number> = {};
	const put = async <T extends { id: string }>(
		table: Table<T, string>,
		rows: T[],
		name: string
	) => {
		await table.bulkPut(rows);
		counts[name] = rows.length;
	};
	const retag = <T extends { phcId: string }>(rows: T[]): T[] =>
		rows.map((row) => ({ ...row, phcId }));

	await purgeLegacyDemoRows();

	await put(db.families, fixtures.families, 'families');
	await put(db.staff, retag(fixtures.staff), 'staff');
	await put(db.patients, retag(fixtures.patients), 'patients');
	await put(db.encounters, retag(fixtures.encounters), 'encounters');
	await put(db.vitalsRecords, retag(fixtures.vitalsRecords), 'vitalsRecords');
	await put(db.queueTickets, retag(fixtures.queueTickets), 'queueTickets');
	await put(db.pharmacyInventory, retag(fixtures.pharmacyInventory), 'pharmacyInventory');
	await put(db.prescriptions, retag(fixtures.prescriptions), 'prescriptions');
	await put(db.labRequests, retag(fixtures.labRequests), 'labRequests');
	await put(db.restockRequests, retag(fixtures.restockRequests), 'restockRequests');
	await put(db.reminders, retag(fixtures.reminders), 'reminders');
	await put(db.appointments, retag(fixtures.appointments), 'appointments');
	await put(db.pregnancyRecords, retag(fixtures.pregnancyRecords), 'pregnancyRecords');
	await put(db.triageRules, retag(fixtures.triageRules), 'triageRules');

	// Keep the locally cached PHC id consistent with what was seeded.
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('clinicflow_phc_id', phcId);
	}

	return { phcId, profile: profile.slug, counts };
}

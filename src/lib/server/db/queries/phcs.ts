import { database, getTable } from './_core';
import { eq, count } from 'drizzle-orm';
import { db } from '../index';

export async function createPhc(data: { name: string; state: string; lga: string }) {
	const phcs = getTable('phcs');
	return await database
		.insert(phcs)
		.values(data)
		.returning();
}

export async function updatePhcSettingsById(phcId: string, data: any) {
	const phcs = getTable('phcs');
	return await database.update(phcs).set(data).where(eq(phcs.id, phcId));
}

export async function getPhcListWithCounts() {
	const phcs = getTable('phcs');
	const staff = getTable('staff');
	const patients = getTable('patients');

	const allPhcs = await database.select().from(phcs);
	const results = [];

	for (const phc of allPhcs) {
		const staffCount = await database
			.select({ value: count() })
			.from(staff)
			.where(eq(staff.phcId, phc.id));
		const patientCount = await database
			.select({ value: count() })
			.from(patients)
			.where(eq(patients.phcId, phc.id));

		results.push({
			id: phc.id,
			name: phc.name,
			state: phc.state,
			lga: phc.lga,
			createdAt: phc.createdAt,
			staffCount: staffCount[0]?.value ?? 0,
			patientCount: patientCount[0]?.value ?? 0
		});
	}

	return results;
}

export async function getPhcFullDetails(id: string) {
	const phcs = getTable('phcs');
	const staff = getTable('staff');
	const patients = getTable('patients');

	const [phc] = await database.select().from(phcs).where(eq(phcs.id, id));
	if (!phc) return null;

	const staffCount = await database
		.select({ value: count() })
		.from(staff)
		.where(eq(staff.phcId, id));

	const patientCount = await database
		.select({ value: count() })
		.from(patients)
		.where(eq(patients.phcId, id));

	const phcStaff = await database
		.select({
			id: staff.id,
			name: staff.fullName,
			role: staff.role,
			active: staff.active
		})
		.from(staff)
		.where(eq(staff.phcId, id));

	return {
		...phc,
		staffCount: staffCount[0]?.value ?? 0,
		patientCount: patientCount[0]?.value ?? 0,
		staff: phcStaff
	};
}

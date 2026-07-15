import { query } from '$app/server';
import { db } from '$lib/server/db';
import { phcs, staff, patients } from '$lib/server/db/schema';
import { count, eq } from 'drizzle-orm';

export const getPhcList = query(async () => {
	// In a real app we'd verify the user is a superadmin here.
	// For demo purposes, this returns all PHCs.
	const allPhcs = await db.select().from(phcs);
	const results = [];

	for (const phc of allPhcs) {
		const staffCount = await db
			.select({ value: count() })
			.from(staff)
			.where(eq(staff.phcId, phc.id));
		const patientCount = await db
			.select({ value: count() })
			.from(patients)
			.where(eq(patients.phcId, phc.id));

		results.push({
			id: phc.id,
			name: phc.name,
			state: phc.state,
			lga: phc.lga,
			createdAt: phc.createdAt,
			staffCount: staffCount[0].value,
			patientCount: patientCount[0].value
		});
	}

	return results;
});

import { database, getTable } from './_core';
import { eq, desc } from 'drizzle-orm';

export async function getPatientEncountersList(patientId: string) {
	const encounters = getTable('encounters');
	return await database
		.select()
		.from(encounters)
		.where(eq(encounters.patientId, patientId))
		.orderBy(desc(encounters.visitDate))
		.limit(20);
}

export async function getTriageRulesList(phcId: string) {
	const triageRules = getTable('triageRules');
	return await database
		.select()
		.from(triageRules)
		.where(eq(triageRules.phcId, phcId))
		.orderBy(triageRules.field);
}

export async function createEncounterRecord(data: any) {
	const encounters = getTable('encounters');
	const [encounter] = await database
		.insert(encounters)
		.values(data)
		.returning();
	return encounter;
}

export async function updateEncounterNotesRecord(encounterId: string, doctorNotes: string) {
	const encounters = getTable('encounters');
	const [updated] = await database
		.update(encounters)
		.set({ doctorNotes, updatedAt: new Date() })
		.where(eq(encounters.id, encounterId))
		.returning();
	return updated;
}

export async function saveVitalsRecord(data: any) {
	const vitalsRecords = getTable('vitalsRecords');
	const [vitals] = await database
		.insert(vitalsRecords)
		.values(data)
		.returning();
	return vitals;
}

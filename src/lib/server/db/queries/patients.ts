import { database, getTable } from './_core';
import { eq, or, ilike, and, asc } from 'drizzle-orm';

export async function searchPatientsList(search?: string) {
	const patients = getTable('patients');
	if (search) {
		const pattern = `%${search}%`;
		return await database
			.select()
			.from(patients)
			.where(
				and(
					eq(patients.deleted, false),
					or(
						ilike(patients.fullName, pattern),
						ilike(patients.clinicId, pattern),
						ilike(patients.phone, pattern)
					)
				)
			)
			.limit(50);
	}
	return await database
		.select()
		.from(patients)
		.where(eq(patients.deleted, false))
		.limit(100);
}

export async function getPatientByClinicIdRecord(clinicId: string) {
	const patients = getTable('patients');
	const results = await database
		.select()
		.from(patients)
		.where(and(eq(patients.clinicId, clinicId), eq(patients.deleted, false)))
		.limit(1);
	return results[0] ?? null;
}

export async function getFamiliesList() {
	const families = getTable('families');
	return await database
		.select()
		.from(families)
		.orderBy(asc(families.householdName));
}

export async function createPatientRecord(data: any) {
	const patients = getTable('patients');
	const [patient] = await database
		.insert(patients)
		.values({
			...(data.id ? { id: data.id } : {}),
			clinicId: data.clinicId,
			phcId: data.phcId,
			familyId: data.familyId ?? null,
			fullName: data.fullName,
			phone: data.phone ?? null,
			dob: data.dob ? new Date(data.dob) : null,
			estimatedAge: data.estimatedAge ?? null,
			sex: data.sex,
			address: data.address ?? null,
			community: data.community ?? null,
			nextOfKinName: data.nextOfKinName ?? null,
			nextOfKinPhone: data.nextOfKinPhone ?? null,
			isPregnant: data.isPregnant ?? false,
			updatedAt: new Date()
		})
		.returning();
	return patient;
}

export async function createFamilyRecord(data: { householdName: string; community?: string }) {
	const families = getTable('families');
	const [family] = await database.insert(families).values(data).returning();
	return family;
}

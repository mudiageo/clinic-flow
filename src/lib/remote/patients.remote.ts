import { query, form, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { db } from '$lib/server/db';
import { patients, families } from '$lib/server/db/schema';
import { eq, or, ilike, and } from 'drizzle-orm';

function requireSession() {
	const event = getRequestEvent();
	if (!event.locals.session) redirect(302, '/login');
	return { session: event.locals.session, phcId: event.locals.phcId };
}

// ── Queries ──────────────────────────────────────────────────

export const getPatients = query(
	v.optional(v.object({ search: v.optional(v.string()) })),
	async (args) => {
		requireSession();
		const search = args?.search?.trim();
		if (search) {
			const pattern = `%${search}%`;
			return db
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
		return db.select().from(patients).where(eq(patients.deleted, false)).limit(100);
	}
);

export const getPatientByClinicId = query(v.string(), async (clinicId) => {
	requireSession();
	const results = await db
		.select()
		.from(patients)
		.where(and(eq(patients.clinicId, clinicId), eq(patients.deleted, false)))
		.limit(1);
	return results[0] ?? null;
});

export const getFamilies = query(async () => {
	requireSession();
	return db.select().from(families).orderBy(families.householdName);
});

// ── Commands ─────────────────────────────────────────────────

const createPatientSchema = v.object({
	id: v.optional(v.string()),
	clinicId: v.pipe(v.string(), v.nonEmpty()),
	phcId: v.pipe(v.string(), v.nonEmpty()),
	familyId: v.optional(v.string()),
	fullName: v.pipe(v.string(), v.nonEmpty()),
	phone: v.optional(v.string()),
	dob: v.optional(v.string()),
	estimatedAge: v.optional(v.number()),
	sex: v.picklist(['male', 'female', 'other']),
	address: v.optional(v.string()),
	community: v.optional(v.string()),
	nextOfKinName: v.optional(v.string()),
	nextOfKinPhone: v.optional(v.string()),
	isPregnant: v.optional(v.boolean())
});

export const createPatient = command(createPatientSchema, async (data) => {
	requireSession();
	const [patient] = await db
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
});

export const createFamily = command(
	v.object({ householdName: v.string(), community: v.optional(v.string()) }),
	async (data) => {
		requireSession();
		const [family] = await db.insert(families).values(data).returning();
		return family;
	}
);

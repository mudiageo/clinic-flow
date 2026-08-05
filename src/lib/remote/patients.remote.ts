import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import {
	searchPatientsList,
	getPatientByClinicIdRecord,
	getFamiliesList,
	createPatientRecord,
	createFamilyRecord
} from '$lib/server/db/queries/patients';

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
		return await searchPatientsList(search);
	}
);

export const getPatientByClinicId = query(v.string(), async (clinicId) => {
	requireSession();
	return await getPatientByClinicIdRecord(clinicId);
});

export const getFamilies = query(async () => {
	requireSession();
	return await getFamiliesList();
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
	return await createPatientRecord(data);
});

export const createFamily = command(
	v.object({ householdName: v.string(), community: v.optional(v.string()) }),
	async (data) => {
		requireSession();
		return await createFamilyRecord(data);
	}
);

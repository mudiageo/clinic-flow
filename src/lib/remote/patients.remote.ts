import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import {
	searchPatientsList,
	getPatientByClinicIdRecord,
	getFamiliesList,
	createPatientRecord,
	createFamilyRecord
} from '#lib/server/db/queries/patients.ts';

function requireSession() {
	const event = getRequestEvent();
	if (!event.locals.session) error(401, 'Unauthorized');
	if (!event.locals.phcId) error(403, 'No PHC assignment');
	return { session: event.locals.session, phcId: event.locals.phcId };
}

function requireFamilyAccess() {
	const context = requireSession();
	const { locals } = getRequestEvent();
	if (locals.role !== 'superadmin' && !locals.permissions?.includes('manage:families')) {
		error(403, 'Missing family-management permission');
	}
	return context;
}

// ── Queries ──────────────────────────────────────────────────

export const getPatients = query(
	v.optional(v.object({ search: v.optional(v.string()) })),
	async (args) => {
		const { phcId } = requireSession();
		const search = args?.search?.trim();
		return await searchPatientsList(phcId, search);
	}
);

export const getPatientByClinicId = query(v.string(), async (clinicId) => {
	const { phcId } = requireSession();
	return await getPatientByClinicIdRecord(phcId, clinicId);
});

export const getFamilies = query(async () => {
	const { phcId } = requireFamilyAccess();
	return await getFamiliesList(phcId);
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
	const { phcId } = requireSession();
	if (data.phcId !== phcId) error(403, 'PHC scope mismatch');
	return await createPatientRecord({ ...data, phcId });
});

export const createFamily = command(
	v.object({ householdName: v.string(), community: v.optional(v.string()) }),
	async (data) => {
		const { phcId } = requireFamilyAccess();
		return await createFamilyRecord({ ...data, phcId });
	}
);

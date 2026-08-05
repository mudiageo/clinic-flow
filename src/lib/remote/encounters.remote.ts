import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { db } from '$lib/server/db';
import {
	getPatientEncountersList,
	getTriageRulesList,
	createEncounterRecord,
	updateEncounterNotesRecord,
	saveVitalsRecord
} from '$lib/server/db/queries/encounters';

function requireSession() {
	const event = getRequestEvent();
	if (!event.locals.session || !event.locals.user) redirect(302, '/login');
	return { session: event.locals.session, user: event.locals.user, phcId: event.locals.phcId };
}

// ── Queries ──────────────────────────────────────────────────

export const getPatientEncounters = query(v.string(), async (patientId) => {
	requireSession();
	return await getPatientEncountersList(patientId);
});

export const getTriageRules = query(v.string(), async (phcId) => {
	requireSession();
	return await getTriageRulesList(phcId);
});

// ── Commands ─────────────────────────────────────────────────

export const createEncounter = command(
	v.object({
		patientId: v.pipe(v.string(), v.nonEmpty()),
		phcId: v.pipe(v.string(), v.nonEmpty()),
		chiefComplaint: v.optional(v.string()),
		chiefComplaintRaw: v.optional(v.string()),
		chiefComplaintLanguage: v.optional(v.string())
	}),
	async (data) => {
		const { user } = requireSession();
		const staffRecord = await db.query.staff.findFirst({
			where: (s, { eq }) => eq(s.authUserId, user.id)
		});
		return await createEncounterRecord({
			patientId: data.patientId,
			phcId: data.phcId,
			recordedByStaffId: staffRecord?.id ?? null,
			chiefComplaint: data.chiefComplaint ?? null,
			chiefComplaintRaw: data.chiefComplaintRaw ?? null,
			chiefComplaintLanguage: data.chiefComplaintLanguage ?? null
		});
	}
);

export const updateEncounterNotes = command(
	v.object({
		encounterId: v.pipe(v.string(), v.nonEmpty()),
		doctorNotes: v.string()
	}),
	async (data) => {
		requireSession();
		return await updateEncounterNotesRecord(data.encounterId, data.doctorNotes);
	}
);

export const saveVitals = command(
	v.object({
		encounterId: v.pipe(v.string(), v.nonEmpty()),
		patientId: v.pipe(v.string(), v.nonEmpty()),
		temperatureCelsius: v.optional(v.number()),
		systolicBp: v.optional(v.number()),
		diastolicBp: v.optional(v.number()),
		pulseBpm: v.optional(v.number()),
		weightKg: v.optional(v.number()),
		spo2Percent: v.optional(v.number()),
		triageLevel: v.picklist(['unassigned', 'green', 'amber', 'red']),
		triageReason: v.optional(v.string())
	}),
	async (data) => {
		requireSession();
		return await saveVitalsRecord({
			encounterId: data.encounterId,
			patientId: data.patientId,
			temperatureCelsius: data.temperatureCelsius ?? null,
			systolicBp: data.systolicBp ?? null,
			diastolicBp: data.diastolicBp ?? null,
			pulseBpm: data.pulseBpm ?? null,
			weightKg: data.weightKg ?? null,
			spo2Percent: data.spo2Percent ?? null,
			triageLevel: data.triageLevel,
			triageReason: data.triageReason ?? null
		});
	}
);

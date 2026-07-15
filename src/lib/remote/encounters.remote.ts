import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { db } from '$lib/server/db';
import { encounters, vitalsRecords, triageRules } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

function requireSession() {
	const event = getRequestEvent();
	if (!event.locals.session || !event.locals.user) redirect(302, '/login');
	return { session: event.locals.session, user: event.locals.user, phcId: event.locals.phcId };
}

// ── Queries ──────────────────────────────────────────────────

export const getPatientEncounters = query(v.string(), async (patientId) => {
	requireSession();
	return db
		.select()
		.from(encounters)
		.where(eq(encounters.patientId, patientId))
		.orderBy(desc(encounters.visitDate))
		.limit(20);
});

export const getTriageRules = query(v.string(), async (phcId) => {
	requireSession();
	return db
		.select()
		.from(triageRules)
		.where(eq(triageRules.phcId, phcId))
		.orderBy(triageRules.field);
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
		// Look up staff id from session
		const { staff } = await import('$lib/server/db/schema');
		const { eq: eqFn } = await import('drizzle-orm');
		const staffRecord = await db.query.staff.findFirst({
			where: eqFn(staff.authUserId, user.id)
		});
		const [encounter] = await db
			.insert(encounters)
			.values({
				patientId: data.patientId,
				phcId: data.phcId,
				recordedByStaffId: staffRecord?.id ?? null,
				chiefComplaint: data.chiefComplaint ?? null,
				chiefComplaintRaw: data.chiefComplaintRaw ?? null,
				chiefComplaintLanguage: data.chiefComplaintLanguage ?? null
			})
			.returning();
		return encounter;
	}
);

export const updateEncounterNotes = command(
	v.object({
		encounterId: v.pipe(v.string(), v.nonEmpty()),
		doctorNotes: v.string()
	}),
	async (data) => {
		requireSession();
		const [updated] = await db
			.update(encounters)
			.set({ doctorNotes: data.doctorNotes, updatedAt: new Date() })
			.where(eq(encounters.id, data.encounterId))
			.returning();
		return updated;
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
		triageLevel: v.picklist(['green', 'amber', 'red']),
		triageReason: v.optional(v.string())
	}),
	async (data) => {
		requireSession();
		const [vitals] = await db
			.insert(vitalsRecords)
			.values({
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
			})
			.returning();
		return vitals;
	}
);

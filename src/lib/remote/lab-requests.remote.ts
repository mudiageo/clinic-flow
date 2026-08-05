import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { db } from '$lib/server/db';
import {
	getLabRequestsByPhc,
	getLabRequestsByPatient,
	createLabRequestRecord,
	updateLabResultRecord
} from '$lib/server/db/queries/lab';

function requireSession() {
	const event = getRequestEvent();
	if (!event.locals.session || !event.locals.user) redirect(302, '/login');
	return { session: event.locals.session, user: event.locals.user, phcId: event.locals.phcId };
}

// ── Queries ──────────────────────────────────────────────────

export const getLabRequests = query(v.string(), async (phcId) => {
	requireSession();
	return await getLabRequestsByPhc(phcId);
});

export const getPatientLabRequests = query(v.string(), async (patientId) => {
	requireSession();
	return await getLabRequestsByPatient(patientId);
});

// ── Commands ─────────────────────────────────────────────────

export const createLabRequest = command(
	v.object({
		encounterId: v.pipe(v.string(), v.nonEmpty()),
		patientId: v.pipe(v.string(), v.nonEmpty()),
		phcId: v.pipe(v.string(), v.nonEmpty()),
		testType: v.pipe(v.string(), v.nonEmpty()),
		urgency: v.picklist(['routine', 'urgent', 'stat']),
		notes: v.optional(v.string()),
		status: v.picklist(['pending', 'processing', 'completed'])
	}),
	async (data) => {
		const { user } = requireSession();
		const staffRecord = await db.query.staff.findFirst({
			where: (s, { eq }) => eq(s.authUserId, user.id)
		});

		return await createLabRequestRecord({
			encounterId: data.encounterId,
			patientId: data.patientId,
			phcId: data.phcId,
			requestedByStaffId: staffRecord?.id ?? '',
			testType: data.testType,
			urgency: data.urgency,
			notes: data.notes ?? null,
			status: data.status
		});
	}
);

export const updateLabResult = command(
	v.object({
		requestId: v.pipe(v.string(), v.nonEmpty()),
		result: v.string(),
		status: v.picklist(['pending', 'processing', 'completed'])
	}),
	async (data) => {
		const { user } = requireSession();
		const staffRecord = await db.query.staff.findFirst({
			where: (s, { eq }) => eq(s.authUserId, user.id)
		});

		return await updateLabResultRecord({
			requestId: data.requestId,
			result: data.result,
			status: data.status,
			staffId: staffRecord?.id ?? null
		});
	}
);

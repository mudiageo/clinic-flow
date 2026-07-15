import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { db } from '$lib/server/db';
import { labRequests } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';

function requireSession() {
	const event = getRequestEvent();
	if (!event.locals.session || !event.locals.user) redirect(302, '/login');
	return { session: event.locals.session, user: event.locals.user, phcId: event.locals.phcId };
}

// ── Queries ──────────────────────────────────────────────────

export const getLabRequests = query(v.string(), async (phcId) => {
	requireSession();
	return db
		.select()
		.from(labRequests)
		.where(eq(labRequests.phcId, phcId))
		.orderBy(desc(labRequests.createdAt))
		.limit(100);
});

export const getPatientLabRequests = query(v.string(), async (patientId) => {
	requireSession();
	return db
		.select()
		.from(labRequests)
		.where(eq(labRequests.patientId, patientId))
		.orderBy(desc(labRequests.createdAt));
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
		const { staff } = await import('$lib/server/db/schema');
		const { eq: eqFn } = await import('drizzle-orm');
		const staffRecord = await db.query.staff.findFirst({
			where: eqFn(staff.authUserId, user.id)
		});

		const [labReq] = await db
			.insert(labRequests)
			.values({
				encounterId: data.encounterId,
				patientId: data.patientId,
				phcId: data.phcId,
				requestedByStaffId: staffRecord?.id ?? '', // We assume staff exists for valid sessions
				testType: data.testType,
				urgency: data.urgency,
				notes: data.notes ?? null,
				status: data.status
			})
			.returning();
		return labReq;
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
		const { staff } = await import('$lib/server/db/schema');
		const { eq: eqFn } = await import('drizzle-orm');
		const staffRecord = await db.query.staff.findFirst({
			where: eqFn(staff.authUserId, user.id)
		});

		const [updated] = await db
			.update(labRequests)
			.set({
				result: data.result,
				status: data.status,
				resultEnteredByStaffId: staffRecord?.id ?? null,
				resultEnteredAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(labRequests.id, data.requestId))
			.returning();
		return updated;
	}
);

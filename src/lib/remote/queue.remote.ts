import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { db } from '$lib/server/db';
import { queueTickets, patients } from '$lib/server/db/schema';
import { eq, and, asc, sql } from 'drizzle-orm';

function requireSession() {
	const event = getRequestEvent();
	if (!event.locals.session) redirect(302, '/login');
	return { session: event.locals.session, phcId: event.locals.phcId };
}

// ── Queries ──────────────────────────────────────────────────

export const getQueue = query(v.string(), async (phcId) => {
	requireSession();
	return db
		.select({
			ticket: queueTickets,
			patient: patients
		})
		.from(queueTickets)
		.leftJoin(patients, eq(queueTickets.patientId, patients.id))
		.where(and(eq(queueTickets.phcId, phcId), eq(queueTickets.status, 'waiting')))
		.orderBy(asc(queueTickets.createdAt));
});

export const getTodayQueue = query(v.string(), async (phcId) => {
	requireSession();
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	return db
		.select({ ticket: queueTickets, patient: patients })
		.from(queueTickets)
		.leftJoin(patients, eq(queueTickets.patientId, patients.id))
		.where(and(eq(queueTickets.phcId, phcId), sql`${queueTickets.createdAt} >= ${todayStart}`))
		.orderBy(asc(queueTickets.ticketNumber));
});

// ── Commands ─────────────────────────────────────────────────

export const issueTicket = command(
	v.object({
		patientId: v.pipe(v.string(), v.nonEmpty()),
		phcId: v.pipe(v.string(), v.nonEmpty()),
		encounterId: v.optional(v.string()),
		triageLevel: v.picklist(['green', 'amber', 'red']),
		triageReason: v.optional(v.string())
	}),
	async (data) => {
		requireSession();
		// Count today's tickets for sequential numbering
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);
		const existing = await db
			.select()
			.from(queueTickets)
			.where(
				and(eq(queueTickets.phcId, data.phcId), sql`${queueTickets.createdAt} >= ${todayStart}`)
			);
		const ticketNumber = existing.length + 1;

		const [ticket] = await db
			.insert(queueTickets)
			.values({
				patientId: data.patientId,
				phcId: data.phcId,
				encounterId: data.encounterId ?? null,
				ticketNumber,
				triageLevel: data.triageLevel,
				triageReason: data.triageReason ?? null,
				status: 'waiting'
			})
			.returning();
		return ticket;
	}
);

export const callPatient = command(v.string(), async (ticketId) => {
	requireSession();
	const [updated] = await db
		.update(queueTickets)
		.set({ status: 'called', calledAt: new Date(), updatedAt: new Date() })
		.where(eq(queueTickets.id, ticketId))
		.returning();
	return updated;
});

export const completeTicket = command(v.string(), async (ticketId) => {
	requireSession();
	const [updated] = await db
		.update(queueTickets)
		.set({ status: 'done', completedAt: new Date(), updatedAt: new Date() })
		.where(eq(queueTickets.id, ticketId))
		.returning();
	return updated;
});

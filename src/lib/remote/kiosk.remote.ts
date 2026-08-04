import { query, form } from '$app/server';
import { db } from '$lib/server/db';
import { queueTickets, patients } from '$lib/server/db/schema';
import { eq, or, ilike, inArray, and, gte, lte } from 'drizzle-orm';
import * as v from 'valibot';
import { getRequestEvent } from '$app/server';

export const getCheckedInQueue = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.phcId) return [];
	
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	return await db.query.queueTickets.findMany({
		where: and(
			eq(queueTickets.phcId, event.locals.phcId),
			inArray(queueTickets.status, ['waiting', 'called']),
			gte(queueTickets.createdAt, today),
			lte(queueTickets.createdAt, tomorrow)
		),
		with: {
			patient: {
				columns: { fullName: true, phone: true }
			}
		},
		orderBy: (tickets: any, { asc }: any) => [asc(tickets.ticketNumber)]
	});
});

export const searchPatients = query(
	v.object({ query: v.string() }),
	async ({ query: searchString }) => {
		const event = getRequestEvent();
		if (!event.locals.phcId || searchString.length < 2) return [];

		return await db.query.patients.findMany({
			where: and(
				eq(patients.phcId, event.locals.phcId),
				eq(patients.deleted, false),
				or(
					ilike(patients.fullName, `%${searchString}%`),
					ilike(patients.phone, `%${searchString}%`)
				)
			),
			limit: 10
		});
	}
);

export const selfCheckIn = form(
	v.object({ patientId: v.string() }),
	async ({ patientId }) => {
		const event = getRequestEvent();
		if (!event.locals.phcId) throw new Error('Unauthorized');
		
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const result = await db.execute<{ max_ticket: number }>(
			`SELECT MAX(ticket_number) as max_ticket FROM queue_tickets WHERE phc_id = '${event.locals.phcId}' AND created_at >= '${today.toISOString()}'`
		);
		const nextTicketNumber = ((result as any).rows[0]?.max_ticket || 0) + 1;

		const [ticket] = await db.insert(queueTickets)
			.values({
				phcId: event.locals.phcId,
				patientId,
				ticketNumber: nextTicketNumber,
				status: 'waiting'
			})
			.returning();

		return { success: true, ticketNumber: ticket.ticketNumber };
	}
);

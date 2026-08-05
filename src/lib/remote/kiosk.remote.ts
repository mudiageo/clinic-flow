import { query, form } from '$app/server';
import { db } from '$lib/server/db';
import * as v from 'valibot';
import { getRequestEvent } from '$app/server';
import { createSelfCheckInTicket } from '$lib/server/db/queries/queue';

export const getCheckedInQueue = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.phcId) return [];
	
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	return await db.query.queueTickets.findMany({
		where: (qt, { and, eq, inArray, gte, lte }) => and(
			eq(qt.phcId, event.locals.phcId!),
			inArray(qt.status, ['waiting', 'called']),
			gte(qt.createdAt, today),
			lte(qt.createdAt, tomorrow)
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
			where: (p, { and, eq, or, ilike }) => and(
				eq(p.phcId, event.locals.phcId!),
				eq(p.deleted, false),
				or(
					ilike(p.fullName, `%${searchString}%`),
					ilike(p.phone, `%${searchString}%`)
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
		
		const ticket = await createSelfCheckInTicket(event.locals.phcId, patientId);

		return { success: true, ticketNumber: ticket.ticketNumber };
	}
);

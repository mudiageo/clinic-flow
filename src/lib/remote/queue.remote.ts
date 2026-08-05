import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import {
	getWaitingQueueByPhc,
	getTodayQueueByPhc,
	issueQueueTicket,
	callQueueTicket,
	completeQueueTicket
} from '$lib/server/db/queries/queue';

function requireSession() {
	const event = getRequestEvent();
	if (!event.locals.session) redirect(302, '/login');
	return { session: event.locals.session, phcId: event.locals.phcId };
}

// ── Queries ──────────────────────────────────────────────────

export const getQueue = query(v.string(), async (phcId) => {
	requireSession();
	return await getWaitingQueueByPhc(phcId);
});

export const getTodayQueue = query(v.string(), async (phcId) => {
	requireSession();
	return await getTodayQueueByPhc(phcId);
});

// ── Commands ─────────────────────────────────────────────────

export const issueTicket = command(
	v.object({
		patientId: v.pipe(v.string(), v.nonEmpty()),
		phcId: v.pipe(v.string(), v.nonEmpty()),
		encounterId: v.optional(v.string()),
		triageLevel: v.picklist(['unassigned', 'green', 'amber', 'red']),
		triageReason: v.optional(v.string())
	}),
	async (data) => {
		requireSession();
		return await issueQueueTicket(data);
	}
);

export const callPatient = command(v.string(), async (ticketId) => {
	requireSession();
	return await callQueueTicket(ticketId);
});

export const completeTicket = command(v.string(), async (ticketId) => {
	requireSession();
	return await completeQueueTicket(ticketId);
});

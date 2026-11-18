import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import {
	getWaitingQueueByPhc,
	getTodayQueueByPhc,
	issueQueueTicket,
	callQueueTicket,
	completeQueueTicket
} from '#lib/server/db/queries/queue.ts';

function requireSession() {
	const event = getRequestEvent();
	if (!event.locals.session) error(401, 'Unauthorized');
	if (!event.locals.phcId) error(403, 'No PHC assignment');
	return { session: event.locals.session, phcId: event.locals.phcId };
}

// ── Queries ──────────────────────────────────────────────────

export const getQueue = query(v.string(), async (phcId) => {
	const session = requireSession();
	if (phcId !== session.phcId) error(403, 'PHC scope mismatch');
	return await getWaitingQueueByPhc(phcId);
});

export const getTodayQueue = query(v.string(), async (phcId) => {
	const session = requireSession();
	if (phcId !== session.phcId) error(403, 'PHC scope mismatch');
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
		const session = requireSession();
		if (data.phcId !== session.phcId) error(403, 'PHC scope mismatch');
		return await issueQueueTicket({ ...data, phcId: session.phcId });
	}
);

export const callPatient = command(v.string(), async (ticketId) => {
	const session = requireSession();
	return await callQueueTicket(ticketId, session.phcId);
});

export const completeTicket = command(v.string(), async (ticketId) => {
	const session = requireSession();
	return await completeQueueTicket(ticketId, session.phcId);
});

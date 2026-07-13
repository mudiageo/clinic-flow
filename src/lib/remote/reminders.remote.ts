import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { db } from '$lib/server/db';
import { reminders } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

function requireSession() {
	const event = getRequestEvent();
	if (!event.locals.session) throw redirect(302, '/login');
	return { session: event.locals.session, phcId: event.locals.phcId };
}

// ── Queries ──────────────────────────────────────────────────

export const getReminders = query(v.string(), async (phcId) => {
	requireSession();
	return db
		.select()
		.from(reminders)
		.where(eq(reminders.phcId, phcId))
		.orderBy(reminders.dueDate);
});

// ── Commands ─────────────────────────────────────────────────

export const createReminder = command(
	v.object({
		patientId: v.pipe(v.string(), v.nonEmpty()),
		phcId: v.pipe(v.string(), v.nonEmpty()),
		type: v.picklist(['immunization', 'antenatal', 'follow_up']),
		label: v.pipe(v.string(), v.nonEmpty()),
		dueDate: v.pipe(v.string(), v.nonEmpty()),
		recipientPhone: v.pipe(v.string(), v.nonEmpty()),
	}),
	async (data) => {
		requireSession();
		const [reminder] = await db
			.insert(reminders)
			.values({
				patientId: data.patientId,
				phcId: data.phcId,
				type: data.type,
				label: data.label,
				dueDate: new Date(data.dueDate),
				recipientPhone: data.recipientPhone,
				status: 'scheduled',
			})
			.returning();
		return reminder;
	}
);

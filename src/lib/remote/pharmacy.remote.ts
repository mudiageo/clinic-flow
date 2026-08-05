import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { db } from '$lib/server/db';
import {
	getPharmacyInventory,
	dispenseMedicationInDb,
	createRestockRequestInDb
} from '$lib/server/db/queries/pharmacy';

function requireSession() {
	const event = getRequestEvent();
	if (!event.locals.session || !event.locals.user) redirect(302, '/login');
	return { session: event.locals.session, user: event.locals.user, phcId: event.locals.phcId };
}

// ── Queries ──────────────────────────────────────────────────

export const getInventory = query(v.string(), async (phcId) => {
	requireSession();
	return await getPharmacyInventory(phcId);
});

// ── Commands ─────────────────────────────────────────────────

export const dispenseMedication = command(
	v.object({
		inventoryItemId: v.pipe(v.string(), v.nonEmpty()),
		encounterId: v.pipe(v.string(), v.nonEmpty()),
		patientId: v.pipe(v.string(), v.nonEmpty()),
		quantity: v.pipe(v.number(), v.integer()),
		dosageInstructions: v.optional(v.string())
	}),
	async (data) => {
		const { user } = requireSession();

		const staffRecord = await db.query.staff.findFirst({
			where: (s, { eq }) => eq(s.authUserId, user.id)
		});

		return await dispenseMedicationInDb({
			encounterId: data.encounterId,
			patientId: data.patientId,
			inventoryItemId: data.inventoryItemId,
			quantity: data.quantity,
			dosageInstructions: data.dosageInstructions ?? null,
			staffId: staffRecord?.id ?? null
		});
	}
);

export const requestRestock = command(
	v.object({
		inventoryItemId: v.pipe(v.string(), v.nonEmpty()),
		phcId: v.pipe(v.string(), v.nonEmpty()),
		quantityRequested: v.pipe(v.number(), v.integer())
	}),
	async (data) => {
		const { user } = requireSession();

		const staffRecord = await db.query.staff.findFirst({
			where: (s, { eq }) => eq(s.authUserId, user.id)
		});

		return await createRestockRequestInDb({
			inventoryItemId: data.inventoryItemId,
			phcId: data.phcId,
			requestedByStaffId: staffRecord?.id ?? null,
			quantityRequested: data.quantityRequested
		});
	}
);

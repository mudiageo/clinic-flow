import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { db } from '$lib/server/db';
import { pharmacyInventory, prescriptions, restockRequests } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

function requireSession() {
	const event = getRequestEvent();
	if (!event.locals.session || !event.locals.user) redirect(302, '/login');
	return { session: event.locals.session, user: event.locals.user, phcId: event.locals.phcId };
}

// ── Queries ──────────────────────────────────────────────────

export const getInventory = query(v.string(), async (phcId) => {
	requireSession();
	return db
		.select()
		.from(pharmacyInventory)
		.where(eq(pharmacyInventory.phcId, phcId))
		.orderBy(pharmacyInventory.itemName);
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

		const { staff } = await import('$lib/server/db/schema');
		const { eq: eqFn } = await import('drizzle-orm');
		const staffRecord = await db.query.staff.findFirst({
			where: eqFn(staff.authUserId, user.id)
		});

		// 1. Insert prescription record
		const [prescription] = await db
			.insert(prescriptions)
			.values({
				encounterId: data.encounterId,
				patientId: data.patientId,
				inventoryItemId: data.inventoryItemId,
				quantity: data.quantity,
				dosageInstructions: data.dosageInstructions ?? null,
				dispensed: true,
				dispensedAt: new Date(),
				dispensedByStaffId: staffRecord?.id ?? null
			})
			.returning();

		// 2. Delta-decrement stock to avoid naive LWW overwrites
		await db
			.update(pharmacyInventory)
			.set({
				currentStock: sql`${pharmacyInventory.currentStock} - ${data.quantity}`,
				updatedAt: new Date()
			})
			.where(eq(pharmacyInventory.id, data.inventoryItemId));

		return prescription;
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

		const { staff } = await import('$lib/server/db/schema');
		const { eq: eqFn } = await import('drizzle-orm');
		const staffRecord = await db.query.staff.findFirst({
			where: eqFn(staff.authUserId, user.id)
		});

		const [request] = await db
			.insert(restockRequests)
			.values({
				inventoryItemId: data.inventoryItemId,
				phcId: data.phcId,
				requestedByStaffId: staffRecord?.id ?? null,
				quantityRequested: data.quantityRequested,
				status: 'pending'
			})
			.returning();

		return request;
	}
);

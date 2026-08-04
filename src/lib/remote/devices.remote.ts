import { query, form, getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { devices } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import * as v from 'valibot';
import { invalid } from '@sveltejs/kit';

// Fetch all devices for the current PHC
export const getDevices = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.phcId) return [];

	return await db.query.devices.findMany({
		where: eq(devices.phcId, event.locals.phcId),
		orderBy: [desc(devices.createdAt)]
	});
});

// Update device status/role
export const updateDevice = form(
	v.object({
		deviceId: v.string(),
		status: v.optional(v.union([v.literal('pending'), v.literal('approved'), v.literal('revoked')])),
		role: v.optional(v.union([v.literal('kiosk'), v.literal('triage'), v.literal('doctor_tablet'), v.literal('pharmacy_terminal')]))
	}),
	async (data, issue) => {
		const event = getRequestEvent();
		if (!event.locals.phcId) return invalid(issue('Unauthorized'));

		const updateData: any = {};
		if (data.status) updateData.status = data.status;
		if (data.role) updateData.role = data.role;

		await db.update(devices)
			.set(updateData)
			.where(eq(devices.id, data.deviceId));
			
		return { success: true };
	}
);

// Delete/Remove a device permanently
export const removeDevice = form(
	v.object({
		deviceId: v.string()
	}),
	async (data, issue) => {
		const event = getRequestEvent();
		if (!event.locals.phcId) return invalid(issue('Unauthorized'));

		await db.delete(devices).where(eq(devices.id, data.deviceId));
		return { success: true };
	}
);

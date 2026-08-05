import { query, form, getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import * as v from 'valibot';
import { invalid } from '@sveltejs/kit';
import { updateDevice as updateDeviceDAL, deleteDevice as deleteDeviceDAL } from '$lib/server/db/queries/devices';

// Fetch all devices for the current PHC
export const getDevices = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.phcId) return [];

	return await db.query.devices.findMany({
		where: (d, { eq }) => eq(d.phcId, event.locals.phcId!),
		orderBy: (d, { desc }) => [desc(d.createdAt)]
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

		await updateDeviceDAL(data.deviceId, updateData);
			
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

		await deleteDeviceDAL(data.deviceId);
		return { success: true };
	}
);

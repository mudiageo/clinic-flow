import { query, form, getRequestEvent } from '$app/server';
import { db } from '#lib/server/db/index.ts';
import * as v from 'valibot';
import { invalid } from '@sveltejs/kit';
import {
	registerPendingDevice as registerPendingDeviceDAL,
	updateDevice as updateDeviceDAL,
	deleteDevice as deleteDeviceDAL
} from '#lib/server/db/queries/devices.ts';
import { requirePermission } from '#lib/server/permissions.ts';

// Fetch all devices for the current PHC
export const getDevices = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.phcId) return [];

	return await db.query.devices.findMany({
		where: (d, { eq }) => eq(d.phcId, event.locals.phcId!),
		orderBy: (d, { desc }) => [desc(d.createdAt)]
	});
});

// Register a device manually without a pairing token. It stays pending until approved.
export const registerDevice = form(
	v.object({
		name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80)),
		role: v.picklist(['kiosk', 'triage', 'doctor_tablet', 'pharmacy_terminal'])
	}),
	async (data, issue) => {
		await requirePermission('manage:devices');
		const event = getRequestEvent();
		if (!event.locals.phcId) return invalid(issue('Unauthorized'));

		await registerPendingDeviceDAL({
			phcId: event.locals.phcId,
			name: data.name,
			role: data.role
		});

		return { success: true };
	}
);

// Update device status/role
export const updateDevice = form(
	v.object({
		deviceId: v.string(),
		status: v.optional(
			v.union([v.literal('pending'), v.literal('approved'), v.literal('revoked')])
		),
		role: v.optional(
			v.union([
				v.literal('kiosk'),
				v.literal('triage'),
				v.literal('doctor_tablet'),
				v.literal('pharmacy_terminal')
			])
		)
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

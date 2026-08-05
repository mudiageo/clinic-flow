import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { requirePermission } from '$lib/server/permissions';
import * as v from 'valibot';
import { createStaff, updateStaffStatusById } from '$lib/server/db/queries/staff';
import { grantPermissionsBulk } from '$lib/server/db/queries/permissions';
import { updatePhcSettingsById } from '$lib/server/db/queries/phcs';

export const getStaffMember = query(v.string(), async (staffId) => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
	await requirePermission(event.locals.staffId, 'manage:staff');

	return await db.query.staff.findFirst({
		where: (s, { and, eq }) => and(eq(s.id, staffId), eq(s.phcId, event.locals.phcId!))
	});
});

export const getPhcStaffList = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
	await requirePermission(event.locals.staffId, 'manage:staff');

	return await db.query.staff.findMany({
		where: (s, { eq }) => eq(s.phcId, event.locals.phcId!),
		orderBy: (staff, { desc }) => [desc(staff.createdAt)]
	});
});

export const inviteStaff = command(
	v.object({
		email: v.pipe(v.string(), v.email()),
		role: v.picklist(['receptionist', 'nurse', 'doctor', 'pharmacy', 'admin', 'superadmin']),
		permissions: v.array(v.string())
	}),
	async (data) => {
		const event = getRequestEvent();
		if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
		await requirePermission(event.locals.staffId, 'manage:staff');
		
		const [newStaff] = await createStaff({
			authUserId: 'pending-' + crypto.randomUUID(),
			fullName: data.email,
			role: data.role,
			phcId: event.locals.phcId,
			active: false
		});

		if (data.permissions.length > 0) {
			await grantPermissionsBulk(
				data.permissions.map((p) => ({
					staffId: newStaff.id,
					phcId: event.locals.phcId!,
					permission: p,
					grantedBy: event.locals.staffId!
				}))
			);
		}

		return { success: true, staffId: newStaff.id };
	}
);

export const updateStaffStatus = command(
	v.object({
		staffId: v.string(),
		active: v.boolean()
	}),
	async ({ staffId, active }) => {
		const event = getRequestEvent();
		if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
		await requirePermission(event.locals.staffId, 'manage:staff');

		await updateStaffStatusById(staffId, event.locals.phcId, active);
		return { success: true };
	}
);

export const getPhcSettings = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
	await requirePermission(event.locals.staffId, 'manage:phc');

	return await db.query.phcs.findFirst({
		where: (p, { eq }) => eq(p.id, event.locals.phcId!)
	});
});

export const updatePhcSettings = command(
	v.object({
		name: v.string(),
		state: v.string(),
		lga: v.string(),
		termiiApiKey: v.nullable(v.string()),
		syncPollInterval: v.number(),
		maternalHealthEnabled: v.boolean(),
		immunizationEnabled: v.boolean(),
		aiVoiceEnabled: v.boolean(),
		outbreakDetectionEnabled: v.boolean(),
		twoWaySmsEnabled: v.boolean(),
		referralsEnabled: v.boolean(),
		familyHealthEnabled: v.boolean(),
		realTimeNotificationsEnabled: v.boolean(),
		nhisTrackingEnabled: v.boolean()
	}),
	async (data) => {
		const event = getRequestEvent();
		if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
		await requirePermission(event.locals.staffId, 'manage:phc');

		await updatePhcSettingsById(event.locals.phcId, data);
		return { success: true };
	}
);

export const getStaffPermissionAuditLog = query(v.string(), async (staffId) => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
	await requirePermission(event.locals.staffId, 'manage:staff');

	return await db.query.permissions.findMany({
		where: (p, { and, eq }) => and(eq(p.staffId, staffId), eq(p.phcId, event.locals.phcId!)),
		orderBy: (permissions, { desc }) => [desc(permissions.grantedAt)],
		with: {
			grantedByStaff: true
		}
	});
});

export const getSmsInbox = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
	await requirePermission(event.locals.staffId, 'manage:phc');

	return await db.query.smsInbox.findMany({
		where: (t, { eq }) => eq(t.phcId, event.locals.phcId!),
		orderBy: (t, { desc }) => [desc(t.createdAt)],
		limit: 100
	});
});

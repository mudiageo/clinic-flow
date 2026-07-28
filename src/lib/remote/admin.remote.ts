import { query } from '$app/server';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { staff } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { requirePermission } from '$lib/server/permissions';
import * as v from 'valibot';
import { command } from '$app/server';
import { phcs, permissions } from '$lib/server/db/schema';

export const getStaffMember = query(v.string(), async (staffId) => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
	await requirePermission(event.locals.staffId, 'manage:staff');

	return await db.query.staff.findFirst({
		where: and(eq(staff.id, staffId), eq(staff.phcId, event.locals.phcId))
	});
});

export const getPhcStaffList = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
	await requirePermission(event.locals.staffId, 'manage:staff');

	return await db.query.staff.findMany({
		where: eq(staff.phcId, event.locals.phcId),
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
		
		// Insert placeholder staff
		const [newStaff] = await db.insert(staff).values({
			authUserId: 'pending-' + crypto.randomUUID(), // placeholder until they register
			fullName: data.email, // placeholder
			role: data.role,
			phcId: event.locals.phcId,
			active: false // treated as invited/inactive until registered
		}).returning();

		// Insert permissions if provided
		if (data.permissions.length > 0) {
			await db.insert(permissions).values(
				data.permissions.map((p) => ({
					staffId: newStaff.id,
					phcId: event.locals.phcId!,
					permission: p,
					grantedBy: event.locals.staffId
				}))
			);
		}

		// Generate invite token logic goes here (stub for now)
		// email sending stub
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

		await db.update(staff).set({ active }).where(and(eq(staff.id, staffId), eq(staff.phcId, event.locals.phcId)));
		return { success: true };
	}
);

export const getPhcSettings = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
	await requirePermission(event.locals.staffId, 'manage:phc');

	return await db.query.phcs.findFirst({
		where: eq(phcs.id, event.locals.phcId)
	});
});

export const updatePhcSettings = command(
	v.object({
		name: v.string(),
		state: v.string(),
		lga: v.string(),
		termiiApiKey: v.nullable(v.string()),
		syncPollInterval: v.number()
	}),
	async (data) => {
		const event = getRequestEvent();
		if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
		await requirePermission(event.locals.staffId, 'manage:phc');

		await db.update(phcs).set(data).where(eq(phcs.id, event.locals.phcId));
		return { success: true };
	}
);

export const getStaffPermissionAuditLog = query(v.string(), async (staffId) => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
	await requirePermission(event.locals.staffId, 'manage:staff');

	return await db.query.permissions.findMany({
		where: and(eq(permissions.staffId, staffId), eq(permissions.phcId, event.locals.phcId)),
		orderBy: (permissions, { desc }) => [desc(permissions.grantedAt)],
		with: {
			grantedByStaff: true
		}
	});
});

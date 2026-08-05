import { form, query } from '$app/server';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { requirePermission } from '$lib/server/permissions';
import * as v from 'valibot';
import { grantPermission, revokePermission } from '$lib/server/db/queries/permissions';

export const getStaffPermissions = query(v.string(), async (staffId) => {
	const event = getRequestEvent();
	if (!event.locals.staffId) throw new Error('Unauthorized');
	await requirePermission(event.locals.staffId, 'manage:staff');

	return await db.query.permissions.findMany({
		where: (p, { and, eq }) => and(eq(p.staffId, staffId), eq(p.revoked, false)),
		orderBy: (p, { desc }) => [desc(p.grantedAt)]
	});
});

export const getPhcPermissionsAudit = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');

	await requirePermission(event.locals.staffId, 'manage:staff');

	return await db.query.permissions.findMany({
		where: (p, { eq }) => eq(p.phcId, event.locals.phcId!),
		with: {
			staff: {
				columns: { fullName: true, role: true }
			},
			grantedByStaff: {
				columns: { fullName: true }
			}
		},
		orderBy: (p, { desc }) => [desc(p.grantedAt)]
	});
});

export const getPlatformPermissionsAudit = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.staffId) throw new Error('Unauthorized');

	await requirePermission(event.locals.staffId, 'superadmin:all');

	return await db.query.permissions.findMany({
		with: {
			staff: {
				columns: { fullName: true, role: true }
			},
			grantedByStaff: {
				columns: { fullName: true }
			},
			phc: {
				columns: { name: true, state: true }
			}
		},
		orderBy: (p, { desc }) => [desc(p.grantedAt)]
	});
});

export const grantPermissionAction = form(
	v.object({
		staffId: v.string(),
		permission: v.string()
	}),
	async (data) => {
		const event = getRequestEvent();
		if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');

		await requirePermission(event.locals.staffId, 'manage:staff');

		return await grantPermission({
			staffId: data.staffId,
			phcId: event.locals.phcId,
			permission: data.permission,
			grantedBy: event.locals.staffId
		});
	}
);

export const revokePermissionAction = form(
	v.object({
		staffId: v.string(),
		permission: v.string()
	}),
	async (data) => {
		const event = getRequestEvent();
		if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');

		await requirePermission(event.locals.staffId, 'manage:staff');

		return await revokePermission({
			staffId: data.staffId,
			phcId: event.locals.phcId,
			permission: data.permission,
			grantedBy: event.locals.staffId
		});
	}
);

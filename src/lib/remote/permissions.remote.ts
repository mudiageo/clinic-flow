import { form, command, query } from '$app/server';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { requirePermission } from '$lib/server/permissions';
import * as v from 'valibot';
import { grantPermission as grantPermissionQuery, revokePermission as revokePermissionQuery } from '$lib/server/db/queries/permissions';

export const getStaffPermissions = query(v.string(), async (staffId) => {
	const event = getRequestEvent();
	if (!event.locals.staffId) throw new Error('Unauthorized');
	await requirePermission('manage:permissions');

	return await db.query.permissions.findMany({
		where: (p, { eq }) => eq(p.staffId, staffId),
		orderBy: (p, { desc }) => [desc(p.grantedAt)]
	});
});

export const getPhcPermissionsAudit = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');

	await requirePermission('view:audit');

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

	await requirePermission('view:audit');

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

const grantPermissionSchema = v.object({
	staffId: v.string(),
	permission: v.string()
});

const grantPermissionHandler = async (data: any) => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
	await requirePermission('manage:permissions');

	await grantPermissionQuery({
		staffId: data.staffId,
		phcId: event.locals.phcId,
		permission: data.permission,
		grantedBy: event.locals.staffId
	});
	return { success: true };
};

export const grantPermission = command(grantPermissionSchema, grantPermissionHandler);
export const grantPermissionAction = form(grantPermissionSchema, grantPermissionHandler);

const revokePermissionSchema = v.object({
	staffId: v.string(),
	permission: v.string()
});

const revokePermissionHandler = async (data: any) => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
	await requirePermission('manage:permissions');

	await revokePermissionQuery({
		staffId: data.staffId,
		phcId: event.locals.phcId,
		permission: data.permission,
		revokedBy: event.locals.staffId
	});
	return { success: true };
};

export const revokePermission = command(revokePermissionSchema, revokePermissionHandler);
export const revokePermissionAction = form(revokePermissionSchema, revokePermissionHandler);

const resetStaffPermissionsSchema = v.object({
	staffId: v.string()
});

const resetStaffPermissionsHandler = async (data: any) => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
	await requirePermission('manage:permissions');

	await db
		.delete(db.permissions)
		.where(
			(p, { and, eq }) => and(eq(p.staffId, data.staffId), eq(p.phcId, event.locals.phcId!))
		);
	return { success: true };
};

export const resetStaffPermissions = command(resetStaffPermissionsSchema, resetStaffPermissionsHandler);
export const resetStaffPermissionsAction = form(resetStaffPermissionsSchema, resetStaffPermissionsHandler);

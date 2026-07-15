import { form, query } from '$app/server';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { permissions } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { requirePermission } from '$lib/server/permissions';
import * as v from 'valibot';

export const getStaffPermissions = query(v.string(), async (staffId) => {
	const event = getRequestEvent();
	// Authorization check
	if (!event.locals.staffId) throw new Error('Unauthorized');
	await requirePermission(event.locals.staffId, 'manage:staff');

	return await db.query.permissions.findMany({
		where: and(eq(permissions.staffId, staffId), eq(permissions.revoked, false)),
		orderBy: (permissions, { desc }) => [desc(permissions.grantedAt)]
	});
});

export const getPhcPermissionsAudit = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');

	await requirePermission(event.locals.staffId, 'manage:staff');

	return await db.query.permissions.findMany({
		where: eq(permissions.phcId, event.locals.phcId),
		with: {
			staff: {
				columns: { fullName: true, role: true }
			},
			grantedByStaff: {
				columns: { fullName: true }
			}
		},
		orderBy: (permissions, { desc }) => [desc(permissions.grantedAt)]
	});
});

export const getPlatformPermissionsAudit = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.staffId) throw new Error('Unauthorized');

	// Superadmin check
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
		orderBy: (permissions, { desc }) => [desc(permissions.grantedAt)]
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

		// Authorization check
		await requirePermission(event.locals.staffId, 'manage:staff');

		// Invalidate previous grants/revocations for this specific permission
		await db
			.update(permissions)
			.set({ revoked: true })
			.where(
				and(eq(permissions.staffId, data.staffId), eq(permissions.permission, data.permission))
			);

		// Insert the new grant
		const result = await db
			.insert(permissions)
			.values({
				staffId: data.staffId,
				phcId: event.locals.phcId,
				permission: data.permission,
				grantedBy: event.locals.staffId,
				revoked: false
				// expiresAt: null // Not handling expiry in this basic toggle yet
			})
			.returning();

		return result[0];
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

		// Authorization check
		await requirePermission(event.locals.staffId, 'manage:staff');

		// First mark any existing specific grants as revoked
		await db
			.update(permissions)
			.set({ revoked: true })
			.where(
				and(eq(permissions.staffId, data.staffId), eq(permissions.permission, data.permission))
			);

		// Then insert a specific revocation record if it's a role default being revoked
		// We can just create a record with `revoked: true` to act as an explicit block
		const result = await db
			.insert(permissions)
			.values({
				staffId: data.staffId,
				phcId: event.locals.phcId,
				permission: data.permission,
				grantedBy: event.locals.staffId,
				revoked: true
			})
			.returning();

		return result[0];
	}
);

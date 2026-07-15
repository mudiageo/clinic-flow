import { db } from '$lib/server/db';
import { permissions, staff } from '$lib/server/db/schema';
import { and, eq, or, isNull, gt } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { getRoleDefaults, ROLE_DEFAULT_PERMISSIONS } from '$lib/permissions';

export async function hasPermission(staffId: string, permission: string): Promise<boolean> {
	// 1. Fetch staff member to get their role
	const staffMember = await db.query.staff.findFirst({
		where: eq(staff.id, staffId)
	});

	if (!staffMember || !staffMember.active) {
		return false; // Inactive staff cannot have permissions
	}

	if (staffMember.role === 'superadmin') {
		return true; // Superadmin has all permissions
	}

	// 2. Check if the permission is granted by their role by default
	const defaultPerms = getRoleDefaults(staffMember.role);
	const hasRoleDefault = defaultPerms.includes(permission);

	// 3. Check for specific overrides (grants or revocations) in the database
	const grant = await db.query.permissions.findFirst({
		where: and(eq(permissions.staffId, staffId), eq(permissions.permission, permission)),
		orderBy: (permissions, { desc }) => [desc(permissions.grantedAt)] // get most recent
	});

	if (grant) {
		if (grant.revoked) return false;

		// Check expiry
		if (grant.expiresAt && grant.expiresAt < new Date()) {
			// It's expired, so we fall back to role default? Or does expiry mean revoked?
			// Typically, an expired manual grant just goes away, so we fall back to role default.
			return hasRoleDefault;
		}

		// It is manually granted and valid
		return true;
	}

	return hasRoleDefault;
}

export async function requirePermission(staffId: string, permission: string): Promise<void> {
	const allowed = await hasPermission(staffId, permission);
	if (!allowed) {
		throw error(403, `Forbidden: Missing permission '${permission}'`);
	}
}

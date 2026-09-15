import { error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';

export async function hasPermission(permission: string): Promise<boolean> {
	const event = getRequestEvent();
	if (!event || !event.locals) return false;
	
	if (event.locals.role === 'superadmin') {
		return true; // Superadmin has all permissions
	}

	const permissions = event.locals.permissions || [];
	return permissions.includes(permission);
}

export async function requirePermission(permission: string): Promise<void> {
	const allowed = await hasPermission(permission);
	if (!allowed) {
		throw error(403, `Forbidden: Missing permission '${permission}'`);
	}
}

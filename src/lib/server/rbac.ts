import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';

/**
 * Ensures the current authenticated user has one of the allowed roles.
 * Throws a 403 HTTP error if they do not.
 */
export function requireRole(allowedRoles: string[]) {
	const event = getRequestEvent();
	const role = event.locals.role;
	
	if (!role || !allowedRoles.includes(role)) {
		throw error(403, 'Forbidden: Insufficient privileges');
	}
	
	return role;
}

/**
 * A specialized strict RBAC check for superadmin / maker actions.
 */
export function requireSuperadmin() {
	return requireRole(['superadmin', 'maker']);
}

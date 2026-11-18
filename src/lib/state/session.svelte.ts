// Client-side session state with permission helpers
// Populated by (app)/+layout.svelte from the server session

import type { PermissionKey } from '#lib/config/permissions.ts';

interface SessionState {
	user: { id: string; name: string; email: string } | null;
	role: string | null;
	phcId: string | null;
	staffId: string | null;
	permissions: string[];
}

function createSessionStore() {
	const state = $state<SessionState>({
		user: null,
		role: null,
		phcId: null,
		staffId: null,
		permissions: []
	});

	return {
		get user() {
			return state.user;
		},
		get role() {
			return state.role;
		},
		get phcId() {
			return state.phcId;
		},
		get staffId() {
			return state.staffId;
		},
		/** PHC id for record writes, with the localStorage handoff from /connect and /onboarding. */
		get activePhcId(): string {
			if (state.phcId) return state.phcId;
			if (typeof localStorage !== 'undefined') {
				return localStorage.getItem('clinicflow_phc_id') ?? '';
			}
			return '';
		},
		get permissions() {
			return state.permissions;
		},

		/**
		 * Initialize the session from server data (called in +layout.svelte)
		 */
		init(sessionData: SessionState) {
			state.user = sessionData.user;
			state.role = sessionData.role;
			state.phcId = sessionData.phcId;
			state.staffId = sessionData.staffId ?? null;
			state.permissions = sessionData.permissions ?? [];
		},

		/**
		 * Returns true if the current user has the given permission.
		 * Superadmin always returns true.
		 */
		can(permission: PermissionKey): boolean {
			if (state.role === 'superadmin') return true;
			return state.permissions.includes(permission);
		},

		/**
		 * Returns true if the current user has ANY of the given permissions.
		 */
		canAny(...perms: PermissionKey[]): boolean {
			if (state.role === 'superadmin') return true;
			return perms.some((p) => state.permissions.includes(p));
		},

		/**
		 * Returns true if the current user has ALL of the given permissions.
		 */
		canAll(...perms: PermissionKey[]): boolean {
			if (state.role === 'superadmin') return true;
			return perms.every((p) => state.permissions.includes(p));
		},

		clear() {
			state.user = null;
			state.role = null;
			state.phcId = null;
			state.staffId = null;
			state.permissions = [];
		}
	};
}

export const sessionStore = createSessionStore();

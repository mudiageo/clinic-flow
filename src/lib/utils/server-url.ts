import { BACKEND_HOST, BACKEND_INSECURE } from '$app/env/public';

/**
 * Returns the ClinicFlow backend server base URL.
 *
 * Resolution order:
 *  1. BACKEND_HOST env var (baked at build time) — used for Tauri builds pointing
 *     to a cloud or local server (e.g. "clinicflow.org" or "192.168.1.45:3000").
 *  2. Falls back to the current page origin for PWA / Web where the frontend
 *     is served directly by the SvelteKit backend.
 */
export function getServerUrl(): string {
	if (BACKEND_HOST) {
		const protocol = BACKEND_INSECURE === 'true' ? 'http' : 'https';
		return `${protocol}://${BACKEND_HOST}`;
	}
	// PWA / Web: the SvelteKit frontend IS the backend
	if (typeof window !== 'undefined') {
		return window.location.origin;
	}
	return '';
}

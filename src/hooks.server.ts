import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { building } from '$app/env';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
	// If SvelteKit is building (pre-rendering static files), bypass auth checks
	if (building) {
		return resolve(event);
	}

	// First, let Better Auth handle its own API endpoints (e.g. /api/auth/*)
	if (event.url.pathname.startsWith('/api/auth/')) {
		return svelteKitHandler({ event, resolve, auth, building });
	}

	// Fetch the session and populate locals
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	const pathname = event.url.pathname;

	// Define public routes
	const isPublic = pathname === '/' || 
		pathname.startsWith('/login') || 
		pathname.startsWith('/waiting-room') || 
		pathname.startsWith('/api/') || 
		pathname.startsWith('/demo') || 
		pathname.startsWith('/_app') || 
		pathname.startsWith('/favicon.ico');

	// Enforce role-based routing checks
	if (!isPublic) {
		if (!event.locals.session) {
			redirect(302, '/login');
		}

		const role = (event.locals.session as any).role;
		
		if (pathname.startsWith('/admin') && role !== 'admin') {
			redirect(302, '/login');
		}
		if (pathname.startsWith('/nurse') && role !== 'nurse') {
			redirect(302, '/login');
		}
		if (pathname.startsWith('/doctor') && role !== 'doctor') {
			redirect(302, '/login');
		}
		if (pathname.startsWith('/pharmacy') && role !== 'pharmacy') {
			redirect(302, '/login');
		}
	}

	return resolve(event);
};

import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { building } from '$app/env';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { db } from '$lib/server/db';
import { startSmsWorker } from '$lib/server/sms/worker';

if (!building) {
	startSmsWorker();
}

export const handle: Handle = async ({ event, resolve }) => {
	if (building) return resolve(event);

	// Let Better Auth handle its own API endpoints
	if (event.url.pathname.startsWith('/api/auth/')) {
		return svelteKitHandler({ event, resolve, auth, building });
	}

	// Fetch session and populate locals
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;

		// Fetch staff record to get phcId and role
		const staffRecord = await db.query.staff.findFirst({
			where: (s, { eq }) => eq(s.authUserId, session.user.id)
		});
		event.locals.phcId = staffRecord?.phcId ?? null;
		event.locals.staffId = staffRecord?.id ?? null;
		event.locals.role =
			(staffRecord?.role as 'receptionist' | 'nurse' | 'doctor' | 'pharmacy' | 'admin') ??
			(session.session as any).role ??
			null;
	}

	const pathname = event.url.pathname;

	// Public routes — no auth required
	const isPublic =
		pathname === '/' ||
		pathname.startsWith('/login') ||
		pathname.startsWith('/waiting-room') ||
		pathname.startsWith('/api/') ||
		pathname.startsWith('/demo') ||
		pathname.startsWith('/_app') ||
		pathname === '/favicon.ico';

	if (!isPublic) {
		if (!event.locals.session) {
			redirect(302, '/login');
		}

		const role = event.locals.role;

		// Admin can access all routes
		if (role !== 'admin') {
			if (pathname.startsWith('/nurse') && role !== 'nurse') {
				redirect(302, '/login');
			}
			if (pathname.startsWith('/doctor') && role !== 'doctor') {
				redirect(302, '/login');
			}
			if (pathname.startsWith('/pharmacy') && role !== 'pharmacy') {
				redirect(302, '/login');
			}
			if (pathname.startsWith('/admin')) {
				redirect(302, '/login');
			}
		}
	}

	return resolve(event);
};

import type { Handle } from '@sveltejs/kit';
import { ALLOWED_ORIGINS } from '$app/env/private';
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

	// Determine allowed origins dynamically
	const customOrigins = ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) || [];
	const allAllowedOrigins = [
		'http://localhost:5173',
		'http://localhost:1420',
		'tauri://localhost',
		'https://tauri.localhost',
		'http://localhost',
		...customOrigins
	];

	const origin = event.request.headers.get('origin');
	const isRemotePath = event.url.pathname.startsWith('/_app/remote/');
	const isRemoteCall = event.request.headers.has('X-SvelteKit-Remote');
	const isAllowedOrigin = origin !== null && allAllowedOrigins.includes(origin);
	const isGetRequest = event.request.method === 'GET' || event.request.method === 'HEAD';

	// CORS preflight for the custom header
	if (event.request.method === 'OPTIONS') {
		const requestHeaders =
			event.request.headers.get('access-control-request-headers') ??
			'content-type,x-sveltekit-remote';
		const allowedOrigin = isAllowedOrigin ? origin! : allAllowedOrigins[0];

		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': allowedOrigin,
				'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
				'Access-Control-Allow-Headers': requestHeaders,
				'Access-Control-Allow-Credentials': 'true',
				'Access-Control-Max-Age': '600',
				Vary: 'Origin'
			}
		});
	}

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
		pathname.startsWith('/register') ||
		pathname.startsWith('/download') ||
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

		// Superadmin and Admin can access standard clinic routes
		if (role !== 'admin' && role !== 'superadmin') {
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
		
		if (pathname.startsWith('/superadmin') && role !== 'superadmin') {
			redirect(302, '/login');
		}
	}

	const res = await resolve(event);

	if (isRemotePath || isRemoteCall) {
		res.headers.append('Vary', 'Origin');
		if (isAllowedOrigin) {
			res.headers.set('Access-Control-Allow-Origin', origin!);
			res.headers.set('Access-Control-Allow-Credentials', 'true');
		} else if (isGetRequest) {
			res.headers.set('Access-Control-Allow-Origin', origin ?? '*');
		}
	}

	return res;
};

import type { Handle } from '@sveltejs/kit';
import { ALLOWED_ORIGINS } from '$app/env/private';
import { redirect } from '@sveltejs/kit';
import { building } from '$app/env';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { db } from '$lib/server/db';
import { startSmsWorker } from '$lib/server/sms/worker';
import { DATABASE_URL, PORT } from '$app/env/private';
import { ROLE_DEFAULTS } from '$lib/config/role-defaults';
import { DASHBOARD_MODULES } from '$lib/config/dashboard-modules';

if (!building) {
	startSmsWorker();

	// mDNS broadcasting — only on local master server (SQLite/libsql mode)
	// This advertises the server as "clinicflow-server.local" on the clinic Wi-Fi
	// so tablets can find it automatically without knowing the IP address.
	const isLocalServer =
		DATABASE_URL.startsWith('file:') ||
		DATABASE_URL.startsWith('libsql:') ||
		DATABASE_URL.endsWith('.db');

	if (isLocalServer) {
		import('bonjour-service').then(({ Bonjour }) => {
			const bonjour = new Bonjour();
			const port = Number(PORT);

			bonjour.publish({
				name: 'ClinicFlow Master Server',
				type: 'http',
				port,
				host: 'clinicflow.local',
				txt: { version: '1', app: 'clinicflow' }
			});

			console.log(`[mDNS] Broadcasting as "clinicflow-server.local" on port ${port}`);

			// Graceful shutdown
			process.on('SIGTERM', () => bonjour.destroy());
			process.on('SIGINT', () => bonjour.destroy());
		}).catch((e) => console.warn('[mDNS] bonjour-service unavailable:', e.message));
	}
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
		'http://tauri.localhost',
		'asset://localhost',
		'http://localhost',
		...customOrigins
	];

	const origin = event.request.headers.get('origin');
	const isRemotePath = event.url.pathname.startsWith('/_app/remote/');
	const isRemoteCall = event.request.headers.has('X-SvelteKit-Remote');
	const isGetRequest = event.request.method === 'GET' || event.request.method === 'HEAD';
	
	// Permissive check to handle Tauri's dynamic ports (e.g. http://tauri.localhost:1430)
	const isAllowedOrigin = origin !== null && (
		allAllowedOrigins.includes(origin) ||
		origin.includes('tauri.localhost') ||
		origin.includes('localhost') ||
		origin.startsWith('tauri://') ||
		origin.startsWith('asset://') ||
		allAllowedOrigins.includes('*')
	);



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
			(staffRecord?.role as 'receptionist' | 'nurse' | 'doctor' | 'pharmacy' | 'admin' | 'superadmin' | 'oic' | 'cho' | 'nurse_midwife' | 'chew' | 'jchew' | 'eho') ??
			(session.session as any).role ??
			null;

		// Calculate active permissions
		let activePermissions: string[] = [];
		if (event.locals.role) {
			activePermissions = [...(ROLE_DEFAULTS[event.locals.role] || [])];
		}
		
		if (staffRecord) {
			const overrides = await db.query.permissions.findMany({
				where: (p, { eq }) => eq(p.staffId, staffRecord.id)
			});
			
			// Apply overrides (currently we only support granting, but if revoked=true existed we'd filter them out)
			// Assuming the schema has a 'revoked' boolean flag
			for (const override of overrides) {
				if (override.revoked) {
					activePermissions = activePermissions.filter(p => p !== override.permission);
				} else if (!activePermissions.includes(override.permission)) {
					activePermissions.push(override.permission);
				}
			}
		}
		event.locals.permissions = activePermissions;
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
		pathname.startsWith('/welcome') ||
		pathname.startsWith('/connect') ||
		pathname.startsWith('/onboarding') ||
		pathname === '/favicon.ico';

	if (!isPublic) {
		if (!event.locals.session) {
			redirect(302, '/login');
		}

		const role = event.locals.role;
		const permissions = event.locals.permissions || [];

		if (pathname.startsWith('/superadmin') && role !== 'superadmin') {
			redirect(302, '/login');
		}

		// Use DASHBOARD_MODULES to enforce permissions dynamically
		// We sort by length descending to match more specific paths first (e.g. /nurse/register before /nurse)
		const sortedModules = [...DASHBOARD_MODULES].sort((a, b) => b.href.length - a.href.length);
		
		const matchedModule = sortedModules.find(m => pathname.startsWith(m.href));
		if (matchedModule) {
			if (!permissions.includes(matchedModule.permission) && role !== 'superadmin') {
				// User does not have the required permission for this route
				redirect(302, '/dashboard');
			}
		} else if (role !== 'superadmin' && role !== 'admin') {
			// If it's not a known module, we can fallback to basic role logic for unmapped legacy paths
			if (pathname.startsWith('/admin') && role !== 'oic') {
				redirect(302, '/dashboard');
			}
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

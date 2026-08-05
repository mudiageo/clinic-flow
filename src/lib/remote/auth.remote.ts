import { form, query } from '$app/server';
import { getRequestEvent } from '$app/server';
import { auth } from '$lib/server/auth';
import { invalid, redirect, isRedirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { db } from '$lib/server/db';
import { phcs, staff } from '$lib/server/db/schema';
import { APIError } from 'better-auth/api';
import { eq, sql } from 'drizzle-orm';

export const signInAction = form(
	v.object({
		email: v.pipe(v.string(), v.nonEmpty('Email is required')),
		password: v.pipe(v.string(), v.nonEmpty('Password is required'))
	}),
	async (data, issue) => {
		const event = getRequestEvent();
		try {
			await auth.api.signInEmail({
				body: {
					email: data.email,
					password: data.password
				}
			});

			// Redirect to role appropriate dashboard
			const userRecord = await db.query.user.findFirst({
				where: (u, { eq }) => eq(u.email, data.email)
			});

			if (userRecord) {
				const staffMember = await db.query.staff.findFirst({
					where: (s, { eq }) => eq(s.authUserId, userRecord.id)
				});
				const role = staffMember?.role ?? 'nurse';
				if (role === 'admin') redirect(302, '/admin');
				if (role === 'doctor') redirect(302, '/doctor');
				if (role === 'pharmacy') redirect(302, '/pharmacy');
				redirect(302, '/nurse');
			}
			redirect(302, '/login');
		} catch (err: any) {
			if (isRedirect(err)) {
				throw err; // Pass redirects through to SvelteKit
			}
			console.log(err);
			if (err instanceof APIError) {
				invalid(issue(err.message));
			}
		}
	}
);

export const getCurrentSession = query(async () => {
	const event = getRequestEvent();
	return {
		user: event.locals.user ?? null,
		session: event.locals.session ?? null,
		phcId: event.locals.phcId ?? null,
		role: event.locals.role ?? null
	};
});

export const getStaffForLogin = query(async () => {
	const staffList = await db.query.staff.findMany({
		where: (s, { eq }) => eq(s.active, true),
		columns: {
			id: true,
			fullName: true,
			role: true
		},
		with: {
			user: {
				columns: {
					email: true
				}
			}
		}
	});
	return staffList;
});

export const getUserProfile = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.user || !event.locals.staffId) return null;

	const staffMember = await db.query.staff.findFirst({
		where: eq(staff.id, event.locals.staffId),
		with: {
			phcs: true
		}
	});

	if (!staffMember) return null;

	return {
		staffId: staffMember.id,
		name: staffMember.fullName,
		email: event.locals.user.email,
		role: staffMember.role,
		phcName: staffMember.phcs?.name ?? 'Unknown Facility'
	};
});

export const updateProfile = form(
	v.object({
		name: v.string()
	}),
	async (data) => {
		const event = getRequestEvent();
		if (!event.locals.user || !event.locals.staffId) return invalid('Unauthorized');
		
		await db.update(staff)
			.set({ fullName: data.name })
			.where(eq(staff.id, event.locals.staffId));
			
		// Also update Better Auth user
		// We use direct DB since better auth user update is admin API
		// Note: The `users` table is maintained by Better Auth
		await db.execute(sql`UPDATE "user" SET name = ${data.name} WHERE id = ${event.locals.user.id}`);
		
		return { success: true };
	}
);

export const updatePassword = form(
	v.object({
		newPassword: v.string(),
		currentPassword: v.string()
	}),
	async (data, issue) => {
		const event = getRequestEvent();
		try {
			await auth.api.changePassword({
				body: {
					newPassword: data.newPassword,
					currentPassword: data.currentPassword
				},
				headers: event.request.headers
			});
			return { success: true };
		} catch (e: any) {
			if (e instanceof APIError) {
				return invalid(issue(e.message));
			}
			return invalid(issue('Failed to change password'));
		}
	}
);

export const getUserPreferences = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.staffId) return null;
	const staffMember = await db.query.staff.findFirst({
		where: eq(staff.id, event.locals.staffId)
	});
	if (staffMember?.preferences) {
		return JSON.parse(staffMember.preferences);
	}
	return {
		emailAlerts: true,
		smsAlerts: false,
		inAppUrgent: true,
		inAppRoutine: true,
		syncUpdates: false
	};
});

export const updatePreferences = form(
	v.object({
		emailAlerts: v.boolean(),
		smsAlerts: v.boolean(),
		inAppUrgent: v.boolean(),
		inAppRoutine: v.boolean(),
		syncUpdates: v.boolean()
	}),
	async (data) => {
		const event = getRequestEvent();
		if (!event.locals.staffId) return invalid('Unauthorized');
		await db.update(staff)
			.set({ preferences: JSON.stringify(data) })
			.where(eq(staff.id, event.locals.staffId));
		return { success: true };
	}
);

export const getActiveSessions = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.user) return [];
	
	const sessions = await auth.api.listSessions({
		headers: event.request.headers
	});
	return sessions ?? [];
});

export const revokeSessionRemote = form(
	v.object({
		sessionToken: v.string()
	}),
	async (data) => {
		const event = getRequestEvent();
		await auth.api.revokeSession({
			body: { token: data.sessionToken },
			headers: event.request.headers
		});
		return { success: true };
	}
);

export const signOutAction = form(v.object({}), async () => {
	const event = getRequestEvent();
	await auth.api.signOut({
		headers: event.request.headers
	});
	redirect(302, '/login');
});

export const registerAction = form(
	v.object({
		phcName: v.pipe(v.string(), v.nonEmpty('PHC Name is required')),
		state: v.pipe(v.string(), v.nonEmpty('State is required')),
		lga: v.pipe(v.string(), v.nonEmpty('LGA is required')),
		adminName: v.pipe(v.string(), v.nonEmpty('Admin Name is required')),
		email: v.pipe(v.string(), v.email('Invalid email')),
		password: v.pipe(v.string(), v.minLength(8, 'Password must be at least 8 characters'))
	}),
	async (data, issue) => {
		try {
			// 1. Create PHC
			const [newPhc] = await db
				.insert(phcs)
				.values({
					name: data.phcName,
					state: data.state,
					lga: data.lga
				})
				.returning();

			// 2. Register User via Better Auth
			const res = await auth.api.signUpEmail({
				body: {
					email: data.email,
					password: data.password,
					name: data.adminName
				}
			});

			if (!res?.user) {
				return invalid(issue('email', 'Failed to create user account'));
			}

			// 3. Create Admin Staff Record
			await db.insert(staff).values({
				authUserId: res.user.id,
				fullName: data.adminName,
				phcId: newPhc.id,
				role: 'admin',
				active: true // Instant access for Demo Day
			});

			redirect(302, '/login?registered=true');
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			return invalid(issue('email', error.message || 'Registration failed'));
		}
	}
);

// ─────────────────────────────────────────────────────────────
// OFFLINE KIOSK LOGIN (PIN-BASED)
// ─────────────────────────────────────────────────────────────

import { verifyPassword } from 'better-auth/crypto';
import { randomBytes, randomUUID } from 'node:crypto';

export const signInWithPin = form(
	v.object({
		staffId: v.string(),
		pin: v.string()
	}),
	async (data, issue) => {
		const event = getRequestEvent();
		
		// 1. Get staff member and their PIN hash
		const staffMember = await db.query.staff.findFirst({
			where: eq(staff.id, data.staffId),
			with: { user: true } // Need authUserId
		});

		if (!staffMember || !staffMember.pin) {
			return invalid(issue('pin', 'Invalid PIN or PIN not set for this user'));
		}

		// 2. Verify PIN using Argon2
		const isValid = await verifyPassword({ hash: staffMember.pin, password: data.pin });
		if (!isValid) {
			return invalid(issue('pin', 'Incorrect PIN. Please try again.'));
		}

		// 3. Create BetterAuth Session manually in the database
		const sessionToken = randomBytes(32).toString('hex');
		const sessionId = randomUUID();
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days for kiosks

		// BetterAuth creates the 'session' table automatically
		await db.execute(sql`
			INSERT INTO "session" (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id)
			VALUES (${sessionId}, ${expiresAt}, ${sessionToken}, NOW(), NOW(), ${event.getClientAddress()}, ${event.request.headers.get('user-agent')}, ${staffMember.authUserId})
		`);

		// 4. Set the BetterAuth session cookie
		const secure = event.url.protocol === 'https:';
		event.cookies.set('better-auth.session_token', sessionToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure,
			expires: expiresAt
		});

		// 5. Redirect based on role
		const role = staffMember.role ?? 'nurse';
		if (role === 'admin') redirect(302, '/admin');
		if (role === 'doctor') redirect(302, '/doctor');
		if (role === 'pharmacy') redirect(302, '/pharmacy');
		redirect(302, '/nurse');
	}
);

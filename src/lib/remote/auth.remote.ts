import { form, query } from '$app/server';
import { getRequestEvent } from '$app/server';
import { auth } from '$lib/server/auth';
import { invalid, redirect, isRedirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { db } from '$lib/server/db';
import { phcs, staff } from '$lib/server/db/schema';
import { APIError } from 'better-auth/api';

export const signInAction = form(
	v.object({
		email: v.pipe(v.string(), v.nonEmpty('Email is required')),
		password: v.pipe(v.string(), v.nonEmpty('Password is required')),
	}),
	async (data, issue) => {
		const event = getRequestEvent();
		try {
			await auth.api.signInEmail({
				body: {
					email: data.email,
					password: data.password,
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
			console.log(err)
			if (err instanceof APIError) {
				invalid(
					issue.qty(err.message)
				);
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
		role: event.locals.role ?? null,
	};
});

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
		password: v.pipe(v.string(), v.minLength(8, 'Password must be at least 8 characters')),
	}),
	async (data) => {
		try {
			// 1. Create PHC
			const [newPhc] = await db.insert(phcs).values({
				name: data.phcName,
				state: data.state,
				lga: data.lga
			}).returning();

			// 2. Register User via Better Auth
			const res = await auth.api.signUpEmail({
				body: {
					email: data.email,
					password: data.password,
					name: data.adminName
				}
			});

			if (!res?.user) {
				throw new Error('Failed to create user account');
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
			throw new Error(error.message || 'Registration failed');
		}
	}
);

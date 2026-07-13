import { form, query } from '$app/server';
import { getRequestEvent } from '$app/server';
import { auth } from '$lib/server/auth';
import { redirect, isRedirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { db } from '$lib/server/db';

export const signInAction = form(
	v.object({
		email: v.pipe(v.string(), v.nonEmpty('Email is required')),
		password: v.pipe(v.string(), v.nonEmpty('Password is required')),
	}),
	async (data) => {
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
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error; // Pass redirects through to SvelteKit
			}
			throw new Error(error.message || 'Invalid email or password');
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

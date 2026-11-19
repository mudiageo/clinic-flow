import {
	ORIGIN,
	BETTER_AUTH_SECRET,
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	DATABASE_URL
} from '$app/env/private';

import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '#lib/server/db/index.ts';

const isLibSql =
	DATABASE_URL?.startsWith('file:') ||
	DATABASE_URL?.startsWith('libsql:') ||
	DATABASE_URL?.endsWith('.db');

export const auth = betterAuth({
	baseURL: ORIGIN,
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: isLibSql ? 'sqlite' : 'pg' }),
	emailAndPassword: { enabled: true },
	socialProviders: {
		github: {
			clientId: GITHUB_CLIENT_ID ?? '',
			clientSecret: GITHUB_CLIENT_SECRET ?? ''
		}
	},
	session: {
		additionalFields: {
			role: {
				type: 'string',
				required: false
			}
		}
	},
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					const staffMember = await db.query.staff.findFirst({
						where: (s, { eq }) => eq(s.authUserId, session.userId)
					});
					if (staffMember) {
						return {
							data: {
								...session,
								role: staffMember.role
							}
						};
					}
					return { data: session };
				}
			}
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});

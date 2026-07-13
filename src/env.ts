import { defineEnvVars } from '@sveltejs/kit/hooks';
import * as v from 'valibot';

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Postgres database connection URL string',
		schema: v.pipe(v.string(), v.nonEmpty('DATABASE_URL must be a non-empty string'))
	},
	BETTER_AUTH_SECRET: {
		description: 'Better Auth secret key used to sign and encrypt session cookies',
		schema: v.pipe(v.string(), v.nonEmpty('BETTER_AUTH_SECRET must be a non-empty string'))
	},
	ORIGIN: {
		description: 'The base public deployment origin URL for the application (e.g. http://localhost:5173)',
		schema: v.pipe(v.string(), v.nonEmpty('ORIGIN must be a non-empty string'))
	},
	GITHUB_CLIENT_ID: {
		description: 'Optional GitHub OAuth Application Client ID credentials',
		schema: v.optional(v.string())
	},
	GITHUB_CLIENT_SECRET: {
		description: 'Optional GitHub OAuth Application Client Secret credentials',
		schema: v.optional(v.string())
	},
});

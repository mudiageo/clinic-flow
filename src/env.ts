import { defineEnvVars } from '@sveltejs/kit/env';
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
		description:
			'The base public deployment origin URL for the application (e.g. http://localhost:5173)',
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
	GITHUB_TOKEN: {
		description: 'Optional GitHub token used by the release publish adapter',
		schema: v.optional(v.string())
	},
	NHIS_API_URL: {
		description: 'Optional private NHIS/HMO claims endpoint URL (no public API is assumed)',
		schema: v.optional(v.string())
	},
	NHIS_API_KEY: {
		description: 'Optional API key for the private NHIS/HMO claims endpoint',
		schema: v.optional(v.string())
	},
	HFR_API_KEY: {
		description: 'Optional API key for the read-only Nigeria Health Facility Registry',
		schema: v.optional(v.string())
	},
	HFR_API_URL: {
		description: 'Optional override for the Nigeria Health Facility Registry API base URL',
		schema: v.optional(v.string())
	},
	GEMINI_API_KEY: {
		description: 'Google Gemini API Key for AI Voice Intake',
		schema: v.optional(v.string())
	},
	TERMII_API_KEY: {
		description: 'Optional Termii API Key for SMS reminders',
		schema: v.optional(v.string())
	},
	TERMII_SENDER_ID: {
		description: 'Optional Termii Sender ID for SMS reminders',
		schema: v.optional(v.string())
	},
	BACKEND_HOST: {
		description: 'The API host for Tauri clients to forward remote calls to',
		public: true,
		static: true,
		schema: v.optional(v.string())
	},
	PORT: {
		description: 'The port the server runs on',
		schema: v.optional(v.string(), '3000')
	},
	BACKEND_INSECURE: {
		description: 'Set to "true" to disable HTTPS when forwarding to BACKEND_HOST',
		public: true,
		static: true,
		schema: v.optional(v.string())
	},
	ALLOWED_ORIGINS: {
		description: 'Comma separated list of allowed CORS origins for remote functions',
		schema: v.optional(v.string())
	}
});

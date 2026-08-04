import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

/**
 * Dual-driver database connection.
 *
 * Driver is chosen at runtime based on DATABASE_URL format:
 *
 *  - "postgres://..."  or "postgresql://..." → PostgreSQL (cloud deployment)
 *  - "file:..."        or "libsql://..."     → libsql / SQLite (local master server)
 *
 * This means the exact same codebase, with zero code changes, runs on:
 *   1. The managed ClinicFlow cloud (PostgreSQL via Neon/Supabase)
 *   2. A clinic's offline Windows PC master server (SQLite via libsql)
 */
const url = env.DATABASE_URL;
const isLibSql = url.startsWith('file:') || url.startsWith('libsql:') || url.endsWith('.db');

function createDb() {
	if (isLibSql) {
		// Local master server — SQLite via libsql
		const { drizzle } = await import('drizzle-orm/libsql');
		const { createClient } = await import('@libsql/client');
		const schema = await import('./schema.sqlite');
		const client = createClient({ url });
		return drizzle(client, { schema });
	} else {
		// Cloud deployment — PostgreSQL
		const { drizzle } = await import('drizzle-orm/postgres-js');
		const { default: postgres } = await import('postgres');
		const schema = await import('./schema');
		const client = postgres(url);
		return drizzle(client, { schema });
	}
}

export const db = await createDb();

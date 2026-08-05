import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const url = process.env.DATABASE_URL;
const isLibSql = url.startsWith('file:') || url.startsWith('libsql:') || url.endsWith('.db');

export default defineConfig(
	isLibSql
		? {
				// Local master server — SQLite via libsql
				dialect: 'turso',
				schema: './src/lib/server/db/schema.sqlite.ts',
				dbCredentials: { url },
				verbose: true,
				strict: true
			}
		: {
				// Cloud deployment — PostgreSQL
				dialect: 'postgresql',
				schema: './src/lib/server/db/schema.ts',
				dbCredentials: { url },
				verbose: true,
				strict: true
			}
);

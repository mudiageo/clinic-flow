import { query, form, command } from '$app/server';
import { db } from '$lib/server/db';
import * as v from 'valibot';

export const checkServerStatus = query(async () => {
	// Check if there are any PHCs registered in the database
	const phc = await db.query.phcs.findFirst();
	
	return {
		isConfigured: !!phc
	};
});

export const initDatabase = command(
	v.object({}),
	async () => {
		const isLocalServer = process.env.DATABASE_URL?.startsWith('file:') || process.env.DATABASE_URL?.startsWith('libsql:');
		const isLocalPostgres = process.env.DATABASE_URL?.includes('localhost');
		
		if (isLocalServer) {
			console.log('Running local migrations for SQLite/libsql...');
			const { migrate } = await import('drizzle-orm/libsql/migrator');
			await migrate(db as any, { migrationsFolder: './drizzle/sqlite' });
		} else if (isLocalPostgres) {
			console.log('Running local migrations for Postgres...');
			const { migrate } = await import('drizzle-orm/postgres-js/migrator');
			await migrate(db as any, { migrationsFolder: './drizzle/postgres' });
		} else {
			// On the cloud server, we bypass migrations as they are handled by CI/CD
			console.log('Skipping migrations on cloud server.');
		}
		
		return { success: true };
	}
);

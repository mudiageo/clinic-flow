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
		// Server-side initialization logic (e.g. running migrations, seeding basic indices)
		await new Promise(r => setTimeout(r, 2000));
		return { success: true };
	}
);

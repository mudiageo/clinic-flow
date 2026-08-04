import { query } from '$app/server';
import { db } from '$lib/server/db';
import { phcs } from '$lib/server/db/schema';

export const checkServerStatus = query(async () => {
	// Check if there are any PHCs registered in the database
	const existingPhcs = await db.select().from(phcs).limit(1);
	
	return {
		isConfigured: existingPhcs.length > 0
	};
});

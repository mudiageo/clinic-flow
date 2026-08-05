import { query } from '$app/server';
import { db } from '$lib/server/db';

export const checkServerStatus = query(async () => {
	// Check if there are any PHCs registered in the database
	const phc = await db.query.phcs.findFirst();
	
	return {
		isConfigured: !!phc
	};
});

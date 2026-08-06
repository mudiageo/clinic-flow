import { query, command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { db as serverDb } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';

function requireAuth() {
	const event = getRequestEvent();
	if (!event?.locals.user) {
		error(401, 'UNAUTHORIZED');
	}
	return event.locals;
}

export const exportPhcData = query(v.string(), async (phcId) => {
	requireAuth();
	
	const patients = await serverDb.query.patients.findMany({ where: eq(schema.patients.phcId, phcId) });
	const staff = await serverDb.query.staff.findMany({ where: eq(schema.staff.phcId, phcId) });
	const encounters = await serverDb.query.encounters.findMany({ where: eq(schema.encounters.phcId, phcId) });
	const vitalsRecords = await serverDb.query.vitalsRecords.findMany({ 
		where: (t, { inArray }) => inArray(t.encounterId, encounters.map(e => e.id)) 
	});
	
	return {
		version: 1,
		timestamp: new Date().toISOString(),
		phcId,
		data: {
			patients,
			staff,
			encounters,
			vitalsRecords
		}
	};
});

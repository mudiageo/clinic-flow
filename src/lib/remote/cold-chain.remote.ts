import { query, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { desc, eq } from 'drizzle-orm';
import { database, getTable } from '#lib/server/db/queries/_core.ts';
import { hasPermission } from '#lib/server/permissions.ts';

const temperatureLogs = getTable('temperatureLogs');
const phcs = getTable('phcs');

function requireSession() {
	const event = getRequestEvent();
	if (!event?.locals.user) error(401, 'UNAUTHORIZED');
	return event.locals;
}

/**
 * Server-authoritative temperature log for the cold-chain audit trail.
 * UI writes are local-first and flow through the guarded sync push boundary.
 */
export const getTemperatureLogs = query(
	v.object({ phcId: v.pipe(v.string(), v.nonEmpty()) }),
	async ({ phcId }) => {
		const locals = requireSession();
		if (!locals.phcId || locals.phcId !== phcId) error(403, 'PHC scope mismatch');
		if (!(await hasPermission('view:cold_chain'))) error(403, 'Forbidden');

		const [scope] = await database
			.select({ enabled: phcs.coldChainEnabled })
			.from(phcs)
			.where(eq(phcs.id, phcId))
			.limit(1);
		if (!scope?.enabled) return [];

		return await database
			.select()
			.from(temperatureLogs)
			.where(eq(temperatureLogs.phcId, phcId))
			.orderBy(desc(temperatureLogs.recordedAt))
			.limit(1000);
	}
);

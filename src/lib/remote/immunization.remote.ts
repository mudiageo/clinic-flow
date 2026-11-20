import { query, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { desc, eq } from 'drizzle-orm';
import { database, getTable } from '#lib/server/db/queries/_core.ts';

const immunizationRecords = getTable('immunizationRecords');
const phcs = getTable('phcs');

function requireSession() {
	const event = getRequestEvent();
	if (!event?.locals.user) error(401, 'UNAUTHORIZED');
	return event.locals;
}

/**
 * Server-authoritative view of the EPI register for audit/reporting.
 * UI writes are local-first and flow through the guarded sync push boundary.
 */
export const getImmunizationRegister = query(
	v.object({ phcId: v.pipe(v.string(), v.nonEmpty()) }),
	async ({ phcId }) => {
		const locals = requireSession();
		if (!locals.phcId || locals.phcId !== phcId) error(403, 'PHC scope mismatch');

		const [scope] = await database
			.select({ enabled: phcs.immunizationEnabled })
			.from(phcs)
			.where(eq(phcs.id, phcId))
			.limit(1);
		if (!scope?.enabled) return [];

		return await database
			.select()
			.from(immunizationRecords)
			.where(eq(immunizationRecords.phcId, phcId))
			.orderBy(desc(immunizationRecords.administeredAt))
			.limit(1000);
	}
);

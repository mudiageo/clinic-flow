import { command, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';
import { DHIS2_DEFAULT_UIDS, type Dhis2UidConfig } from '#lib/config/dhis2.ts';
import { recordAudit } from '#lib/server/audit.ts';
import { database, getTable } from '#lib/server/db/queries/_core.ts';
import { requirePermission } from '#lib/server/permissions.ts';

export interface Dhis2ConfigSnapshot extends Dhis2UidConfig {
	configured: boolean;
	updatedAt: string | null;
}

const uid = () => v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(64));

const dhis2ConfigSchema = v.object({
	dataSetUid: uid(),
	orgUnitUid: uid(),
	totalPatientsUid: uid(),
	totalEncountersUid: uid(),
	patientsMaleUid: uid(),
	patientsFemaleUid: uid(),
	triageRedUid: uid(),
	triageAmberUid: uid(),
	triageGreenUid: uid()
});

/** PHC-scoped configuration with documented defaults for unconfigured clinics. */
export const getDhis2Config = query(async (): Promise<Dhis2ConfigSnapshot> => {
	await requirePermission('export:dhis2');
	const event = getRequestEvent();
	if (!event.locals.phcId) return { ...DHIS2_DEFAULT_UIDS, configured: false, updatedAt: null };

	const table = getTable('dhis2Configs');
	const rows = await database
		.select()
		.from(table)
		.where(eq(table.phcId, event.locals.phcId))
		.limit(1);
	const row = rows[0];
	if (!row) return { ...DHIS2_DEFAULT_UIDS, configured: false, updatedAt: null };

	return {
		dataSetUid: row.dataSetUid,
		orgUnitUid: row.orgUnitUid,
		totalPatientsUid: row.totalPatientsUid,
		totalEncountersUid: row.totalEncountersUid,
		patientsMaleUid: row.patientsMaleUid,
		patientsFemaleUid: row.patientsFemaleUid,
		triageRedUid: row.triageRedUid,
		triageAmberUid: row.triageAmberUid,
		triageGreenUid: row.triageGreenUid,
		configured: true,
		updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : null
	};
});

/** Persists the PHC's real DHIS2 UIDs. Never writes clinical values. */
export const updateDhis2Config = command(dhis2ConfigSchema, async (input) => {
	await requirePermission('export:dhis2');
	const event = getRequestEvent();
	const phcId = event.locals.phcId;
	if (!phcId) error(401, 'Unauthorized');

	const table = getTable('dhis2Configs');
	const now = new Date();
	await database
		.insert(table)
		.values({
			...input,
			phcId,
			updatedByStaffId: event.locals.staffId ?? null,
			createdAt: now,
			updatedAt: now
		})
		.onConflictDoUpdate({
			target: table.phcId,
			set: { ...input, updatedByStaffId: event.locals.staffId ?? null, updatedAt: now }
		});

	await recordAudit({
		phcId,
		staffId: event.locals.staffId ?? null,
		action: 'dhis2.config.update',
		entityType: 'dhis2_config',
		entityId: phcId,
		metadata: { configured: true }
	});

	return { success: true };
});

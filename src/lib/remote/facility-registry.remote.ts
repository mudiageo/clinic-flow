import { getRequestEvent, query } from '$app/server';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';
import { database, getTable } from '#lib/server/db/queries/_core.ts';
import {
	lookupFacilities,
	type RegistryFacility,
	type RegistryLookupResult
} from '#lib/server/integrations/facility-registry-provider.ts';
import { requirePermission } from '#lib/server/permissions.ts';

export interface FacilityReviewRow {
	phcId: string;
	phcName: string;
	state: string;
	lga: string;
	availability: RegistryLookupResult['availability'];
	matched: boolean;
	suggestions: RegistryFacility[];
	reason: string | null;
}

const lookupSchema = v.object({
	name: v.optional(v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(160))),
	state: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(80))),
	lga: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120)))
});

/**
 * Advisory lookup of the national registry. Reference data only — the result
 * never writes to a PHC and is never used as authoritative identity.
 */
export const lookupRegistryFacilities = query(lookupSchema, async (input) => {
	if (!input.name && !input.state && !input.lga) {
		return {
			availability: 'unavailable' as const,
			facilities: [],
			reason: 'Enter a name, state or LGA.',
			checkedAt: new Date().toISOString()
		};
	}
	return lookupFacilities({ ...input, limit: 10 });
});

/** Compares locally stored PHC identity with the registry; advisory only. */
export const getFacilityDataQualityReview = query(async (): Promise<FacilityReviewRow[]> => {
	await requirePermission('manage:phc');
	const event = getRequestEvent();
	const phcsTable = getTable('phcs');
	const rows = event.locals.phcId
		? await database.select().from(phcsTable).where(eq(phcsTable.id, event.locals.phcId)).limit(1)
		: await database.select().from(phcsTable).limit(20);

	const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
	const review: FacilityReviewRow[] = [];

	for (const row of rows.slice(0, 20)) {
		const result = await lookupFacilities({
			name: row.name,
			state: row.state,
			lga: row.lga,
			limit: 5
		});
		const matched = result.facilities.some(
			(facility) => normalized(facility.name) === normalized(row.name)
		);
		review.push({
			phcId: String(row.id),
			phcName: String(row.name),
			state: String(row.state),
			lga: String(row.lga),
			availability: result.availability,
			matched,
			suggestions: result.facilities,
			reason: result.reason
		});
	}

	return review;
});

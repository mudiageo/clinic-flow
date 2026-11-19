import { query, getRequestEvent } from '$app/server';
import { database, getTable } from '#lib/server/db/queries/_core.ts';
import { gte } from 'drizzle-orm';

/**
 * Keyword patterns used to derive indicative surveillance counts from encounter
 * chief complaints. This is rule-based triage data, NOT a clinical diagnosis —
 * the UI must present it as indicative only.
 */
const DISEASE_PATTERNS = [
	{ key: 'malaria', terms: ['malaria', 'fever'] },
	{ key: 'cholera', terms: ['cholera', 'diarrhea', 'diarrhoea', 'stool', 'vomit'] },
	{ key: 'measles', terms: ['measles', 'rash'] },
	{ key: 'typhoid', terms: ['typhoid'] }
] as const;

const WINDOW_DAYS = 30;

export const getOutbreakData = query(async () => {
	const event = getRequestEvent();
	if (event.locals.role !== 'superadmin') throw new Error('Unauthorized');

	const phcs = await database.query.phcs.findMany();
	if (phcs.length === 0) return [];

	const phcByLocation = new Map<string, { lga: string; state: string }>();
	for (const phc of phcs) {
		phcByLocation.set(phc.id, { lga: phc.lga, state: phc.state });
	}

	const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
	const encountersTable = getTable('encounters');
	const encounters = await database
		.select({
			phcId: encountersTable.phcId,
			chiefComplaint: encountersTable.chiefComplaint
		})
		.from(encountersTable)
		.where(gte(encountersTable.visitDate, since));

	type Counts = { malaria: number; cholera: number; measles: number; typhoid: number };
	const byLocation = new Map<string, { lga: string; state: string; cases: Counts }>();

	for (const enc of encounters) {
		const location = phcByLocation.get(enc.phcId);
		if (!location || !enc.chiefComplaint) continue;

		const complaint = enc.chiefComplaint.toLowerCase();
		const matches = DISEASE_PATTERNS.filter((pattern) =>
			pattern.terms.some((term) => complaint.includes(term))
		);
		if (matches.length === 0) continue;

		const key = `${location.state}|${location.lga}`;
		if (!byLocation.has(key)) {
			byLocation.set(key, {
				lga: location.lga,
				state: location.state,
				cases: { malaria: 0, cholera: 0, measles: 0, typhoid: 0 }
			});
		}
		const cases = byLocation.get(key)!.cases;
		for (const match of matches) cases[match.key] += 1;
	}

	return [...byLocation.values()].map((row) => {
		const total = Object.values(row.cases).reduce((sum, count) => sum + count, 0);
		return {
			...row,
			riskLevel: total >= 20 ? 'High' : total >= 8 ? 'Medium' : 'Low'
		};
	});
});

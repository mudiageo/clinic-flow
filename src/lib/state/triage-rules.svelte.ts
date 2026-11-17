import { db, type LocalTriageRule } from '#lib/local-db/db.ts';
import { CANONICAL_TRIAGE_RULES, seedId } from '#lib/seed/fixtures.ts';
import { LocalCollection } from './local-collection.svelte';

class TriageRuleStore extends LocalCollection<LocalTriageRule> {
	constructor() {
		super(db.triageRules, 'triageRules', () => db.triageRules.toArray());
	}

	activeRules = $derived(this.items.filter((rule) => rule.active));

	/** Fallback for a device with no rules yet — uses the shared canonical set. */
	async seedDefaults(phcId: string) {
		const existing = await db.triageRules.count();
		if (existing > 0) return;

		const rules: LocalTriageRule[] = CANONICAL_TRIAGE_RULES.map((rule, i) => ({
			id: seedId(`triage-rule:${phcId}:${i}`),
			phcId,
			field: rule.field,
			operator: rule.operator,
			threshold: rule.threshold,
			resultingLevel: rule.resultingLevel,
			reasonTemplate: rule.reasonTemplate,
			requiresPregnant: rule.requiresPregnant,
			active: true,
			version: 1,
			syncStatus: 'synced',
			updatedAt: Date.now()
		}));

		await db.triageRules.bulkPut(rules);
	}
}

export const triageRuleStore = new TriageRuleStore();

import { db, type LocalTriageRule } from '$lib/local-db/db';
import { LocalCollection } from './local-collection.svelte';

class TriageRuleStore extends LocalCollection<LocalTriageRule> {
	constructor() {
		super(db.triageRules, 'triageRules', () => db.triageRules.toArray());
	}

	activeRules = $derived(this.items.filter((rule) => rule.active));

	async seedDefaults(phcId: string) {
		const existing = await db.triageRules.count();
		if (existing > 0) return;

		const defaultRules: Array<Omit<LocalTriageRule, 'id' | 'updatedAt' | 'syncStatus'>> = [
			{
				phcId,
				field: 'temperatureCelsius',
				operator: 'gte',
				threshold: 39,
				resultingLevel: 'red',
				reasonTemplate: 'High Fever — {temperatureCelsius}°C',
				requiresPregnant: false,
				active: true,
				version: 1
			},
			{
				phcId,
				field: 'temperatureCelsius',
				operator: 'lte',
				threshold: 35,
				resultingLevel: 'red',
				reasonTemplate: 'Hypothermia — {temperatureCelsius}°C',
				requiresPregnant: false,
				active: true,
				version: 1
			},
			{
				phcId,
				field: 'temperatureCelsius',
				operator: 'gte',
				threshold: 37.5,
				resultingLevel: 'amber',
				reasonTemplate: 'Mild Fever — {temperatureCelsius}°C',
				requiresPregnant: false,
				active: true,
				version: 1
			},
			{
				phcId,
				field: 'systolicBp',
				operator: 'gte',
				threshold: 160,
				resultingLevel: 'red',
				reasonTemplate: 'Severe Hypertension — {systolicBp}/{diastolicBp} mmHg',
				requiresPregnant: false,
				active: true,
				version: 1
			},
			{
				phcId,
				field: 'systolicBp',
				operator: 'gte',
				threshold: 140,
				resultingLevel: 'red',
				reasonTemplate: 'Hypertension in Pregnancy — {systolicBp}/{diastolicBp} mmHg',
				requiresPregnant: true,
				active: true,
				version: 1
			},
			{
				phcId,
				field: 'systolicBp',
				operator: 'lte',
				threshold: 90,
				resultingLevel: 'amber',
				reasonTemplate: 'Hypotension — {systolicBp}/{diastolicBp} mmHg',
				requiresPregnant: false,
				active: true,
				version: 1
			},
			{
				phcId,
				field: 'pulseBpm',
				operator: 'gte',
				threshold: 120,
				resultingLevel: 'red',
				reasonTemplate: 'Tachycardia — {pulseBpm} bpm',
				requiresPregnant: false,
				active: true,
				version: 1
			},
			{
				phcId,
				field: 'spo2Percent',
				operator: 'lte',
				threshold: 92,
				resultingLevel: 'red',
				reasonTemplate: 'Low Oxygen Saturation — {spo2Percent}%',
				requiresPregnant: false,
				active: true,
				version: 1
			},
			{
				phcId,
				field: 'spo2Percent',
				operator: 'lte',
				threshold: 95,
				resultingLevel: 'amber',
				reasonTemplate: 'Borderline Oxygen — {spo2Percent}%',
				requiresPregnant: false,
				active: true,
				version: 1
			}
		];

		for (const rule of defaultRules) {
			await this.create(rule);
		}
	}
}

export const triageRuleStore = new TriageRuleStore();

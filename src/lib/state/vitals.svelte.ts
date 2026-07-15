import { db, type LocalVitalsRecord, type LocalTriageRule } from '$lib/local-db/db';
import { LocalCollection } from './local-collection.svelte';

export interface VitalsInput {
	temperatureCelsius?: number;
	systolicBp?: number;
	diastolicBp?: number;
	pulseBpm?: number;
	weightKg?: number;
	spo2Percent?: number;
}

class VitalsStore extends LocalCollection<LocalVitalsRecord> {
	constructor() {
		super(db.vitalsRecords, 'vitalsRecords', () => db.vitalsRecords.toArray());
	}

	forPatient(patientId: string): LocalVitalsRecord[] {
		return this.items
			.filter((v) => v.patientId === patientId)
			.sort((a, b) => b.recordedAt - a.recordedAt);
	}

	// Triage evaluation engine
	evaluateTriage(
		vitals: VitalsInput,
		rules: LocalTriageRule[],
		isPregnant: boolean
	): { level: 'green' | 'amber' | 'red'; reason: string } {
		const priority = { red: 2, amber: 1, green: 0 };
		let best: { level: 'green' | 'amber' | 'red'; reason: string } = {
			level: 'green',
			reason: 'Normal'
		};

		for (const rule of rules) {
			if (!rule.active) continue;
			if (rule.requiresPregnant && !isPregnant) continue;

			const val = vitals[rule.field as keyof VitalsInput];
			if (val === undefined || val === null) continue;

			let matches = false;
			if (rule.operator === 'gte' && val >= rule.threshold) matches = true;
			if (rule.operator === 'lte' && val <= rule.threshold) matches = true;
			if (rule.operator === 'gt' && val > rule.threshold) matches = true;
			if (rule.operator === 'lt' && val < rule.threshold) matches = true;
			if (rule.operator === 'eq' && val === rule.threshold) matches = true;

			if (matches && priority[rule.resultingLevel] > priority[best.level]) {
				// Interpolate templates e.g. "Mild Fever: {temperatureCelsius}°C"
				let reason = rule.reasonTemplate;
				for (const [k, v] of Object.entries(vitals)) {
					reason = reason.replace(`{${k}}`, String(v));
				}
				best = { level: rule.resultingLevel, reason };
			}
		}

		return best;
	}
}

export const vitalsStore = new VitalsStore();

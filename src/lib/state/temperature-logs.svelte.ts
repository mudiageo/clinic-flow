import { LocalCollection } from './local-collection.svelte';
import { db, type LocalTemperatureLog } from '#lib/local-db/db.ts';
import { sessionStore } from './session.svelte.ts';

interface TemperatureLogInput {
	fridgeLabel: string;
	temperatureCelsius: number;
	recordedAt?: number;
	notes?: string | null;
}

class TemperatureLogsStore extends LocalCollection<LocalTemperatureLog> {
	constructor() {
		super(db.temperatureLogs, 'temperatureLogs', () => db.temperatureLogs.toArray());
	}

	async log(input: TemperatureLogInput) {
		const fridgeLabel = input.fridgeLabel.trim();
		if (fridgeLabel === '') throw new Error('Fridge label is required.');
		if (fridgeLabel.length > 80) throw new Error('Fridge label must be 80 characters or fewer.');

		if (!Number.isFinite(input.temperatureCelsius)) {
			throw new Error('Temperature must be a finite number.');
		}
		if (input.temperatureCelsius < -50 || input.temperatureCelsius > 100) {
			throw new Error('Temperature must be between -50 and 100 degrees Celsius.');
		}

		const phcId = sessionStore.activePhcId;
		const staffId = sessionStore.staffId;
		if (!staffId) throw new Error('Cannot log temperature: no staff member is signed in.');

		const notes = input.notes?.trim();

		return this.create({
			phcId,
			fridgeLabel,
			temperatureCelsius: input.temperatureCelsius,
			recordedAt: input.recordedAt ?? Date.now(),
			recordedByStaffId: staffId,
			notes: notes ? notes : null,
			createdAt: Date.now(),
			serverUpdatedAt: null
		});
	}

	latest() {
		return this.items.reduce<LocalTemperatureLog | undefined>(
			(newest, item) => (!newest || item.recordedAt > newest.recordedAt ? item : newest),
			undefined
		);
	}
}

export const temperatureLogsStore = new TemperatureLogsStore();

import { getPhcSettings } from '../../routes/sync/sync.remote';

export type PhcSettings = {
	name?: string;
	state?: string;
	lga?: string;
	syncPollInterval: number;
	dailyPatientCapacity: number;
	maternalHealthEnabled: boolean;
	immunizationEnabled: boolean;
	aiVoiceEnabled: boolean;
	outbreakDetectionEnabled: boolean;
	twoWaySmsEnabled: boolean;
	referralsEnabled: boolean;
	familyHealthEnabled: boolean;
	realTimeNotificationsEnabled: boolean;
	nhisTrackingEnabled: boolean;
	aiAutoTriageEscalation?: boolean;
	lgaDsoPhone?: string;
};

const DEFAULT_SETTINGS: PhcSettings = {
	name: 'Demo PHC',
	state: 'Unknown',
	lga: 'Unknown',
	syncPollInterval: 15,
	dailyPatientCapacity: 100,
	maternalHealthEnabled: true,
	immunizationEnabled: true,
	aiVoiceEnabled: true,
	outbreakDetectionEnabled: true,
	twoWaySmsEnabled: true,
	referralsEnabled: true,
	familyHealthEnabled: true,
	realTimeNotificationsEnabled: true,
	nhisTrackingEnabled: true,
	aiAutoTriageEscalation: false
};

class SettingsStore {
	#settings = $state<PhcSettings>(DEFAULT_SETTINGS);

	constructor() {
		// Load from localStorage immediately for fast boot
		if (typeof localStorage !== 'undefined') {
			const cached = localStorage.getItem('phcSettings');
			if (cached) {
				try {
					this.#settings = { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
				} catch {
					// Ignore malformed cached settings and keep the safe defaults.
				}
			}
		}
	}

	get current() {
		return this.#settings;
	}

	async fetchFromServer() {
		if (typeof localStorage === 'undefined') return;
		const phcId = localStorage.getItem('clinicflow_phc_id') || '';
		if (!phcId) return;

		try {
			const serverSettings = await getPhcSettings(phcId);
			if (serverSettings) {
				this.#settings = {
					name: serverSettings.name,
					state: serverSettings.state,
					lga: serverSettings.lga,
					syncPollInterval: serverSettings.syncPollInterval,
					dailyPatientCapacity: serverSettings.dailyPatientCapacity ?? 100,
					maternalHealthEnabled: serverSettings.maternalHealthEnabled,
					immunizationEnabled: serverSettings.immunizationEnabled,
					aiVoiceEnabled: serverSettings.aiVoiceEnabled,
					outbreakDetectionEnabled: serverSettings.outbreakDetectionEnabled,
					twoWaySmsEnabled: serverSettings.twoWaySmsEnabled,
					referralsEnabled: serverSettings.referralsEnabled ?? true,
					familyHealthEnabled: serverSettings.familyHealthEnabled ?? true,
					realTimeNotificationsEnabled: serverSettings.realTimeNotificationsEnabled ?? true,
					nhisTrackingEnabled: serverSettings.nhisTrackingEnabled ?? true,
					lgaDsoPhone: serverSettings.lgaDsoPhone
				};
				localStorage.setItem('phcSettings', JSON.stringify(this.#settings));
			}
		} catch (e) {
			console.error('Failed to fetch PHC settings', e);
		}
	}

	// Local override specifically for the UI (this will be pushed back to server later if requested)
	updateLocal(settings: Partial<PhcSettings>) {
		this.#settings = { ...this.#settings, ...settings };
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('phcSettings', JSON.stringify(this.#settings));
		}
	}
}

export const settingsStore = new SettingsStore();

import { getUserProfile, getUserPreferences } from '#lib/remote/auth.remote.ts';
import { toast } from 'svelte-sonner';
import { db } from '#lib/local-db/db.ts';
import { syncStore } from '#lib/state/sync.svelte.ts';

class AuthStore {
	profile = $state<{
		staffId: string;
		name: string;
		email: string;
		role: string;
		phcName: string;
	} | null>(null);
	preferences = $state<unknown>(null);
	isLoaded = $state(false);

	constructor() {
		if (typeof window !== 'undefined') {
			this.loadFromCache();
			void this.syncWithServer();
		}
	}

	private loadFromCache() {
		const cachedProfile = localStorage.getItem('clinicflow_profile');
		if (cachedProfile) {
			try {
				this.profile = JSON.parse(cachedProfile);
			} catch {
				// Ignore a malformed optional cache and refresh from the server.
			}
		}

		const cachedPrefs = localStorage.getItem('clinicflow_prefs');
		if (cachedPrefs) {
			try {
				this.preferences = JSON.parse(cachedPrefs);
			} catch {
				// Ignore a malformed optional cache and refresh from the server.
			}
		}

		if (this.profile) this.isLoaded = true;
	}

	async syncWithServer() {
		try {
			const [serverProfile, serverPrefs] = await Promise.all([
				getUserProfile(),
				getUserPreferences()
			]);

			if (serverProfile) {
				this.profile = serverProfile;
				localStorage.setItem('clinicflow_profile', JSON.stringify(serverProfile));
			}

			if (serverPrefs) {
				this.preferences = serverPrefs;
				localStorage.setItem('clinicflow_prefs', JSON.stringify(serverPrefs));
			}

			this.isLoaded = true;
		} catch (e) {
			console.error('Failed to sync auth data with server (likely offline)', e);
			// We still consider it loaded if we have cached data
			if (this.profile) this.isLoaded = true;
		}
	}

	async updateProfile(name: string) {
		if (!this.profile) return;

		// Optimistic update
		this.profile.name = name;
		localStorage.setItem('clinicflow_profile', JSON.stringify(this.profile));

		// Queue background sync
		try {
			await db.syncLog.add({
				operationId: crypto.randomUUID(),
				entityType: 'profile',
				entityId: this.profile.staffId,
				operation: 'update',
				payload: { name },
				timestamp: Date.now(),
				baseVersion: 0,
				synced: 0
			});
			void syncStore.flush(); // Manually trigger sync
			toast.success('Profile updated');
		} catch (e) {
			console.error(e);
			toast.info('Offline: Profile saved locally and will sync later.');
		}
	}

	async updatePreferences(prefs: unknown) {
		if (!this.profile) return;

		// Optimistic update
		this.preferences = prefs;
		localStorage.setItem('clinicflow_prefs', JSON.stringify(prefs));

		// Queue background sync
		try {
			await db.syncLog.add({
				operationId: crypto.randomUUID(),
				entityType: 'preferences',
				entityId: this.profile.staffId,
				operation: 'update',
				payload: prefs,
				timestamp: Date.now(),
				baseVersion: 0,
				synced: 0
			});
			void syncStore.flush(); // Manually trigger sync
			toast.success('Preferences updated');
		} catch (e) {
			console.error(e);
			toast.info('Offline: Preferences saved locally and will sync later.');
		}
	}
}

export const authStore = new AuthStore();

import { getUserProfile, getUserPreferences, updateProfile as remoteUpdateProfile, updatePreferences as remoteUpdatePreferences } from '$lib/remote/auth.remote';
import { toast } from 'svelte-sonner';

class AuthStore {
	profile = $state<{ name: string; email: string; role: string; phcName: string } | null>(null);
	preferences = $state<any>(null);
	isLoaded = $state(false);
	
	constructor() {
		if (typeof window !== 'undefined') {
			this.loadFromCache();
			this.syncWithServer();
		}
	}

	private loadFromCache() {
		const cachedProfile = localStorage.getItem('clinicflow_profile');
		if (cachedProfile) {
			try { this.profile = JSON.parse(cachedProfile); } catch (e) {}
		}
		
		const cachedPrefs = localStorage.getItem('clinicflow_prefs');
		if (cachedPrefs) {
			try { this.preferences = JSON.parse(cachedPrefs); } catch (e) {}
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
		// Optimistic update
		if (this.profile) {
			this.profile.name = name;
			localStorage.setItem('clinicflow_profile', JSON.stringify(this.profile));
		}
		
		// Background sync
		try {
			const result = await remoteUpdateProfile.submit({ name });
			if (result?.success) {
				toast.success('Profile updated');
			} else {
				toast.error('Failed to save profile remotely, changes saved locally');
			}
		} catch (e) {
			toast.info('Offline: Profile saved locally and will sync later.');
		}
	}

	async updatePreferences(prefs: any) {
		// Optimistic update
		this.preferences = prefs;
		localStorage.setItem('clinicflow_prefs', JSON.stringify(prefs));
		
		// Background sync
		try {
			const result = await remoteUpdatePreferences.submit(prefs);
			if (result?.success) {
				toast.success('Preferences updated');
			} else {
				toast.error('Failed to save preferences remotely, changes saved locally');
			}
		} catch (e) {
			toast.info('Offline: Preferences saved locally and will sync later.');
		}
	}
}

export const authStore = new AuthStore();

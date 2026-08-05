import { getUserProfile } from '$lib/remote/auth.remote';
import { getAppSettings } from '$lib/remote/settings.remote';

export async function load() {
	const [profile, appSettings] = await Promise.all([
		getUserProfile(),
		getAppSettings()
	]);

	return {
		profile,
		appSettings
	};
}

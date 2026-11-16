import { getUserProfile } from '#lib/remote/auth.remote.ts';
import { getAppSettings } from '#lib/remote/settings.remote.ts';

export async function load() {
	const [profile, appSettings] = await Promise.all([getUserProfile(), getAppSettings()]);

	return {
		profile,
		appSettings
	};
}

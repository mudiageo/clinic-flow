import { getPhcSettings } from '$lib/remote/admin.remote';

export const load = async () => {
	const settings = await getPhcSettings();
	return { settings };
};

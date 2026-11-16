import { getPhcSettings } from '#lib/remote/admin.remote.ts';

export const load = async () => {
	const settings = await getPhcSettings();
	return { settings };
};

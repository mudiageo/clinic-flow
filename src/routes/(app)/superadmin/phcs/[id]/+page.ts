import { getPhcDetails } from '$lib/remote/superadmin.remote';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const phc = await getPhcDetails(params.id);
	if (!phc) {
		throw error(404, 'PHC not found');
	}
	return { phc };
};

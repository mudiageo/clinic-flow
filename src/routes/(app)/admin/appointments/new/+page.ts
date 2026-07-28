import { getPhcStaffList } from '$lib/remote/admin.remote';

export const load = async () => {
	const staffList = await getPhcStaffList();
	return { staffList };
};

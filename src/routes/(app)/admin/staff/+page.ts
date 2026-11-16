import { getPhcStaffList } from '#lib/remote/admin.remote.ts';

export const load = async () => {
	const staffList = await getPhcStaffList();
	return { staffList };
};

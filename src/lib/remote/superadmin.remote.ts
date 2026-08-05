import { query } from '$app/server';
import * as v from 'valibot';
import { requireSuperadmin } from '$lib/server/rbac';
import { getPhcListWithCounts, getPhcFullDetails } from '$lib/server/db/queries/phcs';
import { getAllStaffUsers } from '$lib/server/db/queries/staff';

export const getPhcList = query(async () => {
	requireSuperadmin();
	return await getPhcListWithCounts();
});

export const getPhcDetails = query(v.string(), async (id: string) => {
	requireSuperadmin();
	return await getPhcFullDetails(id);
});

export const getAllUsers = query(async () => {
	requireSuperadmin();
	return await getAllStaffUsers();
});

import { query } from '$app/server';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { staff } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { requirePermission } from '$lib/server/permissions';
import * as v from 'valibot';

export const getStaffMember = query(v.string(), async (staffId) => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
	await requirePermission(event.locals.staffId, 'manage:staff');

	return await db.query.staff.findFirst({
		where: and(eq(staff.id, staffId), eq(staff.phcId, event.locals.phcId))
	});
});

export const getPhcStaffList = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.staffId || !event.locals.phcId) throw new Error('Unauthorized');
	await requirePermission(event.locals.staffId, 'manage:staff');

	return await db.query.staff.findMany({
		where: eq(staff.phcId, event.locals.phcId),
		orderBy: (staff, { desc }) => [desc(staff.createdAt)]
	});
});

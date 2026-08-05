import { query, form } from '$app/server';

import * as v from 'valibot';
import { getRequestEvent } from '$app/server';
import { hashPassword } from 'better-auth/crypto';

import { getStaffByPhc, updateStaffPin } from '$lib/server/db/queries/staff';

export const getAllStaff = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.phcId) return [];
	return await getStaffByPhc(event.locals.phcId);
});

export const setStaffPin = form(
	v.object({
		staffId: v.string(),
		pin: v.pipe(v.string(), v.length(4), v.regex(/^\d{4}$/, 'PIN must be exactly 4 digits'))
	}),
	async (data) => {
		const event = getRequestEvent();
		if (!event.locals.phcId) throw new Error('Unauthorized');
		
		const hashedPin = await hashPassword(data.pin);
		
		await updateStaffPin(data.staffId, hashedPin);
		
		return { success: true };
	}
);

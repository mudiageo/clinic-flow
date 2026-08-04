import { query, form } from '$app/server';
import { db } from '$lib/server/db';
import { staff } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';
import { getRequestEvent } from '$app/server';
import { hash } from '@node-rs/argon2';

export const getAllStaff = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.phcId) return [];
	return await db.query.staff.findMany({
		where: eq(staff.phcId, event.locals.phcId),
		columns: { id: true, fullName: true, role: true, active: true },
		with: { user: { columns: { email: true, createdAt: true } } }
	});
});

export const setStaffPin = form(
	v.object({
		staffId: v.string(),
		pin: v.pipe(v.string(), v.length(4), v.regex(/^\d{4}$/, 'PIN must be exactly 4 digits'))
	}),
	async (data) => {
		const event = getRequestEvent();
		if (!event.locals.phcId) throw new Error('Unauthorized');
		
		const hashedPin = await hash(data.pin, { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
		
		await db.update(staff)
			// @ts-ignore
			.set({ pin: hashedPin })
			.where(eq(staff.id, data.staffId));
		
		return { success: true };
	}
);

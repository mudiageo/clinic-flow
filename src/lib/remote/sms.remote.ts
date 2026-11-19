import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { requirePermission } from '#lib/server/permissions.ts';
import { sendSms } from '#lib/server/sms/send.ts';

/** Send an outbreak/IDSR alert SMS to an LGA DSO using the clinic's configured provider. */
export const sendOutbreakAlertSms = command(
	v.object({
		phone: v.pipe(v.string(), v.minLength(10), v.maxLength(20)),
		message: v.pipe(v.string(), v.minLength(1), v.maxLength(480))
	}),
	async ({ phone, message }) => {
		const event = getRequestEvent();
		if (!event.locals.phcId) throw new Error('Unauthorized');
		await requirePermission('manage:phc');

		return sendSms({ phcId: event.locals.phcId, to: phone, message });
	}
);

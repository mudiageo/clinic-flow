import { command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { recordAudit } from '#lib/server/audit.ts';
import { getPhcSmsApiKey, dispatchSms } from '#lib/server/integrations/sms-provider.ts';
import { requirePermission } from '#lib/server/permissions.ts';

/** Sends a real test SMS, or returns an explicit console-mode result. */
export const sendTestSms = command(
	v.object({ to: v.pipe(v.string(), v.trim(), v.minLength(10), v.maxLength(20)) }),
	async ({ to }) => {
		await requirePermission('manage:phc');
		const event = getRequestEvent();
		const phcId = event.locals.phcId;
		if (!phcId) error(401, 'Unauthorized');

		const phcApiKey = await getPhcSmsApiKey(phcId);
		const result = await dispatchSms({
			phcId,
			to,
			message: 'ClinicFlow test SMS. Please ignore this message.',
			phcApiKey
		});
		if (!result.ok) error(502, result.error);

		await recordAudit({
			phcId,
			staffId: event.locals.staffId ?? null,
			action: 'sms.test',
			entityType: 'sms',
			metadata: { mode: result.mode }
		});

		return {
			success: true,
			mode: result.mode,
			reason: result.mode === 'console' ? result.reason : null,
			reference: result.data.reference
		};
	}
);

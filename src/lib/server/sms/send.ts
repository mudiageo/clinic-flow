import { database, getTable } from '#lib/server/db/queries/_core.ts';
import { eq } from 'drizzle-orm';
import { TERMII_API_KEY, TERMII_SENDER_ID } from '$app/env/private';

export type SmsResult = { ok: true; messageId: string } | { ok: false; error: string };

/**
 * Send a single SMS through Termii. Uses the PHC-specific key when configured,
 * otherwise the global key. Never fabricates success when no provider is configured.
 */
export async function sendSms({
	phcId,
	to,
	message
}: {
	phcId: string;
	to: string;
	message: string;
}): Promise<SmsResult> {
	const phc = await database.query.phcs.findFirst({
		where: eq(getTable('phcs').id, phcId)
	});

	const apiKey = phc?.termiiApiKey?.trim() || TERMII_API_KEY;
	if (!apiKey) {
		return { ok: false, error: 'SMS is not configured for this clinic.' };
	}

	try {
		const response = await fetch('https://api.ng.termii.com/api/sms/send', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				api_key: apiKey,
				to,
				from: TERMII_SENDER_ID || 'ClinicFlow',
				sms: message,
				type: 'plain',
				channel: 'generic'
			})
		});

		const data = await response.json();
		if (response.ok && data.message_id) {
			return { ok: true, messageId: String(data.message_id) };
		}
		return { ok: false, error: data.message || 'SMS provider rejected the request.' };
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : 'SMS network error.' };
	}
}

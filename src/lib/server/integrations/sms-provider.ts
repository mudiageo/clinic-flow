import { TERMII_API_KEY } from '$app/env/private';
import { eq } from 'drizzle-orm';
import { database, getTable } from '#lib/server/db/queries/_core.ts';
import { sendSms } from '#lib/server/sms/send.ts';
import {
	consoleReference,
	getMissingProviderKeys,
	getProviderMode,
	logConsolePayload,
	type ProviderResult
} from './external-provider';

export interface SmsDispatchInput {
	phcId: string;
	to: string;
	message: string;
	/** PHC-level key resolved by the caller when available. */
	phcApiKey?: string | null;
}

export interface SmsDispatchData {
	messageId: string | null;
	/** A reference that is safe to store and display in either mode. */
	reference: string;
}

/**
 * Sends one SMS through the existing Termii implementation. Without any
 * configured key the payload is not sent; only non-identifying metadata is
 * logged and an explicit console-mode result is returned.
 */
export async function dispatchSms(
	input: SmsDispatchInput
): Promise<ProviderResult<SmsDispatchData>> {
	const config = {
		name: 'termii',
		env: { TERMII_API_KEY },
		requiredKeys: ['TERMII_API_KEY'] as const
	};

	const phcConfigured = Boolean(input.phcApiKey?.trim());
	if (!phcConfigured && getProviderMode(config) === 'console') {
		const reason = `SMS provider not configured (missing: ${getMissingProviderKeys(config).join(', ')})`;
		logConsolePayload('termii', 'dispatchSms', {
			phcId: input.phcId,
			messageLength: input.message.length,
			reason
		});
		return {
			ok: true,
			mode: 'console',
			reason,
			data: { messageId: null, reference: consoleReference('sms') }
		};
	}

	try {
		const result = await sendSms({ phcId: input.phcId, to: input.to, message: input.message });
		if (!result.ok) return { ok: false, mode: 'live', error: result.error };
		return {
			ok: true,
			mode: 'live',
			data: { messageId: result.messageId, reference: result.messageId }
		};
	} catch (error) {
		return {
			ok: false,
			mode: 'live',
			error: error instanceof Error ? error.message : 'SMS delivery failed'
		};
	}
}

/** Resolves the PHC-level API key for the adapter without exposing it to clients. */
export async function getPhcSmsApiKey(phcId: string): Promise<string | null> {
	const row = await database
		.select({ termiiApiKey: getTable('phcs').termiiApiKey })
		.from(getTable('phcs'))
		.where(eq(getTable('phcs').id, phcId))
		.limit(1);
	return row[0]?.termiiApiKey ?? null;
}

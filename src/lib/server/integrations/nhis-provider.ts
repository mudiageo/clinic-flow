import { NHIS_API_KEY, NHIS_API_URL } from '$app/env/private';
import {
	consoleReference,
	getMissingProviderKeys,
	getProviderMode,
	logConsolePayload,
	type ProviderResult
} from './external-provider';

export interface NhisClaimSubmission {
	claimReference: string;
	encounterId: string | null;
	patientId: string | null;
	payload: Record<string, unknown>;
}

export interface NhisClaimDelivery {
	reference: string;
	providerReference: string | null;
}

const REQUIRED_KEYS = ['NHIS_API_URL', 'NHIS_API_KEY'] as const;

/**
 * Opt-in override for a PRIVATE NHIS/HMO claims endpoint. Nigeria has no
 * documented public claims API, so the default path is a manual submission
 * queue; this adapter is only used when both env vars are configured.
 */
export async function submitNhisClaim(
	input: NhisClaimSubmission
): Promise<ProviderResult<NhisClaimDelivery>> {
	const config = {
		name: 'nhis',
		env: { NHIS_API_URL, NHIS_API_KEY },
		requiredKeys: REQUIRED_KEYS
	};

	if (getProviderMode(config) === 'console') {
		const reason = `Private claims endpoint not configured (missing: ${getMissingProviderKeys(config).join(', ')})`;
		// Never log patient or clinical payloads. Only an operational reference.
		logConsolePayload('nhis', 'submitClaim', {
			claimReference: input.claimReference,
			reason
		});
		return {
			ok: true,
			mode: 'console',
			reason,
			data: { reference: consoleReference('claim'), providerReference: null }
		};
	}

	try {
		const response = await fetch(NHIS_API_URL!, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${NHIS_API_KEY}`
			},
			body: JSON.stringify(input.payload),
			signal: AbortSignal.timeout(15_000)
		});

		if (!response.ok) {
			return { ok: false, mode: 'live', error: `Claims endpoint returned ${response.status}` };
		}

		const raw = (await response.json().catch(() => null)) as {
			reference?: string;
			id?: string;
		} | null;

		const providerReference = raw?.reference ?? raw?.id ?? null;
		return {
			ok: true,
			mode: 'live',
			data: {
				reference: providerReference ?? input.claimReference,
				providerReference
			}
		};
	} catch (error) {
		return {
			ok: false,
			mode: 'live',
			error: error instanceof Error ? error.message : 'Claims submission failed'
		};
	}
}

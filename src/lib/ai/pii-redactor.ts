/**
 * Deterministic On-Device PII Redaction & Rehydration.
 *
 * In Primary Healthcare Centres, patient names, phone numbers, NIN/clinic IDs,
 * and specific community addresses are sanitized locally into temporary surrogate tokens
 * before any data can be escalated to cloud models.
 */

export interface PiiTokenMap {
	names: Map<string, string>; // original -> surrogate
	phones: Map<string, string>;
	addresses: Map<string, string>;
	ids: Map<string, string>;
}

export interface RedactionResult {
	redactedText: string;
	tokenMap: PiiTokenMap;
	redactedCount: number;
}

// Regex patterns tuned for Nigerian phone formats (+234, 080, 090, 070, 081 etc.)
const NIGERIAN_PHONE_REGEX = /(?:\+?234|0)[789][01]\d{8}\b/g;

// Standard ClinicFlow Patient/Clinic ID patterns (e.g. CF-2026-XXXX, ID: 12345)
const CLINIC_ID_REGEX = /\b(?:CF-[A-Z0-9-]+|ID:?\s*[A-Z0-9-]{4,12})\b/gi;

/**
 * Redacts identifiable entities from input text.
 * When specific patient context (e.g. registered name or address) is supplied,
 * exact-match replacement is applied alongside contextual patterns.
 */
export function redactPii(
	rawText: string,
	context?: { knownName?: string; knownPhone?: string; knownAddress?: string; knownId?: string }
): RedactionResult {
	let text = rawText;
	const tokenMap: PiiTokenMap = {
		names: new Map(),
		phones: new Map(),
		addresses: new Map(),
		ids: new Map()
	};

	let nameCounter = 1;
	let phoneCounter = 1;
	let idCounter = 1;

	// 1. Explicit context redaction (highest confidence)
	if (context?.knownName && context.knownName.trim().length > 2) {
		const name = context.knownName.trim();
		const token = '[PATIENT_NAME_1]';
		const regex = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi');
		if (regex.test(text)) {
			nameCounter = 2;
			tokenMap.names.set(token, name);
			text = text.replace(regex, token);
		}
	}

	if (context?.knownPhone && context.knownPhone.trim().length >= 8) {
		const phone = context.knownPhone.trim();
		const token = '[PHONE_NUM_1]';
		const regex = new RegExp(escapeRegExp(phone), 'g');
		if (regex.test(text)) {
			phoneCounter = 2;
			tokenMap.phones.set(token, phone);
			text = text.replace(regex, token);
		}
	}

	if (context?.knownAddress && context.knownAddress.trim().length > 3) {
		const address = context.knownAddress.trim();
		const token = '[RESIDENTIAL_COMMUNITY_1]';
		const regex = new RegExp(`\\b${escapeRegExp(address)}\\b`, 'gi');
		if (regex.test(text)) {
			tokenMap.addresses.set(token, address);
			text = text.replace(regex, token);
		}
	}

	if (context?.knownId && context.knownId.trim().length >= 3) {
		const id = context.knownId.trim();
		const token = '[CLINIC_RECORD_ID_1]';
		const regex = new RegExp(`\\b${escapeRegExp(id)}\\b`, 'gi');
		if (regex.test(text)) {
			idCounter = 2;
			tokenMap.ids.set(token, id);
			text = text.replace(regex, token);
		}
	}

	// 2. Pattern-based Phone Number Redaction
	text = text.replace(NIGERIAN_PHONE_REGEX, (match) => {
		// If already mapped
		for (const [token, original] of tokenMap.phones.entries()) {
			if (original === match) return token;
		}
		const token = `[PHONE_NUM_${phoneCounter++}]`;
		tokenMap.phones.set(token, match);
		return token;
	});

	// 3. Pattern-based Clinic ID Redaction
	text = text.replace(CLINIC_ID_REGEX, (match) => {
		for (const [token, original] of tokenMap.ids.entries()) {
			if (original === match) return token;
		}
		const token = `[CLINIC_RECORD_ID_${idCounter++}]`;
		tokenMap.ids.set(token, match);
		return token;
	});

	// 4. Common conversational name markers (e.g., "patient is John Doe", "named Amina Bello")
	const NAME_INTRO_REGEX =
		/\b(?:patient(?:'s)?(?:\s+name)?(?:\s+is)?|named|called|attended\s+by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
	text = text.replace(NAME_INTRO_REGEX, (fullMatch, capturedName) => {
		if (capturedName.length <= 2) return fullMatch;
		for (const [token, original] of tokenMap.names.entries()) {
			if (original.toLowerCase() === capturedName.toLowerCase()) {
				return fullMatch.replace(capturedName, token);
			}
		}
		const token = `[PATIENT_NAME_${nameCounter++}]`;
		tokenMap.names.set(token, capturedName);
		return fullMatch.replace(capturedName, token);
	});

	const totalRedacted =
		tokenMap.names.size + tokenMap.phones.size + tokenMap.addresses.size + tokenMap.ids.size;

	return {
		redactedText: text,
		tokenMap,
		redactedCount: totalRedacted
	};
}

/**
 * Rehydrates surrogate tokens back into original patient context locally.
 */
export function rehydratePii(sanitizedText: string, tokenMap: PiiTokenMap): string {
	let text = sanitizedText;

	const allTokens = [
		...tokenMap.names.entries(),
		...tokenMap.phones.entries(),
		...tokenMap.addresses.entries(),
		...tokenMap.ids.entries()
	];

	for (const [token, original] of allTokens) {
		text = text.replaceAll(token, original);
	}

	return text;
}

function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

import { HFR_API_KEY, HFR_API_URL } from '$app/env/private';

/**
 * Read-only advisory lookup against Nigeria's national Health Facility
 * Registry (Federal Ministry of Health). This is reference data, not an
 * action integration: it therefore has no "console mode" and never returns
 * fabricated facilities. If no key is configured the UI falls back to manual
 * entry instead.
 */

export type RegistryAvailability = 'live' | 'unconfigured' | 'unavailable';

export interface RegistryFacility {
	registryId: string | null;
	name: string;
	state: string | null;
	lga: string | null;
	level: string | null;
	ownership: string | null;
}

export interface RegistryLookupResult {
	availability: RegistryAvailability;
	facilities: RegistryFacility[];
	reason: string | null;
	checkedAt: string;
}

export interface RegistryLookupInput {
	name?: string;
	state?: string;
	lga?: string;
	limit?: number;
}

const DEFAULT_BASE_URL = 'https://backend.hfr.fmohconnect.gov.ng/api/v1';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;
const cache = new Map<string, { expiresAt: number; result: RegistryLookupResult }>();

function text(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function firstText(record: Record<string, unknown>, keys: string[]): string | null {
	for (const key of keys) {
		const found = text(record[key]);
		if (found) return found;
	}
	return null;
}

function asFacility(value: unknown): RegistryFacility | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
	const record = value as Record<string, unknown>;
	const name = firstText(record, ['facilityName', 'name', 'facility_name']);
	if (!name) return null;
	return {
		registryId: firstText(record, ['hfrId', 'facilityId', 'id', 'hfr_id']),
		name,
		state: firstText(record, ['state', 'stateName', 'state_name']),
		lga: firstText(record, ['lga', 'lgaName', 'lga_name', 'districtName']),
		level: firstText(record, ['facilityLevel', 'level', 'facilityType']),
		ownership: firstText(record, ['ownership', 'ownershipName'])
	};
}

export function parseRegistryFacilities(payload: unknown): RegistryFacility[] {
	const candidates = Array.isArray(payload)
		? payload
		: [payload].flatMap((root) => {
				if (!root || typeof root !== 'object') return [];
				const record = root as Record<string, unknown>;
				for (const key of ['data', 'facilities', 'results', 'items']) {
					const value = record[key];
					if (Array.isArray(value)) return value;
					if (value && typeof value === 'object') {
						for (const nested of ['facilities', 'results', 'items', 'data']) {
							if (Array.isArray((value as Record<string, unknown>)[nested])) {
								return (value as Record<string, unknown>)[nested] as unknown[];
							}
						}
					}
				}
				return [];
			});
	return candidates.map(asFacility).filter((item): item is RegistryFacility => item !== null);
}

function buildUrl(input: RegistryLookupInput): string {
	const base = (HFR_API_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, '');
	const url = new URL(`${base}/facilities`);
	const name = input.name?.trim();
	const state = input.state?.trim();
	const lga = input.lga?.trim();
	// HFR documents GET-only access; these parameter names follow its facility
	// filters and must be confirmed against the issued API key's docs.
	if (name) url.searchParams.set('search', name);
	if (state) url.searchParams.set('state', state);
	if (lga) url.searchParams.set('lga', lga);
	url.searchParams.set('limit', String(Math.min(Math.max(input.limit ?? 10, 1), 25)));
	return url.toString();
}

/** Advisory HFR lookup. Returns zero facilities when the registry is not usable. */
export async function lookupFacilities(input: RegistryLookupInput): Promise<RegistryLookupResult> {
	const checkedAt = new Date().toISOString();
	if (!HFR_API_KEY?.trim()) {
		return {
			availability: 'unconfigured',
			facilities: [],
			reason:
				'HFR_API_KEY is not configured. Request a key from the national registry; manual entry remains available.',
			checkedAt
		};
	}

	const url = buildUrl(input);
	const cached = cache.get(url);
	if (cached && cached.expiresAt > Date.now()) return cached.result;

	try {
		const response = await fetch(url, {
			headers: { 'X-API-Key': HFR_API_KEY, Accept: 'application/json' },
			signal: AbortSignal.timeout(10_000)
		});
		if (!response.ok) {
			return {
				availability: 'unavailable',
				facilities: [],
				reason: `Health Facility Registry returned ${response.status}.`,
				checkedAt
			};
		}
		const payload: unknown = await response.json();
		const result: RegistryLookupResult = {
			availability: 'live',
			facilities: parseRegistryFacilities(payload).slice(0, 25),
			reason: null,
			checkedAt
		};
		cache.set(url, { expiresAt: Date.now() + CACHE_TTL_MS, result });
		if (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!);
		return result;
	} catch (error) {
		return {
			availability: 'unavailable',
			facilities: [],
			reason: error instanceof Error ? error.message : 'Health Facility Registry lookup failed.',
			checkedAt
		};
	}
}

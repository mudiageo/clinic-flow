import { isOutreachActivityType } from './types.ts';

export function canWriteOutreach(
	role: string | null | undefined,
	permissions: readonly string[] | null | undefined
): boolean {
	return role === 'superadmin' || permissions?.includes('manage:outreach') === true;
}

const COUNT_FIELDS = [
	'householdsVisited',
	'peopleReached',
	'immunizationsGiven',
	'bednetsDistributed'
] as const;

function validTimestamp(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function validCount(value: unknown): value is number {
	return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 1_000_000;
}

export function normalizeOutreachPayload(
	payload: unknown,
	partial = false
): Record<string, unknown> | null {
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
	const source = payload as Record<string, unknown>;
	const normalized: Record<string, unknown> = {};

	if ('activityType' in source) {
		if (typeof source.activityType !== 'string' || !isOutreachActivityType(source.activityType)) {
			return null;
		}
		normalized.activityType = source.activityType;
	} else if (!partial) return null;

	if ('community' in source) {
		if (typeof source.community !== 'string') return null;
		const community = source.community.trim();
		if (!community || community.length > 160) return null;
		normalized.community = community;
	} else if (!partial) return null;

	if ('occurredAt' in source) {
		if (!validTimestamp(source.occurredAt)) return null;
		normalized.occurredAt = source.occurredAt;
	} else if (!partial) return null;

	for (const field of COUNT_FIELDS) {
		if (field in source) {
			if (!validCount(source[field])) return null;
			normalized[field] = source[field];
		} else if (!partial) return null;
	}

	if ('notes' in source) {
		if (source.notes !== null && typeof source.notes !== 'string') return null;
		const notes = typeof source.notes === 'string' ? source.notes.trim() : null;
		if (notes && notes.length > 500) return null;
		normalized.notes = notes || null;
	} else if (!partial) normalized.notes = null;

	if ('createdAt' in source) {
		if (!validTimestamp(source.createdAt)) return null;
		normalized.createdAt = source.createdAt;
	} else if (!partial) return null;

	if ('updatedAt' in source) {
		if (!validTimestamp(source.updatedAt)) return null;
		normalized.updatedAt = source.updatedAt;
	} else if (!partial) return null;

	return normalized;
}

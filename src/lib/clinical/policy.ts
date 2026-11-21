/**
 * Server-side write policy for durable clinical records.
 *
 * Used at the sync push boundary so a crafted client payload cannot bypass
 * permission or feature-flag gating. Client-side checks are convenience only;
 * this module is the authoritative gate.
 */
export type ClinicalEntityType = 'immunizationRecords' | 'temperatureLogs' | 'ancVisits';

export interface ClinicalWritePolicy {
	permission: 'manage:immunization' | 'manage:cold_chain' | 'manage:anc';
	flag: 'immunizationEnabled' | 'coldChainEnabled' | 'maternalHealthEnabled';
}

export const CLINICAL_WRITE_POLICY: Record<ClinicalEntityType, ClinicalWritePolicy> = {
	immunizationRecords: { permission: 'manage:immunization', flag: 'immunizationEnabled' },
	temperatureLogs: { permission: 'manage:cold_chain', flag: 'coldChainEnabled' },
	ancVisits: { permission: 'manage:anc', flag: 'maternalHealthEnabled' }
};

export function clinicalWritePolicy(entityType: string): ClinicalWritePolicy | null {
	return Object.prototype.hasOwnProperty.call(CLINICAL_WRITE_POLICY, entityType)
		? CLINICAL_WRITE_POLICY[entityType as ClinicalEntityType]
		: null;
}

export function canWriteClinical(
	entityType: string,
	role: string | null | undefined,
	permissions: readonly string[] | null | undefined
): boolean {
	const policy = clinicalWritePolicy(entityType);
	if (!policy) return true;
	return role === 'superadmin' || permissions?.includes(policy.permission) === true;
}

export type ClinicalFeatureFlags = Record<ClinicalWritePolicy['flag'], boolean>;

export function clinicalFeatureEnabled(
	entityType: string,
	flags: ClinicalFeatureFlags | undefined | null
): boolean {
	const policy = clinicalWritePolicy(entityType);
	if (!policy) return true;
	// Missing settings (e.g. record was seeded without a PHC row) fail closed.
	return flags?.[policy.flag] === true;
}

/**
 * Converts a client-supplied epoch millisecond number or Date into a valid Date.
 * Returns null for anything else so callers can fail closed.
 */
function toDate(value: unknown): Date | null {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}
	if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
		return new Date(value);
	}
	return null;
}

function optionalString(
	source: Record<string, unknown>,
	key: string,
	maxLength: number
): string | null {
	if (!(key in source)) return null;
	const value = source[key];
	if (value === null || value === undefined || value === '') return null;
	if (typeof value !== 'string') throw new Error(`Invalid ${key}`);
	const trimmed = value.trim();
	if (trimmed === '') return null;
	if (trimmed.length > maxLength) throw new Error(`${key} is too long`);
	return trimmed;
}

function requiredString(source: Record<string, unknown>, key: string, maxLength: number): string {
	const value = optionalString(source, key, maxLength);
	if (!value) throw new Error(`Missing ${key}`);
	return value;
}

function numberInRange(
	value: unknown,
	min: number,
	max: number,
	integerOnly = false
): number | null {
	if (value === null || value === undefined || value === '') return null;
	if (
		typeof value !== 'number' ||
		!Number.isFinite(value) ||
		(integerOnly && !Number.isInteger(value)) ||
		value < min ||
		value > max
	) {
		return null;
	}
	return value;
}

/**
 * Validates and normalizes a client clinical payload at the sync boundary.
 * Returns null when validation fails. Optional fields may be omitted on updates.
 */
export function normalizeClinicalPayload(
	entityType: string,
	payload: unknown,
	partial = false
): Record<string, unknown> | null {
	if (!clinicalWritePolicy(entityType)) return null;
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
	const source = payload as Record<string, unknown>;

	try {
		if (entityType === 'immunizationRecords') {
			const normalized: Record<string, unknown> = {};
			if ('patientId' in source) {
				normalized.patientId = requiredString(source, 'patientId', 160);
			} else if (!partial) return null;
			if ('appointmentId' in source)
				normalized.appointmentId = optionalString(source, 'appointmentId', 160);
			if ('vaccineName' in source) {
				normalized.vaccineName = requiredString(source, 'vaccineName', 120);
			} else if (!partial) return null;
			if ('doseNumber' in source) {
				const dose = source.doseNumber;
				if (!Number.isInteger(dose) || (dose as number) < 1 || (dose as number) > 4) return null;
				normalized.doseNumber = dose;
			} else if (!partial) return null;
			if ('administeredAt' in source) {
				const administeredAt = toDate(source.administeredAt);
				if (!administeredAt) return null;
				normalized.administeredAt = administeredAt;
			} else if (!partial) return null;
			if ('batchNumber' in source || !partial) {
				normalized.batchNumber = optionalString(source, 'batchNumber', 80);
			}
			if ('route' in source || !partial) {
				normalized.route = optionalString(source, 'route', 40);
			}
			if ('notes' in source || !partial) {
				normalized.notes = optionalString(source, 'notes', 500);
			}
			if ('expiryDate' in source) {
				if (source.expiryDate == null) {
					normalized.expiryDate = null;
				} else {
					const expiryDate = toDate(source.expiryDate);
					if (!expiryDate) return null;
					normalized.expiryDate = expiryDate;
				}
			} else if (!partial) {
				normalized.expiryDate = null;
			}
			if ('correctionOf' in source) {
				normalized.correctionOf = optionalString(source, 'correctionOf', 160);
			}
			return normalized;
		}

		if (entityType === 'temperatureLogs') {
			const normalized: Record<string, unknown> = {};
			if ('fridgeLabel' in source) {
				normalized.fridgeLabel = requiredString(source, 'fridgeLabel', 80);
			} else if (!partial) return null;
			if ('temperatureCelsius' in source) {
				const temp = source.temperatureCelsius;
				if (typeof temp !== 'number' || !Number.isFinite(temp) || temp < -50 || temp > 100) {
					return null;
				}
				normalized.temperatureCelsius = temp;
			} else if (!partial) return null;
			if ('recordedAt' in source) {
				const recordedAt = toDate(source.recordedAt);
				if (!recordedAt) return null;
				normalized.recordedAt = recordedAt;
			} else if (!partial) return null;
			if ('notes' in source || !partial) {
				normalized.notes = optionalString(source, 'notes', 500);
			}
			return normalized;
		}

		if (entityType === 'ancVisits') {
			const normalized: Record<string, unknown> = {};
			if ('patientId' in source) {
				normalized.patientId = requiredString(source, 'patientId', 160);
			} else if (!partial) return null;
			if ('pregnancyRecordId' in source) {
				normalized.pregnancyRecordId = requiredString(source, 'pregnancyRecordId', 160);
			} else if (!partial) return null;
			if ('visitDate' in source) {
				const visitDate = toDate(source.visitDate);
				if (!visitDate || visitDate.getTime() > Date.now() + 24 * 60 * 60 * 1000) return null;
				normalized.visitDate = visitDate;
			} else if (!partial) return null;

			const numericFields: Array<[string, number, number, boolean]> = [
				['visitNumber', 1, 8, true],
				['systolicBp', 50, 300, true],
				['diastolicBp', 20, 200, true],
				['weightKg', 1, 400, false],
				['fetalHeartRateBpm', 50, 250, true],
				['fundalHeightCm', 5, 60, false]
			];
			for (const [key, min, max, integerOnly] of numericFields) {
				if (key in source || !partial) {
					const value = numberInRange(source[key], min, max, integerOnly);
					if (value === null && source[key] !== null && source[key] !== '') return null;
					normalized[key] = value;
				}
			}
			if ('notes' in source || !partial) {
				normalized.notes = optionalString(source, 'notes', 500);
			}
			return normalized;
		}
	} catch {
		return null;
	}

	return null;
}

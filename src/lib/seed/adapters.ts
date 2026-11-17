/**
 * Compatibility shim between the browser (Dexie) and server (Drizzle) schemas.
 *
 * This exists because the two schemas drifted. The permanent fix is to align the
 * client field names/types with the server and delete these helpers. See
 * `docs/data-model/client-server-field-mapping.md`.
 *
 * No `$app` / server imports: this module is used from both the browser and Node.
 */

export const SYNC_ENTITY_TABLE: Record<string, string> = {
	patients: 'patients',
	queueTickets: 'queue_tickets',
	vitalsRecords: 'vitals_records',
	pharmacyInventory: 'pharmacy_inventory',
	reminders: 'reminders',
	triageRules: 'triage_rules',
	prescriptions: 'prescriptions',
	encounters: 'encounters',
	labRequests: 'lab_requests',
	restockRequests: 'restock_requests',
	appointments: 'appointments',
	pregnancyRecords: 'pregnancy_records',
	staff: 'staff',
	families: 'families'
};

const PUSH_DATE_FIELDS = new Set([
	'dob',
	'recordedAt',
	'calledAt',
	'completedAt',
	'visitDate',
	'dueDate',
	'sentAt',
	'dispensedAt',
	'createdAt',
	'lmpDate',
	'eddDate',
	'scheduledAt',
	'resultEnteredAt',
	'updatedAt',
	'serverUpdatedAt'
]);

const PULL_DATE_FIELDS = new Set([
	'dob',
	'recordedAt',
	'calledAt',
	'completedAt',
	'visitDate',
	'dueDate',
	'sentAt',
	'dispensedAt',
	'createdAt',
	'lmpDate',
	'eddDate',
	'scheduledAt',
	'resultEnteredAt',
	'updatedAt',
	'serverUpdatedAt'
]);

function toDate(value: unknown): unknown {
	if (typeof value === 'number' && Number.isFinite(value)) return new Date(value);
	if (typeof value === 'string' && value) {
		const parsed = new Date(value);
		if (!Number.isNaN(parsed.getTime())) return parsed;
	}
	return value;
}

function toMs(value: unknown): unknown {
	if (value instanceof Date) return value.getTime();
	if (typeof value === 'string' && value) {
		const parsed = new Date(value);
		if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
	}
	return value;
}

function convertDates(
	payload: Record<string, unknown>,
	fields: Set<string>,
	convert: (v: unknown) => unknown
) {
	const result = { ...payload };
	for (const key of Object.keys(result)) {
		if (fields.has(key)) result[key] = convert(result[key]);
	}
	return result;
}

/** Client-shaped payload -> row accepted by the corresponding Drizzle table. */
export function toServerRow(
	entityType: string,
	payload: Record<string, unknown>
): Record<string, unknown> {
	// strip client-only bookkeeping fields
	const { syncStatus: _syncStatus, serverUpdatedAt: _serverUpdatedAt, ...rest } = payload;
	let row = convertDates(rest, PUSH_DATE_FIELDS, toDate);

	if (entityType === 'patients' && 'name' in row) {
		const { name, ...other } = row;
		row = { ...other, fullName: name };
	}

	if (entityType === 'prescriptions') {
		const { inventoryId, medicationName: _medicationName, dosage, status, ...other } = row;
		const dispensed = status === 'dispensed';
		row = {
			...other,
			inventoryItemId: inventoryId,
			dosageInstructions: dosage,
			dispensed,
			dispensedAt: dispensed ? (row.dispensedAt ?? new Date()) : null
		};
	}

	// The server has no `createdAt` on encounters; Drizzle ignores unknown keys,
	// but dropping it here keeps the shim explicit.
	if (entityType === 'encounters' && 'createdAt' in row) {
		const { createdAt: _createdAt, ...other } = row;
		row = other;
	}

	if ((entityType === 'patients' || entityType === 'encounters') && 'isNhis' in row) {
		const { isNhis: _isNhis, ...other } = row;
		row = other;
	}
	if ('isNhisBillable' in row) {
		const { isNhisBillable: _isNhisBillable, ...other } = row;
		row = other;
	}

	return row;
}

/** Server row / sync payload -> client-shaped row for Dexie. */
export function toClientRow(
	entityType: string,
	payload: Record<string, unknown>
): Record<string, unknown> {
	let row = convertDates(payload, PULL_DATE_FIELDS, toMs);

	if (entityType === 'patients' && 'fullName' in row) {
		const { fullName, ...other } = row;
		row = { ...other, name: fullName };
	}

	if (entityType === 'prescriptions') {
		const { inventoryItemId, dosageInstructions, dispensed, ...other } = row;
		row = {
			...other,
			inventoryId: inventoryItemId,
			dosage: dosageInstructions,
			status: dispensed ? 'dispensed' : 'pending'
		};
	}

	// sync payloads from real devices already carry these; server-only rows do not.
	if (!('syncStatus' in row)) row.syncStatus = 'synced';
	if (!('updatedAt' in row)) row.updatedAt = Date.now();
	if (!('serverUpdatedAt' in row)) row.serverUpdatedAt = null;

	return row;
}

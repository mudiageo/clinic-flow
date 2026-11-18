/**
 * Tenant-scope decisions for PHC-scoped sync writes.
 *
 * The authenticated session is the only authority for tenant scope. Client
 * records can carry stale or placeholder PHC ids, so a client-supplied phcId
 * must never decide which PHC a record belongs to.
 */

const PATIENT_LINKED_ENTITIES = new Set(['vitalsRecords', 'prescriptions']);

export function resolvesViaPatient(entityType: string): boolean {
	return PATIENT_LINKED_ENTITIES.has(entityType);
}

export interface TenantScopeInput {
	entityType: string;
	/** PHC of an existing server record, when one was found. */
	existingPhcId: string | undefined;
	/** PHC resolved from the related patient for patient-linked entities. */
	patientPhcId: string | null;
	/** PHC from the authenticated server session. */
	sessionPhcId: string;
}

/**
 * Returns `ok` when a write may proceed, otherwise the conflict reason.
 * Patient-linked entities are scoped by their patient; all other entities are
 * scoped to the session because the server overwrites their phcId on write.
 */
export function checkTenantScope(input: TenantScopeInput): 'ok' | 'tenant-scope-mismatch' {
	if (input.existingPhcId && input.existingPhcId !== input.sessionPhcId) {
		return 'tenant-scope-mismatch';
	}
	if (resolvesViaPatient(input.entityType)) {
		return input.patientPhcId === input.sessionPhcId ? 'ok' : 'tenant-scope-mismatch';
	}
	return 'ok';
}

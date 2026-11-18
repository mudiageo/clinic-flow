/**
 * Ordering and dependency helpers for the shared sync push batch.
 *
 * PostgreSQL enforces foreign keys, so a batch that creates an encounter and a
 * vitals/queue row in the wrong order fails even though both records will
 * eventually exist. These helpers keep the durable push path deterministic and
 * make the legacy backfill decision explicit and testable.
 */

export interface OperationForDependency {
	entityType: string;
	entityId?: string;
	operation?: string;
	payload?: unknown;
}

export interface EncounterDependency {
	encounterId: string;
	patientId: string | null;
}

/** Entity types whose rows carry an `encounter_id` foreign key. */
export const ENCOUNTER_LINKED_ENTITIES = new Set([
	'vitalsRecords',
	'queueTickets',
	'labRequests',
	'prescriptions'
]);

const DEPENDENCY_RANK: Record<string, number> = {
	patients: 0,
	encounters: 1
};

/**
 * Stable sort: referenced parent records are pushed before their dependents.
 * Operations within the same rank keep their original client order.
 */
export function orderOperationsForDependencies<T extends OperationForDependency>(
	operations: readonly T[]
): T[] {
	return operations
		.map((operation, index) => ({
			operation,
			index,
			rank: DEPENDENCY_RANK[operation.entityType] ?? 2
		}))
		.sort((a, b) => a.rank - b.rank || a.index - b.index)
		.map(({ operation }) => operation);
}

/** Extract the encounter/patient pair needed to satisfy an FK before a write. */
export function extractEncounterDependency(
	operation: OperationForDependency
): EncounterDependency | null {
	if (!ENCOUNTER_LINKED_ENTITIES.has(operation.entityType)) return null;
	if (operation.operation === 'delete') return null;

	const payload =
		operation.payload && typeof operation.payload === 'object'
			? (operation.payload as Record<string, unknown>)
			: null;
	const encounterId = payload?.encounterId;
	if (typeof encounterId !== 'string' || encounterId.length === 0) return null;

	const patientId = payload?.patientId;
	return {
		encounterId,
		patientId: typeof patientId === 'string' && patientId.length > 0 ? patientId : null
	};
}

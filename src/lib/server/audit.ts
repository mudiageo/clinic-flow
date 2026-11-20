import { database, getTable } from '#lib/server/db/queries/_core.ts';

/**
 * Writes a non-clinical operational audit entry. Callers must have already
 * authorized the action; this helper only records it.
 */
export async function recordAudit(input: {
	phcId: string | null;
	staffId?: string | null;
	action: string;
	entityType: string;
	entityId?: string | null;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	if (!input.phcId) {
		console.info('[audit] platform action', input.action, input.metadata ?? {});
		return;
	}
	await database.insert(getTable('auditLog')).values({
		phcId: input.phcId,
		staffId: input.staffId ?? null,
		action: input.action,
		entityType: input.entityType,
		entityId: input.entityId ?? null,
		metadata: input.metadata ? JSON.stringify(input.metadata) : null,
		ip: null
	});
}

import { query, getRequestEvent } from '$app/server';
import { database, getTable } from '#lib/server/db/queries/_core.ts';
import { requirePermission } from '#lib/server/permissions.ts';
import { and, eq, sql } from 'drizzle-orm';
import * as v from 'valibot';

const PAGE_SIZE = 50;

// Fetch audit log entries for this PHC
export const getAuditLog = query(
	v.object({
		page: v.optional(v.number(), 1),
		action: v.optional(v.string(), ''),
		entityType: v.optional(v.string(), '')
	}),
	async ({ page, action, entityType }) => {
		const event = getRequestEvent();
		if (!event.locals.phcId) return { entries: [], total: 0, page: 1, pageSize: PAGE_SIZE };
		await requirePermission('manage:staff');

		const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
		const auditLogTable = getTable('auditLog');

		const filters = [eq(auditLogTable.phcId, event.locals.phcId)];
		if (action) filters.push(eq(auditLogTable.action, action));
		if (entityType) filters.push(eq(auditLogTable.entityType, entityType));
		const where = and(...filters);

		const [countRow] = await database
			.select({ value: sql<number>`count(*)` })
			.from(auditLogTable)
			.where(where);

		const rows = await database.query.auditLog.findMany({
			where,
			orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
			limit: PAGE_SIZE,
			offset: (safePage - 1) * PAGE_SIZE,
			with: { staff: true }
		});

		return {
			entries: rows.map((row: any) => ({
				id: row.id,
				createdAt: row.createdAt,
				action: row.action,
				entityType: row.entityType,
				entityId: row.entityId,
				staffName: row.staff?.fullName ?? 'System'
			})),
			total: Number(countRow?.value ?? 0),
			page: safePage,
			pageSize: PAGE_SIZE
		};
	}
);

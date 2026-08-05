import { database, getTable } from './_core';
import { eq, and } from 'drizzle-orm';

export async function grantPermission(data: {
	staffId: string;
	phcId: string;
	permission: string;
	grantedBy: string;
}) {
	const table = getTable('permissions');

	await database
		.update(table)
		.set({ revoked: true })
		.where(and(eq(table.staffId, data.staffId), eq(table.permission, data.permission)));

	const result = await database
		.insert(table)
		.values({
			staffId: data.staffId,
			phcId: data.phcId,
			permission: data.permission,
			grantedBy: data.grantedBy,
			revoked: false
		})
		.returning();

	return result[0];
}

export async function revokePermission(data: {
	staffId: string;
	phcId: string;
	permission: string;
	grantedBy: string;
}) {
	const table = getTable('permissions');

	await database
		.update(table)
		.set({ revoked: true })
		.where(and(eq(table.staffId, data.staffId), eq(table.permission, data.permission)));

	const result = await database
		.insert(table)
		.values({
			staffId: data.staffId,
			phcId: data.phcId,
			permission: data.permission,
			grantedBy: data.grantedBy,
			revoked: true
		})
		.returning();

	return result[0];
}

export async function grantPermissionsBulk(items: Array<{ staffId: string; phcId: string; permission: string; grantedBy: string }>) {
	const table = getTable('permissions');
	if (items.length === 0) return;
	await database.insert(table).values(items);
}

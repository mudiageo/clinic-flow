import { database, getTable } from './_core';
import { eq } from 'drizzle-orm';

export async function upsertUplinkConfig(
	phcId: string,
	data: {
		cloudUrl: string;
		apiKey: string;
		superAdminEmail: string;
		superAdminPasswordHash: string;
	}
) {
	const table = getTable('uplinkConfig');
	return await database
		.insert(table)
		.values({
			phcId,
			cloudUrl: data.cloudUrl,
			uplinkKey: data.apiKey,
			superAdminEmail: data.superAdminEmail,
			superAdminPasswordHash: data.superAdminPasswordHash,
			syncEnabled: true,
			updatedAt: new Date()
		})
		.onConflictDoUpdate({
			target: table.phcId,
			set: {
				cloudUrl: data.cloudUrl,
				uplinkKey: data.apiKey,
				superAdminEmail: data.superAdminEmail,
				superAdminPasswordHash: data.superAdminPasswordHash,
				syncEnabled: true,
				updatedAt: new Date()
			}
		});
}

export async function deleteUplinkConfig(phcId: string) {
	const table = getTable('uplinkConfig');
	return await database.delete(table).where(eq(table.phcId, phcId));
}

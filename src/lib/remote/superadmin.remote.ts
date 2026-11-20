import { command, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import * as v from 'valibot';
import { recordAudit } from '#lib/server/audit.ts';
import { realtimeHub, syncTopics } from '#lib/server/realtime/hub.ts';
import { requireSuperadmin } from '#lib/server/rbac.ts';
import { getPhcListWithCounts, getPhcFullDetails } from '#lib/server/db/queries/phcs.ts';
import { database, getTable } from '#lib/server/db/queries/_core.ts';
import { getAllStaffUsers } from '#lib/server/db/queries/staff.ts';

export const getPhcList = query(async () => {
	requireSuperadmin();
	return await getPhcListWithCounts();
});

export const getPhcDetails = query(v.string(), async (id: string) => {
	requireSuperadmin();
	return await getPhcFullDetails(id);
});

export const getAllUsers = query(async () => {
	requireSuperadmin();
	return await getAllStaffUsers();
});

/**
 * Durable read of sync state for one PHC. "Healthy" is derived from real
 * device sync times and the PHC operation counter, never hard-coded.
 */
export const getPhcSyncStatus = query(v.string(), async (phcId: string) => {
	requireSuperadmin();
	const phcsTable = getTable('phcs');
	const devicesTable = getTable('devices');
	const operationsTable = getTable('syncOperations');

	const [phc] = await database
		.select({ syncVersion: phcsTable.syncVersion, active: phcsTable.active })
		.from(phcsTable)
		.where(eq(phcsTable.id, phcId))
		.limit(1);
	if (!phc) error(404, 'PHC not found');

	const [devices, recentOperations] = await Promise.all([
		database
			.select({ id: devicesTable.id, name: devicesTable.name, lastSyncAt: devicesTable.lastSyncAt })
			.from(devicesTable)
			.where(eq(devicesTable.phcId, phcId))
			.limit(20),
		database
			.select({ id: operationsTable.id })
			.from(operationsTable)
			.where(eq(operationsTable.phcId, phcId))
			.orderBy(desc(operationsTable.serverReceivedAt))
			.limit(100)
	]);

	const deviceSyncTimes = (devices as Array<{ lastSyncAt: unknown }>).map(
		(device) => device.lastSyncAt
	);
	const lastSyncTimes = deviceSyncTimes.filter((value): value is Date => value instanceof Date);
	const lastSyncAt = lastSyncTimes.sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
	const stale = lastSyncAt ? Date.now() - lastSyncAt.getTime() > 24 * 60 * 60 * 1000 : true;

	return {
		status: stale ? 'needs-attention' : 'up-to-date',
		lastSyncAt: lastSyncAt ? lastSyncAt.toISOString() : null,
		syncVersion: Number(phc.syncVersion ?? 0),
		active: Boolean(phc.active),
		devices: devices.length,
		recentOperations: recentOperations.length
	};
});

const userTargetSchema = v.object({ userId: v.pipe(v.string(), v.minLength(1)) });

/** Resets a credential password with Better Auth's own password hashing. */
export const resetUserPassword = command(
	v.object({
		...userTargetSchema.entries,
		newPassword: v.pipe(v.string(), v.minLength(12), v.maxLength(128))
	}),
	async ({ userId, newPassword }) => {
		requireSuperadmin();
		const event = getRequestEvent();
		const accountsTable = getTable('account');
		const sessionsTable = getTable('session');
		const accounts = await database
			.select({ id: accountsTable.id })
			.from(accountsTable)
			.where(and(eq(accountsTable.userId, userId), eq(accountsTable.providerId, 'credential')))
			.limit(1);
		if (!accounts.length) error(404, 'No password account found for this user');

		const passwordHash = await hashPassword(newPassword);
		await database
			.update(accountsTable)
			.set({ password: passwordHash, updatedAt: new Date() })
			.where(eq(accountsTable.id, accounts[0].id));
		await database.delete(sessionsTable).where(eq(sessionsTable.userId, userId));

		await recordAudit({
			phcId: event.locals.phcId ?? null,
			staffId: event.locals.staffId ?? null,
			action: 'superadmin.user.password.reset',
			entityType: 'user',
			entityId: userId,
			metadata: { revocations: true }
		});
		return { success: true };
	}
);

export const deactivateUser = command(
	v.object({ ...userTargetSchema.entries, active: v.boolean() }),
	async ({ userId, active }) => {
		requireSuperadmin();
		const event = getRequestEvent();
		const staffTable = getTable('staff');
		const sessionsTable = getTable('session');
		const staff = await database
			.select({ id: staffTable.id })
			.from(staffTable)
			.where(eq(staffTable.authUserId, userId))
			.limit(1);
		if (!staff.length) error(404, 'Staff record not found');

		await database.update(staffTable).set({ active }).where(eq(staffTable.id, staff[0].id));
		if (!active) await database.delete(sessionsTable).where(eq(sessionsTable.userId, userId));

		await recordAudit({
			phcId: event.locals.phcId ?? null,
			staffId: event.locals.staffId ?? null,
			action: active ? 'superadmin.user.reactivate' : 'superadmin.user.deactivate',
			entityType: 'user',
			entityId: userId
		});
		return { success: true };
	}
);

export const setPhcActive = command(
	v.object({ phcId: v.pipe(v.string(), v.minLength(1)), active: v.boolean() }),
	async ({ phcId, active }) => {
		requireSuperadmin();
		const event = getRequestEvent();
		const phcsTable = getTable('phcs');
		await database.update(phcsTable).set({ active }).where(eq(phcsTable.id, phcId));
		await recordAudit({
			phcId: event.locals.phcId ?? phcId,
			staffId: event.locals.staffId ?? null,
			action: active ? 'superadmin.phc.reactivate' : 'superadmin.phc.deactivate',
			entityType: 'phc',
			entityId: phcId
		});
		return { success: true };
	}
);

/**
 * Clears the server-side sync outbox for a PHC. The sync counter stays
 * monotonic because device cursors are client-side and a lower high watermark
 * would make pullChanges reject every device with 409. Never deletes clinical
 * records; the confirmation text says so.
 */
export const resetPhcSyncState = command(
	v.object({
		phcId: v.pipe(v.string(), v.minLength(1)),
		confirmation: v.literal('RESET SYNC STATE')
	}),
	async ({ phcId }) => {
		requireSuperadmin();
		const event = getRequestEvent();
		const operationsTable = getTable('syncOperations');
		await database.delete(operationsTable).where(eq(operationsTable.phcId, phcId));
		realtimeHub.publish(syncTopics.phc(phcId), {
			entityType: 'syncOperations',
			entityId: phcId,
			operation: 'delete'
		});
		await recordAudit({
			phcId: event.locals.phcId ?? phcId,
			staffId: event.locals.staffId ?? null,
			action: 'superadmin.phc.sync.reset',
			entityType: 'phc',
			entityId: phcId,
			metadata: { clinicalRecordsDeleted: false, cursorPreserved: true }
		});
		return { success: true };
	}
);

import { database, getTable } from './_core';
import { eq, and } from 'drizzle-orm';
import { db } from '../index';

export async function updateStaffPin(staffId: string, hashedPin: string): Promise<void> {
	const staff = getTable('staff');
	await database.update(staff).set({ pin: hashedPin }).where(eq(staff.id, staffId));
}

export async function getStaffByPhc(phcId: string) {
	return await db.query.staff.findMany({
		where: (staff, { eq }) => eq(staff.phcId, phcId),
		columns: { id: true, fullName: true, role: true, active: true },
		with: { user: { columns: { email: true, createdAt: true } } }
	});
}

export async function getAllStaffUsers() {
	const staff = getTable('staff');
	const phcs = getTable('phcs');
	// The Better Auth `user` table is only present in the PostgreSQL schema;
	// the local SQLite schema has no auth-user table. Guard the join so the
	// superadmin directory works on both dialects.
	const users = getTable('user');

	let query = database
		.select({
			id: staff.id,
			name: staff.fullName,
			role: staff.role,
			active: staff.active,
			lastLogin: staff.createdAt,
			phcName: phcs.name,
			email: users ? users.email : null
		})
		.from(staff)
		.leftJoin(phcs, eq(staff.phcId, phcs.id));

	if (users) {
		query = query.leftJoin(users, eq(staff.authUserId, users.id));
	}

	return await query;
}

export async function createStaff(data: Record<string, unknown>) {
	const staff = getTable('staff');
	return await database.insert(staff).values(data).returning();
}

export async function updateStaffProfile(staffId: string, data: Record<string, unknown>) {
	const staff = getTable('staff');
	return await database.update(staff).set(data).where(eq(staff.id, staffId));
}

export async function updateStaffPreferences(staffId: string, preferences: unknown) {
	const staff = getTable('staff');
	return await database
		.update(staff)
		.set({ preferences: JSON.stringify(preferences) })
		.where(eq(staff.id, staffId));
}

export async function updateStaffStatusById(staffId: string, phcId: string, active: boolean) {
	const staff = getTable('staff');
	return await database
		.update(staff)
		.set({ active })
		.where(and(eq(staff.id, staffId), eq(staff.phcId, phcId)));
}

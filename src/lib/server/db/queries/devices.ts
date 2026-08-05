import { database, getTable } from './_core';
import { eq, and, count } from 'drizzle-orm';

export async function getDeviceCountsByPhc(phcId: string) {
	const table = getTable('devices');
	const [activeRes] = await database
		.select({ count: count() })
		.from(table)
		.where(and(eq(table.phcId, phcId), eq(table.status, 'approved')));
	const [pendingRes] = await database
		.select({ count: count() })
		.from(table)
		.where(and(eq(table.phcId, phcId), eq(table.status, 'pending')));

	return {
		activeCount: Number(activeRes?.count ?? 0),
		pendingCount: Number(pendingRes?.count ?? 0)
	};
}

export async function registerPendingDevice(data: {
	phcId: string;
	name: string;
	role: 'kiosk' | 'triage' | 'doctor_tablet' | 'pharmacy_terminal';
}) {
	const table = getTable('devices');
	const [device] = await database
		.insert(table)
		.values({
			phcId: data.phcId,
			name: data.name,
			role: data.role ?? 'kiosk',
			status: 'pending'
		})
		.returning();
	return device;
}

export async function updateDevice(
	deviceId: string,
	updateData: {
		status?: 'pending' | 'approved' | 'revoked';
		role?: 'kiosk' | 'triage' | 'doctor_tablet' | 'pharmacy_terminal';
	}
) {
	const table = getTable('devices');
	return await database
		.update(table)
		.set(updateData)
		.where(eq(table.id, deviceId));
}

export async function deleteDevice(deviceId: string) {
	const table = getTable('devices');
	return await database.delete(table).where(eq(table.id, deviceId));
}

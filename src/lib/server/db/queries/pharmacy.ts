import { database, getTable } from './_core';
import { eq, sql } from 'drizzle-orm';
import { db } from '../index';

export async function getPharmacyInventory(phcId: string) {
	return await db.query.pharmacyInventory.findMany({
		where: (inventory, { eq }) => eq(inventory.phcId, phcId),
		orderBy: (inventory, { asc }) => [asc(inventory.itemName)]
	});
}

export async function dispenseMedicationInDb(data: {
	encounterId: string;
	patientId: string;
	inventoryItemId: string;
	quantity: number;
	dosageInstructions?: string | null;
	staffId?: string | null;
}) {
	const prescriptions = getTable('prescriptions');
	const pharmacyInventory = getTable('pharmacyInventory');

	const [prescription] = await database
		.insert(prescriptions)
		.values({
			encounterId: data.encounterId,
			patientId: data.patientId,
			inventoryItemId: data.inventoryItemId,
			quantity: data.quantity,
			dosageInstructions: data.dosageInstructions ?? null,
			dispensed: true,
			dispensedAt: new Date(),
			dispensedByStaffId: data.staffId ?? null
		})
		.returning();

	await database
		.update(pharmacyInventory)
		.set({
			currentStock: sql`${pharmacyInventory.currentStock} - ${data.quantity}`,
			updatedAt: new Date()
		})
		.where(eq(pharmacyInventory.id, data.inventoryItemId));

	return prescription;
}

export async function createRestockRequestInDb(data: {
	inventoryItemId: string;
	phcId: string;
	requestedByStaffId?: string | null;
	quantityRequested: number;
}) {
	const restockRequests = getTable('restockRequests');

	const [request] = await database
		.insert(restockRequests)
		.values({
			inventoryItemId: data.inventoryItemId,
			phcId: data.phcId,
			requestedByStaffId: data.requestedByStaffId ?? null,
			quantityRequested: data.quantityRequested,
			status: 'pending'
		})
		.returning();

	return request;
}

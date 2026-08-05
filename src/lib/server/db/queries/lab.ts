import { database, getTable } from './_core';
import { eq, desc } from 'drizzle-orm';

export async function getLabRequestsByPhc(phcId: string) {
	const labRequests = getTable('labRequests');
	return await database
		.select()
		.from(labRequests)
		.where(eq(labRequests.phcId, phcId))
		.orderBy(desc(labRequests.createdAt))
		.limit(100);
}

export async function getLabRequestsByPatient(patientId: string) {
	const labRequests = getTable('labRequests');
	return await database
		.select()
		.from(labRequests)
		.where(eq(labRequests.patientId, patientId))
		.orderBy(desc(labRequests.createdAt));
}

export async function createLabRequestRecord(data: {
	encounterId: string;
	patientId: string;
	phcId: string;
	requestedByStaffId?: string | null;
	testType: string;
	urgency: 'routine' | 'urgent' | 'stat';
	notes?: string | null;
	status: 'pending' | 'processing' | 'completed';
}) {
	const labRequests = getTable('labRequests');
	const [labReq] = await database
		.insert(labRequests)
		.values({
			encounterId: data.encounterId,
			patientId: data.patientId,
			phcId: data.phcId,
			requestedByStaffId: data.requestedByStaffId ?? '',
			testType: data.testType,
			urgency: data.urgency,
			notes: data.notes ?? null,
			status: data.status
		})
		.returning();
	return labReq;
}

export async function updateLabResultRecord(data: {
	requestId: string;
	result: string;
	status: 'pending' | 'processing' | 'completed';
	staffId?: string | null;
}) {
	const labRequests = getTable('labRequests');
	const [updated] = await database
		.update(labRequests)
		.set({
			result: data.result,
			status: data.status,
			resultEnteredByStaffId: data.staffId ?? null,
			resultEnteredAt: new Date(),
			updatedAt: new Date()
		})
		.where(eq(labRequests.id, data.requestId))
		.returning();
	return updated;
}

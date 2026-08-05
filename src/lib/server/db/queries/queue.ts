import { database, getTable } from './_core';
import { eq, and, asc, sql } from 'drizzle-orm';

export async function getWaitingQueueByPhc(phcId: string) {
	const queueTickets = getTable('queueTickets');
	const patients = getTable('patients');

	return await database
		.select({
			ticket: queueTickets,
			patient: patients
		})
		.from(queueTickets)
		.leftJoin(patients, eq(queueTickets.patientId, patients.id))
		.where(and(eq(queueTickets.phcId, phcId), eq(queueTickets.status, 'waiting')))
		.orderBy(asc(queueTickets.createdAt));
}

export async function getTodayQueueByPhc(phcId: string) {
	const queueTickets = getTable('queueTickets');
	const patients = getTable('patients');
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	return await database
		.select({ ticket: queueTickets, patient: patients })
		.from(queueTickets)
		.leftJoin(patients, eq(queueTickets.patientId, patients.id))
		.where(and(eq(queueTickets.phcId, phcId), sql`${queueTickets.createdAt} >= ${todayStart}`))
		.orderBy(asc(queueTickets.ticketNumber));
}

export async function issueQueueTicket(data: {
	patientId: string;
	phcId: string;
	encounterId?: string;
	triageLevel: 'unassigned' | 'green' | 'amber' | 'red';
	triageReason?: string;
}) {
	const queueTickets = getTable('queueTickets');
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const existing = await database
		.select()
		.from(queueTickets)
		.where(
			and(eq(queueTickets.phcId, data.phcId), sql`${queueTickets.createdAt} >= ${todayStart}`)
		);
	const ticketNumber = existing.length + 1;

	const [ticket] = await database
		.insert(queueTickets)
		.values({
			patientId: data.patientId,
			phcId: data.phcId,
			encounterId: data.encounterId ?? null,
			ticketNumber,
			triageLevel: data.triageLevel,
			triageReason: data.triageReason ?? null,
			status: 'waiting'
		})
		.returning();

	return ticket;
}

export async function createSelfCheckInTicket(phcId: string, patientId: string) {
	const queueTickets = getTable('queueTickets');
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const existing = await database
		.select()
		.from(queueTickets)
		.where(
			and(eq(queueTickets.phcId, phcId), sql`${queueTickets.createdAt} >= ${todayStart}`)
		);
	const nextTicketNumber = existing.length + 1;

	const [ticket] = await database
		.insert(queueTickets)
		.values({
			phcId,
			patientId,
			ticketNumber: nextTicketNumber,
			status: 'waiting'
		})
		.returning();

	return ticket;
}

export async function callQueueTicket(ticketId: string) {
	const queueTickets = getTable('queueTickets');
	const [updated] = await database
		.update(queueTickets)
		.set({ status: 'called', calledAt: new Date(), updatedAt: new Date() })
		.where(eq(queueTickets.id, ticketId))
		.returning();
	return updated;
}

export async function completeQueueTicket(ticketId: string) {
	const queueTickets = getTable('queueTickets');
	const [updated] = await database
		.update(queueTickets)
		.set({ status: 'done', completedAt: new Date(), updatedAt: new Date() })
		.where(eq(queueTickets.id, ticketId))
		.returning();
	return updated;
}

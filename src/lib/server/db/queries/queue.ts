import { database, getTable } from './_core';
import { eq, and, asc, sql } from 'drizzle-orm';
import { toClientRow } from '#lib/seed/adapters.ts';
import { commitSyncedMutation } from '#lib/server/sync/outbox.ts';

const SERVER_QUEUE_DEVICE = 'server:queue';

function describeQueueTicket(ticket: Record<string, unknown>) {
	if (typeof ticket.id !== 'string' || typeof ticket.phcId !== 'string') {
		throw new Error('Queue mutation did not return a valid ticket');
	}
	return {
		phcId: ticket.phcId,
		entityId: ticket.id,
		payload: toClientRow('queueTickets', ticket),
		clientUpdatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt : Date.now()
	};
}

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
	return await commitSyncedMutation(
		{
			entityType: 'queueTickets',
			operation: 'create',
			deviceId: SERVER_QUEUE_DEVICE,
			describe: describeQueueTicket
		},
		async (tx) => {
			const todayStart = new Date();
			todayStart.setHours(0, 0, 0, 0);
			const existing = await tx
				.select()
				.from(queueTickets)
				.where(
					and(eq(queueTickets.phcId, data.phcId), sql`${queueTickets.createdAt} >= ${todayStart}`)
				);
			const [ticket] = await tx
				.insert(queueTickets)
				.values({
					patientId: data.patientId,
					phcId: data.phcId,
					encounterId: data.encounterId ?? null,
					ticketNumber: existing.length + 1,
					triageLevel: data.triageLevel,
					triageReason: data.triageReason ?? null,
					status: 'waiting'
				})
				.returning();
			return ticket as Record<string, unknown>;
		}
	);
}

export async function createSelfCheckInTicket(phcId: string, patientId: string) {
	const queueTickets = getTable('queueTickets');
	return await commitSyncedMutation(
		{
			entityType: 'queueTickets',
			operation: 'create',
			deviceId: 'server:kiosk',
			describe: describeQueueTicket
		},
		async (tx) => {
			const todayStart = new Date();
			todayStart.setHours(0, 0, 0, 0);
			const existing = await tx
				.select()
				.from(queueTickets)
				.where(and(eq(queueTickets.phcId, phcId), sql`${queueTickets.createdAt} >= ${todayStart}`));
			const [ticket] = await tx
				.insert(queueTickets)
				.values({
					phcId,
					patientId,
					ticketNumber: existing.length + 1,
					status: 'waiting'
				})
				.returning();
			return ticket as Record<string, unknown>;
		}
	);
}

export async function callQueueTicket(ticketId: string, phcId: string) {
	const queueTickets = getTable('queueTickets');
	return await commitSyncedMutation(
		{
			entityType: 'queueTickets',
			operation: 'update',
			deviceId: SERVER_QUEUE_DEVICE,
			describe: describeQueueTicket
		},
		async (tx) => {
			const [updated] = await tx
				.update(queueTickets)
				.set({ status: 'called', calledAt: new Date(), updatedAt: new Date() })
				.where(and(eq(queueTickets.id, ticketId), eq(queueTickets.phcId, phcId)))
				.returning();
			return updated as Record<string, unknown>;
		}
	);
}

export async function completeQueueTicket(ticketId: string, phcId: string) {
	const queueTickets = getTable('queueTickets');
	return await commitSyncedMutation(
		{
			entityType: 'queueTickets',
			operation: 'update',
			deviceId: SERVER_QUEUE_DEVICE,
			describe: describeQueueTicket
		},
		async (tx) => {
			const [updated] = await tx
				.update(queueTickets)
				.set({ status: 'done', completedAt: new Date(), updatedAt: new Date() })
				.where(and(eq(queueTickets.id, ticketId), eq(queueTickets.phcId, phcId)))
				.returning();
			return updated as Record<string, unknown>;
		}
	);
}

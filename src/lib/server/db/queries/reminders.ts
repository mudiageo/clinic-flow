import { database, getTable } from './_core';
import { eq, asc } from 'drizzle-orm';

export async function getRemindersByPhc(phcId: string) {
	const reminders = getTable('reminders');
	return await database
		.select()
		.from(reminders)
		.where(eq(reminders.phcId, phcId))
		.orderBy(asc(reminders.dueDate));
}

export async function createReminderRecord(data: {
	patientId: string;
	phcId: string;
	type: 'immunization' | 'antenatal' | 'follow_up';
	label: string;
	dueDate: string;
	recipientPhone: string;
}) {
	const reminders = getTable('reminders');
	const [reminder] = await database
		.insert(reminders)
		.values({
			patientId: data.patientId,
			phcId: data.phcId,
			type: data.type,
			label: data.label,
			dueDate: new Date(data.dueDate),
			recipientPhone: data.recipientPhone,
			status: 'scheduled'
		})
		.returning();
	return reminder;
}

import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { RequestEvent } from './$types';

export async function POST({ request }: RequestEvent) {
	try {
		const payload = await request.json();
		
		// Termii webhook format usually includes `from`, `to`, `message`
		const fromPhone = payload.from;
		const toPhone = payload.to;
		const message = payload.message || '';
		const messageId = payload.message_id || payload.id;
		
		if (!fromPhone || !message) {
			return json({ success: false, error: 'Invalid payload' }, { status: 400 });
		}
		
		// 1. Try to identify the patient by phone number
		// Note: in a real app, phone number parsing/formatting is needed
		const patient = await db.query.patients.findFirst({
			where: (t, { eq, or, like }) => or(
				eq(t.phone, fromPhone),
				like(t.phone, `%${fromPhone.replace(/^\+?234/, '0')}%`) // very naive matching for demo
			)
		});
		
		let phcId = patient?.phcId || null;
		
		// 2. Save the message to the inbox
		await db.insert(schema.smsInbox).values({
			fromPhone,
			toPhone,
			message,
			providerMessageId: messageId,
			patientId: patient?.id,
			phcId: phcId
		} as any);
		
		// 3. Process commands
		const msgLower = message.trim().toLowerCase();
		
		if (msgLower === 'confirm' && patient) {
			// Find the next scheduled appointment
			const nextAppt = await db.query.appointments.findFirst({
				where: (t, { eq, and, gt }) => and(
					eq(t.patientId, patient.id),
					eq(t.status, 'scheduled')
				),
				orderBy: (t, { asc }) => asc(t.scheduledAt)
			});
			
			if (nextAppt) {
				await db.update(schema.appointments)
					.set({ isConfirmed: true })
					.where(eq(schema.appointments.id, nextAppt.id));
			}
		} else if (msgLower === 'stop' && patient) {
			// Typically would mark patient preferences to not receive SMS
			// For the hackathon, we could just delete future reminders or set a flag
			const prefs = { doNotSMS: true };
			// db.update(schema.patients) -> no preferences field on patients currently.
		}
		
		// Because this was changed on the server, the sync engine will eventually 
		// need to push these changes to clients if we were mirroring `smsInbox` or `appointments.isConfirmed`
		// We'd create syncOperations here in a full app. For the demo, we rely on the server state.
		if (phcId && patient && msgLower === 'confirm') {
			// Sync down the appointment confirmation
			await db.insert(schema.syncOperations).values({
				phcId: phcId,
				deviceId: 'server-webhook',
				entityType: 'appointments',
				entityId: nextAppt?.id || 'temp',
				operation: 'update',
				payload: JSON.stringify({ isConfirmed: true }),
				clientUpdatedAt: new Date()
			} as any).catch(e => console.error("Webhook sync operation failed", e));
		}
		
		return json({ success: true });
	} catch (err: any) {
		console.error('Termii webhook error:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
}

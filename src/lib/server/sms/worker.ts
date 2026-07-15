import { db } from '$lib/server/db';
import { reminders } from '$lib/server/db/schema';
import { TERMII_API_KEY, TERMII_SENDER_ID } from '$app/env/private';
import { eq, lte, and } from 'drizzle-orm';

let isRunning = false;
let workerInterval: ReturnType<typeof setInterval> | null = null;

export function startSmsWorker() {
	if (workerInterval) return;

	console.log('[SMS Worker] Starting SMS Dispatch Worker...');
	// Run every 10 minutes
	workerInterval = setInterval(processReminders, 10 * 60 * 1000);

	// Run once immediately on startup
	setTimeout(processReminders, 5000);
}

async function processReminders() {
	if (isRunning) return;
	isRunning = true;

	try {
		const now = new Date();
		// Fetch scheduled reminders where the due date is in the past or now
		const pendingReminders = await db.query.reminders.findMany({
			where: (r, { eq, lte, and }) =>
				and(eq(r.status, 'scheduled'), lte(r.dueDate, now))
		});

		if (pendingReminders.length === 0) {
			isRunning = false;
			return;
		}

		console.log(`[SMS Worker] Found ${pendingReminders.length} pending reminders to dispatch.`);

		for (const reminder of pendingReminders) {
			let success = false;
			let providerMessageId = '';
			const provider = reminder.provider || 'termii';

			if (provider === 'termii') {
				const termiiApiKey = TERMII_API_KEY || process.env.TERMII_API_KEY;
				const termiiSenderId = TERMII_SENDER_ID || process.env.TERMII_SENDER_ID || 'ClinicFlow';

				if (!termiiApiKey) {
					console.warn('[SMS Worker] TERMII_API_KEY not configured. Mocking SMS dispatch.');
					success = true;
					providerMessageId = `mock-termii-${Date.now()}`;
				} else {
					try {
						const res = await fetch('https://api.ng.termii.com/api/sms/send', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								api_key: termiiApiKey,
								to: reminder.recipientPhone,
								from: termiiSenderId,
								sms: reminder.label,
								type: 'plain',
								channel: 'generic'
							})
						});

						const data = await res.json();
						if (res.ok && data.message_id) {
							success = true;
							providerMessageId = data.message_id;
						} else {
							console.error(`[SMS Worker] Termii API Error:`, data);
						}
					} catch (e) {
						console.error(`[SMS Worker] Termii network error:`, e);
					}
				}
			} else if (provider === 'africas_talking') {
				// Stub for Africa's Talking fallback
				console.warn('[SMS Worker] Africa\'s Talking provider stubbed. Mocking SMS dispatch.');
				success = true;
				providerMessageId = `mock-at-${Date.now()}`;
			}

			// Update the database
			await db
				.update(reminders)
				.set({
					status: success ? 'sent' : 'failed',
					sentAt: success ? new Date() : null,
					providerMessageId: providerMessageId || null
				})
				.where(eq(reminders.id, reminder.id));
		}
	} catch (e) {
		console.error('[SMS Worker] Error processing reminders:', e);
	} finally {
		isRunning = false;
	}
}

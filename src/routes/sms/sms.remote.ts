import { command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import * as v from 'valibot';
import { recordAudit } from '#lib/server/audit.ts';
import { database, getTable } from '#lib/server/db/queries/_core.ts';
import { getPhcSmsApiKey, dispatchSms } from '#lib/server/integrations/sms-provider.ts';
import { requirePermission } from '#lib/server/permissions.ts';
import { toClientRow } from '#lib/seed/adapters.ts';
import { commitSyncedMutation } from '#lib/server/sync/outbox.ts';

const SERVER_SMS_DEVICE = 'server:sms';

/**
 * Persists a dispatch outcome and its durable sync record atomically so the
 * PHC's devices observe the new reminder status through normal cursor sync.
 */
async function persistReminderOutcome(
	phcId: string,
	id: string,
	values: Record<string, unknown>
): Promise<void> {
	await commitSyncedMutation(
		{
			entityType: 'reminders',
			operation: 'update',
			deviceId: SERVER_SMS_DEVICE,
			describe: (row: Record<string, unknown>) => ({
				phcId,
				entityId: id,
				payload: toClientRow('reminders', row),
				clientUpdatedAt: Date.now()
			})
		},
		async (tx) => {
			const reminders = getTable('reminders');
			const [updated] = await tx
				.update(reminders)
				.set(values)
				.where(eq(reminders.id, id))
				.returning();
			return updated as Record<string, unknown>;
		}
	);
}

export interface ReminderDispatchResult {
	id: string;
	success: boolean;
	mode: 'live' | 'console';
	reference: string | null;
	reason: string | null;
}

/**
 * Dispatches only reminders that are verified to belong to the signed-in PHC.
 * The phone number and message are derived from durable rows, never from the
 * client payload, and failed deliveries are recorded as failed.
 */
export const dispatchReminders = command(
	v.array(v.object({ id: v.pipe(v.string(), v.uuid()) })),
	async (batch): Promise<ReminderDispatchResult[]> => {
		await requirePermission('manage:reminders');
		const event = getRequestEvent();
		const phcId = event.locals.phcId;
		if (!phcId) error(401, 'Unauthorized');
		if (batch.length === 0 || batch.length > 100) error(400, 'Invalid reminder batch size');

		const table = getTable('reminders');
		const ids = batch.map((item) => item.id);
		const rows = await database
			.select()
			.from(table)
			.where(and(eq(table.phcId, phcId), inArray(table.id, ids)))
			.limit(100);
		const byId = new Map(rows.map((row: { id: string }) => [row.id, row]));
		const phcApiKey = await getPhcSmsApiKey(phcId);
		const results: ReminderDispatchResult[] = [];

		for (const id of ids) {
			const reminder = byId.get(id) as
				| { id: string; label: string; recipientPhone: string | null; status: string }
				| undefined;
			if (!reminder) {
				results.push({
					id,
					success: false,
					mode: 'console',
					reference: null,
					reason: 'Reminder not found'
				});
				continue;
			}
			if (!reminder.recipientPhone) {
				await persistReminderOutcome(phcId, id, { status: 'failed' });
				results.push({
					id,
					success: false,
					mode: 'console',
					reference: null,
					reason: 'No recipient phone number on file'
				});
				continue;
			}

			const outcome = await dispatchSms({
				phcId,
				to: reminder.recipientPhone,
				message: `ClinicFlow Reminder: ${reminder.label}`,
				phcApiKey
			});

			if (!outcome.ok) {
				await persistReminderOutcome(phcId, id, {
					status: 'failed',
					provider: outcome.mode === 'live' ? 'termii' : 'console',
					providerMessageId: null
				});
				results.push({
					id,
					success: false,
					mode: outcome.mode,
					reference: null,
					reason: outcome.error
				});
				continue;
			}

			await persistReminderOutcome(phcId, id, {
				status: 'sent',
				sentAt: new Date(),
				provider: outcome.mode === 'live' ? 'termii' : 'console',
				providerMessageId: outcome.data.reference
			});

			results.push({
				id,
				success: true,
				mode: outcome.mode,
				reference: outcome.data.reference,
				reason: outcome.mode === 'console' ? outcome.reason : null
			});
		}

		await recordAudit({
			phcId,
			staffId: event.locals.staffId ?? null,
			action: 'sms.reminders.dispatch',
			entityType: 'reminder',
			entityId: null,
			metadata: {
				count: results.length,
				live: results.filter((r) => r.success && r.mode === 'live').length
			}
		});

		return results;
	}
);

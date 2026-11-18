import { and, count, desc, eq, gt, inArray, isNull, lte, or } from 'drizzle-orm';
import { database, getTable } from './_core';
import { ANNOUNCEMENT_ADMIN_ROLES } from '#lib/types/announcements.ts';
import type {
	AnnouncementAudience,
	AnnouncementView,
	PlatformAnnouncementView,
	PublishAnnouncementInput
} from '#lib/types/announcements.ts';
import { announcementIsVisibleToRecipient } from '#lib/announcements/policy.ts';

export interface RecipientContext {
	staffId: string;
	phcId: string;
	role: string;
}

function toEpoch(value: Date | string | number | null | undefined): number | null {
	if (value == null) return null;
	if (typeof value === 'number') return value;
	return new Date(value).getTime();
}

function isClinicAdmin(role: string): boolean {
	return (ANNOUNCEMENT_ADMIN_ROLES as readonly string[]).includes(role);
}

export async function getActiveRecipientContext(staffId: string): Promise<RecipientContext | null> {
	const staff = getTable('staff');
	const [record] = await database
		.select({ id: staff.id, phcId: staff.phcId, role: staff.role, active: staff.active })
		.from(staff)
		.where(eq(staff.id, staffId))
		.limit(1);

	if (!record?.active) return null;
	return { staffId: record.id, phcId: record.phcId, role: record.role };
}

export async function countAnnouncementRecipients(
	audience: AnnouncementAudience,
	targetPhcId?: string | null
): Promise<number> {
	const staff = getTable('staff');
	const conditions = [eq(staff.active, true)];

	if (audience === 'admins') {
		conditions.push(inArray(staff.role, [...ANNOUNCEMENT_ADMIN_ROLES]));
	} else if (audience === 'phc') {
		if (!targetPhcId) return 0;
		conditions.push(eq(staff.phcId, targetPhcId));
	}

	const [result] = await database
		.select({ value: count() })
		.from(staff)
		.where(and(...conditions));

	return Number(result?.value ?? 0);
}

export async function phcExists(phcId: string): Promise<boolean> {
	const phcs = getTable('phcs');
	const [record] = await database
		.select({ id: phcs.id })
		.from(phcs)
		.where(eq(phcs.id, phcId))
		.limit(1);
	return Boolean(record);
}

export async function getAnnouncementsForRecipient(
	context: RecipientContext
): Promise<AnnouncementView[]> {
	const announcements = getTable('announcements');
	const receipts = getTable('announcementReceipts');
	const now = new Date();
	const audienceConditions = [
		eq(announcements.audience, 'all'),
		and(eq(announcements.audience, 'phc'), eq(announcements.targetPhcId, context.phcId))
	];

	if (isClinicAdmin(context.role)) {
		audienceConditions.push(eq(announcements.audience, 'admins'));
	}

	const rows = await database
		.select({
			id: announcements.id,
			title: announcements.title,
			body: announcements.body,
			severity: announcements.severity,
			audience: announcements.audience,
			targetPhcId: announcements.targetPhcId,
			status: announcements.status,
			requiresAcknowledgement: announcements.requiresAcknowledgement,
			actionLabel: announcements.actionLabel,
			actionUrl: announcements.actionUrl,
			scheduledFor: announcements.scheduledFor,
			publishedAt: announcements.publishedAt,
			expiresAt: announcements.expiresAt,
			createdAt: announcements.createdAt,
			updatedAt: announcements.updatedAt,
			readAt: receipts.readAt,
			acknowledgedAt: receipts.acknowledgedAt
		})
		.from(announcements)
		.leftJoin(
			receipts,
			and(eq(receipts.announcementId, announcements.id), eq(receipts.staffId, context.staffId))
		)
		.where(
			and(
				or(
					and(eq(announcements.status, 'published'), lte(announcements.publishedAt, now)),
					and(eq(announcements.status, 'scheduled'), lte(announcements.scheduledFor, now))
				),
				or(isNull(announcements.expiresAt), gt(announcements.expiresAt, now)),
				or(...audienceConditions)
			)
		)
		.orderBy(desc(announcements.createdAt))
		.limit(100);

	return rows
		.map((row: Record<string, unknown>): AnnouncementView => ({
			id: String(row.id),
			title: String(row.title),
			body: String(row.body),
			severity: row.severity as AnnouncementView['severity'],
			audience: row.audience as AnnouncementView['audience'],
			targetPhcId: (row.targetPhcId as string | null) ?? null,
			status: row.status as AnnouncementView['status'],
			requiresAcknowledgement: Boolean(row.requiresAcknowledgement),
			actionLabel: (row.actionLabel as string | null) ?? null,
			actionUrl: (row.actionUrl as string | null) ?? null,
			scheduledFor: toEpoch(row.scheduledFor as Date | string | number | null),
			publishedAt: toEpoch(row.publishedAt as Date | string | number | null),
			expiresAt: toEpoch(row.expiresAt as Date | string | number | null),
			createdAt: toEpoch(row.createdAt as Date | string | number) ?? 0,
			updatedAt: toEpoch(row.updatedAt as Date | string | number) ?? 0,
			readAt: toEpoch(row.readAt as Date | string | number | null),
			acknowledgedAt: toEpoch(row.acknowledgedAt as Date | string | number | null)
		}))
		.filter((item: AnnouncementView) =>
			announcementIsVisibleToRecipient(item, { phcId: context.phcId, role: context.role })
		);
}

export async function listAnnouncementsForPlatform(): Promise<PlatformAnnouncementView[]> {
	const announcements = getTable('announcements');
	const staff = getTable('staff');
	const phcs = getTable('phcs');
	const receipts = getTable('announcementReceipts');

	const rows = await database
		.select({
			id: announcements.id,
			title: announcements.title,
			body: announcements.body,
			severity: announcements.severity,
			audience: announcements.audience,
			targetPhcId: announcements.targetPhcId,
			status: announcements.status,
			requiresAcknowledgement: announcements.requiresAcknowledgement,
			actionLabel: announcements.actionLabel,
			actionUrl: announcements.actionUrl,
			scheduledFor: announcements.scheduledFor,
			publishedAt: announcements.publishedAt,
			expiresAt: announcements.expiresAt,
			createdAt: announcements.createdAt,
			updatedAt: announcements.updatedAt,
			createdByStaffId: announcements.createdByStaffId,
			createdByName: staff.fullName,
			targetPhcName: phcs.name,
			estimatedRecipients: announcements.estimatedRecipients
		})
		.from(announcements)
		.leftJoin(staff, eq(staff.id, announcements.createdByStaffId))
		.leftJoin(phcs, eq(phcs.id, announcements.targetPhcId))
		.orderBy(desc(announcements.createdAt))
		.limit(100);

	const ids = rows.map((row: { id: string }) => row.id);
	const receiptRows =
		ids.length === 0
			? []
			: await database
					.select({
						announcementId: receipts.announcementId,
						readAt: receipts.readAt,
						acknowledgedAt: receipts.acknowledgedAt
					})
					.from(receipts)
					.where(inArray(receipts.announcementId, ids));

	const receiptCounts = new Map<string, { read: number; acknowledged: number }>();
	for (const receipt of receiptRows) {
		const current = receiptCounts.get(receipt.announcementId) ?? { read: 0, acknowledged: 0 };
		if (receipt.readAt) current.read += 1;
		if (receipt.acknowledgedAt) current.acknowledged += 1;
		receiptCounts.set(receipt.announcementId, current);
	}

	return rows.map((row: Record<string, unknown>) => {
		const counts = receiptCounts.get(String(row.id)) ?? { read: 0, acknowledged: 0 };
		return {
			id: String(row.id),
			title: String(row.title),
			body: String(row.body),
			severity: row.severity as PlatformAnnouncementView['severity'],
			audience: row.audience as PlatformAnnouncementView['audience'],
			targetPhcId: (row.targetPhcId as string | null) ?? null,
			status: row.status as PlatformAnnouncementView['status'],
			requiresAcknowledgement: Boolean(row.requiresAcknowledgement),
			actionLabel: (row.actionLabel as string | null) ?? null,
			actionUrl: (row.actionUrl as string | null) ?? null,
			scheduledFor: toEpoch(row.scheduledFor as Date | string | number | null),
			publishedAt: toEpoch(row.publishedAt as Date | string | number | null),
			expiresAt: toEpoch(row.expiresAt as Date | string | number | null),
			createdAt: toEpoch(row.createdAt as Date | string | number) ?? 0,
			updatedAt: toEpoch(row.updatedAt as Date | string | number) ?? 0,
			createdByStaffId: (row.createdByStaffId as string | null) ?? null,
			createdByName: (row.createdByName as string | null) ?? null,
			targetPhcName: (row.targetPhcName as string | null) ?? null,
			estimatedRecipients: Number(row.estimatedRecipients ?? 0),
			readCount: counts.read,
			acknowledgedCount: counts.acknowledged
		};
	});
}

export async function insertAnnouncementWithAudit(
	input: PublishAnnouncementInput & {
		status: 'scheduled' | 'published';
		publishedAt: Date | null;
		createdByStaffId: string;
		estimatedRecipients: number;
	},
	audit: { phcId: string; staffId: string; ip: string | null }
) {
	const announcements = getTable('announcements');
	const auditLog = getTable('auditLog');

	return await database.transaction(async (tx: typeof database) => {
		const [created] = await tx
			.insert(announcements)
			.values({
				title: input.title,
				body: input.body,
				severity: input.severity,
				audience: input.audience,
				targetPhcId: input.audience === 'phc' ? input.targetPhcId : null,
				status: input.status,
				requiresAcknowledgement:
					input.severity === 'critical' || Boolean(input.requiresAcknowledgement),
				actionLabel: input.actionLabel || null,
				actionUrl: input.actionUrl || null,
				scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
				publishedAt: input.publishedAt,
				expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
				createdByStaffId: input.createdByStaffId,
				estimatedRecipients: input.estimatedRecipients,
				updatedAt: new Date()
			})
			.returning();

		await tx.insert(auditLog).values({
			phcId: audit.phcId,
			staffId: audit.staffId,
			action: 'announcement.publish',
			entityType: 'announcement',
			entityId: created.id,
			metadata: JSON.stringify({
				audience: created.audience,
				targetPhcId: created.targetPhcId,
				severity: created.severity,
				status: created.status,
				estimatedRecipients: created.estimatedRecipients
			}),
			ip: audit.ip
		});

		return created;
	});
}

export async function archiveAnnouncementWithAudit(
	announcementId: string,
	audit: { phcId: string; staffId: string; ip: string | null }
) {
	const announcements = getTable('announcements');
	const auditLog = getTable('auditLog');

	return await database.transaction(async (tx: typeof database) => {
		const [archived] = await tx
			.update(announcements)
			.set({ status: 'archived', updatedAt: new Date() })
			.where(eq(announcements.id, announcementId))
			.returning();

		if (!archived) return null;

		await tx.insert(auditLog).values({
			phcId: audit.phcId,
			staffId: audit.staffId,
			action: 'announcement.archive',
			entityType: 'announcement',
			entityId: archived.id,
			metadata: JSON.stringify({ audience: archived.audience, targetPhcId: archived.targetPhcId }),
			ip: audit.ip
		});

		return archived;
	});
}

export async function upsertAnnouncementReceipt(
	announcementId: string,
	staffId: string,
	acknowledge: boolean
) {
	const receipts = getTable('announcementReceipts');
	const now = new Date();
	const values = {
		announcementId,
		staffId,
		readAt: now,
		acknowledgedAt: acknowledge ? now : null
	};

	await database
		.insert(receipts)
		.values(values)
		.onConflictDoUpdate({
			target: [receipts.announcementId, receipts.staffId],
			set: acknowledge ? { readAt: now, acknowledgedAt: now } : { readAt: now }
		});
}

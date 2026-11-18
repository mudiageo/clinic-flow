import { command, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { requireSuperadmin } from '#lib/server/rbac.ts';
import {
	archiveAnnouncementWithAudit,
	countAnnouncementRecipients,
	getActiveRecipientContext,
	getAnnouncementsForRecipient,
	insertAnnouncementWithAudit,
	listAnnouncementsForPlatform,
	phcExists,
	upsertAnnouncementReceipt,
	type RecipientContext
} from '#lib/server/db/queries/announcements.ts';
import { announcementTopics, realtimeHub } from '#lib/server/realtime/hub.ts';
import {
	ANNOUNCEMENT_ADMIN_ROLES,
	ANNOUNCEMENT_AUDIENCES,
	ANNOUNCEMENT_SEVERITIES
} from '#lib/types/announcements.ts';
import type {
	AnnouncementAudience,
	AnnouncementView,
	PlatformAnnouncementView
} from '#lib/types/announcements.ts';

const audienceSchema = v.object({
	audience: v.picklist(ANNOUNCEMENT_AUDIENCES),
	targetPhcId: v.optional(v.nullable(v.pipe(v.string(), v.uuid())))
});

const publishSchema = v.object({
	title: v.pipe(v.string(), v.trim(), v.minLength(3), v.maxLength(160)),
	body: v.pipe(v.string(), v.trim(), v.minLength(3), v.maxLength(5_000)),
	severity: v.picklist(ANNOUNCEMENT_SEVERITIES),
	audience: v.picklist(ANNOUNCEMENT_AUDIENCES),
	targetPhcId: v.optional(v.nullable(v.pipe(v.string(), v.uuid()))),
	requiresAcknowledgement: v.optional(v.boolean(), false),
	actionLabel: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(80)))),
	actionUrl: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(500)))),
	scheduledFor: v.optional(v.nullable(v.pipe(v.number(), v.integer()))),
	expiresAt: v.optional(v.nullable(v.pipe(v.number(), v.integer())))
});

const idSchema = v.pipe(v.string(), v.uuid());

function topicsForRecipient(context: RecipientContext): string[] {
	const topics = [announcementTopics.all, announcementTopics.phc(context.phcId)];
	if ((ANNOUNCEMENT_ADMIN_ROLES as readonly string[]).includes(context.role)) {
		topics.push(announcementTopics.admins);
	}
	return topics;
}

function topicForAudience(audience: AnnouncementAudience, targetPhcId?: string | null): string {
	if (audience === 'admins') return announcementTopics.admins;
	if (audience === 'phc' && targetPhcId) return announcementTopics.phc(targetPhcId);
	return announcementTopics.all;
}

function snapshotVersion(items: AnnouncementView[]): string {
	return items
		.map((item) => `${item.id}:${item.updatedAt}:${item.readAt ?? 0}:${item.acknowledgedAt ?? 0}`)
		.join('|');
}

function platformSnapshotVersion(items: PlatformAnnouncementView[]): string {
	return items
		.map(
			(item) =>
				`${item.id}:${item.updatedAt}:${item.status}:${item.readCount}:${item.acknowledgedCount}`
		)
		.join('|');
}

function getClientIp(): string | null {
	try {
		return getRequestEvent().getClientAddress();
	} catch {
		return null;
	}
}

function isSafeActionUrl(value: string | null | undefined): boolean {
	if (!value) return true;
	if (value.startsWith('/') && !value.startsWith('//')) return true;
	try {
		return new URL(value).protocol === 'https:';
	} catch {
		return false;
	}
}

async function requireRecipient(): Promise<RecipientContext> {
	const { locals } = getRequestEvent();
	if (!locals.user || !locals.staffId) error(401, 'Unauthorized');
	const context = await getActiveRecipientContext(locals.staffId);
	if (!context) error(403, 'Staff account is inactive or unavailable');
	return context;
}

function requireAnnouncementManager() {
	requireSuperadmin();
	const { locals } = getRequestEvent();
	if (!locals.user || !locals.staffId || !locals.phcId) error(401, 'Unauthorized');
	return {
		staffId: locals.staffId,
		phcId: locals.phcId,
		ip: getClientIp()
	};
}

async function validateAudience(audience: AnnouncementAudience, targetPhcId?: string | null) {
	if (audience === 'phc') {
		if (!targetPhcId) error(400, 'A target PHC is required');
		if (!(await phcExists(targetPhcId))) error(404, 'Target PHC not found');
	} else if (targetPhcId) {
		error(400, 'A target PHC is only valid for PHC announcements');
	}
}

export const getAnnouncementReach = query(audienceSchema, async ({ audience, targetPhcId }) => {
	requireAnnouncementManager();
	await validateAudience(audience, targetPhcId);
	return await countAnnouncementRecipients(audience, targetPhcId);
});

export const listPlatformAnnouncements = query(async () => {
	requireAnnouncementManager();
	return await listAnnouncementsForPlatform();
});

export const getMyAnnouncements = query(async () => {
	const context = await requireRecipient();
	return await getAnnouncementsForRecipient(context);
});

export const watchAnnouncements = query.live(async function* () {
	const request = getRequestEvent().request;
	let context = await requireRecipient();
	let currentVersion = '';

	while (!request.signal.aborted) {
		const initial = await getAnnouncementsForRecipient(context);
		const initialVersion = snapshotVersion(initial);
		if (initialVersion !== currentVersion) {
			currentVersion = initialVersion;
			yield initial;
		}

		const topics = topicsForRecipient(context);
		for await (const _signal of realtimeHub.subscribe(topics, {
			signal: request.signal,
			heartbeatMs: 30_000
		})) {
			const refreshedContext = await getActiveRecipientContext(context.staffId);
			if (!refreshedContext) error(403, 'Staff account is inactive or unavailable');

			const scopeChanged =
				refreshedContext.phcId !== context.phcId || refreshedContext.role !== context.role;
			context = refreshedContext;

			const next = await getAnnouncementsForRecipient(context);
			const nextVersion = snapshotVersion(next);
			if (nextVersion !== currentVersion) {
				currentVersion = nextVersion;
				yield next;
			}

			if (scopeChanged) break;
		}
	}
});

export const watchPlatformAnnouncements = query.live(async function* () {
	const request = getRequestEvent().request;
	let currentVersion = '';

	while (!request.signal.aborted) {
		requireAnnouncementManager();
		const initial = await listAnnouncementsForPlatform();
		const initialVersion = platformSnapshotVersion(initial);
		if (initialVersion !== currentVersion) {
			currentVersion = initialVersion;
			yield initial;
		}

		for await (const _signal of realtimeHub.subscribe([announcementTopics.management], {
			signal: request.signal,
			heartbeatMs: 30_000
		})) {
			requireAnnouncementManager();
			const next = await listAnnouncementsForPlatform();
			const nextVersion = platformSnapshotVersion(next);
			if (nextVersion !== currentVersion) {
				currentVersion = nextVersion;
				yield next;
			}
		}
	}
});

export const publishAnnouncement = command(publishSchema, async (data) => {
	const manager = requireAnnouncementManager();
	await validateAudience(data.audience, data.targetPhcId);

	if (!isSafeActionUrl(data.actionUrl)) {
		error(400, 'Action URL must be an internal path or use HTTPS');
	}

	const now = Date.now();
	const scheduledFor = data.scheduledFor && data.scheduledFor > now ? data.scheduledFor : null;
	const effectiveStart = scheduledFor ?? now;
	if (data.expiresAt && data.expiresAt <= effectiveStart) {
		error(400, 'Expiry must be after publication');
	}

	const estimatedRecipients = await countAnnouncementRecipients(data.audience, data.targetPhcId);
	if (estimatedRecipients === 0) error(400, 'The selected audience has no active recipients');

	const created = await insertAnnouncementWithAudit(
		{
			...data,
			targetPhcId: data.audience === 'phc' ? data.targetPhcId : null,
			status: scheduledFor ? 'scheduled' : 'published',
			scheduledFor,
			publishedAt: scheduledFor ? null : new Date(now),
			createdByStaffId: manager.staffId,
			estimatedRecipients
		},
		manager
	);

	realtimeHub.publish(topicForAudience(created.audience, created.targetPhcId), {
		entityType: 'announcement',
		entityId: created.id,
		operation: 'create'
	});
	realtimeHub.publish(announcementTopics.management, {
		entityType: 'announcement',
		entityId: created.id,
		operation: 'create'
	});
	void listPlatformAnnouncements().refresh();

	return { id: created.id, status: created.status, estimatedRecipients };
});

export const archiveAnnouncement = command(idSchema, async (announcementId) => {
	const manager = requireAnnouncementManager();
	const archived = await archiveAnnouncementWithAudit(announcementId, manager);
	if (!archived) error(404, 'Announcement not found');

	realtimeHub.publish(topicForAudience(archived.audience, archived.targetPhcId), {
		entityType: 'announcement',
		entityId: archived.id,
		operation: 'delete'
	});
	realtimeHub.publish(announcementTopics.management, {
		entityType: 'announcement',
		entityId: archived.id,
		operation: 'delete'
	});
	void listPlatformAnnouncements().refresh();

	return { success: true };
});

async function updateReceipt(announcementId: string, acknowledge: boolean) {
	const context = await requireRecipient();
	const visible = await getAnnouncementsForRecipient(context);
	const announcement = visible.find((item) => item.id === announcementId);
	if (!announcement) error(404, 'Announcement not found');
	if (acknowledge && !announcement.requiresAcknowledgement) {
		error(400, 'This announcement does not require acknowledgement');
	}

	await upsertAnnouncementReceipt(announcementId, context.staffId, acknowledge);
	realtimeHub.publish(announcementTopics.management, {
		entityType: 'announcementReceipt',
		entityId: announcementId,
		operation: 'update'
	});
	void getMyAnnouncements().refresh();
	void watchAnnouncements().reconnect();
	return { success: true, recordedAt: Date.now() };
}

export const markAnnouncementRead = command(idSchema, (announcementId) =>
	updateReceipt(announcementId, false)
);

export const acknowledgeAnnouncement = command(idSchema, (announcementId) =>
	updateReceipt(announcementId, true)
);

import {
	ANNOUNCEMENT_ADMIN_ROLES,
	type AnnouncementAudience,
	type AnnouncementStatus
} from '#lib/types/announcements.ts';

export interface AnnouncementPolicyRecord {
	audience: AnnouncementAudience;
	targetPhcId: string | null;
	status: AnnouncementStatus;
	publishedAt: number | null;
	scheduledFor: number | null;
	expiresAt: number | null;
}

export interface AnnouncementRecipient {
	phcId: string;
	role: string;
}

export function announcementMatchesRecipient(
	announcement: Pick<AnnouncementPolicyRecord, 'audience' | 'targetPhcId'>,
	recipient: AnnouncementRecipient
): boolean {
	if (announcement.audience === 'all') return true;
	if (announcement.audience === 'admins') {
		return (ANNOUNCEMENT_ADMIN_ROLES as readonly string[]).includes(recipient.role);
	}
	return announcement.targetPhcId === recipient.phcId;
}

export function announcementIsActive(
	announcement: AnnouncementPolicyRecord,
	now = Date.now()
): boolean {
	if (announcement.status === 'draft' || announcement.status === 'archived') return false;
	if (announcement.expiresAt !== null && announcement.expiresAt <= now) return false;

	if (announcement.status === 'scheduled') {
		return announcement.scheduledFor !== null && announcement.scheduledFor <= now;
	}

	return announcement.publishedAt !== null && announcement.publishedAt <= now;
}

export function announcementIsVisibleToRecipient(
	announcement: AnnouncementPolicyRecord,
	recipient: AnnouncementRecipient,
	now = Date.now()
): boolean {
	return (
		announcementIsActive(announcement, now) && announcementMatchesRecipient(announcement, recipient)
	);
}

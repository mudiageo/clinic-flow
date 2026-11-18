export const ANNOUNCEMENT_SEVERITIES = ['info', 'warning', 'critical'] as const;
export const ANNOUNCEMENT_AUDIENCES = ['all', 'admins', 'phc'] as const;
export const ANNOUNCEMENT_STATUSES = ['draft', 'scheduled', 'published', 'archived'] as const;
export const ANNOUNCEMENT_ADMIN_ROLES = ['admin', 'oic'] as const;

export type AnnouncementSeverity = (typeof ANNOUNCEMENT_SEVERITIES)[number];
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];
export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];

export interface AnnouncementView {
	id: string;
	title: string;
	body: string;
	severity: AnnouncementSeverity;
	audience: AnnouncementAudience;
	targetPhcId: string | null;
	status: AnnouncementStatus;
	requiresAcknowledgement: boolean;
	actionLabel: string | null;
	actionUrl: string | null;
	scheduledFor: number | null;
	publishedAt: number | null;
	expiresAt: number | null;
	createdAt: number;
	updatedAt: number;
	readAt: number | null;
	acknowledgedAt: number | null;
}

export interface PlatformAnnouncementView extends Omit<
	AnnouncementView,
	'readAt' | 'acknowledgedAt'
> {
	createdByStaffId: string | null;
	createdByName: string | null;
	targetPhcName: string | null;
	estimatedRecipients: number;
	readCount: number;
	acknowledgedCount: number;
}

export interface AnnouncementReachInput {
	audience: AnnouncementAudience;
	targetPhcId?: string | null;
}

export interface PublishAnnouncementInput extends AnnouncementReachInput {
	title: string;
	body: string;
	severity: AnnouncementSeverity;
	requiresAcknowledgement?: boolean;
	actionLabel?: string | null;
	actionUrl?: string | null;
	scheduledFor?: number | null;
	expiresAt?: number | null;
}

export type AnnouncementConnectionState =
	| 'idle'
	| 'connecting'
	| 'live'
	| 'stale'
	| 'offline'
	| 'error';

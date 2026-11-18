import { describe, expect, it } from 'vite-plus/test';
import {
	announcementIsActive,
	announcementIsVisibleToRecipient,
	announcementMatchesRecipient,
	type AnnouncementPolicyRecord
} from './policy.ts';

const now = Date.UTC(2026, 10, 17, 12);

function announcement(overrides: Partial<AnnouncementPolicyRecord> = {}): AnnouncementPolicyRecord {
	return {
		audience: 'all',
		targetPhcId: null,
		status: 'published',
		publishedAt: now - 1_000,
		scheduledFor: null,
		expiresAt: null,
		...overrides
	};
}

describe('announcement policy', () => {
	it('isolates PHC-targeted announcements', () => {
		const item = announcement({ audience: 'phc', targetPhcId: 'phc-one' });

		expect(announcementMatchesRecipient(item, { phcId: 'phc-one', role: 'nurse' })).toBe(true);
		expect(announcementMatchesRecipient(item, { phcId: 'phc-two', role: 'nurse' })).toBe(false);
	});

	it('targets only the explicit clinic administrator roles', () => {
		const item = announcement({ audience: 'admins' });

		expect(announcementMatchesRecipient(item, { phcId: 'one', role: 'admin' })).toBe(true);
		expect(announcementMatchesRecipient(item, { phcId: 'one', role: 'oic' })).toBe(true);
		expect(announcementMatchesRecipient(item, { phcId: 'one', role: 'doctor' })).toBe(false);
	});

	it('does not expose scheduled announcements before their publication time', () => {
		const item = announcement({
			status: 'scheduled',
			publishedAt: null,
			scheduledFor: now + 60_000
		});

		expect(announcementIsActive(item, now)).toBe(false);
		expect(announcementIsActive(item, now + 60_000)).toBe(true);
	});

	it('hides expired and archived announcements', () => {
		expect(announcementIsActive(announcement({ expiresAt: now }), now)).toBe(false);
		expect(announcementIsActive(announcement({ status: 'archived' }), now)).toBe(false);
	});

	it('requires both active status and matching audience', () => {
		const item = announcement({ audience: 'phc', targetPhcId: 'phc-one' });

		expect(announcementIsVisibleToRecipient(item, { phcId: 'phc-one', role: 'nurse' }, now)).toBe(
			true
		);
		expect(announcementIsVisibleToRecipient(item, { phcId: 'phc-two', role: 'nurse' }, now)).toBe(
			false
		);
	});
});

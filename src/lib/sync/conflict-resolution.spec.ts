import { describe, expect, it } from 'vite-plus/test';
import { shouldApplyRemoteChange } from './conflict-resolution.ts';

describe('sync conflict resolution', () => {
	it('accepts a remote change when no local row exists', () => {
		expect(shouldApplyRemoteChange(undefined, 1, new Date('2026-11-17T18:00:00Z'))).toBe(true);
	});

	it('protects an optimistic local mutation until it is pushed or reconciled', () => {
		expect(
			shouldApplyRemoteChange(
				{ updatedAt: Date.parse('2026-11-17T18:57:39Z'), serverVersion: 4, syncStatus: 'pending' },
				5,
				new Date('2026-11-17T09:29:29Z')
			)
		).toBe(false);
	});

	it('uses authoritative server versions instead of client clock order', () => {
		const local = {
			updatedAt: Date.parse('2026-11-17T18:57:39Z'),
			serverVersion: 4,
			syncStatus: 'synced'
		};

		expect(shouldApplyRemoteChange(local, 3, '2026-11-17T20:00:00Z')).toBe(false);
		expect(shouldApplyRemoteChange(local, 4, '2026-11-17T09:00:00Z')).toBe(true);
		expect(shouldApplyRemoteChange(local, 5, '2026-11-17T09:00:00Z')).toBe(true);
	});

	it('falls back to timestamps for legacy unversioned changes', () => {
		expect(shouldApplyRemoteChange({ updatedAt: 100 }, 0, 99)).toBe(false);
		expect(shouldApplyRemoteChange({ updatedAt: 100 }, 0, 100)).toBe(true);
	});
});

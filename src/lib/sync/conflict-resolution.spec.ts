import { describe, expect, it } from 'vite-plus/test';
import { shouldApplyRemoteChange } from './conflict-resolution.ts';

describe('sync conflict resolution', () => {
	it('accepts a remote change when no local row exists', () => {
		expect(shouldApplyRemoteChange(undefined, new Date('2026-11-17T18:00:00Z'))).toBe(true);
	});

	it('rejects a delayed remote snapshot older than an optimistic local mutation', () => {
		expect(
			shouldApplyRemoteChange(
				{ updatedAt: Date.parse('2026-11-17T18:57:39Z') },
				new Date('2026-11-17T09:29:29Z')
			)
		).toBe(false);
	});

	it('accepts an equally recent or newer remote change', () => {
		const local = { updatedAt: Date.parse('2026-11-17T18:57:39Z') };

		expect(shouldApplyRemoteChange(local, '2026-11-17T18:57:39Z')).toBe(true);
		expect(shouldApplyRemoteChange(local, '2026-11-17T18:57:40Z')).toBe(true);
	});

	it('does not overwrite a versioned local row with an unversioned remote change', () => {
		expect(shouldApplyRemoteChange({ updatedAt: 100 }, undefined)).toBe(false);
	});
});

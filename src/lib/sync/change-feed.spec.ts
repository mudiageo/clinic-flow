import { describe, expect, it, vi } from 'vite-plus/test';
import {
	drainChangeFeed,
	finalizeChangeBatch,
	readFreshQuery,
	type ChangeBatch,
	type RefreshableQuery
} from './change-feed.ts';

function refreshable<T>(read: () => T): RefreshableQuery<T> {
	let value = read();
	return {
		refresh: vi.fn(async () => {
			value = read();
		}),
		then: (resolve, reject) => Promise.resolve(value).then(resolve, reject)
	};
}

describe('change feed', () => {
	it('forces a fresh ordinary query before reading an unchanged cursor', async () => {
		let serverValue = 0;
		const query = refreshable(() => serverValue);
		serverValue = 1;

		await expect(readFreshQuery(query)).resolves.toBe(1);
		expect(query.refresh).toHaveBeenCalledOnce();
	});

	it('drains more than 500 ordered changes without gaps', async () => {
		const changes = Array.from({ length: 1_205 }, (_, index) => ({ version: index + 1 }));
		const applied: number[] = [];
		const persisted: number[] = [];

		const cursor = await drainChangeFeed({
			initialCursor: 0,
			pull: async (since): Promise<ChangeBatch<{ version: number }>> => {
				const page = changes.filter((change) => change.version > since).slice(0, 500);
				return {
					changes: page,
					newCursor: page.at(-1)?.version ?? changes.length,
					hasMore: page.length === 500
				};
			},
			applyBatch: async (batch) => {
				applied.push(...batch.changes.map((change) => change.version));
				persisted.push(batch.newCursor);
			}
		});

		expect(cursor).toBe(1_205);
		expect(applied).toEqual(changes.map((change) => change.version));
		expect(persisted).toEqual([500, 1_000, 1_205]);
	});

	it('advances to the high watermark after filtering the requesting device changes', () => {
		expect(finalizeChangeBatch([], { since: 12, highWatermark: 18 })).toEqual({
			changes: [],
			newCursor: 18,
			hasMore: false
		});
	});

	it('does not persist a cursor when applying its batch fails', async () => {
		const persisted: number[] = [];
		await expect(
			drainChangeFeed({
				initialCursor: 4,
				pull: async () => ({ changes: [{ version: 5 }], newCursor: 5, hasMore: false }),
				applyBatch: async (batch) => {
					persisted.push(batch.newCursor);
					throw new Error('IndexedDB transaction failed');
				}
			})
		).rejects.toThrow('IndexedDB transaction failed');
		expect(persisted).toEqual([5]);
	});

	it('rejects a regressing or non-advancing paginated cursor', async () => {
		await expect(
			drainChangeFeed({
				initialCursor: 10,
				pull: async () => ({ changes: [], newCursor: 10, hasMore: true }),
				applyBatch: async () => undefined
			})
		).rejects.toThrow('non-advancing');
	});
});

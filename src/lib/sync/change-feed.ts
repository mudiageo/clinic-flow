export interface RefreshableQuery<T> extends PromiseLike<T> {
	refresh(): Promise<void>;
}

/** Ordinary remote queries are cached by argument; refresh before every cursor read. */
export async function readFreshQuery<T>(query: RefreshableQuery<T>): Promise<T> {
	await query.refresh();
	return await query;
}

export interface VersionedChange {
	version: number;
}

export interface ChangeBatch<TChange extends VersionedChange> {
	changes: TChange[];
	newCursor: number;
	hasMore: boolean;
}

/** Finalizes a server page against the stable high-watermark read for that request. */
export function finalizeChangeBatch<TChange extends VersionedChange>(
	changes: TChange[],
	input: { since: number; highWatermark: number; limit?: number }
): ChangeBatch<TChange> {
	const limit = input.limit ?? 500;
	const hasMore = changes.length === limit;
	const newCursor = hasMore ? (changes.at(-1)?.version ?? input.since) : input.highWatermark;
	return { changes, newCursor, hasMore };
}

/**
 * Drains a stable, version-ordered server feed. Cursor persistence belongs in
 * `applyBatch` so records and the cursor can commit atomically.
 */
export async function drainChangeFeed<TChange extends VersionedChange>(options: {
	initialCursor: number;
	pull: (cursor: number) => Promise<ChangeBatch<TChange>>;
	applyBatch: (batch: ChangeBatch<TChange>) => Promise<void>;
}): Promise<number> {
	let cursor = options.initialCursor;

	while (true) {
		const batch = await options.pull(cursor);
		if (!Number.isSafeInteger(batch.newCursor) || batch.newCursor < cursor) {
			throw new Error('Server returned a regressing sync cursor');
		}
		for (const change of batch.changes) {
			if (!Number.isSafeInteger(change.version) || change.version <= cursor) {
				throw new Error('Server returned an out-of-order sync change');
			}
		}

		if (batch.hasMore && batch.newCursor === cursor) {
			throw new Error('Server returned a non-advancing sync batch');
		}
		await options.applyBatch(batch);
		cursor = batch.newCursor;
		if (!batch.hasMore) return cursor;
	}
}

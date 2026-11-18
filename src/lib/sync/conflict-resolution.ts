type LocalSyncVersion = {
	updatedAt?: unknown;
	serverVersion?: unknown;
	syncStatus?: unknown;
};

function toEpochMilliseconds(value: unknown): number | null {
	if (value instanceof Date) return value.getTime();
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const parsed = Date.parse(value);
		if (!Number.isNaN(parsed)) return parsed;
	}
	return null;
}

/**
 * Last-write-wins guard for remote sync changes.
 *
 * A delayed server change must never replace a newer optimistic local mutation.
 */
export function shouldApplyRemoteChange(
	local: LocalSyncVersion | undefined,
	remoteVersion: unknown,
	remoteUpdatedAt?: unknown
): boolean {
	if (!local) return true;
	if (local.syncStatus === 'pending') return false;

	const localVersion = Number(local.serverVersion ?? 0);
	const incomingVersion = Number(remoteVersion);
	if (Number.isSafeInteger(incomingVersion) && incomingVersion > 0) {
		return !Number.isSafeInteger(localVersion) || incomingVersion >= localVersion;
	}

	const localTimestamp = toEpochMilliseconds(local.updatedAt);
	const remoteTimestamp = toEpochMilliseconds(remoteUpdatedAt);
	if (localTimestamp === null) return true;
	if (remoteTimestamp === null) return false;

	return remoteTimestamp >= localTimestamp;
}

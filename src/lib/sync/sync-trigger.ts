let trigger: (() => void) | null = null;

/** Registers the application sync scheduler without coupling domain stores to SyncStore. */
export function registerSyncTrigger(next: (() => void) | null): void {
	trigger = next;
}

/** Requests an immediate debounced push/pull after a durable local mutation. */
export function requestImmediateSync(): void {
	trigger?.();
}

export type WakeupDecision = 'scheduled' | 'sync-again';

/** Coalesces realtime invalidations while preserving signals received mid-sync. */
export class WakeupScheduler {
	#timer: ReturnType<typeof setTimeout> | null = null;

	constructor(
		readonly run: () => void,
		readonly delayMs = 250
	) {}

	notify(syncing: boolean): WakeupDecision {
		if (syncing) return 'sync-again';
		if (this.#timer) clearTimeout(this.#timer);
		this.#timer = setTimeout(() => {
			this.#timer = null;
			this.run();
		}, this.delayMs);
		return 'scheduled';
	}

	cancel(): void {
		if (this.#timer) clearTimeout(this.#timer);
		this.#timer = null;
	}
}

export type RealtimeOperation = 'create' | 'update' | 'delete' | 'reconcile';

export interface RealtimeSignal {
	topic: string;
	entityType: string;
	entityId: string | null;
	operation: RealtimeOperation;
	version: number;
	occurredAt: number;
}

export interface RealtimePublishInput {
	entityType: string;
	entityId?: string | null;
	operation: Exclude<RealtimeOperation, 'reconcile'>;
}

interface SubscribeOptions {
	signal?: AbortSignal;
	heartbeatMs?: number;
}

type Listener = (signal: RealtimeSignal) => void;

const DEFAULT_HEARTBEAT_MS = 30_000;

/**
 * Provider-neutral realtime hub used by live remote functions.
 *
 * This in-process provider covers the single ClinicFlow server process. Cloud
 * deployments can replace it with a distributed adapter without changing
 * feature code. Durable database queries remain the source of truth.
 */
export class RealtimeHub {
	readonly #listeners = new Map<string, Set<Listener>>();
	#version = 0;

	publish(topic: string, input: RealtimePublishInput): RealtimeSignal {
		const signal: RealtimeSignal = {
			topic,
			entityType: input.entityType,
			entityId: input.entityId ?? null,
			operation: input.operation,
			version: ++this.#version,
			occurredAt: Date.now()
		};

		for (const listener of this.#listeners.get(topic) ?? []) {
			listener(signal);
		}

		return signal;
	}

	async *subscribe(
		topics: readonly string[],
		options: SubscribeOptions = {}
	): AsyncGenerator<RealtimeSignal> {
		const heartbeatMs = Math.max(5_000, options.heartbeatMs ?? DEFAULT_HEARTBEAT_MS);

		while (!options.signal?.aborted) {
			const next = await this.#waitForSignal(topics, heartbeatMs, options.signal);
			if (options.signal?.aborted) return;

			yield (
				next ?? {
					topic: 'reconcile',
					entityType: 'reconcile',
					entityId: null,
					operation: 'reconcile',
					version: this.#version,
					occurredAt: Date.now()
				}
			);
		}
	}

	#waitForSignal(
		topics: readonly string[],
		timeoutMs: number,
		abortSignal?: AbortSignal
	): Promise<RealtimeSignal | null> {
		return new Promise((resolve) => {
			let settled = false;

			const cleanup = () => {
				clearTimeout(timeout);
				abortSignal?.removeEventListener('abort', handleAbort);
				for (const topic of topics) {
					const listeners = this.#listeners.get(topic);
					listeners?.delete(handleSignal);
					if (listeners?.size === 0) this.#listeners.delete(topic);
				}
			};

			const finish = (value: RealtimeSignal | null) => {
				if (settled) return;
				settled = true;
				cleanup();
				resolve(value);
			};

			const handleSignal = (signal: RealtimeSignal) => finish(signal);
			const handleAbort = () => finish(null);
			const timeout = setTimeout(() => finish(null), timeoutMs);

			for (const topic of new Set(topics)) {
				const listeners = this.#listeners.get(topic) ?? new Set<Listener>();
				listeners.add(handleSignal);
				this.#listeners.set(topic, listeners);
			}

			if (abortSignal?.aborted) finish(null);
			else abortSignal?.addEventListener('abort', handleAbort, { once: true });
		});
	}
}

const globalRealtime = globalThis as typeof globalThis & {
	__clinicFlowRealtimeHub?: RealtimeHub;
};

export const realtimeHub = (globalRealtime.__clinicFlowRealtimeHub ??= new RealtimeHub());

export const announcementTopics = {
	all: 'platform:announcements',
	admins: 'platform:announcements:admins',
	management: 'platform:announcements:management',
	phc: (phcId: string) => `phc:${phcId}:announcements`
} as const;

export const syncTopics = {
	phc: (phcId: string) => `phc:${phcId}:sync`
} as const;

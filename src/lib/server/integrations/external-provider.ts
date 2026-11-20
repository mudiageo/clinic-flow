/**
 * Shared contract for outbound provider adapters.
 *
 * Every adapter is live only when all of its required environment variables are
 * configured. Otherwise it logs the outbound payload and returns an explicitly
 * labelled console-mode result. Console-mode results MUST NOT look like real
 * provider receipts, and no patient-identifiable payloads are sent to the console.
 */

export type ProviderMode = 'live' | 'console';

export type ProviderResult<T> =
	| { ok: true; mode: 'live'; data: T }
	| { ok: true; mode: 'console'; data: T; reason: string }
	| { ok: false; mode: ProviderMode; error: string };

export type ProviderEnv = Record<string, string | undefined>;

export interface ProviderModeConfig {
	name: string;
	env: ProviderEnv;
	requiredKeys: readonly string[];
}

/** Returns 'live' only when every required key has a non-empty value. */
export function getProviderMode({ env, requiredKeys }: ProviderModeConfig): ProviderMode {
	if (requiredKeys.length === 0) return 'live';
	const missing = requiredKeys.some((key) => !env[key]?.trim());
	return missing ? 'console' : 'live';
}

/** Returns the names of the required keys that are not configured. */
export function getMissingProviderKeys({ env, requiredKeys }: ProviderModeConfig): string[] {
	return requiredKeys.filter((key) => !env[key]?.trim());
}

/**
 * A reference that can never be mistaken for a provider-issued delivery ID.
 * Never use provider-shaped prefixes such as `termii_sandbox_` in console mode.
 */
export function consoleReference(kind: string): string {
	return `console:${kind}:${crypto.randomUUID()}`;
}

/** Logs only non-clinical, operational metadata in console mode. */
export function logConsolePayload(provider: string, operation: string, payload: unknown): void {
	console.info(`[console-mode] ${provider}.${operation}`, payload);
}

/**
 * Shared mDNS broadcast state.
 *
 * `hooks.server.ts` publishes the service on local master servers and records
 * the result here. The server-status remote reads it so the admin UI reflects
 * the real broadcast state instead of showing a hardcoded "Active" badge.
 */

export interface MdnsBroadcastState {
	active: boolean;
	hostname: string | null;
	port: number | null;
}

const state: MdnsBroadcastState = {
	active: false,
	hostname: null,
	port: null
};

export function setMdnsBroadcast(next: MdnsBroadcastState): void {
	state.active = next.active;
	state.hostname = next.hostname;
	state.port = next.port;
}

export function getMdnsBroadcast(): MdnsBroadcastState {
	return { ...state };
}

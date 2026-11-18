import { getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { getActiveRecipientContext } from '#lib/server/db/queries/announcements.ts';
import { realtimeHub, syncTopics, type RealtimeSignal } from '#lib/server/realtime/hub.ts';

async function requireActiveSyncContext() {
	const { locals } = getRequestEvent();
	if (!locals.user || !locals.staffId || !locals.phcId) error(401, 'Unauthorized');

	const context = await getActiveRecipientContext(locals.staffId);
	if (!context) error(403, 'Staff account is inactive or unavailable');
	if (context.phcId !== locals.phcId) error(403, 'PHC membership changed; reconnect your session');
	return context;
}

function reconciliationSignal(phcId: string): RealtimeSignal {
	return {
		topic: syncTopics.phc(phcId),
		entityType: 'reconcile',
		entityId: null,
		operation: 'reconcile',
		version: 0,
		occurredAt: Date.now()
	};
}

/**
 * One lightweight wake-up stream per authenticated client.
 * Record payloads continue to travel through the durable cursor sync API.
 */
export const watchRealtimeSignals = query.live(async function* () {
	const request = getRequestEvent().request;
	const context = await requireActiveSyncContext();
	yield reconciliationSignal(context.phcId);

	for await (const signal of realtimeHub.subscribe([syncTopics.phc(context.phcId)], {
		signal: request.signal,
		heartbeatMs: 30_000
	})) {
		const refreshed = await getActiveRecipientContext(context.staffId);
		if (!refreshed) error(403, 'Staff account is inactive or unavailable');
		if (refreshed.phcId !== context.phcId) {
			error(403, 'PHC membership changed; reconnect your session');
		}
		yield signal;
	}
});

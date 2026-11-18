import { describe, expect, it } from 'vite-plus/test';
import { RealtimeHub, syncTopics } from './hub.ts';

describe('RealtimeHub', () => {
	it('delivers a signal to a matching topic subscriber', async () => {
		const hub = new RealtimeHub();
		const controller = new AbortController();
		const stream = hub.subscribe(['phc:one:announcements'], {
			signal: controller.signal,
			heartbeatMs: 5_000
		});
		const iterator = stream[Symbol.asyncIterator]();
		const next = iterator.next();

		hub.publish('phc:one:announcements', {
			entityType: 'announcement',
			entityId: 'announcement-1',
			operation: 'create'
		});

		await expect(next).resolves.toMatchObject({
			done: false,
			value: {
				topic: 'phc:one:announcements',
				entityType: 'announcement',
				entityId: 'announcement-1',
				operation: 'create'
			}
		});

		controller.abort();
		await iterator.return?.(undefined);
	});

	it('does not deliver another tenant topic', async () => {
		const hub = new RealtimeHub();
		const controller = new AbortController();
		const stream = hub.subscribe(['phc:one:announcements'], {
			signal: controller.signal,
			heartbeatMs: 5_000
		});
		const iterator = stream[Symbol.asyncIterator]();
		const next = iterator.next();

		hub.publish('phc:two:announcements', {
			entityType: 'announcement',
			entityId: 'wrong-tenant',
			operation: 'create'
		});
		hub.publish('phc:one:announcements', {
			entityType: 'announcement',
			entityId: 'correct-tenant',
			operation: 'create'
		});

		const result = await next;
		expect(result.value?.entityId).toBe('correct-tenant');

		controller.abort();
		await iterator.return?.(undefined);
	});

	it('cleans up an aborted subscription without waiting for the heartbeat', async () => {
		const hub = new RealtimeHub();
		const controller = new AbortController();
		const stream = hub.subscribe(['platform:announcements'], {
			signal: controller.signal,
			heartbeatMs: 30_000
		});
		const iterator = stream[Symbol.asyncIterator]();
		const next = iterator.next();

		controller.abort();

		await expect(next).resolves.toEqual({ value: undefined, done: true });
	});

	it('isolates shared sync wake-ups by PHC', async () => {
		const hub = new RealtimeHub();
		const controller = new AbortController();
		const stream = hub.subscribe([syncTopics.phc('phc-one')], {
			signal: controller.signal,
			heartbeatMs: 5_000
		});
		const iterator = stream[Symbol.asyncIterator]();
		const next = iterator.next();

		hub.publish(syncTopics.phc('phc-two'), {
			entityType: 'queueTickets',
			entityId: 'wrong-phc-ticket',
			operation: 'update'
		});
		hub.publish(syncTopics.phc('phc-one'), {
			entityType: 'queueTickets',
			entityId: 'correct-phc-ticket',
			operation: 'update'
		});

		await expect(next).resolves.toMatchObject({
			value: {
				topic: syncTopics.phc('phc-one'),
				entityId: 'correct-phc-ticket'
			}
		});

		controller.abort();
		await iterator.return?.(undefined);
	});
});

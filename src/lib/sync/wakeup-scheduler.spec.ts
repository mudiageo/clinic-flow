import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { WakeupScheduler } from './wakeup-scheduler.ts';

afterEach(() => vi.useRealTimers());

describe('WakeupScheduler', () => {
	it('coalesces a burst of invalidations into one sync request', () => {
		vi.useFakeTimers();
		const run = vi.fn();
		const scheduler = new WakeupScheduler(run, 250);

		scheduler.notify(false);
		scheduler.notify(false);
		scheduler.notify(false);
		vi.advanceTimersByTime(249);
		expect(run).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(run).toHaveBeenCalledOnce();
	});

	it('requests a follow-up pass when a signal arrives during sync', () => {
		vi.useFakeTimers();
		const run = vi.fn();
		const scheduler = new WakeupScheduler(run);

		expect(scheduler.notify(true)).toBe('sync-again');
		vi.runAllTimers();
		expect(run).not.toHaveBeenCalled();
	});

	it('cancels a pending wake-up on disconnect', () => {
		vi.useFakeTimers();
		const run = vi.fn();
		const scheduler = new WakeupScheduler(run);

		scheduler.notify(false);
		scheduler.cancel();
		vi.runAllTimers();
		expect(run).not.toHaveBeenCalled();
	});
});

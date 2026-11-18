import { describe, expect, it } from 'vite-plus/test';
import {
	calculateCapacityUsed,
	calculateSyncHealth,
	isCompletedToday,
	queueVolumeToday,
	startOfLocalDay
} from './metrics.ts';

describe('dashboard metrics', () => {
	it('counts only completed tickets from the current local day', () => {
		const now = new Date(2026, 10, 18, 14).getTime();
		expect(
			isCompletedToday({ status: 'done', createdAt: now, completedAt: now - 60_000 }, now)
		).toBe(true);
		expect(
			isCompletedToday(
				{ status: 'done', createdAt: now, completedAt: startOfLocalDay(now) - 1 },
				now
			)
		).toBe(false);
	});

	it('counts active arrivals and completed work once', () => {
		const now = new Date(2026, 10, 18, 14).getTime();
		expect(
			queueVolumeToday(
				[
					{ status: 'waiting', createdAt: now },
					{ status: 'done', createdAt: now - 3_600_000, completedAt: now },
					{ status: 'no_show', createdAt: now, completedAt: now },
					{ status: 'called', createdAt: startOfLocalDay(now) - 1 }
				],
				now
			)
		).toBe(2);
	});

	it('bounds configured capacity usage', () => {
		expect(calculateCapacityUsed(45, 100)).toBe(45);
		expect(calculateCapacityUsed(120, 100)).toBe(100);
		expect(calculateCapacityUsed(10, 0)).toBe(0);
	});

	it('scores sync health from explicit connectivity and backlog inputs', () => {
		expect(
			calculateSyncHealth({
				online: true,
				realtimeState: 'live',
				pendingCount: 0,
				conflictCount: 0,
				hasSynced: true
			})
		).toBe(100);
		expect(
			calculateSyncHealth({
				online: true,
				realtimeState: 'stale',
				pendingCount: 5,
				conflictCount: 1,
				hasSynced: true
			})
		).toBe(50);
		expect(
			calculateSyncHealth({
				online: false,
				realtimeState: 'offline',
				pendingCount: 0,
				conflictCount: 0,
				hasSynced: true
			})
		).toBe(0);
	});
});

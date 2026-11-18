export type RealtimeFreshnessState = 'idle' | 'connecting' | 'live' | 'stale' | 'offline' | 'error';

export interface QueueMetricRecord {
	status: 'waiting' | 'called' | 'in_progress' | 'done' | 'no_show';
	createdAt: number;
	completedAt?: number | null;
}

export const ACTIVE_QUEUE_STATUSES: QueueMetricRecord['status'][] = [
	'waiting',
	'called',
	'in_progress'
];

export function startOfLocalDay(timestamp = Date.now()): number {
	const date = new Date(timestamp);
	return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function isCompletedToday(ticket: QueueMetricRecord, timestamp = Date.now()): boolean {
	return (
		ticket.status === 'done' &&
		typeof ticket.completedAt === 'number' &&
		ticket.completedAt >= startOfLocalDay(timestamp)
	);
}

export function queueVolumeToday(tickets: QueueMetricRecord[], timestamp = Date.now()): number {
	const dayStart = startOfLocalDay(timestamp);
	return tickets.filter(
		(ticket) =>
			isCompletedToday(ticket, timestamp) ||
			(ACTIVE_QUEUE_STATUSES.includes(ticket.status) && ticket.createdAt >= dayStart)
	).length;
}

export function calculateCapacityUsed(todayVolume: number, dailyCapacity: number): number {
	if (!Number.isFinite(todayVolume) || !Number.isFinite(dailyCapacity) || dailyCapacity <= 0)
		return 0;
	return Math.min(100, Math.max(0, Math.round((todayVolume / dailyCapacity) * 100)));
}

export function calculateSyncHealth(input: {
	online: boolean;
	realtimeState: RealtimeFreshnessState;
	pendingCount: number;
	conflictCount: number;
	hasSynced: boolean;
}): number {
	if (!input.online || input.realtimeState === 'offline') return 0;

	let score =
		input.realtimeState === 'error'
			? 50
			: input.realtimeState === 'stale'
				? 70
				: input.realtimeState === 'connecting'
					? 85
					: 100;
	if (!input.hasSynced) score -= 15;
	score -= Math.min(40, Math.max(0, input.pendingCount) * 2);
	score -= Math.min(40, Math.max(0, input.conflictCount) * 10);
	return Math.max(0, Math.min(100, score));
}

export function formatDistanceToNow(timestamp: number): string {
	const now = Date.now();
	const diffInMs = timestamp - now;

	const seconds = Math.round(diffInMs / 1000);
	const minutes = Math.round(seconds / 60);
	const hours = Math.round(minutes / 60);
	const days = Math.round(hours / 24);

	const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' });

	if (Math.abs(days) > 0) return rtf.format(days, 'day');
	if (Math.abs(hours) > 0) return rtf.format(hours, 'hour');
	if (Math.abs(minutes) > 0) return rtf.format(minutes, 'minute');

	return rtf.format(seconds, 'second');
}

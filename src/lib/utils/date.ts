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

export function formatDate(
	timestamp: number | string | Date,
	options?: Intl.DateTimeFormatOptions
): string {
	const date = new Date(timestamp);
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		...options
	}).format(date);
}

export function formatDateTime(timestamp: number | string | Date): string {
	return formatDate(timestamp, {
		hour: 'numeric',
		minute: 'numeric',
		hour12: true
	});
}

/**
 * Deterministic local ID/sequence allocation for offline-first records.
 *
 * The server remains authoritative and reassigns ticket numbers on sync, but
 * locally-created records still need a stable, unique, human-readable value so
 * offline queues and QR cards do not show a stub (`0` or a random suffix).
 */

import { startOfLocalDay } from '#lib/dashboard/metrics.ts';

/** Allocate the next `OR-<prefix>-##` clinic ID without colliding with existing IDs. */
export function nextClinicId(prefix: string, existingClinicIds: string[]): string {
	const safePrefix = (prefix.trim() || 'PT').slice(0, 4).toUpperCase();
	const existing = new Set(existingClinicIds.map((id) => id.toLowerCase()));
	const pattern = new RegExp(`^OR-${escapeRegExp(safePrefix)}-(\\d+)$`, 'i');

	let max = 0;
	for (const id of existingClinicIds) {
		const match = pattern.exec(id);
		if (match) max = Math.max(max, Number(match[1]));
	}

	let sequence = max + 1;
	let candidate = formatClinicId(safePrefix, sequence);
	while (existing.has(candidate.toLowerCase())) {
		sequence += 1;
		candidate = formatClinicId(safePrefix, sequence);
	}
	return candidate;
}

function formatClinicId(prefix: string, sequence: number): string {
	return `OR-${prefix}-${String(sequence).padStart(2, '0')}`;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Allocate the next ticket number for a PHC on the local day, mirroring the server. */
export function nextTicketNumber(
	phcId: string,
	tickets: ReadonlyArray<{ phcId: string; ticketNumber: number; createdAt: number }>,
	dayStart: number = startOfLocalDay()
): number {
	const highest = tickets
		.filter((ticket) => ticket.phcId === phcId && ticket.createdAt >= dayStart)
		.reduce((max, ticket) => Math.max(max, Number(ticket.ticketNumber) || 0), 0);
	return highest + 1;
}

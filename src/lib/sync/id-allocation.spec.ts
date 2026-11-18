import { describe, expect, it } from 'vite-plus/test';
import { nextClinicId, nextTicketNumber } from './id-allocation.ts';

describe('nextClinicId', () => {
	it('starts at 01 for a new prefix', () => {
		expect(nextClinicId('JD', [])).toBe('OR-JD-01');
	});

	it('increments from the highest existing sequence for the prefix', () => {
		expect(nextClinicId('JD', ['OR-JD-01', 'OR-JD-07', 'OR-AB-99'])).toBe('OR-JD-08');
	});

	it('skips an ID that already exists even when the sequence suggests it', () => {
		expect(nextClinicId('JD', ['OR-JD-01', 'OR-JD-02', 'OR-JD-03'])).toBe('OR-JD-04');
	});

	it('normalizes prefix and handles collisions case-insensitively', () => {
		expect(nextClinicId('jd', ['OR-JD-01', 'or-jd-02'])).toBe('OR-JD-03');
	});

	it('uses a safe default prefix when none is provided', () => {
		expect(nextClinicId('', [])).toBe('OR-PT-01');
	});
});

describe('nextTicketNumber', () => {
	const dayStart = 1_000_000;

	it('starts at 1 when there are no tickets today', () => {
		expect(nextTicketNumber('phc-a', [], dayStart)).toBe(1);
	});

	it('uses the highest existing ticket number for the same PHC and day', () => {
		const tickets = [
			{ phcId: 'phc-a', ticketNumber: 3, createdAt: dayStart + 1 },
			{ phcId: 'phc-a', ticketNumber: 7, createdAt: dayStart + 2 },
			{ phcId: 'phc-b', ticketNumber: 99, createdAt: dayStart + 3 }
		];
		expect(nextTicketNumber('phc-a', tickets, dayStart)).toBe(8);
	});

	it('ignores tickets from a previous day', () => {
		const tickets = [
			{ phcId: 'phc-a', ticketNumber: 12, createdAt: dayStart - 1 },
			{ phcId: 'phc-a', ticketNumber: 2, createdAt: dayStart + 1 }
		];
		expect(nextTicketNumber('phc-a', tickets, dayStart)).toBe(3);
	});
});

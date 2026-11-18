import { describe, expect, it } from 'vite-plus/test';
import { canWriteOutreach, normalizeOutreachPayload } from './policy.ts';
import { isOutreachActivityType, OUTREACH_ACTIVITY_TYPES } from './types.ts';

describe('outreach policy', () => {
	it('allows explicitly permitted PHC staff', () => {
		expect(canWriteOutreach('chew', ['manage:outreach'])).toBe(true);
	});

	it('denies staff without outreach permission', () => {
		expect(canWriteOutreach('nurse', ['view:patients'])).toBe(false);
		expect(canWriteOutreach(null, undefined)).toBe(false);
	});

	it('leaves global policy authority with superadmins', () => {
		expect(canWriteOutreach('superadmin', [])).toBe(true);
	});

	it('accepts only the bounded activity types', () => {
		for (const activityType of OUTREACH_ACTIVITY_TYPES) {
			expect(isOutreachActivityType(activityType)).toBe(true);
		}
		expect(isOutreachActivityType('patient_name')).toBe(false);
	});

	it('normalizes a bounded aggregate payload', () => {
		const timestamp = Date.now();
		expect(
			normalizeOutreachPayload({
				activityType: 'health_talk',
				community: '  Uselu  ',
				occurredAt: timestamp,
				householdsVisited: 4,
				peopleReached: 25,
				immunizationsGiven: 0,
				bednetsDistributed: 0,
				notes: '  Community hall  ',
				createdAt: timestamp,
				updatedAt: timestamp,
				extraField: 'discarded'
			})
		).toEqual({
			activityType: 'health_talk',
			community: 'Uselu',
			occurredAt: timestamp,
			householdsVisited: 4,
			peopleReached: 25,
			immunizationsGiven: 0,
			bednetsDistributed: 0,
			notes: 'Community hall',
			createdAt: timestamp,
			updatedAt: timestamp
		});
	});

	it('rejects invalid counts and unbounded notes', () => {
		const timestamp = Date.now();
		const base = {
			activityType: 'screening',
			community: 'Ugbowo',
			occurredAt: timestamp,
			householdsVisited: 1,
			peopleReached: 10,
			immunizationsGiven: 0,
			bednetsDistributed: 0,
			notes: null,
			createdAt: timestamp,
			updatedAt: timestamp
		};
		expect(normalizeOutreachPayload({ ...base, peopleReached: -1 })).toBeNull();
		expect(normalizeOutreachPayload({ ...base, notes: 'x'.repeat(501) })).toBeNull();
	});
});

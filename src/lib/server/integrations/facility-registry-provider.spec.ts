import { describe, expect, it } from 'vite-plus/test';
import { parseRegistryFacilities } from './facility-registry-provider';

describe('facility registry response parsing', () => {
	it('accepts a v1-style envelope and normalises common field names', () => {
		const parsed = parseRegistryFacilities({
			data: {
				facilities: [
					{
						facilityId: 'HFR-1',
						facilityName: 'Central Clinic',
						state: 'Lagos',
						districtName: 'Ikeja',
						facilityLevel: 'Primary',
						ownership: 'Public'
					}
				]
			}
		});

		expect(parsed).toEqual([
			{
				registryId: 'HFR-1',
				name: 'Central Clinic',
				state: 'Lagos',
				lga: 'Ikeja',
				level: 'Primary',
				ownership: 'Public'
			}
		]);
	});

	it('returns no facilities when the payload is empty or malformed', () => {
		expect(parseRegistryFacilities({ data: [] })).toEqual([]);
		expect(parseRegistryFacilities({ data: [{ unrelated: true }] })).toEqual([]);
		expect(parseRegistryFacilities(null)).toEqual([]);
	});
});

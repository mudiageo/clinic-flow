import { describe, expect, it } from 'vitest';
import { consoleReference, getMissingProviderKeys, getProviderMode } from './external-provider';

describe('provider mode selection', () => {
	const requiredKeys = ['GITHUB_TOKEN'] as const;

	it('reports live mode when every required key is configured', () => {
		const config = { name: 'github', env: { GITHUB_TOKEN: 'secret-token' }, requiredKeys };
		expect(getProviderMode(config)).toBe('live');
		expect(getMissingProviderKeys(config)).toEqual([]);
	});

	it('reports console mode when a required key is missing or blank', () => {
		const missing = { name: 'github', env: {}, requiredKeys };
		const blank = { name: 'github', env: { GITHUB_TOKEN: '   ' }, requiredKeys };

		expect(getProviderMode(missing)).toBe('console');
		expect(getMissingProviderKeys(missing)).toEqual(['GITHUB_TOKEN']);
		expect(getProviderMode(blank)).toBe('console');
	});

	it('generates console references that cannot be mistaken for provider IDs', () => {
		const reference = consoleReference('github-release');
		expect(reference.startsWith('console:github-release:')).toBe(true);
		expect(reference).not.toMatch(/termii_sandbox|nhis_/);
	});
});

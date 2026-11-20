import { GITHUB_TOKEN } from '$app/env/private';
import {
	consoleReference,
	getMissingProviderKeys,
	getProviderMode,
	logConsolePayload,
	type ProviderResult
} from './external-provider';

const GITHUB_REPO = 'mudiageo/clinic-flow';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases`;
const REQUIRED_KEYS = ['GITHUB_TOKEN'] as const;

export interface ReleasePublishInput {
	tag: string;
	name: string;
	body: string;
	prerelease: boolean;
	draft: boolean;
}

export interface ReleasePublishData {
	tag: string;
	reference: string;
	url: string | null;
}

/**
 * Publishes a GitHub release. Swapping providers only requires editing this module.
 * Without GITHUB_TOKEN the payload is logged and returned as console mode.
 */
export async function publishRelease(
	input: ReleasePublishInput
): Promise<ProviderResult<ReleasePublishData>> {
	const config = {
		name: 'github',
		env: { GITHUB_TOKEN },
		requiredKeys: REQUIRED_KEYS
	};

	if (getProviderMode(config) === 'console') {
		const reason = `GITHUB_TOKEN not configured (missing: ${getMissingProviderKeys(config).join(', ')})`;
		logConsolePayload('github', 'publishRelease', {
			tag: input.tag,
			name: input.name,
			prerelease: input.prerelease,
			draft: input.draft,
			reason
		});
		return {
			ok: true,
			mode: 'console',
			reason,
			data: { tag: input.tag, reference: consoleReference('github-release'), url: null }
		};
	}

	try {
		const response = await fetch(GITHUB_API, {
			method: 'POST',
			headers: {
				Accept: 'application/vnd.github+json',
				Authorization: `Bearer ${GITHUB_TOKEN}`,
				'Content-Type': 'application/json',
				'X-GitHub-Api-Version': '2022-11-28'
			},
			body: JSON.stringify({
				tag_name: input.tag,
				name: input.name,
				body: input.body,
				prerelease: input.prerelease,
				draft: input.draft
			})
		});

		if (!response.ok) {
			return { ok: false, mode: 'live', error: `GitHub API error: ${response.status}` };
		}

		const raw = (await response.json()) as { id?: number; html_url?: string };
		return {
			ok: true,
			mode: 'live',
			data: {
				tag: input.tag,
				reference: String(raw.id ?? ''),
				url: raw.html_url ?? null
			}
		};
	} catch (error) {
		return {
			ok: false,
			mode: 'live',
			error: error instanceof Error ? error.message : 'GitHub publish failed'
		};
	}
}

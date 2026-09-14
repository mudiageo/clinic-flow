import { query } from '$app/server';

const GITHUB_REPO = 'mudiageo/clinic-flow';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

// Simple in-memory cache — 5 minute TTL
let cache: { data: ReleaseInfo[]; ts: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface ReleaseAsset {
	name: string;
	downloadUrl: string;
	size: number;
}

export interface ReleaseInfo {
	id: number;
	tag: string;
	version: string;
	name: string;
	body: string;
	publishedAt: string;
	channel: 'stable' | 'beta' | 'alpha' | 'nightly';
	isDraft: boolean;
	isPrerelease: boolean;
	assets: ReleaseAsset[];
	// Structured asset map for easy UI binding
	downloads: {
		windows?: { x64?: string };
		macos?: { arm64?: string; x64?: string };
		linux?: { amd64?: string; arm64?: string };
		android?: { arm64?: string; arm32?: string; x86_64?: string };
	};
}

function detectChannel(tag: string, isPrerelease: boolean): ReleaseInfo['channel'] {
	if (tag.includes('-nightly.')) return 'nightly';
	if (tag.includes('-alpha.')) return 'alpha';
	if (tag.includes('-beta.')) return 'beta';
	return 'stable';
}

function mapAssets(assets: any[]): ReleaseInfo['downloads'] {
	const downloads: ReleaseInfo['downloads'] = {};

	for (const asset of assets) {
		const name: string = asset.name;
		const url: string = asset.browser_download_url;

		if (name.endsWith('.exe')) {
			downloads.windows = { x64: url };
		} else if (name.endsWith('.dmg')) {
			downloads.macos ??= {};
			if (name.includes('aarch64')) downloads.macos.arm64 = url;
			else downloads.macos.x64 = url;
		} else if (name.endsWith('.deb')) {
			downloads.linux ??= {};
			if (name.includes('arm64') || name.includes('aarch64')) downloads.linux.arm64 = url;
			else downloads.linux.amd64 = url;
		} else if (name.endsWith('.apk')) {
			downloads.android ??= {};
			if (name.includes('arm64') || name.includes('aarch64')) downloads.android.arm64 = url;
			else if (name.includes('armv7') || name.includes('arm32')) downloads.android.arm32 = url;
			else if (name.includes('x86_64')) downloads.android.x86_64 = url;
		}
	}

	return downloads;
}

async function fetchReleases(): Promise<ReleaseInfo[]> {
	// Return cached data if still fresh
	if (cache && Date.now() - cache.ts < CACHE_TTL_MS) return cache.data;

	const res = await fetch(`${GITHUB_API}?per_page=30`, {
		headers: {
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});

	if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

	const raw: any[] = await res.json();

	const releases: ReleaseInfo[] = raw
		.filter((r) => !r.draft) // skip unpublished drafts
		.map((r) => ({
			id: r.id,
			tag: r.tag_name,
			version: r.tag_name.replace(/^v/, '').replace(/^app-v/, ''),
			name: r.name || r.tag_name,
			body: r.body || '',
			publishedAt: r.published_at,
			channel: detectChannel(r.tag_name, r.prerelease),
			isDraft: r.draft,
			isPrerelease: r.prerelease,
			assets: r.assets.map((a: any) => ({
				name: a.name,
				downloadUrl: a.browser_download_url,
				size: a.size
			})),
			downloads: mapAssets(r.assets)
		}));

	cache = { data: releases, ts: Date.now() };
	return releases;
}

/** Returns all releases grouped by channel */
export const getReleases = query(async () => {
	try {
		const all = await fetchReleases();

		return {
			latest: all.find((r) => r.channel === 'stable') ?? null,
			latestBeta: all.find((r) => r.channel === 'beta') ?? null,
			latestAlpha: all.find((r) => r.channel === 'alpha') ?? null,
			latestNightly: all.find((r) => r.channel === 'nightly') ?? null,
			all
		};
	} catch (e: any) {
		// Return null gracefully if GitHub API is unreachable
		return {
			latest: null,
			latestBeta: null,
			latestAlpha: null,
			latestNightly: null,
			all: [],
			error: e.message
		};
	}
});

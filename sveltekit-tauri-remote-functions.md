# Using SvelteKit Remote Functions from a Tauri Static Build

**Goal:** your Tauri app (built with `adapter-static`) calls `query`/`form`/`command` remote functions that actually run on your separately deployed SvelteKit server.

**How it works:** SvelteKit hashes each `.remote.ts` file's **path**, not its contents, to generate its endpoint (`/_app/remote/<hash>/...`). If your Tauri app and your deployed server both have a remote file at the exact same path, they compute the *same hash* — so calls made from the static build "coincidentally" target real endpoints that exist on your server. A service worker intercepts those calls (which 404 locally, since there's no server in the Tauri bundle) and forwards them cross-origin to your real backend, and your server's `hooks.server.ts` adds the CORS headers to allow it.

Only `query`, `form`, and `command` work this way. `prerender` does not — it needs to run at build time in the same project, so keep prerendered data out of this path.

---

## 1. Keep remote file paths identical

Whatever path your `.remote.ts` file lives at in your deployed server repo, mirror it exactly in the Tauri/static repo (or same repo, different build target):

```
src/lib/all.remote.ts
```

If they're two separate SvelteKit projects, both need a file at `src/lib/all.remote.ts` (same relative path) — content can differ, but the exported remote functions the client calls must match what the server actually implements. Simplest approach: one shared `all.remote.ts` that re-exports everything, so there's only one path to keep in sync.

## 2. Add environment variables (Tauri/static app)

```bash
# .env
PUBLIC_BACKEND_HOST="api.yourdomain.com"
PUBLIC_BACKEND_INSECURE="false"
```

## 3. Add the service worker

`src/service-worker.ts` in the Tauri app:

```ts
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />
/// <reference types="../.svelte-kit/ambient.d.ts" />

import { PUBLIC_BACKEND_HOST, PUBLIC_BACKEND_INSECURE } from '$env/static/public';

const self = globalThis.self as unknown as ServiceWorkerGlobalScope;
const dev = self.location.hostname === 'localhost';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

const productionHost = PUBLIC_BACKEND_HOST || 'localhost:5174';
const productionSecure = !PUBLIC_BACKEND_INSECURE || !dev;

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (!url.pathname.startsWith('/_app/remote/')) return; // let everything else pass through

	const newUrl = new URL(event.request.url);
	newUrl.host = dev ? 'localhost:5174' : productionHost;
	newUrl.protocol = productionSecure ? 'https:' : 'http:';

	async function respond() {
		try {
			const req = event.request.clone();
			const headers = new Headers(req.headers);
			headers.set('X-SvelteKit-Remote', 'true'); // flags this as a forwarded remote call

			const init: RequestInit = {
				method: req.method,
				headers,
				credentials: 'include',
				referrer: req.referrer,
				referrerPolicy: req.referrerPolicy,
				redirect: req.redirect,
				cache: req.cache
			};

			if (req.method !== 'GET' && req.method !== 'HEAD') {
				const bodyBuffer = await req.arrayBuffer();
				init.body = bodyBuffer.byteLength > 0 ? bodyBuffer : null;
			}

			const response = await fetch(newUrl.toString(), init);
			if (!response.ok) {
				return new Response(
					JSON.stringify({ type: 'error', status: response.status, error: response.statusText }),
					{ status: response.status, headers: { 'Content-Type': 'application/json' } }
				);
			}
			return response;
		} catch (err) {
			return new Response(
				JSON.stringify({ type: 'error', status: 503, error: 'Backend server unreachable' }),
				{ status: 503, headers: { 'Content-Type': 'application/json' } }
			);
		}
	}

	event.respondWith(respond());
});
```

Notes:
- Only `/_app/remote/` requests are intercepted — everything else (page assets, Tauri's own routes) passes through untouched.
- Body is forwarded as an `ArrayBuffer` so POST payloads (form/command calls) survive the clone/forward round-trip.
- `X-SvelteKit-Remote` is a custom marker header your server-side hook uses to reliably detect forwarded calls (helpful since `Origin` can be missing in some WebView contexts).

## 4. Add CORS handling on your deployed server

`src/hooks.server.ts` on the backend:

```ts
import type { Handle } from '@sveltejs/kit';

const ALLOWED_ORIGINS = [
	'http://localhost:5173',   // frontend dev
	'http://localhost:1420',   // Tauri dev server (default Tauri port)
	'https://yourdomain.com',  // production frontend, if you also ship a web build
	'tauri://localhost',       // Tauri desktop (Windows/macOS webview origin)
	'http://localhost'         // Tauri Android / some Linux webviews
];

export const handle: Handle = async ({ event, resolve }) => {
	const origin = event.request.headers.get('origin');
	const isRemotePath = event.url.pathname.startsWith('/_app/remote/');
	const isRemoteCall = event.request.headers.has('X-SvelteKit-Remote');
	const isAllowedOrigin = origin !== null && ALLOWED_ORIGINS.includes(origin);
	const isGetRequest = event.request.method === 'GET' || event.request.method === 'HEAD';

	// CORS preflight for the custom header
	if (event.request.method === 'OPTIONS') {
		const requestHeaders =
			event.request.headers.get('access-control-request-headers') ??
			'content-type,x-sveltekit-remote';
		const allowedOrigin = isAllowedOrigin ? origin! : ALLOWED_ORIGINS[0];

		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': allowedOrigin,
				'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
				'Access-Control-Allow-Headers': requestHeaders,
				'Access-Control-Allow-Credentials': 'true',
				'Access-Control-Max-Age': '600',
				Vary: 'Origin'
			}
		});
	}

	const res = await resolve(event);

	if (isRemotePath || isRemoteCall) {
		res.headers.append('Vary', 'Origin');
		if (isAllowedOrigin) {
			res.headers.set('Access-Control-Allow-Origin', origin!);
			res.headers.set('Access-Control-Allow-Credentials', 'true');
		} else if (isGetRequest) {
			res.headers.set('Access-Control-Allow-Origin', origin ?? '*');
		}
	}

	return res;
};
```

If you already have a `hooks.server.ts` (auth, i18n, etc.), merge this logic into your existing `handle` rather than replacing it — the OPTIONS short-circuit and CORS header block are the parts that matter.

## 5. Register the service worker

If you're not already doing this in your root layout, SvelteKit's `adapter-static` build ships `service-worker.ts` automatically when it's detected at `src/service-worker.ts` — no manual registration code needed in most setups, but double-check your `+layout.svelte` doesn't have logic that skips registration in dev/Tauri contexts.

## 6. Tauri-specific config

- In `tauri.conf.json`, make sure your CSP (if set) allows connecting to your API host — add it under `connect-src` in `app.security.csp`, e.g. `connect-src 'self' https://api.yourdomain.com`.
- Tauri's webview origin is typically `tauri://localhost` on desktop; confirm the actual origin your build sends (log `event.request.headers.get('origin')` server-side once) and match it exactly in `ALLOWED_ORIGINS` — it can vary slightly across platforms (Windows uses `https://tauri.localhost` in newer Tauri v2 builds, for example). Check this against your actual build rather than assuming.

## 7. Test

1. `pnpm build && pnpm tauri dev` (or run the built app).
2. Open the WebView devtools → Application/Service Workers → confirm it's activated.
3. Trigger a `query`/`form`/`command` call and check the Network tab: the request should be intercepted and forwarded to your API host, with a 200 (or your expected) response.
4. If it fails: check the server logs for CORS rejection (origin mismatch is the most common cause), and confirm the remote file path matches exactly between the two codebases (mismatched paths → mismatched hash → 404 on the backend).

## Known limitations

- `prerender` remote functions won't work cross-origin — they're meant to be baked into the static build at your Tauri app's own build time, so just call them normally and let them resolve locally during `pnpm build`.
- This is an unofficial workaround, not a supported SvelteKit feature — there's an [open feature request](https://github.com/sveltejs/kit/issues/14336) to add native support (a `kit.remoteFunctions.origin` config) for exactly this static + remote-server scenario. Worth checking periodically in case it lands and lets you drop the service worker.

**Reference implementation:** [robinbraemer/sveltekit-static-to-remote](https://github.com/robinbraemer/sveltekit-static-to-remote) — this guide adapts its service worker and CORS hook for a Tauri target specifically.

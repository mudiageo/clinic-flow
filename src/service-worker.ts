/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />
/// <reference types="../.svelte-kit/ambient.d.ts" />

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BACKEND_HOST, BACKEND_INSECURE } from '$app/env/public';


declare let self: ServiceWorkerGlobalScope
self = globalThis.self as unknown as ServiceWorkerGlobalScope;
const dev = self.location.hostname === 'localhost';

// Required: precache manifest injection point for injectManifest mode
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

// --- your existing font caching, ported to workbox-routing ---
registerRoute(
	({ url }) => /^https:\/\/fonts\.googleapis\.com\/.*/i.test(url.href),
	new CacheFirst({
		cacheName: 'google-fonts-cache',
		plugins: [
			new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
			new CacheableResponsePlugin({ statuses: [0, 200] })
		]
	})
);

// --- remote-function cross-origin forwarder ---
const productionHost = BACKEND_HOST || 'localhost:5174';
const productionSecure = BACKEND_INSECURE !== 'true' && !dev;

async function debugBroadcast(msg: string) {
	try {
		const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
		for (const client of clientsList) {
			client.postMessage({ type: 'DEBUG_LOG', msg });
		}
	} catch(e) {}
}

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (!url.pathname.startsWith('/_app/remote/')) return; // leave workbox routes alone

	event.respondWith(
		(async () => {
			debugBroadcast(`[fetch] Intercepted request for ${url.pathname}`);
			let targetHost = dev ? 'localhost:5174' : productionHost;
			let targetSecure = dev ? false : productionSecure;

			// Try to read dynamic URL from cache storage (set by client)
			try {
				const cache = await caches.open('clinicflow-config');
				const res = await cache.match('/server-url');
				if (res) {
					const customUrl = await res.text();
					debugBroadcast(`[fetch] Found cache customUrl: ${customUrl}`);
					const parsed = new URL(customUrl);
					targetHost = parsed.host;
					targetSecure = parsed.protocol === 'https:';
				} else {
					debugBroadcast(`[fetch] No customUrl in cache, using default.`);
				}
			} catch (e) {
				console.error('Failed to read custom server URL from cache', e);
				debugBroadcast(`[fetch] Cache read error: ${(e as Error).message}`);
			}

			const newUrl = new URL(event.request.url);
			newUrl.host = targetHost;
			newUrl.protocol = targetSecure ? 'https:' : 'http:';

			const req = event.request.clone();
			const headers = new Headers(req.headers);
			headers.set('X-SvelteKit-Remote', 'true');

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
				debugBroadcast(`[fetch] Request body size: ${bodyBuffer.byteLength}`);
			}

			debugBroadcast(`[fetch] Forwarding to: ${newUrl.toString()} (method: ${init.method})`);
			try {
				const response = await fetch(newUrl.toString(), init);
				debugBroadcast(`[fetch] Response status: ${response.status} ${response.statusText}`);
				
				if (!response.ok) {
					debugBroadcast(`[fetch] Error response!`);
					return new Response(
						JSON.stringify({ type: 'error', status: response.status, error: response.statusText }),
						{ status: response.status, headers: { 'Content-Type': 'application/json' } }
					);
				}
				return response;
			} catch(fetchError) {
				debugBroadcast(`[fetch] Network error during fetch: ${(fetchError as Error).message}`);
				return new Response(
					JSON.stringify({ type: 'error', status: 503, error: (fetchError as Error).message }),
					{ status: 503, headers: { 'Content-Type': 'application/json' } }
				);
			}

		})()
	);
});

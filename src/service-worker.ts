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

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (!url.pathname.startsWith('/_app/remote/')) return; // leave workbox routes alone

	const newUrl = new URL(event.request.url);
	newUrl.host = dev ? 'localhost:5174' : productionHost;
	newUrl.protocol = productionSecure ? 'https:' : 'http:';

	async function respond() {
		try {
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
			}

			const response = await fetch(newUrl.toString(), init);
			if (!response.ok) {
				return new Response(
					JSON.stringify({ type: 'error', status: response.status, error: response.statusText }),
					{ status: response.status, headers: { 'Content-Type': 'application/json' } }
				);
			}
			return response;
		} catch {
			return new Response(
				JSON.stringify({ type: 'error', status: 503, error: 'Backend server unreachable' }),
				{ status: 503, headers: { 'Content-Type': 'application/json' } }
			);
		}
	}

	event.respondWith(respond());
});

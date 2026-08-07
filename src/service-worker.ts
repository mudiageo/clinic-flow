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


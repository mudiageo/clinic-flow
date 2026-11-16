import { self } from '$app/service-worker';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BACKEND_HOST, BACKEND_INSECURE } from '$app/env/public';

const dev = self.location.hostname === 'localhost';

// Clean up old caches
cleanupOutdatedCaches();

// Required: precache manifest injection point for injectManifest mode
precacheAndRoute(self.__WB_MANIFEST);

// Force navigation requests (like refreshing the page) to check the network first.
// This ensures users always get the latest version on refresh, falling back to cache if offline.
registerRoute(
	new NavigationRoute(
		new NetworkFirst({
			cacheName: 'navigation-cache',
			plugins: [new CacheableResponsePlugin({ statuses: [200] })]
		})
	)
);

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

/**
 * Minimal service worker: caches same-origin static assets (JS, CSS, fonts) on first use.
 * Improves repeat-visit load times. Cache name bumps when you deploy (update version below).
 */
const CACHE_NAME = 'standalone-playground-v4';

self.addEventListener('fetch', function (event) {
	if (event.request.method !== 'GET') return;
	const u = new URL(event.request.url);
	if (u.origin !== self.location.origin) return;
	// Cache JS, CSS, fonts, and optional images from our assets
	const path = u.pathname;
	const cacheIt = /\.(js|css|woff2?|ttf|eot)(\?.*)?$/i.test(path) ||
		path.indexOf('/assets/') !== -1;
	if (!cacheIt) return;

	event.respondWith(
		caches.open(CACHE_NAME).then(function (cache) {
			return cache.match(event.request).then(function (cached) {
				if (cached) return cached;
				return fetch(event.request).then(function (response) {
					if (response && response.status === 200 && response.type === 'basic') {
						try { cache.put(event.request, response.clone()); } catch (e) {}
					}
					return response;
				});
			});
		})
	);
});

self.addEventListener('activate', function (event) {
	event.waitUntil(
		caches.keys().then(function (keys) {
			return Promise.all(
				keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); })
			);
		})
	);
});

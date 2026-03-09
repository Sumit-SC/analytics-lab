/**
 * Register the service worker for caching static assets (JS, CSS, assets).
 * Included on all pages so the first visit registers the SW for the origin.
 */
if ('serviceWorker' in navigator) {
	window.addEventListener('load', function () {
		navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(function () {});
	});
}

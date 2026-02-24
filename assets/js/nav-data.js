/**
 * Single source for app nav links. Used by nav-inject.js to fill .nav-links-inline and .nav-drawer-links.
 * To add a page: add an entry here and ensure the page has data-current-page="pageId" and the inject script.
 */
(function () {
	// Paths from site root. Nav-inject.js resolves them for root (index.html) vs pages/*.html.
	window.NAV_LINKS = [
		{ path: 'index.html', label: 'Home', id: 'index' },
		{ path: 'pages/playground.html', label: 'Playground', id: 'playground' },
		{ path: 'pages/trends.html', label: 'Trends', id: 'trends' },
		{ path: 'pages/resources.html', label: 'Resources', id: 'resources' },
		{ path: 'pages/tools.html', label: 'Tools', id: 'tools' },
		{ path: 'pages/jobs.html', label: 'Jobs', id: 'jobs' },
		{ path: 'pages/docs.html', label: 'Docs', id: 'docs' }
	];
})();

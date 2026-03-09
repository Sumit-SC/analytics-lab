/**
 * Injects nav links from NAV_LINKS (nav-data.js) into elements with data-nav-inject="main" or data-nav-inject="drawer".
 * Set on <body> or <html>: data-current-page="index" | "playground" | "trends" | "resources" | "tools" | "jobs" for active styling.
 */
(function () {
	var links = typeof window.NAV_LINKS !== 'undefined' ? window.NAV_LINKS : [];
	if (!links.length) return;

	var current = '';
	var body = document.body || document.documentElement;
	if (body && body.getAttribute) current = (body.getAttribute('data-current-page') || '').trim().toLowerCase();

	function escapeHtml(s) {
		if (s == null) return '';
		var t = String(s);
		return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
	}

	function renderLink(item, isDrawer) {
		var active = current && item.id && item.id.toLowerCase() === current;
		var base = (item.path && item.path.indexOf('./') === 0) ? item.path : './' + (item.path || '');
		var cls = isDrawer
			? (active ? 'text-primary border-primary' : '')
			: (active ? 'text-sm font-semibold text-primary border-b-2 border-primary pb-1' : 'text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary');
		return '<a href="' + escapeHtml(base) + '"' + (cls ? ' class="' + escapeHtml(cls) + '"' : '') + '>' + escapeHtml(item.label) + '</a>';
	}

	function inject(selector, isDrawer) {
		var el = document.querySelector(selector);
		if (!el) return;
		var html = '';
		links.forEach(function (item) {
			if (html) html += isDrawer ? '' : '\n\t\t\t\t'; // drawer is just <a>s, inline has gap-2
			html += renderLink(item, isDrawer);
		});
		el.innerHTML = html;
	}

	function hrefFor(item) {
		var path = item.path || '';
		var inPages = typeof window !== 'undefined' && window.location && (window.location.pathname.indexOf('/pages/') !== -1 || window.location.pathname.indexOf('\\pages\\') !== -1);
		if (inPages) {
			if (item.id === 'index') return '../index.html';
			return './' + path.replace(/^pages\//, ''); // e.g. playground.html
		}
		return path.indexOf('/') === -1 ? path : path; // from root: index.html or pages/playground.html
	}

	function run() {
		var main = document.querySelector('[data-nav-inject="main"]');
		var drawer = document.querySelector('[data-nav-inject="drawer"]');
		if (main) {
			main.innerHTML = '';
			links.forEach(function (item) {
				var a = document.createElement('a');
				a.href = hrefFor(item);
				a.textContent = item.label;
				var active = current && item.id && item.id.toLowerCase() === current;
				a.className = active ? 'text-sm font-semibold text-primary border-b-2 border-primary pb-1' : 'text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary';
				main.appendChild(a);
			});
		}
		if (drawer) {
			drawer.innerHTML = '';
			links.forEach(function (item) {
				var a = document.createElement('a');
				a.href = hrefFor(item);
				a.textContent = item.label;
				var active = current && item.id && item.id.toLowerCase() === current;
				if (active) a.className = 'text-primary border-primary';
				drawer.appendChild(a);
			});
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', run);
	} else {
		run();
	}
})();

/**
 * Theme toggle (light / dark). Shared by index and resources pages.
 */
(function () {
	var storageKey = 'standalone_theme';
	var root = document.documentElement;
	var btn = document.getElementById('theme-toggle');
	var current = null;

	function apply(theme) {
		current = theme === 'dark' ? 'dark' : 'light';
		if (current === 'dark') root.classList.add('dark');
		else root.classList.remove('dark');
		if (btn) {
			btn.textContent = current === 'dark' ? '☀️' : '🌙';
			btn.setAttribute('aria-label', current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
		}
	}

	var saved = null;
	try {
		saved = localStorage.getItem(storageKey);
	} catch (e) {}
	if (!saved) {
		var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
		saved = prefersDark ? 'dark' : 'light';
	}
	apply(saved);

	if (btn) {
		btn.addEventListener('click', function () {
			var next = current === 'dark' ? 'light' : 'dark';
			apply(next);
			try {
				localStorage.setItem(storageKey, next);
			} catch (e) {}
		});
	}
})();

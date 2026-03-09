/**
 * Load Tailwind: try CDN first, fallback to local for offline / CDN failure.
 * Must run in <head> so config applies before Tailwind processes the page.
 */
(function () {
	function applyConfig() {
		if (window.tailwind && window.tailwind.config) {
			window.tailwind.config = {
				darkMode: 'class',
				theme: {
					extend: {
						colors: {
							primary: 'var(--color-primary, #6366f1)',
							accent: 'var(--color-accent, #818cf8)',
						},
					},
				},
			};
		}
	}
	function loadLocal() {
		var t = document.createElement('script');
		t.src = './assets/vendor/tailwind.min.js';
		t.onload = applyConfig;
		document.head.appendChild(t);
	}
	var s = document.createElement('script');
	s.src = 'https://cdn.tailwindcss.com';
	s.onload = applyConfig;
	s.onerror = loadLocal;
	document.head.appendChild(s);
})();

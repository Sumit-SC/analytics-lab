/**
 * Global left Resources sidebar behavior.
 * - Desktop: collapse to 48px (localStorage persisted)
 * - Mobile (if a page provides #sidebar-mobile-toggle): open as drawer with overlay
 * - Resource groups: click-to-expand on touch, hover-to-expand on pointer devices (CSS)
 */
(function () {
	'use strict';

	var SIDEBAR_KEY = 'standalone_sidebar_open';
	var sidebar = document.getElementById('sidebar');
	var btn = document.getElementById('sidebar-toggle-btn');
	var overlay = document.getElementById('sidebar-overlay');
	var mobileToggle = document.getElementById('sidebar-mobile-toggle');

	if (!sidebar) return;

	function closeMobileSidebar() {
		sidebar.classList.remove('mobile-open');
		if (overlay) overlay.classList.add('hidden');
	}

	// Restore collapsed state (desktop)
	try {
		var saved = localStorage.getItem(SIDEBAR_KEY);
		if (saved === 'false') sidebar.classList.add('collapsed');
	} catch (e) {}

	// Collapse / expand button (desktop) + close drawer (mobile)
	if (btn) {
		btn.addEventListener('click', function () {
			// If open as drawer, this button acts as "close"
			if (sidebar.classList.contains('mobile-open')) {
				closeMobileSidebar();
				return;
			}
			sidebar.classList.toggle('collapsed');
			try {
				localStorage.setItem(SIDEBAR_KEY, sidebar.classList.contains('collapsed') ? 'false' : 'true');
			} catch (e) {}
		});
	}

	// Mobile drawer open toggle (optional per-page)
	if (mobileToggle && overlay) {
		mobileToggle.addEventListener('click', function () {
			sidebar.classList.toggle('mobile-open');
			overlay.classList.toggle('hidden', !sidebar.classList.contains('mobile-open'));
		});
	}
	if (overlay) {
		overlay.addEventListener('click', closeMobileSidebar);
	}

	// Click-to-expand groups (helps touch + keyboard users)
	sidebar.querySelectorAll('.resource-group').forEach(function (group) {
		var header = group.querySelector('p');
		if (!header) return;
		header.addEventListener('click', function (e) {
			// Let links inside sublist behave normally
			e.preventDefault();
			group.classList.toggle('resource-group-open');
		});
	});
})();


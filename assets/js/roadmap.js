/**
 * Roadmap panel: simple launcher for roadmap.sh links (no iframe embed).
 * - Opens official roadmaps in a new tab so their own cookies/progress work normally.
 */

(function () {
	var roadmapToggle = document.getElementById('roadmap-toggle');
	var roadmapPanel = document.getElementById('roadmap-panel');
	var roadmapOverlay = document.getElementById('roadmap-overlay');
	var roadmapClose = document.getElementById('roadmap-close');

	if (!roadmapToggle || !roadmapPanel || !roadmapOverlay || !roadmapClose) return;

	roadmapToggle.setAttribute('aria-expanded', 'false');
	roadmapToggle.setAttribute('aria-controls', 'roadmap-panel');
	roadmapPanel.setAttribute('aria-hidden', 'true');
	roadmapPanel.setAttribute('aria-modal', 'true');

	function showRoadmap() {
		roadmapPanel.classList.remove('hidden');
		roadmapOverlay.classList.remove('hidden');
		roadmapToggle.setAttribute('aria-expanded', 'true');
		roadmapPanel.setAttribute('aria-hidden', 'false');
		document.body.style.overflow = 'hidden'; // Prevent body scroll when panel is open
		if (typeof roadmapClose.focus === 'function') roadmapClose.focus();
	}

	function hideRoadmap() {
		roadmapPanel.classList.add('hidden');
		roadmapOverlay.classList.add('hidden');
		roadmapToggle.setAttribute('aria-expanded', 'false');
		roadmapPanel.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = ''; // Restore scrolling
		if (typeof roadmapToggle.focus === 'function') roadmapToggle.focus();
	}

	function toggleRoadmap() {
		if (roadmapPanel.classList.contains('hidden')) {
			showRoadmap();
		} else {
			hideRoadmap();
		}
	}

	roadmapToggle.addEventListener('click', toggleRoadmap);
	roadmapClose.addEventListener('click', hideRoadmap);
	roadmapOverlay.addEventListener('click', hideRoadmap);

	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && !roadmapPanel.classList.contains('hidden')) {
			hideRoadmap();
		}
	});

	// Track checkboxes: persist in localStorage (key: resources_roadmap_track_{slug})
	var STORAGE_PREFIX = 'resources_roadmap_track_';
	document.querySelectorAll('.roadmap-track-cb').forEach(function (cb) {
		var slug = cb.getAttribute('data-slug');
		if (!slug) return;
		try {
			var stored = localStorage.getItem(STORAGE_PREFIX + slug);
			cb.checked = stored === 'true';
		} catch (err) { /* ignore */ }
		cb.addEventListener('change', function () {
			try {
				localStorage.setItem(STORAGE_PREFIX + slug, cb.checked ? 'true' : 'false');
			} catch (err) { /* ignore */ }
		});
	});
})();

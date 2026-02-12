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

	function showRoadmap() {
		roadmapPanel.classList.remove('hidden');
		roadmapOverlay.classList.remove('hidden');
		document.body.style.overflow = 'hidden'; // Prevent body scroll when panel is open
	}

	function hideRoadmap() {
		roadmapPanel.classList.add('hidden');
		roadmapOverlay.classList.add('hidden');
		document.body.style.overflow = ''; // Restore scrolling
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
})();

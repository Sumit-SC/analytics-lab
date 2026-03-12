/**
 * Lazy-load global widgets (dict, resources, music bar, video panel) on first user tap.
 * Loads the script only when the user opens the panel, so initial page load stays fast.
 */
(function () {
	'use strict';

	var base = document.querySelector('script[src*="lazy-panels.js"]');
	var src = base ? base.getAttribute('src') : '';
	var basePath = src ? src.replace(/\/[^/]*$/, '/') : './assets/js/';
	if (basePath.indexOf('./') === 0) basePath = basePath.slice(1);
	var prefix = document.querySelector('base') && document.querySelector('base').getAttribute('href') ? '' : (window.location.pathname.replace(/\/[^/]*$/, '/') || './');
	if (prefix === './' || prefix === '/') prefix = '';
	var scriptBase = (prefix + basePath).replace(/\/\/+/g, '/');

	function loadScript(path, callback) {
		var full = path.indexOf('http') === 0 ? path : (scriptBase + path.replace(/^\//, ''));
		if (document.querySelector('script[src*="' + path.split('/').pop() + '"]')) {
			if (callback) callback();
			return;
		}
		var s = document.createElement('script');
		s.src = full;
		s.defer = true;
		s.onload = function () { if (callback) callback(); };
		s.onerror = function () { if (callback) callback(); };
		document.body.appendChild(s);
	}

	function loadDict() {
		loadScript('dict-widget.js', function () {
			var btn = document.getElementById('global-dict-toggle');
			if (btn) setTimeout(function () { btn.click(); }, 50);
		});
	}

	function loadResources() {
		loadScript('resources-flyout.js', function () {
			var btn = document.getElementById('global-resources-toggle');
			if (btn) setTimeout(function () { btn.click(); }, 50);
		});
	}

	function loadGlobalWidgets(callback) {
		loadScript('global-widgets.js', callback || function () {});
	}

	function loadAssistant(callback) {
		loadScript('assistant.js', callback || function () {});
	}

	// Dict: load on first click, then open
	var dictToggle = document.getElementById('global-dict-toggle');
	if (dictToggle) {
		dictToggle.addEventListener('click', function () { loadDict(); }, { once: true });
	}

	// Resources: load on first click, then open
	var resToggle = document.getElementById('global-resources-toggle');
	if (resToggle) {
		resToggle.addEventListener('click', function () { loadResources(); }, { once: true });
	}

	var musicBar = document.getElementById('global-music-bar');
	var ytPanelToggle = document.getElementById('global-yt-panel-toggle');
	var widgetLoaded = false;

	function attachWidgetLoader() {
		if (widgetLoaded) return;
		widgetLoaded = true;
		loadGlobalWidgets();
	}

	if (musicBar) {
		musicBar.addEventListener('click', attachWidgetLoader, { once: true });
		musicBar.addEventListener('focusin', attachWidgetLoader, { once: true });
	}
	if (ytPanelToggle) {
		ytPanelToggle.addEventListener('click', function () {
			loadGlobalWidgets(function () {
				setTimeout(function () { ytPanelToggle.click(); }, 50);
			});
		}, { once: true });
	}

	// Assistant: lazy-load on first open
	var assistantBtn = document.getElementById('assistant-btn');
	if (assistantBtn) {
		assistantBtn.addEventListener('click', function () {
			loadAssistant(function () {
				setTimeout(function () { assistantBtn.click(); }, 50);
			});
		}, { once: true });
	}
})();

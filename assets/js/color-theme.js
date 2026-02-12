/**
 * Color theme picker with 7 color options. Works with dark/light mode.
 */
(function () {
	var COLOR_THEMES = {
		blue: { primary: '#3b82f6', accent: '#60a5fa', name: 'Blue' },
		purple: { primary: '#8b5cf6', accent: '#a78bfa', name: 'Purple' },
		indigo: { primary: '#6366f1', accent: '#818cf8', name: 'Indigo' },
		teal: { primary: '#14b8a6', accent: '#5eead4', name: 'Teal' },
		emerald: { primary: '#10b981', accent: '#34d399', name: 'Emerald' },
		rose: { primary: '#f43f5e', accent: '#fb7185', name: 'Rose' },
		orange: { primary: '#f97316', accent: '#fb923c', name: 'Orange' },
	};
	var STORAGE_KEY = 'standalone_color_theme';
	var currentColor = null;

	function applyColorTheme(colorKey) {
		if (!COLOR_THEMES[colorKey]) colorKey = 'indigo'; // default
		currentColor = colorKey;
		var theme = COLOR_THEMES[colorKey];
		var root = document.documentElement;
		root.style.setProperty('--color-primary', theme.primary);
		root.style.setProperty('--color-accent', theme.accent);
		try {
			localStorage.setItem(STORAGE_KEY, colorKey);
		} catch (e) {}
	}

	// Load saved color or default
	var saved = null;
	try {
		saved = localStorage.getItem(STORAGE_KEY);
	} catch (e) {}
	applyColorTheme(saved || 'indigo');

	// Create color picker UI
	function createColorPicker() {
		var btn = document.getElementById('color-theme-toggle');
		if (!btn) return;

		var picker = document.createElement('div');
		picker.id = 'color-picker';
		picker.className =
			'hidden fixed top-16 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4';
		picker.innerHTML = '<div class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Color Theme</div><div class="flex flex-wrap gap-2"></div>';

		var colorsContainer = picker.querySelector('div:last-child');
		Object.keys(COLOR_THEMES).forEach(function (key) {
			var theme = COLOR_THEMES[key];
			var colorBtn = document.createElement('button');
			colorBtn.className =
				'w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ' +
				(currentColor === key ? 'border-gray-800 dark:border-gray-200 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : 'border-gray-300 dark:border-gray-600');
			colorBtn.style.backgroundColor = theme.primary;
			colorBtn.setAttribute('aria-label', theme.name);
			colorBtn.title = theme.name;
			colorBtn.addEventListener('click', function () {
				applyColorTheme(key);
				updateColorButtons();
				picker.classList.add('hidden');
			});
			colorsContainer.appendChild(colorBtn);
		});

		document.body.appendChild(picker);

		function updateColorButtons() {
			picker.querySelectorAll('button').forEach(function (b, idx) {
				var key = Object.keys(COLOR_THEMES)[idx];
				if (currentColor === key) {
					b.classList.add('border-gray-800', 'dark:border-gray-200', 'ring-2');
					b.classList.remove('border-gray-300', 'dark:border-gray-600');
				} else {
					b.classList.remove('border-gray-800', 'dark:border-gray-200', 'ring-2');
					b.classList.add('border-gray-300', 'dark:border-gray-600');
				}
			});
		}

		btn.addEventListener('click', function (e) {
			e.stopPropagation();
			picker.classList.toggle('hidden');
		});

		document.addEventListener('click', function (e) {
			if (!picker.contains(e.target) && e.target !== btn) {
				picker.classList.add('hidden');
			}
		});
	}

	// Wait for DOM
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', createColorPicker);
	} else {
		createColorPicker();
	}

	// Export for other scripts
	window.applyColorTheme = applyColorTheme;
	window.getCurrentColorTheme = function () {
		return currentColor;
	};
})();

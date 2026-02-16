/**
 * Mobile nav drawer: open/close via hamburger, overlay, close button, Escape.
 */
(function () {
	var btn = document.querySelector('.nav-menu-btn');
	var overlay = document.getElementById('nav-drawer-overlay');
	var drawer = document.getElementById('nav-drawer');
	var closeBtn = document.querySelector('#nav-drawer .nav-drawer-close');

	function open() {
		if (overlay) overlay.classList.add('nav-drawer-open');
		if (drawer) drawer.classList.add('nav-drawer-open');
		if (btn) btn.setAttribute('aria-expanded', 'true');
		document.body.style.overflow = 'hidden';
	}

	function close() {
		if (overlay) overlay.classList.remove('nav-drawer-open');
		if (drawer) drawer.classList.remove('nav-drawer-open');
		if (btn) btn.setAttribute('aria-expanded', 'false');
		document.body.style.overflow = '';
	}

	if (btn && (overlay || drawer)) {
		btn.setAttribute('aria-expanded', 'false');
		btn.setAttribute('aria-controls', 'nav-drawer');
		btn.setAttribute('aria-label', 'Open menu');
		btn.addEventListener('click', function () {
			if (drawer && drawer.classList.contains('nav-drawer-open')) close();
			else open();
		});
	}
	if (overlay) overlay.addEventListener('click', close);
	if (closeBtn) closeBtn.addEventListener('click', close);
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && drawer && drawer.classList.contains('nav-drawer-open')) close();
	});
})();

/**
 * Global widgets: music bar (YouTube play/pause/next, queue in localStorage) and right-side YouTube panel (searchable Shorts/feed).
 * Included on every page. Data stored in browser only (localStorage).
 */
(function () {
	'use strict';

	var QUEUE_KEY = 'standalone_music_queue';
	var CURRENT_KEY = 'standalone_music_current';
	var PANEL_OPEN_KEY = 'standalone_yt_panel_open';
	var YT_API_LOADED = false;
	var ytPlayer = null;
	var playerReady = false;

	function getQueue() {
		try {
			var q = localStorage.getItem(QUEUE_KEY);
			return q ? JSON.parse(q) : [];
		} catch (e) { return []; }
	}
	function setQueue(q) {
		try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch (e) {}
	}
	function getCurrent() {
		try { return localStorage.getItem(CURRENT_KEY) || ''; } catch (e) { return ''; }
	}
	function setCurrent(id) {
		try { localStorage.setItem(CURRENT_KEY, id || ''); } catch (e) {}
	}

	function parseVideoId(input) {
		if (!input || !input.trim()) return '';
		var s = input.trim();
		var m = s.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
		return m ? m[1] : (s.length === 11 ? s : '');
	}

	// --- Music bar ---
	var bar = document.getElementById('global-music-bar');
	var barPlay = document.getElementById('global-music-play');
	var barPause = document.getElementById('global-music-pause');
	var barNext = document.getElementById('global-music-next');
	var barInput = document.getElementById('global-music-input');
	var barAdd = document.getElementById('global-music-add');
	var barFocus = document.getElementById('global-music-focus');
	var barTitle = document.getElementById('global-music-title');
	var playerDiv = document.getElementById('global-yt-player-wrap');

	// Simple built-in playlist as a Spotify-style alternative (YouTube IDs only)
	var DEFAULT_QUEUE = [
		{ id: '5qap5aO4i9A', title: 'lofi hip hop radio – beats to relax/study to' },
		{ id: 'jfKfPfyJRdk', title: 'lofi hip hop radio – beats to chill/study to' },
		{ id: 'DWcJFNfaw9c', title: 'Ambient study music' }
	];

	function loadYtApi(cb) {
		if (window.YT && window.YT.Player) {
			YT_API_LOADED = true;
			if (cb) cb();
			return;
		}
		var tag = document.createElement('script');
		tag.src = 'https://www.youtube.com/iframe_api';
		var first = document.getElementsByTagName('script')[0];
		first.parentNode.insertBefore(tag, first);
		window.onYouTubeIframeAPIReady = function () {
			YT_API_LOADED = true;
			if (cb) cb();
		};
	}

	function initPlayer() {
		if (!playerDiv || ytPlayer) return;
		loadYtApi(function () {
			ytPlayer = new YT.Player('global-yt-player-iframe', {
				height: '1',
				width: '1',
				videoId: getCurrent() || undefined,
				playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1 },
				events: {
					onReady: function () {
						playerReady = true;
						updateBarTitle();
					}
				}
			});
		});
	}

	function loadVideo(id) {
		setCurrent(id);
		if (ytPlayer && ytPlayer.loadVideoById) {
			ytPlayer.loadVideoById(id || '');
		} else if (playerDiv) {
			initPlayer();
			setTimeout(function () {
				if (ytPlayer && ytPlayer.loadVideoById) ytPlayer.loadVideoById(id || '');
			}, 500);
		}
		updateBarTitle();
	}

	function playNext() {
		var q = getQueue();
		var cur = getCurrent();
		var idx = q.findIndex(function (x) { return (x.id || x) === cur; });
		var nextId = '';
		if (idx >= 0 && idx < q.length - 1) {
			nextId = q[idx + 1].id || q[idx + 1];
		} else if (q.length > 0) {
			nextId = q[0].id || q[0];
		}
		if (nextId) loadVideo(nextId);
	}

	function updateBarTitle() {
		if (!barTitle) return;
		var cur = getCurrent();
		var q = getQueue();
		var item = q.find(function (x) { return (x.id || x) === cur; });
		var t = (item && item.title) ? item.title : (cur ? 'Playing' : 'Paste YouTube URL or ID');
		barTitle.textContent = t;
	}

	if (bar) {
		// Player div must exist before YT.Player() runs (API injects iframe into it)
		if (playerDiv && !document.getElementById('global-yt-player-iframe')) {
			var el = document.createElement('div');
			el.id = 'global-yt-player-iframe';
			playerDiv.appendChild(el);
		}
		initPlayer();

		if (barAdd && barInput) {
			barAdd.addEventListener('click', function () {
				var id = parseVideoId(barInput.value);
				if (id) {
					var q = getQueue();
					q.push({ id: id, title: '' });
					setQueue(q);
					barInput.value = '';
					loadVideo(id);
				}
			});
		}
		if (barFocus) {
			barFocus.addEventListener('click', function () {
				setQueue(DEFAULT_QUEUE.slice());
				if (DEFAULT_QUEUE[0]) {
					loadVideo(DEFAULT_QUEUE[0].id);
				}
			});
		}
		barInput && barInput.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') barAdd && barAdd.click();
		});

		if (barPlay) barPlay.addEventListener('click', function () {
			if (ytPlayer && ytPlayer.playVideo) ytPlayer.playVideo();
		});
		if (barPause) barPause.addEventListener('click', function () {
			if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
		});
		if (barNext) barNext.addEventListener('click', playNext);

		updateBarTitle();
	}

	// --- Right-side video panel (YouTube big player / search helper) ---
	var panel = document.getElementById('global-yt-panel');
	var panelToggle = document.getElementById('global-yt-panel-toggle');
	var panelClose = document.getElementById('global-yt-panel-close');
	var panelSearch = document.getElementById('global-yt-panel-search');
	var panelInput = document.getElementById('global-yt-panel-input');
	var panelFrame = document.getElementById('global-yt-panel-iframe');
	var DEFAULT_EMBED_ID = DEFAULT_QUEUE[0] ? DEFAULT_QUEUE[0].id : '';

	function setPanelOpen(open) {
		try { localStorage.setItem(PANEL_OPEN_KEY, open ? '1' : '0'); } catch (e) {}
		if (panel) panel.classList.toggle('global-yt-panel-open', !!open);
	}

	function openSearch(q) {
		if (!panelFrame) return;
		var trimmed = (q || '').trim();
		if (!trimmed) {
			// If no query, just ensure a default focus video is loaded for ambience
			if (!panelFrame.src && DEFAULT_EMBED_ID) {
				panelFrame.src = 'https://www.youtube.com/embed/' + DEFAULT_EMBED_ID;
			}
			return;
		}
		// If user pasted a URL or ID, embed that video directly
		var id = parseVideoId(trimmed);
		if (id) {
			panelFrame.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
			return;
		}
		// Otherwise, open YouTube search in a new tab and keep panel as a player
		try {
			window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(trimmed), '_blank', 'noopener');
		} catch (e) {}
		if (!panelFrame.src && DEFAULT_EMBED_ID) {
			panelFrame.src = 'https://www.youtube.com/embed/' + DEFAULT_EMBED_ID;
		}
	}

	if (panel) {
		try {
			if (localStorage.getItem(PANEL_OPEN_KEY) === '1') panel.classList.add('global-yt-panel-open');
		} catch (e) {}
		if (panelToggle) {
			panelToggle.addEventListener('click', function () {
				var open = panel.classList.toggle('global-yt-panel-open');
				setPanelOpen(open);
				if (open && !panelFrame.src && DEFAULT_EMBED_ID) {
					panelFrame.src = 'https://www.youtube.com/embed/' + DEFAULT_EMBED_ID;
				}
			});
		}
		if (panelClose) {
			panelClose.addEventListener('click', function () {
				panel.classList.remove('global-yt-panel-open');
				setPanelOpen(false);
			});
		}
		if (panelSearch && panelInput) {
			panelSearch.addEventListener('click', function () {
				openSearch(panelInput.value.trim());
			});
			panelInput.addEventListener('keydown', function (e) {
				if (e.key === 'Enter') openSearch(panelInput.value.trim());
			});
		}
		// Do not eagerly load anything; wait for user interaction or openSearch
	}
})();

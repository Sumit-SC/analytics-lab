/**
 * Global widgets: music bar (YouTube play/pause/next, queue in localStorage) and right-side YouTube panel (searchable Shorts/feed).
 * Included on every page. Data stored in browser only (localStorage).
 */
(function () {
	'use strict';

	var QUEUE_KEY = 'standalone_music_queue';
	var CURRENT_KEY = 'standalone_music_current';
	var PANEL_OPEN_KEY = 'standalone_yt_panel_open';
	var MUSIC_SOURCE_KEY = 'standalone_music_source'; // 'yt' | 'saavn'
	var SAAVN_QUEUE_KEY = 'standalone_saavn_queue';
	var SAAVN_INDEX_KEY = 'standalone_saavn_index';
	var YT_API_LOADED = false;
	var ytApiPendingCb = null;
	var ytPlayer = null;
	var playerReady = false;
	var JIOSAAVN_API_BASE = 'https://saavn.sumit.co';
	var saavnAudio = null;
	var saavnQueue = [];
	var saavnCurrentIndex = 0;

	// Must be on window before the YouTube script loads (API calls it when ready)
	window.onYouTubeIframeAPIReady = function () {
		YT_API_LOADED = true;
		if (ytApiPendingCb) {
			ytApiPendingCb();
			ytApiPendingCb = null;
		}
	};

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
	function getMusicSource() {
		try { return localStorage.getItem(MUSIC_SOURCE_KEY) || 'yt'; } catch (e) { return 'yt'; }
	}
	function setMusicSource(src) {
		try { localStorage.setItem(MUSIC_SOURCE_KEY, src || 'yt'); } catch (e) {}
	}
	function getSaavnQueue() {
		try {
			var q = localStorage.getItem(SAAVN_QUEUE_KEY);
			return q ? JSON.parse(q) : [];
		} catch (e) { return []; }
	}
	function setSaavnQueue(q) {
		try { localStorage.setItem(SAAVN_QUEUE_KEY, JSON.stringify(q || [])); } catch (e) {}
	}
	function getSaavnIndex() {
		try { return parseInt(localStorage.getItem(SAAVN_INDEX_KEY), 10) || 0; } catch (e) { return 0; }
	}
	function setSaavnIndex(i) {
		try { localStorage.setItem(SAAVN_INDEX_KEY, String(i)); } catch (e) {}
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

	// --- JioSaavn (unofficial API: search + stream URL, HTML5 Audio) ---
	function getStreamUrl(song) {
		if (!song) return '';
		if (song.downloadUrl && song.downloadUrl.length > 0) {
			var best = song.downloadUrl[song.downloadUrl.length - 1];
			if (best && best.url) return best.url;
			if (song.downloadUrl[0] && song.downloadUrl[0].url) return song.downloadUrl[0].url;
		}
		if (song.url && song.url.indexOf('http') === 0) return song.url;
		return '';
	}
	function searchSaavn(query, cb) {
		if (!query || !query.trim()) { if (cb) cb([]); return; }
		var url = JIOSAAVN_API_BASE + '/api/search/songs?query=' + encodeURIComponent(query.trim()) + '&limit=15';
		fetch(url)
			.then(function (r) { return r.json(); })
			.then(function (data) {
				var list = (data && data.data && data.data.results) ? data.data.results : [];
				if (cb) cb(list);
			})
			.catch(function () { if (cb) cb([]); });
	}
	function renderSaavnResults(list) {
		var el = document.getElementById('global-saavn-list');
		var wrap = document.getElementById('global-saavn-results');
		if (!el || !wrap) return;
		wrap.style.display = 'block';
		if (!list || list.length === 0) {
			el.innerHTML = '<li class="global-saavn-item global-saavn-empty">No results. Try another search.</li>';
			return;
		}
		el.innerHTML = list.map(function (s, i) {
			var name = (s.name || s.title || 'Track').replace(/</g, '&lt;');
			var artists = (s.primaryArtists || s.singers || (s.artists && s.artists.primary && s.artists.primary.map(function (a) { return a.name; }).join(', ')) || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
			var sub = artists ? ' — ' + artists : '';
			return '<li class="global-saavn-item" data-i="' + i + '" role="button" tabindex="0"><span class="global-saavn-item-title">' + name + '</span><span class="global-saavn-item-artist">' + sub + '</span></li>';
		}).join('');
		el.querySelectorAll('.global-saavn-item[data-i]').forEach(function (item) {
			item.addEventListener('click', function () {
				var i = parseInt(item.getAttribute('data-i'), 10);
				playSaavnAt(i);
			});
			item.addEventListener('keydown', function (e) {
				if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
			});
		});
	}
	function playSaavnAt(index) {
		saavnQueue = getSaavnQueue();
		if (index < 0 || index >= saavnQueue.length) return;
		saavnCurrentIndex = index;
		setSaavnIndex(index);
		var song = saavnQueue[index];
		var url = getStreamUrl(song);
		if (!url) return;
		if (!saavnAudio) {
			saavnAudio = new Audio();
			saavnAudio.addEventListener('ended', function () {
				if (getMusicSource() === 'saavn') playNextSaavn();
			});
		}
		saavnAudio.src = url;
		saavnAudio.play().catch(function () {});
		updateBarTitle();
	}
	function playNextSaavn() {
		saavnQueue = getSaavnQueue();
		if (saavnQueue.length === 0) return;
		saavnCurrentIndex = (getSaavnIndex() + 1) % saavnQueue.length;
		setSaavnIndex(saavnCurrentIndex);
		playSaavnAt(saavnCurrentIndex);
	}
	function playPrevSaavn() {
		saavnQueue = getSaavnQueue();
		if (saavnQueue.length === 0) return;
		saavnCurrentIndex = getSaavnIndex() - 1;
		if (saavnCurrentIndex < 0) saavnCurrentIndex = saavnQueue.length - 1;
		setSaavnIndex(saavnCurrentIndex);
		playSaavnAt(saavnCurrentIndex);
	}

	function loadYtApi(cb) {
		if (window.YT && window.YT.Player) {
			YT_API_LOADED = true;
			if (cb) cb();
			return;
		}
		ytApiPendingCb = cb;
		if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return; // already loading; callback will run when ready
		var tag = document.createElement('script');
		tag.src = 'https://www.youtube.com/iframe_api';
		tag.async = true;
		var first = document.getElementsByTagName('script')[0];
		first.parentNode.insertBefore(tag, first);
	}

	function initPlayer() {
		if (!playerDiv || ytPlayer) return;
		var container = document.getElementById('global-yt-player-iframe');
		if (!container) return;
		loadYtApi(function () {
			try {
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
			} catch (e) {
				playerReady = false;
				ytPlayer = null;
			}
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
		if (getMusicSource() === 'saavn') {
			var q = getSaavnQueue();
			var idx = getSaavnIndex();
			var s = q[idx];
			barTitle.textContent = (s && (s.name || s.title)) ? (s.name || s.title) : (q.length ? 'JioSaavn' : 'Search JioSaavn');
			return;
		}
		var cur = getCurrent();
		var q = getQueue();
		var item = q.find(function (x) { return (x.id || x) === cur; });
		var t = (item && item.title) ? item.title : (cur ? 'Playing' : 'Paste YouTube URL or ID');
		barTitle.textContent = t;
	}
	function setSourceUI(src) {
		var isSaavn = src === 'saavn';
		if (barInput) barInput.placeholder = isSaavn ? 'Search JioSaavn…' : 'Paste YouTube URL or video ID';
		var panelInput = document.getElementById('global-yt-panel-input');
		if (panelInput) panelInput.placeholder = isSaavn ? 'Search JioSaavn…' : 'Paste YouTube URL or type search…';
		var pipedLabel = document.querySelector('.global-yt-panel-piped-label');
		if (pipedLabel) pipedLabel.style.display = isSaavn ? 'none' : '';
		var focusBtn = document.getElementById('global-music-focus');
		if (focusBtn) focusBtn.style.display = isSaavn ? 'none' : '';
		var panelIframe = document.getElementById('global-yt-panel-iframe');
		var saavnResults = document.getElementById('global-saavn-results');
		if (panelIframe && saavnResults) {
			panelIframe.style.display = isSaavn ? 'none' : 'block';
			saavnResults.style.display = isSaavn ? 'block' : 'none';
		}
		updateBarTitle();
	}
	function switchSource(src) {
		setMusicSource(src);
		var btnYt = document.getElementById('global-music-source-yt');
		var btnSaavn = document.getElementById('global-music-source-saavn');
		if (btnYt) { btnYt.classList.toggle('active', src === 'yt'); btnYt.setAttribute('aria-pressed', src === 'yt'); }
		if (btnSaavn) { btnSaavn.classList.toggle('active', src === 'saavn'); btnSaavn.setAttribute('aria-pressed', src === 'saavn'); }
		setSourceUI(src);
	}

	if (bar) {
		loadSaavnState();
		switchSource(getMusicSource());

		document.getElementById('global-music-source-yt') && document.getElementById('global-music-source-yt').addEventListener('click', function () { switchSource('yt'); });
		document.getElementById('global-music-source-saavn') && document.getElementById('global-music-source-saavn').addEventListener('click', function () { switchSource('saavn'); });

		// Player div must exist before YT.Player() runs (API injects iframe into it)
		if (playerDiv && !document.getElementById('global-yt-player-iframe')) {
			var el = document.createElement('div');
			el.id = 'global-yt-player-iframe';
			playerDiv.appendChild(el);
		}
		initPlayer();

		if (barAdd && barInput) {
			barAdd.addEventListener('click', function () {
				if (getMusicSource() === 'saavn') {
					var q = barInput.value.trim();
					if (!q) return;
					barAdd.disabled = true;
					searchSaavn(q, function (list) {
						barAdd.disabled = false;
						setSaavnQueue(list);
						renderSaavnResults(list);
						if (list.length > 0) playSaavnAt(0);
					});
					return;
				}
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
				if (DEFAULT_QUEUE[0]) loadVideo(DEFAULT_QUEUE[0].id);
			});
		}
		barInput && barInput.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') barAdd && barAdd.click();
		});

		if (barPlay) barPlay.addEventListener('click', function () {
			if (getMusicSource() === 'saavn') {
				if (saavnAudio && saavnQueue.length > 0) saavnAudio.play().catch(function () {});
				else if (saavnQueue.length > 0) playSaavnAt(getSaavnIndex());
				return;
			}
			if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
				try { ytPlayer.playVideo(); } catch (e) {}
			} else {
				var cur = getCurrent();
				var q = getQueue();
				if (!cur && q.length > 0) loadVideo(q[0].id || q[0]);
				else if (playerDiv && !ytPlayer) initPlayer();
			}
		});
		if (barPause) barPause.addEventListener('click', function () {
			if (getMusicSource() === 'saavn') {
				if (saavnAudio) saavnAudio.pause();
				return;
			}
			if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
				try { ytPlayer.pauseVideo(); } catch (e) {}
			}
		});
		if (barNext) barNext.addEventListener('click', function () {
			if (getMusicSource() === 'saavn') {
				playNextSaavn();
				return;
			}
			playNext();
		});

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

	var PIPED_PANEL_KEY = 'standalone_yt_panel_piped';
	function getPiped() {
		try { return localStorage.getItem(PIPED_PANEL_KEY) === '1'; } catch (e) { return false; }
	}
	function setPiped(on) {
		try { localStorage.setItem(PIPED_PANEL_KEY, on ? '1' : '0'); } catch (e) {}
	}

	function embedVideoUrl(id) {
		// When "Piped" is enabled, fall back to YouTube's privacy‑enhanced domain instead of third‑party instances
		if (getPiped()) return 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&modestbranding=1&rel=0';
		return 'https://www.youtube.com/embed/' + id + '?autoplay=1';
	}

	function openSearch(q) {
		var trimmed = (q || '').trim();
		// When source is Saavn, panel input is for JioSaavn search
		if (getMusicSource() === 'saavn') {
			if (!trimmed) return;
			searchSaavn(trimmed, function (list) {
				setSaavnQueue(list);
				renderSaavnResults(list);
				if (list.length > 0) playSaavnAt(0);
			});
			if (panel) {
				panel.classList.add('global-yt-panel-open');
				setPanelOpen(true);
			}
			return;
		}
		if (!panelFrame) return;
		if (!trimmed) {
			if (!panelFrame.src && DEFAULT_EMBED_ID) {
				panelFrame.src = embedVideoUrl(DEFAULT_EMBED_ID);
			}
			return;
		}
		var id = parseVideoId(trimmed);
		if (id) {
			panelFrame.src = embedVideoUrl(id);
			return;
		}
		try {
			window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(trimmed), '_blank', 'noopener');
		} catch (e) {}
		if (!panelFrame.src && DEFAULT_EMBED_ID) {
			panelFrame.src = embedVideoUrl(DEFAULT_EMBED_ID);
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
				if (open && getMusicSource() !== 'saavn' && !panelFrame.src && DEFAULT_EMBED_ID) {
					panelFrame.src = embedVideoUrl(DEFAULT_EMBED_ID);
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
		// Piped toggle in panel header (optional)
		var pipedToggle = document.getElementById('global-yt-panel-piped');
		if (pipedToggle) {
			pipedToggle.checked = getPiped();
			pipedToggle.addEventListener('change', function () {
				setPiped(pipedToggle.checked);
				if (panelFrame.src && getMusicSource() !== 'saavn') {
					var m = panelFrame.src.match(/(?:embed\/|v=)([a-zA-Z0-9_-]{11})/);
					if (m) panelFrame.src = embedVideoUrl(m[1]);
				}
			});
		}
	}
})();

/**
 * Global widgets: music bar (YouTube play/pause/next, queue in localStorage) and right-side YouTube panel (searchable Shorts/feed).
 * Included on every page. Data stored in browser only (localStorage).
 */
(function () {
	'use strict';

	// Prevent double-init if script is included + lazy-loaded
	if (typeof window !== 'undefined' && window.__standaloneGlobalWidgetsLoaded) return;
	if (typeof window !== 'undefined') window.__standaloneGlobalWidgetsLoaded = true;

	var QUEUE_KEY = 'standalone_music_queue';
	var CURRENT_KEY = 'standalone_music_current';
	var PANEL_OPEN_KEY = 'standalone_yt_panel_open';
	var MUSIC_SOURCE_KEY = 'standalone_music_source'; // 'yt' | 'saavn' | 'radio' | 'spotify'
	var SAAVN_QUEUE_KEY = 'standalone_saavn_queue';
	var SAAVN_INDEX_KEY = 'standalone_saavn_index';
	var YT_API_LOADED = false;
	var ytApiPendingCb = null;
	var ytPlayer = null;
	var ytFallbackIframe = null; // when YT IFrame API fails or is blocked
	var playerReady = false;
	var JIOSAAVN_API_BASE = (typeof window !== 'undefined' && window.JIOSAAVN_API_BASE)
		? String(window.JIOSAAVN_API_BASE).replace(/\/$/, '')
		: 'https://saavn.sumit.co';
	var saavnAudio = null;
	var saavnQueue = [];
	var saavnCurrentIndex = 0;
	var radioAudio = null;
	var radioIndex = 0;
	// Open-source / free streams that work without API keys
	var RADIO_STREAMS = [
		{ name: 'Radio Paradise (main)', url: 'https://stream.radioparadise.com/mp3-128', type: 'stream' },
		{ name: 'SomaFM Groove Salad', url: 'https://ice2.somafm.com/groovesalad-128-mp3', type: 'stream' },
		{ name: 'SomaFM Space Station', url: 'https://ice2.somafm.com/spacestation-128-mp3', type: 'stream' },
		{ name: 'SomaFM DEF CON', url: 'https://ice2.somafm.com/defcon-128-mp3', type: 'stream' },
		{ name: 'SomaFM Drone Zone', url: 'https://ice2.somafm.com/dronezone-128-mp3', type: 'stream' },
		{ name: 'SomaFM Deep Space One', url: 'https://ice2.somafm.com/deepspaceone-128-mp3', type: 'stream' },
		{ name: 'Chillhop', url: 'https://stream.chillhop.com/stream', type: 'stream' },
		{ name: 'KEXP (Seattle)', url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3', type: 'stream' }
	];

	// Spotify state
	var SPOTIFY_STATE_KEY = 'standalone_spotify_state';
	function getSpotifyState() {
		try { var s = localStorage.getItem(SPOTIFY_STATE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
	}
	function setSpotifyState(kind, id) {
		try { localStorage.setItem(SPOTIFY_STATE_KEY, JSON.stringify({ kind: kind, id: id })); } catch (e) {}
	}

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

	// Valid YouTube video ID: exactly 11 chars [a-zA-Z0-9_-]. Check before embed to avoid broken iframes.
	function isValidYouTubeVideoId(id) {
		return typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id.trim());
	}
	function parseVideoId(input) {
		if (!input || !input.trim()) return '';
		var s = input.trim();
		var m = s.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
		var id = m ? m[1] : (s.length === 11 ? s : '');
		return isValidYouTubeVideoId(id) ? id : '';
	}

	function loadSaavnState() {
		saavnQueue = getSaavnQueue();
		saavnCurrentIndex = getSaavnIndex();
	}

	// Detect URL type: returns { type, id/url } for auto-routing
	function detectUrlType(input) {
		if (!input || !input.trim()) return null;
		var s = input.trim();
		// Spotify: track, album, playlist, episode, show
		var sp = s.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
		if (sp) return { type: 'spotify', kind: sp[1], id: sp[2], url: s };
		if (/spotify:/.test(s)) {
			var parts = s.split(':');
			if (parts.length >= 3) return { type: 'spotify', kind: parts[1], id: parts[2], url: s };
		}
		// YouTube playlist
		var plm = s.match(/[?&]list=([a-zA-Z0-9_-]+)/);
		if (plm) return { type: 'yt_playlist', id: plm[1], url: s };
		// YouTube video
		var vid = parseVideoId(s);
		if (vid) return { type: 'yt', id: vid, url: s };
		return null;
	}

	// Spotify embed URL generator
	function spotifyEmbedUrl(kind, id) {
		return 'https://open.spotify.com/embed/' + kind + '/' + id + '?utm_source=generator&theme=0';
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
		// Fallback: open official JioSaavn search in a new tab instead of relying on a fragile unofficial API.
		try {
			var url = 'https://www.jiosaavn.com/search/' + encodeURIComponent(query.trim());
			window.open(url, '_blank', 'noopener');
		} catch (e) {}
		if (cb) cb([]);
	}
	function renderSaavnResults(list) {
		var el = document.getElementById('global-saavn-list');
		var wrap = document.getElementById('global-saavn-results');
		if (!el || !wrap) return;
		wrap.style.display = 'block';
		// With the external JioSaavn search fallback, just show a hint instead of interactive results.
		el.innerHTML = '<li class="global-saavn-item global-saavn-empty">Opened JioSaavn search in a new tab. Use their player for playback.</li>';
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
		// Fallback: if API never loads (blocked, slow), use iframe embed so at least Video panel works
		setTimeout(function () {
			if (YT_API_LOADED || ytPlayer) return;
			if (playerDiv && !document.getElementById('global-yt-fallback-iframe')) {
				var fallback = document.createElement('iframe');
				fallback.id = 'global-yt-fallback-iframe';
				fallback.setAttribute('style', 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;');
				fallback.title = 'YouTube fallback';
				playerDiv.appendChild(fallback);
				ytFallbackIframe = fallback;
			}
			if (cb) cb();
		}, 5000);
	}

	function initPlayer() {
		if (!playerDiv || ytPlayer) return;
		var container = document.getElementById('global-yt-player-iframe');
		if (!container) return;
		loadYtApi(function () {
			if (ytFallbackIframe) return; // API didn't load; fallback will be used in loadVideo
			try {
				if (!window.YT || !window.YT.Player) return;
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
				if (playerDiv && !ytFallbackIframe) {
					var fallback = document.createElement('iframe');
					fallback.id = 'global-yt-fallback-iframe';
					fallback.setAttribute('style', 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;');
					fallback.title = 'YouTube fallback';
					playerDiv.appendChild(fallback);
					ytFallbackIframe = fallback;
				}
			}
		});
	}

	function loadVideo(id) {
		setCurrent(id);
		if (ytFallbackIframe && id) {
			ytFallbackIframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&modestbranding=1';
			updateBarTitle();
			return;
		}
		if (ytPlayer && ytPlayer.loadVideoById) {
			ytPlayer.loadVideoById(id || '');
		} else if (playerDiv) {
			initPlayer();
			setTimeout(function () {
				if (ytFallbackIframe && id) {
					ytFallbackIframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&modestbranding=1';
				} else if (ytPlayer && ytPlayer.loadVideoById) {
					ytPlayer.loadVideoById(id || '');
				}
			}, 600);
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
		var src = getMusicSource();
		if (src === 'radio') {
			var s = RADIO_STREAMS[radioIndex];
			barTitle.textContent = (s && s.name) ? s.name : 'Radio';
			return;
		}
		if (src === 'saavn') {
			var q = getSaavnQueue();
			var idx = getSaavnIndex();
			var s = q[idx];
			barTitle.textContent = (s && (s.name || s.title)) ? (s.name || s.title) : (q.length ? 'JioSaavn' : 'Search JioSaavn');
			return;
		}
		if (src === 'spotify') {
			var sp = getSpotifyState();
			barTitle.textContent = sp ? 'Spotify ' + sp.kind : 'Paste a Spotify URL';
			return;
		}
		var cur = getCurrent();
		var q = getQueue();
		var item = q.find(function (x) { return (x.id || x) === cur; });
		var t = (item && item.title) ? item.title : (cur ? 'Playing' : 'Paste YouTube / Spotify URL');
		barTitle.textContent = t;
	}

	// --- Radio (open-source streams: no API key) ---
	function playRadio(idx) {
		if (idx < 0 || idx >= RADIO_STREAMS.length) return;
		radioIndex = idx;
		var s = RADIO_STREAMS[radioIndex];
		if (!s || !s.url) return;
		if (!radioAudio) {
			radioAudio = new Audio();
		}
		radioAudio.src = s.url;
		radioAudio.play().catch(function () {});
		updateBarTitle();
	}
	function pauseRadio() {
		if (radioAudio) radioAudio.pause();
	}
	function nextRadio() {
		radioIndex = (radioIndex + 1) % RADIO_STREAMS.length;
		playRadio(radioIndex);
	}

	function setSourceUI(src) {
		var isSaavn = src === 'saavn';
		var isRadio = src === 'radio';
		var isSpotify = src === 'spotify';
		var placeholders = {
			yt: 'Paste YouTube / Spotify URL or video ID',
			saavn: 'Search JioSaavn…',
			spotify: 'Paste Spotify URL (track, album, playlist)…',
			radio: 'Click Play or Next for stations'
		};
		if (barInput) {
			barInput.placeholder = placeholders[src] || placeholders.yt;
			barInput.style.display = isRadio ? 'none' : '';
		}
		var panelInput = document.getElementById('global-yt-panel-input');
		if (panelInput) panelInput.placeholder = isSaavn ? 'Search JioSaavn…' : (isSpotify ? 'Paste Spotify URL…' : 'Paste YouTube / Spotify URL or search…');
		var pipedLabel = document.querySelector('.global-yt-panel-piped-label');
		if (pipedLabel) pipedLabel.style.display = (src === 'yt') ? '' : 'none';
		var focusBtn = document.getElementById('global-music-focus');
		if (focusBtn) focusBtn.style.display = (src === 'yt') ? '' : 'none';
		var panelIframe = document.getElementById('global-yt-panel-iframe');
		var saavnResults = document.getElementById('global-saavn-results');
		var spotifyEmbed = document.getElementById('global-spotify-embed');
		if (panelIframe) panelIframe.style.display = (src === 'yt') ? 'block' : 'none';
		if (saavnResults) saavnResults.style.display = isSaavn ? 'block' : 'none';
		if (spotifyEmbed) spotifyEmbed.style.display = isSpotify ? 'block' : 'none';
		var addBtn = document.getElementById('global-music-add');
		if (addBtn) {
			addBtn.style.display = isRadio ? 'none' : '';
			addBtn.textContent = isSaavn ? 'Search' : (isSpotify ? 'Load' : 'Add');
		}
		updateBarTitle();
	}
	function switchSource(src) {
		setMusicSource(src);
		var sources = ['yt', 'saavn', 'radio', 'spotify'];
		sources.forEach(function (s) {
			var btn = document.getElementById('global-music-source-' + s);
			if (btn) { btn.classList.toggle('active', s === src); btn.setAttribute('aria-pressed', s === src); }
		});
		setSourceUI(src);
	}

	function loadSpotifyEmbed(kind, id) {
		var embed = document.getElementById('global-spotify-embed');
		if (!embed) return;
		setSpotifyState(kind, id);
		embed.innerHTML = '<iframe src="' + spotifyEmbedUrl(kind, id) + '" width="100%" height="' + (kind === 'track' ? 80 : 380) + '" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Spotify player"></iframe>';
		embed.style.display = 'block';
		updateBarTitle();
	}

	function handleUniversalInput(raw) {
		if (!raw || !raw.trim()) return false;
		raw = raw.trim();
		var detected = detectUrlType(raw);
		if (!detected) return false;
		if (detected.type === 'spotify') {
			switchSource('spotify');
			loadSpotifyEmbed(detected.kind, detected.id);
			if (panel) { panel.classList.add('global-yt-panel-open'); setPanelOpen(true); }
			return true;
		}
		if (detected.type === 'yt_playlist') {
			switchSource('yt');
			var panelFrame = document.getElementById('global-yt-panel-iframe');
			if (panelFrame) {
				panelFrame.src = 'https://www.youtube-nocookie.com/embed/videoseries?list=' + detected.id + '&autoplay=1';
			}
			if (panel) { panel.classList.add('global-yt-panel-open'); setPanelOpen(true); }
			return true;
		}
		if (detected.type === 'yt') {
			if (getMusicSource() !== 'yt') switchSource('yt');
			var q = getQueue();
			q.push({ id: detected.id, title: '' });
			setQueue(q);
			loadVideo(detected.id);
			return true;
		}
		return false;
	}

	if (bar) {
		loadSaavnState();
		switchSource(getMusicSource());

		['yt', 'saavn', 'radio', 'spotify'].forEach(function (s) {
			var btn = document.getElementById('global-music-source-' + s);
			if (btn) btn.addEventListener('click', function () { switchSource(s); });
		});

		if (playerDiv && !document.getElementById('global-yt-player-iframe')) {
			var el = document.createElement('div');
			el.id = 'global-yt-player-iframe';
			playerDiv.appendChild(el);
		}
		initPlayer();

		if (barAdd && barInput) {
			barAdd.addEventListener('click', function () {
				var raw = barInput.value.trim();
				if (!raw) return;

				// Universal URL detection first (auto-switches source)
				if (handleUniversalInput(raw)) {
					barInput.value = '';
					return;
				}

				if (getMusicSource() === 'saavn') {
					barAdd.disabled = true;
					searchSaavn(raw, function (list) {
						barAdd.disabled = false;
						setSaavnQueue(list);
						renderSaavnResults(list);
						if (list.length > 0) playSaavnAt(0);
					});
					return;
				}
				if (getMusicSource() === 'spotify') {
					if (barTitle) barTitle.textContent = 'Paste a Spotify URL (track, album, or playlist)';
					setTimeout(function () { updateBarTitle(); }, 3000);
					return;
				}
				var id = parseVideoId(raw);
				if (id) {
					var q = getQueue();
					q.push({ id: id, title: '' });
					setQueue(q);
					barInput.value = '';
					loadVideo(id);
				} else if (/youtube|youtu\.be/i.test(raw)) {
					if (barTitle) barTitle.textContent = 'Invalid YouTube URL — check the link and try again';
					setTimeout(function () { updateBarTitle(); }, 3000);
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
			var src = getMusicSource();
			if (src === 'radio') { playRadio(radioIndex); return; }
			if (src === 'saavn') {
				if (saavnAudio && saavnQueue.length > 0) saavnAudio.play().catch(function () {});
				else if (saavnQueue.length > 0) playSaavnAt(getSaavnIndex());
				return;
			}
			if (src === 'spotify') return; // Spotify embed handles its own playback
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
			var src = getMusicSource();
			if (src === 'radio') { pauseRadio(); return; }
			if (src === 'saavn') { if (saavnAudio) saavnAudio.pause(); return; }
			if (src === 'spotify') return;
			if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
				try { ytPlayer.pauseVideo(); } catch (e) {}
			}
		});
		if (barNext) barNext.addEventListener('click', function () {
			var src = getMusicSource();
			if (src === 'radio') { nextRadio(); return; }
			if (src === 'saavn') { playNextSaavn(); return; }
			if (src === 'spotify') return;
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

	var PIPED_INSTANCES = [
		'https://piped.video',
		'https://piped.kavin.rocks',
		'https://piped.mint.lgbt'
	];
	var currentPipedIdx = 0;

	function embedVideoUrl(id) {
		if (getPiped()) {
			var base = PIPED_INSTANCES[currentPipedIdx % PIPED_INSTANCES.length];
			return base + '/embed/' + id + '?autoplay=1';
		}
		return 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&modestbranding=1&rel=0';
	}

	function openSearch(q) {
		var trimmed = (q || '').trim();
		if (!trimmed) {
			if (panelFrame && !panelFrame.src && DEFAULT_EMBED_ID && isValidYouTubeVideoId(DEFAULT_EMBED_ID)) {
				panelFrame.src = embedVideoUrl(DEFAULT_EMBED_ID);
			}
			return;
		}

		// Universal URL detection (auto-switch source from panel too)
		if (handleUniversalInput(trimmed)) {
			if (panelInput) panelInput.value = '';
			return;
		}

		// Source-specific handling
		var src = getMusicSource();
		if (src === 'saavn') {
			searchSaavn(trimmed, function (list) {
				setSaavnQueue(list);
				renderSaavnResults(list);
				if (list.length > 0) playSaavnAt(0);
			});
			if (panel) { panel.classList.add('global-yt-panel-open'); setPanelOpen(true); }
			return;
		}
		if (src === 'spotify') {
			if (barTitle) barTitle.textContent = 'Paste a full Spotify URL (open.spotify.com/...)';
			setTimeout(function () { updateBarTitle(); }, 3000);
			return;
		}
		if (!panelFrame) return;
		var id = parseVideoId(trimmed);
		if (id) {
			panelFrame.src = embedVideoUrl(id);
			return;
		}
		if (/youtube|youtu\.be/i.test(trimmed)) {
			panelFrame.removeAttribute('src');
			var oldPlaceholder = panelInput ? panelInput.placeholder : '';
			if (panelInput) {
				panelInput.placeholder = 'Invalid YouTube URL — check the link or try a video ID';
				panelInput.value = '';
				setTimeout(function () { panelInput.placeholder = oldPlaceholder; }, 4000);
			}
			return;
		}
		try {
			window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(trimmed), '_blank', 'noopener');
		} catch (e) {}
		if (panelFrame && !panelFrame.src && DEFAULT_EMBED_ID && isValidYouTubeVideoId(DEFAULT_EMBED_ID)) {
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
		var pipedToggle = document.getElementById('global-yt-panel-piped');
		if (pipedToggle) {
			pipedToggle.checked = getPiped();
			pipedToggle.addEventListener('change', function () {
				setPiped(pipedToggle.checked);
				if (panelFrame && panelFrame.src && getMusicSource() === 'yt') {
					var m = panelFrame.src.match(/(?:embed\/|v=)([a-zA-Z0-9_-]{11})/);
					if (m) panelFrame.src = embedVideoUrl(m[1]);
				}
			});
		}

		// Piped iframe error: auto-try next instance
		if (panelFrame) {
			panelFrame.addEventListener('error', function () {
				if (getPiped() && panelFrame.src && panelFrame.src.indexOf('piped') !== -1) {
					currentPipedIdx++;
					var m = panelFrame.src.match(/embed\/([a-zA-Z0-9_-]{11})/);
					if (m && currentPipedIdx < PIPED_INSTANCES.length) {
						panelFrame.src = embedVideoUrl(m[1]);
					}
				}
			});
		}

		// Restore Spotify state on page load
		if (getMusicSource() === 'spotify') {
			var sp = getSpotifyState();
			if (sp && sp.kind && sp.id) loadSpotifyEmbed(sp.kind, sp.id);
		}
	}
})();

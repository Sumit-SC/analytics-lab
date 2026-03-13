(function () {
	// Lazy load + cache: no auto-fetch on page load; load on tap or when section scrolls into view.
	// Reduces pressure on third-party APIs. Cache TTL 5 min (sessionStorage).
	var TRENDS_CACHE_PREFIX = 'trends_cache_';
	var TRENDS_CACHE_TTL_MS = 5 * 60 * 1000;
	var LIVE_MODE_KEY = 'trends_live_mode';
	var NEWS_REGION_KEY = 'trends_news_region';
	window.__trendsLoaders = window.__trendsLoaders || {};
	window.__trendsLoaded = window.__trendsLoaded || {};

	window.__trendsApplyCache = function (sectionId, listEl, statusEl, optExtra) {
		try {
			var raw = sessionStorage.getItem(TRENDS_CACHE_PREFIX + sectionId);
			if (!raw) return false;
			var data = JSON.parse(raw);
			if (!data || (data.ts && (Date.now() - data.ts > TRENDS_CACHE_TTL_MS))) return false;
			if (listEl && data.html != null) listEl.innerHTML = data.html;
			if (statusEl && data.status != null) statusEl.textContent = data.status;
			if (optExtra && data.extra) {
				if (optExtra.listEl2 && data.extra.html2 != null) optExtra.listEl2.innerHTML = data.extra.html2;
				if (optExtra.statusEl2 && data.extra.status2 != null) optExtra.statusEl2.textContent = data.extra.status2;
			}
			return true;
		} catch (e) { return false; }
	};

	window.__trendsWriteCache = function (sectionId, html, status, optExtra) {
		try {
			var payload = { html: html, status: status, ts: Date.now() };
			if (optExtra) payload.extra = optExtra;
			sessionStorage.setItem(TRENDS_CACHE_PREFIX + sectionId, JSON.stringify(payload));
		} catch (e) {}
	};

	window.runTrendsLoader = function (sectionId, forceRefresh) {
		var load = window.__trendsLoaders[sectionId];
		if (typeof load !== 'function') return;
		load(!!forceRefresh);
	};

	function getLiveMode() {
		try { return localStorage.getItem(LIVE_MODE_KEY) === '1'; } catch (e) { return false; }
	}
	function setLiveMode(on) {
		try { localStorage.setItem(LIVE_MODE_KEY, on ? '1' : '0'); } catch (e) {}
	}

	function getNewsRegion() {
		try {
			var v = localStorage.getItem(NEWS_REGION_KEY) || 'US';
			return (v === 'IN') ? 'IN' : 'US';
		} catch (e) {
			return 'US';
		}
	}
	function setNewsRegion(v) {
		var val = (v === 'IN') ? 'IN' : 'US';
		try { localStorage.setItem(NEWS_REGION_KEY, val); } catch (e) {}
	}

	// Auto-refresh "live" sections every few minutes when enabled
	(function setupLiveMode() {
		var toggle = document.getElementById('trends-live-mode-toggle');
		var liveSections = ['live-breaking', 'alerts', 'google-news', 'inshorts', 'wiki', 'hn'];
		var intervalMs = 3 * 60 * 1000;

		function tick() {
			if (!getLiveMode()) return;
			if (typeof document !== 'undefined' && typeof document.hidden === 'boolean' && document.hidden) return;
			liveSections.forEach(function (id) {
				if (window.__trendsLoaders[id]) {
					window.runTrendsLoader(id, true);
				}
			});
		}

		if (toggle) {
			toggle.checked = getLiveMode();
			toggle.addEventListener('change', function () {
				setLiveMode(toggle.checked);
				if (toggle.checked) {
					// Kick off an immediate refresh for live sections
					liveSections.forEach(function (id) {
						if (window.__trendsLoaders[id]) window.runTrendsLoader(id, true);
					});
				}
			});
		}

		// Background interval for live mode
		setInterval(tick, intervalMs);
	})();

	// Shared RSS helper (prefer our Vercel proxy vs rss2json public)
	window.__trendsRssProxyBase = (typeof window !== 'undefined' && window.TRENDS_RSS_PROXY_URL)
		? String(window.TRENDS_RSS_PROXY_URL).replace(/\/$/, '')
		: 'https://playground-serveless.vercel.app/api/rss';
	window.__trendsFetchRss = function (feedUrl, count) {
		var u = window.__trendsRssProxyBase + '?url=' + encodeURIComponent(feedUrl) + '&count=' + encodeURIComponent(String(count || 10));
		return fetch(u).then(function (r) { return r.ok ? r.json() : null; });
	};

	function injectLoadButtons() {
		document.querySelectorAll('.trends-section[data-trend-section-id]').forEach(function (section) {
			var id = section.getAttribute('data-trend-section-id');
			if (!window.__trendsLoaders[id]) return;
			var header = section.querySelector('.flex.items-center.justify-between.mb-2') || section.querySelector('div.mb-2') || section.firstElementChild;
			if (!header || header.querySelector('.trends-load-btn')) return;
			var wrap = document.createElement('div');
			wrap.className = 'flex items-center gap-2 mt-1';
			wrap.innerHTML = '<button type="button" class="trends-load-btn px-2 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" data-section="' + id + '">Load</button><button type="button" class="trends-refresh-btn px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" data-section="' + id + '" title="Refresh">↻</button>';
			header.appendChild(wrap);
		});
		document.querySelectorAll('.trends-load-btn').forEach(function (btn) {
			btn.addEventListener('click', function () { window.runTrendsLoader(btn.getAttribute('data-section'), false); });
		});
		document.querySelectorAll('.trends-refresh-btn').forEach(function (btn) {
			btn.addEventListener('click', function () { window.runTrendsLoader(btn.getAttribute('data-section'), true); });
		});
	}

	function observeSections() {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				var section = entry.target;
				var id = section.getAttribute('data-trend-section-id');
				if (!id || window.__trendsLoaded[id] || !window.__trendsLoaders[id]) return;
				window.__trendsLoaded[id] = true;
				window.runTrendsLoader(id, false);
			});
		}, { rootMargin: '100px', threshold: 0.1 });
		document.querySelectorAll('.trends-section[data-trend-section-id]').forEach(function (el) {
			if (window.__trendsLoaders[el.getAttribute('data-trend-section-id')]) io.observe(el);
		});
	}

	// Run after DOM and all loader registrations
	setTimeout(function () {
		injectLoadButtons();
		observeSections();

		// Region selector wiring
		var regionSelect = document.getElementById('trends-region-select');
		if (regionSelect) {
			regionSelect.value = getNewsRegion();
			regionSelect.addEventListener('change', function () {
				setNewsRegion(regionSelect.value);
				try {
					// Clear cached news-related sections so next load uses the new region
					['google-news', 'inshorts', 'live-breaking'].forEach(function (id) {
						sessionStorage.removeItem(TRENDS_CACHE_PREFIX + id);
					});
				} catch (e) {}
				// Force refresh visible news sections immediately
				['google-news', 'inshorts', 'live-breaking'].forEach(function (id) {
					if (window.__trendsLoaders[id]) window.runTrendsLoader(id, true);
				});
			});
		}
	}, 0);
})();

(function () {
	// Section visibility toggles (customize) — stored per section id
	var SECTION_VIS_KEY = 'trends_section_vis';
	var PIRACY_KEY = 'trends_show_piracy';

	function getSectionVis() {
		try {
			var raw = localStorage.getItem(SECTION_VIS_KEY);
			return raw ? JSON.parse(raw) : {};
		} catch (e) { return {}; }
	}
	function setSectionVis(id, visible) {
		var o = getSectionVis();
		o[id] = visible;
		try { localStorage.setItem(SECTION_VIS_KEY, JSON.stringify(o)); } catch (e) {}
	}
	function getPiracy() {
		try { return localStorage.getItem(PIRACY_KEY) === '1'; } catch (e) { return false; }
	}
	function setPiracy(on) {
		try { localStorage.setItem(PIRACY_KEY, on ? '1' : '0'); } catch (e) {}
	}

	function getActiveFilter() {
		var bar = document.getElementById('trends-filter-bar');
		if (!bar) return 'all';
		var active = bar.querySelector('.trends-filter-btn.active');
		return active ? (active.getAttribute('data-trend-filter') || 'all') : 'all';
	}

	function applySectionVisibility() {
		var vis = getSectionVis();
		document.querySelectorAll('.trends-section[data-trend-section-id]').forEach(function (section) {
			var id = section.getAttribute('data-trend-section-id');
			var on = vis[id] !== false;
			section.classList.toggle('trends-section-hidden', !on);
		});
		var piracyWrap = document.getElementById('trends-piracy-wrap');
		if (piracyWrap) {
			piracyWrap.classList.toggle('hidden', !getPiracy());
		}
		var filter = getActiveFilter();
		var isAll = filter === 'all';
		document.querySelectorAll('.trends-section').forEach(function (section) {
			var cat = section.getAttribute('data-trend-category');
			var show = (isAll || cat === filter) && !section.classList.contains('trends-section-hidden');
			if (section.id === 'trends-piracy-wrap') show = show && getPiracy();
			section.classList.toggle('hidden', !show);
		});
	}

	// Piracy toggle
	var piracyCheck = document.getElementById('trends-piracy-toggle');
	if (piracyCheck) {
		piracyCheck.checked = getPiracy();
		applySectionVisibility();
		piracyCheck.addEventListener('change', function () {
			setPiracy(piracyCheck.checked);
			applySectionVisibility();
		});
	} else {
		applySectionVisibility();
	}

	// Customize panel: build toggles from sections
	var panel = document.getElementById('trends-customize-panel');
	var togglesWrap = document.getElementById('trends-section-toggles');
	var customizeBtn = document.getElementById('trends-customize-btn');
	var sectionLabels = {
		'live-breaking': 'Live & Breaking',
		alerts: 'Alerts',
		hn: 'Hacker News',
		'google-news': 'Google News',
		inshorts: 'AI & Data headlines',
		wiki: 'Wikipedia',
		medium: 'Towards Data Science',
		visualcapitalist: 'Visual Capitalist',
		devto: 'Dev.to',
		'reddit-ds': 'Reddit r/datascience',
		'reddit-ml': 'Reddit r/MachineLearning',
		github: 'GitHub trending',
		torrentfreak: 'TorrentFreak',
		xda: 'XDA Developers',
		social: 'Social & alternatives',
		drama: 'Drama & Asian media',
		visual: 'Visual strip',
		'tv-schedule': 'TV & episode schedule',
		'actor-search': 'Actor search',
		anime: 'Anime & hubs',
		piracy: 'Piracy index'
	};

	if (togglesWrap) {
		Object.keys(sectionLabels).forEach(function (id) {
			var label = document.createElement('label');
			label.className = 'flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer';
			var vis = getSectionVis();
			var checked = vis[id] !== false;
			label.innerHTML = '<input type="checkbox" class="trends-section-toggle rounded border-gray-400 text-primary focus:ring-primary" data-section-id="' + id + '" ' + (checked ? 'checked' : '') + '> ' + sectionLabels[id];
			togglesWrap.appendChild(label);
		});
		togglesWrap.addEventListener('change', function (e) {
			var input = e.target.closest('.trends-section-toggle');
			if (!input) return;
			var id = input.getAttribute('data-section-id');
			setSectionVis(id, input.checked);
			applySectionVisibility();
		});
	}
	if (customizeBtn && panel) {
		customizeBtn.addEventListener('click', function () {
			var open = !panel.classList.contains('hidden');
			panel.classList.toggle('hidden', open);
			panel.setAttribute('aria-hidden', open ? 'true' : 'false');
			customizeBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
		});
	}
})();

(function () {
	// Category filter: All | Tech | News | Entertainment | Anime — show only matching sections
	var FILTER_KEY = 'trends_filter';
	var filterBar = document.getElementById('trends-filter-bar');
	var sections = document.querySelectorAll('.trends-section');

	function getFilter() {
		try { return localStorage.getItem(FILTER_KEY) || 'all'; } catch (e) { return 'all'; }
	}
	function setFilter(value) {
		try { localStorage.setItem(FILTER_KEY, value); } catch (e) {}
	}

	function applyFilter(filter) {
		var piracyOn = false;
		try { piracyOn = localStorage.getItem('trends_show_piracy') === '1'; } catch (e) {}
		var isAll = filter === 'all';
		sections.forEach(function (section) {
			var cat = section.getAttribute('data-trend-category');
			var show = (isAll || cat === filter) && !section.classList.contains('trends-section-hidden');
			if (section.id === 'trends-piracy-wrap') show = show && piracyOn;
			section.classList.toggle('hidden', !show);
		});
		if (filterBar) {
			filterBar.querySelectorAll('.trends-filter-btn').forEach(function (btn) {
				var isActive = btn.getAttribute('data-trend-filter') === filter;
				btn.classList.toggle('active', isActive);
				btn.classList.toggle('border-primary', isActive);
				btn.classList.toggle('bg-primary/10', isActive);
				btn.classList.toggle('text-primary', isActive);
				if (!isActive) {
					btn.classList.add('border-gray-300', 'dark:border-gray-600', 'text-gray-700', 'dark:text-gray-300');
					btn.classList.remove('border-primary', 'bg-primary/10', 'text-primary');
				}
				btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
			});
		}
	}

	var current = getFilter();
	applyFilter(current);

	if (filterBar) {
		filterBar.addEventListener('click', function (e) {
			var btn = e.target.closest('.trends-filter-btn');
			if (!btn) return;
			var filter = btn.getAttribute('data-trend-filter');
			if (filter) {
				setFilter(filter);
				applyFilter(filter);
			}
		});
	}
})();

(function () {
	// Visual Capitalist RSS (via our proxy) — load on tap or when section visible
	var listEl = document.getElementById('trends-visualcapitalist-list');
	var statusEl = document.getElementById('trends-visualcapitalist-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) { statusEl.textContent = text; }
	setStatus('Tap Load or scroll here to fetch.');

	function load(forceRefresh) {
		if (!forceRefresh && window.__trendsApplyCache('visualcapitalist', listEl, statusEl)) return;
		setStatus('Loading…');
		window.__trendsFetchRss('https://www.visualcapitalist.com/feed/', 12)
			.then(function (data) {
				var items = data && data.items ? data.items : null;
				if (!items || !items.length) { setStatus('No posts right now.'); return; }
				items = items.slice(0, 10);
				setStatus('Showing ' + items.length + ' posts.');
				var html = '';
				items.forEach(function (item) {
					var title = (item.title || '').trim() || 'Untitled';
					var url = item.link || '#';
					var pub = item.pubDate ? new Date(item.pubDate).toLocaleDateString() : '';
					html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">';
					html += '<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a>';
					if (pub) html += '<div class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">' + pub + '</div>';
					html += '</li>';
				});
				listEl.innerHTML = html;
				window.__trendsWriteCache('visualcapitalist', html, 'Showing ' + items.length + ' posts.');
			})
			.catch(function () {
				setStatus('Could not load Visual Capitalist feed. Open visualcapitalist.com instead.');
			});
	}
	window.__trendsLoaders.visualcapitalist = load;
})();

(function () {
	// Hacker News top stories (lightweight snapshot) — load on tap or when section visible
	var listEl = document.getElementById('trends-hn-list');
	var statusEl = document.getElementById('trends-hn-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Tap Load or scroll here to fetch.');

	function fetchTopStories(forceRefresh) {
		if (!forceRefresh && window.__trendsApplyCache('hn', listEl, statusEl)) return;
		setStatus('Loading…');
		fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
			.then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HN error')); })
			.then(function (ids) {
				if (!Array.isArray(ids) || ids.length === 0) {
					setStatus('No stories available right now.');
					return;
				}
				var top = ids.slice(0, 10);
				return Promise.all(top.map(function (id) {
					return fetch('https://hacker-news.firebaseio.com/v0/item/' + id + '.json')
						.then(function (r) { return r.ok ? r.json() : null; })
						.catch(function () { return null; });
				})).then(function (items) {
					var clean = items.filter(Boolean);
					if (!clean.length) {
						setStatus('Could not load story details.');
						return;
					}
					setStatus('Showing top ' + clean.length + ' stories.');
					var html = '';
					clean.forEach(function (item) {
						var title = item.title || 'Untitled';
						var url = item.url || ('https://news.ycombinator.com/item?id=' + item.id);
						var score = item.score || 0;
						var comments = typeof item.descendants === 'number' ? item.descendants : null;
						html += '<li class=\"border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0\">';
						html += '<a href=\"' + url + '\" target=\"_blank\" rel=\"noopener\" class=\"font-semibold text-primary hover:underline\">' + title.replace(/</g, '&lt;') + '</a>';
						html += '<div class=\"mt-0.5 text-[11px] text-gray-500 dark:text-gray-400\">';
						html += score + ' points';
						if (comments != null) html += ' &middot; ' + comments + ' comments';
						html += '</div>';
						html += '</li>';
					});
					listEl.innerHTML = html;
					window.__trendsWriteCache('hn', html, 'Showing top ' + clean.length + ' stories.');
				});
			})
			.catch(function () {
				setStatus('Could not reach Hacker News. Open it directly instead.');
			});
	}
	window.__trendsLoaders.hn = fetchTopStories;
})();

(function () {
	// AI/Data headlines (Google News search RSS) — replaces flaky Inshorts APIs
	var listEl = document.getElementById('trends-inshorts-list');
	var statusEl = document.getElementById('trends-inshorts-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Tap Load or scroll here to fetch.');

	function load(forceRefresh) {
		if (!forceRefresh && window.__trendsApplyCache('inshorts', listEl, statusEl)) return;
		setStatus('Loading…');
		var region = getNewsRegion();
		var base = 'https://news.google.com/rss/search?q=' + encodeURIComponent('artificial intelligence data analytics');
		var feedUrl = region === 'IN'
			? base + '&hl=en-IN&gl=IN&ceid=IN:en'
			: base + '&hl=en-US&gl=US&ceid=US:en';
		window.__trendsFetchRss(feedUrl, 12)
			.then(function (data) {
				var items = data && data.items ? data.items : null;
				if (!items || !items.length) {
					setStatus('No headlines right now.');
					return;
				}
				var take = items.slice(0, 10);
				setStatus('Showing ' + take.length + ' headlines.');
				var html = '';
				take.forEach(function (item) {
					var title = (item.title || '').trim() || 'Untitled';
					var url = item.link || '#';
					var pub = item.pubDate ? new Date(item.pubDate).toLocaleDateString() : '';
					html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">';
					html += '<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a>';
					if (pub) html += '<div class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">' + pub + '</div>';
					html += '</li>';
				});
				listEl.innerHTML = html;
				window.__trendsWriteCache('inshorts', html, 'Showing ' + take.length + ' headlines.');
			})
			.catch(function () {
				setStatus('Could not load AI/data headlines feed. Open Google News instead.');
			});
	}
	window.__trendsLoaders.inshorts = load;
})();

(function () {
	// Wikipedia top pageviews today — load on tap or when section visible
	var listEl = document.getElementById('trends-wiki-list');
	var statusEl = document.getElementById('trends-wiki-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Tap Load or scroll here to fetch.');

	function load(forceRefresh) {
		if (!forceRefresh && window.__trendsApplyCache('wiki', listEl, statusEl)) return;
		setStatus('Loading…');
		var now = new Date();
		var y = now.getUTCFullYear();
		var m = String(now.getUTCMonth() + 1).padStart(2, '0');
		var d = String(now.getUTCDate()).padStart(2, '0');
		var url = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/' + y + '/' + m + '/' + d;
		fetch(url)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.items || !data.items[0] || !Array.isArray(data.items[0].articles)) {
					setStatus('No pageview data available yet. Wikipedia may still be generating today\'s stats.');
					return;
				}
				var articles = data.items[0].articles
					.filter(function (a) { return a.article && a.article.indexOf('Main_Page') === -1 && a.article.indexOf('Special:') !== 0; })
					.slice(0, 10);
				if (!articles.length) {
					setStatus('No trending pages in this snapshot.');
					return;
				}
				setStatus('Top ' + articles.length + ' English pages today.');
				var html = '';
				articles.forEach(function (a) {
					var title = decodeURIComponent(a.article.replace(/_/g, ' '));
					var views = a.views || 0;
					var href = 'https://en.wikipedia.org/wiki/' + encodeURIComponent(a.article);
					html += '<li class=\"border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0\">';
					html += '<a href=\"' + href + '\" target=\"_blank\" rel=\"noopener\" class=\"font-semibold text-primary hover:underline\">' + title.replace(/</g, '&lt;') + '</a>';
					html += '<div class=\"mt-0.5 text-[11px] text-gray-500 dark:text-gray-400\">' + views.toLocaleString() + ' views</div>';
					html += '</li>';
				});
				listEl.innerHTML = html;
				window.__trendsWriteCache('wiki', html, 'Top ' + articles.length + ' English pages today.');
			})
			.catch(function () {
				setStatus('Could not reach Wikipedia metrics API. Try the main page instead.');
			});
	}
	window.__trendsLoaders.wiki = load;
})();

(function () {
	// Google News (RSS via our proxy) — load on tap or when section visible
	var listEl = document.getElementById('trends-google-news-list');
	var statusEl = document.getElementById('trends-google-news-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Tap Load or scroll here to fetch.');

	function load(forceRefresh) {
		if (!forceRefresh && window.__trendsApplyCache('google-news', listEl, statusEl)) return;
		setStatus('Loading…');
		var region = getNewsRegion();
		var feedUrl = region === 'IN'
			? 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en'
			: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
		window.__trendsFetchRss(feedUrl, 12)
			.then(function (data) {
				var items = data && data.items ? data.items : null;
				if (!items || !items.length) { setStatus('No headlines right now.'); return; }
				items = items.slice(0, 10);
				setStatus('Showing ' + items.length + ' headlines.');
				var html = '';
				items.forEach(function (item) {
					var title = (item.title || '').trim() || 'Untitled';
					var url = item.link || '#';
					var pub = item.pubDate ? new Date(item.pubDate).toLocaleDateString() : '';
					html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">';
					html += '<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a>';
					if (pub) html += '<div class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">' + pub + '</div>';
					html += '</li>';
				});
				listEl.innerHTML = html;
				window.__trendsWriteCache('google-news', html, 'Showing ' + items.length + ' headlines.');
			})
			.catch(function () {
				setStatus('Could not load Google News. Open news.google.com instead.');
			});
	}
	window.__trendsLoaders['google-news'] = load;
})();

(function () {
	// Live & Breaking: top headlines + finance (Google News RSS), "Updated at" timestamp
	var newsList = document.getElementById('trends-live-breaking-news');
	var financeList = document.getElementById('trends-live-breaking-finance');
	var statusEl = document.getElementById('trends-live-breaking-status');
	var updatedEl = document.getElementById('live-breaking-updated');
	if (!newsList || !financeList || !statusEl) return;

	function setStatus(t) { statusEl.textContent = t; }
	function setUpdated() {
		if (updatedEl) updatedEl.textContent = 'Updated at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
	setStatus('Tap Load or scroll here to fetch.');

	function load(forceRefresh) {
		var optExtra = { listEl2: financeList, statusEl2: null };
		if (!forceRefresh && window.__trendsApplyCache('live-breaking', newsList, statusEl, optExtra)) {
			if (updatedEl) updatedEl.textContent = 'Cached · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			return;
		}
		setStatus('Loading…');
		var region = getNewsRegion();
		var newsFeed = region === 'IN'
			? 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en'
			: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
		var baseFinance = 'https://news.google.com/rss/search?q=stock+market+finance+business';
		var financeFeed = region === 'IN'
			? baseFinance + '&hl=en-IN&gl=IN&ceid=IN:en'
			: baseFinance + '&hl=en-US&gl=US&ceid=US:en';
		Promise.all([
			window.__trendsFetchRss(newsFeed, 8),
			window.__trendsFetchRss(financeFeed, 8)
		]).then(function (results) {
			var newsItems = (results[0] && results[0].items) ? results[0].items.slice(0, 6) : [];
			var finItems = (results[1] && results[1].items) ? results[1].items.slice(0, 6) : [];
			setStatus('Live.');
			setUpdated();
			function rowHtml(item) {
				var title = (item.title || '').trim() || 'Untitled';
				var url = item.link || '#';
				var pub = item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
				return '<li class="border-b border-gray-200 dark:border-gray-700 pb-1.5 last:border-b-0">' +
					'<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-medium text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a>' +
					(pub ? '<div class="text-[11px] text-gray-500 dark:text-gray-400">' + pub + '</div>' : '') + '</li>';
			}
			var newsHtml = newsItems.length ? newsItems.map(rowHtml).join('') : '<li class="text-gray-500 dark:text-gray-400">No headlines.</li>';
			var finHtml = finItems.length ? finItems.map(rowHtml).join('') : '<li class="text-gray-500 dark:text-gray-400">No finance headlines.</li>';
			newsList.innerHTML = newsHtml;
			financeList.innerHTML = finHtml;
			window.__trendsWriteCache('live-breaking', newsHtml, 'Live.', { html2: finHtml });
		}).catch(function () {
			setStatus('Could not load. Open Google News instead.');
		});
	}
	window.__trendsLoaders['live-breaking'] = load;
})();

(function () {
	// Alerts: USGS earthquakes, GDACS disasters RSS, world/breaking news RSS
	var eqList = document.getElementById('trends-alerts-earthquakes');
	var disasterList = document.getElementById('trends-alerts-disasters');
	var worldList = document.getElementById('trends-alerts-world');
	var statusEl = document.getElementById('trends-alerts-status');
	var updatedEl = document.getElementById('alerts-updated');
	if (!eqList || !disasterList || !worldList || !statusEl) return;

	function setStatus(t) { statusEl.textContent = t; }
	function setUpdated() {
		if (updatedEl) updatedEl.textContent = 'Updated at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
	setStatus('Tap Load or scroll here to fetch.');

	function load(forceRefresh) {
		var optExtra = { listEl2: disasterList, statusEl2: null };
		if (!forceRefresh && window.__trendsApplyCache('alerts', eqList, statusEl, optExtra)) {
			if (updatedEl) updatedEl.textContent = 'Cached · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			return;
		}
		setStatus('Loading…');
		var usgsUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
		var gdacsRss = 'https://www.gdacs.org/gdacsapi/rss.aspx';
		var worldRss = 'https://news.google.com/rss/search?q=breaking+news+world+war+natural+disaster&hl=en-US&gl=US&ceid=US:en';
		Promise.all([
			fetch(usgsUrl).then(function (r) { return r.ok ? r.json() : null; }),
			window.__trendsFetchRss(gdacsRss, 15),
			window.__trendsFetchRss(worldRss, 8)
		]).then(function (results) {
			setStatus('Alerts loaded.');
			setUpdated();
			var eqData = results[0];
			if (eqData && eqData.features && eqData.features.length) {
				var features = eqData.features.slice(0, 10);
				eqList.innerHTML = features.map(function (f) {
					var p = f.properties || {};
					var mag = p.mag != null ? p.mag : '—';
					var place = (p.place || '').trim() || 'Unknown';
					var time = p.time ? new Date(p.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
					var url = f.id ? 'https://earthquake.usgs.gov/earthquakes/eventpage/' + f.id : 'https://earthquake.usgs.gov/earthquakes/map/';
					return '<li class="border-b border-gray-200 dark:border-gray-700 pb-1 last:border-b-0">' +
						'<a href="' + url + '" target="_blank" rel="noopener" class="font-medium text-primary hover:underline">M' + mag + ' · ' + place.replace(/</g, '&lt;') + '</a>' +
						(time ? '<div class="text-[11px] text-gray-500 dark:text-gray-400">' + time + '</div>' : '') + '</li>';
				}).join('');
			} else {
				eqList.innerHTML = '<li class="text-gray-500 dark:text-gray-400">No significant earthquakes in the last 2.5 days.</li>';
			}
			var gdacsItems = (results[1] && results[1].items) ? results[1].items.slice(0, 8) : [];
			if (gdacsItems.length) {
				disasterList.innerHTML = gdacsItems.map(function (item) {
					var title = (item.title || '').trim() || 'Alert';
					var link = item.link || 'https://www.gdacs.org/';
					return '<li class="border-b border-gray-200 dark:border-gray-700 pb-1 last:border-b-0">' +
						'<a href="' + link.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-medium text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a></li>';
				}).join('');
			} else {
				disasterList.innerHTML = '<li class="text-gray-500 dark:text-gray-400">No active GDACS alerts.</li>';
			}
			var worldItems = (results[2] && results[2].items) ? results[2].items.slice(0, 6) : [];
			if (worldItems.length) {
				worldList.innerHTML = worldItems.map(function (item) {
					var title = (item.title || '').trim() || 'Untitled';
					var link = item.link || '#';
					var pub = item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
					return '<li class="border-b border-gray-200 dark:border-gray-700 pb-1 last:border-b-0">' +
						'<a href="' + link.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-medium text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a>' +
						(pub ? '<div class="text-[11px] text-gray-500 dark:text-gray-400">' + pub + '</div>' : '') + '</li>';
				}).join('');
			} else {
				worldList.innerHTML = '<li class="text-gray-500 dark:text-gray-400">No headlines.</li>';
			}
			window.__trendsWriteCache('alerts', eqList.innerHTML, 'Alerts loaded.', { html2: disasterList.innerHTML });
		}).catch(function () {
			setStatus('Could not load alerts. Try USGS / GDACS directly.');
		});
	}
	window.__trendsLoaders.alerts = load;
})();

(function () { — load on tap or when section visible
	var listEl = document.getElementById('trends-torrentfreak-list');
	var statusEl = document.getElementById('trends-torrentfreak-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Tap Load or scroll here to fetch.');

	function load(forceRefresh) {
		if (!forceRefresh && window.__trendsApplyCache('torrentfreak', listEl, statusEl)) return;
		setStatus('Loading…');
		window.__trendsFetchRss('https://torrentfreak.com/feed/', 12)
			.then(function (data) {
				var items = data && data.items ? data.items : null;
				if (!items || !items.length) {
					setStatus('No posts right now.');
					return;
				}
				items = items.slice(0, 10);
				setStatus('Showing ' + items.length + ' posts.');
				var html = '';
				items.forEach(function (item) {
					var title = (item.title || '').trim() || 'Untitled';
					var url = item.link || '#';
					var pub = item.pubDate ? new Date(item.pubDate).toLocaleDateString() : '';
					html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">';
					html += '<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a>';
					if (pub) html += '<div class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">' + pub + '</div>';
					html += '</li>';
				});
				listEl.innerHTML = html;
				window.__trendsWriteCache('torrentfreak', html, 'Showing ' + items.length + ' posts.');
			})
			.catch(function () {
				setStatus('Could not load TorrentFreak. Open torrentfreak.com instead.');
			});
	}
	window.__trendsLoaders.torrentfreak = load;
})();

(function () {
	// XDA Developers RSS (via our proxy) — load on tap or when section visible
	var listEl = document.getElementById('trends-xda-list');
	var statusEl = document.getElementById('trends-xda-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Tap Load or scroll here to fetch.');

	function load(forceRefresh) {
		if (!forceRefresh && window.__trendsApplyCache('xda', listEl, statusEl)) return;
		setStatus('Loading…');
		window.__trendsFetchRss('https://www.xda-developers.com/feed/', 12)
			.then(function (data) {
				var items = data && data.items ? data.items : null;
				if (!items || !items.length) {
					setStatus('No posts right now.');
					return;
				}
				items = items.slice(0, 10);
				setStatus('Showing ' + items.length + ' posts.');
				var html = '';
				items.forEach(function (item) {
					var title = (item.title || '').trim() || 'Untitled';
					var url = item.link || '#';
					var pub = item.pubDate ? new Date(item.pubDate).toLocaleDateString() : '';
					html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">';
					html += '<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a>';
					if (pub) html += '<div class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">' + pub + '</div>';
					html += '</li>';
				});
				listEl.innerHTML = html;
				window.__trendsWriteCache('xda', html, 'Showing ' + items.length + ' posts.');
			})
			.catch(function () {
				setStatus('Could not load XDA. Open xda-developers.com instead.');
			});
	}
	window.__trendsLoaders.xda = load;
})();

(function () {
	// TV schedule: Anime today + TV today — one loader for section tv-schedule (load on tap or when visible)
	var animeList = document.getElementById('trends-schedule-anime-list');
	var animeStatus = document.getElementById('trends-schedule-anime-status');
	var tvList = document.getElementById('trends-schedule-tv-list');
	var tvStatus = document.getElementById('trends-schedule-tv-status');
	if (!animeList || !animeStatus || !tvList || !tvStatus) return;

	function setAnimeStatus(t) { animeStatus.textContent = t; }
	function setTvStatus(t) { tvStatus.textContent = t; }
	setAnimeStatus('Tap Load or scroll here to fetch.');
	setTvStatus('Tap Load or scroll here to fetch.');

	function load(forceRefresh) {
		var optExtra = { listEl2: tvList, statusEl2: tvStatus };
		if (!forceRefresh && window.__trendsApplyCache('tv-schedule', animeList, animeStatus, optExtra)) return;
		setAnimeStatus('Loading…');
		setTvStatus('Loading…');
		var weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
		var today = weekdays[new Date().getDay()];
		var now = new Date();
		var dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
		var tvUrl = 'https://api.tvmaze.com/schedule?country=US&date=' + dateStr;
		Promise.all([
			fetch('https://api.jikan.moe/v4/schedules?filter=' + today).then(function (r) { return r.ok ? r.json() : null; }),
			fetch(tvUrl).then(function (r) { return r.ok ? r.json() : null; })
		]).then(function (results) {
			var data = results[0];
			if (!data || !data.data || !data.data.length) {
				setAnimeStatus('No anime scheduled for ' + today + '.');
			} else {
				var items = data.data.slice(0, 15);
				setAnimeStatus('Anime on ' + today + ' (' + items.length + ' shown).');
				var html = '';
				items.forEach(function (a) {
					var title = (a.title || a.title_english || '').trim() || 'Untitled';
					var url = a.url || ('https://myanimelist.net/anime/' + (a.mal_id || ''));
					var broadcast = (a.broadcast && a.broadcast.string) ? a.broadcast.string : '';
					html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-1.5 last:border-b-0">';
					html += '<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-medium text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a>';
					if (broadcast) html += '<div class="text-[11px] text-gray-500 dark:text-gray-400">' + broadcast.replace(/</g, '&lt;') + '</div>';
					html += '</li>';
				});
				animeList.innerHTML = html;
			}
			var list = results[1];
			if (!Array.isArray(list) || !list.length) {
				setTvStatus('No episodes for today.');
			} else {
				var items = list.slice(0, 20);
				setTvStatus('Today (' + dateStr + ') · ' + items.length + ' shown.');
				var html2 = '';
				items.forEach(function (ep) {
					var showName = (ep.show && ep.show.name) ? ep.show.name : 'Unknown';
					var epName = (ep.name || '').trim() || 'Episode ' + (ep.number || '');
					var airtime = ep.airtime || '';
					var showUrl = (ep.show && ep.show.url) ? ep.show.url : 'https://www.tvmaze.com/schedule';
					html2 += '<li class="border-b border-gray-200 dark:border-gray-700 pb-1.5 last:border-b-0">';
					html2 += '<a href="' + showUrl.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-medium text-primary hover:underline">' + showName.replace(/</g, '&lt;') + '</a>';
					html2 += '<div class="text-[11px] text-gray-500 dark:text-gray-400">' + (epName.replace(/</g, '&lt;')) + (airtime ? ' · ' + airtime : '') + '</div>';
					html2 += '</li>';
				});
				tvList.innerHTML = html2;
			}
			window.__trendsWriteCache('tv-schedule', animeList.innerHTML, animeStatus.textContent, { html2: tvList.innerHTML, status2: tvStatus.textContent });
		}).catch(function () {
			setAnimeStatus('Could not load schedule. Use MAL link below.');
			setTvStatus('Could not load TVMaze. Try tvmaze.com/schedule.');
		});
	}
	window.__trendsLoaders['tv-schedule'] = load;
})();

(function () {
	// Actor search (TVMaze people API)
	var input = document.getElementById('trends-actor-search-input');
	var btn = document.getElementById('trends-actor-search-btn');
	var statusEl = document.getElementById('trends-actor-search-status');
	var resultsEl = document.getElementById('trends-actor-search-results');
	if (!input || !btn || !statusEl || !resultsEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}

	function doSearch() {
		var q = (input.value || '').trim();
		if (!q) {
			setStatus('Enter a name to search.');
			resultsEl.innerHTML = '';
			return;
		}
		setStatus('Searching…');
		resultsEl.innerHTML = '';

		var url = 'https://api.tvmaze.com/search/people?q=' + encodeURIComponent(q);
		fetch(url)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (list) {
				if (!Array.isArray(list) || !list.length) {
					setStatus('No results for “‘ + q.replace(/</g, '&lt;') + '”. Try another name.');
					return;
				}
				var take = list.slice(0, 10);
				setStatus('Found ' + take.length + ' result(s).');
				var html = '';
				take.forEach(function (item) {
					var p = item.person || item;
					var name = (p.name || '').trim() || 'Unknown';
					var personUrl = p.url || ('https://www.tvmaze.com/people/' + (p.id || ''));
					var img = (p.image && p.image.medium) ? p.image.medium : '';
					var country = (p.country && p.country.name) ? p.country.name : '';
					var birthday = p.birthday || '';
					var meta = [country, birthday].filter(Boolean).join(' · ');
					html += '<li class="flex gap-3 items-start border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0">';
					if (img) {
						html += '<img src="' + img.replace(/"/g, '&quot;') + '" alt="" class="w-12 h-12 rounded-lg object-cover shrink-0" loading="lazy">';
					} else {
						html += '<div class="w-12 h-12 rounded-lg bg-gray-300 dark:bg-gray-600 shrink-0 flex items-center justify-center text-gray-500 text-xs">?</div>';
					}
					html += '<div class="min-w-0">';
					html += '<a href="' + personUrl.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">' + name.replace(/</g, '&lt;') + '</a>';
					if (meta) html += '<div class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">' + meta.replace(/</g, '&lt;') + '</div>';
					html += '</div>';
					html += '</li>';
				});
				resultsEl.innerHTML = html;
			})
			.catch(function () {
				setStatus('Search failed. Try again or open TVMaze directly.');
			});
	}

	btn.addEventListener('click', doSearch);
	input.addEventListener('keydown', function (e) {
		if (e.key === 'Enter') doSearch();
	});
})();

(function () {
	// Visual inspiration grid (Picsum) — load on tap or when section visible
	var grid = document.getElementById('trends-visual-grid');
	var refreshBtn = document.getElementById('trends-visual-refresh');
	if (!grid) return;

	function applyImages() {
		var cards = grid.querySelectorAll('.trends-visual-card');
		cards.forEach(function (card, idx) {
			var seed = card.getAttribute('data-seed') || ('trends-' + idx);
			var fullSeed = seed + '-' + Math.floor(Math.random() * 10000);
			var url = 'https://picsum.photos/seed/' + encodeURIComponent(fullSeed) + '/600/400';
			card.style.backgroundImage = 'url(' + url + ')';
			card.style.backgroundSize = 'cover';
			card.style.backgroundPosition = 'center';
			var link = card.querySelector('a');
			if (link) link.href = url;
		});
	}

	function load() {
		applyImages();
	}
	if (refreshBtn) {
		refreshBtn.addEventListener('click', function () { load(); });
	}
	window.__trendsLoaders.visual = load;
})();

(function () {
	// Medium/Towards Data Science RSS (via our proxy) — load on tap or when section visible
	var listEl = document.getElementById('trends-medium-list');
	var statusEl = document.getElementById('trends-medium-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Tap Load or scroll here to fetch.');

	function load(forceRefresh) {
		if (!forceRefresh && window.__trendsApplyCache('medium', listEl, statusEl)) return;
		setStatus('Loading…');
		window.__trendsFetchRss('https://towardsdatascience.com/feed', 12)
			.then(function (data) {
				var items = data && data.items ? data.items : null;
				if (!items || !Array.isArray(items) || items.length === 0) {
					setStatus('No articles available right now.');
					return;
				}
				items = items.slice(0, 10);
				setStatus('Showing ' + items.length + ' latest articles.');
				var html = '';
				items.forEach(function (item) {
					var title = (item.title || '').trim() || 'Untitled';
					var url = item.link || '#';
					var pubDate = item.pubDate ? new Date(item.pubDate).toLocaleDateString() : '';
					var author = item.author || '';
					html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">';
					html += '<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a>';
					html += '<div class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">';
					if (author) html += author + ' &middot; ';
					if (pubDate) html += pubDate;
					html += '</div>';
					html += '</li>';
				});
				listEl.innerHTML = html;
				window.__trendsWriteCache('medium', html, 'Showing ' + items.length + ' latest articles.');
			})
			.catch(function () {
				setStatus('Could not reach Medium feed. Try again later.');
			});
	}
	window.__trendsLoaders.medium = load;
})();

(function () {
	// Dev.to trending articles — load on tap or when section visible
	var listEl = document.getElementById('trends-devto-list');
	var statusEl = document.getElementById('trends-devto-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Tap Load or scroll here to fetch.');

	function load(forceRefresh) {
		if (!forceRefresh && window.__trendsApplyCache('devto', listEl, statusEl)) return;
		setStatus('Loading…');
		fetch('https://dev.to/api/articles?top=7&per_page=10', {
			headers: { 'User-Agent': 'analytics-lab-trends/1.0' }
		})
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (items) {
				if (!Array.isArray(items) || items.length === 0) {
					setStatus('No articles available right now.');
					return;
				}
				setStatus('Showing ' + items.length + ' trending articles.');
				var html = '';
				items.forEach(function (item) {
					var title = (item.title || '').trim() || 'Untitled';
					var url = item.url || ('https://dev.to' + (item.path || ''));
					var reactions = item.positive_reactions_count || 0;
					var comments = item.comments_count || 0;
					var tags = Array.isArray(item.tag_list) ? item.tag_list.slice(0, 3).join(', ') : '';
					html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">';
					html += '<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a>';
					html += '<div class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">';
					html += reactions + ' reactions';
					if (comments > 0) html += ' &middot; ' + comments + ' comments';
					if (tags) html += ' &middot; ' + tags;
					html += '</div>';
					html += '</li>';
				});
				listEl.innerHTML = html;
				window.__trendsWriteCache('devto', html, 'Showing ' + items.length + ' trending articles.');
			})
			.catch(function () {
				setStatus('Could not reach Dev.to API. Try again later.');
			});
	}
	window.__trendsLoaders.devto = load;
})();

(function () {
	// Reddit r/datascience hot posts — load on tap or when section visible
	var listEl = document.getElementById('trends-reddit-list');
	var statusEl = document.getElementById('trends-reddit-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Tap Load or scroll here to fetch.');

	function load(forceRefresh) {
		if (!forceRefresh && window.__trendsApplyCache('reddit-ds', listEl, statusEl)) return;
		setStatus('Loading…');
		fetch('https://www.reddit.com/r/datascience/hot.json?limit=10', {
			headers: { 'User-Agent': 'analytics-lab-trends/1.0' }
		})
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.data || !data.data.children || !Array.isArray(data.data.children)) {
					setStatus('No posts available right now.');
					return;
				}
				var posts = data.data.children.slice(0, 10);
				setStatus('Showing ' + posts.length + ' hot posts.');
				var html = '';
				posts.forEach(function (post) {
					var item = post.data;
					if (!item) return;
					var title = (item.title || '').trim() || 'Untitled';
					var url = item.url || ('https://www.reddit.com' + item.permalink);
					var score = item.score || 0;
					var comments = item.num_comments || 0;
					var subreddit = item.subreddit || 'datascience';
					html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">';
					html += '<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a>';
					html += '<div class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">';
					html += score + ' points';
					if (comments > 0) html += ' &middot; ' + comments + ' comments';
					html += ' &middot; r/' + subreddit;
					html += '</div>';
					html += '</li>';
				});
				listEl.innerHTML = html;
				window.__trendsWriteCache('reddit-ds', html, 'Showing ' + posts.length + ' hot posts.');
			})
			.catch(function () {
				setStatus('Could not reach Reddit. Try again later.');
			});
	}
	window.__trendsLoaders['reddit-ds'] = load;
})();

(function () {
	// Reddit r/MachineLearning hot posts — load on tap or when section visible
	var listEl = document.getElementById('trends-reddit-ml-list');
	var statusEl = document.getElementById('trends-reddit-ml-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Tap Load or scroll here to fetch.');

	function load(forceRefresh) {
		if (!forceRefresh && window.__trendsApplyCache('reddit-ml', listEl, statusEl)) return;
		setStatus('Loading…');
		fetch('https://www.reddit.com/r/MachineLearning/hot.json?limit=10', {
			headers: { 'User-Agent': 'analytics-lab-trends/1.0' }
		})
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.data || !data.data.children || !Array.isArray(data.data.children)) {
					setStatus('No posts available right now.');
					return;
				}
				var posts = data.data.children.slice(0, 10);
				setStatus('Showing ' + posts.length + ' hot posts.');
				var html = '';
				posts.forEach(function (post) {
					var item = post.data;
					if (!item) return;
					var title = (item.title || '').trim() || 'Untitled';
					var url = item.url || ('https://www.reddit.com' + item.permalink);
					var score = item.score || 0;
					var comments = item.num_comments || 0;
					var subreddit = item.subreddit || 'MachineLearning';
					html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">';
					html += '<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a>';
					html += '<div class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">';
					html += score + ' points';
					if (comments > 0) html += ' &middot; ' + comments + ' comments';
					html += ' &middot; r/' + subreddit;
					html += '</div>';
					html += '</li>';
				});
				listEl.innerHTML = html;
				window.__trendsWriteCache('reddit-ml', html, 'Showing ' + posts.length + ' hot posts.');
			})
			.catch(function () {
				setStatus('Could not reach Reddit. Try again later.');
			});
	}
	window.__trendsLoaders['reddit-ml'] = load;
})();

(function () {
	// GitHub trending repositories — load on tap or when section visible
	var listEl = document.getElementById('trends-github-list');
	var statusEl = document.getElementById('trends-github-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Tap Load or scroll here to fetch.');

	function renderRepos(repos, note) {
		if (!repos || !repos.length) {
			setStatus('No trending repos available right now.');
			return;
		}
		var top = repos.slice(0, 10);
		setStatus((note ? note + ' · ' : '') + 'Showing ' + top.length + ' trending repositories.');
		var html = '';
		top.forEach(function (repo) {
			var fullName = (repo.fullName || repo.name || '').trim();
			var url = repo.url || '#';
			var description = repo.description || '';
			var stars = repo.stars || null;
			var language = repo.language || '';
			html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">';
			html += '<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">' + fullName.replace(/</g, '&lt;') + '</a>';
			if (description) html += '<p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400 line-clamp-1">' + description.replace(/</g, '&lt;').substring(0, 120) + (description.length > 120 ? '…' : '') + '</p>';
			html += '<div class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">';
			if (stars != null) html += String(stars).toLocaleString() + ' stars';
			if (language) html += (stars != null ? ' &middot; ' : '') + language;
			html += '</div>';
			html += '</li>';
		});
		listEl.innerHTML = html;
		window.__trendsWriteCache('github', html, 'Showing ' + top.length + ' trending repositories.');
	}

	function fetchViaJinaTrendingHtml() {
		// CORS-friendly HTML fetch via r.jina.ai; parse repo links from the page
		return fetch('https://r.jina.ai/https://github.com/trending?since=daily')
			.then(function (r) { return r.ok ? r.text() : null; })
			.then(function (txt) {
				if (!txt) return null;
				var re = /href="\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)"/g;
				var seen = {};
				var out = [];
				var m;
				while ((m = re.exec(txt)) && out.length < 20) {
					var owner = m[1], repo = m[2];
					var full = owner + '/' + repo;
					if (seen[full]) continue;
					seen[full] = 1;
					out.push({ fullName: full, url: 'https://github.com/' + full });
				}
				return out.length ? out : null;
			});
	}

	function load(forceRefresh) {
		if (!forceRefresh && window.__trendsApplyCache('github', listEl, statusEl)) return;
		setStatus('Loading…');
		fetch('https://githubtrending.lessx.xyz/trending?since=daily&language=&spoken_language_code=en')
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (data && Array.isArray(data) && data.length) {
					var repos = data.map(function (repo) {
						var name = repo.name || '';
						var author = repo.author || '';
						return {
							fullName: (author ? author + '/' : '') + name,
							url: repo.url || (author && name ? ('https://github.com/' + author + '/' + name) : 'https://github.com/trending'),
							description: repo.description || '',
							stars: repo.stars || null,
							language: repo.language || ''
						};
					});
					renderRepos(repos, 'API');
					return;
				}
				return fetchViaJinaTrendingHtml().then(function (repos) {
					if (repos) renderRepos(repos, 'Fallback');
					else setStatus('Could not load GitHub trending. Open github.com/trending instead.');
				});
			})
			.catch(function () {
				fetchViaJinaTrendingHtml()
					.then(function (repos) {
						if (repos) renderRepos(repos, 'Fallback');
						else setStatus('Could not load GitHub trending. Open github.com/trending instead.');
					})
					.catch(function () {
						setStatus('Could not load GitHub trending. Open github.com/trending instead.');
					});
			});
	}
	window.__trendsLoaders.github = load;
})();

(function () {
	// Anime: Jikan API (top) — load on tap or when section visible
	var listEl = document.getElementById('trends-anime-list');
	var statusEl = document.getElementById('trends-anime-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Tap Load or scroll here to fetch.');

	function load(forceRefresh) {
		if (!forceRefresh && window.__trendsApplyCache('anime', listEl, statusEl)) return;
		setStatus('Loading…');
		fetch('https://api.jikan.moe/v4/top/anime?limit=10')
			.then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('Jikan error')); })
			.then(function (data) {
				var items = data && data.data;
				if (!Array.isArray(items) || items.length === 0) {
					setStatus('No anime data available right now.');
					return;
				}
				setStatus('Top ' + items.length + ' anime.');
				var html = '';
				items.forEach(function (a) {
					var title = (a.title || a.title_english || '').trim() || 'Untitled';
					var url = a.url || ('https://myanimelist.net/anime/' + (a.mal_id || ''));
					var score = a.score != null ? a.score : '';
					var type = a.type || '';
					var episodes = a.episodes != null ? a.episodes + ' eps' : '';
					html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">';
					html += '<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a>';
					html += '<div class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">';
					if (score) html += 'Score: ' + score;
					if (type) html += (score ? ' &middot; ' : '') + type;
					if (episodes) html += (score || type ? ' &middot; ' : '') + episodes;
					html += '</div>';
					html += '</li>';
				});
				listEl.innerHTML = html;
				window.__trendsWriteCache('anime', html, 'Top ' + items.length + ' anime.');
			})
			.catch(function () {
				setStatus('Could not reach Jikan API. Try again later.');
			});
	}
	window.__trendsLoaders.anime = load;
})();

// Analytics: track visits and time-on-page for Trends
if (typeof initAnalyticsTracking === 'function') {
	initAnalyticsTracking({ site: 'analytics-lab', baseEvent: 'trends' });
}
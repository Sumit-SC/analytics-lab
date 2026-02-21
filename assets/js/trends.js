(function () {
	// Lazy load + cache: no auto-fetch on page load; load on tap or when section scrolls into view.
	// Reduces pressure on third-party APIs. Cache TTL 5 min (sessionStorage).
	var TRENDS_CACHE_PREFIX = 'trends_cache_';
	var TRENDS_CACHE_TTL_MS = 5 * 60 * 1000;
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
		hn: 'Hacker News',
		'google-news': 'Google News',
		inshorts: 'Inshorts',
		wiki: 'Wikipedia',
		medium: 'Towards Data Science',
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
	// Inshorts news — load on tap or when section visible
	var listEl = document.getElementById('trends-inshorts-list');
	var statusEl = document.getElementById('trends-inshorts-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Tap Load or scroll here to fetch.');

	var endpoints = [
		'https://inshorts.vercel.app/news?category=all',
		'https://inshorts.vercel.app/api/news?category=all',
		'https://inshortsapi.vercel.app/news?category=all'
	];

	function tryFetch(idx, forceRefresh) {
		if (idx >= endpoints.length) {
			setStatus('Could not reach Inshorts API. Try again later.');
			return;
		}
		fetch(endpoints[idx])
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				var items = Array.isArray(data) ? data : (data && data.data) ? data.data : (data && data.news) ? data.news : null;
				if (!items || !items.length) {
					if (idx + 1 < endpoints.length) tryFetch(idx + 1, forceRefresh);
					else setStatus('No news items in this snapshot.');
					return;
				}
				var take = items.slice(0, 10);
				setStatus('Showing ' + take.length + ' headlines.');
				var html = '';
				take.forEach(function (item) {
					var title = (item.title || item.headline || '').trim() || 'Untitled';
					var url = item.url || item.readMoreUrl || item.link || '#';
					var content = (item.content || item.summary || '').trim();
					html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">';
					html += '<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a>';
					if (content) html += '<p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">' + content.replace(/</g, '&lt;').substring(0, 160) + (content.length > 160 ? '…' : '') + '</p>';
					html += '</li>';
				});
				listEl.innerHTML = html;
				window.__trendsWriteCache('inshorts', html, 'Showing ' + take.length + ' headlines.');
			})
			.catch(function () {
				tryFetch(idx + 1, forceRefresh);
			});
	}

	function load(forceRefresh) {
		if (!forceRefresh && window.__trendsApplyCache('inshorts', listEl, statusEl)) return;
		setStatus('Loading…');
		tryFetch(0, forceRefresh);
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
	// Google News (RSS via RSS2JSON) — load on tap or when section visible
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
		var rssUrl = encodeURIComponent('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
		var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + rssUrl + '&api_key=public&count=12';
		fetch(apiUrl)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.items || !data.items.length) {
					setStatus('No headlines right now.');
					return;
				}
				var items = data.items.slice(0, 10);
				setStatus('Showing ' + items.length + ' headlines.');
				var html = '';
				items.forEach(function (item) {
					var title = (item.title || '').trim() || 'Untitled';
					var url = item.link || item.guid || '#';
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
	// TorrentFreak RSS — load on tap or when section visible
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
		var rssUrl = encodeURIComponent('https://torrentfreak.com/feed/');
		var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + rssUrl + '&api_key=public&count=10';
		fetch(apiUrl)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.items || !data.items.length) {
					setStatus('No posts right now.');
					return;
				}
				var items = data.items.slice(0, 10);
				setStatus('Showing ' + items.length + ' posts.');
				var html = '';
				items.forEach(function (item) {
					var title = (item.title || '').trim() || 'Untitled';
					var url = item.link || item.guid || '#';
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
	// XDA Developers RSS
	var listEl = document.getElementById('trends-xda-list');
	var statusEl = document.getElementById('trends-xda-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Loading…');

	var rssUrl = encodeURIComponent('https://www.xda-developers.com/feed/');
	var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + rssUrl + '&api_key=public&count=10';

	fetch(apiUrl)
		.then(function (r) { return r.ok ? r.json() : null; })
		.then(function (data) {
			if (!data || !data.items || !data.items.length) {
				setStatus('No posts right now.');
				return;
			}
			var items = data.items.slice(0, 10);
			setStatus('Showing ' + items.length + ' posts.');
			var html = '';
			items.forEach(function (item) {
				var title = (item.title || '').trim() || 'Untitled';
				var url = item.link || item.guid || '#';
				var pub = item.pubDate ? new Date(item.pubDate).toLocaleDateString() : '';
				html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">';
				html += '<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">' + title.replace(/</g, '&lt;') + '</a>';
				if (pub) html += '<div class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">' + pub + '</div>';
				html += '</li>';
			});
			listEl.innerHTML = html;
		})
		.catch(function () {
			setStatus('Could not load XDA. Open xda-developers.com instead.');
		});
})();

(function () {
	// TV schedule: Anime today (Jikan schedules by weekday)
	var listEl = document.getElementById('trends-schedule-anime-list');
	var statusEl = document.getElementById('trends-schedule-anime-status');
	if (!listEl || !statusEl) return;

	var weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	var today = weekdays[new Date().getDay()];

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Loading…');

	fetch('https://api.jikan.moe/v4/schedules?filter=' + today)
		.then(function (r) { return r.ok ? r.json() : null; })
		.then(function (data) {
			if (!data || !data.data || !data.data.length) {
				setStatus('No anime scheduled for ' + today + '.');
				return;
			}
			var items = data.data.slice(0, 15);
			setStatus('Anime on ' + today + ' (' + items.length + ' shown).');
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
			listEl.innerHTML = html;
		})
		.catch(function () {
			setStatus('Could not load schedule. Use MAL schedule link below.');
		});
})();

(function () {
	// TV schedule: TV episodes today (TVMaze)
	var listEl = document.getElementById('trends-schedule-tv-list');
	var statusEl = document.getElementById('trends-schedule-tv-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}
	setStatus('Loading…');

	var now = new Date();
	var y = now.getFullYear();
	var m = String(now.getMonth() + 1).padStart(2, '0');
	var d = String(now.getDate()).padStart(2, '0');
	var dateStr = y + '-' + m + '-' + d;
	var url = 'https://api.tvmaze.com/schedule?country=US&date=' + dateStr;

	fetch(url)
		.then(function (r) { return r.ok ? r.json() : null; })
		.then(function (list) {
			if (!Array.isArray(list) || !list.length) {
				setStatus('No episodes for today.');
				return;
			}
			var items = list.slice(0, 20);
			setStatus('Today (' + dateStr + ') · ' + items.length + ' shown.');
			var html = '';
			items.forEach(function (ep) {
				var showName = (ep.show && ep.show.name) ? ep.show.name : 'Unknown';
				var epName = (ep.name || '').trim() || 'Episode ' + (ep.number || '');
				var airtime = ep.airtime || '';
				var showUrl = (ep.show && ep.show.url) ? ep.show.url : 'https://www.tvmaze.com/schedule';
				html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-1.5 last:border-b-0">';
				html += '<a href="' + showUrl.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-medium text-primary hover:underline">' + showName.replace(/</g, '&lt;') + '</a>';
				html += '<div class="text-[11px] text-gray-500 dark:text-gray-400">' + (epName.replace(/</g, '&lt;')) + (airtime ? ' · ' + airtime : '') + '</div>';
				html += '</li>';
			});
			listEl.innerHTML = html;
		})
		.catch(function () {
			setStatus('Could not load TVMaze. Try tvmaze.com/schedule.');
		});
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
	// Visual inspiration grid (Picsum)
	var grid = document.getElementById('trends-visual-grid');
	var refreshBtn = document.getElementById('trends-visual-refresh');
	if (!grid) return;

	function applyImages() {
		var cards = grid.querySelectorAll('.trends-visual-card');
		cards.forEach(function (card, idx) {
			var seed = card.getAttribute('data-seed') || ('trends-' + idx);
			// Slight randomness per refresh to keep it fun
			var fullSeed = seed + '-' + Math.floor(Math.random() * 10000);
			var url = 'https://picsum.photos/seed/' + encodeURIComponent(fullSeed) + '/600/400';
			card.style.backgroundImage = 'url(' + url + ')';
			card.style.backgroundSize = 'cover';
			card.style.backgroundPosition = 'center';
			var link = card.querySelector('a');
			if (link) link.href = url;
		});
	}

	if (refreshBtn) {
		refreshBtn.addEventListener('click', applyImages);
	}

	applyImages();
})();

(function () {
	// Medium/Towards Data Science RSS feed (via RSS2JSON proxy)
	var listEl = document.getElementById('trends-medium-list');
	var statusEl = document.getElementById('trends-medium-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}

	setStatus('Loading…');

	function fetchMediumArticles() {
		// Use RSS2JSON to convert RSS to JSON (CORS-friendly)
		var rssUrl = encodeURIComponent('https://towardsdatascience.com/feed');
		var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + rssUrl + '&api_key=public&count=10';

		fetch(apiUrl)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.items || !Array.isArray(data.items) || data.items.length === 0) {
					setStatus('No articles available right now.');
					return;
				}
				var items = data.items.slice(0, 10);
				setStatus('Showing ' + items.length + ' latest articles.');
				var html = '';
				items.forEach(function (item) {
					var title = (item.title || '').trim() || 'Untitled';
					var url = item.link || item.guid || '#';
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
			})
			.catch(function () {
				setStatus('Could not reach Medium feed. Try again later.');
			});
	}

	fetchMediumArticles();
})();

(function () {
	// Dev.to trending articles
	var listEl = document.getElementById('trends-devto-list');
	var statusEl = document.getElementById('trends-devto-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}

	setStatus('Loading…');

	function fetchDevToArticles() {
		// Top articles from last 7 days
		fetch('https://dev.to/api/articles?top=7&per_page=10', {
			headers: {
				'User-Agent': 'analytics-lab-trends/1.0'
			}
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
			})
			.catch(function () {
				setStatus('Could not reach Dev.to API. Try again later.');
			});
	}

	fetchDevToArticles();
})();

(function () {
	// Reddit r/datascience hot posts
	var listEl = document.getElementById('trends-reddit-list');
	var statusEl = document.getElementById('trends-reddit-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}

	setStatus('Loading…');

	function fetchRedditPosts() {
		// Reddit JSON API - no auth needed for public subreddits
		fetch('https://www.reddit.com/r/datascience/hot.json?limit=10', {
			headers: {
				'User-Agent': 'analytics-lab-trends/1.0'
			}
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
			})
			.catch(function () {
				setStatus('Could not reach Reddit. Try again later.');
			});
	}

	fetchRedditPosts();
})();

(function () {
	// Reddit r/MachineLearning hot posts
	var listEl = document.getElementById('trends-reddit-ml-list');
	var statusEl = document.getElementById('trends-reddit-ml-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}

	setStatus('Loading…');

	function fetchRedditMLPosts() {
		// Reddit JSON API - no auth needed for public subreddits
		fetch('https://www.reddit.com/r/MachineLearning/hot.json?limit=10', {
			headers: {
				'User-Agent': 'analytics-lab-trends/1.0'
			}
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
			})
			.catch(function () {
				setStatus('Could not reach Reddit. Try again later.');
			});
	}

	fetchRedditMLPosts();
})();

(function () {
	// GitHub trending repositories
	var listEl = document.getElementById('trends-github-list');
	var statusEl = document.getElementById('trends-github-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}

	setStatus('Loading…');

	function fetchGitHubTrending() {
		// Using unofficial GitHub trending API
		fetch('https://githubtrending.lessx.xyz/trending?since=daily&language=&spoken_language_code=en')
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !Array.isArray(data) || data.length === 0) {
					setStatus('No trending repos available right now.');
					return;
				}
				var repos = data.slice(0, 10);
				setStatus('Showing ' + repos.length + ' trending repositories.');
				var html = '';
				repos.forEach(function (repo) {
					var name = repo.name || '';
					var author = repo.author || '';
					var description = repo.description || '';
					var stars = repo.stars || 0;
					var forks = repo.forks || 0;
					var language = repo.language || '';
					var url = repo.url || ('https://github.com/' + author + '/' + name);
					var fullName = author ? author + '/' + name : name;
					html += '<li class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">';
					html += '<a href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">' + fullName.replace(/</g, '&lt;') + '</a>';
					if (description) html += '<p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400 line-clamp-1">' + description.replace(/</g, '&lt;').substring(0, 120) + (description.length > 120 ? '…' : '') + '</p>';
					html += '<div class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">';
					html += stars.toLocaleString() + ' stars';
					if (forks > 0) html += ' &middot; ' + forks.toLocaleString() + ' forks';
					if (language) html += ' &middot; ' + language;
					html += '</div>';
					html += '</li>';
				});
				listEl.innerHTML = html;
			})
			.catch(function () {
				setStatus('Could not reach GitHub trending API. Try again later.');
			});
	}

	fetchGitHubTrending();
})();

(function () {
	// Anime: Jikan API (top / seasonal)
	var listEl = document.getElementById('trends-anime-list');
	var statusEl = document.getElementById('trends-anime-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}

	setStatus('Loading…');

	function fetchAnime() {
		// Jikan v4: top anime, limit 10
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
			})
			.catch(function () {
				setStatus('Could not reach Jikan API. Try again later.');
			});
	}

	fetchAnime();
})();

// Analytics: track visits and time-on-page for Trends
if (typeof initAnalyticsTracking === 'function') {
	initAnalyticsTracking({ site: 'analytics-lab', baseEvent: 'trends' });
}
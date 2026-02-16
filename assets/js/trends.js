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
		var isAll = filter === 'all';
		sections.forEach(function (section) {
			var cat = section.getAttribute('data-trend-category');
			var show = isAll || cat === filter;
			section.classList.toggle('hidden', !show);
		});
		// Update button states
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
	// Hacker News top stories (lightweight snapshot)
	var listEl = document.getElementById('trends-hn-list');
	var statusEl = document.getElementById('trends-hn-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}

	setStatus('Loading…');

	function fetchTopStories() {
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
				});
			})
			.catch(function () {
				setStatus('Could not reach Hacker News. Open it directly instead.');
			});
	}

	fetchTopStories();
})();

(function () {
	// Inshorts news (https://inshorts.vercel.app — unofficial API by Sumit Kolhe)
	var listEl = document.getElementById('trends-inshorts-list');
	var statusEl = document.getElementById('trends-inshorts-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}

	setStatus('Loading…');

	// Try user's preferred host first, then common alternate (inshortsapi.vercel.app)
	var endpoints = [
		'https://inshorts.vercel.app/news?category=all',
		'https://inshorts.vercel.app/api/news?category=all',
		'https://inshortsapi.vercel.app/news?category=all'
	];

	function tryFetch(idx) {
		if (idx >= endpoints.length) {
			setStatus('Could not reach Inshorts API. Try again later.');
			return;
		}
		fetch(endpoints[idx])
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				var items = Array.isArray(data) ? data : (data && data.data) ? data.data : (data && data.news) ? data.news : null;
				if (!items || !items.length) {
					if (idx + 1 < endpoints.length) tryFetch(idx + 1);
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
			})
			.catch(function () {
				tryFetch(idx + 1);
			});
	}

	tryFetch(0);
})();

(function () {
	// Wikipedia top pageviews today
	var listEl = document.getElementById('trends-wiki-list');
	var statusEl = document.getElementById('trends-wiki-status');
	if (!listEl || !statusEl) return;

	function setStatus(text) {
		statusEl.textContent = text;
	}

	setStatus('Loading…');

	function fetchTopPages() {
		// Today in UTC; API uses yyyy/mm/dd
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
			})
			.catch(function () {
				setStatus('Could not reach Wikipedia metrics API. Try the main page instead.');
			});
	}

	fetchTopPages();
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

// Analytics: track visits and time-on-page for Trends
if (typeof initAnalyticsTracking === 'function') {
	initAnalyticsTracking({ site: 'analytics-lab', baseEvent: 'trends' });
}
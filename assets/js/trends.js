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

// Analytics: track visits and time-on-page for Trends
if (typeof initAnalyticsTracking === 'function') {
	initAnalyticsTracking({ site: 'analytics-lab', baseEvent: 'trends' });
}
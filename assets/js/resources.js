/**
 * Resources page: topic selector, tabs (YouTube / Read / Courses / Best / Focus & Ambiance), fetch resources.json.
 * Notion-style gallery/list view; open links in same-page popup (Medium-style). Validates YouTube before embed.
 * Focus tab: lo-fi radio streams (SomaFM, Chillhop, etc.) + ambient YouTube scenes (rain, cafe, fireplace) with Piped toggle.
 * Live feed: Medium/TDS, Dev.to, Reddit, Hacker News, freeCodeCamp.
 */
(function () {
	// If anything throws during boot, avoid a blank page.
	function showFatalResourcesError(err) {
		try { console.error('[resources] fatal', err); } catch (e) {}
		var rootEl = document.getElementById('resource-root');
		var nf = document.getElementById('resource-not-found');
		if (rootEl) rootEl.classList.add('hidden');
		if (nf) {
			nf.classList.remove('hidden');
			nf.innerHTML =
				'<p class="text-gray-600 dark:text-gray-400 mb-2">Resources failed to load.</p>' +
				'<p class="text-xs text-gray-500 dark:text-gray-500 mb-4">Try a hard refresh (Ctrl+F5). If it still fails, clear this site’s storage/service worker and reload.</p>' +
				'<a href="../index.html" class="text-primary hover:underline">Back to Home</a>';
		}
	}

	try {
		// Boot banner: proves JS executed even if render fails later
		try {
			var boot = document.getElementById('resources-boot-banner');
			if (boot) boot.textContent = 'Resources booted…';
		} catch (e) {}

	var params = new URLSearchParams(window.location.search);
	var initialTopic = (params.get('topic') || 'python').toLowerCase().replace(/[^a-z0-9-]/g, '');
	var root = document.getElementById('resource-root');
	var notFound = document.getElementById('resource-not-found');

	var resourceViewMode = 'gallery'; // 'gallery' | 'list'
	var RESOURCE_VIEW_KEY = 'resources_view_mode';
	var LAST_TOPIC_KEY = 'resources_last_topic';
	var LAST_TOPIC_TITLE_KEY = 'resources_last_topic_title';
	var RES_FAVORITES_KEY = 'resources_favorites_v1'; // url -> { url, name, type, topicKey, ts }
	var RES_RECENT_KEY = 'resources_recent_v1'; // array of { url, name, type, topicKey, ts } (max 25)
	var resAllTopics = null;
	var resCurrentTopicKey = initialTopic;
	var resCurrentTopicMeta = null;

	var FOCUS_STATIONS = [
		{ name: 'Groove Salad', url: 'https://ice2.somafm.com/groovesalad-128-mp3', icon: '\u{1F3B5}', desc: 'Downtempo ambient grooves' },
		{ name: 'Drone Zone', url: 'https://ice2.somafm.com/dronezone-128-mp3', icon: '\u{1F30C}', desc: 'Atmospheric ambient textures' },
		{ name: 'Deep Space One', url: 'https://ice2.somafm.com/deepspaceone-128-mp3', icon: '\u{1F680}', desc: 'Deep ambient space music' },
		{ name: 'Lush', url: 'https://ice2.somafm.com/lush-128-mp3', icon: '\u{1F338}', desc: 'Sensuous mellow vocals' },
		{ name: 'Fluid', url: 'https://ice2.somafm.com/fluid-128-mp3', icon: '\u{1F4A7}', desc: 'Instrumental hip-hop' },
		{ name: 'Chillhop Radio', url: 'https://stream.chillhop.com/stream', icon: '\u2615', desc: 'Jazzy lo-fi beats' },
		{ name: 'Radio Paradise', url: 'https://stream.radioparadise.com/mp3-128', icon: '\u{1F3DD}\uFE0F', desc: 'Eclectic listener-supported mix' },
		{ name: 'Mission Control', url: 'https://ice2.somafm.com/missioncontrol-128-mp3', icon: '\u{1F6F8}', desc: 'Ambient + NASA audio' },
		{ name: 'cliqhop idm', url: 'https://ice2.somafm.com/cliqhop-128-mp3', icon: '\u{1F50A}', desc: 'Beats, clicks & bleeps' },
		{ name: 'DEF CON Radio', url: 'https://ice2.somafm.com/defcon-128-mp3', icon: '\u{1F4BB}', desc: 'Hacker conference vibes' },
		{ name: 'Boot Liquor', url: 'https://ice2.somafm.com/bootliquor-128-mp3', icon: '\u{1F3B8}', desc: 'Americana roots & country' },
		{ name: 'n5MD Radio', url: 'https://ice2.somafm.com/n5md-128-mp3', icon: '\u{1F3A7}', desc: 'Ambient, experimental' }
	];
	var AMBIENT_SCENES = [
		{ name: 'Rain on Window', id: 'mPZkdNFkNps', icon: '\u{1F327}\uFE0F', desc: 'Gentle rain for deep focus' },
		{ name: 'Coffee Shop', id: 'BOdLmxy06H0', icon: '\u2615', desc: 'Cafe ambiance & chatter' },
		{ name: 'Fireplace', id: 'L_LUpnjgPso', icon: '\u{1F525}', desc: 'Warm crackling fire' },
		{ name: 'Forest Birds', id: 'xNN7iTA57jM', icon: '\u{1F332}', desc: 'Birdsong & nature' },
		{ name: 'Ocean Waves', id: 'WHPEKLQID4U', icon: '\u{1F30A}', desc: 'Calming sea waves' },
		{ name: 'Thunderstorm', id: 'nDq6TstdEI8', icon: '\u26C8\uFE0F', desc: 'Distant thunder & rain' },
		{ name: 'Library Quiet', id: 'GjKGWvdFBbA', icon: '\u{1F4DA}', desc: 'Soft page turns' },
		{ name: 'Night Garden', id: 'sGkh1W5cbH4', icon: '\u{1F319}', desc: 'Crickets & gentle breeze' }
	];
	var focusAudio = null;
	var focusPlayingIdx = -1;
	var focusPiped = false;
	try { focusPiped = localStorage.getItem('resources_focus_piped') === '1'; } catch (e) { /* ignore */ }

	function escapeHtml(s) {
		if (s == null) return '';
		var div = document.createElement('div');
		div.textContent = s;
		return div.innerHTML;
	}

	function getResourceViewMode() {
		try { return localStorage.getItem(RESOURCE_VIEW_KEY) || 'gallery'; } catch (e) { return 'gallery'; }
	}
	function setResourceViewMode(mode) {
		try { localStorage.setItem(RESOURCE_VIEW_KEY, mode); } catch (e) {}
		resourceViewMode = mode;
	}

	// Resource detail popup (Notion/Medium-style)
	function openResourcePopup(url, name) {
		var overlay = document.getElementById('resource-detail-overlay');
		var iframe = document.getElementById('resource-detail-iframe');
		var titleEl = document.getElementById('resource-detail-title');
		var openTab = document.getElementById('resource-detail-open-tab');
		var closeBtn = document.getElementById('resource-detail-close');
		if (!overlay || !iframe || !openTab) return;
		titleEl.textContent = name || 'Resource';
		openTab.href = url;
		iframe.src = url;
		overlay.classList.add('resource-detail-open');
		overlay.setAttribute('aria-hidden', 'false');
		recordRecentOpen(url, name, null);
	}
	function closeResourcePopup() {
		var overlay = document.getElementById('resource-detail-overlay');
		var iframe = document.getElementById('resource-detail-iframe');
		if (overlay) {
			overlay.classList.remove('resource-detail-open');
			overlay.setAttribute('aria-hidden', 'true');
		}
		if (iframe) iframe.src = 'about:blank';
	}
	function initResourcePopup() {
		var overlay = document.getElementById('resource-detail-overlay');
		var closeBtn = document.getElementById('resource-detail-close');
		if (overlay) {
			overlay.addEventListener('click', function (e) {
				if (e.target === overlay) closeResourcePopup();
			});
		}
		if (closeBtn) closeBtn.addEventListener('click', closeResourcePopup);
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape') closeResourcePopup();
		});
	}

	function getFavorites() {
		try {
			var raw = localStorage.getItem(RES_FAVORITES_KEY);
			return raw ? JSON.parse(raw) : {};
		} catch (e) { return {}; }
	}
	function setFavorites(map) {
		try { localStorage.setItem(RES_FAVORITES_KEY, JSON.stringify(map || {})); } catch (e) {}
	}
	function toggleFavorite(item) {
		if (!item || !item.url) return;
		var map = getFavorites();
		if (map[item.url]) delete map[item.url];
		else map[item.url] = {
			url: item.url,
			name: item.name || item.url,
			type: item.type || '',
			topicKey: item.topicKey || '',
			ts: Date.now()
		};
		setFavorites(map);
	}
	function isFavorite(url) {
		if (!url) return false;
		var map = getFavorites();
		return !!map[url];
	}
	function getRecent() {
		try {
			var raw = localStorage.getItem(RES_RECENT_KEY);
			var arr = raw ? JSON.parse(raw) : [];
			return Array.isArray(arr) ? arr : [];
		} catch (e) { return []; }
	}
	function setRecent(arr) {
		try { localStorage.setItem(RES_RECENT_KEY, JSON.stringify(arr || [])); } catch (e) {}
	}
	function recordRecentOpen(url, name, type) {
		try {
			if (!url) return;
			var arr = getRecent();
			arr = arr.filter(function (x) { return x && x.url !== url; });
			arr.unshift({
				url: url,
				name: name || url,
				type: type || '',
				topicKey: resCurrentTopicKey || '',
				ts: Date.now()
			});
			if (arr.length > 25) arr = arr.slice(0, 25);
			setRecent(arr);
		} catch (e) {}
	}

	function normalizeTopicResources(topicKey, topic) {
		// Flatten a topic into a list of normalized items for search.
		var out = [];
		function add(kind, list) {
			if (!Array.isArray(list)) return;
			list.forEach(function (r) {
				if (!r || !r.url) return;
				out.push({
					topicKey: topicKey,
					topicTitle: (topic && topic.title) ? topic.title : topicKey,
					type: kind,
					name: r.name || r.subreddit || r.url,
					url: r.url || ('https://www.reddit.com/r/' + (r.subreddit || '') + '/')
				});
			});
		}
		add('youtube', topic && topic.youtube);
		add('course', topic && topic.courses);
		add('book', topic && topic.books);
		add('blog', topic && topic.blogs);
		add('github', topic && topic.github);
		add('reddit', topic && topic.reddit);
		add('path', topic && (topic.paths || []).map(function (p) { return { name: p, url: '#path' }; }));
		return out;
	}

	function buildGlobalIndex(topics) {
		var keys = Object.keys(topics || {});
		var items = [];
		keys.forEach(function (k) {
			var t = topics[k];
			items = items.concat(normalizeTopicResources(k, t));
		});
		return items;
	}

	function typeLabel(t) {
		if (t === 'youtube') return 'Video';
		if (t === 'course') return 'Course';
		if (t === 'book') return 'Book/Docs';
		if (t === 'blog') return 'Blog';
		if (t === 'github') return 'GitHub';
		if (t === 'reddit') return 'Reddit';
		return t || 'Resource';
	}

	function renderSearchAndInsights(topicKey, topics, topicMeta) {
		var host = document.getElementById('resources-search-wrap');
		if (!host) return;

		var favoritesCount = Object.keys(getFavorites() || {}).length;
		var recentCount = getRecent().length;

		var rolePaths = {
			'data-analyst': ['excel', 'sql', 'stats', 'data-analytics', 'power-bi', 'tableau', 'python', 'product-analytics', 'ab-testing'],
			'analytics-engineer': ['sql', 'dbt', 'data-modeling', 'data-warehouse', 'metrics', 'data-quality', 'python', 'airflow'],
			'data-scientist': ['python', 'stats', 'math', 'data-science', 'machine-learning', 'deep-learning', 'nlp', 'llms'],
			'ml-engineer': ['python', 'machine-learning', 'mlops', 'deep-learning', 'llms', 'docker', 'kubernetes', 'cloud-data'],
			'mlops': ['docker', 'kubernetes', 'mlops', 'cloud-data', 'ci-cd', 'observability', 'llms'],
			'genai-llm': ['python', 'nlp', 'llms', 'vector-databases', 'rag', 'prompt-engineering', 'mlops'],
			'automation': ['python', 'n8n', 'apis', 'sql', 'cloud-data', 'analytics-engineering'],
			'cloud-data': ['cloud-data', 'databases', 'data-warehouse', 'airflow', 'dbt', 'kubernetes', 'security'],
			'data-engineer': ['python', 'sql', 'data-engineering', 'databases', 'cloud-data', 'airflow', 'dbt', 'spark', 'streaming']
		};

		function pill(topicId) {
			var meta = topics && topics[topicId];
			var label = meta && meta.title ? meta.title : topicId;
			return '<button type="button" class="res-pill px-2 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-xs hover:bg-gray-100 dark:hover:bg-gray-800" data-topic-jump="' + escapeHtml(topicId) + '">' + escapeHtml(label) + '</button>';
		}

		host.innerHTML =
			'<div class="second-brain-card p-4 sm:p-5 mb-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/70 dark:bg-gray-900/30">' +
			'<div class="flex flex-wrap items-start justify-between gap-3">' +
			'<div class="min-w-0">' +
			'<p class="home-section-title mb-1">Search</p>' +
			'<p class="text-xs text-gray-500 dark:text-gray-400">Search this topic or all topics. Save favorites and revisit recently opened links.</p>' +
			'</div>' +
			'<div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">' +
			'<span>★ ' + favoritesCount + ' saved</span>' +
			'<span>·</span>' +
			'<span>⏱ ' + recentCount + ' recent</span>' +
			'</div>' +
			'</div>' +
			'<div class="mt-3 flex flex-wrap gap-2 items-center">' +
			'<input id="resources-search-input" class="flex-1 min-w-[200px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-200" placeholder="Search resources… e.g. joins, window functions, pandas" aria-label="Search resources">' +
			'<select id="resources-search-scope" class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-2 text-sm text-gray-800 dark:text-gray-200" aria-label="Search scope">' +
			'<option value="topic" selected>This topic</option>' +
			'<option value="all">All topics</option>' +
			'<option value="saved">Saved</option>' +
			'<option value="recent">Recent</option>' +
			'</select>' +
			'<select id="resources-filter-type" class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-2 text-sm text-gray-800 dark:text-gray-200" aria-label="Filter type">' +
			'<option value="all" selected>All types</option>' +
			'<option value="youtube">Videos</option>' +
			'<option value="course">Courses</option>' +
			'<option value="book">Books/Docs</option>' +
			'<option value="blog">Blogs</option>' +
			'<option value="github">GitHub</option>' +
			'<option value="reddit">Reddit</option>' +
			'</select>' +
			'</div>' +
			'<div id="resources-search-results" class="mt-3 hidden"></div>' +
			'<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">' +
			'<p class="home-section-title mb-2">Learning path (quick)</p>' +
			'<div class="flex flex-wrap items-center gap-2">' +
			'<select id="resources-role-select" class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-2 text-sm text-gray-800 dark:text-gray-200" aria-label="Role">' +
			'<option value="data-analyst">Data Analyst</option>' +
			'<option value="analytics-engineer">Analytics Engineer</option>' +
			'<option value="data-scientist">Data Scientist</option>' +
			'<option value="data-engineer">Data Engineer</option>' +
			'<option value="ml-engineer">ML Engineer</option>' +
			'<option value="mlops">MLOps</option>' +
			'<option value="genai-llm">GenAI / LLM</option>' +
			'<option value="automation">Automation (n8n)</option>' +
			'<option value="cloud-data">Cloud (data)</option>' +
			'</select>' +
			'<div id="resources-role-path" class="flex flex-wrap gap-2"></div>' +
			'</div>' +
			'<p class="text-[11px] text-gray-500 dark:text-gray-400 mt-2">Tip: click a pill to jump topics. Your progress can be tracked via the Roadmap panel.</p>' +
			'</div>' +
			'</div>';

		var roleSelect = document.getElementById('resources-role-select');
		var rolePath = document.getElementById('resources-role-path');
		function renderRole(roleKey) {
			var seq = rolePaths[roleKey] || [];
			if (!rolePath) return;
			rolePath.innerHTML = seq.map(pill).join('');
			// highlight current
			rolePath.querySelectorAll('[data-topic-jump]').forEach(function (b) {
				b.classList.toggle('border-primary', b.getAttribute('data-topic-jump') === topicKey);
				b.classList.toggle('text-primary', b.getAttribute('data-topic-jump') === topicKey);
			});
		}
		if (roleSelect) {
			roleSelect.addEventListener('change', function () { renderRole(roleSelect.value); });
			renderRole(roleSelect.value);
		}
		if (rolePath) {
			rolePath.addEventListener('click', function (e) {
				var b = e.target.closest('[data-topic-jump]');
				if (!b) return;
				var next = b.getAttribute('data-topic-jump');
				if (!next) return;
				try {
					updateUrl(next);
				} catch (err) {}
				renderTopic(next, topics);
			});
		}

		// --- Search behavior ---
		var input = document.getElementById('resources-search-input');
		var scope = document.getElementById('resources-search-scope');
		var type = document.getElementById('resources-filter-type');
		var results = document.getElementById('resources-search-results');
		var globalIndex = buildGlobalIndex(topics);

		function matches(item, q, typeFilter) {
			if (typeFilter && typeFilter !== 'all' && item.type !== typeFilter) return false;
			if (!q) return true;
			var hay = (item.name + ' ' + item.url + ' ' + item.topicTitle + ' ' + item.topicKey).toLowerCase();
			return hay.indexOf(q) !== -1;
		}

		function getScopeItems(scopeVal) {
			if (scopeVal === 'all') return globalIndex;
			if (scopeVal === 'topic') return normalizeTopicResources(topicKey, topicMeta);
			if (scopeVal === 'saved') {
				var map = getFavorites();
				return Object.keys(map).map(function (k) { return map[k]; }).map(function (x) {
					return { topicKey: x.topicKey || '', topicTitle: (topics[x.topicKey] && topics[x.topicKey].title) ? topics[x.topicKey].title : (x.topicKey || ''), type: x.type || '', name: x.name || '', url: x.url };
				});
			}
			if (scopeVal === 'recent') {
				return getRecent().map(function (x) {
					return { topicKey: x.topicKey || '', topicTitle: (topics[x.topicKey] && topics[x.topicKey].title) ? topics[x.topicKey].title : (x.topicKey || ''), type: x.type || '', name: x.name || '', url: x.url };
				});
			}
			return globalIndex;
		}

		function renderResults(list, q) {
			if (!results) return;
			if (!q && (scope.value === 'topic')) { results.classList.add('hidden'); results.innerHTML = ''; return; }
			results.classList.remove('hidden');
			if (!list.length) {
				results.innerHTML = '<p class="text-xs text-gray-500 dark:text-gray-400">No matches.</p>';
				return;
			}
			var html = '<div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">' +
				'<div class="px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">' +
				'Showing <strong>' + list.length + '</strong> result(s)</div><ul class="divide-y divide-gray-200 dark:divide-gray-800">';
			list.slice(0, 30).forEach(function (it) {
				var fav = isFavorite(it.url);
				html += '<li class="p-3 flex items-start gap-3">' +
					'<button type="button" class="res-open flex-1 min-w-0 text-left" data-url="' + escapeHtml(it.url) + '" data-name="' + escapeHtml(it.name || '') + '" data-type="' + escapeHtml(it.type || '') + '">' +
					'<div class="font-semibold text-gray-800 dark:text-gray-100 truncate">' + escapeHtml(it.name || it.url) + '</div>' +
					'<div class="text-[11px] text-gray-500 dark:text-gray-400 truncate">' + escapeHtml(typeLabel(it.type)) + (it.topicTitle ? (' · ' + escapeHtml(it.topicTitle)) : '') + '</div>' +
					'</button>' +
					'<button type="button" class="res-fav px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-xs font-semibold ' + (fav ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20' : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900') + '" data-url="' + escapeHtml(it.url) + '" data-name="' + escapeHtml(it.name || '') + '" data-type="' + escapeHtml(it.type || '') + '" title="Save">' +
					(fav ? '★' : '☆') + '</button>' +
					'</li>';
			});
			html += '</ul></div>';
			results.innerHTML = html;

			results.querySelectorAll('.res-open').forEach(function (btn) {
				btn.addEventListener('click', function () {
					var url = btn.getAttribute('data-url');
					var name = btn.getAttribute('data-name') || '';
					var tp = btn.getAttribute('data-type') || '';
					if (url) {
						recordRecentOpen(url, name, tp);
						openResourcePopup(url, name);
					}
				});
			});
			results.querySelectorAll('.res-fav').forEach(function (btn) {
				btn.addEventListener('click', function (e) {
					e.preventDefault();
					var url = btn.getAttribute('data-url');
					var name = btn.getAttribute('data-name') || '';
					var tp = btn.getAttribute('data-type') || '';
					toggleFavorite({ url: url, name: name, type: tp, topicKey: topicKey });
					// re-render in place
					runSearch();
				});
			});
		}

		function runSearch() {
			var q = (input && input.value) ? input.value.trim().toLowerCase() : '';
			var scopeVal = scope ? scope.value : 'topic';
			var typeVal = type ? type.value : 'all';
			var base = getScopeItems(scopeVal);
			var filtered = base.filter(function (it) { return matches(it, q, typeVal); });
			renderResults(filtered, q);
		}

		if (input) input.addEventListener('input', runSearch);
		if (scope) scope.addEventListener('change', runSearch);
		if (type) type.addEventListener('change', runSearch);
		runSearch();
	}

	function isValidYouTubeVideoId(id) {
		return typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id.trim());
	}
	function isValidYouTubePlaylistId(id) {
		return typeof id === 'string' && /^PL[\w-]{10,}$/.test(id.trim());
	}
	function isValidYouTubeEntry(v) {
		if (!v || !v.id) return false;
		return v.playlist ? isValidYouTubePlaylistId(v.id) : isValidYouTubeVideoId(v.id);
	}

	function setDocumentTitle(topic) {
		if (topic && topic.title) {
			document.title = topic.title + ' | Resources | Standalone Playground';
		}
	}

	function updateUrl(topicKey) {
		try {
			var search = new URLSearchParams(window.location.search);
			search.set('topic', topicKey);
			var newUrl = window.location.pathname + '?' + search.toString();
			history.replaceState(null, '', newUrl);
		} catch (e) {}
	}

	function renderTopic(topicKey, topics) {
		var t = topics[topicKey];
		resCurrentTopicKey = topicKey;
		resCurrentTopicMeta = t;
		if (!t) {
			root.classList.add('hidden');
			notFound.classList.remove('hidden');
			return;
		}

		root.classList.remove('hidden');
		notFound.classList.add('hidden');
		setDocumentTitle(t);

		// Remember last topic for Home "Continue learning" card
		try {
			localStorage.setItem(LAST_TOPIC_KEY, topicKey);
			if (t && t.title) localStorage.setItem(LAST_TOPIC_TITLE_KEY, t.title);
		} catch (e) {}

		var topicKeys = Object.keys(topics);
		var booksCount = (t.books && t.books.length) || 0;
		var blogsCount = (t.blogs && t.blogs.length) || 0;
		var coursesCount = (t.courses && t.courses.length) || 0;
		var githubCount = (t.github && t.github.length) || 0;
		var videosCount = (t.youtube && t.youtube.length) || 0;

		var html = '';
		html += '<div id="resources-search-wrap"></div>';
		html += '<div class="mb-4 flex flex-wrap items-center justify-between gap-3">';
		html += '  <a href="./playground.html" class="text-primary hover:underline text-sm">← Back to Playground</a>';
		html += '  <div class="flex items-center gap-2 text-sm">';
		html += '    <label for="topic-select" class="text-gray-600 dark:text-gray-300">Topic:</label>';
		html += '    <select id="topic-select" class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-2 py-1 text-sm">';
		topicKeys.forEach(function (key) {
			var meta = topics[key];
			var label = meta && meta.title ? meta.title : key;
			html += '<option value="' + key + '"' + (key === topicKey ? ' selected' : '') + '>' + label + '</option>';
		});
		html += '    </select>';
		html += '  </div>';
		html += '</div>';

		html += '<h1 class="text-3xl font-bold mb-2">Learning Studio: ' + (t.title || '') + '</h1>';
		if (t.summary) {
			html += '<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">' + t.summary + '</p>';
		}
		html += '<div class="mb-6 flex flex-wrap gap-2 text-xs">';
		html += '<span class="px-3 py-1 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">Videos: <strong>' + videosCount + '</strong></span>';
		html += '<span class="px-3 py-1 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">Courses: <strong>' + coursesCount + '</strong></span>';
		html += '<span class="px-3 py-1 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">Books/Blogs: <strong>' + (booksCount + blogsCount) + '</strong></span>';
		html += '<span class="px-3 py-1 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">GitHub Repos: <strong>' + githubCount + '</strong></span>';
		html += '</div>';
		// Help users learn properly: suggested order (Notion-style callout)
		html += '<div class="mb-6 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">';
		html += '<p class="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">How to use this page</p>';
		html += '<ol class="text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside space-y-1">';
		html += '<li><strong>YouTube</strong> — Watch a short intro or full course to get the big picture.</li>';
		html += '<li><strong>Read / Books</strong> — Deepen with official docs, books, and blogs.</li>';
		html += '<li><strong>Courses</strong> — Follow a structured path (e.g. Coursera, freeCodeCamp).</li>';
		html += '<li><strong>Best</strong> — Curated playlists and lists for this topic.</li>';
		html += '</ol><p class="text-xs text-gray-500 dark:text-gray-500 mt-2">Pick one tab and work through it; then move to the next. Use the roadmap link below for a full skill checklist.</p></div>';

		// Quick study shortcuts: topic-aware search links on big free sites
		var quickLabel = encodeURIComponent(t.title || topicKey);
		html += '<div class="mb-6 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40">';
		html += '<p class="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Quick study shortcuts</p>';
		html += '<p class="text-[11px] text-gray-500 dark:text-gray-400 mb-2">One click to search popular free sites for this topic.</p>';
		html += '<div class="flex flex-wrap gap-2 text-xs">';
		html += '<a href="https://www.geeksforgeeks.org/?s=' + quickLabel + '" target="_blank" rel="noopener" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">GeeksforGeeks search</a>';
		html += '<a href="https://www.analyticsvidhya.com/?s=' + quickLabel + '" target="_blank" rel="noopener" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Analytics Vidhya search</a>';
		html += '<a href="https://www.freecodecamp.org/news/search/?query=' + quickLabel + '" target="_blank" rel="noopener" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">freeCodeCamp News search</a>';
		html += '</div></div>';
		var roadmapUrl = (t.roadmapUrl || '').trim();
		if (roadmapUrl) {
			html += '<div class="mb-6 rounded-xl border-2 border-primary/30 bg-primary/5 dark:bg-primary/10 overflow-hidden" data-topic-roadmap="' + escapeHtml(topicKey) + '">';
			html += '<div class="p-4">';
			html += '<p class="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Study Roadmap</p>';
			html += '<p class="text-xs text-gray-600 dark:text-gray-400 mb-3">Interactive skill checklist from roadmap.sh. Expand the preview below or open it in a new tab to track your progress.</p>';
			html += '<div class="flex flex-wrap items-center gap-3 mb-3">';
			html += '<a href="' + roadmapUrl + '" target="_blank" rel="noopener" class="inline-flex items-center gap-1 rounded-lg bg-primary text-white px-4 py-2 text-sm font-semibold hover:opacity-90">Open full roadmap →</a>';
			html += '<label class="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">';
			html += '<input type="checkbox" class="topic-roadmap-track-cb rounded border-gray-300 dark:border-gray-600 text-primary" data-topic-key="' + escapeHtml(topicKey) + '" aria-label="I\'m following this roadmap">';
			html += '<span>I\'m following this roadmap</span></label>';
			html += '<button type="button" class="roadmap-embed-toggle text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" data-roadmap-url="' + escapeHtml(roadmapUrl) + '">Show preview</button>';
			html += '</div></div>';
			html += '<div class="roadmap-embed-container hidden border-t border-primary/20" style="height:0;overflow:hidden;transition:height 0.3s ease">';
			html += '<iframe class="roadmap-embed-iframe" src="about:blank" style="width:100%;height:500px;border:none" loading="lazy" title="Roadmap preview"></iframe>';
			html += '<p class="text-[11px] text-gray-500 dark:text-gray-400 p-2 text-center">If the preview is blank, the site may restrict embedding. Use <strong>Open full roadmap</strong> above.</p>';
			html += '</div>';
			html += '</div>';
		}

		// Notion-style top tabs (mobile friendly)
		html += '<div class="mb-6 flex flex-wrap gap-2 rounded-full bg-gray-100 dark:bg-gray-800 p-1 text-xs sm:text-sm sticky top-[64px] z-10">';
		html += '<button type="button" data-tab="youtube" class="tab-btn px-3 py-2 rounded-full bg-white dark:bg-gray-900 text-primary font-semibold shadow-sm min-h-[40px]">YouTube</button>';
		html += '<button type="button" data-tab="articles" class="tab-btn px-3 py-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-white/70 min-h-[40px]">Articles</button>';
		html += '<button type="button" data-tab="books" class="tab-btn px-3 py-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-white/70 min-h-[40px]">Books</button>';
		html += '<button type="button" data-tab="github" class="tab-btn px-3 py-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-white/70 min-h-[40px]">GitHub</button>';
		html += '<button type="button" data-tab="reading" class="tab-btn px-3 py-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-white/70 min-h-[40px]">Reading</button>';
		html += '<button type="button" data-tab="focus" class="tab-btn px-3 py-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-white/70 min-h-[40px]">Focus</button>';
		html += '</div>';

		html += '<div id="tab-panels" class="space-y-6">';

		// Panel: YouTube
		html += '<section data-tab-panel="youtube" class="rounded-2xl border-2 border-gray-200 bg-white dark:bg-gray-900 overflow-hidden material-elevation-1">';
		html += '<div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between gap-2">';
		html += '<h2 class="text-lg font-bold flex items-center gap-2">▶ YouTube</h2>';
		html += '<p class="text-xs text-gray-500 dark:text-gray-400">Primary player on the left, queue of videos on the right.</p>';
		html += '</div>';
		html += '<div id="yt-panel" class="p-5"></div>';
		html += '</section>';

		// View mode (Gallery/List) applies across Books/GitHub/Reading panels
		resourceViewMode = getResourceViewMode();
		var readViewClass = resourceViewMode === 'list' ? 'resource-list' : 'resource-gallery';

		function viewToggleHtml() {
			return '<div class="resource-view-toggle" role="group" aria-label="View mode">' +
				'<button type="button" class="resource-view-btn ' + (resourceViewMode === 'gallery' ? 'active' : '') + '" data-view="gallery">Gallery</button>' +
				'<button type="button" class="resource-view-btn ' + (resourceViewMode === 'list' ? 'active' : '') + '" data-view="list">List</button>' +
				'</div>';
		}

		function cardWithThumb(url, name, meta, icon) {
			var thumb = icon || '📄';
			var domain = '';
			try { domain = (new URL(url)).hostname.replace(/^www\./, ''); } catch (e) {}
			var favicon = domain ? ('https://www.google.com/s2/favicons?domain=' + encodeURIComponent(domain) + '&sz=64') : '';
			var safeUrl = escapeHtml(url);
			var safeName = escapeHtml(name || '');
			var safeMeta = escapeHtml(meta || '');
			return '<button type="button" class="resource-card-with-thumb flex rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden hover:border-primary/50 hover:shadow-md transition-all w-full text-left" data-resource-url="' + safeUrl + '" data-resource-name="' + safeName + '">' +
				'<div class="resource-card-thumb w-20 flex-shrink-0 flex flex-col items-center justify-center gap-1 text-2xl bg-gray-100 dark:bg-gray-800">' +
				(favicon ? ('<img src="' + escapeHtml(favicon) + '" alt="" loading="lazy" style="width:28px;height:28px;border-radius:6px">') : '') +
				'<span aria-hidden="true" style="font-size:18px;line-height:1">' + thumb + '</span>' +
				'</div>' +
				'<div class="p-3 flex-1 min-w-0">' +
				'<div class="font-semibold text-gray-800 dark:text-gray-100 truncate">' + safeName + '</div>' +
				'<div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">' + safeMeta + (domain ? (' · ' + escapeHtml(domain)) : '') + '</div>' +
				'</div></button>';
		}
		// Panel: Articles (live feed)
		html += '<section data-tab-panel="articles" class="hidden rounded-2xl border-2 border-gray-200 bg-white dark:bg-gray-900 overflow-hidden material-elevation-1">';
		html += '<div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-wrap items-center justify-between gap-2">';
		html += '<div><h2 class="text-lg font-bold">📰 Articles</h2><p class="text-xs text-gray-500 dark:text-gray-400">Fresh links from Medium/TDS, Dev.to, Reddit, Hacker News, freeCodeCamp.</p></div>';
		html += '<button type="button" id="resource-live-refresh" class="text-[11px] sm:text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[36px]">Refresh</button>';
		html += '</div>';
		html += '<div id="resource-live-trends" class="p-4 sm:p-5 space-y-4">';
		html += '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">';
		html += '<div class="space-y-1"><p class="text-xs font-semibold text-gray-600 dark:text-gray-300">Medium / TDS</p><ul id="resource-live-medium-list" class="space-y-1 text-xs text-gray-700 dark:text-gray-200"></ul><p id="resource-live-medium-status" class="text-[11px] text-gray-500 dark:text-gray-500"></p></div>';
		html += '<div class="space-y-1"><p class="text-xs font-semibold text-gray-600 dark:text-gray-300">Dev.to</p><ul id="resource-live-devto-list" class="space-y-1 text-xs text-gray-700 dark:text-gray-200"></ul><p id="resource-live-devto-status" class="text-[11px] text-gray-500 dark:text-gray-500"></p></div>';
		html += '<div class="space-y-1"><p class="text-xs font-semibold text-gray-600 dark:text-gray-300">Reddit</p><ul id="resource-live-reddit-list" class="space-y-1 text-xs text-gray-700 dark:text-gray-200"></ul><p id="resource-live-reddit-status" class="text-[11px] text-gray-500 dark:text-gray-500"></p></div>';
		html += '<div class="space-y-1"><p class="text-xs font-semibold text-gray-600 dark:text-gray-300">Hacker News</p><ul id="resource-live-hn-list" class="space-y-1 text-xs text-gray-700 dark:text-gray-200"></ul><p id="resource-live-hn-status" class="text-[11px] text-gray-500 dark:text-gray-500"></p></div>';
		html += '<div class="space-y-1"><p class="text-xs font-semibold text-gray-600 dark:text-gray-300">freeCodeCamp</p><ul id="resource-live-fcc-list" class="space-y-1 text-xs text-gray-700 dark:text-gray-200"></ul><p id="resource-live-fcc-status" class="text-[11px] text-gray-500 dark:text-gray-500"></p></div>';
		html += '</div></div></section>';

		// Panel: Books
		html += '<section data-tab-panel="books" class="hidden rounded-2xl border-2 border-gray-200 bg-white dark:bg-gray-900 overflow-hidden material-elevation-1">';
		html += '<div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-wrap items-center justify-between gap-2">';
		html += '<div><h2 class="text-lg font-bold">📚 Books & docs</h2><p class="text-xs text-gray-500 dark:text-gray-400">Official docs + books for ' + escapeHtml(t.title || topicKey) + '.</p></div>' + viewToggleHtml();
		html += '</div><div class="p-4 space-y-4 text-sm">';
		if (t.books && t.books.length) {
			html += '<div class="resource-cards-wrap books-cards ' + readViewClass + '">';
			t.books.forEach(function (r) { html += cardWithThumb(r.url, r.name, 'Book / docs', '📖'); });
			html += '</div>';
		} else {
			html += '<p class="text-sm text-gray-500">(no books/docs added yet)</p>';
		}
		html += '</div></section>';

		// Panel: GitHub
		html += '<section data-tab-panel="github" class="hidden rounded-2xl border-2 border-gray-200 bg-white dark:bg-gray-900 overflow-hidden material-elevation-1">';
		html += '<div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-wrap items-center justify-between gap-2">';
		html += '<div><h2 class="text-lg font-bold">⭐ GitHub</h2><p class="text-xs text-gray-500 dark:text-gray-400">Repos & curated lists to learn by building.</p></div>' + viewToggleHtml();
		html += '</div><div class="p-4 space-y-4 text-sm">';
		if (t.github && t.github.length) {
			html += '<div><h3 class="font-semibold mb-2">Topic repos</h3><div class="resource-cards-wrap github-cards ' + readViewClass + '">';
			t.github.forEach(function (g) { html += cardWithThumb(g.url, g.name, 'GitHub repo', '⭐'); });
			html += '</div></div>';
		} else {
			html += '<p class="text-sm text-gray-500">(no GitHub repos added yet)</p>';
		}
		html += '<div class="pt-3 border-t border-gray-200 dark:border-gray-700">';
		html += '<h3 class="font-semibold mb-2">Curated mega-lists (always useful)</h3>';
		html += '<ul class="space-y-1 text-sm text-gray-700 dark:text-gray-300">';
		html += '<li><a href="https://github.com/academic/awesome-datascience" target="_blank" rel="noopener" class="underline hover:text-primary">awesome-datascience</a></li>';
		html += '<li><a href="https://github.com/josephmisiti/awesome-machine-learning" target="_blank" rel="noopener" class="underline hover:text-primary">awesome-machine-learning</a></li>';
		html += '<li><a href="https://github.com/awesomedata/awesome-public-datasets" target="_blank" rel="noopener" class="underline hover:text-primary">awesome-public-datasets</a></li>';
		html += '<li><a href="https://github.com/EbookFoundation/free-programming-books" target="_blank" rel="noopener" class="underline hover:text-primary">free-programming-books</a></li>';
		html += '</ul></div>';
		html += '</div></section>';

		// Panel: Reading (blogs, reddit, courses, paths)
		html += '<section data-tab-panel="reading" class="hidden rounded-2xl border-2 border-gray-200 bg-white dark:bg-gray-900 overflow-hidden material-elevation-1">';
		html += '<div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-wrap items-center justify-between gap-2">';
		html += '<div><h2 class="text-lg font-bold">📖 Reading</h2><p class="text-xs text-gray-500 dark:text-gray-400">Blogs, communities, courses & suggested paths.</p></div>' + viewToggleHtml();
		html += '</div><div class="p-4 space-y-5 text-sm">';
		if (t.blogs && t.blogs.length) {
			html += '<div><h3 class="font-semibold mb-2">Blogs & long reads</h3><div class="resource-cards-wrap blogs-cards ' + readViewClass + '">';
			t.blogs.forEach(function (b) { html += cardWithThumb(b.url, b.name, 'Blog / article', '📄'); });
			html += '</div></div>';
		}
		if (t.reddit && t.reddit.length) {
			html += '<div><h3 class="font-semibold mb-2">Communities</h3><div class="resource-cards-wrap reddit-cards ' + readViewClass + '">';
			t.reddit.forEach(function (r) {
				var url = r.url || ('https://www.reddit.com/r/' + (r.subreddit || r.name || '').replace(/^r\//, '') + '/');
				html += cardWithThumb(url, r.name || ('r/' + (r.subreddit || '')), 'Reddit', '🔴');
			});
			html += '</div></div>';
		}
		if (t.courses && t.courses.length) {
			html += '<div><h3 class="font-semibold mb-2">Courses</h3><div class="resource-cards-wrap courses-cards ' + readViewClass + '">';
			t.courses.forEach(function (c) { html += cardWithThumb(c.url, c.name, 'Course', '🎓'); });
			html += '</div></div>';
		}
		if (t.paths && t.paths.length) {
			html += '<div><h3 class="font-semibold mb-2">Suggested path</h3><ul class="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">';
			t.paths.forEach(function (p) { html += '<li>' + escapeHtml(p) + '</li>'; });
			html += '</ul></div>';
		}
		if ((!t.blogs || !t.blogs.length) && (!t.reddit || !t.reddit.length) && (!t.courses || !t.courses.length) && (!t.paths || !t.paths.length)) {
			html += '<p class="text-sm text-gray-500">(no reading items yet)</p>';
		}
		html += '</div></section>';

		// Panel: Focus & Ambiance — lo-fi radio, ambient scenes, study zone
		html += '<section data-tab-panel="focus" class="hidden rounded-2xl border-2 border-gray-200 bg-white dark:bg-gray-900 overflow-hidden material-elevation-1">';
		html += '<div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">';
		html += '<h2 class="text-lg font-bold flex items-center gap-2">\u{1F3A7} Focus & Ambiance</h2>';
		html += '<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Lo-fi radio, ambient scenes, and study vibes. Layer sounds together for your perfect focus setup.</p>';
		html += '</div>';
		html += '<div class="p-5 space-y-6">';

		html += '<div>';
		html += '<h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-1">Lo-fi & Ambient Radio</h3>';
		html += '<p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Direct audio streams \u2014 no ads, no YouTube needed. Click to play, click again to stop.</p>';
		html += '<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2" id="focus-stations-grid">';
		FOCUS_STATIONS.forEach(function (s, i) {
			html += '<button type="button" class="focus-station-card text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary/50 hover:shadow-md transition-all" data-station-idx="' + i + '">';
			html += '<div class="text-2xl mb-1">' + s.icon + '</div>';
			html += '<div class="text-sm font-semibold text-gray-800 dark:text-gray-100">' + escapeHtml(s.name) + '</div>';
			html += '<div class="text-[11px] text-gray-500 dark:text-gray-400">' + escapeHtml(s.desc) + '</div>';
			html += '</button>';
		});
		html += '</div>';
		html += '<div id="focus-radio-now" class="mt-3 flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" style="display:none">';
		html += '<div class="flex items-center gap-2 min-w-0">';
		html += '<span class="focus-pulse-dot"></span>';
		html += '<span id="focus-radio-name" class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">\u2014</span>';
		html += '</div>';
		html += '<div class="flex items-center gap-2 flex-shrink-0">';
		html += '<button type="button" id="focus-radio-toggle" class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm hover:opacity-90" aria-label="Pause radio">\u23F8</button>';
		html += '<input type="range" id="focus-radio-vol" min="0" max="100" value="70" class="w-20 accent-primary" aria-label="Volume">';
		html += '</div>';
		html += '</div>';
		html += '</div>';

		html += '<div>';
		html += '<h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-1">Ambient Scenes</h3>';
		html += '<p class="text-xs text-gray-500 dark:text-gray-400 mb-3">YouTube ambient loops \u2014 rain, cafe, fireplace. Layer with radio above for the perfect mix.</p>';
		html += '<div class="grid grid-cols-2 sm:grid-cols-4 gap-2" id="focus-scenes-grid">';
		AMBIENT_SCENES.forEach(function (s, i) {
			html += '<button type="button" class="focus-scene-card text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary/50 hover:shadow-md transition-all" data-scene-idx="' + i + '">';
			html += '<div class="text-2xl mb-1">' + s.icon + '</div>';
			html += '<div class="text-sm font-semibold text-gray-800 dark:text-gray-100">' + escapeHtml(s.name) + '</div>';
			html += '<div class="text-[11px] text-gray-500 dark:text-gray-400">' + escapeHtml(s.desc) + '</div>';
			html += '</button>';
		});
		html += '</div>';
		html += '<div id="focus-scene-player" class="mt-3" style="display:none">';
		html += '<div class="rounded-xl overflow-hidden bg-black" style="aspect-ratio:16/9;max-height:360px">';
		html += '<iframe id="focus-scene-iframe" class="w-full h-full" src="about:blank" allow="autoplay" allowfullscreen title="Ambient scene"></iframe>';
		html += '</div>';
		html += '<div class="flex flex-wrap items-center justify-between gap-2 mt-2">';
		html += '<span id="focus-scene-name" class="text-sm font-medium text-gray-800 dark:text-gray-100">\u2014</span>';
		html += '<div class="flex items-center gap-3 text-xs">';
		html += '<label class="flex items-center gap-1 text-gray-600 dark:text-gray-300 cursor-pointer"><input type="checkbox" id="focus-piped-toggle" class="rounded border-gray-300 accent-primary"' + (focusPiped ? ' checked' : '') + '> Use Piped</label>';
		html += '<a id="focus-scene-yt-link" href="#" target="_blank" rel="noopener" class="text-primary hover:underline">Open on YouTube \u2192</a>';
		html += '<button type="button" id="focus-scene-close" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">\u2715 Close</button>';
		html += '</div>';
		html += '</div>';
		html += '</div>';
		html += '</div>';

		html += '<div class="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-200">';
		html += '\u{1F4A1} <strong>Tip:</strong> Play a radio station AND an ambient scene at the same time \u2014 the radio uses device audio, the scene uses YouTube, so they layer naturally for the perfect study vibe.';
		html += '</div>';
		html += '</div></section>';

		html += '</div>';
		root.innerHTML = html;
		try {
			var boot = document.getElementById('resources-boot-banner');
			if (boot) boot.textContent = 'Resources rendered.';
		} catch (e) {}
		renderSearchAndInsights(topicKey, topics, t);

		// Resource cards: open in same-page popup (Notion/Medium-style)
		root.querySelectorAll('.resource-card-with-thumb[data-resource-url]').forEach(function (btn) {
			btn.addEventListener('click', function () {
				var url = btn.getAttribute('data-resource-url');
				var name = btn.getAttribute('data-resource-name') || '';
				if (url) openResourcePopup(url, name);
			});
		});
		// View toggle (Gallery / List)
		function applyViewMode(view) {
			setResourceViewMode(view);
			var isList = view === 'list';
			var cls = isList ? 'resource-list' : 'resource-gallery';
			root.querySelectorAll('.resource-cards-wrap').forEach(function (wrap) {
				wrap.classList.remove('resource-gallery', 'resource-list');
				wrap.classList.add(cls);
			});
			root.querySelectorAll('.resource-view-btn').forEach(function (b) {
				b.classList.toggle('active', b.getAttribute('data-view') === view);
			});
		}
		root.querySelectorAll('.resource-view-btn').forEach(function (btn) {
			btn.addEventListener('click', function () {
				var view = btn.getAttribute('data-view');
				if (view) applyViewMode(view);
			});
		});

		// Per-topic roadmap "I'm following" checkbox — persisted in localStorage
		var topicTrackPrefix = 'resources_topic_roadmap_';
		root.querySelectorAll('.topic-roadmap-track-cb').forEach(function (cb) {
			var key = cb.getAttribute('data-topic-key');
			if (!key) return;
			try {
				var stored = localStorage.getItem(topicTrackPrefix + key);
				cb.checked = stored === 'true';
			} catch (err) { /* ignore */ }
			cb.addEventListener('change', function () {
				try {
					localStorage.setItem(topicTrackPrefix + key, cb.checked ? 'true' : 'false');
				} catch (err) { /* ignore */ }
			});
		});

		// Roadmap embed toggle
		root.querySelectorAll('.roadmap-embed-toggle').forEach(function (btn) {
			btn.addEventListener('click', function () {
				var container = btn.closest('[data-topic-roadmap]').querySelector('.roadmap-embed-container');
				var iframe = container ? container.querySelector('.roadmap-embed-iframe') : null;
				if (!container) return;
				var isOpen = !container.classList.contains('hidden');
				if (isOpen) {
					container.style.height = '0';
					setTimeout(function () { container.classList.add('hidden'); }, 300);
					btn.textContent = 'Show preview';
					if (iframe) iframe.src = 'about:blank';
				} else {
					container.classList.remove('hidden');
					container.style.height = '520px';
					btn.textContent = 'Hide preview';
					if (iframe && iframe.src === 'about:blank') {
						iframe.src = btn.getAttribute('data-roadmap-url');
					}
				}
			});
		});

		var selectEl = document.getElementById('topic-select');
		if (selectEl) {
			selectEl.addEventListener('change', function () {
				var nextKey = selectEl.value;
				updateUrl(nextKey);
				renderTopic(nextKey, topics);
			});
		}

		var buttons = root.querySelectorAll('.tab-btn');
		var panels = root.querySelectorAll('[data-tab-panel]');
		buttons.forEach(function (btn) {
			btn.addEventListener('click', function () {
				var target = btn.getAttribute('data-tab');
				buttons.forEach(function (b) {
					b.classList.remove('bg-white', 'dark:bg-gray-900', 'text-primary', 'font-semibold', 'shadow-sm');
					b.classList.add('text-gray-700', 'dark:text-gray-200');
				});
				btn.classList.add('bg-white', 'dark:bg-gray-900', 'text-primary', 'font-semibold', 'shadow-sm');
				btn.classList.remove('text-gray-700', 'dark:text-gray-200');
				panels.forEach(function (p) {
					if (p.getAttribute('data-tab-panel') === target) p.classList.remove('hidden');
					else p.classList.add('hidden');
				});
			});
		});

		// Focus & Ambiance panel: radio stations + ambient scenes
		(function setupFocusPanel() {
			var stationsGrid = root.querySelector('#focus-stations-grid');
			var radioNow = root.querySelector('#focus-radio-now');
			var radioName = root.querySelector('#focus-radio-name');
			var radioToggle = root.querySelector('#focus-radio-toggle');
			var radioVol = root.querySelector('#focus-radio-vol');
			var scenesGrid = root.querySelector('#focus-scenes-grid');
			var scenePlayer = root.querySelector('#focus-scene-player');
			var sceneIframe = root.querySelector('#focus-scene-iframe');
			var sceneName = root.querySelector('#focus-scene-name');
			var sceneLink = root.querySelector('#focus-scene-yt-link');
			var sceneClose = root.querySelector('#focus-scene-close');
			var pipedCb = root.querySelector('#focus-piped-toggle');

			function stopFocusRadio() {
				if (focusAudio) { focusAudio.pause(); focusAudio.src = ''; }
				focusPlayingIdx = -1;
				if (radioNow) radioNow.style.display = 'none';
				if (stationsGrid) stationsGrid.querySelectorAll('.focus-station-card').forEach(function (c) { c.classList.remove('focus-station-active'); });
			}

			function playStation(idx) {
				var s = FOCUS_STATIONS[idx];
				if (!s) return;
				if (focusPlayingIdx === idx && focusAudio && !focusAudio.paused) {
					stopFocusRadio();
					return;
				}
				if (!focusAudio) {
					focusAudio = new Audio();
					focusAudio.addEventListener('error', function () {
						if (radioName) radioName.textContent = 'Stream unavailable \u2014 try another';
					});
				}
				focusAudio.src = s.url;
				focusAudio.volume = (radioVol ? radioVol.value : 70) / 100;
				focusAudio.play().catch(function () {});
				focusPlayingIdx = idx;
				if (radioName) radioName.textContent = s.icon + ' ' + s.name;
				if (radioNow) radioNow.style.display = 'flex';
				if (radioToggle) radioToggle.textContent = '\u23F8';
				if (stationsGrid) {
					stationsGrid.querySelectorAll('.focus-station-card').forEach(function (c, ci) {
						c.classList.toggle('focus-station-active', ci === idx);
					});
				}
			}

			if (stationsGrid) {
				stationsGrid.addEventListener('click', function (e) {
					var card = e.target.closest('.focus-station-card');
					if (!card) return;
					var idx = parseInt(card.getAttribute('data-station-idx'), 10);
					if (!isNaN(idx)) playStation(idx);
				});
			}

			if (radioToggle) {
				radioToggle.addEventListener('click', function () {
					if (!focusAudio) return;
					if (focusAudio.paused) {
						focusAudio.play().catch(function () {});
						radioToggle.textContent = '\u23F8';
					} else {
						focusAudio.pause();
						radioToggle.textContent = '\u25B6';
					}
				});
			}

			if (radioVol) {
				radioVol.addEventListener('input', function () {
					if (focusAudio) focusAudio.volume = radioVol.value / 100;
				});
			}

			var currentSceneIdx = -1;
			function getSceneEmbedUrl(id) {
				var base = focusPiped ? 'https://piped.video/embed/' : 'https://www.youtube-nocookie.com/embed/';
				return base + id + '?autoplay=1&loop=1';
			}

			function loadScene(idx) {
				var s = AMBIENT_SCENES[idx];
				if (!s) return;
				if (currentSceneIdx === idx && scenePlayer && scenePlayer.style.display !== 'none') {
					if (sceneIframe) sceneIframe.src = 'about:blank';
					if (scenePlayer) scenePlayer.style.display = 'none';
					currentSceneIdx = -1;
					if (scenesGrid) scenesGrid.querySelectorAll('.focus-scene-card').forEach(function (c) { c.classList.remove('focus-scene-active'); });
					return;
				}
				currentSceneIdx = idx;
				if (sceneIframe) sceneIframe.src = getSceneEmbedUrl(s.id);
				if (sceneName) sceneName.textContent = s.icon + ' ' + s.name;
				if (sceneLink) {
					sceneLink.href = (focusPiped ? 'https://piped.video/watch?v=' : 'https://www.youtube.com/watch?v=') + s.id;
					sceneLink.textContent = focusPiped ? 'Open on Piped \u2192' : 'Open on YouTube \u2192';
				}
				if (scenePlayer) scenePlayer.style.display = 'block';
				if (scenesGrid) {
					scenesGrid.querySelectorAll('.focus-scene-card').forEach(function (c, ci) {
						c.classList.toggle('focus-scene-active', ci === idx);
					});
				}
			}

			if (scenesGrid) {
				scenesGrid.addEventListener('click', function (e) {
					var card = e.target.closest('.focus-scene-card');
					if (!card) return;
					var idx = parseInt(card.getAttribute('data-scene-idx'), 10);
					if (!isNaN(idx)) loadScene(idx);
				});
			}

			if (pipedCb) {
				pipedCb.addEventListener('change', function () {
					focusPiped = pipedCb.checked;
					try { localStorage.setItem('resources_focus_piped', focusPiped ? '1' : '0'); } catch (e) { /* ignore */ }
					if (currentSceneIdx >= 0) loadScene(currentSceneIdx);
				});
			}

			if (sceneClose) {
				sceneClose.addEventListener('click', function () {
					if (sceneIframe) sceneIframe.src = 'about:blank';
					if (scenePlayer) scenePlayer.style.display = 'none';
					currentSceneIdx = -1;
					if (scenesGrid) scenesGrid.querySelectorAll('.focus-scene-card').forEach(function (c) { c.classList.remove('focus-scene-active'); });
				});
			}
		})();

		// YouTube panel: simple hero player + Notion-style list of videos/playlists underneath
		(function setupYouTubePanel(topic) {
			var panel = root.querySelector('[data-tab-panel="youtube"]');
			if (!panel) return;
			var container = panel.querySelector('#yt-panel');
			if (!container) return;

			var vids = (topic.youtube || []).filter(isValidYouTubeEntry).slice(0, 20);
			if (!vids.length) {
				container.innerHTML = '<p class="text-sm text-gray-500">(no valid curated videos for this topic yet)</p>';
				return;
			}

			function pickInitialIndex(list) {
				var idx = -1;
				for (var i = 0; i < list.length; i++) {
					var v0 = list[i];
					if (v0 && v0.embed && !v0.playlist) {
						idx = i;
						break;
					}
				}
				if (idx === -1) idx = 0;
				return idx;
			}

			function render(heroIdx) {
				container.innerHTML = '';

				if (heroIdx == null || heroIdx < 0 || heroIdx >= vids.length) {
					heroIdx = pickInitialIndex(vids);
				}

				var wrap = document.createElement('div');
				wrap.className = 'space-y-3';

				// Hero player
				var hv = vids[heroIdx];
				var embedId = (hv.id || '').trim();
				var isPlaylist = hv.playlist && isValidYouTubePlaylistId(embedId);
				var validVideo = !hv.playlist && isValidYouTubeVideoId(embedId);
				if (!isPlaylist && !validVideo) {
					container.innerHTML = '<p class="text-sm text-gray-500">(invalid video/playlist ID in data)</p>';
					return;
				}

				var iframeWrapper = document.createElement('div');
				iframeWrapper.className = 'rounded-lg overflow-hidden bg-black material-elevation-2';
				iframeWrapper.style.aspectRatio = '16 / 9';
				var iframe = document.createElement('iframe');
				iframe.className = 'w-full h-full';
				var ytBase = 'https://www.youtube-nocookie.com/embed';
				if (isPlaylist) {
					iframe.src = ytBase + '/videoseries?list=' + embedId + '&rel=0&modestbranding=1';
				} else {
					iframe.src = ytBase + '/' + embedId + '?rel=0&modestbranding=1';
				}
				iframe.title = hv.title || '';
				iframe.allowFullscreen = true;
				iframeWrapper.appendChild(iframe);
				wrap.appendChild(iframeWrapper);
				var watchLink = document.createElement('a');
				watchLink.href = isPlaylist ? ('https://www.youtube.com/playlist?list=' + embedId) : ('https://www.youtube.com/watch?v=' + embedId);
				watchLink.target = '_blank';
				watchLink.rel = 'noopener';
				watchLink.className = 'text-xs text-primary hover:underline mt-1 inline-block';
				watchLink.textContent = 'Watch on YouTube →';
				wrap.appendChild(watchLink);

				var heroTitle = document.createElement('p');
				heroTitle.className = 'text-sm font-medium text-gray-800 dark:text-gray-100';
				heroTitle.textContent = hv.title || 'YouTube video';
				wrap.appendChild(heroTitle);

				var listWrap = document.createElement('div');
				listWrap.className = 'mt-3 space-y-2';

				for (var j = 0; j < vids.length; j++) {
					var v = vids[j];
					if (!v || !v.id) continue;

					var item = document.createElement('button');
					item.type = 'button';
					item.className =
						'w-full flex items-center gap-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-2 text-xs sm:text-sm';
					item.setAttribute('data-yt-index', String(j));
					if (j === heroIdx) {
						item.className += ' ring-1 ring-primary/60';
					}

					var thumbWrap = document.createElement('div');
					thumbWrap.className = 'w-16 h-10 rounded-md overflow-hidden bg-black flex-shrink-0';
					var img = document.createElement('img');
					img.className = 'w-full h-full object-cover';
					if (!v.playlist) {
						img.src = 'https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg';
					} else {
						img.src = 'https://img.youtube.com/vi/' + (v.thumbnailId || v.id) + '/mqdefault.jpg';
					}
					img.alt = v.title || '';
					thumbWrap.appendChild(img);
					item.appendChild(thumbWrap);

					var metaBox = document.createElement('div');
					metaBox.className = 'flex-1 space-y-0.5';
					var tEl = document.createElement('p');
					tEl.className = 'font-medium text-gray-800 dark:text-gray-100 truncate';
					tEl.textContent = v.title || 'YouTube';
					metaBox.appendChild(tEl);
					if (v.playlist) {
						var badge = document.createElement('span');
						badge.className =
							'inline-flex items-center rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-0.5 text-[10px] font-semibold';
						badge.textContent = 'Playlist';
						metaBox.appendChild(badge);
					}
					item.appendChild(metaBox);

					(function () {
						item.addEventListener('click', function (ev) {
							var idx = parseInt(ev.currentTarget.getAttribute('data-yt-index'), 10);
							if (!isNaN(idx)) {
								render(idx);
							}
						});
					})();

					listWrap.appendChild(item);
				}

				var hint = document.createElement('p');
				hint.className = 'text-xs text-gray-500 dark:text-gray-400';
				hint.textContent = 'Click any card below to change the main player.';
				wrap.appendChild(hint);

				wrap.appendChild(listWrap);
				container.appendChild(wrap);

				// Hindi-friendly quick search helpers
				var hindiRow = document.createElement('div');
				hindiRow.className = 'mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700';
				var hindiTitle = document.createElement('p');
				hindiTitle.className = 'text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1';
				hindiTitle.textContent = 'Prefer Hindi one‑shot tutorials?';
				hindiRow.appendChild(hindiTitle);
				var hindiLinks = document.createElement('div');
				hindiLinks.className = 'flex flex-wrap gap-2 text-[11px] sm:text-xs';

				function makeHindiLink(label, querySuffix) {
					var a = document.createElement('a');
					var base = (topic.title || topicKey || '').trim() || 'data science';
					var q = base + ' ' + querySuffix;
					a.href = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
					a.target = '_blank';
					a.rel = 'noopener';
					a.className = 'inline-flex items-center px-2 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800';
					a.textContent = label;
					return a;
				}

				hindiLinks.appendChild(makeHindiLink('One‑shot Hindi tutorial', 'Hindi one shot full course'));
				hindiLinks.appendChild(makeHindiLink('Topic recap (Hindi)', 'Hindi crash course'));
				hindiRow.appendChild(hindiLinks);
				container.appendChild(hindiRow);

				var searchRow = document.createElement('div');
				searchRow.className = 'flex flex-wrap items-center gap-2 mt-4';
				var searchInput = document.createElement('input');
				searchInput.type = 'text';
				searchInput.placeholder = 'Search YouTube… e.g. ' + (topic.title || '') + ' tutorial';
				searchInput.className = 'flex-1 min-w-[180px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200';
				searchInput.setAttribute('aria-label', 'YouTube search query');
				searchRow.appendChild(searchInput);
				var searchBtnEl = document.createElement('button');
				searchBtnEl.type = 'button';
				searchBtnEl.className =
					'rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800';
				searchBtnEl.textContent = 'Search YouTube';
				searchBtnEl.addEventListener('click', function () {
					var q = (searchInput.value || '').trim() || ('best ' + (topic.title || '') + ' tutorial');
					var url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
					window.open(url, '_blank', 'noopener');
				});
				searchInput.addEventListener('keydown', function (e) {
					if (e.key === 'Enter') searchBtnEl.click();
				});
				searchRow.appendChild(searchBtnEl);
				container.appendChild(searchRow);

				// Recommended channels: tap to show uploads embed (UU = uploads playlist for channel UC...)
				var channels = topic.channels || [];
				if (channels.length) {
					var chSection = document.createElement('div');
					chSection.className = 'mt-6 pt-4 border-t border-gray-200 dark:border-gray-700';
					var chTitle = document.createElement('h3');
					chTitle.className = 'text-sm font-bold text-gray-800 dark:text-gray-100 mb-2';
					chTitle.textContent = 'Recommended channels (tap to load uploads here, or open on YouTube)';
					chSection.appendChild(chTitle);
					var chList = document.createElement('div');
					chList.className = 'flex flex-wrap gap-2';
					channels.forEach(function (ch) {
						if (!ch || !ch.id) return;
						var cid = String(ch.id).trim();
						if (cid.length < 10) return;
						var uploadsListId = (cid.indexOf('UC') === 0) ? ('UU' + cid.slice(2)) : cid;
						var channelUrl = (cid.indexOf('UC') === 0) ? ('https://www.youtube.com/channel/' + cid) : ('https://www.youtube.com/' + cid);
						var btn = document.createElement('button');
						btn.type = 'button';
						btn.className = 'resource-channel-btn px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left';
						btn.setAttribute('data-channel-id', cid);
						btn.setAttribute('data-uploads-list', uploadsListId);
						btn.setAttribute('data-channel-url', channelUrl);
						btn.innerHTML = (ch.name || 'Channel') + (ch.description ? ' <span class="text-gray-500 dark:text-gray-400 font-normal">· ' + ch.description + '</span>' : '');
						chList.appendChild(btn);
					});
					chSection.appendChild(chList);
					var chExpand = document.createElement('div');
					chExpand.className = 'resource-channel-embed-wrap hidden mt-3 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800';
					chSection.appendChild(chExpand);
					container.appendChild(chSection);

					chList.addEventListener('click', function (e) {
						var btn = e.target.closest('.resource-channel-btn');
						if (!btn) return;
						var channelId = btn.getAttribute('data-channel-id');
						var uploadsListId = btn.getAttribute('data-uploads-list');
						var channelUrl = btn.getAttribute('data-channel-url');
						var wrap = container.querySelector('.resource-channel-embed-wrap');
						if (!wrap) return;
						var isOpen = wrap.classList.contains('hidden') === false;
						var sameChannel = wrap.getAttribute('data-current-channel') === channelId;
						if (sameChannel && isOpen) {
							wrap.classList.add('hidden');
							wrap.innerHTML = '';
							wrap.removeAttribute('data-current-channel');
							return;
						}
						wrap.classList.remove('hidden');
						wrap.setAttribute('data-current-channel', channelId);
						wrap.innerHTML = '';
						var embedRow = document.createElement('div');
						embedRow.className = 'p-3 flex flex-col sm:flex-row gap-3';
						var iframeWrap = document.createElement('div');
						iframeWrap.className = 'flex-1 rounded-lg overflow-hidden bg-black';
						iframeWrap.style.aspectRatio = '16 / 9';
						iframeWrap.style.minHeight = '200px';
						var iframe = document.createElement('iframe');
						iframe.className = 'w-full h-full';
						iframe.src = 'https://www.youtube-nocookie.com/embed/videoseries?list=' + uploadsListId + '&rel=0&modestbranding=1';
						iframe.title = 'Channel uploads';
						iframe.allowFullscreen = true;
						iframeWrap.appendChild(iframe);
						embedRow.appendChild(iframeWrap);
						var linkBox = document.createElement('div');
						linkBox.className = 'flex flex-col justify-center gap-2';
						var openLink = document.createElement('a');
						openLink.href = channelUrl;
						openLink.target = '_blank';
						openLink.rel = 'noopener';
						openLink.className = 'text-sm font-semibold text-primary hover:underline';
						openLink.textContent = 'Open channel on YouTube →';
						linkBox.appendChild(openLink);
						var closeBtn = document.createElement('button');
						closeBtn.type = 'button';
						closeBtn.className = 'text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200';
						closeBtn.textContent = 'Close embed';
						closeBtn.addEventListener('click', function () {
							wrap.classList.add('hidden');
							wrap.innerHTML = '';
							wrap.removeAttribute('data-current-channel');
						});
						linkBox.appendChild(closeBtn);
						embedRow.appendChild(linkBox);
						wrap.appendChild(embedRow);
					});
				}
			}

			render();
		})(t);

		// Live topic trends: Medium/TDS tag feed, Dev.to tag feed, Reddit hot posts
		(function setupResourceTrends(topicKeyLocal, topicMeta) {
			var section = document.getElementById('resource-live-trends');
			if (!section) return;

			var cachePrefix = 'resources_live_';
			var ttlMs = 5 * 60 * 1000;

			function applyCache(key, listEl, statusEl) {
				try {
					var raw = sessionStorage.getItem(key);
					if (!raw) return false;
					var data = JSON.parse(raw);
					if (!data || (data.ts && (Date.now() - data.ts > ttlMs))) return false;
					if (listEl && data.html != null) listEl.innerHTML = data.html;
					if (statusEl && data.status != null) statusEl.textContent = data.status;
					return true;
				} catch (e) {
					return false;
				}
			}

			function writeCache(key, html, status) {
				try {
					sessionStorage.setItem(
						key,
						JSON.stringify({ html: html, status: status, ts: Date.now() })
					);
				} catch (e) {}
			}

			function deriveTag() {
				// Prefer Towards Data Science tag URL from blogs; fallback to Medium tag or topic key
				var blogs = (topicMeta && topicMeta.blogs) || [];
				for (var i = 0; i < blogs.length; i++) {
					var u = blogs[i] && blogs[i].url;
					if (!u || typeof u !== 'string') continue;
					var m = u.match(/towardsdatascience\.com\/tagged\/([^/?#]+)/i);
					if (m && m[1]) return decodeURIComponent(m[1]);
					var m2 = u.match(/medium\.com\/tag\/([^/?#]+)/i);
					if (m2 && m2[1]) return decodeURIComponent(m2[1]);
				}
				return (topicKeyLocal || '').toLowerCase();
			}

			function getPrimarySubreddit() {
				var subs = (topicMeta && topicMeta.reddit) || [];
				if (!subs.length) return '';
				var r = subs[0] || {};
				var s = (r.subreddit || r.name || '').trim();
				if (!s) return '';
				return s.replace(/^r\//i, '');
			}

			function loadMedium(forceRefresh) {
				var listEl = document.getElementById('resource-live-medium-list');
				var statusEl = document.getElementById('resource-live-medium-status');
				if (!listEl || !statusEl) return;

				var tag = deriveTag();
				if (!tag) {
					statusEl.textContent = 'No topic-specific Medium/TDS feed configured.';
					listEl.innerHTML = '';
					return;
				}
				var feedUrl = 'https://towardsdatascience.com/feed/tagged/' + encodeURIComponent(tag);
				var cacheKey = cachePrefix + 'medium_' + tag.toLowerCase();
				if (!forceRefresh && applyCache(cacheKey, listEl, statusEl)) return;

				statusEl.textContent = 'Loading latest stories…';
				listEl.innerHTML = '';
				var rssUrl = encodeURIComponent(feedUrl);
				var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + rssUrl + '&api_key=public&count=5';

				fetch(apiUrl)
					.then(function (r) { return r.ok ? r.json() : null; })
					.then(function (data) {
						var items = (data && data.items) || [];
						if (!items.length) {
							statusEl.textContent = 'No recent Medium/TDS stories found.';
							listEl.innerHTML = '';
							writeCache(cacheKey, '', statusEl.textContent);
							return;
						}
						var html = '';
						items.slice(0, 5).forEach(function (item) {
							if (!item) return;
							var title = escapeHtml(item.title || 'Article');
							var url = item.link || item.url || '#';
							var date = '';
							if (item.pubDate) {
								try {
									var d = new Date(item.pubDate);
									if (!isNaN(d.getTime())) {
										date = d.toLocaleDateString();
									}
								} catch (e) {}
							}
							html += '<li><a href="' + url + '" target="_blank" rel="noopener" class="underline hover:text-primary">' + title + '</a>';
							if (date) {
								html += ' <span class="text-[11px] text-gray-500 dark:text-gray-500">· ' + date + '</span>';
							}
							html += '</li>';
						});
						listEl.innerHTML = html;
						statusEl.textContent = 'Updated from Towards Data Science.';
						writeCache(cacheKey, html, statusEl.textContent);
					})
					.catch(function () {
						statusEl.textContent = 'Could not load Medium/TDS right now.';
					});
			}

			function loadDevto(forceRefresh) {
				var listEl = document.getElementById('resource-live-devto-list');
				var statusEl = document.getElementById('resource-live-devto-status');
				if (!listEl || !statusEl) return;

				var tag = deriveTag();
				if (!tag) {
					statusEl.textContent = 'No Dev.to tag configured.';
					listEl.innerHTML = '';
					return;
				}
				var cacheKey = cachePrefix + 'devto_' + tag.toLowerCase();
				if (!forceRefresh && applyCache(cacheKey, listEl, statusEl)) return;

				statusEl.textContent = 'Loading Dev.to posts…';
				listEl.innerHTML = '';
				var apiUrl = 'https://dev.to/api/articles?tag=' + encodeURIComponent(tag) + '&top=7&per_page=5';

				fetch(apiUrl)
					.then(function (r) { return r.ok ? r.json() : null; })
					.then(function (items) {
						if (!Array.isArray(items) || !items.length) {
							statusEl.textContent = 'No recent Dev.to posts for this tag.';
							listEl.innerHTML = '';
							writeCache(cacheKey, '', statusEl.textContent);
							return;
						}
						var html = '';
						items.slice(0, 5).forEach(function (item) {
							if (!item) return;
							var title = escapeHtml(item.title || 'Post');
							var url = item.url || ('https://dev.to' + (item.path || ''));
							var reactions = item.positive_reactions_count || 0;
							html += '<li><a href="' + url + '" target="_blank" rel="noopener" class="underline hover:text-primary">' + title + '</a>';
							if (reactions) {
								html += ' <span class="text-[11px] text-gray-500 dark:text-gray-500">· ' + reactions + ' reactions</span>';
							}
							html += '</li>';
						});
						listEl.innerHTML = html;
						statusEl.textContent = 'Updated from Dev.to.';
						writeCache(cacheKey, html, statusEl.textContent);
					})
					.catch(function () {
						statusEl.textContent = 'Could not load Dev.to right now.';
					});
			}

			function loadReddit(forceRefresh) {
				var listEl = document.getElementById('resource-live-reddit-list');
				var statusEl = document.getElementById('resource-live-reddit-status');
				if (!listEl || !statusEl) return;

				var sub = getPrimarySubreddit();
				if (!sub) {
					statusEl.textContent = 'No subreddit configured for this topic yet.';
					listEl.innerHTML = '';
					return;
				}
				var cacheKey = cachePrefix + 'reddit_' + sub.toLowerCase();
				if (!forceRefresh && applyCache(cacheKey, listEl, statusEl)) return;

				statusEl.textContent = 'Loading hot posts from r/' + sub + '…';
				listEl.innerHTML = '';
				var apiUrl = 'https://www.reddit.com/r/' + encodeURIComponent(sub) + '/hot.json?limit=5';

				fetch(apiUrl, {
					method: 'GET',
					headers: { 'Accept': 'application/json' }
				})
					.then(function (r) { return r.ok ? r.json() : null; })
					.then(function (data) {
						var posts = (data && data.data && Array.isArray(data.data.children)) ? data.data.children : [];
						if (!posts.length) {
							statusEl.textContent = 'No hot posts found for r/' + sub + '.';
							listEl.innerHTML = '';
							writeCache(cacheKey, '', statusEl.textContent);
							return;
						}
						var html = '';
						posts.forEach(function (child) {
							var item = child && child.data;
							if (!item) return;
							var title = escapeHtml(item.title || 'Post');
							var url = item.url || ('https://www.reddit.com' + (item.permalink || ''));
							var score = item.score || 0;
							html += '<li><a href="' + url + '" target="_blank" rel="noopener" class="underline hover:text-primary">' + title + '</a>';
							if (score) {
								html += ' <span class="text-[11px] text-gray-500 dark:text-gray-500">· ' + score + ' upvotes</span>';
							}
							html += '</li>';
						});
						listEl.innerHTML = html;
						statusEl.textContent = 'Updated from r/' + sub + '.';
						writeCache(cacheKey, html, statusEl.textContent);
					})
					.catch(function () {
						statusEl.textContent = 'Could not load Reddit right now.';
					});
			}

			function loadHackerNews(forceRefresh) {
				var listEl = document.getElementById('resource-live-hn-list');
				var statusEl = document.getElementById('resource-live-hn-status');
				if (!listEl || !statusEl) return;

				var tag = deriveTag();
				if (!tag) {
					statusEl.textContent = 'No HN tag configured.';
					listEl.innerHTML = '';
					return;
				}
				var cacheKey = cachePrefix + 'hn_' + tag.toLowerCase();
				if (!forceRefresh && applyCache(cacheKey, listEl, statusEl)) return;

				statusEl.textContent = 'Loading Hacker News\u2026';
				listEl.innerHTML = '';
				var apiUrl = 'https://hn.algolia.com/api/v1/search?query=' + encodeURIComponent(tag) + '&tags=story&hitsPerPage=5';

				fetch(apiUrl)
					.then(function (r) { return r.ok ? r.json() : null; })
					.then(function (data) {
						var hits = (data && Array.isArray(data.hits)) ? data.hits : [];
						if (!hits.length) {
							statusEl.textContent = 'No recent HN stories for this topic.';
							listEl.innerHTML = '';
							writeCache(cacheKey, '', statusEl.textContent);
							return;
						}
						var html = '';
						hits.slice(0, 5).forEach(function (item) {
							if (!item) return;
							var title = escapeHtml(item.title || 'Story');
							var url = item.url || ('https://news.ycombinator.com/item?id=' + item.objectID);
							var points = item.points || 0;
							html += '<li><a href="' + url + '" target="_blank" rel="noopener" class="underline hover:text-primary">' + title + '</a>';
							if (points) {
								html += ' <span class="text-[11px] text-gray-500 dark:text-gray-500">\u00B7 ' + points + ' pts</span>';
							}
							html += '</li>';
						});
						listEl.innerHTML = html;
						statusEl.textContent = 'Updated from Hacker News.';
						writeCache(cacheKey, html, statusEl.textContent);
					})
					.catch(function () {
						statusEl.textContent = 'Could not load HN right now.';
					});
			}

			function loadFreeCodeCamp(forceRefresh) {
				var listEl = document.getElementById('resource-live-fcc-list');
				var statusEl = document.getElementById('resource-live-fcc-status');
				if (!listEl || !statusEl) return;

				var cacheKey = cachePrefix + 'fcc';
				if (!forceRefresh && applyCache(cacheKey, listEl, statusEl)) return;

				statusEl.textContent = 'Loading freeCodeCamp\u2026';
				listEl.innerHTML = '';
				var feedUrl = encodeURIComponent('https://www.freecodecamp.org/news/rss/');
				var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + feedUrl + '&api_key=public&count=5';

				fetch(apiUrl)
					.then(function (r) { return r.ok ? r.json() : null; })
					.then(function (data) {
						var items = (data && data.items) || [];
						if (!items.length) {
							statusEl.textContent = 'No recent fCC articles.';
							listEl.innerHTML = '';
							writeCache(cacheKey, '', statusEl.textContent);
							return;
						}
						var html = '';
						items.slice(0, 5).forEach(function (item) {
							if (!item) return;
							var title = escapeHtml(item.title || 'Article');
							var url = item.link || item.url || '#';
							html += '<li><a href="' + url + '" target="_blank" rel="noopener" class="underline hover:text-primary">' + title + '</a></li>';
						});
						listEl.innerHTML = html;
						statusEl.textContent = 'Updated from freeCodeCamp.';
						writeCache(cacheKey, html, statusEl.textContent);
					})
					.catch(function () {
						statusEl.textContent = 'Could not load fCC right now.';
					});
			}

			function loadAll(forceRefresh) {
				loadMedium(!!forceRefresh);
				loadDevto(!!forceRefresh);
				loadReddit(!!forceRefresh);
				loadHackerNews(!!forceRefresh);
				loadFreeCodeCamp(!!forceRefresh);
			}

			var refreshBtn = document.getElementById('resource-live-refresh');
			if (refreshBtn) {
				refreshBtn.addEventListener('click', function () {
					loadAll(true);
				});
			}

			loadAll(false);
		})(topicKey, t);
	}

		initResourcePopup();

	// NOTE: resources.html can be served at /pages/resources.html or /resources (rewrite). Fetch must work in both cases.
	var jsonPaths = ['../assets/resources.json', './assets/resources.json'];
	function tryFetch(idx) {
		if (idx >= jsonPaths.length) {
			showResourcesFallback();
			return;
		}
		fetch(jsonPaths[idx])
			.then(function (res) {
				if (!res.ok) throw new Error('Not found');
				return res.json();
			})
			.then(function (data) {
				if (!data || typeof data !== 'object') {
					throw new Error('Invalid resources data');
				}
				resAllTopics = data;
				var topicKey = initialTopic;
				if (!data[topicKey]) {
					var keys = Object.keys(data);
					if (!keys.length) throw new Error('No topics configured');
					topicKey = keys[0];
				}
				renderTopic(topicKey, data);
			})
			.catch(function () {
				tryFetch(idx + 1);
			});
	}

	// When fetch fails: show "not found" + topic links so the page is still usable
	function showResourcesFallback() {
		root.classList.add('hidden');
		notFound.classList.remove('hidden');
		var topicLinks = [
			{ topic: 'python', label: 'Python' }, { topic: 'sql', label: 'SQL' }, { topic: 'data-analytics', label: 'Data Analytics' },
			{ topic: 'data-science', label: 'Data Science' }, { topic: 'machine-learning', label: 'Machine Learning' }, { topic: 'data-engineering', label: 'Data Engineering' }
		];
		var linksHtml = topicLinks.map(function (item) {
			return '<a href="' + (window.location.pathname + '?topic=' + encodeURIComponent(item.topic)) + '" class="text-primary hover:underline">' + escapeHtml(item.label) + '</a>';
		}).join(' · ');
		var retryHtml = '<button type="button" id="resources-retry-btn" class="mt-3 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Retry</button>';
		notFound.innerHTML = '<p class="text-gray-600 dark:text-gray-400 mb-4">Could not load resources. Check your connection or try a topic below.</p>' +
			'<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Try: ' + linksHtml + '</p>' +
			retryHtml + '<br><a href="../index.html" class="inline-block mt-4 text-primary hover:underline">Back to Home</a>';
		var retryBtn = document.getElementById('resources-retry-btn');
		if (retryBtn) {
			retryBtn.addEventListener('click', function () {
				notFound.classList.add('hidden');
				notFound.innerHTML = '';
				root.classList.remove('hidden');
				root.innerHTML = '';
				tryFetch(0);
			});
		}
	}

	tryFetch(0);

if (typeof initAnalyticsTracking === 'function') {
	initAnalyticsTracking({ site: 'analytics-lab', baseEvent: 'resources' });
}
	} catch (err) {
		showFatalResourcesError(err);
	}
})();

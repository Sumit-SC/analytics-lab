(function () {
	'use strict';

	// Primary roles and locations (single source of truth for UI + rssjobs.app). Used by Role/Location dropdowns and API query.
	var PRIMARY_ROLES = [
		{ label: 'Analyst (any)', query: 'analyst' },
		{ label: 'Data Analyst', query: 'data analyst' },
		{ label: 'Senior Data Analyst', query: 'senior data analyst' },
		{ label: 'Business Analyst', query: 'business analyst' },
		{ label: 'Product Analyst', query: 'product analyst' },
		{ label: 'BI / Business Intelligence', query: 'business intelligence analyst' },
		{ label: 'Analytics Engineer', query: 'analytics engineer' },
		{ label: 'Data Scientist', query: 'data scientist' },
		{ label: 'Senior Data Scientist', query: 'senior data scientist' },
		{ label: 'ML Engineer', query: 'machine learning engineer' },
		{ label: 'Junior / Associate Data Scientist', query: 'junior data scientist' },
		{ label: 'Decision Scientist', query: 'decision scientist' },
		{ label: 'Financial Analyst', query: 'financial analyst' },
		{ label: 'Marketing Analyst', query: 'marketing analyst' },
		{ label: 'Operations Analyst', query: 'operations analyst' }
	];
	var PRIMARY_LOCATIONS = [
		{ label: 'Remote (any)', value: 'remote' },
		{ label: 'Remote – India', value: 'remote india' },
		{ label: 'India', value: 'india' },
		{ label: 'Pune', value: 'pune' },
		{ label: 'Mumbai', value: 'mumbai' },
		{ label: 'Bangalore', value: 'bangalore' },
		{ label: 'Hyderabad', value: 'hyderabad' },
		{ label: 'Chennai', value: 'chennai' },
		{ label: 'Delhi / NCR', value: 'delhi' },
		{ label: 'Gurgaon', value: 'gurgaon' },
		{ label: 'Noida', value: 'noida' },
		{ label: 'Remote – US', value: 'remote us' },
		{ label: 'Remote – EU', value: 'remote eu' }
	];
	var JOB_SITE_OPTIONS = [
		{ id: 'remoteok', name: 'RemoteOK', default: true, aliases: ['remoteok'] },
		{ id: 'remotive', name: 'Remotive', default: true, aliases: ['remotive', 'remotive_rss', 'remotive_data', 'remotive_ai_ml'] },
		{ id: 'weworkremotely', name: 'WeWorkRemotely', default: true, aliases: ['weworkremotely'] },
		{ id: 'jobscollider', name: 'Jobscollider', default: true, aliases: ['jobscollider', 'jobscollider_data'] },
		{ id: 'wellfound', name: 'Wellfound', default: true, aliases: ['wellfound'] },
		{ id: 'indeed', name: 'Indeed', default: true, aliases: ['indeed', 'indeed_rss'] },
		{ id: 'linkedin', name: 'LinkedIn', default: true, aliases: ['linkedin'] },
		{ id: 'hiring_cafe', name: 'hiring.cafe', default: true, aliases: ['hiring_cafe', 'hiringcafe'] },
		{ id: 'hirist', name: 'Hirist', default: false, aliases: ['hirist'] },
		{ id: 'arbeitnow', name: 'Arbeitnow', default: true, aliases: ['arbeitnow'] },
		{ id: 'jobicy', name: 'Jobicy', default: true, aliases: ['jobicy'] },
		{ id: 'workingnomads', name: 'Working Nomads', default: true, aliases: ['workingnomads'] },
		{ id: 'hn_jobs', name: 'HN Jobs (hnrss)', default: false, aliases: ['hn_jobs', 'hnrss_jobs'] },
		{ id: 'naukri', name: 'Naukri', default: false, aliases: ['naukri'] },
		{ id: 'foundit', name: 'Foundit', default: false, aliases: ['foundit'] },
		{ id: 'himalayas', name: 'Himalayas', default: false, aliases: ['himalayas'] },
		{ id: 'shine', name: 'Shine', default: false, aliases: ['shine'] },
		{ id: 'monster', name: 'Monster', default: false, aliases: ['monster'] },
		{ id: 'remote_co', name: 'Remote.co', default: false, aliases: ['remote.co', 'remoteco', 'remote_co'] },
		{ id: 'jobspresso', name: 'Jobspresso', default: false, aliases: ['jobspresso'] },
		{ id: 'authentic_jobs', name: 'Authentic Jobs', default: false, aliases: ['authenticjobs', 'authentic_jobs'] },
		{ id: 'glassdoor', name: 'Glassdoor', default: false, aliases: ['glassdoor'] },
		{ id: 'stackoverflow', name: 'Stack Overflow', default: false, aliases: ['stackoverflow', 'stack_overflow'] },
		{ id: 'greenhouse', name: 'Greenhouse', default: false, aliases: ['greenhouse'] },
		{ id: 'lever', name: 'Lever', default: false, aliases: ['lever'] },
		{ id: 'hn_jobs', name: 'HN Jobs', default: false, aliases: ['hn_jobs', 'hnjobs'] },
		{ id: 'justremote', name: 'JustRemote', default: false, aliases: ['justremote'] },
		// TrueUp doesn't expose a stable public API we can call from the browser; keep as an optional backend source name.
		{ id: 'trueup', name: 'TrueUp', default: false, aliases: ['trueup'] }
	];

	// Skillset keywords for matching (data science domain)
	var SKILLS_KEYWORDS = [
		// Roles
		'data scientist', 'data analyst', 'data engineer', 'data science', 'analytics engineer',
		'ml engineer', 'machine learning', 'ai engineer', 'business analyst', 'bi analyst',
		'data architect', 'data analytics', 'statistician', 'research scientist',
		// Technologies
		'python', 'sql', 'r', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch',
		'spark', 'hadoop', 'kafka', 'airflow', 'dbt', 'snowflake', 'redshift', 'bigquery',
		'tableau', 'power bi', 'looker', 'metabase', 'plotly', 'matplotlib', 'seaborn',
		'jupyter', 'notebook', 'git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
		'mlops', 'mlflow', 'kubeflow', 'fastapi', 'flask', 'streamlit',
		// Concepts
		'machine learning', 'deep learning', 'neural networks', 'nlp', 'computer vision',
		'statistical modeling', 'predictive analytics', 'a/b testing', 'experimentation',
		'feature engineering', 'model deployment', 'data pipeline', 'etl', 'elt',
		'data warehouse', 'data lake', 'data quality', 'data governance'
	];

	// Storage keys
	var STORAGE_JOBS = 'job_tracker_jobs';
	var STORAGE_APPLICATIONS = 'job_tracker_applications';
	var STORAGE_PLANNER = 'job_tracker_planner_log';

	var allJobs = [];
	var applications = {};
	var filteredJobs = [];
	var plannerEntries = [];
	var sourceCounts = {}; // Track jobs per source from API
	var apiSources = []; // List of sources from API
	var lastFetchContext = { query: 'analyst', location: 'remote', days: 7, limit: 200 };
	var activeJobsRequestId = 0;
	var AUTO_REFRESH_KEY = 'job_auto_refresh_enabled_v1';
	var FETCH_PROFILE_KEY = 'job_fetch_profile_v1';
	var AUTO_REFRESH_MS = 5 * 60 * 1000;
	var autoRefreshTimerId = null;
	var refreshAgeTimerId = null;
	var lastRefreshAtMs = 0;
	var latestAddedJobKeys = {};

	function beginJobsRequest() {
		activeJobsRequestId += 1;
		return activeJobsRequestId;
	}
	function isActiveJobsRequest(requestId) {
		return requestId === activeJobsRequestId;
	}
	function setJobLivePill(state, message) {
		var pill = document.getElementById('job-live-pill');
		if (!pill) return;
		var text = message || 'Idle';
		if (state === 'loading') {
			pill.className = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 animate-pulse';
			pill.textContent = '● ' + text;
			return;
		}
		if (state === 'ok') {
			pill.className = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700';
			pill.textContent = '● ' + text;
			return;
		}
		if (state === 'warn') {
			pill.className = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700';
			pill.textContent = '● ' + text;
			return;
		}
		pill.className = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700';
		pill.textContent = '● ' + text;
	}
	function humanizeElapsed(ms) {
		var mins = Math.floor(ms / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return mins + 'm ago';
		var hrs = Math.floor(mins / 60);
		if (hrs < 24) return hrs + 'h ago';
		var days = Math.floor(hrs / 24);
		return days + 'd ago';
	}
	function renderLastRefreshText() {
		var el = document.getElementById('job-last-refresh-text');
		if (!el) return;
		if (!lastRefreshAtMs) {
			el.textContent = 'Last refresh: —';
			return;
		}
		el.textContent = 'Last refresh: ' + humanizeElapsed(Date.now() - lastRefreshAtMs);
	}
	function markRefreshCompleteNow() {
		lastRefreshAtMs = Date.now();
		renderLastRefreshText();
	}
	function applyAutoRefresh(enabled) {
		if (autoRefreshTimerId) {
			clearInterval(autoRefreshTimerId);
			autoRefreshTimerId = null;
		}
		var label = document.getElementById('job-auto-refresh-label');
		if (label) label.textContent = enabled ? 'Auto-refresh ON (5m)' : 'Auto-refresh (5m)';
		if (!enabled) return;
		autoRefreshTimerId = setInterval(function () {
			if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
			fetchAllJobs(false);
		}, AUTO_REFRESH_MS);
	}
	function setupAutoRefreshUi() {
		var toggle = document.getElementById('job-auto-refresh-toggle');
		if (!toggle) return;
		var enabled = false;
		try { enabled = localStorage.getItem(AUTO_REFRESH_KEY) === '1'; } catch (e) {}
		toggle.checked = enabled;
		applyAutoRefresh(enabled);
		toggle.addEventListener('change', function () {
			var next = !!toggle.checked;
			try { localStorage.setItem(AUTO_REFRESH_KEY, next ? '1' : '0'); } catch (e) {}
			applyAutoRefresh(next);
		});
		if (refreshAgeTimerId) clearInterval(refreshAgeTimerId);
		refreshAgeTimerId = setInterval(renderLastRefreshText, 30000);
		renderLastRefreshText();
	}

	// Lightweight caching to avoid rate limits (especially Remotive)
	var CACHE_PREFIX = 'job_tracker_cache_v1_';
	function readCache(key, ttlMs) {
		try {
			var raw = localStorage.getItem(CACHE_PREFIX + key);
			if (!raw) return null;
			var obj = JSON.parse(raw);
			if (!obj || !obj.ts) return null;
			if (ttlMs && (Date.now() - obj.ts) > ttlMs) return null;
			return obj.data || null;
		} catch (e) {
			return null;
		}
	}
	function writeCache(key, data) {
		try {
			localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data: data }));
		} catch (e) {}
	}

	// Fetch with timeout so we don't hang forever when API is unreachable
	var FETCH_TIMEOUT_MS = 22000;
	function fetchWithTimeout(url, options, timeoutMs) {
		timeoutMs = timeoutMs || FETCH_TIMEOUT_MS;
		var controller = new AbortController();
		var timeoutId = setTimeout(function () { controller.abort(); }, timeoutMs);
		var opts = Object.assign({}, options || {});
		opts.signal = controller.signal;
		return fetch(url, opts).then(
			function (r) {
				clearTimeout(timeoutId);
				return r;
			},
			function (err) {
				clearTimeout(timeoutId);
				if (err && err.name === 'AbortError') {
					var e = new Error('Request timed out');
					e.isTimeout = true;
					throw e;
				}
				throw err;
			}
		);
	}

	function canonicalizeJobUrl(rawUrl) {
		try {
			var u = new URL(String(rawUrl || '').trim());
			// Remove tracking fragments and common marketing params.
			u.hash = '';
			var drop = {
				'utm_source': 1, 'utm_medium': 1, 'utm_campaign': 1, 'utm_term': 1, 'utm_content': 1,
				'ref': 1, 'ref_src': 1, 'source': 1, 'trk': 1, 'tracking': 1
			};
			Object.keys(drop).forEach(function (k) { u.searchParams.delete(k); });
			var s = u.toString();
			return s.endsWith('/') ? s.slice(0, -1) : s;
		} catch (e) {
			var txt = String(rawUrl || '').trim();
			return txt.endsWith('/') ? txt.slice(0, -1) : txt;
		}
	}
	function simpleHash(input) {
		var s = String(input || '');
		var h = 0;
		for (var i = 0; i < s.length; i++) {
			h = ((h << 5) - h) + s.charCodeAt(i);
			h |= 0;
		}
		return Math.abs(h).toString(36);
	}

	// Normalize a job from API (job-search-api uses snake_case; Vercel uses camelCase)
	function normalizeJobFromApi(item) {
		if (!item || !item.title || !item.url) return null;
		var canonicalUrl = canonicalizeJobUrl(item.url);
		var fallbackId = 'job_' + simpleHash([canonicalUrl, item.title || '', item.company || ''].join('|'));
		return {
			id: item.id || fallbackId,
			title: item.title,
			company: item.company || 'Unknown',
			location: item.location || 'Remote',
			url: canonicalUrl,
			description: item.description || '',
			tags: Array.isArray(item.tags) ? item.tags : [],
			source: item.source || 'unknown',
			date: item.date || new Date().toISOString(),
			dateFormatted: item.dateFormatted || item.date_formatted || '',
			postedAgo: item.postedAgo || item.posted_ago || '',
			matchScore: item.matchScore != null ? item.matchScore : (item.match_score != null ? item.match_score : 0),
			yoeMin: item.yoeMin != null ? item.yoeMin : (item.yoe_min != null ? item.yoe_min : null),
			yoeMax: item.yoeMax != null ? item.yoeMax : (item.yoe_max != null ? item.yoe_max : null)
		};
	}

	function isMobileViewport() {
		try {
			return typeof window !== 'undefined' &&
				window.matchMedia &&
				window.matchMedia('(max-width: 767px)').matches;
		} catch (e) {
			return false;
		}
	}

	// Initialize
	function init() {
		loadApplications();
		loadPlanner();
		setupRssModeAndDropdowns();
		setupApiBackendToggle();
		setupFetchProfileToggle();
		setupVercelSearchSection();
		setupRailwayUiEmbedToggle();
		setupEnhancedForm();
		setupSourcesPanel();
		setupExternalBoardsLinks();
		setupJobsDiffModal();
		setupAdvancedFiltersToggle();
		setupEventListeners();
		setupSavedFilterPresets();
		setupAutoRefreshUi();
		setupStatsDashboard();
		if (!isMobileViewport()) {
			fetchAllJobs();
		} else {
			var totalEl = document.getElementById('job-stats-total');
			if (totalEl) totalEl.textContent = 'Ready. Tap “Search Jobs” to load results.';
			var loadingEl = document.getElementById('job-loading');
			if (loadingEl) loadingEl.style.display = 'none';
		}
		setupPlannerEventListeners();
		renderPlanner();
	}

	function getSelectedFetchProfile() {
		var saved = 'basic';
		try { saved = localStorage.getItem(FETCH_PROFILE_KEY) || 'basic'; } catch (e) {}
		return saved === 'advanced' ? 'advanced' : 'basic';
	}

	function updateFetchProfileUi() {
		var basicBtn = document.getElementById('fetch-profile-basic');
		var advBtn = document.getElementById('fetch-profile-advanced');
		var selected = getSelectedFetchProfile();
		if (basicBtn) basicBtn.classList.toggle('active', selected === 'basic');
		if (advBtn) advBtn.classList.toggle('active', selected === 'advanced');
	}

	function setupFetchProfileToggle() {
		var basicBtn = document.getElementById('fetch-profile-basic');
		var advBtn = document.getElementById('fetch-profile-advanced');
		if (!basicBtn || !advBtn) return;
		function setProfile(p) {
			var next = p === 'advanced' ? 'advanced' : 'basic';
			try { localStorage.setItem(FETCH_PROFILE_KEY, next); } catch (e) {}
			updateFetchProfileUi();
		}
		basicBtn.addEventListener('click', function () { setProfile('basic'); });
		advBtn.addEventListener('click', function () { setProfile('advanced'); });
		updateFetchProfileUi();
	}

	function getCurrentSearchContext() {
		// Prefer whichever UI is visible/active.
		var backendVercel = true;
		try {
			var koyeb = document.getElementById('api-backend-koyeb');
			var ver = document.getElementById('api-backend-vercel');
			if (koyeb && koyeb.checked) backendVercel = false;
			if (ver && ver.checked) backendVercel = true;
		} catch (e) {}

		if (backendVercel) {
			var roleEl = document.getElementById('vercel-search-role');
			var locEl = document.getElementById('vercel-search-location');
			var q = roleEl && roleEl.value ? String(roleEl.value) : 'data analyst';
			var loc = locEl && locEl.value ? String(locEl.value) : 'remote';
			return { q: q, location: loc };
		}

		var qEl = document.getElementById('job-search-input');
		var locInput = document.getElementById('job-location-input');
		return {
			q: (qEl && qEl.value ? String(qEl.value) : 'data analyst'),
			location: (locInput && locInput.value ? String(locInput.value) : 'remote')
		};
	}

	function setupExternalBoardsLinks() {
		var container = document.getElementById('job-external-boards-dynamic');
		if (!container) return;

		function render(boards) {
			container.innerHTML = '';
			if (!boards || !boards.length) {
				container.innerHTML = '<span class="text-[11px] text-gray-500 dark:text-gray-400">No boards available.</span>';
				return;
			}
			for (var i = 0; i < boards.length; i++) {
				var b = boards[i];
				if (!b || !b.url || !b.name) continue;
				var a = document.createElement('a');
				a.href = b.url;
				a.target = '_blank';
				a.rel = 'noopener';
				a.className = 'px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 text-primary hover:underline';
				a.textContent = b.name;
				container.appendChild(a);
			}
		}

		function load() {
			var ctx = getCurrentSearchContext();
			var base = (window.JOB_PROXY_URL || '').replace(/\/$/, '');
			var url = base + '/api/job-boards?q=' + encodeURIComponent(ctx.q) + '&location=' + encodeURIComponent(ctx.location) + '&limit=24';

			container.innerHTML = '<span class="text-[11px] text-gray-500 dark:text-gray-400">Loading…</span>';
			fetchWithTimeout(url, null, 15000)
				.then(function (r) { return r && r.ok ? r.json() : null; })
				.then(function (data) {
					if (!data || !data.ok || !Array.isArray(data.boards)) {
						container.innerHTML = '<span class="text-[11px] text-gray-500 dark:text-gray-400">Boards unavailable.</span>';
						return;
					}
					render(data.boards);
				})
				.catch(function () {
					container.innerHTML = '<span class="text-[11px] text-gray-500 dark:text-gray-400">Boards unavailable.</span>';
				});
		}

		// Update when user changes role/location/backends.
		document.addEventListener('change', function (e) {
			var id = e && e.target && e.target.id ? e.target.id : '';
			if (id === 'vercel-search-role' || id === 'vercel-search-location' || id === 'job-search-input' || id === 'job-location-input' || id === 'api-backend-koyeb' || id === 'api-backend-vercel') {
				load();
			}
		});
		document.addEventListener('input', function (e) {
			var id = e && e.target && e.target.id ? e.target.id : '';
			if (id === 'job-search-input' || id === 'job-location-input') {
				// Avoid spamming the API while typing; small debounce.
				try {
					window.clearTimeout(window.__jobBoardsDebounce);
					window.__jobBoardsDebounce = window.setTimeout(load, 500);
				} catch (e2) {
					load();
				}
			}
		});

		load();
	}

	function setupAdvancedFiltersToggle() {
		var toggle = document.getElementById('job-advanced-toggle');
		var body = document.getElementById('job-search-advanced-body');
		if (!toggle || !body) return;
		var collapsed = isMobileViewport();
		function apply() {
			if (collapsed) {
				body.classList.add('hidden');
				toggle.textContent = 'Show advanced filters';
			} else {
				body.classList.remove('hidden');
				toggle.textContent = 'Hide advanced filters';
			}
		}
		apply();
		toggle.addEventListener('click', function () {
			collapsed = !collapsed;
			apply();
		});
	}

	// Setup Enhanced Form (JobSpy-style inputs)
	function setupSourcesPanel() {
		var container = document.getElementById('job-sites-multiselect-global');
		if (!container) return;
		container.innerHTML = '';
		JOB_SITE_OPTIONS.forEach(function(site) {
			var label = document.createElement('label');
			label.className = 'flex items-center gap-1 cursor-pointer px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700';
			var cb = document.createElement('input');
			cb.type = 'checkbox';
			cb.value = site.id;
			cb.id = 'site-' + site.id;
			cb.checked = site.default;
			cb.className = 'w-4 h-4 rounded accent-[var(--color-primary,#667eea)]';
			cb.addEventListener('change', function() { applyFilters(); });
			var span = document.createElement('span');
			span.textContent = site.name;
			label.appendChild(cb);
			label.appendChild(span);
			container.appendChild(label);
		});
		var selectAll = document.getElementById('sources-select-all');
		var selectDefaults = document.getElementById('sources-select-defaults');
		var clearAll = document.getElementById('sources-clear-all');
		if (selectAll) selectAll.addEventListener('click', function() {
			JOB_SITE_OPTIONS.forEach(function(s) { var c = document.getElementById('site-' + s.id); if (c) c.checked = true; });
			applyFilters();
		});
		if (selectDefaults) selectDefaults.addEventListener('click', function() {
			JOB_SITE_OPTIONS.forEach(function(s) { var c = document.getElementById('site-' + s.id); if (c) c.checked = s.default; });
			applyFilters();
		});
		if (clearAll) clearAll.addEventListener('click', function() {
			JOB_SITE_OPTIONS.forEach(function(s) { var c = document.getElementById('site-' + s.id); if (c) c.checked = false; });
			applyFilters();
		});
	}

	function setupEnhancedForm() {
		// Location suggestions (Koyeb / job-search-api config uses a text input)
		var locationDatalist = document.getElementById('job-location-suggestions');
		if (locationDatalist) {
			locationDatalist.innerHTML = '';
			PRIMARY_LOCATIONS.forEach(function (loc) {
				var opt = document.createElement('option');
				// Use the human-friendly label as the visible suggestion text
				opt.value = loc.label;
				opt.setAttribute('data-value', loc.value);
				locationDatalist.appendChild(opt);
			});
		}

		// Populate job sites multi-select (legacy in job-search-api config section)
		var multiselect = document.getElementById('job-sites-multiselect');
		if (multiselect) {
			multiselect.innerHTML = '';
			JOB_SITE_OPTIONS.forEach(function(site) {
				var label = document.createElement('label');
				label.className = 'flex items-center';
				var checkbox = document.createElement('input');
				checkbox.type = 'checkbox';
				checkbox.value = site.id;
				checkbox.id = 'site-legacy-' + site.id;
				checkbox.checked = site.default;
				checkbox.className = 'mr-2';
				label.appendChild(checkbox);
				var span = document.createElement('span');
				span.textContent = site.name;
				label.appendChild(span);
				multiselect.appendChild(label);
				checkbox.addEventListener('change', applyFilters);
			});
		}
		
		// Setup sliders
		var resultsSlider = document.getElementById('results-wanted-slider');
		var resultsDisplay = document.getElementById('results-wanted-display');
		if (resultsSlider && resultsDisplay) {
			resultsSlider.addEventListener('input', function() {
				resultsDisplay.textContent = resultsSlider.value;
			});
		}
		
		var daysSlider = document.getElementById('days-old-slider');
		var daysDisplay = document.getElementById('days-old-display');
		if (daysSlider && daysDisplay) {
			daysSlider.addEventListener('input', function() {
				daysDisplay.textContent = daysSlider.value;
			});
		}
		
		// Clear filters button
		var clearBtn = document.getElementById('job-clear-filters-btn');
		if (clearBtn) {
			clearBtn.addEventListener('click', function() {
				document.getElementById('job-search-input').value = 'analyst';
				document.getElementById('job-location-input').value = 'Remote';
				document.getElementById('job-country-select').value = 'USA';
				document.getElementById('job-type-select').value = '';
				document.getElementById('job-remote-only').checked = true;
				document.getElementById('job-linkedin-description').checked = false;
				var yoeMinEl = document.getElementById('job-yoe-min');
				var yoeMaxEl = document.getElementById('job-yoe-max');
				if (yoeMinEl) yoeMinEl.value = 1;
				if (yoeMaxEl) yoeMaxEl.value = 3;
				if (resultsSlider) resultsSlider.value = 50;
				if (resultsDisplay) resultsDisplay.textContent = '50';
				if (daysSlider) daysSlider.value = 7;
				if (daysDisplay) daysDisplay.textContent = '7';
				var excludeEl = document.getElementById('job-filter-exclude');
				if (excludeEl) excludeEl.value = '';
				var tagsEl = document.getElementById('job-filter-tags');
				if (tagsEl) tagsEl.value = '';
				var tagModeEl = document.getElementById('job-filter-tag-mode');
				if (tagModeEl) tagModeEl.value = 'any';
				var presetSelect = document.getElementById('job-filter-preset-select');
				if (presetSelect) presetSelect.value = 'custom';
				// Reset job sites to defaults
				JOB_SITE_OPTIONS.forEach(function(site) {
					var checkbox = document.getElementById('site-' + site.id);
					if (checkbox) checkbox.checked = site.default;
				});
				applyFilters();
			});
		}
		
		// Update API status display location
		var apiStatus = document.getElementById('api-status');
		if (apiStatus) {
			// Move status to enhanced form section
			var statusEl = document.querySelector('.flex.flex-wrap.items-center.gap-3.pt-3');
			if (statusEl && apiStatus.parentNode !== statusEl) {
				statusEl.appendChild(apiStatus);
			}
		}
	}
	
		// Base URL for job-search-api (Koyeb, local, etc.) — set window.JOB_SEARCH_API_BASE in jobs.html
	function getJobSearchApiBase() {
		if (typeof window === 'undefined' || window.JOB_SEARCH_API_BASE == null || window.JOB_SEARCH_API_BASE === '') return '';
		return String(window.JOB_SEARCH_API_BASE).replace(/\/$/, '');
	}
	function proxyUrlLooksLikeJobSearchApi(proxyUrl) {
		if (!proxyUrl) return false;
		var p = String(proxyUrl).toLowerCase();
		return p.indexOf('koyeb.app') !== -1 || p.indexOf('railway.app') !== -1
			|| p.indexOf('localhost') !== -1 || p.indexOf('127.0.0.1') !== -1
			|| p.indexOf('hf.space') !== -1 || p.indexOf('jobs-proxy') !== -1;
	}

		// Setup API Backend: Koyeb (job-search-api) | Vercel
	function setupApiBackendToggle() {
		try {
			var legacy = localStorage.getItem('job_tracker_api_backend');
			if (legacy === 'railway') localStorage.setItem('job_tracker_api_backend', 'koyeb');
		} catch (eMigrate) { /* ignore */ }
		var koyebRadio = document.getElementById('api-backend-koyeb');
		var vercelRadio = document.getElementById('api-backend-vercel');
		var rssjobsRadio = document.getElementById('api-backend-rssjobs');
		var statusEl = document.getElementById('api-status');
		var savedBackend = localStorage.getItem('job_tracker_api_backend') || 'vercel';
		
		if (savedBackend === 'vercel' && vercelRadio) vercelRadio.checked = true;
		else if (savedBackend === 'rssjobs' && rssjobsRadio) rssjobsRadio.checked = true;
		else if (koyebRadio) koyebRadio.checked = true;
 
		function updateApiBackend(backend) {
			if (backend === 'koyeb') {
				window.JOB_PROXY_URL = getJobSearchApiBase();
				if (statusEl) statusEl.textContent = '✓ Render Backend';
			} else if (backend === 'rssjobs') {
				window.JOB_PROXY_URL = getJobSearchApiBase();
				if (statusEl) statusEl.textContent = '✓ RSSJobs (Direct)';
			} else {
				window.JOB_PROXY_URL = 'https://playground-serveless.vercel.app';
				if (statusEl) statusEl.textContent = '✓ Vercel';
			}
			localStorage.setItem('job_tracker_api_backend', backend);
			applyBackendVisibility(backend);
			applyBackendFormState(backend);
			fetchAllJobs(false);
		}
 
		if (koyebRadio) koyebRadio.addEventListener('change', function () { if (koyebRadio.checked) updateApiBackend('koyeb'); });
		if (vercelRadio) vercelRadio.addEventListener('change', function () { if (vercelRadio.checked) updateApiBackend('vercel'); });
		if (rssjobsRadio) rssjobsRadio.addEventListener('change', function () { if (rssjobsRadio.checked) updateApiBackend('rssjobs'); });
		updateApiBackend(savedBackend);
	}
 
	// Koyeb (job-search-api): show full search config. Vercel: show vercel-search-section + sources panel.
	function applyBackendVisibility(backend) {
		var searchConfig = document.getElementById('job-search-config-section');
		var vercelSearch = document.getElementById('vercel-search-section');
		var rssjobsSearch = document.getElementById('rssjobs-search-section');
		var sourcesPanel = document.getElementById('job-sources-panel');
		if (searchConfig) searchConfig.classList.toggle('hidden', backend !== 'koyeb');
		if (vercelSearch) vercelSearch.classList.toggle('hidden', backend !== 'vercel');
		if (rssjobsSearch) rssjobsSearch.classList.toggle('hidden', backend !== 'rssjobs');
		if (sourcesPanel) sourcesPanel.classList.toggle('hidden', false);
	}

	// Koyeb (job-search-api): disable form controls it doesn't use (q, days, limit only); show hint
	function applyBackendFormState(backend) {
		var isKoyeb = backend === 'koyeb';
		var koyebHint = document.getElementById('job-search-config-koyeb-hint');
		if (koyebHint) koyebHint.classList.toggle('hidden', !isKoyeb);
		var locationInput = document.getElementById('job-location-input');
		var countrySelect = document.getElementById('job-country-select');
		var jobSitesContainer = document.getElementById('job-sites-multiselect');
		var jobTypeSelect = document.getElementById('job-type-select');
		var locationLabel = locationInput && locationInput.closest('div') && locationInput.closest('div').querySelector('label');
		var countryLabel = countrySelect && countrySelect.closest('div') && countrySelect.closest('div').querySelector('label');
		var jobSitesLabel = jobSitesContainer && jobSitesContainer.closest('div') && jobSitesContainer.closest('div').querySelector('label');
		var jobTypeLabel = jobTypeSelect && jobTypeSelect.closest('div') && jobTypeSelect.closest('div').querySelector('label');

		function setDisabled(el, label, disabled, hint) {
			if (el) {
				el.disabled = disabled;
				el.classList.toggle('opacity-60', disabled);
				el.classList.toggle('cursor-not-allowed', disabled);
				el.setAttribute('title', disabled && hint ? hint : '');
			}
			if (label) {
				label.classList.toggle('opacity-60', disabled);
				label.classList.toggle('cursor-not-allowed', disabled);
			}
		}
		setDisabled(locationInput, locationLabel, isKoyeb, 'Optional for job-search-api');
		setDisabled(countrySelect, countryLabel, isKoyeb, 'Optional for job-search-api');
		setDisabled(jobTypeSelect, jobTypeLabel, isKoyeb, 'Optional for job-search-api');
		var headlessEl = document.getElementById('job-enable-headless');
		if (headlessEl) {
			headlessEl.disabled = !isKoyeb;
			headlessEl.classList.toggle('opacity-60', !isKoyeb);
			headlessEl.setAttribute('title', isKoyeb ? 'Enable slow headless scrapers (e.g. Naukri)' : 'Headless scrapers require Hugging Face / job-search-api backend');
			if (!isKoyeb) headlessEl.checked = false;
			headlessEl.onchange = function () {
				applyBackendFormState(isKoyeb ? 'koyeb' : 'vercel');
			};
		}
		if (jobSitesContainer) {
			jobSitesContainer.classList.remove('opacity-60', 'pointer-events-none');
			jobSitesContainer.setAttribute('title', 'Select which sources to fetch from');
			if (jobSitesLabel) jobSitesLabel.classList.remove('opacity-60');
			var siteInputs = jobSitesContainer.querySelectorAll('input[type="checkbox"]');
			// These sources are implemented as Playwright headless scrapers (only work when "Headless" is enabled).
			var headlessRequired = {
				'linkedin': true,
				'indeed': true,
				'naukri': true,
				'hirist': true,
				'foundit': true,
				'shine': true,
				'monster': true,
				'glassdoor': true
			};
			for (var i = 0; i < siteInputs.length; i++) {
				var inp = siteInputs[i];
				var id = inp && inp.value ? String(inp.value) : '';
				if (headlessRequired[id]) {
					var canUse = !!isKoyeb && !!(headlessEl && headlessEl.checked);
					inp.disabled = !canUse;
					inp.classList.toggle('opacity-60', !canUse);
					inp.setAttribute('title', canUse ? '' : 'Requires Hugging Face + Headless scrapers');
					if (!canUse) inp.checked = false;
				} else {
					inp.disabled = false;
				}
			}
		}
	}

	// Vercel-only search: role, location, days + Search button; Search hits refresh then snapshot
	function setupVercelSearchSection() {
		var roleSelect = document.getElementById('vercel-search-role');
		var locationSelect = document.getElementById('vercel-search-location');
		var searchBtn = document.getElementById('vercel-search-btn');
		if (roleSelect) {
			PRIMARY_ROLES.forEach(function (r) {
				var opt = document.createElement('option');
				opt.value = r.query;
				opt.textContent = r.label;
				if (r.query === 'analyst') opt.selected = true;
				roleSelect.appendChild(opt);
			});
		}
		if (locationSelect) {
			PRIMARY_LOCATIONS.forEach(function (loc) {
				var opt = document.createElement('option');
				opt.value = loc.value;
				opt.textContent = loc.label;
				if (loc.value === 'remote') opt.selected = true;
				locationSelect.appendChild(opt);
			});
		}
		if (searchBtn) {
			searchBtn.addEventListener('click', function () { fetchAllJobs(true); });
		}
	}

	// job-search-api UI embed: collapsible; URL from JOB_PROXY_URL or JOB_SEARCH_API_BASE
	var EMBED_LOAD_TIMEOUT_MS = 8000;
	var EMBED_BANNER_DISMISS_KEY = 'jobs_embed_banner_dismissed';
	function getJobSearchApiEmbedUrl() {
		return 'https://job-search-api-go.onrender.com/ui/';
	}
	function setupRailwayUiEmbedToggle() {
		var fallbackLink = document.getElementById('railway-ui-embed-fallback-link');
		var openTab = document.getElementById('job-api-ui-open-tab');
		var embedUrl = getJobSearchApiEmbedUrl();
		if (fallbackLink && embedUrl) fallbackLink.href = embedUrl;
		if (openTab && embedUrl) openTab.href = embedUrl;
		var toggleBtn = document.getElementById('railway-ui-embed-toggle');
		var contentDiv = document.getElementById('railway-ui-embed-content');
		var iframe = document.getElementById('railway-ui-embed-iframe');
		var toggleText = document.getElementById('railway-ui-embed-toggle-text');
		var toggleIcon = document.getElementById('railway-ui-embed-toggle-icon');
		var fallbackEl = document.getElementById('railway-ui-embed-fallback');
		var bannerEl = document.getElementById('embed-blocked-banner');
		var bannerDismissBtn = document.getElementById('embed-blocked-banner-dismiss');
		if (!toggleBtn || !contentDiv) return;
		var loadTimeoutId = null;
		function clearLoadTimeout() {
			if (loadTimeoutId) {
				clearTimeout(loadTimeoutId);
				loadTimeoutId = null;
			}
		}
		function showFallback() {
			clearLoadTimeout();
			if (fallbackEl) fallbackEl.classList.remove('hidden');
			try {
				if (bannerEl && !sessionStorage.getItem(EMBED_BANNER_DISMISS_KEY)) bannerEl.classList.remove('hidden');
			} catch (e) { if (bannerEl) bannerEl.classList.remove('hidden'); }
		}
		function hideFallback() {
			if (fallbackEl) fallbackEl.classList.add('hidden');
		}
		if (bannerDismissBtn && bannerEl) {
			bannerDismissBtn.addEventListener('click', function () {
				bannerEl.classList.add('hidden');
				try { sessionStorage.setItem(EMBED_BANNER_DISMISS_KEY, '1'); } catch (e) { /* ignore */ }
			});
		}
		if (iframe) {
			iframe.addEventListener('load', function () {
				clearLoadTimeout();
				hideFallback();
			});
		}
		var toggleLock = false;
		function handleToggle() {
			if (toggleLock) return;
			toggleLock = true;
			setTimeout(function () { toggleLock = false; }, 400);
			contentDiv.classList.toggle('hidden');
			var expanded = !contentDiv.classList.contains('hidden');
			toggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
			if (toggleText) toggleText.textContent = expanded ? 'Click to collapse' : 'Click to expand';
			if (toggleIcon) toggleIcon.style.transform = expanded ? 'rotate(180deg)' : '';
			if (!expanded) {
				clearLoadTimeout();
				hideFallback();
				return;
			}
			if (iframe) {
				var src = iframe.getAttribute('src') || '';
				if (!src || src === 'about:blank' || src === '') {
					hideFallback();
					if (bannerEl) bannerEl.classList.add('hidden');
					iframe.setAttribute('src', getJobSearchApiEmbedUrl());
					loadTimeoutId = setTimeout(function () {
						loadTimeoutId = null;
						showFallback();
					}, EMBED_LOAD_TIMEOUT_MS);
				}
			}
		}
		toggleBtn.addEventListener('click', handleToggle);
		toggleBtn.addEventListener('touchend', function (e) {
			e.preventDefault();
			handleToggle();
		}, { passive: false });
	}

	// Populate RSS Role/Location dropdowns (no-op when Job source block removed)
	function setupRssModeAndDropdowns() {
		var rssPanel = document.getElementById('job-rss-panel');
		var rssRadio = document.getElementById('job-source-rss');
		if (!rssPanel && !rssRadio) return;

		var roleSelect = document.getElementById('job-rss-role');
		var locationSelect = document.getElementById('job-rss-location');
		var feedUrlInput = document.getElementById('job-rss-feed-url');
		var scrapeRadio = document.getElementById('job-source-scrape');

		if (roleSelect) {
			roleSelect.innerHTML = '';
			PRIMARY_ROLES.forEach(function (r) {
				var opt = document.createElement('option');
				opt.value = r.query;
				opt.textContent = r.label;
				roleSelect.appendChild(opt);
			});
		}
		if (locationSelect) {
			locationSelect.innerHTML = '';
			PRIMARY_LOCATIONS.forEach(function (loc) {
				var opt = document.createElement('option');
				opt.value = loc.value;
				opt.textContent = loc.label;
				locationSelect.appendChild(opt);
			});
		}

		function setRssPanelVisible(visible) {
			if (rssPanel) rssPanel.classList.toggle('hidden', !visible);
			// Hide feed URL input when Koyeb / job-search-api backend is selected (not needed)
			var feedUrlInput = document.getElementById('job-rss-feed-url');
			var feedUrlLabel = feedUrlInput ? feedUrlInput.previousElementSibling : null;
			var proxyUrl = (typeof window !== 'undefined' && window.JOB_PROXY_URL) ? String(window.JOB_PROXY_URL).replace(/\/$/, '') : '';
			var koyebRadio = document.getElementById('api-backend-koyeb');
			var isKoyebBackend = (koyebRadio && koyebRadio.checked) || (proxyUrl && proxyUrlLooksLikeJobSearchApi(proxyUrl));
			if (visible && isKoyebBackend && feedUrlInput) {
				feedUrlInput.style.display = 'none';
				if (feedUrlLabel && feedUrlLabel.tagName === 'LABEL') feedUrlLabel.style.display = 'none';
			} else if (visible && feedUrlInput) {
				feedUrlInput.style.display = '';
				if (feedUrlLabel && feedUrlLabel.tagName === 'LABEL') feedUrlLabel.style.display = '';
			}
		}
		function updateMode() {
			var isRss = rssRadio && rssRadio.checked;
			setRssPanelVisible(!!isRss);
			// Auto-fetch when switching to RSS mode
			if (isRss) {
				var role = roleSelect ? roleSelect.value : 'analyst';
				var loc = locationSelect ? locationSelect.value : 'remote';
				fetchRssJobsFromRssjobsApp(role, loc);
			}
		}
		if (scrapeRadio) scrapeRadio.addEventListener('change', updateMode);
		if (rssRadio) rssRadio.addEventListener('change', updateMode);
		updateMode();

		// Auto-fetch when role/location changes in RSS mode
		function onRssParamsChange() {
			if (rssRadio && rssRadio.checked) {
				var role = roleSelect ? roleSelect.value : 'analyst';
				var loc = locationSelect ? locationSelect.value : 'remote';
				fetchRssJobsFromRssjobsApp(role, loc);
			}
		}
		if (roleSelect) roleSelect.addEventListener('change', onRssParamsChange);
		if (locationSelect) locationSelect.addEventListener('change', onRssParamsChange);

		// If URL has ?rssjobs=..., switch to RSS mode and prefill feed URL
		var urlParams = new URLSearchParams(window.location.search);
		var rssParam = urlParams.get('rssjobs');
		if (rssParam && rssParam.trim()) {
			if (rssRadio) rssRadio.checked = true;
			if (feedUrlInput) feedUrlInput.value = rssParam.trim();
			setRssPanelVisible(true);
		}
	}

	// Load saved application statuses
	function loadApplications() {
		try {
			var saved = localStorage.getItem(STORAGE_APPLICATIONS);
			if (saved) {
				applications = JSON.parse(saved);
			}
		} catch (e) {
			console.error('Failed to load applications:', e);
		}
	}

	// Save application statuses
	function saveApplications() {
		try {
			localStorage.setItem(STORAGE_APPLICATIONS, JSON.stringify(applications));
		} catch (e) {
			console.error('Failed to save applications:', e);
		}
	}

	// Load / save planner (Notion-style application log)
	function loadPlanner() {
		try {
			var raw = localStorage.getItem(STORAGE_PLANNER);
			if (raw) {
				plannerEntries = JSON.parse(raw) || [];
			}
		} catch (e) {
			plannerEntries = [];
		}
		// Update summary after loading
		updatePlannerSummary();
	}
	function savePlanner() {
		try {
			localStorage.setItem(STORAGE_PLANNER, JSON.stringify(plannerEntries));
		} catch (e) {}
	}

	// Setup event listeners
	function setupEventListeners() {
		var toggleBtn = document.getElementById('toggle-external-boards');
		var collapsedDiv = document.getElementById('external-boards-collapsed');
		if (toggleBtn && collapsedDiv) {
			toggleBtn.addEventListener('click', function () {
				if (collapsedDiv.classList.contains('hidden')) {
					collapsedDiv.classList.remove('hidden');
					toggleBtn.innerHTML = 'Less Boards 🔼';
				} else {
					collapsedDiv.classList.add('hidden');
					toggleBtn.innerHTML = 'More Boards 🔽';
				}
			});
		}

		var rssjobsGenBtn = document.getElementById('rssjobs-generate-btn');
		var rssjobsFetchBtn = document.getElementById('rssjobs-fetch-btn');
		var rssjobsPreviewBox = document.getElementById('rssjobs-preview-box');
		var rssjobsDirectLink = document.getElementById('rssjobs-direct-link');
		if (rssjobsGenBtn && rssjobsPreviewBox && rssjobsDirectLink) {
			rssjobsGenBtn.addEventListener('click', function () {
				var kw = document.getElementById('rssjobs-keywords').value.trim() || 'data analyst';
				var loc = document.getElementById('rssjobs-location').value.trim() || 'remote';
				var directUrl = "https://rssjobs.app/feeds?keywords=" + encodeURIComponent(kw) + "&location=" + encodeURIComponent(loc);
				rssjobsDirectLink.href = directUrl;
				rssjobsDirectLink.textContent = directUrl;
				rssjobsPreviewBox.classList.remove('hidden');
			});
		}
		if (rssjobsFetchBtn) {
			rssjobsFetchBtn.addEventListener('click', function () {
				var kw = document.getElementById('rssjobs-keywords').value.trim() || 'data analyst';
				var loc = document.getElementById('rssjobs-location').value.trim() || 'remote';
				fetchRssJobsFromRssjobsApp(kw, loc);
			});
		}

		var searchInput = document.getElementById('job-search-input');
		var filterSource = document.getElementById('job-filter-source');
		var filterMatch = document.getElementById('job-filter-match');
		var filterStatus = document.getElementById('job-filter-status');
		var filterNewOnly = document.getElementById('job-filter-new-only');
		var filterAge = document.getElementById('job-filter-age');
		var filterRole = document.getElementById('job-filter-role');
		var filterExclude = document.getElementById('job-filter-exclude');
		var filterTags = document.getElementById('job-filter-tags');
		var filterTagMode = document.getElementById('job-filter-tag-mode');
		var refreshBtn = document.getElementById('job-refresh-btn');

		if (searchInput) {
			searchInput.addEventListener('input', debounce(applyFilters, 300));
		}
		if (filterSource) {
			filterSource.addEventListener('change', applyFilters);
		}
		if (filterMatch) {
			filterMatch.addEventListener('change', applyFilters);
		}
		if (filterStatus) {
			filterStatus.addEventListener('change', applyFilters);
		}
		if (filterNewOnly) {
			filterNewOnly.addEventListener('change', applyFilters);
		}
		if (filterAge) {
			filterAge.addEventListener('change', applyFilters);
		}
		if (filterRole) {
			filterRole.addEventListener('change', applyFilters);
		}
		if (filterExclude) {
			filterExclude.addEventListener('input', debounce(applyFilters, 300));
		}
		if (filterTags) {
			filterTags.addEventListener('input', debounce(applyFilters, 300));
		}
		if (filterTagMode) {
			filterTagMode.addEventListener('change', applyFilters);
		}
		if (refreshBtn) {
			refreshBtn.addEventListener('click', function () {
				fetchAllJobs(true); // Force refresh - triggers scraping
			});
		}
		var notifyTgBtn = document.getElementById('job-notify-tg-btn');
		if (notifyTgBtn) {
			notifyTgBtn.addEventListener('click', function () {
				var base = getJobSearchApiBase();
				if (!base) {
					alert('Cannot trigger Telegram notifications: No Render API base URL is set.');
					return;
				}
				notifyTgBtn.disabled = true;
				var oldText = notifyTgBtn.innerHTML;
				notifyTgBtn.innerHTML = '⌛ Sending...';
				fetch(base + '/api/notify-recent', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					}
				})
				.then(function (res) {
					return res.json().catch(function () { return { ok: false, error: 'Non-JSON response' }; });
				})
				.then(function (data) {
					notifyTgBtn.disabled = false;
					notifyTgBtn.innerHTML = oldText;
					if (data && data.ok) {
						alert('✅ Telegram Alert Sent! Successfully posted ' + (data.count || 0) + ' new jobs to your topics.');
					} else {
						alert('❌ Failed to send alerts: ' + ((data && data.error) || 'Unknown error'));
					}
				})
				.catch(function (err) {
					notifyTgBtn.disabled = false;
					notifyTgBtn.innerHTML = oldText;
					alert('❌ Network error: ' + err.message);
				});
			});
		}
	}

	var JOB_FILTER_PRESETS_KEY = 'job_filter_presets_v1';
	var JOB_FILTER_PRESETS_LAST_KEY = 'job_filter_presets_last_v1';
	function getSavedPresets() {
		try {
			var raw = localStorage.getItem(JOB_FILTER_PRESETS_KEY);
			if (!raw) return [];
			var parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) return [];
			return parsed;
		} catch (e) {
			return [];
		}
	}
	function setSavedPresets(presets) {
		try {
			localStorage.setItem(JOB_FILTER_PRESETS_KEY, JSON.stringify(presets || []));
		} catch (e) {}
	}
	function getQuickFilterState() {
		var searchInput = document.getElementById('job-search-input');
		var filterSource = document.getElementById('job-filter-source');
		var filterMatch = document.getElementById('job-filter-match');
		var filterStatus = document.getElementById('job-filter-status');
		var filterNewOnly = document.getElementById('job-filter-new-only');
		var filterRole = document.getElementById('job-filter-role');
		var filterExclude = document.getElementById('job-filter-exclude');
		var filterTags = document.getElementById('job-filter-tags');
		var filterTagMode = document.getElementById('job-filter-tag-mode');

		return {
			q: searchInput ? String(searchInput.value || '') : '',
			source: filterSource ? filterSource.value : 'all',
			match: filterMatch ? filterMatch.value : 'all',
			status: filterStatus ? filterStatus.value : 'all',
			newOnly: !!(filterNewOnly && filterNewOnly.checked),
			role: filterRole ? filterRole.value : 'all',
			exclude: filterExclude ? String(filterExclude.value || '') : '',
			tags: filterTags ? String(filterTags.value || '') : '',
			tagMode: filterTagMode ? filterTagMode.value : 'any'
		};
	}
	function applyQuickFilterStateToUI(state) {
		if (!state) return;
		var searchInput = document.getElementById('job-search-input');
		var filterSource = document.getElementById('job-filter-source');
		var filterMatch = document.getElementById('job-filter-match');
		var filterStatus = document.getElementById('job-filter-status');
		var filterNewOnly = document.getElementById('job-filter-new-only');
		var filterRole = document.getElementById('job-filter-role');
		var filterExclude = document.getElementById('job-filter-exclude');
		var filterTags = document.getElementById('job-filter-tags');
		var filterTagMode = document.getElementById('job-filter-tag-mode');

		if (searchInput && state.q != null) searchInput.value = String(state.q);
		if (filterSource && state.source != null) filterSource.value = String(state.source);
		if (filterMatch && state.match != null) filterMatch.value = String(state.match);
		if (filterStatus && state.status != null) filterStatus.value = String(state.status);
		if (filterNewOnly && state.newOnly != null) filterNewOnly.checked = !!state.newOnly;
		if (filterRole && state.role != null) filterRole.value = String(state.role);
		if (filterExclude && state.exclude != null) filterExclude.value = String(state.exclude);
		if (filterTags && state.tags != null) filterTags.value = String(state.tags);
		if (filterTagMode && state.tagMode != null) filterTagMode.value = String(state.tagMode);
	}
	function setupSavedFilterPresets() {
		var presetSelect = document.getElementById('job-filter-preset-select');
		var presetNameInput = document.getElementById('job-filter-preset-name');
		var presetSaveBtn = document.getElementById('job-filter-preset-save');
		if (!presetSelect || !presetNameInput || !presetSaveBtn) return;

		function render() {
			var presets = getSavedPresets();
			var last = localStorage.getItem(JOB_FILTER_PRESETS_LAST_KEY) || '';
			// Keep current selected value stable if possible.
			var current = presetSelect.value || 'custom';
			presetSelect.innerHTML = '<option value="custom">Custom</option>';

			for (var i = 0; i < presets.length; i++) {
				var p = presets[i];
				if (!p || !p.name) continue;
				var opt = document.createElement('option');
				opt.value = p.name;
				opt.textContent = p.name;
				presetSelect.appendChild(opt);
			}

			if (last) presetSelect.value = last;
			else if (current && current !== 'custom') presetSelect.value = current;
			else presetSelect.value = 'custom';
		}

		function save() {
			var name = String(presetNameInput.value || '').trim();
			if (!name) {
				window.alert('Enter a preset name first.');
				return;
			}
			var state = getQuickFilterState();
			var presets = getSavedPresets();

			var updated = false;
			for (var i = 0; i < presets.length; i++) {
				if (presets[i] && presets[i].name === name) {
					presets[i] = { name: name, state: state, ts: Date.now() };
					updated = true;
					break;
				}
			}
			if (!updated) {
				presets.unshift({ name: name, state: state, ts: Date.now() });
			}

			// Keep latest 15 presets.
			presets = presets.slice(0, 15);
			setSavedPresets(presets);
			localStorage.setItem(JOB_FILTER_PRESETS_LAST_KEY, name);
			render();
			presetSelect.value = name;
		}

		function load(name) {
			var presets = getSavedPresets();
			var found = null;
			for (var i = 0; i < presets.length; i++) {
				if (presets[i] && presets[i].name === name) {
					found = presets[i];
					break;
				}
			}
			if (!found || !found.state) return;
			applyQuickFilterStateToUI(found.state);
			localStorage.setItem(JOB_FILTER_PRESETS_LAST_KEY, name);
			applyFilters();
		}

		presetSelect.addEventListener('change', function () {
			var v = presetSelect.value || 'custom';
			if (v === 'custom') return;
			load(v);
		});

		presetSaveBtn.addEventListener('click', function () {
			save();
			// Keep filter state as-is; no need to reload.
			applyFilters();
		});

		// initial render + load last preset
		render();
		var last = localStorage.getItem(JOB_FILTER_PRESETS_LAST_KEY) || '';
		if (last) {
			// Apply to UI immediately; filtering will re-run after jobs load.
			load(last);
		}
	}

	// Planner event listeners (add/update/delete entries)
	function setupPlannerEventListeners() {
		var form = document.getElementById('planner-form');
		var listEl = document.getElementById('planner-list');
		var searchInput = document.getElementById('planner-search-input');
		var statusFilter = document.getElementById('planner-filter-status');

		if (form) {
			form.addEventListener('submit', function (e) {
				e.preventDefault();
				var titleEl = document.getElementById('planner-title');
				var companyEl = document.getElementById('planner-company');
				var linkEl = document.getElementById('planner-link');
				var sourceEl = document.getElementById('planner-source');
				var statusEl = document.getElementById('planner-status');
				var nextStepEl = document.getElementById('planner-next-step');
				var appliedAtEl = document.getElementById('planner-applied-at');
				var priorityEl = document.getElementById('planner-priority');
				var locationEl = document.getElementById('planner-location');
				var jobTypeEl = document.getElementById('planner-job-type');
				var workModeEl = document.getElementById('planner-work-mode');
				var salaryEl = document.getElementById('planner-salary');
				var contactNameEl = document.getElementById('planner-contact-name');
				var contactChannelEl = document.getElementById('planner-contact-channel');
				var tagsEl = document.getElementById('planner-tags');
				var outcomeEl = document.getElementById('planner-outcome');
				var notesEl = document.getElementById('planner-notes');

				var title = (titleEl && titleEl.value || '').trim();
				var company = (companyEl && companyEl.value || '').trim();
				if (!title && !company) {
					return;
				}

				var entry = {
					id: 'planner_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2),
					title: title,
					company: company,
					link: (linkEl && linkEl.value || '').trim(),
					source: (sourceEl && sourceEl.value || '').trim(),
					status: (statusEl && statusEl.value) || 'idea',
					nextStep: (nextStepEl && nextStepEl.value) || '',
					appliedAt: (appliedAtEl && appliedAtEl.value) || '',
					priority: (priorityEl && priorityEl.value) || 'medium',
					location: (locationEl && locationEl.value || '').trim(),
					jobType: (jobTypeEl && jobTypeEl.value) || '',
					workMode: (workModeEl && workModeEl.value) || '',
					salary: (salaryEl && salaryEl.value || '').trim(),
					contactName: (contactNameEl && contactNameEl.value || '').trim(),
					contactChannel: (contactChannelEl && contactChannelEl.value || '').trim(),
					tags: (tagsEl && tagsEl.value || '').trim(),
					outcome: (outcomeEl && outcomeEl.value || '').trim(),
					notes: (notesEl && notesEl.value || '').trim(),
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};

				plannerEntries.unshift(entry);
				savePlanner();
				if (titleEl) titleEl.value = '';
				if (companyEl) companyEl.value = '';
				if (linkEl) linkEl.value = '';
				if (sourceEl) sourceEl.value = '';
				if (appliedAtEl) appliedAtEl.value = '';
				if (priorityEl) priorityEl.value = 'medium';
				if (locationEl) locationEl.value = '';
				if (jobTypeEl) jobTypeEl.value = '';
				if (workModeEl) workModeEl.value = '';
				if (salaryEl) salaryEl.value = '';
				if (contactNameEl) contactNameEl.value = '';
				if (contactChannelEl) contactChannelEl.value = '';
				if (tagsEl) tagsEl.value = '';
				if (outcomeEl) outcomeEl.value = '';
				if (notesEl) notesEl.value = '';
				renderPlanner();
			});
		}

		if (searchInput) {
			searchInput.addEventListener('input', debounce(renderPlanner, 200));
		}
		if (statusFilter) {
			statusFilter.addEventListener('change', renderPlanner);
		}

		function getFilteredPlannerEntries() {
			var term = (searchInput && searchInput.value || '').toLowerCase();
			var status = (statusFilter && statusFilter.value) || 'all';
			var entries = plannerEntries.slice();
			if (term) {
				entries = entries.filter(function (e) {
					var text = (e.title + ' ' + e.company + ' ' + e.source + ' ' + e.notes + ' ' + e.location + ' ' + e.jobType + ' ' + e.workMode + ' ' + e.salary + ' ' + e.contactName + ' ' + e.contactChannel + ' ' + e.tags + ' ' + e.outcome).toLowerCase();
					return text.indexOf(term) !== -1;
				});
			}
			if (status !== 'all') {
				entries = entries.filter(function (e) { return e.status === status; });
			}
			return entries;
		}

		var exportJsonBtn = document.getElementById('planner-export-json');
		var exportCsvBtn = document.getElementById('planner-export-csv');
		var exportBackupBtn = document.getElementById('planner-export-backup');
		function downloadBlob(blob, filename) {
			try {
				var a = document.createElement('a');
				a.href = URL.createObjectURL(blob);
				a.download = filename;
				a.click();
				setTimeout(function () { try { URL.revokeObjectURL(a.href); } catch (e) {} }, 500);
			} catch (e) {}
		}
		if (exportJsonBtn) {
			exportJsonBtn.addEventListener('click', function () {
				var entries = getFilteredPlannerEntries();
				var blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
				downloadBlob(blob, 'job-planner-' + new Date().toISOString().slice(0, 10) + '.json');
			});
		}
		if (exportBackupBtn) {
			exportBackupBtn.addEventListener('click', function () {
				var payload = {
					ok: true,
					exportedAt: new Date().toISOString(),
					version: 1,
					plannerEntries: plannerEntries.slice(),
					applications: applications || {}
				};
				var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
				downloadBlob(blob, 'job-tracker-backup-' + new Date().toISOString().slice(0, 10) + '.json');
			});
		}
		if (exportCsvBtn) {
			exportCsvBtn.addEventListener('click', function () {
				var entries = getFilteredPlannerEntries();
				var headers = ['title', 'company', 'status', 'priority', 'source', 'location', 'jobType', 'workMode', 'salary', 'appliedAt', 'nextStep', 'link', 'tags', 'outcome', 'createdAt', 'updatedAt', 'notes'];
				function csvEscape(s) {
					if (s == null) return '';
					var t = String(s);
					if (/[",\n\r]/.test(t)) return '"' + t.replace(/"/g, '""') + '"';
					return t;
				}
				var rows = [headers.join(',')];
				entries.forEach(function (e) {
					rows.push(headers.map(function (h) { return csvEscape(e[h]); }).join(','));
				});
				var blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
				downloadBlob(blob, 'job-planner-' + new Date().toISOString().slice(0, 10) + '.csv');
			});
		}

		if (listEl) {
			listEl.addEventListener('change', function (e) {
				var select = e.target.closest('.planner-status-select');
				if (select) {
					var id = select.getAttribute('data-entry-id');
					var entry = plannerEntries.find(function (p) { return p.id === id; });
					if (entry) {
						entry.status = select.value;
						entry.updatedAt = new Date().toISOString();
						savePlanner();
						renderPlanner();
					}
					return;
				}
			});
			listEl.addEventListener('click', function (e) {
				var delBtn = e.target.closest('.planner-delete-btn');
				if (delBtn) {
					var id = delBtn.getAttribute('data-entry-id');
					plannerEntries = plannerEntries.filter(function (p) { return p.id !== id; });
					savePlanner();
					renderPlanner();
					return;
				}
			});
		}
	}

	// Debounce helper
	function debounce(func, wait) {
		var timeout;
		return function executedFunction() {
			var context = this;
			var args = arguments;
			var later = function () {
				timeout = null;
				func.apply(context, args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	// Browser-side temporary jobs DB (localStorage cache)
	var BROWSER_JOBS_CACHE_KEY = 'analytics_lab_jobs_cache_v1';
	// Snapshot diff cache (per query + selected sources, in this browser)
	var JOBS_DIFF_KEY = 'analytics_lab_jobs_diff_v1';
	var JOBS_LAST_SNAPSHOT_KEY = 'analytics_lab_jobs_last_snapshot_v1';

	function safeLower(s) { return String(s || '').trim().toLowerCase(); }

	function normalizeJobKey(job) {
		if (!job) return '';
		var url = String(job.url || '').trim();
		if (url) return 'url:' + url;
		return 'f:' + [job.source, job.title, job.company, job.location].map(safeLower).join('|');
	}

	function getSnapshotContext() {
		try {
			var urlParams = new URLSearchParams(window.location.search);
			var q = (document.getElementById('job-search-input') && document.getElementById('job-search-input').value) || (urlParams.get('q') || '');
			var backend = (document.getElementById('api-backend-koyeb') && document.getElementById('api-backend-koyeb').checked) ? 'koyeb' : 'vercel';
			var sources = buildSourcesParam() || '';
			return { backend: backend, query: String(q || '').trim(), sources: String(sources || '').trim() };
		} catch (e) {
			return { backend: 'unknown', query: '', sources: '' };
		}
	}

	function writeLastSnapshot(ctx, jobs) {
		try {
			var payload = { ts: Date.now(), ctx: ctx || {}, keys: (jobs || []).map(normalizeJobKey).filter(Boolean) };
			window.localStorage.setItem(JOBS_LAST_SNAPSHOT_KEY, JSON.stringify(payload));
		} catch (e) {}
	}

	function readLastSnapshot() {
		try {
			var raw = window.localStorage.getItem(JOBS_LAST_SNAPSHOT_KEY);
			if (!raw) return null;
			var data = JSON.parse(raw);
			if (!data || !Array.isArray(data.keys)) return null;
			return data;
		} catch (e) { return null; }
	}

	function computeAndRenderDiff(ctx, jobs) {
		if (typeof window === 'undefined' || !window.localStorage) return;
		var last = readLastSnapshot();
		var curKeys = (jobs || []).map(normalizeJobKey).filter(Boolean);
		var curSet = new Set(curKeys);
		var lastKeys = (last && Array.isArray(last.keys)) ? last.keys : [];
		var lastSet = new Set(lastKeys);

		var sameCtx = !!(last && last.ctx &&
			String(last.ctx.backend || '') === String(ctx.backend || '') &&
			String(last.ctx.query || '') === String(ctx.query || '') &&
			String(last.ctx.sources || '') === String(ctx.sources || ''));

		var added = [];
		var removed = [];
		if (sameCtx) {
			curKeys.forEach(function (k) { if (!lastSet.has(k)) added.push(k); });
			lastKeys.forEach(function (k) { if (!curSet.has(k)) removed.push(k); });
		}
		latestAddedJobKeys = {};
		if (sameCtx && added.length) {
			added.forEach(function (k) { latestAddedJobKeys[k] = true; });
		}

		var lookup = {};
		(jobs || []).forEach(function (j) {
			var k = normalizeJobKey(j);
			if (k && !lookup[k]) lookup[k] = { title: j.title, company: j.company, source: j.source, url: j.url, location: j.location };
		});
		try {
			window.localStorage.setItem(JOBS_DIFF_KEY, JSON.stringify({
				ts: Date.now(),
				ctx: ctx,
				added: added.slice(0, 200),
				removed: removed.slice(0, 200),
				lookup: lookup
			}));
		} catch (e) {}

		var addedEl = document.getElementById('job-diff-added');
		var removedEl = document.getElementById('job-diff-removed');
		if (addedEl) addedEl.textContent = String(added.length);
		if (removedEl) removedEl.textContent = String(removed.length);
		var btn = document.getElementById('job-diff-view-btn');
		if (btn) btn.classList.toggle('hidden', !(sameCtx && (added.length || removed.length)));
		var banner = document.getElementById('job-new-banner');
		var bannerText = document.getElementById('job-new-banner-text');
		if (banner) {
			var showBanner = sameCtx && added.length > 0;
			banner.classList.toggle('hidden', !showBanner);
			if (showBanner && bannerText) bannerText.textContent = added.length + ' new jobs since last refresh';
		}
	}

	function saveJobsToBrowserCache(payload) {
		try {
			if (typeof window === 'undefined' || !window.localStorage) return;
			var toStore = {
				timestamp: Date.now(),
				jobs: Array.isArray(payload.jobs) ? payload.jobs : [],
				sourceCounts: payload.sourceCounts || {},
				sources: Array.isArray(payload.sources) ? payload.sources : []
			};
			window.localStorage.setItem(BROWSER_JOBS_CACHE_KEY, JSON.stringify(toStore));
		} catch (e) {
			console.warn('Unable to save jobs cache to browser storage:', e);
		}
	}

	function loadJobsFromBrowserCache(maxAgeMs) {
		try {
			if (typeof window === 'undefined' || !window.localStorage) return null;
			var raw = window.localStorage.getItem(BROWSER_JOBS_CACHE_KEY);
			if (!raw) return null;
			var data = JSON.parse(raw);
			if (!data || !Array.isArray(data.jobs)) return null;
			var ts = typeof data.timestamp === 'number' ? data.timestamp : 0;
			if (maxAgeMs && ts && Date.now() - ts > maxAgeMs) {
				return null;
			}
			return data;
		} catch (e) {
			console.warn('Unable to read jobs cache from browser storage:', e);
			return null;
		}
	}

	// Fetch jobs from cached API (fast) or trigger refresh
	function fetchAllJobs(forceRefresh) {
		var requestId = beginJobsRequest();
		setJobLivePill('loading', forceRefresh ? 'Refreshing feed...' : 'Fetching jobs...');
		var loadingEl = document.getElementById('job-loading');
		var jobListEl = document.getElementById('job-list');
		var emptyEl = document.getElementById('job-empty');

		var errorEl = document.getElementById('job-error');
		if (errorEl) errorEl.classList.add('hidden');
		
		if (loadingEl) {
			loadingEl.style.display = 'block';
			var detailEl = document.getElementById('job-loading-detail');
			if (detailEl) {
				detailEl.textContent = forceRefresh 
					? 'Refreshing jobs from all portals... This may take 30-60 seconds.'
					: 'Loading jobs from all sources (same as Playground)...';
			}
		}
		if (jobListEl) jobListEl.style.display = 'none';
		if (emptyEl) emptyEl.classList.add('hidden');

		allJobs = [];
		
		var proxyUrl = (typeof window !== 'undefined' && window.JOB_PROXY_URL) ? String(window.JOB_PROXY_URL).replace(/\/$/, '') : '';
		var koyebRadio = document.getElementById('api-backend-koyeb');
		var vercelRadio = document.getElementById('api-backend-vercel');
		var rssjobsRadio = document.getElementById('api-backend-rssjobs');
		var isKoyeb = (koyebRadio && koyebRadio.checked);
		var isRssjobs = (rssjobsRadio && rssjobsRadio.checked);
		if (!proxyUrl && (vercelRadio && vercelRadio.checked || rssjobsRadio && rssjobsRadio.checked)) proxyUrl = 'https://playground-serveless.vercel.app';
		if (!proxyUrl && isKoyeb) proxyUrl = getJobSearchApiBase();
		
		var urlParams = new URLSearchParams(window.location.search);
		var searchInput = document.getElementById('job-search-input');
		var locationInput = document.getElementById('job-location-input');
		var daysSlider = document.getElementById('days-old-slider');
		var resultsSlider = document.getElementById('results-wanted-slider');
		var remoteOnlyCb = document.getElementById('job-remote-only');
		var yoeMinEl = document.getElementById('job-yoe-min');
		var yoeMaxEl = document.getElementById('job-yoe-max');
		var vercelRole = document.getElementById('vercel-search-role');
		var vercelLocation = document.getElementById('vercel-search-location');
		var vercelDays = document.getElementById('vercel-search-days');
		
		// For Koyeb (job-search-api): use search config inputs. For Vercel: use Vercel search section (role, location, days)
		var query, days, limit, location;
		if (isKoyeb) {
			query = (searchInput && searchInput.value) ? searchInput.value.trim() : (urlParams.get('q') || 'analyst');
			days = (daysSlider && daysSlider.value) ? daysSlider.value : (urlParams.get('days') || '7');
			limit = (resultsSlider && resultsSlider.value) ? resultsSlider.value : (urlParams.get('limit') || '400');
			location = (locationInput && locationInput.value) ? locationInput.value.trim() : (urlParams.get('location') || 'remote');
		} else {
			query = (vercelRole && vercelRole.value) ? vercelRole.value.trim() : (urlParams.get('q') || 'analyst');
			location = (vercelLocation && vercelLocation.value) ? vercelLocation.value.trim() : (urlParams.get('location') || 'remote');
			days = (vercelDays && vercelDays.value) ? vercelDays.value : (urlParams.get('days') || '7');
			limit = (resultsSlider && resultsSlider.value) ? resultsSlider.value : (urlParams.get('limit') || '400');
		}
		var remoteOnly = !!(remoteOnlyCb && remoteOnlyCb.checked);
		var yoeMin = (yoeMinEl && yoeMinEl.value !== '') ? parseInt(String(yoeMinEl.value), 10) : null;
		var yoeMax = (yoeMaxEl && yoeMaxEl.value !== '') ? parseInt(String(yoeMaxEl.value), 10) : null;
		if (yoeMin != null && isNaN(yoeMin)) yoeMin = null;
		if (yoeMax != null && isNaN(yoeMax)) yoeMax = null;
		var fetchProfile = getSelectedFetchProfile();
		lastFetchContext = {
			query: query || 'analyst',
			location: location || 'remote',
			days: parseInt(days, 10) || 7,
			limit: parseInt(limit, 10) || 200,
			fetchProfile: fetchProfile
		};
		(function renderLoadingFetchContext() {
			var contextEl = document.getElementById('job-stats-context');
			if (!contextEl) return;
			var backendLabel = isKoyeb ? 'Hugging Face API' : (isRssjobs ? 'RSSJobs (Direct)' : 'Vercel snapshot');
			var sp = buildSourcesParam();
			var sourcesCount = sp ? sp.split(',').filter(Boolean).length : 0;
			var sourcesLabel = sourcesCount > 0 ? String(sourcesCount) : 'default';
			contextEl.className = 'text-xs text-gray-500 dark:text-gray-400';
			contextEl.textContent = 'Feed: ' + backendLabel + ' · Mode: ' + (fetchProfile === 'advanced' ? 'Advanced' : 'Basic') + ' · Sources: ' + sourcesLabel + ' · Fetching...';
		})();
		// Pagination for job-search-api
		var page = parseInt(urlParams.get('page')) || null;
		var perPage = parseInt(urlParams.get('per_page')) || null;
		// Check for manual rssjobs URL parameter (fallback)
		var rssjobsUrl = urlParams.get('rssjobs') || '';
		var rssFeedInput = document.getElementById('job-rss-feed-url');
		if (rssFeedInput && rssFeedInput.value && String(rssFeedInput.value).trim()) {
			rssjobsUrl = String(rssFeedInput.value).trim();
		}

		// Analytics: capture job search (Koyeb vs Vercel) so dashboard shows usage
		if (typeof window.trackEvent === 'function') {
			window.trackEvent('jobs_search_' + (isKoyeb ? 'koyeb' : (isRssjobs ? 'rssjobs' : 'vercel')), {
				backend: isKoyeb ? 'koyeb' : (isRssjobs ? 'rssjobs' : 'vercel'),
				query: query || null,
				days: days || null,
				limit: limit || null,
				forceRefresh: !!forceRefresh
			});
		}
		
		var sourcesParam = buildSourcesParam();
		
		// If direct RSSJobs search is selected:
		if (isRssjobs) {
			var rssjobsApiUrl = proxyUrl 
				? (proxyUrl + '/api/rssjobs?q=' + encodeURIComponent(query) + '&location=' + encodeURIComponent(location))
				: ('/api/rssjobs?q=' + encodeURIComponent(query) + '&location=' + encodeURIComponent(location));
			
			fetchWithTimeout(rssjobsApiUrl, {}, 25000)
				.then(function (r) { return r.json(); })
				.then(function (data) {
					if (!data || !data.ok || !Array.isArray(data.jobs)) {
						console.error('rssjobs fetch failed:', data);
						if (errorEl) errorEl.classList.remove('hidden');
						if (loadingEl) loadingEl.style.display = 'none';
						return;
					}
					allJobs = [];
					data.jobs.forEach(function (item) {
						var job = normalizeJobFromApi(item);
						if (job) allJobs.push(job);
					});
					if (!isActiveJobsRequest(requestId)) return;
					processJobsData(data, requestId);
					saveJobsToBrowserCache({
						jobs: allJobs.slice(0),
						sourceCounts: { 'rssjobs': allJobs.length },
						sources: ['rssjobs']
					});
				})
				.catch(function (err) {
					console.error('rssjobs fetch error:', err);
					if (loadingEl) loadingEl.style.display = 'none';
				});
			return;
		}

		// job-search-api: Use /refresh (POST) and /jobs (GET) endpoints
		if (isKoyeb) {
			if (forceRefresh) {
				// POST /refresh
				var headlessEl = document.getElementById('job-enable-headless');
				var enableHeadless = !!(headlessEl && headlessEl.checked);
				var refreshMode = (fetchProfile === 'advanced' || enableHeadless) ? 'all' : 'rss';
				var refreshUrl = proxyUrl + '/refresh?q=' + encodeURIComponent(query) + '&days=' + encodeURIComponent(days) + '&mode=' + encodeURIComponent(refreshMode) + '&headless=' + (enableHeadless ? '1' : '0');
				refreshUrl += '&fetch_profile=' + encodeURIComponent(fetchProfile);
				if (rssjobsUrl) refreshUrl += '&rssjobs=' + encodeURIComponent(rssjobsUrl);
				if (sourcesParam) refreshUrl += '&sources=' + encodeURIComponent(sourcesParam);
				
				fetchWithTimeout(refreshUrl, { method: 'POST' }, 85000)
					.then(function (r) { return r.json().then(function (body) { return { ok: r.ok, body: body }; }).catch(function () { return { ok: false, body: null }; }); })
					.then(function (res) {
						var refreshData = res.ok ? res.body : null;
						if (refreshData && refreshData.ok && Array.isArray(refreshData.jobs)) {
							// /refresh returns jobs directly (snake_case from FastAPI)
							allJobs = [];
							refreshData.jobs.forEach(function (item) {
								var job = normalizeJobFromApi(item);
								if (job) allJobs.push(job);
							});
							// Apply the user's preference after refresh (refresh returns broad set)
							allJobs = allJobs.filter(function (j) {
								if (remoteOnly) {
									var loc = String(j.location || '').toLowerCase();
									var isRemote = loc.indexOf('remote') !== -1 || loc.indexOf('wfh') !== -1 || loc.indexOf('work from home') !== -1 || loc.indexOf('distributed') !== -1 || loc.indexOf('anywhere') !== -1;
									if (!isRemote) return false;
								}
								if (yoeMin != null || yoeMax != null) {
									var jMin = (j.yoeMin == null) ? null : parseInt(String(j.yoeMin), 10);
									var jMax = (j.yoeMax == null) ? null : parseInt(String(j.yoeMax), 10);
									if (jMin != null && !isNaN(jMin) && yoeMax != null && jMin > yoeMax) return false;
									if (jMax != null && !isNaN(jMax) && yoeMin != null && jMax < yoeMin) return false;
								}
								return true;
							});
							sourceCounts = refreshData.sourceCounts || {};
							apiSources = Array.isArray(refreshData.sources) ? refreshData.sources : [];
							if (!isActiveJobsRequest(requestId)) return;
							processJobsData({ sourceCounts: sourceCounts, sources: apiSources }, requestId);
							saveJobsToBrowserCache({ jobs: allJobs.slice(0), sourceCounts: sourceCounts, sources: apiSources });
						} else {
							// Fallback to /jobs endpoint
							fetchJobSearchApiJobs(proxyUrl, query, days, limit, page, perPage, remoteOnly, yoeMin, yoeMax, fetchProfile, requestId);
						}
					})
					.catch(function (err) {
						console.error('job-search-api refresh failed:', err);
						if (!isActiveJobsRequest(requestId)) return;
						fetchJobSearchApiJobs(proxyUrl, query, days, limit, page, perPage, remoteOnly, yoeMin, yoeMax, fetchProfile, requestId);
					});
				return;
			} else {
				// GET /jobs (cached) - use higher limit or pagination
				fetchJobSearchApiJobs(proxyUrl, query, days, limit, page, perPage, remoteOnly, yoeMin, yoeMax, fetchProfile, requestId);
				return;
			}
		}
		
		// Vercel API: Use /api/jobs-snapshot and /api/jobs-refresh (GET, same as playground)
		// If forcing refresh, call refresh endpoint; use its response when it has jobs, else fall back to snapshot
		if (forceRefresh) {
			var refreshUrl = proxyUrl
				? (proxyUrl + '/api/jobs-refresh?q=' + encodeURIComponent(query) + '&days=' + encodeURIComponent(days) + '&location=' + encodeURIComponent(location))
				: ('/api/jobs-refresh?q=' + encodeURIComponent(query) + '&days=' + encodeURIComponent(days) + '&location=' + encodeURIComponent(location));
			if (sourcesParam) refreshUrl += '&sources=' + encodeURIComponent(sourcesParam);

			fetchWithTimeout(refreshUrl, {}, 25000)
				.then(function (r) { return r.json().then(function (body) { return { ok: r.ok, body: body }; }).catch(function () { return { ok: false, body: null }; }); })
				.then(function (res) {
					var refreshData = res.ok ? res.body : null;
					if (refreshData && refreshData.ok && Array.isArray(refreshData.jobs) && refreshData.jobs.length > 0) {
						allJobs = [];
						refreshData.jobs.forEach(function (item) {
							var job = normalizeJobFromApi(item);
							if (job) allJobs.push(job);
						});
						if (!isActiveJobsRequest(requestId)) return;
						processJobsData(refreshData, requestId);
						saveJobsToBrowserCache({
							jobs: allJobs.slice(0),
							sourceCounts: refreshData.sourceCounts || {},
							sources: refreshData.sources || []
						});
					} else {
						fetchJobsSnapshot(proxyUrl, query, days, limit, rssjobsUrl, location, requestId);
					}
				})
				.catch(function (err) {
					console.error('Refresh failed:', err);
					if (!isActiveJobsRequest(requestId)) return;
					fetchJobsSnapshot(proxyUrl, query, days, limit, rssjobsUrl, location, requestId);
				});
			return;
		}
		// Primary: use jobs-snapshot (same API as playground); pass location for Vercel (Indeed/Stack Overflow)
		fetchJobsSnapshot(proxyUrl, query, days, limit, rssjobsUrl, location, requestId);
	}
	
	// Fetch jobs from rssjobs.app via job-search-api /rssjobs endpoint (no CORS, no feed URL needed) or Vercel proxy
	function fetchRssJobsFromRssjobsApp(keywords, location) {
		var requestId = beginJobsRequest();
		var loadingEl = document.getElementById('job-loading');
		var errorEl = document.getElementById('job-error');
		var errorMsgEl = document.getElementById('job-error-message');
		var jobListEl = document.getElementById('job-list');
		var emptyEl = document.getElementById('job-empty');
		var feedUrlInput = document.getElementById('job-rss-feed-url');
		
		// Reset state
		if (jobListEl) jobListEl.style.display = 'none';
		if (emptyEl) emptyEl.classList.add('hidden');
		allJobs = [];
		
		// Update loading message
		if (loadingEl) {
			loadingEl.style.display = 'block';
			var detailEl = document.getElementById('job-loading-detail');
			if (detailEl) detailEl.textContent = 'Fetching jobs from rssjobs.app...';
		}
		if (errorEl) errorEl.classList.add('hidden');
		
		var proxyUrl = (typeof window !== 'undefined' && window.JOB_PROXY_URL) ? String(window.JOB_PROXY_URL).replace(/\/$/, '') : '';
		var koyebRadio = document.getElementById('api-backend-koyeb');
		var isKoyebBackend = (koyebRadio && koyebRadio.checked) || (proxyUrl && proxyUrlLooksLikeJobSearchApi(proxyUrl));
		
		// Use keywords and location from dropdowns (no feed URL required)
		var query = keywords || 'data analyst';
		var loc = location || 'remote';
		var limit = 400;
		
		if (isKoyebBackend) {
			// job-search-api: Use /rssjobs endpoint directly (no feed URL needed, no CORS)
			var apiUrl = proxyUrl + '/rssjobs?keywords=' + encodeURIComponent(query) + '&location=' + encodeURIComponent(loc) + '&limit=' + limit;
			
			fetch(apiUrl)
				.then(function (r) { return r.ok ? r.json() : null; })
				.then(function (data) {
					if (!data || !data.ok || !Array.isArray(data.jobs) || data.jobs.length === 0) {
						if (loadingEl) loadingEl.style.display = 'none';
						if (errorEl) errorEl.classList.remove('hidden');
						if (errorMsgEl) {
							errorMsgEl.textContent = data && data.error ? data.error : 'No jobs found from rssjobs.app';
						}
						return;
					}
					
					allJobs = [];
					data.jobs.forEach(function (item) {
						var job = normalizeJobFromApi(item);
						if (job) {
							job.source = job.source || 'rssjobs.app';
							job.tags = (job.tags && job.tags.length) ? job.tags : ['rssjobs'];
							allJobs.push(job);
						}
					});
					
					sourceCounts = { 'rssjobs.app': allJobs.length };
					apiSources = ['rssjobs.app'];
					if (!isActiveJobsRequest(requestId)) return;
					processJobsData({ sourceCounts: sourceCounts, sources: apiSources }, requestId);
					saveJobsToBrowserCache({ jobs: allJobs.slice(0), sourceCounts: sourceCounts, sources: apiSources });
				})
				.catch(function (err) {
					console.error('job-search-api /rssjobs error:', err);
					if (loadingEl) loadingEl.style.display = 'none';
					if (errorEl) errorEl.classList.remove('hidden');
					if (errorMsgEl) {
						errorMsgEl.textContent = 'Failed to fetch jobs from rssjobs.app: ' + (err.message || 'Network error');
					}
				});
		} else {
			// Vercel: Use jobs-snapshot with optional feed URL (for manual feeds)
			var rssjobsFeedUrl = feedUrlInput && feedUrlInput.value ? feedUrlInput.value.trim() : '';
			var urlParams = new URLSearchParams(window.location.search);
			var days = urlParams.get('days') || '3';
			fetchJobsSnapshot(proxyUrl, query, days, limit, rssjobsFeedUrl, loc, requestId);
		}
	}
	
	// Helper function to format date
	function formatDate(date) {
		if (!date) return '';
		var d = new Date(date);
		if (isNaN(d.getTime())) return '';
		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
	}
	
	// Helper function to get time ago
	function getTimeAgo(date) {
		if (!date) return '';
		var d = new Date(date);
		if (isNaN(d.getTime())) return '';
		var now = new Date();
		var diffMs = now - d;
		var diffMins = Math.floor(diffMs / 60000);
		var diffHours = Math.floor(diffMs / 3600000);
		var diffDays = Math.floor(diffMs / 86400000);
		
		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return diffMins + 'm ago';
		if (diffHours < 24) return diffHours + 'h ago';
		if (diffDays < 7) return diffDays + 'd ago';
		return formatDate(date);
	}
	
	// Try browser cache then show error (used when both snapshot and cached API fail)
	function tryBrowserCacheThenError(cacheMaxAgeMs, requestId) {
		var loadingEl = document.getElementById('job-loading');
		var errorEl = document.getElementById('job-error');
		var errorMsgEl = document.getElementById('job-error-message');
		var cached = loadJobsFromBrowserCache(cacheMaxAgeMs || (1000 * 60 * 30)); // default 30 min
		if (cached && Array.isArray(cached.jobs) && cached.jobs.length) {
			allJobs = cached.jobs.slice(0);
			sourceCounts = cached.sourceCounts || {};
			apiSources = Array.isArray(cached.sources) ? cached.sources : [];
			if (!isActiveJobsRequest(requestId)) return;
			processJobsData({ sourceCounts: sourceCounts, sources: apiSources }, requestId);
			setJobLivePill('warn', 'Using browser cache');
			if (loadingEl) loadingEl.style.display = 'none';
			return;
		}
		// Last-resort fallback: direct free public APIs (no Vercel/Koyeb dependency).
		fetchPublicJobsFallback(
			(lastFetchContext && lastFetchContext.query) || 'analyst',
			(lastFetchContext && lastFetchContext.location) || 'remote',
			(lastFetchContext && lastFetchContext.days) || 7,
			(lastFetchContext && lastFetchContext.limit) || 200,
			requestId
		).then(function (ok) {
			if (!isActiveJobsRequest(requestId)) return;
			if (ok) {
				setJobLivePill('warn', 'Using public fallback APIs');
				if (loadingEl) loadingEl.style.display = 'none';
				return;
			}
			if (loadingEl) loadingEl.style.display = 'none';
			if (errorEl) {
				errorEl.classList.remove('hidden');
				if (errorMsgEl) errorMsgEl.textContent = 'Could not load jobs. Backends are down and public fallback also failed. Try again later.';
				setJobLivePill('error', 'Feed unavailable');
				var retryBtn = document.getElementById('job-error-retry');
				if (retryBtn) retryBtn.onclick = function () { fetchAllJobs(true); };
			}
		}).catch(function () {
			if (!isActiveJobsRequest(requestId)) return;
			if (loadingEl) loadingEl.style.display = 'none';
			if (errorEl) {
				errorEl.classList.remove('hidden');
				if (errorMsgEl) errorMsgEl.textContent = 'Could not load jobs. Backends are down and public fallback also failed. Try again later.';
				setJobLivePill('error', 'Feed unavailable');
				var retryBtn2 = document.getElementById('job-error-retry');
				if (retryBtn2) retryBtn2.onclick = function () { fetchAllJobs(true); };
			}
		});
	}

	function fetchPublicJobsFallback(query, location, days, limit, requestId) {
		var q = String(query || 'analyst').toLowerCase();
		var loc = String(location || 'remote').toLowerCase();
		var maxItems = Math.min(parseInt(limit, 10) || 200, 400);
		var cutoffMs = Date.now() - ((parseInt(days, 10) || 7) * 24 * 60 * 60 * 1000);

		function parseDateSafe(raw) {
			if (!raw) return null;
			var d = new Date(raw);
			return isNaN(d.getTime()) ? null : d;
		}
		function containsQuery(text) {
			if (!q) return true;
			var t = String(text || '').toLowerCase();
			return q.split(/\s+/).some(function (tok) { return tok && t.indexOf(tok) !== -1; });
		}
		function containsLocation(text) {
			if (!loc || loc === 'remote' || loc === 'remote (any)') return true;
			return String(text || '').toLowerCase().indexOf(loc) !== -1;
		}

		var remotiveUrl = 'https://remotive.com/api/remote-jobs?search=' + encodeURIComponent(q);
		var arbeitnowUrl = 'https://www.arbeitnow.com/api/job-board-api';

		var remotiveReq = fetchWithTimeout(remotiveUrl, {}, 12000)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				var out = [];
				var jobs = data && Array.isArray(data.jobs) ? data.jobs : [];
				for (var i = 0; i < jobs.length; i++) {
					var j = jobs[i] || {};
					var posted = parseDateSafe(j.publication_date);
					if (posted && posted.getTime() < cutoffMs) continue;
					var hay = [j.title, j.company_name, j.description, j.category].join(' ');
					if (!containsQuery(hay)) continue;
					if (!containsLocation(j.candidate_required_location)) continue;
					out.push({
						id: 'free_remotive_' + (j.id || i),
						title: j.title || 'Untitled role',
						company: j.company_name || 'Unknown',
						location: j.candidate_required_location || 'Remote',
						url: j.url || '',
						date: posted ? posted.toISOString() : null,
						description: j.description || '',
						source: 'remotive',
						tags: Array.isArray(j.tags) ? j.tags : ['remotive']
					});
				}
				return out;
			})
			.catch(function () { return []; });

		var arbeitnowReq = fetchWithTimeout(arbeitnowUrl, {}, 12000)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				var out = [];
				var jobs = data && Array.isArray(data.data) ? data.data : [];
				for (var i = 0; i < jobs.length; i++) {
					var j = jobs[i] || {};
					var posted = parseDateSafe(j.created_at || j.createdAt);
					if (posted && posted.getTime() < cutoffMs) continue;
					var hay = [j.title, j.company_name, j.description, (j.tags || []).join(' ')].join(' ');
					if (!containsQuery(hay)) continue;
					if (!containsLocation(j.location)) continue;
					out.push({
						id: 'free_arbeitnow_' + (j.slug || i),
						title: j.title || 'Untitled role',
						company: j.company_name || 'Unknown',
						location: j.location || 'Remote',
						url: j.url || '',
						date: posted ? posted.toISOString() : null,
						description: j.description || '',
						source: 'arbeitnow',
						tags: Array.isArray(j.tags) ? j.tags : ['arbeitnow']
					});
				}
				return out;
			})
			.catch(function () { return []; });

		return Promise.all([remotiveReq, arbeitnowReq]).then(function (res) {
			var merged = (res[0] || []).concat(res[1] || []);
			if (!merged.length) return false;
			merged.sort(function (a, b) {
				var da = a.date ? new Date(a.date).getTime() : 0;
				var db = b.date ? new Date(b.date).getTime() : 0;
				return db - da;
			});
			allJobs = merged.slice(0, maxItems).map(function (item) {
				return normalizeJobFromApi(item) || item;
			}).filter(Boolean);
			sourceCounts = {};
			allJobs.forEach(function (j) {
				var src = j.source || 'public_api';
				sourceCounts[src] = (sourceCounts[src] || 0) + 1;
			});
			apiSources = Object.keys(sourceCounts);
			if (!isActiveJobsRequest(requestId)) return false;
			processJobsData({
				sourceCounts: sourceCounts,
				sources: apiSources,
				generatedAt: new Date().toISOString()
			}, requestId);
			saveJobsToBrowserCache({ jobs: allJobs.slice(0), sourceCounts: sourceCounts, sources: apiSources });
			return true;
		}).catch(function () {
			return false;
		});
	}

	// Fetch from cached jobs API (fallback when snapshot fails)
	function fetchCachedJobs(proxyUrl, query, days, limit, requestId) {
		var cachedUrl = proxyUrl 
			? (proxyUrl + '/api/jobs-cached?q=' + encodeURIComponent(query))
			: ('/api/jobs-cached?q=' + encodeURIComponent(query));
		
		fetchWithTimeout(cachedUrl, {}, 18000)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				var loadingEl = document.getElementById('job-loading');
				var errorEl = document.getElementById('job-error');
				
				if (!data || !data.ok || !Array.isArray(data.jobs) || data.jobs.length === 0) {
					tryBrowserCacheThenError(1000 * 60 * 30, requestId);
					return;
				}
				
				data.jobs.forEach(function (item) {
					var job = normalizeJobFromApi(item);
					if (job) allJobs.push(job);
				});
				if (!isActiveJobsRequest(requestId)) return;
				processJobsData(data, requestId);
				saveJobsToBrowserCache({ jobs: allJobs.slice(0), sourceCounts: sourceCounts, sources: apiSources });
			})
			.catch(function (err) {
				console.error('Cached jobs API error:', err);
				tryBrowserCacheThenError(1000 * 60 * 30, requestId);
			});
	}
	
	// job-search-api: Fetch jobs from /jobs endpoint (cached) - supports pagination
	function fetchJobSearchApiJobs(proxyUrl, query, days, limit, page, perPage, remoteOnly, yoeMin, yoeMax, fetchProfile, requestId) {
		var useSearchEndpoint = true;
		var apiUrl = proxyUrl + (useSearchEndpoint ? '/jobs/search' : '/jobs') + '?q=' + encodeURIComponent(query) + '&days=' + encodeURIComponent(days);
		if (remoteOnly) apiUrl += '&remote_only=1';
		if (yoeMin != null) apiUrl += '&yoe_min=' + encodeURIComponent(String(yoeMin));
		if (yoeMax != null) apiUrl += '&yoe_max=' + encodeURIComponent(String(yoeMax));
		apiUrl += '&sort=relevance';
		apiUrl += '&role_profile=' + encodeURIComponent('data_analytics');
		if (fetchProfile === 'advanced') {
			apiUrl += '&min_match_score=30';
		}
		
		// Use pagination if provided, otherwise use limit (max 400)
		if (page && perPage) {
			apiUrl += '&page=' + page + '&per_page=' + perPage;
		} else {
			// Increase limit to 400 (max) to get more jobs in one request
			var requestLimit = Math.min(parseInt(limit) || 400, 400);
			apiUrl += '&limit=' + requestLimit;
		}
		
		fetchWithTimeout(apiUrl, {}, 22000)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				var loadingEl = document.getElementById('job-loading');
				var errorEl = document.getElementById('job-error');
				
				if (!data || !data.ok || !Array.isArray(data.jobs) || data.jobs.length === 0) {
					// /jobs might be empty if storage not persisting, try /refresh as fallback
					console.log('job-search-api /jobs empty, trying /refresh...');
					fetchJobSearchApiRefresh(proxyUrl, query, days, limit, fetchProfile, requestId);
					return;
				}
				
				allJobs = [];
				data.jobs.forEach(function (item) {
					var job = normalizeJobFromApi(item);
					if (job) allJobs.push(job);
				});
				
				sourceCounts = data.sourceCounts || {};
				apiSources = Array.isArray(data.sources) ? data.sources : [];
				
				// Handle pagination info if available
				if (data.total !== undefined && data.page !== undefined && data.per_page !== undefined) {
					var totalPages = Math.ceil(data.total / data.per_page);
					console.log('job-search-api pagination:', 'Page ' + data.page + ' of ' + totalPages + ', Total jobs: ' + data.total);
					
					// If using pagination and there are more pages, fetch them
					// But only if we're not already at the limit
					var targetLimit = parseInt(limit) || 400;
					if (data.page < totalPages && allJobs.length < targetLimit && !page) {
						// Auto-fetch next pages up to the limit
						var remainingJobs = targetLimit - allJobs.length;
						var jobsPerPage = data.per_page;
						var pagesNeeded = Math.ceil(remainingJobs / jobsPerPage);
						
						var pagesFetched = 0;
						var fetchNextPage = function(pageNum) {
							if (pagesFetched >= pagesNeeded || allJobs.length >= targetLimit) {
								if (!isActiveJobsRequest(requestId)) return;
								processJobsData({ sourceCounts: sourceCounts, sources: apiSources }, requestId);
								saveJobsToBrowserCache({ jobs: allJobs.slice(0), sourceCounts: sourceCounts, sources: apiSources });
								return;
							}
							
							var pageUrl = proxyUrl + (useSearchEndpoint ? '/jobs/search' : '/jobs') + '?q=' + encodeURIComponent(query) + '&days=' + encodeURIComponent(days);
							if (remoteOnly) pageUrl += '&remote_only=1';
							if (yoeMin != null) pageUrl += '&yoe_min=' + encodeURIComponent(String(yoeMin));
							if (yoeMax != null) pageUrl += '&yoe_max=' + encodeURIComponent(String(yoeMax));
							pageUrl += '&sort=relevance&role_profile=data_analytics';
							pageUrl += '&page=' + pageNum + '&per_page=' + jobsPerPage;
							fetchWithTimeout(pageUrl, {}, 22000)
								.then(function (r) { return r.ok ? r.json() : null; })
								.then(function (pageData) {
									if (!isActiveJobsRequest(requestId)) return;
									if (pageData && pageData.ok && Array.isArray(pageData.jobs)) {
										pageData.jobs.forEach(function (item) {
											var job = normalizeJobFromApi(item);
											if (job && allJobs.length < targetLimit) allJobs.push(job);
										});
										pagesFetched++;
										fetchNextPage(pageNum + 1);
									} else {
										processJobsData({ sourceCounts: sourceCounts, sources: apiSources }, requestId);
										saveJobsToBrowserCache({ jobs: allJobs.slice(0), sourceCounts: sourceCounts, sources: apiSources });
									}
								})
								.catch(function (err) {
									console.error('Error fetching page ' + pageNum + ':', err);
									if (!isActiveJobsRequest(requestId)) return;
									processJobsData({ sourceCounts: sourceCounts, sources: apiSources }, requestId);
									saveJobsToBrowserCache({ jobs: allJobs.slice(0), sourceCounts: sourceCounts, sources: apiSources });
								});
						};
						
						// Start fetching next pages
						fetchNextPage(data.page + 1);
						return; // Don't process yet, wait for all pages
					}
				}
				
				if (!isActiveJobsRequest(requestId)) return;
				processJobsData({ sourceCounts: sourceCounts, sources: apiSources }, requestId);
				saveJobsToBrowserCache({ jobs: allJobs.slice(0), sourceCounts: sourceCounts, sources: apiSources });
			})
			.catch(function (err) {
				console.error('job-search-api /jobs error:', err);
				// Fallback to /refresh
				fetchJobSearchApiRefresh(proxyUrl, query, days, limit, fetchProfile, requestId);
			});
	}
	
	// job-search-api: Fetch jobs from /refresh endpoint (scrapes fresh)
	function fetchJobSearchApiRefresh(proxyUrl, query, days, limit, fetchProfile, requestId) {
		var headlessEl = document.getElementById('job-enable-headless');
		var enableHeadless = !!(headlessEl && headlessEl.checked);
		var refreshMode = (fetchProfile === 'advanced' || enableHeadless) ? 'all' : 'rss';
		var refreshUrl = proxyUrl + '/refresh?q=' + encodeURIComponent(query) + '&days=' + encodeURIComponent(days) + '&mode=' + encodeURIComponent(refreshMode) + '&headless=' + (enableHeadless ? '1' : '0');
		refreshUrl += '&fetch_profile=' + encodeURIComponent(fetchProfile || 'basic');
		var sp = buildSourcesParam();
		if (sp) refreshUrl += '&sources=' + encodeURIComponent(sp);
		
		fetchWithTimeout(refreshUrl, { method: 'POST' }, 85000)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				var loadingEl = document.getElementById('job-loading');
				var errorEl = document.getElementById('job-error');
				
				if (!data || !data.ok || !Array.isArray(data.jobs)) {
					tryBrowserCacheThenError(1000 * 60 * 30, requestId);
					return;
				}
				
				allJobs = [];
				data.jobs.forEach(function (item) {
					var job = normalizeJobFromApi(item);
					if (job) allJobs.push(job);
				});
				
				sourceCounts = data.sourceCounts || {};
				apiSources = Array.isArray(data.sources) ? data.sources : [];
				if (!isActiveJobsRequest(requestId)) return;
				processJobsData({ sourceCounts: sourceCounts, sources: apiSources }, requestId);
				saveJobsToBrowserCache({ jobs: allJobs.slice(0), sourceCounts: sourceCounts, sources: apiSources });
			})
			.catch(function (err) {
				console.error('job-search-api /refresh error:', err);
				tryBrowserCacheThenError(1000 * 60 * 30, requestId);
			});
	}
	
	// Primary: jobs-snapshot API (same as Playground). Optional location (for Indeed/Stack Overflow), rssjobs = rssjobs.app feed URL.
	function fetchJobsSnapshot(proxyUrl, query, days, limit, rssjobsFeedUrl, location, requestId) {
		var apiUrl = proxyUrl
			? (proxyUrl + '/api/jobs-snapshot?q=' + encodeURIComponent(query) + '&days=' + encodeURIComponent(days) + '&limit=' + encodeURIComponent(limit))
			: ('/api/jobs-snapshot?q=' + encodeURIComponent(query) + '&days=' + encodeURIComponent(days) + '&limit=' + encodeURIComponent(limit));
		if (location && String(location).trim()) apiUrl += '&location=' + encodeURIComponent(String(location).trim());
		if (rssjobsFeedUrl && rssjobsFeedUrl.trim().length > 0) {
			apiUrl += '&rssjobs=' + encodeURIComponent(rssjobsFeedUrl.trim());
		}
		var sp = buildSourcesParam();
		if (sp) apiUrl += '&sources=' + encodeURIComponent(sp);
		
		fetchWithTimeout(apiUrl, {}, 22000)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.ok || !Array.isArray(data.jobs)) {
					console.log('Jobs snapshot failed, trying cached API...');
					fetchCachedJobs(proxyUrl, query, days, limit, requestId);
					return;
				}
				
				data.jobs.forEach(function (item) {
					var job = normalizeJobFromApi(item);
					if (job) allJobs.push(job);
				});
				
				if (!isActiveJobsRequest(requestId)) return;
				processJobsData(data, requestId);

				// Save latest successful jobs snapshot to browser cache (temporary DB)
				saveJobsToBrowserCache({
					jobs: allJobs.slice(0),
					sourceCounts: sourceCounts,
					sources: apiSources
				});
			})
			.catch(function (err) {
				console.error('Jobs snapshot network error:', err);
				fetchCachedJobs(proxyUrl, query, days, limit, requestId);
			});
	}
	
	// Process jobs data (common logic)
	function processJobsData(data, requestId) {
		if (requestId != null && !isActiveJobsRequest(requestId)) return;
		// "Data stamp": show when the backend produced the dataset
		(function () {
			var stampEl = document.getElementById('job-stats-updated');
			if (!stampEl) return;
			var ts = (data && (data.generatedAt || data.generated_at || data.saved_at)) || null;
			if (!ts) {
				stampEl.textContent = '—';
				return;
			}
			var d = new Date(ts);
			if (isNaN(d.getTime())) {
				stampEl.textContent = 'Updated: ' + String(ts);
				return;
			}
			stampEl.textContent = 'Updated: ' + d.toLocaleString();
		})();

		// Compute source counts if missing (cached API usually only returns jobs + sources)
		if (!data || !data.sourceCounts) {
			sourceCounts = {};
			allJobs.forEach(function (j) {
				var src = j.source || 'unknown';
				sourceCounts[src] = (sourceCounts[src] || 0) + 1;
			});
		} else {
			sourceCounts = data.sourceCounts;
		}
		if (!data || !Array.isArray(data.sources)) {
			apiSources = Object.keys(sourceCounts || {}).sort();
		} else {
			apiSources = data.sources;
		}

		// Filter out irrelevant jobs before calculating scores
		enrichMissingJobTags();
		allJobs = allJobs.filter(function (job) {
			var fullText = (job.title + ' ' + job.description + ' ' + (job.tags || []).join(' ')).toLowerCase();
			return isDataScienceJob(fullText);
		});
		// Canonical URL dedupe to avoid duplicates across feeds/sources.
		var seenCanonical = {};
		allJobs = allJobs.filter(function (job) {
			var key = canonicalizeJobUrl(job.url);
			if (!key) return false;
			if (seenCanonical[key]) return false;
			seenCanonical[key] = true;
			job.url = key;
			return true;
		});

		// Calculate match scores
		allJobs.forEach(function (job) {
			job.matchScore = calculateMatchScore(job);
		});

		// Filter out jobs with very low match scores (< 5%) - likely irrelevant
		allJobs = allJobs.filter(function (job) {
			return job.matchScore >= 5;
		});

		// Sort by match score (highest first), then by date (newest first)
		allJobs.sort(function (a, b) {
			if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
			var dateA = new Date(a.date || 0);
			var dateB = new Date(b.date || 0);
			return dateB - dateA;
		});

		updateSourceFilterDropdown();
		(function renderSourceDegradationNotice() {
			var host = document.getElementById('job-stats-diff');
			if (!host) return;
			var id = 'job-source-issues-inline';
			var existing = document.getElementById(id);
			if (!data || !Array.isArray(data._errors) || !data._errors.length) {
				if (existing) existing.remove();
				setJobLivePill('ok', 'Live feed healthy');
				return;
			}
			var unique = {};
			for (var i = 0; i < data._errors.length; i++) {
				var src = data._errors[i] && data._errors[i].source ? String(data._errors[i].source) : 'unknown';
				unique[src] = true;
			}
			var badSources = Object.keys(unique).sort();
			if (!existing) {
				existing = document.createElement('span');
				existing.id = id;
				existing.className = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300';
				host.appendChild(existing);
			}
			existing.textContent = 'Degraded sources: ' + badSources.join(', ');
			existing.title = 'Some sources failed in this fetch. Results may be partial.';
			setJobLivePill('warn', 'Partial feed (' + badSources.length + ' degraded)');
		})();
		markRefreshCompleteNow();
		(function renderFetchContextStatus() {
			var contextEl = document.getElementById('job-stats-context');
			if (!contextEl) return;
			var ctx = getSnapshotContext();
			var backend = (ctx && ctx.backend) || 'unknown';
			var backendLabel = backend === 'koyeb'
				? 'Hugging Face API'
				: (backend === 'vercel' ? 'Vercel snapshot' : 'Browser/public fallback');
			var sourceTotal = Object.keys(sourceCounts || {}).length;
			var errorsCount = (data && Array.isArray(data._errors)) ? data._errors.length : 0;
			var ts = data && (data.generatedAt || data.generated_at || data.saved_at);
			var freshness = '';
			if (ts) {
				var d = new Date(ts);
				if (!isNaN(d.getTime())) {
					var ageMin = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
					freshness = ageMin <= 1 ? 'fresh now' : ('fresh ' + ageMin + 'm ago');
				}
			}
			var parts = [
				'Feed: ' + backendLabel,
				'Sources: ' + sourceTotal
			];
			if (freshness) parts.push(freshness);
			if (errorsCount > 0) parts.push('partial (' + errorsCount + ' source errors)');
			contextEl.textContent = parts.join(' · ');
			contextEl.className = errorsCount > 0
				? 'text-xs text-amber-700 dark:text-amber-300'
				: 'text-xs text-gray-500 dark:text-gray-400';
		})();
		
		// Added/removed since last refresh (per query + selected sources)
		try {
			var ctx = getSnapshotContext();
			computeAndRenderDiff(ctx, allJobs);
			writeLastSnapshot(ctx, allJobs);
		} catch (e) {}
		
		applyFilters();
		var loadingEl = document.getElementById('job-loading');
		if (loadingEl) loadingEl.style.display = 'none';
		
		updateSourceStats();
	}

	function enrichMissingJobTags() {
		// Many sources don't provide normalized tags. For filtering, we generate lightweight tags
		// from common skills found in title/description.
		var tagKeywords = [
			'sql',
			'python',
			'r',
			'pandas',
			'numpy',
			'tableau',
			'power bi',
			'looker',
			'plotly',
			'matplotlib',
			'seaborn',
			'spark',
			'airflow',
			'kafka',
			'dask',
			'dbt',
			'snowflake',
			'redshift',
			'bigquery',
			'aws',
			'azure',
			'gcp',
			'docker',
			'kubernetes',
			'machine learning',
			'deep learning',
			'nlp',
			'computer vision',
			'statistics',
			'experiment',
			'a/b'
		];

		for (var i = 0; i < allJobs.length; i++) {
			var job = allJobs[i];
			var tags = Array.isArray(job.tags) ? job.tags : [];
			if (tags && tags.length > 0) continue;

			var text = ((job.title || '') + ' ' + (job.company || '') + ' ' + (job.location || '') + ' ' + (job.description || '')).toLowerCase();
			var found = [];
			for (var k = 0; k < tagKeywords.length; k++) {
				var kw = tagKeywords[k];
				// Simple substring match; keeps it fast.
				if (text.indexOf(kw) !== -1) found.push(kw);
			}

			// Add role-family tags if we detect them.
			if (/(data analyst|business analyst|product analyst)/.test(text)) found.push('analyst');
			if (/(data scientist|research scientist)/.test(text)) found.push('scientist');
			if (/(ml engineer|machine learning engineer|analytics engineer)/.test(text)) found.push('engineer');

			// De-dupe while preserving order.
			var seen = {};
			var deduped = [];
			for (var f = 0; f < found.length; f++) {
				var t = found[f];
				if (t && !seen[t]) {
					seen[t] = true;
					deduped.push(t);
				}
			}

			job.tags = deduped;
		}
	}

	var currentDetailJob = null;

	function buildChatGPTPrepPrompt(job) {
		var role = job.title || 'this role';
		var company = job.company || '';
		var location = job.location || '';
		var desc = String(job.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
		if (desc.length > 8000) desc = desc.slice(0, 8000) + '...';
		var header = 'I am preparing for an interview. Please help me as follows.\n\n' +
			'**Role:** ' + role + (company ? '\n**Company:** ' + company : '') + (location ? '\n**Location:** ' + location : '') + '\n\n' +
			'**Job description:**\n' + (desc || '(No description provided.)') + '\n\n' +
			'**Instructions for you (the AI):**\n' +
			'1. First, ask me about my background and relevant experience (e.g. years of experience, key skills, recent roles). Wait for my answer.\n' +
			'2. Then, using the job description above, act as an interviewer. Ask me one interview question at a time (behavioral, technical, or role-specific). Base each question on this role and JD.\n' +
			'3. After each answer, give brief constructive feedback, then ask the next question.\n' +
			'4. After 5–7 questions, give a short overall prep tip. Keep responses concise.\n\n' +
			'Start by asking about my background.';
		return header;
	}

	function openJobDetails(job) {
		var modal = document.getElementById('job-detail-modal');
		if (!modal || !job) return;
		currentDetailJob = job;
		var previousActive = document.activeElement;

		var titleEl = document.getElementById('job-detail-title');
		var sourceEl = document.getElementById('job-detail-source');
		var companyEl = document.getElementById('job-detail-company');
		var metaEl = document.getElementById('job-detail-meta');
		var tagsEl = document.getElementById('job-detail-tags');
		var descEl = document.getElementById('job-detail-description');
		var applyEl = document.getElementById('job-detail-apply');
		var plannerBtn = document.getElementById('job-detail-add-planner');
		var prepBtn = document.getElementById('job-detail-prep-interview');

		if (titleEl) titleEl.textContent = job.title || 'Job details';
		if (sourceEl) sourceEl.textContent = job.source ? ('Source: ' + job.source) : '';
		if (companyEl) companyEl.textContent = (job.company || 'Unknown') + (job.location ? (' · ' + job.location) : '');
		var metaParts = [];
		if (job.postedAgo) metaParts.push(job.postedAgo);
		if (job.dateFormatted) metaParts.push(job.dateFormatted);
		if (job.date && !job.dateFormatted) metaParts.push(job.date);
		if (metaEl) metaEl.textContent = metaParts.join(' · ');

		if (tagsEl) {
			var tagsHtml = '';
			var tags = Array.isArray(job.tags) ? job.tags : [];
			tags.slice(0, 12).forEach(function (t) {
				tagsHtml += '<span class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">' + escapeHtml(t) + '</span>';
			});
			tagsEl.innerHTML = tagsHtml;
		}

		if (descEl) {
			var txt = String(job.description || '').replace(/<[^>]*>/g, '').trim();
			descEl.textContent = txt || 'No description available.';
		}

		if (applyEl) applyEl.href = job.url || '#';
		if (plannerBtn) {
			plannerBtn.onclick = function () {
				addJobToPlanner(job);
				closeJobDetails();
			};
		}
		if (prepBtn) {
			prepBtn.onclick = function () {
				var desc = String(job.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
				if (desc.length > 1200) desc = desc.slice(0, 1200) + '...';
				var prepMessage = 'Help me prepare for an interview for this role:\n\nRole: ' + (job.title || '') + '\nCompany: ' + (job.company || '') + '\nLocation: ' + (job.location || '') + '\n\nJob description:\n' + desc + '\n\nPlease suggest: 1) 5–8 likely interview questions for this role, 2) how to answer them, 3) key points to emphasize.';
				if (typeof window.openAssistantWithMessage === 'function') {
					window.openAssistantWithMessage(prepMessage);
				} else {
					window.alert('Assistant is loading. Try again in a moment.');
				}
			};
		}

		var copyChatBtn = document.getElementById('job-detail-copy-chatgpt');
		if (copyChatBtn) {
			copyChatBtn.onclick = function () {
				var prompt = buildChatGPTPrepPrompt(job);
				navigator.clipboard.writeText(prompt).then(function () {
					window.open('https://chat.openai.com/', '_blank', 'noopener');
					window.alert('Prompt copied. Paste it in the new ChatGPT tab to start. The AI will ask about your background first, then run a mock interview based on this JD.');
				}).catch(function () {
					window.prompt('Copy this prompt and paste it into ChatGPT or Gemini:', prompt);
				});
			};
		}

		modal.classList.remove('hidden');
		modal.setAttribute('aria-hidden', 'false');

		// Focus trap and a11y: focus first focusable, trap Tab, Escape to close
		function getModalFocusable() {
			var sel = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
			return modal.querySelectorAll(sel);
		}
		function handleModalKey(e) {
			if (e.key === 'Escape') {
				closeJobDetails();
				return;
			}
			if (e.key !== 'Tab') return;
			var focusable = getModalFocusable();
			focusable = Array.prototype.filter.call(focusable, function (el) {
				return el.offsetParent !== null && !el.disabled;
			});
			if (!focusable.length) return;
			var first = focusable[0];
			var last = focusable[focusable.length - 1];
			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		}
		modal._jobDetailPreviousActive = previousActive;
		document.addEventListener('keydown', handleModalKey);
		modal._jobDetailKeyHandler = handleModalKey;
		var closeBtn = document.getElementById('job-detail-close');
		if (closeBtn && typeof closeBtn.focus === 'function') {
			setTimeout(function () { closeBtn.focus(); }, 50);
		}
	}

	function closeJobDetails() {
		var modal = document.getElementById('job-detail-modal');
		if (!modal) return;
		if (modal._jobDetailKeyHandler) {
			document.removeEventListener('keydown', modal._jobDetailKeyHandler);
			modal._jobDetailKeyHandler = null;
		}
		var previousActive = modal._jobDetailPreviousActive;
		modal._jobDetailPreviousActive = null;
		modal.classList.add('hidden');
		modal.setAttribute('aria-hidden', 'true');
		if (previousActive && typeof previousActive.focus === 'function') {
			setTimeout(function () { previousActive.focus(); }, 50);
		}
	}

	// Legacy fallback: individual fetchers (if jobs-snapshot API is unavailable)
	function fetchAllJobsLegacy() {
		var loadingEl = document.getElementById('job-loading');
		var promises = [
			fetchRemoteOK(),
			fetchStackOverflow(),
			fetchGitHubJobs(),
			fetchWeWorkRemotely(),
			fetchRemotive(),
			fetchArbeitnow(),
			fetchNaukri(),
			fetchWellfound(),
			fetchIndeed(),
			fetchGoogleJobs(),
			fetchLinkedIn(),
			fetchInstahyre(),
			fetchHirist(),
			fetchHimalaya()
		];

		Promise.allSettled(promises).then(function () {
			// Deduplicate jobs by URL
			var seen = new Set();
			allJobs = allJobs.filter(function (job) {
				if (seen.has(job.url)) return false;
				seen.add(job.url);
				return true;
			});

			// Calculate match scores
			allJobs.forEach(function (job) {
				job.matchScore = calculateMatchScore(job);
			});

			// Sort by match score (highest first)
			allJobs.sort(function (a, b) {
				return b.matchScore - a.matchScore;
			});

			applyFilters();
			if (loadingEl) loadingEl.style.display = 'none';
		});
	}

	// Fetch from RemoteOK
	function fetchRemoteOK() {
		return fetch('https://remoteok.com/api')
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!Array.isArray(data)) return;
				data.forEach(function (item) {
					if (!item || !item.position || !item.url) return;
					var title = item.position.toLowerCase();
					var description = (item.description || '').toLowerCase();
					var tags = (item.tags || []).join(' ').toLowerCase();
					var fullText = title + ' ' + description + ' ' + tags;

					// Filter for data science related
					if (!isDataScienceJob(fullText)) return;

					allJobs.push({
						id: 'remoteok_' + item.id,
						title: item.position,
						company: item.company || 'Unknown',
						location: item.location || 'Remote',
						url: item.url.startsWith('http') ? item.url : 'https://remoteok.com' + item.url,
						description: item.description || '',
						tags: item.tags || [],
						source: 'remoteok',
						date: item.date || new Date().toISOString()
					});
				});
			})
			.catch(function (err) {
				console.error('RemoteOK fetch error:', err);
			});
	}

	// Fetch from Stack Overflow Jobs (RSS)
	function fetchStackOverflow() {
		var rssUrl = encodeURIComponent('https://stackoverflow.com/jobs/feed?q=data+science&l=remote&d=20&u=Km');
		var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + rssUrl + '&api_key=public&count=50';

		return fetch(apiUrl)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.items || !Array.isArray(data.items)) return;
				data.items.forEach(function (item) {
					if (!item || !item.title) return;
					var title = item.title.toLowerCase();
					var description = (item.description || item.content || '').toLowerCase();
					var fullText = title + ' ' + description;

					if (!isDataScienceJob(fullText)) return;

					// Extract company from title (format: "Job Title at Company")
					var company = 'Unknown';
					var titleParts = item.title.split(' at ');
					if (titleParts.length > 1) {
						company = titleParts[1].trim();
					}

					allJobs.push({
						id: 'so_' + (item.guid || item.link || Math.random()).replace(/[^a-zA-Z0-9]/g, '_'),
						title: titleParts[0] || item.title,
						company: company,
						location: 'Remote',
						url: item.link || '#',
						description: item.description || item.content || '',
						tags: [],
						source: 'stackoverflow',
						date: item.pubDate || new Date().toISOString()
					});
				});
			})
			.catch(function (err) {
				console.error('Stack Overflow fetch error:', err);
			});
	}

	// Fetch from GitHub Jobs (deprecated but might work)
	function fetchGitHubJobs() {
		// GitHub Jobs API is deprecated, but we can try RSS
		var rssUrl = encodeURIComponent('https://jobs.github.com/positions.json?description=data+science&location=remote');
		// Actually GitHub Jobs API returns JSON directly
		return fetch('https://jobs.github.com/positions.json?description=data+science&location=remote')
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!Array.isArray(data)) return;
				data.forEach(function (item) {
					if (!item || !item.title) return;
					var title = item.title.toLowerCase();
					var description = (item.description || '').toLowerCase();
					var fullText = title + ' ' + description;

					if (!isDataScienceJob(fullText)) return;

					allJobs.push({
						id: 'github_' + item.id,
						title: item.title,
						company: item.company || 'Unknown',
						location: item.location || 'Remote',
						url: item.url || '#',
						description: item.description || '',
						tags: [],
						source: 'github',
						date: item.created_at || new Date().toISOString()
					});
				});
			})
			.catch(function (err) {
				console.error('GitHub Jobs fetch error:', err);
			});
	}

	// Fetch from We Work Remotely (free RSS feed)
	function fetchWeWorkRemotely() {
		// We Work Remotely provides free RSS feeds
		var rssUrl = encodeURIComponent('https://weworkremotely.com/categories/remote-programming-jobs.rss');
		var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + rssUrl + '&api_key=public&count=50';

		return fetch(apiUrl)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.items || !Array.isArray(data.items)) return;
				data.items.forEach(function (item) {
					if (!item || !item.title) return;
					var title = item.title.toLowerCase();
					var description = (item.description || item.content || '').toLowerCase();
					var fullText = title + ' ' + description;

					if (!isDataScienceJob(fullText)) return;

					// Extract company from title (format: "Job Title: Company Name")
					var company = 'Unknown';
					var titleParts = item.title.split(':');
					var jobTitle = item.title;
					if (titleParts.length > 1) {
						company = titleParts[titleParts.length - 1].trim();
						jobTitle = titleParts.slice(0, -1).join(':').trim();
					}

					allJobs.push({
						id: 'wwr_' + (item.guid || item.link || Math.random()).replace(/[^a-zA-Z0-9]/g, '_'),
						title: jobTitle,
						company: company,
						location: 'Remote',
						url: item.link || '#',
						description: item.description || item.content || '',
						tags: [],
						source: 'weworkremotely',
						date: item.pubDate || new Date().toISOString()
					});
				});
			})
			.catch(function (err) {
				console.error('We Work Remotely fetch error:', err);
			});
	}

	// Fetch from Remotive (public API) — good for analyst roles, but rate-limited.
	function fetchRemotive() {
		// Remotive warns about excessive requests; cache aggressively.
		var TTL = 1000 * 60 * 60 * 6; // 6 hours
		var cached = readCache('remotive', TTL);
		if (Array.isArray(cached) && cached.length) {
			cached.forEach(function (j) { allJobs.push(j); });
			return Promise.resolve();
		}

		var url = 'https://remotive.com/api/remote-jobs?search=' + encodeURIComponent('data analyst');
		return fetch(url)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				var jobs = data && (data.jobs || data['remote-jobs'] || data.results);
				if (!Array.isArray(jobs) || !jobs.length) return;
				var out = [];
				for (var i = 0; i < jobs.length; i++) {
					var item = jobs[i];
					if (!item) continue;
					var title = (item.title || '').toLowerCase();
					var description = (item.description || item.description_plain || '').toLowerCase();
					var tags = (item.tags || []).join(' ').toLowerCase();
					var fullText = title + ' ' + description + ' ' + tags;
					if (!isDataScienceJob(fullText)) continue;
					out.push({
						id: 'remotive_' + (item.id || item.job_id || Math.random()).toString().replace(/[^a-zA-Z0-9]/g, '_'),
						title: item.title || 'Untitled',
						company: item.company_name || item.company || 'Unknown',
						location: item.candidate_required_location || item.location || 'Remote',
						url: item.url || item.job_url || '#',
						description: item.description || item.description_plain || '',
						tags: (item.tags || []).concat(item.category ? [item.category] : []),
						source: 'remotive',
						date: item.publication_date || item.created_at || new Date().toISOString()
					});
					if (out.length >= 40) break; // keep it lightweight
				}
				if (out.length) {
					writeCache('remotive', out);
					out.forEach(function (j) { allJobs.push(j); });
				}
			})
			.catch(function (err) {
				console.error('Remotive fetch error:', err);
			});
	}

	// Fetch from Arbeitnow (public API) — broad board, we filter to data/analyst roles.
	function fetchArbeitnow() {
		var TTL = 1000 * 60 * 60; // 1 hour
		var cached = readCache('arbeitnow', TTL);
		if (Array.isArray(cached) && cached.length) {
			cached.forEach(function (j) { allJobs.push(j); });
			return Promise.resolve();
		}

		return fetch('https://www.arbeitnow.com/api/job-board-api')
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				var items = data && data.data;
				if (!Array.isArray(items) || !items.length) return;
				var out = [];
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					if (!item || !item.title) continue;
					var title = String(item.title || '').toLowerCase();
					var description = String(item.description || '').toLowerCase();
					var tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';
					var fullText = title + ' ' + description + ' ' + tags;
					if (!isDataScienceJob(fullText)) continue;
					out.push({
						id: 'arbeitnow_' + String(item.slug || item.url || Math.random()).replace(/[^a-zA-Z0-9]/g, '_'),
						title: item.title || 'Untitled',
						company: item.company_name || 'Unknown',
						location: item.location || (item.remote ? 'Remote' : 'Unknown'),
						url: item.url || '#',
						description: item.description || '',
						tags: item.tags || [],
						source: 'arbeitnow',
						date: item.created_at ? new Date(item.created_at * 1000).toISOString() : new Date().toISOString()
					});
					if (out.length >= 40) break;
				}
				if (out.length) {
					writeCache('arbeitnow', out);
					out.forEach(function (j) { allJobs.push(j); });
				}
			})
			.catch(function (err) {
				console.error('Arbeitnow fetch error:', err);
			});
	}

	// Fetch from Indeed (requires backend proxy with HasData API key)
	function fetchIndeed() {
		// Indeed requires a backend proxy with HasData API key
		// For now, this is a placeholder - implement backend proxy at /api/indeed
		var proxyUrl = (typeof window !== 'undefined' && window.JOB_PROXY_URL) ? window.JOB_PROXY_URL : '';
		if (!proxyUrl) {
			console.log('Indeed: No proxy URL configured. Set window.JOB_PROXY_URL to enable.');
			return Promise.resolve();
		}

		return fetch(proxyUrl + '/api/indeed?q=data+science&l=remote')
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.results || !Array.isArray(data.results)) return;
				data.results.forEach(function (item) {
					if (!item || !item.title) return;
					var title = item.title.toLowerCase();
					var description = (item.description || item.snippet || '').toLowerCase();
					var fullText = title + ' ' + description;

					if (!isDataScienceJob(fullText)) return;

					allJobs.push({
						id: 'indeed_' + (item.jobkey || item.id || Math.random()).replace(/[^a-zA-Z0-9]/g, '_'),
						title: item.title || 'Untitled',
						company: item.company || 'Unknown',
						location: item.location || item.formattedLocation || 'Remote',
						url: item.url || item.link || '#',
						description: item.description || item.snippet || '',
						tags: [],
						source: 'indeed',
						date: item.date || new Date().toISOString()
					});
				});
			})
			.catch(function (err) {
				console.error('Indeed fetch error:', err);
			});
	}

	// Fetch from Google Jobs (requires backend proxy with ScraperAPI/SerpAPI key)
	function fetchGoogleJobs() {
		// Google Jobs requires a backend proxy with ScraperAPI or SerpAPI key
		var proxyUrl = (typeof window !== 'undefined' && window.JOB_PROXY_URL) ? window.JOB_PROXY_URL : '';
		if (!proxyUrl) {
			console.log('Google Jobs: No proxy URL configured. Set window.JOB_PROXY_URL to enable.');
			return Promise.resolve();
		}

		return fetch(proxyUrl + '/api/googlejobs?q=data+science&location=remote')
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.jobs || !Array.isArray(data.jobs)) return;
				data.jobs.forEach(function (item) {
					if (!item || !item.title) return;
					var title = item.title.toLowerCase();
					var description = (item.description || item.snippet || '').toLowerCase();
					var fullText = title + ' ' + description;

					if (!isDataScienceJob(fullText)) return;

					allJobs.push({
						id: 'googlejobs_' + (item.job_id || item.id || Math.random()).replace(/[^a-zA-Z0-9]/g, '_'),
						title: item.title || 'Untitled',
						company: item.company_name || item.company || 'Unknown',
						location: item.location || 'Remote',
						url: item.link || item.apply_link || '#',
						description: item.description || item.snippet || '',
						tags: [],
						source: 'googlejobs',
						date: item.detected_extensions?.posted_at || new Date().toISOString()
					});
				});
			})
			.catch(function (err) {
				console.error('Google Jobs fetch error:', err);
			});
	}

	// Fetch from LinkedIn (requires backend proxy with Apify API key)
	function fetchLinkedIn() {
		// LinkedIn requires a backend proxy with Apify API key
		var proxyUrl = (typeof window !== 'undefined' && window.JOB_PROXY_URL) ? window.JOB_PROXY_URL : '';
		if (!proxyUrl) {
			console.log('LinkedIn: No proxy URL configured. Set window.JOB_PROXY_URL to enable.');
			return Promise.resolve();
		}

		return fetch(proxyUrl + '/api/linkedin?keywords=data+science&location=remote')
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.results || !Array.isArray(data.results)) return;
				data.results.forEach(function (item) {
					if (!item || !item.title) return;
					var title = item.title.toLowerCase();
					var description = (item.description || item.jobDescription || '').toLowerCase();
					var fullText = title + ' ' + description;

					if (!isDataScienceJob(fullText)) return;

					allJobs.push({
						id: 'linkedin_' + (item.jobId || item.id || Math.random()).replace(/[^a-zA-Z0-9]/g, '_'),
						title: item.title || 'Untitled',
						company: item.companyName || item.company || 'Unknown',
						location: item.location || 'Remote',
						url: item.url || item.jobUrl || '#',
						description: item.description || item.jobDescription || '',
						tags: [],
						source: 'linkedin',
						date: item.postedDate || new Date().toISOString()
					});
				});
			})
			.catch(function (err) {
				console.error('LinkedIn fetch error:', err);
			});
	}

	// Fetch from Naukri (public API endpoint)
	function fetchNaukri() {
		// Try public Naukri API endpoint
		// Note: This may have CORS restrictions, so backend proxy might be needed
		var apiUrl = 'https://www.naukri.com/jobapi/v2/search?keyword=data%20science&location=remote&pageNo=0&pageSize=20';
		
		return fetch(apiUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0',
				'Accept': 'application/json'
			}
		})
			.then(function (r) { 
				if (!r.ok) {
					// If CORS fails, try backend proxy
					var proxyUrl = (typeof window !== 'undefined' && window.JOB_PROXY_URL) ? window.JOB_PROXY_URL : '';
					if (proxyUrl) {
						return fetch(proxyUrl + '/api/naukri?keyword=data+science&location=remote')
							.then(function (pr) { return pr.ok ? pr.json() : null; });
					}
					return null;
				}
				return r.json(); 
			})
			.then(function (data) {
				if (!data) return;
				var jobs = data.jobDetails || data.results || (data.data && data.data.jobDetails) || [];
				if (!Array.isArray(jobs)) return;
				
				jobs.forEach(function (item) {
					if (!item || !item.title) return;
					var title = (item.title || item.jobTitle || '').toLowerCase();
					var description = (item.description || item.jobDescription || item.jd || '').toLowerCase();
					var fullText = title + ' ' + description;

					if (!isDataScienceJob(fullText)) return;

					allJobs.push({
						id: 'naukri_' + (item.jobId || item.id || Math.random()).replace(/[^a-zA-Z0-9]/g, '_'),
						title: item.title || item.jobTitle || 'Untitled',
						company: item.companyName || item.company || 'Unknown',
						location: item.location || item.locations?.[0] || 'Remote',
						url: item.url || item.jobUrl || (item.jobId ? 'https://www.naukri.com/job-details/' + item.jobId : '#'),
						description: item.description || item.jobDescription || item.jd || '',
						tags: item.skills || item.keySkills || [],
						source: 'naukri',
						date: item.postedDate || item.createdDate || new Date().toISOString()
					});
				});
			})
			.catch(function (err) {
				console.error('Naukri fetch error:', err);
				// Try backend proxy as fallback
				var proxyUrl = (typeof window !== 'undefined' && window.JOB_PROXY_URL) ? window.JOB_PROXY_URL : '';
				if (proxyUrl) {
					return fetch(proxyUrl + '/api/naukri?keyword=data+science&location=remote')
						.then(function (r) { return r.ok ? r.json() : null; })
						.then(function (data) {
							if (!data || !data.results || !Array.isArray(data.results)) return;
							data.results.forEach(function (item) {
								if (!item || !item.title) return;
								var title = item.title.toLowerCase();
								var description = (item.description || item.jobDescription || '').toLowerCase();
								var fullText = title + ' ' + description;
								if (!isDataScienceJob(fullText)) return;
								allJobs.push({
									id: 'naukri_' + (item.jobId || item.id || Math.random()).replace(/[^a-zA-Z0-9]/g, '_'),
									title: item.title || item.jobTitle || 'Untitled',
									company: item.companyName || item.company || 'Unknown',
									location: item.location || 'Remote',
									url: item.url || item.jobUrl || '#',
									description: item.description || item.jobDescription || '',
									tags: item.skills || [],
									source: 'naukri',
									date: item.postedDate || new Date().toISOString()
								});
							});
						})
						.catch(function (e) { console.error('Naukri proxy error:', e); });
				}
			});
	}

	// Fetch from Wellfound (formerly AngelList) - via RSS or backend proxy
	function fetchWellfound() {
		// Try RSS feed first
		var rssUrl = encodeURIComponent('https://wellfound.com/jobs.rss?keywords=data-science&remote=true');
		var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + rssUrl + '&api_key=public&count=50';

		return fetch(apiUrl)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (data && data.items && Array.isArray(data.items)) {
					data.items.forEach(function (item) {
						if (!item || !item.title) return;
						var title = item.title.toLowerCase();
						var description = (item.description || item.content || '').toLowerCase();
						var fullText = title + ' ' + description;

						if (!isDataScienceJob(fullText)) return;

						var company = 'Unknown';
						var titleParts = item.title.split(' at ');
						if (titleParts.length > 1) {
							company = titleParts[1].trim();
						}

						allJobs.push({
							id: 'wellfound_' + (item.guid || item.link || Math.random()).replace(/[^a-zA-Z0-9]/g, '_'),
							title: titleParts[0] || item.title,
							company: company,
							location: 'Remote',
							url: item.link || '#',
							description: item.description || item.content || '',
							tags: [],
							source: 'wellfound',
							date: item.pubDate || new Date().toISOString()
						});
					});
					return;
				}
				// If RSS fails, try backend proxy
				var proxyUrl = (typeof window !== 'undefined' && window.JOB_PROXY_URL) ? window.JOB_PROXY_URL : '';
				if (proxyUrl) {
					return fetch(proxyUrl + '/api/wellfound?keywords=data+science&remote=true')
						.then(function (r) { return r.ok ? r.json() : null; })
						.then(function (proxyData) {
							if (!proxyData || !proxyData.results || !Array.isArray(proxyData.results)) return;
							proxyData.results.forEach(function (item) {
								if (!item || !item.title) return;
								var title = item.title.toLowerCase();
								var description = (item.description || '').toLowerCase();
								var fullText = title + ' ' + description;
								if (!isDataScienceJob(fullText)) return;
								allJobs.push({
									id: 'wellfound_' + (item.id || Math.random()).replace(/[^a-zA-Z0-9]/g, '_'),
									title: item.title || 'Untitled',
									company: item.company || item.startup?.name || 'Unknown',
									location: item.location || 'Remote',
									url: item.url || item.applyUrl || '#',
									description: item.description || '',
									tags: item.tags || [],
									source: 'wellfound',
									date: item.createdAt || new Date().toISOString()
								});
							});
						});
				}
			})
			.catch(function (err) {
				console.error('Wellfound fetch error:', err);
			});
	}

	// Fetch from Instahyre (requires backend proxy)
	function fetchInstahyre() {
		var proxyUrl = (typeof window !== 'undefined' && window.JOB_PROXY_URL) ? window.JOB_PROXY_URL : '';
		if (!proxyUrl) {
			console.log('Instahyre: No proxy URL configured. Set window.JOB_PROXY_URL to enable.');
			return Promise.resolve();
		}

		return fetch(proxyUrl + '/api/instahyre?keywords=data+science&location=remote')
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.results || !Array.isArray(data.results)) return;
				data.results.forEach(function (item) {
					if (!item || !item.title) return;
					var title = item.title.toLowerCase();
					var description = (item.description || item.jobDescription || '').toLowerCase();
					var fullText = title + ' ' + description;

					if (!isDataScienceJob(fullText)) return;

					allJobs.push({
						id: 'instahyre_' + (item.jobId || item.id || Math.random()).replace(/[^a-zA-Z0-9]/g, '_'),
						title: item.title || 'Untitled',
						company: item.companyName || item.company || 'Unknown',
						location: item.location || 'Remote',
						url: item.url || item.jobUrl || '#',
						description: item.description || item.jobDescription || '',
						tags: item.skills || [],
						source: 'instahyre',
						date: item.postedDate || new Date().toISOString()
					});
				});
			})
			.catch(function (err) {
				console.error('Instahyre fetch error:', err);
			});
	}

	// Fetch from Hirist (requires backend proxy)
	function fetchHirist() {
		var proxyUrl = (typeof window !== 'undefined' && window.JOB_PROXY_URL) ? window.JOB_PROXY_URL : '';
		if (!proxyUrl) {
			console.log('Hirist: No proxy URL configured. Set window.JOB_PROXY_URL to enable.');
			return Promise.resolve();
		}

		return fetch(proxyUrl + '/api/hirist?keywords=data+science&location=remote')
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.results || !Array.isArray(data.results)) return;
				data.results.forEach(function (item) {
					if (!item || !item.title) return;
					var title = item.title.toLowerCase();
					var description = (item.description || item.jobDescription || '').toLowerCase();
					var fullText = title + ' ' + description;

					if (!isDataScienceJob(fullText)) return;

					allJobs.push({
						id: 'hirist_' + (item.jobId || item.id || Math.random()).replace(/[^a-zA-Z0-9]/g, '_'),
						title: item.title || 'Untitled',
						company: item.companyName || item.company || 'Unknown',
						location: item.location || 'Remote',
						url: item.url || item.jobUrl || '#',
						description: item.description || item.jobDescription || '',
						tags: item.skills || [],
						source: 'hirist',
						date: item.postedDate || new Date().toISOString()
					});
				});
			})
			.catch(function (err) {
				console.error('Hirist fetch error:', err);
			});
	}

	// Fetch from Himalaya (requires backend proxy)
	function fetchHimalaya() {
		var proxyUrl = (typeof window !== 'undefined' && window.JOB_PROXY_URL) ? window.JOB_PROXY_URL : '';
		if (!proxyUrl) {
			console.log('Himalaya: No proxy URL configured. Set window.JOB_PROXY_URL to enable.');
			return Promise.resolve();
		}

		return fetch(proxyUrl + '/api/himalaya?keywords=data+science&remote=true')
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.results || !Array.isArray(data.results)) return;
				data.results.forEach(function (item) {
					if (!item || !item.title) return;
					var title = item.title.toLowerCase();
					var description = (item.description || item.jobDescription || '').toLowerCase();
					var fullText = title + ' ' + description;

					if (!isDataScienceJob(fullText)) return;

					allJobs.push({
						id: 'himalaya_' + (item.jobId || item.id || Math.random()).replace(/[^a-zA-Z0-9]/g, '_'),
						title: item.title || 'Untitled',
						company: item.companyName || item.company || 'Unknown',
						location: item.location || 'Remote',
						url: item.url || item.jobUrl || '#',
						description: item.description || item.jobDescription || '',
						tags: item.skills || [],
						source: 'himalaya',
						date: item.postedDate || new Date().toISOString()
					});
				});
			})
			.catch(function (err) {
				console.error('Himalaya fetch error:', err);
			});
	}

	// Role filter: keywords per focus (your target roles)
	var ROLE_FILTER_KEYWORDS = {
		analyst: [
			'senior data analyst', 'data analyst', 'product analyst', 'business analyst', 'bi analyst',
			'bi developer', 'business intelligence developer', 'insights analyst', 'reporting analyst',
			'marketing analyst', 'growth analyst', 'operations analyst', 'business intelligence', 'analytics analyst'
		],
		scientist: [
			'data scientist', 'associate data scientist', 'research scientist', 'statistician', 'data science'
		],
		engineer: [
			'data engineer', 'associate data engineer', 'analytics engineer', 'ml engineer', 'machine learning engineer',
			'ai engineer', 'data engineering'
		],
		associate_junior: [
			'associate data scientist', 'junior ml engineer', 'junior data engineer', 'associate data engineer',
			'junior data analyst', 'associate analyst', 'junior analyst', 'entry level data', 'entry-level data',
			'associate data analyst', 'junior data scientist'
		]
	};

	function jobMatchesRole(job, role) {
		if (!role || role === 'all') return true;
		var keywords = ROLE_FILTER_KEYWORDS[role];
		if (!keywords || !keywords.length) return true;
		var text = (job.title + ' ' + (job.description || '') + ' ' + (job.tags || []).join(' ')).toLowerCase();
		return keywords.some(function (keyword) {
			return text.indexOf(keyword.toLowerCase()) !== -1;
		});
	}

	// Check if job is data science related (strict filtering)
	function isDataScienceJob(text) {
		var lowerText = String(text || '').toLowerCase();
		
		// Exclude irrelevant categories first
		var excludePatterns = [
			/^online[- ]marketing/i,
			/^marketing$/i,
			/^social media/i,
			/^content marketing/i,
			/^seo/i,
			/^ppc/i,
			/^paid advertising/i,
			/^performance marketing$/i, // Only allow if combined with "analyst" or "data"
			/^praktikum/i, // German internship
			/^intern/i,
			/^trainee$/i
		];
		
		// If title starts with excluded patterns and doesn't mention data/analyst, exclude
		var titleMatch = lowerText.match(/^(online[- ]marketing|marketing|social media|content marketing|seo|ppc|paid advertising|performance marketing|praktikum|intern|trainee)/);
		if (titleMatch && !lowerText.match(/(data|analyst|analytics|bi|business intelligence)/)) {
			return false;
		}
		
		// Required keywords (must have at least one)
		var requiredKeywords = [
			// Core data roles
			'data scientist', 'data analyst', 'data engineer', 'analytics engineer',
			// Analyst-focused (but exclude pure marketing)
			'business analyst', 'product analyst', 'bi analyst', 'bi developer', 
			'insights analyst', 'reporting analyst', 'financial analyst',
			// Only include marketing analyst if it also mentions data/analytics
			'marketing analyst', // Will be filtered further if no data context
			'growth analyst', 'operations analyst', 'senior data analyst',
			// Scientist / Associate / Junior
			'associate data scientist', 'junior ml engineer', 'junior data engineer', 'associate data engineer',
			// Domains / skills
			'data science', 'data analytics', 'business intelligence', 'analytics',
			'machine learning', 'ml engineer', 'ai engineer', 'statistician', 'research scientist',
			'sql', 'python', 'r ', 'tableau', 'power bi', 'looker', 'snowflake'
		];
		
		var hasRequired = requiredKeywords.some(function (keyword) {
			return lowerText.indexOf(keyword) !== -1;
		});
		
		if (!hasRequired) return false;
		
		// If it's "marketing analyst" but no data/analytics context, exclude
		if (lowerText.includes('marketing analyst') || lowerText.includes('marketing analyst')) {
			if (!lowerText.match(/(data|analytics|bi|business intelligence|sql|python|tableau|power bi|looker)/)) {
				return false;
			}
		}
		
		return true;
	}

	// Calculate match score (0-100) — prioritise your focus roles
	function calculateMatchScore(job) {
		var text = (job.title + ' ' + job.description + ' ' + (job.tags || []).join(' ')).toLowerCase();
		var matches = 0;
		var totalKeywords = SKILLS_KEYWORDS.length;

		SKILLS_KEYWORDS.forEach(function (keyword) {
			if (text.indexOf(keyword.toLowerCase()) !== -1) {
				matches++;
			}
		});

		// Weight: your target roles get higher bonus
		var roleKeywords = [
			'senior data analyst', 'product analyst', 'business analyst', 'bi developer', 'bi analyst',
			'associate data scientist', 'junior ml engineer', 'data engineer', 'associate data engineer',
			'data scientist', 'data analyst', 'analytics engineer', 'ml engineer',
			'insights analyst', 'reporting analyst', 'business intelligence'
		];
		var roleMatches = 0;
		roleKeywords.forEach(function (keyword) {
			if (text.indexOf(keyword.toLowerCase()) !== -1) {
				roleMatches++;
			}
		});

		var baseScore = (matches / totalKeywords) * 100;
		var roleBonus = roleMatches * 10;
		var finalScore = Math.min(100, baseScore + roleBonus);

		return Math.round(finalScore);
	}

	// Get match level
	function getMatchLevel(score) {
		if (score >= 80) return 'high';
		if (score >= 50) return 'medium';
		return 'low';
	}

	function normalizeSourceName(source) {
		return String(source || '').toLowerCase().replace(/[\s\-_]/g, '');
	}

	function getSelectedSiteAliases() {
		var selectedAliases = {};
		JOB_SITE_OPTIONS.forEach(function (site) {
			var cb = document.getElementById('site-' + site.id);
			if (!cb || !cb.checked) return;
			(site.aliases || [site.id]).forEach(function (alias) {
				selectedAliases[normalizeSourceName(alias)] = true;
			});
		});
		return selectedAliases;
	}

	function hasAnySiteSelection() {
		return JOB_SITE_OPTIONS.some(function (site) {
			var cb = document.getElementById('site-' + site.id);
			return !!(cb && cb.checked);
		});
	}

	function getSelectedSourceIds() {
		var ids = [];
		JOB_SITE_OPTIONS.forEach(function (site) {
			var cb = document.getElementById('site-' + site.id);
			if (cb && cb.checked) ids.push(site.id);
		});
		return ids;
	}

	function buildSourcesParam() {
		if (!hasAnySiteSelection()) return '';
		var allChecked = JOB_SITE_OPTIONS.every(function (site) {
			var cb = document.getElementById('site-' + site.id);
			return !!(cb && cb.checked);
		});
		if (allChecked) return '';
		return getSelectedSourceIds().join(',');
	}

	// Apply filters
	function applyFilters() {
		var searchInput = document.getElementById('job-search-input');
		var filterSource = document.getElementById('job-filter-source');
		var filterMatch = document.getElementById('job-filter-match');
		var filterStatus = document.getElementById('job-filter-status');
		var filterNewOnly = document.getElementById('job-filter-new-only');
		var filterAge = document.getElementById('job-filter-age');
		var filterRole = document.getElementById('job-filter-role');
		var filterExclude = document.getElementById('job-filter-exclude');
		var filterTags = document.getElementById('job-filter-tags');
		var filterTagMode = document.getElementById('job-filter-tag-mode');

		var searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
		var sourceFilter = filterSource ? filterSource.value : 'all';
		var matchFilter = filterMatch ? filterMatch.value : 'all';
		var statusFilter = filterStatus ? filterStatus.value : 'all';
		var newOnlyFilter = !!(filterNewOnly && filterNewOnly.checked);
		var ageFilter = filterAge ? filterAge.value : 'all';
		var roleFilter = filterRole ? filterRole.value : 'all';
		var excludeInput = filterExclude ? String(filterExclude.value || '').trim().toLowerCase() : '';
		var tagsInput = filterTags ? String(filterTags.value || '').trim().toLowerCase() : '';
		var tagMode = filterTagMode ? filterTagMode.value : 'any';
		var excludeTerms = excludeInput ? excludeInput.split(',').map(function (t) { return t.trim(); }).filter(Boolean) : [];
		var tagTerms = tagsInput ? tagsInput.split(',').map(function (t) { return t.trim(); }).filter(Boolean) : [];
		var selectedSiteAliases = getSelectedSiteAliases();
		var useSiteFilter = hasAnySiteSelection();

		var now = new Date();
		var ageDays = ageFilter === 'all' ? null : parseInt(ageFilter, 10) || null;

		filteredJobs = allJobs.filter(function (job) {
			// Search filter
			if (searchTerm) {
				var searchText = (job.title + ' ' + job.company + ' ' + job.description).toLowerCase();
				if (searchText.indexOf(searchTerm) === -1) return false;
			}

			// Source filter
			if (sourceFilter !== 'all' && job.source !== sourceFilter) return false;
			if (useSiteFilter) {
				var jobSourceNorm = normalizeSourceName(job.source);
				if (!selectedSiteAliases[jobSourceNorm]) return false;
			}

			// Match filter
			if (matchFilter !== 'all') {
				var level = getMatchLevel(job.matchScore);
				if (level !== matchFilter) return false;
			}

			// Status filter
			if (statusFilter !== 'all') {
				var status = applications[job.id] || 'new';
				if (status !== statusFilter) return false;
			}
			if (newOnlyFilter) {
				var jobKey = normalizeJobKey(job);
				if (!jobKey || !latestAddedJobKeys[jobKey]) return false;
			}

			// Age filter (freshness) — works with date, dateFormatted, or postedAgo
			if (ageDays != null) {
				var d = job.date || job.created_at || job.postedAt || job.postedDate;
				if (!d) {
					// Try parsing from dateFormatted (e.g. "17 Feb 2025")
					if (job.dateFormatted) {
						d = new Date(job.dateFormatted);
						if (isNaN(d.getTime())) d = null;
					}
					// Try parsing from postedAgo (e.g. "2 days ago")
					if (!d && job.postedAgo) {
						var agoMatch = job.postedAgo.match(/(\d+)\s*(day|days|hour|hours|minute|minutes|week|weeks|month|months|year|years)\s*ago/);
						if (agoMatch) {
							var num = parseInt(agoMatch[1], 10);
							var unit = agoMatch[2];
							var ms = 0;
							if (unit.indexOf('minute') !== -1) ms = num * 60 * 1000;
							else if (unit.indexOf('hour') !== -1) ms = num * 60 * 60 * 1000;
							else if (unit.indexOf('day') !== -1) ms = num * 24 * 60 * 60 * 1000;
							else if (unit.indexOf('week') !== -1) ms = num * 7 * 24 * 60 * 60 * 1000;
							else if (unit.indexOf('month') !== -1) ms = num * 30 * 24 * 60 * 60 * 1000;
							else if (unit.indexOf('year') !== -1) ms = num * 365 * 24 * 60 * 60 * 1000;
							d = new Date(Date.now() - ms).toISOString();
						}
					}
				}
				if (!d) return false;
				var created = new Date(d);
				if (isNaN(created.getTime())) return false;
				var diffDays = (now - created) / (1000 * 60 * 60 * 24);
				if (diffDays > ageDays) return false;
			}

			// Role focus filter (Analyst / Scientist / Engineer / Associate & Junior)
			if (!jobMatchesRole(job, roleFilter)) return false;

			// Exclude keyword filter (comma-separated)
			if (excludeTerms.length > 0) {
				var hay = ((job.title || '') + ' ' + (job.company || '') + ' ' + (job.description || '') + ' ' + ((job.tags || []).join(' '))).toLowerCase();
				for (var e = 0; e < excludeTerms.length; e++) {
					var ex = excludeTerms[e];
					if (ex && hay.indexOf(ex) !== -1) return false;
				}
			}

			// Tag filter (comma-separated)
			if (tagTerms.length > 0) {
				var jobTagsText = Array.isArray(job.tags) ? job.tags.join(' ').toLowerCase() : '';
				if (tagMode === 'all') {
					for (var t = 0; t < tagTerms.length; t++) {
						var term = tagTerms[t];
						if (term && jobTagsText.indexOf(term) === -1) return false;
					}
				} else {
					// any
					var hit = false;
					for (var t2 = 0; t2 < tagTerms.length; t2++) {
						var term2 = tagTerms[t2];
						if (term2 && jobTagsText.indexOf(term2) !== -1) { hit = true; break; }
					}
					if (!hit) return false;
				}
			}

			return true;
		});

		updateStats();
		renderJobs();
	}

	// Update statistics
	function updateStats() {
		var totalEl = document.getElementById('job-stats-total');
		var matchedEl = document.getElementById('job-stats-matched');
		var appliedEl = document.getElementById('job-stats-applied');

		if (totalEl) {
			totalEl.textContent = filteredJobs.length + ' jobs found';
		}
		if (matchedEl) {
			var highMatches = filteredJobs.filter(function (j) { return getMatchLevel(j.matchScore) === 'high'; }).length;
			matchedEl.textContent = highMatches + ' high matches';
		}
		if (appliedEl) {
			var appliedCount = filteredJobs.filter(function (j) { return applications[j.id] && applications[j.id] !== 'new'; }).length;
			appliedEl.textContent = appliedCount + ' tracked';
		}
	}
	
	// Friendly display name for source id (e.g. hiring_cafe -> Hiring.cafe)
	function sourceDisplayName(src) {
		if (!src) return 'Unknown';
		var opt = JOB_SITE_OPTIONS.find(function (s) { return s.id === src || (s.aliases && s.aliases.indexOf(src) !== -1); });
		return opt ? opt.name : (src.charAt(0).toUpperCase() + src.slice(1).replace(/_/g, ' '));
	}

	// Update source statistics display
	function updateSourceStats() {
		var sourceStatsEl = document.getElementById('job-stats-sources');
		if (!sourceStatsEl) return;
		
		if (Object.keys(sourceCounts).length === 0) {
			sourceStatsEl.innerHTML = '';
			return;
		}
		
		var sources = Object.keys(sourceCounts).sort(function (a, b) {
			return sourceCounts[b] - sourceCounts[a];
		});
		
		var html = '<span class="text-xs text-gray-500 dark:text-gray-400">Sources: </span>';
		var chips = sources.slice(0, 8).map(function (src) {
			var label = sourceDisplayName(src);
			return '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" title="' + escapeHtml(src) + '">' + escapeHtml(label) + ': ' + sourceCounts[src] + '</span>';
		});
		if (sources.length > 8) {
			var rest = sources.slice(8).reduce(function (sum, src) { return sum + sourceCounts[src]; }, 0);
			chips.push('<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">+' + (sources.length - 8) + ' more (' + rest + ')</span>');
		}
		html += chips.join(' ');
		sourceStatsEl.innerHTML = html;
	}
	
	// Update source filter dropdown with sources from API
	function updateSourceFilterDropdown() {
		var filterSource = document.getElementById('job-filter-source');
		if (!filterSource || !apiSources || apiSources.length === 0) return;
		
		// Keep "All Sources" option
		var allOption = filterSource.querySelector('option[value="all"]');
		var currentValue = filterSource.value;
		
		// Remove old source options (keep "All Sources")
		var options = filterSource.querySelectorAll('option');
		options.forEach(function (opt) {
			if (opt.value !== 'all') opt.remove();
		});
		
		// Add new source options from API
		apiSources.sort().forEach(function (src) {
			var opt = document.createElement('option');
			opt.value = src;
			opt.textContent = sourceDisplayName(src);
			if (opt.value === currentValue) opt.selected = true;
			filterSource.appendChild(opt);
		});
	}

	// Render jobs
	function renderJobs() {
		var jobListEl = document.getElementById('job-list');
		var emptyEl = document.getElementById('job-empty');

		if (!jobListEl) return;

		if (filteredJobs.length === 0) {
			jobListEl.style.display = 'none';
			if (emptyEl) emptyEl.classList.remove('hidden');
			return;
		}

		jobListEl.style.display = 'grid';
		if (emptyEl) emptyEl.classList.add('hidden');

		var html = '';
		filteredJobs.forEach(function (job) {
			var matchLevel = getMatchLevel(job.matchScore);
			var status = applications[job.id] || 'new';
			var matchClass = 'match-' + matchLevel;
			var statusClass = 'status-' + status;
			var jobKey = normalizeJobKey(job);
			var isNewSinceLastRefresh = !!(jobKey && latestAddedJobKeys[jobKey]);
			var newCardClass = isNewSinceLastRefresh ? ' ring-2 ring-emerald-400/70 dark:ring-emerald-500/60' : '';

			html += '<div class="job-card group material-card rounded-xl border border-gray-200 dark:border-gray-700 p-4 material-elevation-1' + newCardClass + '">';
			html += '<div class="flex items-start justify-between mb-2">';
			html += '<div class="flex-1">';
			html += '<h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">';
			html += '<a href="' + job.url + '" target="_blank" rel="noopener" class="text-primary hover:underline">' + escapeHtml(job.title) + '</a>';
			html += '</h3>';
			var companyLocation = escapeHtml(job.company) + ' &middot; ' + escapeHtml(job.location);
			if (job.postedAgo && !job.dateFormatted) {
				companyLocation += ' &middot; <span class="text-xs text-gray-500 dark:text-gray-500">' + escapeHtml(job.postedAgo) + '</span>';
			}
			html += '<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">' + companyLocation + '</p>';
			html += '</div>';
			html += '<div class="flex flex-col gap-2 items-end">';
			if (isNewSinceLastRefresh) {
				html += '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30">New</span>';
			}
			html += '<span class="match-badge ' + matchClass + '">' + job.matchScore + '% match</span>';
			html += '<select class="status-select text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" data-job-id="' + job.id + '">';
			html += '<option value="new"' + (status === 'new' ? ' selected' : '') + '>New</option>';
			html += '<option value="applied"' + (status === 'applied' ? ' selected' : '') + '>Applied</option>';
			html += '<option value="interview"' + (status === 'interview' ? ' selected' : '') + '>Interview</option>';
			html += '<option value="rejected"' + (status === 'rejected' ? ' selected' : '') + '>Rejected</option>';
			html += '<option value="offer"' + (status === 'offer' ? ' selected' : '') + '>Offer</option>';
			html += '</select>';
			html += '</div>';
			html += '</div>';
			if (job.description) {
				var desc = job.description.substring(0, 200).replace(/<[^>]*>/g, '');
				html += '<p class="text-sm text-gray-600 dark:text-gray-400 mb-3">' + escapeHtml(desc) + (job.description.length > 200 ? '…' : '') + '</p>';
				// Quick preview on hover (desktop)
				html += '<div class="hidden group-hover:block mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">';
				html += '<p class="text-xs text-gray-600 dark:text-gray-300" style="overflow:hidden;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;">' + escapeHtml(desc) + (job.description.length > 200 ? '…' : '') + '</p>';
				html += '</div>';
			}
			if (job.tags && job.tags.length > 0) {
				html += '<div class="flex flex-wrap gap-1 mb-2">';
				job.tags.slice(0, 5).forEach(function (tag) {
					html += '<span class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">' + escapeHtml(tag) + '</span>';
				});
				html += '</div>';
			}
			html += '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">';
			var sourceInfo = '<div class="flex flex-wrap items-center gap-2">';
			sourceInfo += '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">' + escapeHtml(job.source) + '</span>';
			if (job.postedAgo || job.dateFormatted) {
				if (job.postedAgo) {
					sourceInfo += '<span class="text-xs text-gray-600 dark:text-gray-400 font-medium" title="Posted ' + escapeHtml(job.postedAgo) + '">' + escapeHtml(job.postedAgo) + '</span>';
				}
				if (job.dateFormatted) {
					sourceInfo += '<span class="text-xs text-gray-500 dark:text-gray-500" title="Date: ' + escapeHtml(job.dateFormatted) + '">' + escapeHtml(job.dateFormatted) + '</span>';
				}
			}
			sourceInfo += '</div>';
			html += sourceInfo;
			html += '<div class="flex items-center gap-2">';
			html += '<button type="button" class="job-details-btn text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" data-job-id="' + job.id + '" title="Quick view">Details</button>';
			html += '<button type="button" class="job-prep-chatgpt-btn text-xs px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded font-semibold transition-colors" data-job-id="' + job.id + '" title="Copy JD + prompt and open ChatGPT/Gemini">Prepare</button>';
			html += '<button type="button" class="job-send-to-prep-btn text-xs px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded font-semibold transition-colors" data-job-id="' + job.id + '" title="Send JD to Interview Prep assistant for mock questions and tips">Interview Prep</button>';
			html += '<button type="button" class="job-add-to-planner-btn text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded font-semibold transition-colors" data-job-id="' + job.id + '" title="Add to planner">+ Planner</button>';
			html += '<a href="' + job.url + '" target="_blank" rel="noopener" class="text-xs text-primary hover:underline font-semibold">Apply →</a>';
			html += '</div>';
			html += '</div>';
			html += '</div>';
		});

		jobListEl.innerHTML = html;
		var jobById = {};
		filteredJobs.forEach(function (j) { jobById[j.id] = j; });

		// Use delegated handlers to avoid attaching many listeners per render.
		jobListEl.onchange = function (event) {
			var select = event.target.closest('.status-select');
			if (!select) return;
			var jobId = select.getAttribute('data-job-id');
			var newStatus = select.value;
			applications[jobId] = newStatus;
			saveApplications();
			applyFilters(); // Re-render to update stats
		};
		jobListEl.onclick = function (event) {
			var prepBtn = event.target.closest('.job-prep-chatgpt-btn');
			if (prepBtn) {
				var prepJob = jobById[prepBtn.getAttribute('data-job-id')];
				if (!prepJob) return;
				var prompt = buildChatGPTPrepPrompt(prepJob);
				navigator.clipboard.writeText(prompt).then(function () {
					window.open('https://chat.openai.com/', '_blank', 'noopener');
					window.alert('Prompt copied. Paste it in the new ChatGPT tab. The AI will ask about your background first, then run a mock interview based on this JD.');
				}).catch(function () {
					window.prompt('Copy this prompt and paste into ChatGPT or Gemini:', prompt);
				});
				return;
			}
			var interviewBtn = event.target.closest('.job-send-to-prep-btn');
			if (interviewBtn) {
				var interviewJob = jobById[interviewBtn.getAttribute('data-job-id')];
				if (!interviewJob) return;
				var desc = String(interviewJob.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
				if (desc.length > 1200) desc = desc.slice(0, 1200) + '...';
				var prepMessage = 'Help me prepare for an interview for this role:\n\nRole: ' + (interviewJob.title || '') + '\nCompany: ' + (interviewJob.company || '') + '\nLocation: ' + (interviewJob.location || '') + '\n\nJob description:\n' + desc + '\n\nPlease suggest: 1) 5–8 likely interview questions for this role, 2) how to answer them using the STAR method, 3) key skills and points to emphasize from my experience.';
				if (typeof window.openAssistantWithMessage === 'function') {
					window.openAssistantWithMessage(prepMessage);
				} else {
					window.alert('Interview Prep assistant is loading. Try again in a moment.');
				}
				return;
			}
			var plannerBtn = event.target.closest('.job-add-to-planner-btn');
			if (plannerBtn) {
				var plannerJob = jobById[plannerBtn.getAttribute('data-job-id')];
				if (plannerJob) addJobToPlanner(plannerJob);
				return;
			}
			var detailsBtn = event.target.closest('.job-details-btn');
			if (detailsBtn) {
				var detailsJob = jobById[detailsBtn.getAttribute('data-job-id')];
				if (detailsJob) openJobDetails(detailsJob);
			}
		};

		// Modal close handlers
		var closeBtn = document.getElementById('job-detail-close');
		var backdrop = document.getElementById('job-detail-backdrop');
		if (closeBtn) closeBtn.onclick = closeJobDetails;
		if (backdrop) backdrop.onclick = closeJobDetails;
	}

	// Add job from job list to planner (pre-fill form)
	function addJobToPlanner(job) {
		var titleEl = document.getElementById('planner-title');
		var companyEl = document.getElementById('planner-company');
		var linkEl = document.getElementById('planner-link');
		var sourceEl = document.getElementById('planner-source');
		var locationEl = document.getElementById('planner-location');

		if (titleEl) titleEl.value = job.title || '';
		if (companyEl) companyEl.value = job.company || '';
		if (linkEl) linkEl.value = job.url || '';
		if (sourceEl) sourceEl.value = job.source || '';
		if (locationEl) locationEl.value = job.location || '';

		// Scroll to planner form
		var formEl = document.getElementById('planner-form');
		if (formEl) {
			formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
			// Focus on title field
			if (titleEl) {
				setTimeout(function () { titleEl.focus(); }, 300);
			}
		}
	}

	// Update planner summary counts
	function updatePlannerSummary() {
		var counts = {
			idea: 0,
			todo: 0,
			applied: 0,
			interview: 0,
			offer: 0,
			rejected: 0,
			total: plannerEntries.length
		};

		plannerEntries.forEach(function (e) {
			if (e.status === 'idea') counts.idea++;
			else if (e.status === 'todo') counts.todo++;
			else if (e.status === 'applied') counts.applied++;
			else if (e.status === 'interview') counts.interview++;
			else if (e.status === 'offer') counts.offer++;
			else if (e.status === 'rejected') counts.rejected++;
		});

		var ideaEl = document.getElementById('planner-count-idea');
		var todoEl = document.getElementById('planner-count-todo');
		var appliedEl = document.getElementById('planner-count-applied');
		var interviewEl = document.getElementById('planner-count-interview');
		var offerEl = document.getElementById('planner-count-offer');
		var rejectedEl = document.getElementById('planner-count-rejected');
		var totalEl = document.getElementById('planner-count-total');

		if (ideaEl) ideaEl.textContent = counts.idea;
		if (todoEl) todoEl.textContent = counts.todo;
		if (appliedEl) appliedEl.textContent = counts.applied;
		if (interviewEl) interviewEl.textContent = counts.interview;
		if (offerEl) offerEl.textContent = counts.offer;
		if (rejectedEl) rejectedEl.textContent = counts.rejected;
		if (totalEl) totalEl.textContent = counts.total;
	}

	// Render planner entries (Notion-style log)
	function renderPlanner() {
		var listEl = document.getElementById('planner-list');
		var emptyEl = document.getElementById('planner-empty');
		var searchInput = document.getElementById('planner-search-input');
		var statusFilter = document.getElementById('planner-filter-status');

		if (!listEl) return;

		var term = (searchInput && searchInput.value || '').toLowerCase();
		var status = (statusFilter && statusFilter.value) || 'all';

		var entries = plannerEntries.slice();
		if (term) {
			entries = entries.filter(function (e) {
				var text = (e.title + ' ' + e.company + ' ' + e.source + ' ' + e.notes + ' ' + e.location + ' ' + e.jobType + ' ' + e.workMode + ' ' + e.salary + ' ' + e.contactName + ' ' + e.contactChannel + ' ' + e.tags + ' ' + e.outcome).toLowerCase();
				return text.indexOf(term) !== -1;
			});
		}
		if (status !== 'all') {
			entries = entries.filter(function (e) { return e.status === status; });
		}

		// Update summary counts
		updatePlannerSummary();

		if (!entries.length) {
			listEl.innerHTML = '';
			if (emptyEl) emptyEl.classList.remove('hidden');
			return;
		}
		if (emptyEl) emptyEl.classList.add('hidden');

		var html = '';
		entries.forEach(function (e) {
			var created = new Date(e.createdAt);
			var updated = e.updatedAt ? new Date(e.updatedAt) : created;
			var createdStr = created.toLocaleDateString();
			var updatedStr = updated.toLocaleDateString() + ' ' + updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

			html += '<div class="material-card border border-gray-200 dark:border-gray-700 rounded-xl p-3 md:p-4">';
			html += '<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1.5">';
			html += '<div>';
			html += '<h3 class="font-semibold text-gray-800 dark:text-gray-100">' + escapeHtml(e.title || '(Untitled role)') + '</h3>';
			if (e.company || e.location) {
				html += '<p class="text-xs text-gray-600 dark:text-gray-400">';
				if (e.company) {
					html += escapeHtml(e.company);
				}
				if (e.location) {
					html += (e.company ? ' · ' : '') + escapeHtml(e.location);
				}
				html += '</p>';
			}
			if (e.source || e.jobType || e.workMode) {
				var metaBits = [];
				if (e.source) metaBits.push('Source: ' + e.source);
				if (e.jobType) metaBits.push('Type: ' + e.jobType);
				if (e.workMode) metaBits.push('Mode: ' + e.workMode);
				html += '<p class="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5">' + escapeHtml(metaBits.join(' · ')) + '</p>';
			}
			html += '</div>';
			html += '<div class="flex flex-col items-end gap-1">';
			html += '<select class="planner-status-select text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" data-entry-id="' + e.id + '">';
			['idea','todo','applied','interview','offer','rejected'].forEach(function (opt) {
				html += '<option value="' + opt + '"' + (e.status === opt ? ' selected' : '') + '>' + opt.charAt(0).toUpperCase() + opt.slice(1) + '</option>';
			});
			html += '</select>';
			if (e.priority) {
				html += '<span class="text-[11px] text-gray-500 dark:text-gray-400 capitalize">Priority: ' + escapeHtml(e.priority) + '</span>';
			}
			if (e.nextStep) {
				html += '<span class="text-[11px] text-gray-500 dark:text-gray-400">Next: ' + escapeHtml(e.nextStep) + '</span>';
			}
			html += '<button type="button" class="planner-delete-btn text-[11px] text-red-600 dark:text-red-400 hover:underline mt-1" data-entry-id="' + e.id + '">Remove</button>';
			html += '</div>';
			html += '</div>';

			if (e.notes) {
				html += '<p class="text-xs text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-line">' + escapeHtml(e.notes) + '</p>';
			}

			if (e.tags) {
				html += '<p class="text-[11px] text-gray-500 dark:text-gray-500 mt-1">Tags: ' + escapeHtml(e.tags) + '</p>';
			}
			if (e.outcome) {
				html += '<p class="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5">Outcome: ' + escapeHtml(e.outcome) + '</p>';
			}

			html += '<div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-1">';
			var appliedLabel = e.appliedAt ? ('Applied: ' + escapeHtml(e.appliedAt)) : 'Created: ' + createdStr;
			html += '<span class="text-[11px] text-gray-500 dark:text-gray-500">' + appliedLabel + '</span>';
			html += '<span class="text-[11px] text-gray-500 dark:text-gray-500">Updated: ' + updatedStr + '</span>';
			if (e.link) {
				html += '<a href="' + e.link.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" class="text-[11px] text-primary hover:underline font-semibold">Open job →</a>';
			}
			html += '</div>';
			html += '</div>';
		});

		listEl.innerHTML = html;
	}

	// Escape HTML
	function escapeHtml(text) {
		var div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	// Changes modal: added/removed since last refresh (local browser only)
	function setupJobsDiffModal() {
		var modal = document.getElementById('job-diff-modal');
		var openBtn = document.getElementById('job-diff-view-btn');
		var openBannerBtn = document.getElementById('job-new-banner-view');
		var jumpBannerBtn = document.getElementById('job-new-banner-jump');
		var closeBtn = document.getElementById('job-diff-close');
		var backdrop = document.getElementById('job-diff-backdrop');
		var addedList = document.getElementById('job-diff-added-list');
		var removedList = document.getElementById('job-diff-removed-list');
		var metaEl = document.getElementById('job-diff-meta');
		var clearBtn = document.getElementById('job-diff-clear');
		if (!modal || !openBtn) return;

		function readDiff() {
			try {
				var raw = window.localStorage.getItem(JOBS_DIFF_KEY);
				return raw ? JSON.parse(raw) : null;
			} catch (e) { return null; }
		}

		function renderList(keys, lookup) {
			if (!keys || !keys.length) return '<li class="text-xs text-gray-500 dark:text-gray-400">None</li>';
			return keys.slice(0, 100).map(function (k) {
				var j = lookup && lookup[k] ? lookup[k] : null;
				var title = j && j.title ? j.title : k;
				var company = j && j.company ? j.company : '';
				var source = j && j.source ? j.source : '';
				var loc = j && j.location ? j.location : '';
				var url = j && j.url ? j.url : '';
				var meta = [company, loc, source].filter(Boolean).join(' · ');
				var body = '<div class="min-w-0">' +
					'<div class="font-semibold text-gray-800 dark:text-gray-100 truncate">' + escapeHtml(title) + '</div>' +
					(meta ? '<div class="text-[11px] text-gray-500 dark:text-gray-400 truncate">' + escapeHtml(meta) + '</div>' : '') +
					'</div>';
				if (url) {
					return '<li class="border-b border-gray-200 dark:border-gray-800 pb-2 last:border-b-0">' +
						'<a class="block hover:underline text-primary" href="' + escapeHtml(url) + '" target="_blank" rel="noopener">' + body + '</a>' +
					'</li>';
				}
				return '<li class="border-b border-gray-200 dark:border-gray-800 pb-2 last:border-b-0">' + body + '</li>';
			}).join('');
		}

		function open() {
			var d = readDiff();
			var added = d && Array.isArray(d.added) ? d.added : [];
			var removed = d && Array.isArray(d.removed) ? d.removed : [];
			var lookup = d && d.lookup ? d.lookup : {};
			if (addedList) addedList.innerHTML = renderList(added, lookup);
			if (removedList) removedList.innerHTML = renderList(removed, lookup);
			if (metaEl) {
				var when = d && d.ts ? new Date(d.ts).toLocaleString() : '';
				var ctx = d && d.ctx ? d.ctx : null;
				var ctxText = ctx ? ('Query: ' + (ctx.query || '—') + ' · Sources: ' + (ctx.sources || 'defaults') + ' · Backend: ' + (ctx.backend || '—')) : '';
				metaEl.textContent = (when ? ('Computed: ' + when) : '—') + (ctxText ? (' · ' + ctxText) : '');
			}
			modal.classList.remove('hidden');
			modal.setAttribute('aria-hidden', 'false');
		}

		function close() {
			modal.classList.add('hidden');
			modal.setAttribute('aria-hidden', 'true');
		}

		openBtn.addEventListener('click', open);
		if (openBannerBtn) openBannerBtn.addEventListener('click', open);
		if (jumpBannerBtn) {
			jumpBannerBtn.addEventListener('click', function () {
				var anchor = document.getElementById('jobs-list-anchor');
				if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
			});
		}
		if (closeBtn) closeBtn.addEventListener('click', close);
		if (backdrop) backdrop.addEventListener('click', close);
		document.addEventListener('keydown', function (e) {
			if (modal.classList.contains('hidden')) return;
			if (e.key === 'Escape') close();
		});
		if (clearBtn) {
			clearBtn.addEventListener('click', function () {
				try {
					window.localStorage.removeItem(JOBS_LAST_SNAPSHOT_KEY);
					window.localStorage.removeItem(JOBS_DIFF_KEY);
				} catch (e) {}
				close();
				var a = document.getElementById('job-diff-added');
				var r = document.getElementById('job-diff-removed');
				var b = document.getElementById('job-new-banner');
				if (a) a.textContent = '0';
				if (r) r.textContent = '0';
				if (b) b.classList.add('hidden');
				openBtn.classList.add('hidden');
			});
		}
	}

	var chartsLoaded = false;
	var sourceChart = null;
	var roleChart = null;

	function loadChartJs(callback) {
		if (window.Chart) {
			if (callback) callback();
			return;
		}
		var s = document.createElement('script');
		s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
		s.onload = function() {
			if (callback) callback();
		};
		s.onerror = function() {
			console.error('Failed to load Chart.js');
		};
		document.body.appendChild(s);
	}

	function setupStatsDashboard() {
		var tabList = document.getElementById('tab-jobs-list');
		var tabStats = document.getElementById('tab-jobs-stats');
		var panelList = document.getElementById('panel-jobs-list');
		var panelStats = document.getElementById('panel-jobs-stats');

		if (!tabList || !tabStats || !panelList || !panelStats) return;

		function switchTab(target) {
			if (target === 'stats') {
				tabList.className = 'px-5 py-2.5 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-all';
				tabStats.className = 'px-5 py-2.5 text-sm font-semibold border-b-2 border-primary text-primary focus:outline-none transition-all';
				panelList.classList.add('hidden');
				panelStats.classList.remove('hidden');
				renderStatsDashboard();
			} else {
				tabStats.className = 'px-5 py-2.5 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-all';
				tabList.className = 'px-5 py-2.5 text-sm font-semibold border-b-2 border-primary text-primary focus:outline-none transition-all';
				panelStats.classList.add('hidden');
				panelList.classList.remove('hidden');
			}
		}

		tabList.addEventListener('click', function() { switchTab('list'); });
		tabStats.addEventListener('click', function() { switchTab('stats'); });
	}

	function renderStatsDashboard() {
		loadChartJs(function() {
			fetchAndRenderChartData();
		});
	}

	function fetchAndRenderChartData() {
		var base = getJobSearchApiBase();
		if (base) {
			fetch(base + '/stats')
				.then(function(r) { return r.json(); })
				.then(function(data) {
					if (data && data.ok) {
						document.getElementById('stats-card-scraped').textContent = data.daily_scraped_jobs || '0';
						document.getElementById('stats-card-rss').textContent = data.total_rss_checks_24h || '0';
						document.getElementById('stats-card-success').textContent = data.success_rate_24h != null ? (data.success_rate_24h.toFixed(1) + '%') : '100%';
					}
				})
				.catch(function(e) {
					console.warn('Unable to query live stats from Go backend:', e);
				})
				.finally(function() {
					buildLocalDataCharts();
				});
		} else {
			buildLocalDataCharts();
		}
	}

	function buildLocalDataCharts() {
		var sourceCounts = {};
		var roleCounts = {
			'Data Analyst': 0,
			'Data Engineer': 0,
			'Data Scientist / AI': 0,
			'Software Developer': 0,
			'Other': 0
		};

		allJobs.forEach(function(j) {
			var src = j.source || 'Other';
			if (src.indexOf('jobspy_') === 0) src = src.replace('jobspy_', '');
			sourceCounts[src] = (sourceCounts[src] || 0) + 1;

			var title = (j.title || '').toLowerCase();
			if (title.indexOf('analyst') !== -1 || title.indexOf('bi') !== -1 || title.indexOf('tableau') !== -1) {
				roleCounts['Data Analyst']++;
			} else if (title.indexOf('engineer') !== -1 && (title.indexOf('data') !== -1 || title.indexOf('etl') !== -1 || title.indexOf('pipeline') !== -1)) {
				roleCounts['Data Engineer']++;
			} else if (title.indexOf('scientist') !== -1 || title.indexOf('ai') !== -1 || title.indexOf('ml') !== -1 || title.indexOf('learning') !== -1) {
				roleCounts['Data Scientist / AI']++;
			} else if (title.indexOf('developer') !== -1 || title.indexOf('software') !== -1 || title.indexOf('frontend') !== -1 || title.indexOf('backend') !== -1) {
				roleCounts['Software Developer']++;
			} else {
				roleCounts['Other']++;
			}
		});

		if (document.getElementById('stats-card-scraped').textContent === '0' || document.getElementById('stats-card-scraped').textContent === '-') {
			document.getElementById('stats-card-scraped').textContent = allJobs.length;
			document.getElementById('stats-card-rss').textContent = Object.keys(sourceCounts).length;
		}

		var sourceLabels = Object.keys(sourceCounts);
		var sourceData = Object.values(sourceCounts);

		var roleLabels = Object.keys(roleCounts);
		var roleData = Object.values(roleCounts);

		var isDark = document.documentElement.classList.contains('dark');
		var textColor = isDark ? '#94a3b8' : '#475569';
		var gridColor = isDark ? '#334155' : '#e2e8f0';

		var ctxSource = document.getElementById('chart-jobs-source').getContext('2d');
		if (sourceChart) sourceChart.destroy();
		sourceChart = new Chart(ctxSource, {
			type: 'doughnut',
			data: {
				labels: sourceLabels,
				datasets: [{
					data: sourceData,
					backgroundColor: [
						'#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'
					],
					borderWidth: isDark ? 2 : 1,
					borderColor: isDark ? '#1e293b' : '#ffffff'
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							color: textColor
						}
					}
				}
			}
		});

		var ctxRole = document.getElementById('chart-jobs-role').getContext('2d');
		if (roleChart) roleChart.destroy();
		roleChart = new Chart(ctxRole, {
			type: 'bar',
			data: {
				labels: roleLabels,
				datasets: [{
					label: 'Listings Count',
					data: roleData,
					backgroundColor: '#6366f1',
					borderRadius: 6
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							precision: 0,
							color: textColor
						},
						grid: {
							color: gridColor
						}
					},
					x: {
						ticks: {
							color: textColor
						},
						grid: {
							display: false
						}
					}
				}
			}
		});
	}

	// Initialize on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	// Analytics
	if (typeof initAnalyticsTracking === 'function') {
		initAnalyticsTracking({ site: 'analytics-lab', baseEvent: 'jobs' });
	}
})();

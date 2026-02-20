(function () {
	'use strict';

	// Primary roles and locations (single source of truth for UI + rssjobs.app). Used by Role/Location dropdowns and API query.
	var PRIMARY_ROLES = [
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

	// Initialize
	function init() {
		loadApplications();
		loadPlanner();
		setupRssModeAndDropdowns();
		setupEventListeners();
		fetchAllJobs();
		setupPlannerEventListeners();
		renderPlanner();
	}

	// Populate RSS Role/Location dropdowns from PRIMARY_* and wire mode toggle + rssjobs feed URL.
	function setupRssModeAndDropdowns() {
		var roleSelect = document.getElementById('job-rss-role');
		var locationSelect = document.getElementById('job-rss-location');
		var feedUrlInput = document.getElementById('job-rss-feed-url');
		var rssPanel = document.getElementById('job-rss-panel');
		var scrapeRadio = document.getElementById('job-source-scrape');
		var rssRadio = document.getElementById('job-source-rss');

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
		}
		function updateMode() {
			var isRss = rssRadio && rssRadio.checked;
			setRssPanelVisible(!!isRss);
		}
		if (scrapeRadio) scrapeRadio.addEventListener('change', updateMode);
		if (rssRadio) rssRadio.addEventListener('change', updateMode);
		updateMode();

		// Optional: when role/location change in RSS mode, try to restore saved feed URL for this combo
		var rssStorageKey = 'job_tracker_rss_feed_url';
		function saveRssFeedUrl() {
			if (!feedUrlInput || !feedUrlInput.value.trim()) return;
			try {
				var role = roleSelect ? roleSelect.value : '';
				var loc = locationSelect ? locationSelect.value : '';
				var key = rssStorageKey + '_' + role + '_' + loc;
				localStorage.setItem(key, feedUrlInput.value.trim());
			} catch (e) {}
		}
		function loadRssFeedUrl() {
			try {
				var role = roleSelect ? roleSelect.value : '';
				var loc = locationSelect ? locationSelect.value : '';
				var key = rssStorageKey + '_' + role + '_' + loc;
				var saved = localStorage.getItem(key);
				if (saved && feedUrlInput) feedUrlInput.value = saved;
			} catch (e) {}
		}
		if (feedUrlInput) feedUrlInput.addEventListener('blur', saveRssFeedUrl);
		if (roleSelect) roleSelect.addEventListener('change', loadRssFeedUrl);
		if (locationSelect) locationSelect.addEventListener('change', loadRssFeedUrl);

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
		var searchInput = document.getElementById('job-search-input');
		var filterSource = document.getElementById('job-filter-source');
		var filterMatch = document.getElementById('job-filter-match');
		var filterStatus = document.getElementById('job-filter-status');
		var filterAge = document.getElementById('job-filter-age');
		var filterRole = document.getElementById('job-filter-role');
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
		if (filterAge) {
			filterAge.addEventListener('change', applyFilters);
		}
		if (filterRole) {
			filterRole.addEventListener('change', applyFilters);
		}
		if (refreshBtn) {
			refreshBtn.addEventListener('click', function () {
				fetchAllJobs(true); // Force refresh - triggers scraping
			});
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
		if (exportJsonBtn) {
			exportJsonBtn.addEventListener('click', function () {
				var entries = getFilteredPlannerEntries();
				var blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
				var a = document.createElement('a');
				a.href = URL.createObjectURL(blob);
				a.download = 'job-planner-' + new Date().toISOString().slice(0, 10) + '.json';
				a.click();
				URL.revokeObjectURL(a.href);
			});
		}
		if (exportCsvBtn) {
			exportCsvBtn.addEventListener('click', function () {
				var entries = getFilteredPlannerEntries();
				var headers = ['title', 'company', 'status', 'source', 'location', 'jobType', 'workMode', 'createdAt', 'updatedAt', 'notes'];
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
				var a = document.createElement('a');
				a.href = URL.createObjectURL(blob);
				a.download = 'job-planner-' + new Date().toISOString().slice(0, 10) + '.csv';
				a.click();
				URL.revokeObjectURL(a.href);
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
		
		// Use cached jobs API (fast) or refresh endpoint
		var proxyUrl = (typeof window !== 'undefined' && window.JOB_PROXY_URL) ? String(window.JOB_PROXY_URL).replace(/\/$/, '') : '';
		
		// Detect if using Railway API (vs Vercel)
		var isRailway = proxyUrl && (proxyUrl.includes('railway.app') || proxyUrl.includes('up.railway.app'));
		
		// Get query from URL params or default to 'data analyst'
		var urlParams = new URLSearchParams(window.location.search);
		var query = urlParams.get('q') || 'data analyst';
		var days = urlParams.get('days') || '3'; // Default to 3 days for headless scraping
		var limit = urlParams.get('limit') || '400';
		var location = urlParams.get('location') || 'remote';
		// RSS mode: use feed URL from UI (Role + Location are the "endgame"; jobs fetched via rssjobs.app)
		var useRssMode = document.getElementById('job-source-rss') && document.getElementById('job-source-rss').checked;
		var rssjobsUrl = '';
		if (useRssMode) {
			var feedInput = document.getElementById('job-rss-feed-url');
			rssjobsUrl = (feedInput && feedInput.value) ? feedInput.value.trim() : '';
			// In RSS mode, use selected role/location for API context (snapshot still merges rssjobs feed)
			var rssRole = document.getElementById('job-rss-role');
			var rssLoc = document.getElementById('job-rss-location');
			if (rssRole && rssRole.value) query = rssRole.value;
			if (rssLoc && rssLoc.value) location = rssLoc.value;
		}
		if (!rssjobsUrl) rssjobsUrl = urlParams.get('rssjobs') || '';
		
		// Railway API: Use /refresh (POST) and /jobs (GET) endpoints
		if (isRailway) {
			if (forceRefresh) {
				// Railway: POST /refresh
				var refreshUrl = proxyUrl + '/refresh?q=' + encodeURIComponent(query) + '&days=' + encodeURIComponent(days) + '&headless=0';
				if (rssjobsUrl) refreshUrl += '&rssjobs=' + encodeURIComponent(rssjobsUrl);
				
				fetch(refreshUrl, { method: 'POST' })
					.then(function (r) { return r.ok ? r.json() : null; })
					.then(function (refreshData) {
						if (refreshData && refreshData.ok && Array.isArray(refreshData.jobs)) {
							// Railway /refresh returns jobs directly, use them
							allJobs = [];
							refreshData.jobs.forEach(function (item) {
								if (!item || !item.title || !item.url) return;
								allJobs.push({
									id: item.id || ('job_' + Math.random().toString(36).slice(2)),
									title: item.title,
									company: item.company || 'Unknown',
									location: item.location || 'Remote',
									url: item.url,
									description: item.description || '',
									tags: Array.isArray(item.tags) ? item.tags : [],
									source: item.source || 'unknown',
									date: item.date || new Date().toISOString(),
									dateFormatted: item.dateFormatted || '',
									postedAgo: item.postedAgo || '',
									matchScore: item.match_score || 0
								});
							});
							sourceCounts = refreshData.sourceCounts || {};
							apiSources = Array.isArray(refreshData.sources) ? refreshData.sources : [];
							processJobsData({ sourceCounts: sourceCounts, sources: apiSources });
							saveJobsToBrowserCache({ jobs: allJobs.slice(0), sourceCounts: sourceCounts, sources: apiSources });
						} else {
							// Fallback to /jobs endpoint
							fetchRailwayJobs(proxyUrl, query, days, limit);
						}
					})
					.catch(function (err) {
						console.error('Railway refresh failed:', err);
						fetchRailwayJobs(proxyUrl, query, days, limit);
					});
				return;
			} else {
				// Railway: GET /jobs (cached)
				fetchRailwayJobs(proxyUrl, query, days, limit);
				return;
			}
		}
		
		// Vercel API: Use /api/jobs-snapshot and /api/jobs-refresh endpoints
		// If forcing refresh, call refresh endpoint first, then snapshot (same API as playground)
		if (forceRefresh) {
			var refreshUrl = proxyUrl 
				? (proxyUrl + '/api/jobs-refresh?q=' + encodeURIComponent(query) + '&days=' + encodeURIComponent(days) + '&location=' + encodeURIComponent(location))
				: ('/api/jobs-refresh?q=' + encodeURIComponent(query) + '&days=' + encodeURIComponent(days) + '&location=' + encodeURIComponent(location));
			
			fetch(refreshUrl)
				.then(function (r) { return r.ok ? r.json() : null; })
				.then(function (refreshData) {
					// After refresh, always fetch snapshot so UI shows same data as playground
					fetchJobsSnapshot(proxyUrl, query, days, limit, rssjobsUrl);
				})
				.catch(function (err) {
					console.error('Refresh failed:', err);
					fetchJobsSnapshot(proxyUrl, query, days, limit, rssjobsUrl);
				});
			return;
		}
		
		// Primary: use jobs-snapshot (same API as playground) so results and sources match
		fetchJobsSnapshot(proxyUrl, query, days, limit, rssjobsUrl);
	}
	
	// Try browser cache then show error (used when both snapshot and cached API fail)
	function tryBrowserCacheThenError(cacheMaxAgeMs) {
		var loadingEl = document.getElementById('job-loading');
		var errorEl = document.getElementById('job-error');
		var errorMsgEl = document.getElementById('job-error-message');
		var cached = loadJobsFromBrowserCache(cacheMaxAgeMs || (1000 * 60 * 30)); // default 30 min
		if (cached && Array.isArray(cached.jobs) && cached.jobs.length) {
			allJobs = cached.jobs.slice(0);
			sourceCounts = cached.sourceCounts || {};
			apiSources = Array.isArray(cached.sources) ? cached.sources : [];
			processJobsData({ sourceCounts: sourceCounts, sources: apiSources });
			if (loadingEl) loadingEl.style.display = 'none';
			return;
		}
		if (loadingEl) loadingEl.style.display = 'none';
		if (errorEl) {
			errorEl.classList.remove('hidden');
			if (errorMsgEl) errorMsgEl.textContent = 'Could not load jobs. Click Refresh to try again.';
			var retryBtn = document.getElementById('job-error-retry');
			if (retryBtn) retryBtn.onclick = function () { fetchAllJobs(true); };
		}
	}

	// Fetch from cached jobs API (fallback when snapshot fails)
	function fetchCachedJobs(proxyUrl, query, days, limit) {
		var cachedUrl = proxyUrl 
			? (proxyUrl + '/api/jobs-cached?q=' + encodeURIComponent(query))
			: ('/api/jobs-cached?q=' + encodeURIComponent(query));
		
		fetch(cachedUrl)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				var loadingEl = document.getElementById('job-loading');
				var errorEl = document.getElementById('job-error');
				
				if (!data || !data.ok || !Array.isArray(data.jobs) || data.jobs.length === 0) {
					tryBrowserCacheThenError(1000 * 60 * 30);
					return;
				}
				
				data.jobs.forEach(function (item) {
					if (!item || !item.title || !item.url) return;
					allJobs.push({
						id: item.id || (item.source + '_' + Math.random().toString(36).slice(2)),
						title: item.title,
						company: item.company || 'Unknown',
						location: item.location || 'Remote',
						url: item.url,
						description: item.description || '',
						tags: Array.isArray(item.tags) ? item.tags : [],
						source: item.source || 'unknown',
						date: item.date || item.postedDate || new Date().toISOString(),
						dateFormatted: item.dateFormatted || '',
						postedAgo: item.postedAgo || '',
						matchScore: 0
					});
				});
				processJobsData(data);
				saveJobsToBrowserCache({ jobs: allJobs.slice(0), sourceCounts: sourceCounts, sources: apiSources });
			})
			.catch(function (err) {
				console.error('Cached jobs API error:', err);
				tryBrowserCacheThenError(1000 * 60 * 30);
			});
	}
	
	// Railway API: Fetch jobs from /jobs endpoint (cached)
	function fetchRailwayJobs(proxyUrl, query, days, limit) {
		var apiUrl = proxyUrl + '/jobs?q=' + encodeURIComponent(query) + '&days=' + encodeURIComponent(days) + '&limit=' + encodeURIComponent(limit);
		
		fetch(apiUrl)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				var loadingEl = document.getElementById('job-loading');
				var errorEl = document.getElementById('job-error');
				
				if (!data || !data.ok || !Array.isArray(data.jobs) || data.jobs.length === 0) {
					// Railway /jobs might be empty if storage not persisting, try /refresh as fallback
					console.log('Railway /jobs empty, trying /refresh...');
					fetchRailwayRefresh(proxyUrl, query, days, limit);
					return;
				}
				
				allJobs = [];
				data.jobs.forEach(function (item) {
					if (!item || !item.title || !item.url) return;
					allJobs.push({
						id: item.id || ('job_' + Math.random().toString(36).slice(2)),
						title: item.title,
						company: item.company || 'Unknown',
						location: item.location || 'Remote',
						url: item.url,
						description: item.description || '',
						tags: Array.isArray(item.tags) ? item.tags : [],
						source: item.source || 'unknown',
						date: item.date || new Date().toISOString(),
						dateFormatted: item.dateFormatted || '',
						postedAgo: item.postedAgo || '',
						matchScore: item.match_score || 0
					});
				});
				
				sourceCounts = data.sourceCounts || {};
				apiSources = Array.isArray(data.sources) ? data.sources : [];
				processJobsData({ sourceCounts: sourceCounts, sources: apiSources });
				saveJobsToBrowserCache({ jobs: allJobs.slice(0), sourceCounts: sourceCounts, sources: apiSources });
			})
			.catch(function (err) {
				console.error('Railway /jobs error:', err);
				// Fallback to /refresh
				fetchRailwayRefresh(proxyUrl, query, days, limit);
			});
	}
	
	// Railway API: Fetch jobs from /refresh endpoint (scrapes fresh)
	function fetchRailwayRefresh(proxyUrl, query, days, limit) {
		var refreshUrl = proxyUrl + '/refresh?q=' + encodeURIComponent(query) + '&days=' + encodeURIComponent(days) + '&headless=0';
		
		fetch(refreshUrl, { method: 'POST' })
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				var loadingEl = document.getElementById('job-loading');
				var errorEl = document.getElementById('job-error');
				
				if (!data || !data.ok || !Array.isArray(data.jobs)) {
					tryBrowserCacheThenError(1000 * 60 * 30);
					return;
				}
				
				allJobs = [];
				data.jobs.forEach(function (item) {
					if (!item || !item.title || !item.url) return;
					allJobs.push({
						id: item.id || ('job_' + Math.random().toString(36).slice(2)),
						title: item.title,
						company: item.company || 'Unknown',
						location: item.location || 'Remote',
						url: item.url,
						description: item.description || '',
						tags: Array.isArray(item.tags) ? item.tags : [],
						source: item.source || 'unknown',
						date: item.date || new Date().toISOString(),
						dateFormatted: item.dateFormatted || '',
						postedAgo: item.postedAgo || '',
						matchScore: item.match_score || 0
					});
				});
				
				sourceCounts = data.sourceCounts || {};
				apiSources = Array.isArray(data.sources) ? data.sources : [];
				processJobsData({ sourceCounts: sourceCounts, sources: apiSources });
				saveJobsToBrowserCache({ jobs: allJobs.slice(0), sourceCounts: sourceCounts, sources: apiSources });
			})
			.catch(function (err) {
				console.error('Railway /refresh error:', err);
				tryBrowserCacheThenError(1000 * 60 * 30);
			});
	}
	
	// Primary: jobs-snapshot API (same as Playground — same results and sources). Optional rssjobs = rssjobs.app feed URL.
	function fetchJobsSnapshot(proxyUrl, query, days, limit, rssjobsFeedUrl) {
		var apiUrl = proxyUrl 
			? (proxyUrl + '/api/jobs-snapshot?q=' + encodeURIComponent(query) + '&days=' + encodeURIComponent(days) + '&limit=' + encodeURIComponent(limit))
			: ('/api/jobs-snapshot?q=' + encodeURIComponent(query) + '&days=' + encodeURIComponent(days) + '&limit=' + encodeURIComponent(limit));
		if (rssjobsFeedUrl && rssjobsFeedUrl.trim().length > 0) {
			apiUrl += '&rssjobs=' + encodeURIComponent(rssjobsFeedUrl.trim());
		}
		
		fetch(apiUrl)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.ok || !Array.isArray(data.jobs)) {
					console.log('Jobs snapshot failed, trying cached API...');
					fetchCachedJobs(proxyUrl, query, days, limit);
					return;
				}
				
				data.jobs.forEach(function (item) {
					if (!item || !item.title || !item.url) return;
					allJobs.push({
						id: item.id || ('job_' + Math.random().toString(36).slice(2)),
						title: item.title,
						company: item.company || 'Unknown',
						location: item.location || 'Remote',
						url: item.url,
						description: item.description || '',
						tags: Array.isArray(item.tags) ? item.tags : [],
						source: item.source || 'unknown',
						date: item.date || new Date().toISOString(),
						dateFormatted: item.dateFormatted || '',
						postedAgo: item.postedAgo || '',
						matchScore: 0
					});
				});
				
				processJobsData(data);

				// Save latest successful jobs snapshot to browser cache (temporary DB)
				saveJobsToBrowserCache({
					jobs: allJobs.slice(0),
					sourceCounts: sourceCounts,
					sources: apiSources
				});
			})
			.catch(function (err) {
				console.error('Jobs snapshot network error:', err);
				fetchCachedJobs(proxyUrl, query, days, limit);
			});
	}
	
	// Process jobs data (common logic)
	function processJobsData(data) {
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
		allJobs = allJobs.filter(function (job) {
			var fullText = (job.title + ' ' + job.description + ' ' + (job.tags || []).join(' ')).toLowerCase();
			return isDataScienceJob(fullText);
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
		
		applyFilters();
		var loadingEl = document.getElementById('job-loading');
		if (loadingEl) loadingEl.style.display = 'none';
		
		updateSourceStats();
	}

	function openJobDetails(job) {
		var modal = document.getElementById('job-detail-modal');
		if (!modal || !job) return;

		var titleEl = document.getElementById('job-detail-title');
		var sourceEl = document.getElementById('job-detail-source');
		var companyEl = document.getElementById('job-detail-company');
		var metaEl = document.getElementById('job-detail-meta');
		var tagsEl = document.getElementById('job-detail-tags');
		var descEl = document.getElementById('job-detail-description');
		var applyEl = document.getElementById('job-detail-apply');
		var plannerBtn = document.getElementById('job-detail-add-planner');

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

		modal.classList.remove('hidden');
		modal.setAttribute('aria-hidden', 'false');
	}

	function closeJobDetails() {
		var modal = document.getElementById('job-detail-modal');
		if (!modal) return;
		modal.classList.add('hidden');
		modal.setAttribute('aria-hidden', 'true');
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

	// Apply filters
	function applyFilters() {
		var searchInput = document.getElementById('job-search-input');
		var filterSource = document.getElementById('job-filter-source');
		var filterMatch = document.getElementById('job-filter-match');
		var filterStatus = document.getElementById('job-filter-status');
		var filterAge = document.getElementById('job-filter-age');
		var filterRole = document.getElementById('job-filter-role');

		var searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
		var sourceFilter = filterSource ? filterSource.value : 'all';
		var matchFilter = filterMatch ? filterMatch.value : 'all';
		var statusFilter = filterStatus ? filterStatus.value : 'all';
		var ageFilter = filterAge ? filterAge.value : 'all';
		var roleFilter = filterRole ? filterRole.value : 'all';

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
		var chips = sources.slice(0, 5).map(function (src) {
			return '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" title="' + escapeHtml(src) + '">' + escapeHtml(src) + ': ' + sourceCounts[src] + '</span>';
		});
		if (sources.length > 5) {
			var rest = sources.slice(5).reduce(function (sum, src) { return sum + sourceCounts[src]; }, 0);
			chips.push('<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">+' + (sources.length - 5) + ' more (' + rest + ')</span>');
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
			opt.textContent = src.charAt(0).toUpperCase() + src.slice(1).replace(/_/g, ' ');
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

			html += '<div class="job-card group material-card rounded-xl border border-gray-200 dark:border-gray-700 p-4 material-elevation-1">';
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
			html += '<button type="button" class="job-add-to-planner-btn text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded font-semibold transition-colors" data-job-id="' + job.id + '" title="Add to planner">+ Planner</button>';
			html += '<a href="' + job.url + '" target="_blank" rel="noopener" class="text-xs text-primary hover:underline font-semibold">Apply →</a>';
			html += '</div>';
			html += '</div>';
			html += '</div>';
		});

		jobListEl.innerHTML = html;

		// Add event listeners for status changes
		jobListEl.querySelectorAll('.status-select').forEach(function (select) {
			select.addEventListener('change', function () {
				var jobId = this.getAttribute('data-job-id');
				var newStatus = this.value;
				applications[jobId] = newStatus;
				saveApplications();
				applyFilters(); // Re-render to update stats
			});
		});

		// Add event listeners for "Add to planner" buttons
		jobListEl.querySelectorAll('.job-add-to-planner-btn').forEach(function (btn) {
			btn.addEventListener('click', function () {
				var jobId = this.getAttribute('data-job-id');
				var job = filteredJobs.find(function (j) { return j.id === jobId; });
				if (job) {
					addJobToPlanner(job);
				}
			});
		});

		// Add event listeners for "Details" buttons + modal close
		jobListEl.querySelectorAll('.job-details-btn').forEach(function (btn) {
			btn.addEventListener('click', function () {
				var jobId = this.getAttribute('data-job-id');
				var job = filteredJobs.find(function (j) { return j.id === jobId; });
				if (job) openJobDetails(job);
			});
		});
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

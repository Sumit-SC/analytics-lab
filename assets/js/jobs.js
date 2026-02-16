(function () {
	'use strict';

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

	var allJobs = [];
	var applications = {};
	var filteredJobs = [];

	// Initialize
	function init() {
		loadApplications();
		setupEventListeners();
		fetchAllJobs();
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

	// Setup event listeners
	function setupEventListeners() {
		var searchInput = document.getElementById('job-search-input');
		var filterSource = document.getElementById('job-filter-source');
		var filterMatch = document.getElementById('job-filter-match');
		var filterStatus = document.getElementById('job-filter-status');
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
		if (refreshBtn) {
			refreshBtn.addEventListener('click', fetchAllJobs);
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

	// Fetch jobs from all sources
	function fetchAllJobs() {
		var loadingEl = document.getElementById('job-loading');
		var jobListEl = document.getElementById('job-list');
		var emptyEl = document.getElementById('job-empty');

		if (loadingEl) loadingEl.style.display = 'block';
		if (jobListEl) jobListEl.style.display = 'none';
		if (emptyEl) emptyEl.classList.add('hidden');

		allJobs = [];
		var promises = [
			fetchRemoteOK(),
			fetchStackOverflow(),
			fetchGitHubJobs()
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

	// Check if job is data science related
	function isDataScienceJob(text) {
		var keywords = [
			'data scientist', 'data analyst', 'data engineer', 'data science', 'analytics',
			'machine learning', 'ml engineer', 'ai engineer', 'business intelligence',
			'statistician', 'research scientist', 'data analytics'
		];
		return keywords.some(function (keyword) {
			return text.indexOf(keyword) !== -1;
		});
	}

	// Calculate match score (0-100)
	function calculateMatchScore(job) {
		var text = (job.title + ' ' + job.description + ' ' + (job.tags || []).join(' ')).toLowerCase();
		var matches = 0;
		var totalKeywords = SKILLS_KEYWORDS.length;

		SKILLS_KEYWORDS.forEach(function (keyword) {
			if (text.indexOf(keyword.toLowerCase()) !== -1) {
				matches++;
			}
		});

		// Weight: roles are more important
		var roleMatches = 0;
		var roleKeywords = ['data scientist', 'data analyst', 'data engineer', 'analytics engineer', 'ml engineer'];
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

		var searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
		var sourceFilter = filterSource ? filterSource.value : 'all';
		var matchFilter = filterMatch ? filterMatch.value : 'all';
		var statusFilter = filterStatus ? filterStatus.value : 'all';

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

			html += '<div class="job-card material-card rounded-xl border border-gray-200 dark:border-gray-700 p-4 material-elevation-1">';
			html += '<div class="flex items-start justify-between mb-2">';
			html += '<div class="flex-1">';
			html += '<h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">';
			html += '<a href="' + job.url + '" target="_blank" rel="noopener" class="text-primary hover:underline">' + escapeHtml(job.title) + '</a>';
			html += '</h3>';
			html += '<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">' + escapeHtml(job.company) + ' &middot; ' + escapeHtml(job.location) + '</p>';
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
				html += '<p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">' + escapeHtml(desc) + (job.description.length > 200 ? '…' : '') + '</p>';
			}
			if (job.tags && job.tags.length > 0) {
				html += '<div class="flex flex-wrap gap-1 mb-2">';
				job.tags.slice(0, 5).forEach(function (tag) {
					html += '<span class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">' + escapeHtml(tag) + '</span>';
				});
				html += '</div>';
			}
			html += '<div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">';
			html += '<span class="text-xs text-gray-500 dark:text-gray-400">Source: ' + job.source + '</span>';
			html += '<a href="' + job.url + '" target="_blank" rel="noopener" class="text-xs text-primary hover:underline font-semibold">Apply →</a>';
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

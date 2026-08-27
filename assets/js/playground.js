/**
 * Playground page: sidebar, Tech/Non-tech mode, code editor, runner, docs search, assistant.
 */

// Analytics: init as soon as script runs so it is not skipped by later errors in this file
(function () {
	if (typeof initAnalyticsTracking === 'function') {
		initAnalyticsTracking({ site: 'analytics-lab', baseEvent: 'playground' });
	}
})();

(function () {
	// Tech / Non-tech mode toggle (playground.html only)
	var MODE_KEY = 'playground_mode';
	var contentTech = document.getElementById('playground-content-tech');
	var contentNontech = document.getElementById('playground-content-nontech');
	var btnTech = document.getElementById('playground-mode-tech');
	var btnNontech = document.getElementById('playground-mode-nontech');
	var hubTech = document.getElementById('hub-buttons-tech');
	var hubNontech = document.getElementById('hub-buttons-nontech');
	var docsWrap = document.getElementById('docs-frame-wrap');

	function setMode(mode) {
		var isTech = mode === 'tech';
		try { localStorage.setItem(MODE_KEY, mode); } catch (e) {}
		if (contentTech) contentTech.classList.toggle('hidden', !isTech);
		if (contentNontech) contentNontech.classList.toggle('hidden', isTech);
		if (hubTech) hubTech.classList.toggle('hidden', !isTech);
		if (hubNontech) hubNontech.classList.toggle('hidden', isTech);
		// DevDocs panel remains hidden by default until explicitly searched or opened
		if (docsWrap) docsWrap.classList.add('hidden');
		var searchHistWrap = document.getElementById('hub-search-history');
		if (searchHistWrap) searchHistWrap.classList.toggle('hidden', !isTech);
		var githubResultsWrap = document.getElementById('github-results-wrap');
		if (githubResultsWrap && !isTech) githubResultsWrap.classList.add('hidden');
		var wikipediaResultsWrap = document.getElementById('wikipedia-results-wrap');
		if (wikipediaResultsWrap && isTech) wikipediaResultsWrap.classList.add('hidden');
		var stackoverflowResultsWrap = document.getElementById('stackoverflow-results-wrap');
		if (stackoverflowResultsWrap && isTech) stackoverflowResultsWrap.classList.add('hidden');
		var duckduckgoResultsWrap = document.getElementById('duckduckgo-results-wrap');
		if (duckduckgoResultsWrap && isTech) duckduckgoResultsWrap.classList.add('hidden');
		var active = 'border-primary text-primary';
		var inactive = 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300';
		if (btnTech) {
			btnTech.className = 'playground-mode-btn px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ' + (isTech ? active : inactive);
		}
		if (btnNontech) {
			btnNontech.className = 'playground-mode-btn px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ' + (isTech ? inactive : active);
		}
	}

	if (btnTech && btnNontech) {
		var saved = '';
		try { saved = localStorage.getItem(MODE_KEY) || 'tech'; } catch (e) { saved = 'tech'; }
		setMode(saved === 'nontech' ? 'nontech' : 'tech');
		btnTech.addEventListener('click', function () { setMode('tech'); });
		btnNontech.addEventListener('click', function () { setMode('nontech'); });
	} else if (contentTech && contentNontech) {
		contentNontech.classList.add('hidden');
	}

	// Ensure hub button groups exist for pages without mode (e.g. old index): no-op if missing
})();

(function () {
	// Editor line numbers
	var codeEl = document.getElementById('code');
	var numsEl = document.getElementById('line-nums');
	if (!codeEl || !numsEl) return;
	function update() {
		var n = ((codeEl.value || '').match(/\n/g) || []).length + 1;
		var arr = [];
		for (var i = 1; i <= n; i++) arr.push(i);
		numsEl.textContent = arr.join('\n');
	}
	codeEl.addEventListener('input', update);
	codeEl.addEventListener('scroll', function () {
		numsEl.scrollTop = codeEl.scrollTop;
	});
	update();
})();

(function () {
	// Runner: Python (Pyodide), JS, SQL (sql.js)
	var runBtn = document.getElementById('run');
	var codeEl = document.getElementById('code');
	var outEl = document.getElementById('out');
	var statusEl = document.getElementById('status');
	var langSel = document.getElementById('lang');
	var sqlActionsEl = document.getElementById('sql-actions');
	var sqlResetBtn = document.getElementById('sql-reset');
	var sqlSampleBtn = document.getElementById('sql-sample');
	if (!runBtn || !codeEl || !outEl || !langSel) return;

	var pyodideReady = null;
	var sqlReady = null;
	var sqlDb = null;
	var PLACEHOLDERS = {
		python: "print('Hello')\nfor i in range(3):\n    print(i * i)",
		javascript: "console.log('Hello');\nfor (let i = 0; i < 3; i++) console.log(i * i);",
		sql: '-- SQL (SQLite in-browser)\nSELECT 1 as one;\n',
	};

	function setStatus(t) {
		statusEl.textContent = t || '';
	}
	function showOut(t) {
		var text = t == null ? '' : String(t);
		outEl.textContent = text;
		outEl.classList.toggle('hidden', text.length === 0);
	}

	var SQL_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js';
	var SQL_LOCAL = './assets/vendor/sql.js/sql-wasm.js';
	var SQL_BASE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/';
	var SQL_BASE_LOCAL = './assets/vendor/sql.js/';

	function loadSqlJs() {
		if (sqlReady) return Promise.resolve(sqlReady);
		return new Promise(function (resolve, reject) {
			function init(baseUrl) {
				if (typeof initSqlJs !== 'function') {
					reject(new Error('sql.js init not found'));
					return;
				}
				initSqlJs({ locateFile: function (file) { return baseUrl + file; } })
					.then(function (SQL) {
						sqlReady = SQL;
						resolve(SQL);
					})
					.catch(reject);
			}
			function tryLocal() {
				var t = document.createElement('script');
				t.src = SQL_LOCAL;
				t.onload = function () { init(SQL_BASE_LOCAL); };
				t.onerror = function () { reject(new Error('Failed to load sql.js (CDN and local)')); };
				document.head.appendChild(t);
			}
			var s = document.createElement('script');
			s.src = SQL_CDN;
			s.onload = function () { init(SQL_BASE_CDN); };
			s.onerror = tryLocal;
			document.head.appendChild(s);
		});
	}
	function ensureSqlDb() {
		return loadSqlJs().then(function (SQL) {
			if (!sqlDb) sqlDb = new SQL.Database();
			return sqlDb;
		});
	}
	function formatSqlResults(results) {
		if (!results || !results.length) return '(ok)';
		var out = [];
		results.forEach(function (r, idx) {
			out.push('Result ' + (idx + 1) + ':');
			out.push(r.columns.join(' | '));
			out.push(r.columns.map(function () { return '---'; }).join(' | '));
			(r.values || []).forEach(function (row) {
				out.push(row.map(function (v) { return v == null ? 'NULL' : String(v); }).join(' | '));
			});
			out.push('');
		});
		return out.join('\n').trim();
	}

	langSel.addEventListener('change', function () {
		codeEl.placeholder = PLACEHOLDERS[langSel.value] || PLACEHOLDERS.javascript;
		if (sqlActionsEl) sqlActionsEl.classList.toggle('hidden', langSel.value !== 'sql');
	});
	langSel.value = 'python';
	codeEl.placeholder = PLACEHOLDERS.javascript;
	if (sqlActionsEl) sqlActionsEl.classList.add('hidden');

	if (sqlResetBtn) {
		sqlResetBtn.addEventListener('click', function () {
			showOut('');
			setStatus('Resetting DB…');
			loadSqlJs()
				.then(function (SQL) {
					sqlDb = new SQL.Database();
					showOut('Database reset. Try: SELECT 1;');
					setStatus('Ready.');
				})
				.catch(function (err) {
					showOut('SQL engine load failed: ' + (err.message || err));
					setStatus('Error.');
				});
		});
	}
	if (sqlSampleBtn) {
		sqlSampleBtn.addEventListener('click', function () {
			showOut('');
			setStatus('Loading sample data…');
			ensureSqlDb()
				.then(function (db) {
					db.exec(
						'DROP TABLE IF EXISTS users; ' +
						'DROP TABLE IF EXISTS orders; ' +
						'CREATE TABLE users(id INTEGER PRIMARY KEY, name TEXT, age INT); ' +
						'CREATE TABLE orders(id INTEGER PRIMARY KEY, user_id INT, amount REAL); ' +
						"INSERT INTO users(name, age) VALUES ('Ava', 25), ('Ben', 31), ('Chloe', 28); " +
						'INSERT INTO orders(user_id, amount) VALUES (1, 19.99), (2, 49.50), (2, 15.00), (3, 99.00);'
					);
					var res = db.exec(
						'SELECT u.name, u.age, COUNT(o.id) AS orders, ROUND(SUM(o.amount), 2) AS total_amount ' +
						'FROM users u LEFT JOIN orders o ON u.id = o.user_id ' +
						'GROUP BY u.id, u.name, u.age ' +
						'ORDER BY total_amount DESC;'
					);
					showOut('Sample data loaded.\n\n' + formatSqlResults(res));
					setStatus('Ready.');
				})
				.catch(function (err) {
					showOut('SQL engine load failed: ' + (err.message || err));
					setStatus('Error.');
				});
		});
	}

	runBtn.addEventListener('click', function (e) {
		e.preventDefault();
		var code = codeEl.value || '';
		var lang = langSel.value;
		if (!code.trim()) {
			showOut('');
			setStatus('');
			return;
		}

		if (lang === 'javascript') {
			showOut('');
			setStatus('Running…');
			var out = [];
			var customConsole = { log: function () { out.push([].slice.call(arguments).join(' ')); } };
			try {
				new Function('console', code)(customConsole);
				showOut(out.length ? out.join('\n') : '(no output)');
				setStatus('Done.');
			} catch (err) {
				showOut(err.message || String(err));
				setStatus('Error.');
			}
			return;
		}

		if (lang === 'sql') {
			showOut('');
			setStatus('Loading SQL engine…');
			loadSqlJs()
				.then(function (SQL) {
					if (!sqlDb) sqlDb = new SQL.Database();
					setStatus('Running…');
					try {
						showOut(formatSqlResults(sqlDb.exec(code)));
						setStatus('Done.');
					} catch (err) {
						showOut(err.message || String(err));
						setStatus('Error.');
					}
				})
				.catch(function (err) {
					showOut('SQL engine load failed: ' + (err.message || err));
					setStatus('Error.');
				});
			return;
		}

		function runWithPyodide() {
			showOut('');
			setStatus('Running…');
			try {
				var encoded = btoa(unescape(encodeURIComponent(code)));
				var wrapper =
					'import sys\nimport base64\nfrom io import StringIO\n_out = StringIO()\n_err = StringIO()\nsys.stdout = _out\nsys.stderr = _err\ntry:\n    exec(base64.b64decode("' +
					encoded +
					'").decode("utf-8"))\nexcept Exception:\n    import traceback\n    traceback.print_exc(file=sys.stderr)\nfinally:\n    sys.stdout = sys.__stdout__\n    sys.stderr = sys.__stderr__\n_out.getvalue() + _err.getvalue()';
				var result = pyodideReady.runPython(wrapper);
				showOut(result ? String(result) : '(no output)');
				setStatus('Done.');
			} catch (err) {
				showOut(err.message || String(err));
				setStatus('Error.');
			}
		}
		if (pyodideReady) {
			runWithPyodide();
			return;
		}
		setStatus('Loading Pyodide (~30s)…');
		var s = document.createElement('script');
		s.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
		s.onload = function () {
			loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' })
				.then(function (pyodide) {
					pyodideReady = pyodide;
					setStatus('Ready. Running…');
					runWithPyodide();
				})
				.catch(function (err) {
					showOut('Pyodide load failed: ' + (err.message || err) + '\n\nPython needs network for first load. Use JS or SQL offline, or retry when online. Switched to JavaScript.');
					langSel.value = 'javascript';
					codeEl.placeholder = PLACEHOLDERS.javascript;
					setStatus('Python engine unavailable, using JavaScript instead.');
				});
		};
		s.onerror = function () {
			showOut('Could not load Pyodide.\n\nPython needs network for first load. Use JS or SQL offline, or retry when online. Switched to JavaScript.');
			langSel.value = 'javascript';
			codeEl.placeholder = PLACEHOLDERS.javascript;
			setStatus('Python engine unavailable, using JavaScript instead.');
		};
		document.head.appendChild(s);
	});
})();

(function () {
	// JupyterLite toggle
	var btn = document.getElementById('jlite-toggle');
	var wrap = document.getElementById('jlite-wrap');
	var frame = document.getElementById('jlite-frame');
	if (!btn || !wrap || !frame) return;
	var loaded = false;
	btn.addEventListener('click', function () {
		var isHidden = wrap.classList.contains('hidden');
		if (isHidden) {
			wrap.classList.remove('hidden');
			btn.textContent = 'Hide notebook';
			if (!loaded) {
				frame.src = 'https://jupyterlite.github.io/demo/lab/';
				loaded = true;
			}
		} else {
			wrap.classList.add('hidden');
			btn.textContent = 'Show notebook';
		}
	});
})();

(function () {
	// Search hub: one query, multiple targets (DevDocs in-page; GitHub API results; others new tab) + search history
	var SEARCH_HISTORY_KEY = 'standalone_search_history';
	var qEl = document.getElementById('hub-query') || document.getElementById('docs-query');
	var frameWrap = document.getElementById('docs-frame-wrap');
	var frame = document.getElementById('docs-frame');
	var devdocsBtn = document.getElementById('hub-devdocs') || document.getElementById('docs-devdocs');
	var ghBtn = document.getElementById('hub-github') || document.getElementById('docs-github');
	var duckduckgoBtn = document.getElementById('hub-duckduckgo');
	var ytBtn = document.getElementById('hub-youtube');
	var wikiBtn = document.getElementById('hub-wikipedia');
	var soBtn = document.getElementById('hub-stackoverflow');
	var searchHistoryWrap = document.getElementById('hub-search-history');
	var searchHistoryList = document.getElementById('hub-search-history-list');
	var searchHistoryClear = document.getElementById('hub-search-history-clear');
	var githubResultsWrap = document.getElementById('github-results-wrap');
	var githubResultsBody = document.getElementById('github-results-body');
	var githubResultsClose = document.getElementById('github-results-close');
	var githubResultsMinimize = document.getElementById('github-results-minimize');
	var wikipediaResultsWrap = document.getElementById('wikipedia-results-wrap');
	var wikipediaResultsBody = document.getElementById('wikipedia-results-body');
	var wikipediaResultsClose = document.getElementById('wikipedia-results-close');
	var wikipediaResultsMinimize = document.getElementById('wikipedia-results-minimize');
	var stackoverflowResultsWrap = document.getElementById('stackoverflow-results-wrap');
	var stackoverflowResultsBody = document.getElementById('stackoverflow-results-body');
	var stackoverflowResultsClose = document.getElementById('stackoverflow-results-close');
	var stackoverflowResultsMinimize = document.getElementById('stackoverflow-results-minimize');
	var duckduckgoResultsWrap = document.getElementById('duckduckgo-results-wrap');
	var duckduckgoResultsBody = document.getElementById('duckduckgo-results-body');
	var duckduckgoResultsClose = document.getElementById('duckduckgo-results-close');
	var duckduckgoResultsMinimize = document.getElementById('duckduckgo-results-minimize');
	var docsFrameWrap = document.getElementById('docs-frame-wrap');
	var docsFrameMinimize = document.getElementById('docs-frame-minimize');
	var PANEL_STATE_KEY = 'standalone_panel_states';
	if (!qEl) return;

	function trimmed() {
		return (qEl.value || '').trim();
	}
	function getSearchHistory() {
		try {
			var raw = localStorage.getItem(SEARCH_HISTORY_KEY);
			return raw ? JSON.parse(raw) : [];
		} catch (e) { return []; }
	}
	function saveSearchHistory(q) {
		if (!q || !q.trim()) return;
		var hist = getSearchHistory();
		var trimmedQ = q.trim();
		hist = hist.filter(function (h) { return h !== trimmedQ; });
		hist.unshift(trimmedQ);
		hist = hist.slice(0, 10);
		try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(hist)); } catch (e) {}
		renderSearchHistory();
	}
	function renderSearchHistory() {
		if (!searchHistoryWrap || !searchHistoryList) return;
		var hist = getSearchHistory();
		if (hist.length === 0) {
			searchHistoryWrap.classList.add('hidden');
			return;
		}
		searchHistoryWrap.classList.remove('hidden');
		searchHistoryList.innerHTML = hist.map(function (q) {
			return '<button type="button" class="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs" data-query="' + q.replace(/"/g, '&quot;') + '">' + q.replace(/</g, '&lt;') + '</button>';
		}).join('');
		searchHistoryList.querySelectorAll('button').forEach(function (btn) {
			btn.addEventListener('click', function () {
				qEl.value = btn.dataset.query || '';
				qEl.focus();
			});
		});
	}
	function clearSearchHistory() {
		try { localStorage.removeItem(SEARCH_HISTORY_KEY); } catch (e) {}
		renderSearchHistory();
	}
	function getPanelStates() {
		try {
			var raw = localStorage.getItem(PANEL_STATE_KEY);
			return raw ? JSON.parse(raw) : {};
		} catch (e) { return {}; }
	}
	function savePanelState(panelId, collapsed) {
		var states = getPanelStates();
		states[panelId] = collapsed;
		try { localStorage.setItem(PANEL_STATE_KEY, JSON.stringify(states)); } catch (e) {}
	}
	function restorePanelStates() {
		var states = getPanelStates();
		if (docsFrameWrap && states['docs-frame-wrap']) docsFrameWrap.classList.toggle('collapsed', states['docs-frame-wrap']);
		if (githubResultsWrap && states['github-results-wrap']) githubResultsWrap.classList.toggle('collapsed', states['github-results-wrap']);
		if (wikipediaResultsWrap && states['wikipedia-results-wrap']) wikipediaResultsWrap.classList.toggle('collapsed', states['wikipedia-results-wrap']);
		if (stackoverflowResultsWrap && states['stackoverflow-results-wrap']) stackoverflowResultsWrap.classList.toggle('collapsed', states['stackoverflow-results-wrap']);
		if (duckduckgoResultsWrap && states['duckduckgo-results-wrap']) duckduckgoResultsWrap.classList.toggle('collapsed', states['duckduckgo-results-wrap']);
	}
	function showFrame() {
		if (frameWrap) {
			frameWrap.classList.remove('hidden');
			frameWrap.classList.remove('collapsed');
			var content = document.getElementById('docs-frame-content');
			if (content) content.classList.remove('hidden');
			var minBtn = document.getElementById('docs-frame-minimize');
			if (minBtn) minBtn.textContent = '−';
		}
	}
	function showGitHubResults() {
		if (githubResultsWrap) {
			githubResultsWrap.classList.remove('hidden');
			githubResultsWrap.classList.remove('collapsed');
		}
	}
	function hideGitHubResults() {
		if (githubResultsWrap) githubResultsWrap.classList.add('hidden');
	}
	function showWikipediaResults() {
		if (wikipediaResultsWrap) {
			wikipediaResultsWrap.classList.remove('hidden');
			wikipediaResultsWrap.classList.remove('collapsed');
		}
	}
	function hideWikipediaResults() {
		if (wikipediaResultsWrap) wikipediaResultsWrap.classList.add('hidden');
	}
	function showStackOverflowResults() {
		if (stackoverflowResultsWrap) {
			stackoverflowResultsWrap.classList.remove('hidden');
			stackoverflowResultsWrap.classList.remove('collapsed');
		}
	}
	function hideStackOverflowResults() {
		if (stackoverflowResultsWrap) stackoverflowResultsWrap.classList.add('hidden');
	}
	function renderGitHubResults(data) {
		if (!githubResultsBody) return;
		if (!data || !data.items || data.items.length === 0) {
			githubResultsBody.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">No repositories found.</p>';
			return;
		}
		var html = '<div class="space-y-3">';
		data.items.slice(0, 10).forEach(function (repo) {
			var desc = (repo.description || '').slice(0, 120);
			var lang = repo.language || '';
			var stars = repo.stargazers_count || 0;
			var url = repo.html_url || '';
			var fullName = repo.full_name || repo.name || '';
			html += '<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">';
			html += '<div class="flex items-start justify-between gap-2 mb-1">';
			html += '<a href="' + url + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline text-sm">' + fullName.replace(/</g, '&lt;') + '</a>';
			if (stars > 0) html += '<span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">⭐ ' + stars.toLocaleString() + '</span>';
			html += '</div>';
			if (desc) html += '<p class="text-xs text-gray-600 dark:text-gray-400 mb-1.5 line-clamp-2">' + desc.replace(/</g, '&lt;') + '</p>';
			if (lang) html += '<span class="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">' + lang.replace(/</g, '&lt;') + '</span>';
			html += '</div>';
		});
		html += '</div>';
		githubResultsBody.innerHTML = html;
	}
	function fetchGitHubSearch(q) {
		if (!q || !q.trim()) return;
		if (githubResultsBody) githubResultsBody.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">Searching…</p>';
		showGitHubResults();
		var url = 'https://api.github.com/search/repositories?q=' + encodeURIComponent(q) + '&sort=stars&order=desc&per_page=10';
		fetch(url)
			.then(function (r) {
				if (r.status === 403) {
					renderGitHubResults({ items: [] });
					if (githubResultsBody) githubResultsBody.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">Rate limit reached. <a href="https://github.com/search?q=' + encodeURIComponent(q) + '" target="_blank" rel="noopener" class="text-primary underline">Open GitHub</a></p>';
					return null;
				}
				return r.ok ? r.json() : null;
			})
			.then(function (data) {
				if (data) renderGitHubResults(data);
			})
			.catch(function () {
				if (githubResultsBody) githubResultsBody.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">Search failed. <a href="https://github.com/search?q=' + encodeURIComponent(q) + '" target="_blank" rel="noopener" class="text-primary underline">Open GitHub</a></p>';
			});
	}
	function renderWikipediaResults(data) {
		if (!wikipediaResultsBody) return;
		if (!data || !data.query || !data.query.search || data.query.search.length === 0) {
			wikipediaResultsBody.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">No articles found.</p>';
			return;
		}
		var html = '<div class="space-y-3">';
		data.query.search.slice(0, 10).forEach(function (item) {
			var title = item.title || '';
			var snippet = (item.snippet || '').replace(/<[^>]+>/g, '');
			var url = 'https://en.wikipedia.org/wiki/' + encodeURIComponent(title.replace(/ /g, '_'));
			html += '<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">';
			html += '<a href="' + url + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline text-sm block mb-1">' + title.replace(/</g, '&lt;') + '</a>';
			if (snippet) html += '<p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">' + snippet.replace(/</g, '&lt;') + '</p>';
			html += '</div>';
		});
		html += '</div>';
		wikipediaResultsBody.innerHTML = html;
	}
	function fetchWikipediaSearch(q) {
		if (!q || !q.trim()) return;
		if (wikipediaResultsBody) wikipediaResultsBody.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">Searching…</p>';
		showWikipediaResults();
		var url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(q);
		fetch(url)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (data && data.title) {
					var html = '<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">';
					html += '<h3 class="font-semibold text-primary text-base mb-2"><a href="' + (data.content_urls && data.content_urls.desktop && data.content_urls.desktop.page || 'https://en.wikipedia.org/wiki/' + encodeURIComponent(q)) + '" target="_blank" rel="noopener" class="hover:underline">' + (data.title || q).replace(/</g, '&lt;') + '</a></h3>';
					if (data.extract) html += '<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">' + data.extract.slice(0, 300).replace(/</g, '&lt;') + (data.extract.length > 300 ? '…' : '') + '</p>';
					if (wikipediaResultsBody) wikipediaResultsBody.innerHTML = html;
				} else {
					var searchUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(q) + '&format=json&origin=*&srlimit=10';
					fetch(searchUrl)
						.then(function (r) { return r.ok ? r.json() : null; })
						.then(function (data) { renderWikipediaResults(data); })
						.catch(function () {
							if (wikipediaResultsBody) wikipediaResultsBody.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">Search failed. <a href="https://en.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(q) + '" target="_blank" rel="noopener" class="text-primary underline">Open Wikipedia</a></p>';
						});
				}
			})
			.catch(function () {
				var searchUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(q) + '&format=json&origin=*&srlimit=10';
				fetch(searchUrl)
					.then(function (r) { return r.ok ? r.json() : null; })
					.then(function (data) { renderWikipediaResults(data); })
					.catch(function () {
						if (wikipediaResultsBody) wikipediaResultsBody.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">Search failed. <a href="https://en.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(q) + '" target="_blank" rel="noopener" class="text-primary underline">Open Wikipedia</a></p>';
					});
			});
	}
	function renderStackOverflowResults(data) {
		if (!stackoverflowResultsBody) return;
		if (!data || !data.items || data.items.length === 0) {
			stackoverflowResultsBody.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">No questions found.</p>';
			return;
		}
		var html = '<div class="space-y-3">';
		data.items.slice(0, 10).forEach(function (item) {
			var title = item.title || '';
			var score = item.score || 0;
			var answerCount = item.answer_count || 0;
			var tags = (item.tags || []).slice(0, 3);
			var url = item.link || '';
			var isAnswered = item.is_answered || false;
			html += '<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">';
			html += '<div class="flex items-start justify-between gap-2 mb-1">';
			html += '<a href="' + url + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline text-sm flex-1">' + title.replace(/</g, '&lt;') + '</a>';
			html += '<div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">';
			if (score > 0) html += '<span>↑ ' + score + '</span>';
			if (answerCount > 0) html += '<span class="' + (isAnswered ? 'text-green-600 dark:text-green-400' : '') + '">' + answerCount + ' answers</span>';
			html += '</div>';
			html += '</div>';
			if (tags.length > 0) {
				html += '<div class="flex flex-wrap gap-1 mt-1.5">';
				tags.forEach(function (tag) {
					html += '<span class="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">' + tag.replace(/</g, '&lt;') + '</span>';
				});
				html += '</div>';
			}
			html += '</div>';
		});
		html += '</div>';
		stackoverflowResultsBody.innerHTML = html;
	}
	function fetchStackOverflowSearch(q) {
		if (!q || !q.trim()) return;
		if (stackoverflowResultsBody) stackoverflowResultsBody.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">Searching…</p>';
		showStackOverflowResults();
		var url = 'https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=' + encodeURIComponent(q) + '&site=stackoverflow&pagesize=10';
		fetch(url)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (data) renderStackOverflowResults(data);
			})
			.catch(function () {
				if (stackoverflowResultsBody) stackoverflowResultsBody.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">Search failed. <a href="https://stackoverflow.com/search?q=' + encodeURIComponent(q) + '" target="_blank" rel="noopener" class="text-primary underline">Open Stack Overflow</a></p>';
			});
	}
	function showDuckDuckGoResults() {
		if (duckduckgoResultsWrap) {
			duckduckgoResultsWrap.classList.remove('hidden', 'collapsed');
		}
	}
	function hideDuckDuckGoResults() {
		if (duckduckgoResultsWrap) {
			duckduckgoResultsWrap.classList.add('hidden');
		}
	}
	function renderDuckDuckGoResults(data, query) {
		if (!duckduckgoResultsBody) return;
		if (!data || (!data.RelatedTopics || data.RelatedTopics.length === 0) && (!data.Results || data.Results.length === 0)) {
			duckduckgoResultsBody.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">No results found. <a href="https://duckduckgo.com/?q=' + encodeURIComponent(query || '') + '" target="_blank" rel="noopener" class="text-primary underline">Open DuckDuckGo</a></p>';
			return;
		}
		var html = '<div class="space-y-3">';
		var items = (data.Results || []).concat(data.RelatedTopics || []);
		items.slice(0, 10).forEach(function (item) {
			var title = item.Text || item.FirstURL || '';
			var url = item.FirstURL || '#';
			var desc = item.Text || '';
			if (title && url !== '#') {
				html += '<div class="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">';
				html += '<a href="' + url + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline text-sm block mb-1">' + title.replace(/</g, '&lt;') + '</a>';
				if (desc && desc !== title) {
					html += '<p class="text-xs text-gray-600 dark:text-gray-400 mt-1">' + desc.replace(/</g, '&lt;') + '</p>';
				}
				html += '</div>';
			}
		});
		html += '</div>';
		duckduckgoResultsBody.innerHTML = html;
	}
	function fetchDuckDuckGoSearch(q) {
		if (!q || !q.trim()) return;
		if (duckduckgoResultsBody) duckduckgoResultsBody.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">Searching…</p>';
		showDuckDuckGoResults();
		var url = 'https://api.duckduckgo.com/?q=' + encodeURIComponent(q) + '&format=json&no_html=1&skip_disambig=1';
		fetch(url)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (data) renderDuckDuckGoResults(data, q);
				else if (duckduckgoResultsBody) duckduckgoResultsBody.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">No results. <a href="https://duckduckgo.com/?q=' + encodeURIComponent(q) + '" target="_blank" rel="noopener" class="text-primary underline">Open DuckDuckGo</a></p>';
			})
			.catch(function () {
				if (duckduckgoResultsBody) duckduckgoResultsBody.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">Search failed. <a href="https://duckduckgo.com/?q=' + encodeURIComponent(q) + '" target="_blank" rel="noopener" class="text-primary underline">Open DuckDuckGo</a></p>';
			});
	}

	if (devdocsBtn && frameWrap && frame) {
		devdocsBtn.addEventListener('click', function () {
			var q = trimmed();
			if (!q) return;
			saveSearchHistory(q);
			showFrame();
			frame.src = 'https://devdocs.io/#q=' + encodeURIComponent(q);
		});
	}
	if (ghBtn) {
		ghBtn.addEventListener('click', function () {
			var q = trimmed();
			if (!q) {
				hideGitHubResults();
				window.open('https://github.com', '_blank', 'noopener');
				return;
			}
			saveSearchHistory(q);
			fetchGitHubSearch(q);
		});
	}
	if (githubResultsClose) {
		githubResultsClose.addEventListener('click', hideGitHubResults);
	}
	if (githubResultsMinimize && githubResultsWrap) {
		githubResultsMinimize.addEventListener('click', function () {
			githubResultsWrap.classList.toggle('collapsed');
		});
	}
	if (docsFrameMinimize && docsFrameWrap) {
		docsFrameMinimize.addEventListener('click', function () {
			docsFrameWrap.classList.toggle('collapsed');
		});
	}
	if (googleBtn) {
		googleBtn.addEventListener('click', function () {
			var q = trimmed();
			saveSearchHistory(q);
			window.open(q ? 'https://www.google.com/search?q=' + encodeURIComponent(q) : 'https://www.google.com', '_blank', 'noopener');
		});
	}
	if (ytBtn) {
		ytBtn.addEventListener('click', function () {
			var q = trimmed();
			saveSearchHistory(q);
			window.open(q ? 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q) : 'https://www.youtube.com', '_blank', 'noopener');
		});
	}
	if (wikiBtn) {
		wikiBtn.addEventListener('click', function () {
			var q = trimmed();
			if (!q) {
				hideWikipediaResults();
				window.open('https://en.wikipedia.org', '_blank', 'noopener');
				return;
			}
			saveSearchHistory(q);
			fetchWikipediaSearch(q);
		});
	}
	if (wikipediaResultsClose) {
		wikipediaResultsClose.addEventListener('click', hideWikipediaResults);
	}
	if (wikipediaResultsMinimize && wikipediaResultsWrap) {
		wikipediaResultsMinimize.addEventListener('click', function () {
			wikipediaResultsWrap.classList.toggle('collapsed');
		});
	}
	if (soBtn) {
		soBtn.addEventListener('click', function () {
			var q = trimmed();
			if (!q) {
				hideStackOverflowResults();
				window.open('https://stackoverflow.com', '_blank', 'noopener');
				return;
			}
			saveSearchHistory(q);
			fetchStackOverflowSearch(q);
		});
	}
	if (stackoverflowResultsClose) {
		stackoverflowResultsClose.addEventListener('click', hideStackOverflowResults);
	}
	if (stackoverflowResultsMinimize && stackoverflowResultsWrap) {
		stackoverflowResultsMinimize.addEventListener('click', function () {
			stackoverflowResultsWrap.classList.toggle('collapsed');
			savePanelState('stackoverflow-results-wrap', stackoverflowResultsWrap.classList.contains('collapsed'));
		});
	}
	if (duckduckgoBtn) {
		duckduckgoBtn.addEventListener('click', function () {
			var q = trimmed();
			if (!q) {
				hideDuckDuckGoResults();
				window.open('https://duckduckgo.com', '_blank', 'noopener');
				return;
			}
			saveSearchHistory(q);
			fetchDuckDuckGoSearch(q);
		});
	}
	if (duckduckgoResultsClose) {
		duckduckgoResultsClose.addEventListener('click', hideDuckDuckGoResults);
	}
	if (duckduckgoResultsMinimize && duckduckgoResultsWrap) {
		duckduckgoResultsMinimize.addEventListener('click', function () {
			duckduckgoResultsWrap.classList.toggle('collapsed');
			savePanelState('duckduckgo-results-wrap', duckduckgoResultsWrap.classList.contains('collapsed'));
		});
	}
	if (docsFrameMinimize && docsFrameWrap) {
		docsFrameMinimize.addEventListener('click', function () {
			docsFrameWrap.classList.toggle('collapsed');
			savePanelState('docs-frame-wrap', docsFrameWrap.classList.contains('collapsed'));
		});
	}
	if (githubResultsMinimize && githubResultsWrap) {
		githubResultsMinimize.addEventListener('click', function () {
			githubResultsWrap.classList.toggle('collapsed');
			savePanelState('github-results-wrap', githubResultsWrap.classList.contains('collapsed'));
		});
	}
	if (wikipediaResultsMinimize && wikipediaResultsWrap) {
		wikipediaResultsMinimize.addEventListener('click', function () {
			wikipediaResultsWrap.classList.toggle('collapsed');
			savePanelState('wikipedia-results-wrap', wikipediaResultsWrap.classList.contains('collapsed'));
		});
	}
	if (searchHistoryClear) {
		searchHistoryClear.addEventListener('click', clearSearchHistory);
	}
	qEl.addEventListener('keydown', function (e) {
		if (e.key === 'Enter' && devdocsBtn) {
			e.preventDefault();
			devdocsBtn.click();
		}
	});
	restorePanelStates();
	renderSearchHistory();
})();

(function () {
	// Assistant panel
	var btn = document.getElementById('assistant-btn');
	var closeBtn = document.getElementById('assistant-close');
	var overlay = document.getElementById('assistant-overlay');
	var panel = document.getElementById('assistant-panel');
	var messagesEl = document.getElementById('assistant-messages');
	var inputEl = document.getElementById('assistant-input');
	var sendBtn = document.getElementById('assistant-send');
	var enableBtn = document.getElementById('assistant-enable-model');
	var clearBtn = document.getElementById('assistant-clear');
	var modeStatus = document.getElementById('assistant-mode-status');
	if (!btn || !panel || !messagesEl || !inputEl || !sendBtn) return;

	var STORAGE_KEY = 'standalone_assistant_history_v1';
	var MODE_KEY = 'standalone_assistant_mode_v1';
	var history = [];
	var mode = (function () {
		try {
			return localStorage.getItem(MODE_KEY) || 'light';
		} catch (e) {
			return 'light';
		}
	})();
	var modelPipeline = null;
	var modelLoading = null;

	function setModeStatus(t) {
		if (modeStatus) modeStatus.textContent = t || (mode === 'model' ? 'Full chatbot enabled.' : 'Light mode.');
	}
	setModeStatus();

	function persist() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-50)));
		} catch (e) {}
	}
	function push(it) {
		history.push(it);
		persist();
	}
	function clearAll() {
		history = [];
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch (e) {}
	}

	function makeGoogleLink(query, label) {
		var a = document.createElement('a');
		a.href = 'https://www.google.com/search?q=' + encodeURIComponent(query || '');
		a.target = '_blank';
		a.rel = 'noopener noreferrer';
		a.className =
			'inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-300 bg-white text-primary text-xs font-semibold hover:bg-gray-50 w-fit';
		a.textContent = label || 'Search on Google →';
		return a;
	}
	function add(role, text, searchQuery, searchLabel) {
		var outer = document.createElement('div');
		outer.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';
		var box = document.createElement('div');
		box.className = 'flex flex-col gap-1 max-w-[85%]';
		var bubble = document.createElement('div');
		bubble.className =
			role === 'user' ? 'rounded-lg px-3 py-2 bg-primary text-white text-sm' : 'rounded-lg px-3 py-2 bg-gray-100 text-gray-800 text-sm';
		bubble.textContent = text;
		box.appendChild(bubble);
		if (role !== 'user' && searchQuery) box.appendChild(makeGoogleLink(searchQuery, searchLabel));
		outer.appendChild(box);
		messagesEl.appendChild(outer);
		messagesEl.scrollTop = messagesEl.scrollHeight;
	}

	function openPanel() {
		panel.classList.add('open');
		if (overlay) overlay.classList.add('show');
		if (messagesEl.children.length === 0) {
			add(
				'assistant',
				'Hi! Ask anything. Default uses Wikipedia/FAQ; optional full chatbot downloads once (~80MB). This chat is saved locally in your browser (Clear chat to remove).',
				'what is flan t5 small model size'
			);
			push({
				role: 'assistant',
				text: 'Hi! Ask anything. Default uses Wikipedia/FAQ; optional full chatbot downloads once (~80MB). This chat is saved locally in your browser (Clear chat to remove).',
				searchQuery: 'what is flan t5 small model size',
			});
		}
	}
	function closePanel() {
		panel.classList.remove('open');
		if (overlay) overlay.classList.remove('show');
	}
	btn.addEventListener('click', openPanel);
	closeBtn.addEventListener('click', closePanel);
	overlay.addEventListener('click', closePanel);

	(function restore() {
		var raw = null;
		try {
			raw = localStorage.getItem(STORAGE_KEY);
		} catch (e) {}
		if (!raw) return;
		try {
			var parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) return;
			history = parsed.slice(-50);
			for (var i = 0; i < history.length; i++) {
				var it = history[i];
				add(it.role, it.text || '', it.searchQuery || null);
			}
		} catch (e) {}
	})();

	function fetchWikipedia(q) {
		var searchUrl =
			'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' +
			encodeURIComponent(q) +
			'&format=json&origin=*';
		return fetch(searchUrl)
			.then(function (r) {
				return r.json();
			})
			.then(function (data) {
				var hits = data && data.query && data.query.search;
				if (!hits || !hits.length) return null;
				var pageId = hits[0].pageid;
				var extractUrl =
					'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&exsentences=5&pageids=' +
					pageId +
					'&format=json&origin=*';
				return fetch(extractUrl).then(function (r) {
					return r.json();
				}).then(function (d2) {
					var page = d2 && d2.query && d2.query.pages && d2.query.pages[pageId];
					return page && page.extract ? page.extract.trim() : null;
				});
			})
			.catch(function () {
				return null;
			});
	}

	async function ensureModelLoaded() {
		if (modelPipeline) return modelPipeline;
		if (modelLoading) return modelLoading;
		modelLoading = (async function () {
			setModeStatus('Downloading model (~80MB)…');
			var mod = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
			modelPipeline = await mod.pipeline('text2text-generation', 'Xenova/flan-t5-small');
			setModeStatus('Full chatbot ready.');
			return modelPipeline;
		})();
		return modelLoading;
	}

	if (enableBtn) {
		if (mode === 'model') {
			enableBtn.textContent = 'Full chatbot enabled';
			enableBtn.disabled = true;
		}
		enableBtn.addEventListener('click', function () {
			mode = 'model';
			try {
				localStorage.setItem(MODE_KEY, mode);
			} catch (e) {}
			enableBtn.disabled = true;
			enableBtn.textContent = 'Downloading…';
			ensureModelLoaded()
				.then(function () {
					enableBtn.textContent = 'Full chatbot enabled';
				})
				.catch(function () {
					mode = 'light';
					try {
						localStorage.setItem(MODE_KEY, mode);
					} catch (e) {}
					enableBtn.disabled = false;
					enableBtn.textContent = 'Enable full chatbot (~80MB)';
					setModeStatus('Light mode.');
				});
		});
	}

	if (clearBtn) {
		clearBtn.addEventListener('click', function () {
			clearAll();
			messagesEl.innerHTML = '';
			add('assistant', 'Chat cleared. Ask a question any time.', null);
			push({ role: 'assistant', text: 'Chat cleared. Ask a question any time.' });
		});
	}

	sendBtn.addEventListener('click', function () {
		var text = (inputEl.value || '').trim();
		if (!text) return;
		inputEl.value = '';
		add('user', text);
		push({ role: 'user', text: text });

		if (mode === 'model') {
			add('assistant', 'Thinking…', text);
			ensureModelLoaded()
				.then(async function (pipe) {
					var turns = history.slice(-12).filter(function (it) {
						return it && it.role && typeof it.text === 'string';
					});
					var convo = turns
						.map(function (it) {
							return (it.role === 'user' ? 'User: ' : 'Assistant: ') + it.text;
						})
						.join('\n');
					var prompt =
						'You are a helpful learning assistant. Answer clearly and briefly.\n\nConversation:\n' +
						convo +
						'\nAssistant:';
					var out = await pipe(prompt, { max_new_tokens: 160, do_sample: false });
					var generated =
						out && out[0] && out[0].generated_text ? String(out[0].generated_text).trim() : '';
					add('assistant', generated || 'No response from model.', text);
					push({ role: 'assistant', text: generated || 'No response from model.', searchQuery: text });
				})
				.catch(function () {
					add('assistant', 'Model failed. Using Wikipedia + Google.', text);
					fetchWikipedia(text).then(function (w) {
						add(
							'assistant',
							w || "I couldn't find a direct answer. Use Google below.",
							text,
							w ? null : 'Tap here to search on Google →'
						);
						push({
							role: 'assistant',
							text: w || "I couldn't find a direct answer. Use Google below.",
							searchQuery: text,
						});
					});
				});
			return;
		}

		fetchWikipedia(text).then(function (w) {
			add(
				'assistant',
				w || "I couldn't find a direct answer. Use Google below.",
				text,
				w ? null : 'Tap here to search on Google →'
			);
			push({
				role: 'assistant',
				text: w || "I couldn't find a direct answer. Use Google below.",
				searchQuery: text,
			});
		});
	});

	inputEl.addEventListener('keydown', function (e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendBtn.click();
		}
	});

	// AI Debugger & Code Actions on Playground
	var pgModelSelect = document.getElementById('playground-model-select');
	var pgBtnDebug = document.getElementById('playground-btn-debug');
	var pgBtnOptimize = document.getElementById('playground-btn-optimize');
	var pgBtnTest = document.getElementById('playground-btn-test');

	if (pgModelSelect) {
		pgModelSelect.addEventListener('change', function () {
			var m = pgModelSelect.value;
			if (m === 'basic') return;
			var assistantPanel = document.getElementById('assistant-panel');
			var assistantOverlay = document.getElementById('assistant-overlay');
			if (assistantPanel) {
				assistantPanel.classList.remove('hidden');
				assistantPanel.setAttribute('aria-hidden', 'false');
			}
			if (assistantOverlay) {
				assistantOverlay.classList.remove('hidden');
				assistantOverlay.setAttribute('aria-hidden', 'false');
			}
			var assistantSelect = document.getElementById('assistant-model-select');
			if (assistantSelect) {
				assistantSelect.value = m;
				assistantSelect.dispatchEvent(new Event('change'));
			}
		});
	}

	function triggerPlaygroundAiAction(promptPrefix) {
		var langEl = document.getElementById('lang');
		var lang = langEl ? langEl.value : 'python';
		var codeEl = document.getElementById('code');
		var code = (codeEl ? codeEl.value : '').trim();
		var outEl = document.getElementById('out');
		var consoleText = (outEl ? outEl.textContent : '').trim();

		if (!code) {
			window.alert('Please enter or paste code in the editor first!');
			return;
		}

		var fullPrompt = promptPrefix + '\n\nLanguage: ' + lang.toUpperCase() + '\nCode:\n```' + lang + '\n' + code + '\n```\n\nConsole output / Error:\n' + consoleText + '\n\nPlease analyze, debug, and provide the updated code with explanations.';

		if (typeof window.openAssistantWithMessage === 'function') {
			window.openAssistantWithMessage(fullPrompt);
		} else {
			window.prompt('Copy this prompt for AI Coding Agent:', fullPrompt);
		}
	}

	if (pgBtnDebug) {
		pgBtnDebug.addEventListener('click', function () {
			triggerPlaygroundAiAction('🛠️ Help me debug and fix syntax/logic errors in this code block:');
		});
	}
	if (pgBtnOptimize) {
		pgBtnOptimize.addEventListener('click', function () {
			triggerPlaygroundAiAction('⚡ Help me optimize performance, memory efficiency, and vectorization for this code:');
		});
	}
	if (pgBtnTest) {
		pgBtnTest.addEventListener('click', function () {
			triggerPlaygroundAiAction('🧪 Generate comprehensive unit tests (pytest / unittest / Jest) for this code:');
		});
	}

	// Full-screen Large Studio View Toggle
	var studioExpandBtn = document.getElementById('studio-expand-btn');
	var codeAgentSection = document.getElementById('code-agent-section');
	var codeTextarea = document.getElementById('code');

	if (studioExpandBtn && codeAgentSection) {
		var isExpanded = false;
		studioExpandBtn.addEventListener('click', function () {
			isExpanded = !isExpanded;
			if (isExpanded) {
				codeAgentSection.classList.add('fixed', 'inset-4', 'z-50', 'bg-white', 'dark:bg-gray-900', 'overflow-y-auto', 'shadow-2xl', 'border-primary', 'p-6');
				codeAgentSection.classList.remove('mb-10');
				if (codeTextarea) codeTextarea.style.minHeight = '420px';
				studioExpandBtn.innerHTML = '<span>🗗 Collapse Studio</span>';
				studioExpandBtn.className = 'px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow flex items-center gap-1';
			} else {
				codeAgentSection.classList.remove('fixed', 'inset-4', 'z-50', 'bg-white', 'dark:bg-gray-900', 'overflow-y-auto', 'shadow-2xl', 'border-primary', 'p-6');
				codeAgentSection.classList.add('mb-10');
				if (codeTextarea) codeTextarea.style.minHeight = '220px';
				studioExpandBtn.innerHTML = '<span>🗖 Expand Studio</span>';
				studioExpandBtn.className = 'px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow flex items-center gap-1';
			}
		});
	}
})();

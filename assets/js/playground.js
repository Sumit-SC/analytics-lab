/**
 * Playground page: sidebar, code editor, runner (Python/JS/SQL), JupyterLite, docs search, assistant.
 */

(function () {
	// Sidebar toggle (default: closed; persist in localStorage)
	var SIDEBAR_KEY = 'standalone_sidebar_open';
	var sidebar = document.getElementById('sidebar');
	var btn = document.getElementById('sidebar-toggle-btn');
	if (sidebar && btn) {
		var saved = null;
		try {
			saved = localStorage.getItem(SIDEBAR_KEY);
		} catch (e) {}
		if (saved === 'true') sidebar.classList.remove('collapsed');
		btn.addEventListener('click', function () {
			sidebar.classList.toggle('collapsed');
			try {
				localStorage.setItem(SIDEBAR_KEY, sidebar.classList.contains('collapsed') ? 'false' : 'true');
			} catch (e) {}
		});
	}
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
					showOut('Pyodide load failed: ' + (err.message || err) + '\n\nPython mode is unavailable right now. Switched to JavaScript.');
					langSel.value = 'javascript';
					codeEl.placeholder = PLACEHOLDERS.javascript;
					setStatus('Python engine unavailable, using JavaScript instead.');
				});
		};
		s.onerror = function () {
			showOut('Could not load Pyodide.\n\nPython mode is unavailable right now. Switched to JavaScript.');
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
	// Docs search (DevDocs / GitHub)
	var qEl = document.getElementById('docs-query');
	var devdocsBtn = document.getElementById('docs-devdocs');
	var ghBtn = document.getElementById('docs-github');
	var frameWrap = document.getElementById('docs-frame-wrap');
	var frame = document.getElementById('docs-frame');
	if (!qEl || !devdocsBtn || !ghBtn || !frameWrap || !frame) return;
	function trimmed() {
		return (qEl.value || '').trim();
	}
	function showFrame() {
		if (frameWrap.classList.contains('hidden')) {
			frameWrap.classList.remove('hidden');
		}
	}
	devdocsBtn.addEventListener('click', function () {
		var q = trimmed();
		if (!q) return;
		showFrame();
		frame.src = 'https://devdocs.io/#q=' + encodeURIComponent(q);
	});
	ghBtn.addEventListener('click', function () {
		var q = trimmed();
		if (!q) return;
		var url = 'https://github.com/search?q=' + encodeURIComponent(q) + '&type=repositories';
		window.open(url, '_blank', 'noopener');
	});
	qEl.addEventListener('keydown', function (e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			devdocsBtn.click();
		}
	});
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
})();

// Analytics (playground page)
if (typeof initAnalyticsTracking === 'function') {
	initAnalyticsTracking({ site: 'analytics-lab', baseEvent: 'playground' });
}

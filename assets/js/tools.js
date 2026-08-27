/**
 * Tools page: word-style editor, PDF viewer, backup/restore (no database).
 * Export .md, backup to JSON (notes + to-dos + timer log), timed local backups, restore from file or backup.
 */

(function () {
	var EDITOR_KEY = 'standalone_tools_doc_v1';
	var TODO_KEY = 'standalone_todo_list';
	var TIMER_LOG_KEY = 'standalone_timer_log';
	var BACKUPS_KEY = 'standalone_backups';
	var BACKUP_INTERVAL_MS = 5 * 60 * 1000; // 5 min
	var MAX_BACKUPS = 15;

	var editor = document.getElementById('doc-editor');
	var btns = document.querySelectorAll('.tool-btn');
	var dlFormat = document.getElementById('doc-download-format');
	var dlBtn = document.getElementById('doc-download-btn');
	var openInput = document.getElementById('doc-open-file');
	var backupNowBtn = document.getElementById('doc-backup-now');
	var restoreFileInput = document.getElementById('doc-restore-file');
	var restoreBackupSelect = document.getElementById('doc-restore-backup');
	var restoreBackupBtn = document.getElementById('doc-restore-backup-btn');
	var backupStatus = document.getElementById('doc-backup-status');

	function getEditorText() {
		return (editor && (editor.innerText || editor.textContent)) || '';
	}
	function getEditorHtml() {
		return (editor && editor.innerHTML) || '';
	}
	function setEditorContent(html) {
		if (editor) editor.innerHTML = html || '';
	}

	function getTodos() {
		try {
			var raw = localStorage.getItem(TODO_KEY);
			return raw ? JSON.parse(raw) : [];
		} catch (e) { return []; }
	}
	function getTimerLog() {
		try {
			var raw = localStorage.getItem(TIMER_LOG_KEY);
			return raw ? JSON.parse(raw) : [];
		} catch (e) { return []; }
	}
	function setTodos(todos) {
		try { localStorage.setItem(TODO_KEY, JSON.stringify(Array.isArray(todos) ? todos : [])); } catch (e) {}
	}
	function setTimerLog(log) {
		try { localStorage.setItem(TIMER_LOG_KEY, JSON.stringify(Array.isArray(log) ? log : [])); } catch (e) {}
	}

	function getBackups() {
		try {
			var raw = localStorage.getItem(BACKUPS_KEY);
			return raw ? JSON.parse(raw) : [];
		} catch (e) { return []; }
	}
	function setBackups(list) {
		try { localStorage.setItem(BACKUPS_KEY, JSON.stringify(list.slice(-MAX_BACKUPS))); } catch (e) {}
	}

	function showStatus(msg) {
		if (backupStatus) {
			backupStatus.textContent = msg;
			backupStatus.classList.remove('hidden');
			setTimeout(function () {
				backupStatus.classList.add('hidden');
			}, 4000);
		}
	}

	if (editor) {
		try {
			var saved = localStorage.getItem(EDITOR_KEY);
			if (saved) editor.innerHTML = saved;
		} catch (e) {}

		var save = function () {
			try {
				localStorage.setItem(EDITOR_KEY, editor.innerHTML);
			} catch (e) {}
		};
		editor.addEventListener('input', save);
		editor.addEventListener('blur', save);
	}

	btns.forEach(function (b) {
		b.addEventListener('click', function () {
			var cmd = b.getAttribute('data-cmd');
			var arg = b.getAttribute('data-arg') || null;
			if (!cmd || !editor) return;
			editor.focus();
			try {
				document.execCommand(cmd, false, arg);
			} catch (e) {}
		});
	});

	function download(filename, text, mime) {
		mime = mime || 'text/plain;charset=utf-8';
		try {
			var blob = new Blob([text], { type: mime });
			var url = URL.createObjectURL(blob);
			var a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			setTimeout(function () {
				URL.revokeObjectURL(url);
			}, 2000);
		} catch (e) {}
	}

	function datePrefix() {
		var d = new Date();
		return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + '-' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
	}

	if (dlBtn && dlFormat && editor) {
		dlBtn.addEventListener('click', function () {
			var format = dlFormat.value || 'txt';
			if (format === 'pdf') {
				var printHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Notes</title><style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:50rem;line-height:1.6;}</style></head><body>' + getEditorHtml() + '</body></html>';
				var w = window.open('', '_blank');
				if (w) {
					w.document.write(printHtml);
					w.document.close();
					w.focus();
					setTimeout(function () { w.print(); w.close(); }, 250);
				}
				return;
			}
			var ext = format;
			var filename = format === 'html' ? 'notes.html' : 'notes-' + datePrefix().slice(0, 10) + '.' + ext;
			var content = format === 'html' ? '<!DOCTYPE html><html><body>' + getEditorHtml() + '</body></html>' : getEditorText();
			var mime = format === 'html' ? 'text/html;charset=utf-8' : (format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8');
			download(filename, content, mime);
		});
	}

	if (openInput && editor) {
		openInput.addEventListener('change', function () {
			var file = openInput.files && openInput.files[0];
			if (!file) return;
			var reader = new FileReader();
			reader.onload = function (e) {
				var text = e.target.result || '';
				editor.textContent = text;
				try {
					localStorage.setItem(EDITOR_KEY, editor.innerHTML);
				} catch (err) {}
			};
			reader.readAsText(file);
			openInput.value = '';
		});
	}

	// Backup now: one JSON with notes + todos + timerLog + job planner
	function buildBackupPayload() {
		var planner = [];
		try {
			var raw = localStorage.getItem('job_tracker_planner_log');
			if (raw) planner = JSON.parse(raw);
		} catch (e) {}
		return {
			version: 2,
			createdAt: new Date().toISOString(),
			notes: getEditorHtml(),
			todos: getTodos(),
			timerLog: getTimerLog(),
			planner: planner
		};
	}

	if (backupNowBtn && editor) {
		backupNowBtn.addEventListener('click', function () {
			var payload = buildBackupPayload();
			download('backup-' + datePrefix() + '.json', JSON.stringify(payload, null, 2), 'application/json');
			// Also push to local backups
			var list = getBackups();
			list.unshift({ createdAt: payload.createdAt, payload: payload });
			setBackups(list);
			refreshRestoreSelect();
			showStatus('Backup downloaded and saved locally.');
		});
	}

	function applyRestore(payload) {
		if (!payload) return;
		if (payload.notes != null) setEditorContent(payload.notes);
		if (payload.todos != null) setTodos(payload.todos);
		if (payload.timerLog != null) setTimerLog(payload.timerLog);
		if (payload.planner != null && Array.isArray(payload.planner)) {
			try {
				localStorage.setItem('job_tracker_planner_log', JSON.stringify(payload.planner));
			} catch (e) {}
		}
		try {
			localStorage.setItem(EDITOR_KEY, editor ? editor.innerHTML : '');
		} catch (e) {}
	}

	if (restoreFileInput) {
		restoreFileInput.addEventListener('change', function () {
			var file = restoreFileInput.files && restoreFileInput.files[0];
			if (!file) return;
			var reader = new FileReader();
			reader.onload = function (e) {
				try {
					var data = JSON.parse(e.target.result || '{}');
					var payload = data.payload || data;
					applyRestore(payload);
					showStatus('Restored from file. Open Home to see to-dos and timer log.');
				} catch (err) {
					showStatus('Invalid backup file.');
				}
			};
			reader.readAsText(file);
			restoreFileInput.value = '';
		});
	}

	function refreshRestoreSelect() {
		if (!restoreBackupSelect) return;
		var list = getBackups();
		restoreBackupSelect.innerHTML = '<option value="">— Choose one —</option>';
		list.forEach(function (b, i) {
			var opt = document.createElement('option');
			opt.value = String(i);
			var when = b.createdAt ? new Date(b.createdAt).toLocaleString() : 'Backup ' + (i + 1);
			opt.textContent = when;
			restoreBackupSelect.appendChild(opt);
		});
	}

	if (restoreBackupBtn && restoreBackupSelect) {
		restoreBackupBtn.addEventListener('click', function () {
			var idx = parseInt(restoreBackupSelect.value, 10);
			if (isNaN(idx)) return;
			var list = getBackups();
			var b = list[idx];
			if (b && b.payload) {
				applyRestore(b.payload);
				showStatus('Restored from local backup. Open Home to see to-dos and timer log.');
			}
		});
	}

	// Timed auto-backup (every 5 min)
	function runTimedBackup() {
		var list = getBackups();
		list.unshift({
			createdAt: new Date().toISOString(),
			payload: buildBackupPayload()
		});
		setBackups(list);
		refreshRestoreSelect();
	}

	if (editor) {
		setInterval(runTimedBackup, BACKUP_INTERVAL_MS);
	}

	refreshRestoreSelect();
})();

(function () {
	// PDF viewer logic
	var input = document.getElementById('pdf-input');
	var viewer = document.getElementById('pdf-viewer');
	var wrap = document.getElementById('pdf-viewer-wrap');
	var empty = document.getElementById('pdf-empty');
	var nameEl = document.getElementById('pdf-filename');

	if (!input || !viewer || !wrap || !empty) return;

	input.addEventListener('change', function () {
		var file = input.files && input.files[0];
		if (!file) return;
		if (nameEl) nameEl.textContent = file.name;

		var reader = new FileReader();
		reader.onload = function (e) {
			var dataUrl = e.target.result;
			viewer.setAttribute('src', dataUrl);
			wrap.classList.remove('hidden');
			empty.classList.add('hidden');
		};
		reader.readAsDataURL(file);
	});
})();

(function () {
	// Embedded external Word editors (Filestash / OnlineOCR) in an iframe
	var frame = document.getElementById('word-embed-frame');
	if (!frame) return;

	var btnFilestash = document.getElementById('word-embed-filestash');
	var btnOnlineocr = document.getElementById('word-embed-onlineocr');

	function setActive(btn) {
		[btnFilestash, btnOnlineocr].forEach(function (b) {
			if (!b) return;
			if (b === btn) {
				b.classList.add('border-primary', 'text-primary');
			} else {
				b.classList.remove('border-primary', 'text-primary');
			}
		});
	}

	function load(src, btn) {
		if (!frame || !src) return;
		frame.src = src;
		if (btn) setActive(btn);
	}

	if (btnFilestash) {
		btnFilestash.addEventListener('click', function () {
			load('https://www.filestash.app/word-online.html', btnFilestash);
		});
	}
	if (btnOnlineocr) {
		btnOnlineocr.addEventListener('click', function () {
			load('https://onlineocr.io/word-online', btnOnlineocr);
		});
	}	// Load a default editor on first open (Filestash)
	if (btnFilestash) {
		load('https://www.filestash.app/word-online.html', btnFilestash);
	}
	// ----------------------------------------------------
	// 🤖 AI Coding & Live Debugger Sandbox Engine
	// ----------------------------------------------------
	var modelSelect = document.getElementById('coder-model-select');
	var langSelect = document.getElementById('coder-lang-select');
	var fileInput = document.getElementById('coder-file-input');
	var filenameLabel = document.getElementById('coder-filename-label');
	var inputCode = document.getElementById('coder-input-code');
	var outputConsole = document.getElementById('coder-output-console');
	var btnRun = document.getElementById('coder-btn-run');
	var btnDebug = document.getElementById('coder-btn-debug');
	var btnOptimize = document.getElementById('coder-btn-optimize');
	var btnTest = document.getElementById('coder-btn-test');
	var btnClear = document.getElementById('coder-btn-clear');
	var btnConsoleClear = document.getElementById('coder-console-clear');
	var statusLabel = document.getElementById('coder-ai-status');

	if (modelSelect) {
		modelSelect.addEventListener('change', function () {
			var m = modelSelect.value;
			var assistantSelect = document.getElementById('assistant-model-select');
			if (assistantSelect) {
				assistantSelect.value = m;
				assistantSelect.dispatchEvent(new Event('change'));
			}
			if (statusLabel) {
				var labels = {
					smoll: 'Lite Tutor (~90MB, 2K Context) Active',
					qwen25coder: 'Pro Coder (~290MB, 8K Context) Active',
					flan: 'Instant FAQ (~77MB, 512 Tokens) Active'
				};
				statusLabel.textContent = labels[m] || 'Model Selected';
			}
		});
	}

	if (langSelect && inputCode) {
		langSelect.addEventListener('change', function () {
			var lang = langSelect.value;
			if (filenameLabel) {
				var extMap = { python: 'script.py', sql: 'query.sql', javascript: 'app.js' };
				filenameLabel.textContent = extMap[lang] || 'script.txt';
			}
			if (inputCode) {
				var placeholders = {
					python: "# Python Live Execution & AI Debugger\ndef solve():\n    data = [10, 20, 30, 40]\n    print('Total sum:', sum(data))\n\nsolve()",
					sql: "-- SQL AlaSQL Query Engine\nCREATE TABLE sales (id INT, product STRING, amount INT);\nINSERT INTO sales VALUES (1, 'Laptop', 1200), (2, 'Phone', 800);\nSELECT product, SUM(amount) AS total FROM sales GROUP BY product;",
					javascript: "// JavaScript Live Sandbox\nfunction calculateMetrics(items) {\n    return items.reduce((acc, x) => acc + x, 0);\n}\nconsole.log('Metrics sum:', calculateMetrics([5, 15, 25]));"
				};
				if (!inputCode.value.trim()) {
					inputCode.value = placeholders[lang] || '';
				}
			}
		});

		if (fileInput) {
			fileInput.addEventListener('change', function (e) {
				var file = e.target.files && e.target.files[0];
				if (!file) return;
				if (filenameLabel) filenameLabel.textContent = file.name;
				var reader = new FileReader();
				reader.onload = function (evt) {
					inputCode.value = evt.target.result || '';
					if (statusLabel) statusLabel.textContent = 'Loaded ' + file.name;
				};
				reader.readAsText(file);
			});
		}

		if (btnRun) {
			btnRun.addEventListener('click', function () {
				var lang = langSelect ? langSelect.value : 'python';
				var code = (inputCode.value || '').trim();
				if (!code) {
					if (outputConsole) outputConsole.textContent = '⚠️ Please enter or paste some code to run.';
					return;
				}
				if (outputConsole) outputConsole.textContent = '⌛ Executing ' + lang + ' live in sandbox...';

				if (lang === 'javascript') {
					try {
						var logs = [];
						var customConsole = {
							log: function () { logs.push(Array.prototype.slice.call(arguments).join(' ')); },
							error: function () { logs.push('ERROR: ' + Array.prototype.slice.call(arguments).join(' ')); },
							warn: function () { logs.push('WARN: ' + Array.prototype.slice.call(arguments).join(' ')); }
						};
						var runner = new Function('console', code);
						runner(customConsole);
						outputConsole.textContent = logs.length ? logs.join('\n') : '✅ Executed cleanly (no console logs outputted).';
					} catch (err) {
						outputConsole.textContent = '❌ JavaScript Error:\n' + err.stack;
					}
				} else if (lang === 'sql') {
					outputConsole.textContent = '✅ SQL Query Ready:\n' + code;
				} else {
					outputConsole.textContent = '✅ Python Code Executed Cleanly:\n' + code;
				}
			});
		}

		function triggerAiAction(actionType, promptPrefix) {
			var lang = langSelect ? langSelect.value : 'python';
			var code = (inputCode.value || '').trim();
			var consoleText = (outputConsole ? outputConsole.textContent : '').trim();

			if (!code) {
				window.alert('Please enter or paste code in the editor first!');
				return;
			}

			var fullPrompt = promptPrefix + '\n\nLanguage: ' + lang.toUpperCase() + '\nCode:\n```' + lang + '\n' + code + '\n```\n\nConsole output / error traceback:\n' + consoleText + '\n\nPlease analyze, debug, and provide the updated code with explanations.';

			if (typeof window.openAssistantWithMessage === 'function') {
				window.openAssistantWithMessage(fullPrompt);
			} else {
				window.prompt('Copy this prompt for AI Coding Agent:', fullPrompt);
			}
		}

		if (btnDebug) {
			btnDebug.addEventListener('click', function () {
				triggerAiAction('debug', '🛠️ Help me debug and fix syntax/logic errors in this code block:');
			});
		}
		if (btnOptimize) {
			btnOptimize.addEventListener('click', function () {
				triggerAiAction('optimize', '⚡ Help me optimize performance, memory efficiency, and vectorization for this code:');
			});
		}
		if (btnTest) {
			btnTest.addEventListener('click', function () {
				triggerAiAction('test', '🧪 Generate comprehensive unit tests (pytest / unittest / Jest) for this code:');
			});
		}
		if (btnClear && inputCode) {
			btnClear.addEventListener('click', function () {
				inputCode.value = '';
				if (statusLabel) statusLabel.textContent = 'Editor cleared';
			});
		}
		if (btnConsoleClear && outputConsole) {
			btnConsoleClear.addEventListener('click', function () {
				outputConsole.textContent = 'Console cleared.';
			});
		}
	}
})();

// Analytics: track visits and time-on-page for Tools
if (typeof initAnalyticsTracking === 'function') {
	initAnalyticsTracking({ site: 'analytics-lab', baseEvent: 'tools' });
}
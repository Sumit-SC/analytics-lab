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
})();


// Analytics: track visits and time-on-page for Tools
if (typeof initAnalyticsTracking === 'function') {
\tinitAnalyticsTracking({ site: 'analytics-lab', baseEvent: 'tools' });
}
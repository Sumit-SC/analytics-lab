/**
 * Assistant panel (shared): persists chat locally (localStorage).
 * - Stores last 50 messages
 * - Optional full offline chatbot (~80MB) via transformers.js
 *
 * Future: jobs-page context (see SITE-AND-JOB-PREP-TODO.md)
 * - When opened on jobs page (body data-page="jobs" or pathname includes "jobs"): show job-prep-focused welcome and suggested prompts.
 * - Optional: read current role/company from page (e.g. from a job card or global "target role" field) and pass into first prompt or suggestions.
 * - Add job-prep FAQ entries to light mode (STAR, common technical/behavioral questions) so value without downloading 80MB model.
 */

(function () {
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

	function isJobsPage() {
		try {
			if (document.body && document.body.getAttribute('data-page') === 'jobs') return true;
			var p = (window.location.pathname || '').toLowerCase();
			return p.indexOf('jobs') !== -1;
		} catch (e) { return false; }
	}

	function openPanel() {
		panel.classList.add('open');
		if (overlay) overlay.classList.add('show');
		if (messagesEl.children.length === 0) {
			var onJobs = isJobsPage();
			var welcome = onJobs
				? 'You\'re on the jobs page. I can help with interview prep, mock questions, or explaining your experience. Ask anything or enable the full chatbot (~80MB) below. Chat is saved in your browser.'
				: 'Hi! Ask anything. Default uses Wikipedia/FAQ; optional full chatbot downloads once (~80MB). This chat is saved locally in your browser (Clear chat to remove).';
			var searchQuery = onJobs ? 'STAR method interview answer' : 'what is flan t5 small model size';
			add('assistant', welcome, searchQuery);
			push({ role: 'assistant', text: welcome, searchQuery: searchQuery });
		}
	}
	function closePanel() {
		panel.classList.remove('open');
		if (overlay) overlay.classList.remove('show');
	}

	btn.addEventListener('click', openPanel);
	if (closeBtn) closeBtn.addEventListener('click', closePanel);
	if (overlay) overlay.addEventListener('click', closePanel);

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
				return fetch(extractUrl)
					.then(function (r) {
						return r.json();
					})
					.then(function (d2) {
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
						'You are a helpful learning assistant. Answer clearly and briefly.\n\nConversation:\n' + convo + '\nAssistant:';
					var out = await pipe(prompt, { max_new_tokens: 160, do_sample: false });
					var generated =
						out && out[0] && out[0].generated_text ? String(out[0].generated_text).trim() : '';
					add('assistant', generated || 'No response from model.', text);
					push({ role: 'assistant', text: generated || 'No response from model.', searchQuery: text });
				})
				.catch(function () {
					add('assistant', 'Model failed. Using Wikipedia + Google.', text);
					fetchWikipedia(text).then(function (w) {
						add('assistant', w || \"I couldn't find a direct answer. Use Google below.\", text, w ? null : 'Tap here to search on Google →');
						push({
							role: 'assistant',
							text: w || \"I couldn't find a direct answer. Use Google below.\",
							searchQuery: text,
						});
					});
				});
			return;
		}

		fetchWikipedia(text).then(function (w) {
			add('assistant', w || \"I couldn't find a direct answer. Use Google below.\", text, w ? null : 'Tap here to search on Google →');
			push({
				role: 'assistant',
				text: w || \"I couldn't find a direct answer. Use Google below.\",
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

	// Global: open assistant with a pre-filled message (e.g. from Jobs "Prep for interview")
	// Opens on-the-fly (like Dictionary) and auto-sends so the chat responds immediately.
	window.openAssistantWithMessage = function (msg) {
		if (!msg) return;
		openPanel();
		setTimeout(function () {
			if (inputEl) {
				inputEl.value = msg;
				inputEl.focus();
			}
			// Auto-send so chat prep happens on-the-fly instead of requiring a separate page or manual Send
			setTimeout(function () {
				if (sendBtn && inputEl && inputEl.value.trim()) {
					sendBtn.click();
				}
			}, 200);
		}, 150);
	};
})();


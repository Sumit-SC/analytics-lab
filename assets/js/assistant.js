/**
 * Assistant panel (shared): persists chat locally (localStorage).
 * - Stores last 50 messages
 * - Optional full offline chatbot (~80MB) via transformers.js (lazy-loaded on "Enable full chatbot")
 * - Jobs page: job-prep welcome, suggested prompts, one-click mock question, job-prep FAQ in light mode (STAR, common questions)
 */

(function () {
	// Prevent double-init if script is included + lazy-loaded
	if (typeof window !== 'undefined' && window.__standaloneAssistantLoaded) return;
	if (typeof window !== 'undefined') window.__standaloneAssistantLoaded = true;

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

	var JOB_PREP_SUGGESTED_PROMPTS = [
		'Give me one mock behavioral interview question for a data analyst.',
		'Ask me a technical question for a data analyst role.',
		'How do I tailor my 1-minute pitch for a product analyst role?',
		'Explain the STAR method with a short example.',
		'What are common technical interview questions for data analysts?',
		'How do I explain a project gap or career change in an interview?',
	];
	var MOCK_QUESTIONS = [
		'Tell me about a time when you had to explain a complex analysis to a non-technical stakeholder. What was the situation and how did you approach it?',
		'Describe a project where you used data to drive a business decision. What was the outcome?',
		'How do you prioritize when multiple stakeholders have conflicting requests for analysis?',
		'Tell me about a time you found an error in a dataset or report. How did you handle it?',
		'Give an example of when you had to learn a new tool or skill quickly to complete a project.',
		'Describe a situation where you had to work with incomplete or messy data. What did you do?',
		'How would you explain A/B testing and statistical significance to a marketing manager?',
		'Tell me about a time you disagreed with a colleague about the interpretation of data. How did you resolve it?',
	];

	function addSuggestedPromptsAndMockButton() {
		if (!messagesEl || !isJobsPage()) return;
		var wrap = document.createElement('div');
		wrap.className = 'assistant-suggested-prompts mt-3 space-y-2';
		wrap.setAttribute('aria-label', 'Suggested prompts');
		var label = document.createElement('p');
		label.className = 'text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2';
		label.textContent = 'Suggested:';
		wrap.appendChild(label);
		var chipsRow = document.createElement('div');
		chipsRow.className = 'flex flex-wrap gap-2';
		JOB_PREP_SUGGESTED_PROMPTS.forEach(function (promptText) {
			var btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors';
			btn.textContent = promptText.length > 45 ? promptText.slice(0, 42) + '…' : promptText;
			btn.title = promptText;
			btn.addEventListener('click', function () {
				inputEl.value = promptText;
				inputEl.focus();
			});
			chipsRow.appendChild(btn);
		});
		wrap.appendChild(chipsRow);
		var mockRow = document.createElement('div');
		mockRow.className = 'pt-2 border-t border-gray-200 dark:border-gray-700';
		var mockBtn = document.createElement('button');
		mockBtn.type = 'button';
		mockBtn.className = 'px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-400/40 transition-colors';
		mockBtn.textContent = '🎤 Ask me one mock question';
		mockBtn.addEventListener('click', function () {
			var q = MOCK_QUESTIONS[Math.floor(Math.random() * MOCK_QUESTIONS.length)];
			add('assistant', q, null);
			push({ role: 'assistant', text: q });
			var hint = 'Practice answering above. Type your answer and send; enable full chatbot for feedback.';
			add('assistant', hint, null);
			push({ role: 'assistant', text: hint });
		});
		mockRow.appendChild(mockBtn);
		wrap.appendChild(mockRow);
		messagesEl.appendChild(wrap);
		messagesEl.scrollTop = messagesEl.scrollHeight;
	}

	function openPanel() {
		panel.classList.add('open');
		if (overlay) overlay.classList.add('show');
		btn.setAttribute('aria-expanded', 'true');
		panel.setAttribute('aria-hidden', 'false');
		if (overlay) overlay.setAttribute('aria-hidden', 'false');
		if (closeBtn && typeof closeBtn.focus === 'function') closeBtn.focus();
		// Focus trap: keep Tab inside panel when open
		function handleKey(e) {
			if (e.key !== 'Tab' || !panel.classList.contains('open')) return;
			var focusable = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
			focusable = Array.prototype.filter.call(focusable, function (el) {
				return el.offsetParent !== null && !el.disabled && el.getAttribute('aria-hidden') !== 'true';
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
		document.addEventListener('keydown', handleKey);
		panel._assistantFocusTrap = handleKey;
		if (messagesEl.children.length === 0) {
			var onJobs = isJobsPage();
			var welcome = onJobs
				? 'You\'re on the jobs page. I can help with interview prep, mock questions, or explaining your experience. Use the suggestions below or enable the full chatbot (~80MB). Chat is saved in your browser.'
				: 'Hi! Ask anything. Default uses Wikipedia/FAQ; optional full chatbot downloads once (~80MB). This chat is saved locally in your browser (Clear chat to remove).';
			var searchQuery = onJobs ? 'STAR method interview answer' : 'what is flan t5 small model size';
			add('assistant', welcome, searchQuery);
			push({ role: 'assistant', text: welcome, searchQuery: searchQuery });
			if (onJobs) addSuggestedPromptsAndMockButton();
		}
	}
	function closePanel() {
		panel.classList.remove('open');
		if (overlay) overlay.classList.remove('show');
		btn.setAttribute('aria-expanded', 'false');
		panel.setAttribute('aria-hidden', 'true');
		if (overlay) overlay.setAttribute('aria-hidden', 'true');
		if (panel._assistantFocusTrap) {
			document.removeEventListener('keydown', panel._assistantFocusTrap);
			panel._assistantFocusTrap = null;
		}
		if (btn && typeof btn.focus === 'function') btn.focus();
	}

	btn.setAttribute('aria-expanded', 'false');
	btn.setAttribute('aria-controls', 'assistant-panel');
	panel.setAttribute('aria-hidden', 'true');
	btn.addEventListener('click', openPanel);
	if (closeBtn) closeBtn.addEventListener('click', closePanel);
	if (overlay) overlay.addEventListener('click', closePanel);
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && panel && panel.classList.contains('open')) closePanel();
	});

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
			if (isJobsPage()) addSuggestedPromptsAndMockButton();
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
						add('assistant', w || "I couldn't find a direct answer. Use Google below.", text, w ? null : 'Tap here to search on Google →');
						push({
							role: 'assistant',
							text: w || "I couldn't find a direct answer. Use Google below.",
							searchQuery: text,
						});
					});
				});
			return;
		}

		// Job-prep FAQ in light mode (no model needed)
		var qLower = text.toLowerCase();
		var faqAnswer = null;
		if (qLower.indexOf('star') !== -1 && (qLower.indexOf('method') !== -1 || qLower.indexOf('interview') !== -1)) {
			faqAnswer = 'STAR method: Situation (set the scene), Task (your responsibility), Action (what you did, steps you took), Result (outcome, what you learned). Example: "In my previous role (S), I had to improve report accuracy (T). I built validation checks and trained the team (A), which cut errors by 40% (R)." Use it for behavioral questions.';
		} else if (qLower.indexOf('common') !== -1 && (qLower.indexOf('data analyst') !== -1 || qLower.indexOf('analyst') !== -1) && (qLower.indexOf('question') !== -1 || qLower.indexOf('interview') !== -1)) {
			faqAnswer = 'Common data analyst interview questions: 1) Tell me about a project where you used data to drive a decision. 2) How do you handle missing or messy data? 3) Explain a time you had to present to non-technical stakeholders. 4) SQL: joins, aggregations, window functions. 5) How do you prioritize when multiple teams need reports? 6) Describe your experience with A/B testing or experimentation. 7) How do you ensure data quality? Prepare 1–2 concrete examples per theme.';
		} else if (qLower.indexOf('behavioral') !== -1 || qLower.indexOf('behavioural') !== -1) {
			faqAnswer = 'Behavioral questions ask for past examples. Use STAR: Situation, Task, Action, Result. Prepare 3–5 stories (e.g. conflict, leadership, failure, tight deadline) that you can adapt. Keep answers under 2 minutes; offer to go deeper if they ask.';
		}
		if (faqAnswer) {
			add('assistant', faqAnswer, text, 'Search Google for more →');
			push({ role: 'assistant', text: faqAnswer, searchQuery: text });
			return;
		}

		fetchWikipedia(text).then(function (w) {
			add('assistant', w || "I couldn't find a direct answer. Use Google below.", text, w ? null : 'Tap here to search on Google →');
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


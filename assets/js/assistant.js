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
	function escapeHtml(str) {
		if (str == null) return '';
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	var modelPipeline = null;
	var modelLoading = null;

	function setModeStatus(t) {
		if (modeStatus) modeStatus.textContent = t || '⚡ Basic Mode (0MB download, instant).';
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
		'🐍 Train on Python & Data Science',
		'🛢️ SQL Query Interview Practice',
		'🎤 Start Mock Interview on Topics',
		'📄 Match JD with my Saved Profile',
		'💼 Tailor my 1-Minute Elevator Pitch',
		'💡 Explain STAR Method with Real Example',
		'💰 Salary Negotiation Strategy for Analysts',
	];

	var PROMPT_MAPPINGS = {
		'🐍 Train on Python & Data Science': 'Help me train on Python for data analysis, pandas, and data science. Ask me one interview question or coding problem at a time.',
		'🛢️ SQL Query Interview Practice': 'Let\'s do SQL query practice for a data analyst interview. Ask me one SQL problem (JOINs, CTEs, or window functions) and evaluate my answer.',
		'🎤 Start Mock Interview on Topics': 'Let\'s do a live mock interview for a Data Analyst role. Ask me one behavioral or technical question at a time and give feedback.',
		'📄 Match JD with my Saved Profile': 'Compare my core skills (Python, SQL, Pandas, Tableau, A/B Testing) with typical data analyst job requirements and point out gaps to fix.',
		'💼 Tailor my 1-Minute Elevator Pitch': 'Help me tailor a compelling 1-minute elevator pitch for a Senior Data Analyst role.',
		'💡 Explain STAR Method with Real Example': 'Explain the STAR method with a real data analyst interview story including Situation, Task, Action, and Result metrics.',
		'💰 Salary Negotiation Strategy for Analysts': 'Give me a strategic guide to negotiating a data analyst offer and benchmarking compensation.'
	};

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

	function makeExternalAiLinks(searchQuery, fullText) {
		var wrap = document.createElement('div');
		wrap.className = 'flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700/60';

		var gLink = document.createElement('a');
		gLink.href = 'https://www.google.com/search?q=' + encodeURIComponent(searchQuery || 'data analyst interview prep');
		gLink.target = '_blank';
		gLink.rel = 'noopener noreferrer';
		gLink.className = 'px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-semibold hover:bg-gray-100 transition';
		gLink.textContent = '🌐 Google';
		wrap.appendChild(gLink);

		var gptBtn = document.createElement('button');
		gptBtn.type = 'button';
		gptBtn.className = 'px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold hover:bg-emerald-100 transition flex items-center gap-1';
		gptBtn.textContent = '💬 ChatGPT';
		gptBtn.addEventListener('click', function () {
			var prompt = fullText || searchQuery || 'Help me prepare for data analyst interview.';
			navigator.clipboard.writeText(prompt).then(function () {
				window.open('https://chat.openai.com/', '_blank', 'noopener');
			});
		});
		wrap.appendChild(gptBtn);

		var geminiBtn = document.createElement('button');
		geminiBtn.type = 'button';
		geminiBtn.className = 'px-2 py-1 rounded border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[11px] font-semibold hover:bg-purple-100 transition flex items-center gap-1';
		geminiBtn.textContent = '♊ Gemini';
		geminiBtn.addEventListener('click', function () {
			var prompt = fullText || searchQuery || 'Help me prepare for data analyst interview.';
			navigator.clipboard.writeText(prompt).then(function () {
				window.open('https://gemini.google.com/', '_blank', 'noopener');
			});
		});
		wrap.appendChild(geminiBtn);

		return wrap;
	}

	function add(role, text, searchQuery, searchLabel) {
		var outer = document.createElement('div');
		outer.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';
		var box = document.createElement('div');
		box.className = 'flex flex-col gap-1 max-w-[88%]';
		var bubble = document.createElement('div');
		bubble.className =
			role === 'user' ? 'rounded-lg px-3 py-2 bg-primary text-white text-sm' : 'rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap';
		bubble.textContent = text;
		box.appendChild(bubble);
		if (role !== 'user') {
			box.appendChild(makeExternalAiLinks(searchQuery || text, text));
		}
		outer.appendChild(box);
		messagesEl.appendChild(outer);
		messagesEl.scrollTop = messagesEl.scrollHeight;
	}

	function addSuggestedPromptsAndMockButton() {
		if (!messagesEl || !isJobsPage()) return;
		var wrap = document.createElement('div');
		wrap.className = 'assistant-suggested-prompts mt-3 space-y-2';
		wrap.setAttribute('aria-label', 'Suggested prompts');
		var label = document.createElement('p');
		label.className = 'text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2';
		label.textContent = 'Tap to Start Context:';
		wrap.appendChild(label);
		var chipsRow = document.createElement('div');
		chipsRow.className = 'flex flex-wrap gap-1.5';
		JOB_PREP_SUGGESTED_PROMPTS.forEach(function (promptLabel) {
			var btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-primary hover:text-white transition-all text-left';
			btn.textContent = promptLabel;
			btn.title = promptLabel;
			btn.addEventListener('click', function () {
				var fullPrompt = PROMPT_MAPPINGS[promptLabel] || promptLabel;
				inputEl.value = fullPrompt;
				sendBtn.click();
			});
			chipsRow.appendChild(btn);
		});
		wrap.appendChild(chipsRow);
		var mockRow = document.createElement('div');
		mockRow.className = 'pt-2 border-t border-gray-200 dark:border-gray-700';
		var mockBtn = document.createElement('button');
		mockBtn.type = 'button';
		mockBtn.className = 'px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-400/40 transition-colors w-full text-center';
		mockBtn.textContent = '🎤 Ask Me a Random Mock Interview Question';
		mockBtn.addEventListener('click', function () {
			var q = MOCK_QUESTIONS[Math.floor(Math.random() * MOCK_QUESTIONS.length)];
			add('assistant', q, null);
			push({ role: 'assistant', text: q });
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

	function fetchBackendChat(historyTurns) {
		var base = (typeof window !== 'undefined' && window.JOB_PROXY_URL) ? String(window.JOB_PROXY_URL).replace(/\/$/, '') : 'https://job-search-engine-api.onrender.com';
		return fetch(base + '/api/v1/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ messages: historyTurns })
		})
		.then(function (r) { return r && r.ok ? r.json() : null; })
		.then(function (data) { return (data && (data.reply || data.response || data.message)) ? String(data.reply || data.response || data.message).trim() : null; })
		.catch(function () { return null; });
	}

	var selectedModel = (function () {
		try { return localStorage.getItem(MODE_KEY) || 'basic'; } catch (e) { return 'basic'; }
	})();

	var modelSelectEl = document.getElementById('assistant-model-select');
	var confirmedModels = {};

	var MODEL_LABELS = {
		'basic': '⚡ Basic Mode (0MB Download - Instant FAQ & API)',
		'flan': '📦 Standard Local AI (LaMini Flan-T5 ~77MB, 512 Tokens)',
		'smoll': '🚀 Advanced Local AI (SmollLM2 135M ~90MB, 2K Tokens)',
		'qwen': '🏆 Pro Local AI (Qwen 1.5 0.5B ~250MB, 4K Tokens)',
		'llama': '🦙 Ultra Llama 3.2 1B (~700MB, 8K Tokens)'
	};

	function updateSelectUI() {
		if (modelSelectEl) {
			modelSelectEl.value = selectedModel;
		}
		var statusMap = {
			'basic': '⚡ Basic Mode (0MB download, instant FAQ & API responses).',
			'flan': '📦 Standard Mode: LaMini Flan-T5 77M (~77MB download, 512 context).',
			'smoll': '🚀 Advanced Mode: SmollLM2 135M (~90MB download, 2K context).',
			'qwen': '🏆 Pro Mode: Qwen 1.5 0.5B (~250MB download, 4K context).',
			'llama': '🦙 Ultra Llama 3.2 1B (~700MB download, 8K context).'
		};
		setModeStatus(statusMap[selectedModel] || 'Basic Mode.');
	}

	function promptModelDownload(modelId, label) {
		var confirmWrap = document.createElement('div');
		confirmWrap.className = 'my-3 p-3.5 rounded-xl border border-primary/40 bg-primary/5 dark:bg-primary/10 space-y-2.5';

		var msg = document.createElement('p');
		msg.className = 'text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-semibold';
		msg.textContent = '🤖 Download & Enable ' + label + '? This will download ONNX model weights directly to your browser.';
		confirmWrap.appendChild(msg);

		var btnsRow = document.createElement('div');
		btnsRow.className = 'flex flex-wrap items-center gap-2';

		var btnYes = document.createElement('button');
		btnYes.type = 'button';
		btnYes.className = 'px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow hover:bg-primary/90 transition';
		btnYes.textContent = '✅ Download & Enable (' + label + ')';
		btnYes.addEventListener('click', function () {
			confirmedModels[modelId] = true;
			confirmWrap.remove();
			selectedModel = modelId;
			try { localStorage.setItem(MODE_KEY, modelId); } catch (e) {}
			updateSelectUI();
			ensureModelLoaded(modelId).catch(function () {});
		});
		btnsRow.appendChild(btnYes);

		var btnNo = document.createElement('button');
		btnNo.type = 'button';
		btnNo.className = 'px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition';
		btnNo.textContent = '❌ Keep Basic Mode (0MB)';
		btnNo.addEventListener('click', function () {
			confirmWrap.remove();
			selectedModel = 'basic';
			try { localStorage.setItem(MODE_KEY, 'basic'); } catch (e) {}
			updateSelectUI();
		});
		btnsRow.appendChild(btnNo);

		confirmWrap.appendChild(btnsRow);
		messagesEl.appendChild(confirmWrap);
		messagesEl.scrollTop = messagesEl.scrollHeight;
	}

	if (modelSelectEl) {
		modelSelectEl.value = selectedModel;
		modelSelectEl.addEventListener('change', function () {
			var newModel = modelSelectEl.value;
			selectedModel = newModel;
			try { localStorage.setItem(MODE_KEY, newModel); } catch (e) {}
			updateSelectUI();

			if (newModel !== 'basic') {
				ensureModelLoaded(newModel).catch(function (err) {
					console.error('Failed to load selected model:', err);
				});
			}
		});
	}
	updateSelectUI();

	var progressBarWrap = document.getElementById('model-progress-bar-wrap');
	var progressBarLabel = document.getElementById('model-progress-bar-label');
	var progressBarPercent = document.getElementById('model-progress-bar-percent');
	var progressBarFill = document.getElementById('model-progress-bar-fill');

	function updateProgressBar(pct, labelText) {
		if (!progressBarWrap) return;
		if (pct < 0 || pct >= 100) {
			if (pct >= 100) {
				if (progressBarFill) progressBarFill.style.width = '100%';
				if (progressBarPercent) progressBarPercent.textContent = '100%';
				setTimeout(function () { progressBarWrap.classList.add('hidden'); }, 1500);
			} else {
				progressBarWrap.classList.add('hidden');
			}
			return;
		}
		progressBarWrap.classList.remove('hidden');
		if (progressBarFill) progressBarFill.style.width = pct + '%';
		if (progressBarPercent) progressBarPercent.textContent = pct + '%';
		if (progressBarLabel && labelText) progressBarLabel.textContent = labelText;
	}

	(function checkSavedDownloadedModel() {
		try {
			var savedModel = localStorage.getItem('assistant_downloaded_model');
			if (savedModel && savedModel !== 'basic') {
				confirmedModels[savedModel] = true;
				selectedModel = savedModel;
				updateSelectUI();
				setModeStatus('✅ Cached model ready (' + savedModel.toUpperCase() + '). Tap send to chat.');
			}
		} catch (e) {}
	})();

	var activeDownloadCard = null;

	function createOrUpdateDownloadCard(label, fileName, pct) {
		if (!activeDownloadCard || !document.body.contains(activeDownloadCard)) {
			activeDownloadCard = document.createElement('div');
			activeDownloadCard.className = 'my-3 p-3.5 rounded-xl border border-primary/40 bg-primary/10 space-y-2 font-sans shadow-md';
			messagesEl.appendChild(activeDownloadCard);
		}

		var percentNum = Math.min(100, Math.max(0, Math.round(pct || 0)));
		var isDone = percentNum >= 100;

		var html = '<div class="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-100">';
		html += '<span>' + (isDone ? '🎉 Model Ready!' : '📥 Downloading ' + escapeHtml(label)) + '</span>';
		html += '<span class="text-primary font-extrabold text-sm">' + percentNum + '%</span>';
		html += '</div>';

		if (fileName && !isDone) {
			html += '<p class="text-[11px] text-gray-600 dark:text-gray-400 font-mono truncate">File: ' + escapeHtml(fileName) + '</p>';
		}

		html += '<div class="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden shadow-inner mt-1.5">';
		html += '<div class="bg-primary h-full transition-all duration-200 rounded-full" style="width: ' + percentNum + '%"></div>';
		html += '</div>';

		if (isDone) {
			html += '<p class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-1">✅ Loaded into browser WebAssembly. You can now chat offline!</p>';
		}

		activeDownloadCard.innerHTML = html;
		messagesEl.scrollTop = messagesEl.scrollHeight;
	}

	async function ensureModelLoaded(modelId) {
		var targetId = modelId || selectedModel || 'flan';
		if (targetId === 'basic') return null;
		if (modelPipeline && selectedModelId === targetId) return modelPipeline;
		modelPipeline = null;
		modelLoading = null;

		modelLoading = (async function () {
			var modelRepo = 'Xenova/LaMini-Flan-T5-77M';
			var task = 'text2text-generation';
			var label = 'Standard LaMini-Flan-T5 (77MB)';

			if (targetId === 'smoll') {
				modelRepo = 'onnx-community/SmollLM2-135M-Instruct';
				task = 'text-generation';
				label = 'Advanced SmollLM2 135M (90MB)';
			} else if (targetId === 'qwen') {
				modelRepo = 'Xenova/Qwen1.5-0.5B-Chat';
				task = 'text-generation';
				label = 'Pro Qwen 0.5B (250MB)';
			} else if (targetId === 'llama') {
				modelRepo = 'onnx-community/Llama-3.2-1B-Instruct';
				task = 'text-generation';
				label = 'Ultra Llama 3.2 1B (700MB, 8K Context)';
			}

			setModeStatus('⌛ Initializing ' + label + '…');
			updateProgressBar(0, 'Initializing ' + label + '…');
			createOrUpdateDownloadCard(label, 'Starting connection to CDN…', 0);

			try {
				var mod = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
				mod.env.allowLocalModels = false;

				modelPipeline = await mod.pipeline(task, modelRepo, {
					quantized: true,
					progress_callback: function (info) {
						if (!info) return;
						var pct = 0;
						if (typeof info.progress === 'number') {
							pct = info.progress <= 1 ? info.progress * 100 : info.progress;
						} else if (info.loaded && info.total) {
							pct = (info.loaded / info.total) * 100;
						}

						var fileName = (info.file || '').split('/').pop();

						if (info.status === 'progress' || info.status === 'downloading') {
							setModeStatus('📥 Downloading ' + fileName + ': ' + Math.round(pct) + '%');
							updateProgressBar(pct, 'Downloading ' + fileName + '…');
							createOrUpdateDownloadCard(label, fileName, pct);
						} else if (info.status === 'initiate') {
							setModeStatus('📥 Starting download: ' + fileName + '…');
							updateProgressBar(0, 'Starting download: ' + fileName + '…');
							createOrUpdateDownloadCard(label, fileName, 0);
						} else if (info.status === 'done') {
							setModeStatus('⚡ Processing model weights into WebAssembly…');
							updateProgressBar(99, 'Loading weights into WebAssembly…');
							createOrUpdateDownloadCard(label, 'Processing WebAssembly…', 99);
						}
					}
				});

				selectedModelId = targetId;
				selectedModel = targetId;
				try { localStorage.setItem(MODE_KEY, targetId); } catch (e) {}
				updateSelectUI();

				updateProgressBar(100, 'Model ready!');
				createOrUpdateDownloadCard(label, 'Complete', 100);
				setModeStatus('✅ Bot Ready (' + targetId.toUpperCase() + ').');

				try {
					localStorage.setItem('assistant_downloaded_model', targetId);
				} catch (e) {}

				var greetMsg = '🎉 ' + label + ' downloaded & ready in WebAssembly!\n\nHi there! I am your offline AI interview coach. Ask me any question or paste a job description to begin!';
				add('assistant', greetMsg, null);
				push({ role: 'assistant', text: greetMsg });

				return modelPipeline;
			} catch (err) {
				console.error('Model download error:', err);
				updateProgressBar(-1, '');
				setModeStatus('❌ Model download failed. Using fallback FAQ/API.');
				throw err;
			}
		})();
		return modelLoading;
	}

	var clearCacheBtn = document.getElementById('assistant-clear-cache');
	if (clearCacheBtn) {
		clearCacheBtn.addEventListener('click', function () {
			modelPipeline = null;
			modelLoading = null;
			if (typeof window !== 'undefined' && window.caches) {
				window.caches.keys().then(function (names) {
					names.forEach(function (name) {
						if (name.indexOf('transformers') !== -1 || name.indexOf('onnx') !== -1) {
							window.caches.delete(name);
						}
					});
				}).catch(function () {});
			}
			setModeStatus('🗑️ Model Cache Purged! Disk space freed.');
			add('assistant', '🗑️ Model storage cache purged from browser. Any future LLM selection will download fresh on-demand.', null);
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

		var historyTurns = history.slice(-10).map(function (it) {
			return { role: it.role === 'user' ? 'user' : 'assistant', content: it.text || '' };
		});

		if (selectedModel !== 'basic') {
			add('assistant', 'Thinking… (' + selectedModel.toUpperCase() + ')', text);
			ensureModelLoaded(selectedModel)
				.then(async function (pipe) {
					var systemPrompt = 'You are an expert interview coach and data science career mentor. Answer concisely, professionally, and provide concrete examples or actionable steps.';
					var convo = 'System: ' + systemPrompt + '\n\n' + history.slice(-8).map(function (it) {
						var sender = it.role === 'user' ? 'User' : 'Coach';
						return sender + ': ' + (it.text || '');
					}).join('\n') + '\nCoach:';

					var out = await pipe(convo, { max_new_tokens: 220, temperature: 0.7, do_sample: true });
					var generated = out && out[0] && out[0].generated_text ? String(out[0].generated_text).trim() : '';
					// Remove prompt prefix if echo back occurs
					if (generated.indexOf('Coach:') !== -1) {
						generated = generated.split('Coach:').pop().trim();
					}
					add('assistant', generated || 'No response from model.', text);
					push({ role: 'assistant', text: generated || 'No response from model.', searchQuery: text });
				})
				.catch(function () {
					add('assistant', 'Model failed. Trying API backend...', text);
					fetchBackendChat(historyTurns).then(function (apiReply) {
						if (apiReply) {
							add('assistant', apiReply, text);
							push({ role: 'assistant', text: apiReply, searchQuery: text });
						} else {
							fetchWikipedia(text).then(function (w) {
								add('assistant', w || "I couldn't find a direct answer. Use Google below.", text, w ? null : 'Tap here to search on Google →');
								push({ role: 'assistant', text: w || "I couldn't find a direct answer. Use Google below.", searchQuery: text });
							});
						}
					});
				});
			return;
		}

		// Expanded Job-prep & Career FAQ Engine in Light Mode
		var qLower = text.toLowerCase();
		var faqAnswer = null;

		if (qLower.indexOf('star') !== -1 && (qLower.indexOf('method') !== -1 || qLower.indexOf('interview') !== -1 || qLower.indexOf('example') !== -1)) {
			faqAnswer = 'STAR Method Guide:\n• Situation: Describe the context & challenge.\n• Task: State your specific responsibility.\n• Action: Explain your technical steps & strategy (SQL, Python, dashboard, stakeholder alignment).\n• Result: Quantify business impact (e.g. "Cut report latency by 35% & saved 10h/week").\n\nTip: Keep your answer under 2 minutes!';
		} else if (qLower.indexOf('common') !== -1 && (qLower.indexOf('question') !== -1 || qLower.indexOf('interview') !== -1)) {
			faqAnswer = 'Top Data Analyst Interview Questions:\n1. Tell me about a data project where your insights directly influenced a business decision.\n2. How do you clean messy datasets or handle missing values?\n3. Explain the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN in SQL.\n4. How do you communicate technical findings to non-technical executive stakeholders?\n5. Walk me through how you set up an A/B test or experiment.\n6. Describe a time when your dataset had errors—how did you detect and fix them?';
		} else if (qLower.indexOf('pitch') !== -1 || qLower.indexOf('tell me about yourself') !== -1 || qLower.indexOf('1-minute') !== -1 || qLower.indexOf('intro') !== -1) {
			faqAnswer = '1-Minute Elevator Pitch Structure:\n1. Present (30s): Current role, key domain expertise (e.g., Data Analytics, SQL, Python, Tableau).\n2. Past (20s): Notable achievement or project impact (e.g., automated ETL pipelines, built executive dashboards).\n3. Future (10s): Why you are excited about THIS specific role and company.\n\nKeep it energetic, clear, and focused on business value!';
		} else if (qLower.indexOf('sql') !== -1 && (qLower.indexOf('join') !== -1 || qLower.indexOf('window') !== -1 || qLower.indexOf('cte') !== -1)) {
			faqAnswer = 'Key SQL Interview Concepts:\n• INNER JOIN: Only matching rows in both tables.\n• LEFT JOIN: All rows from left table, matching rows from right.\n• CTE (WITH clause): Temporary named result set for clean, readable subqueries.\n• Window Functions: ROW_NUMBER(), RANK(), DENSE_RANK(), LAG(), LEAD() over PARTITION BY. Useful for top-N per category analysis.';
		} else if (qLower.indexOf('salary') !== -1 || qLower.indexOf('negotiat') !== -1) {
			faqAnswer = 'Salary Negotiation Strategy:\n1. Benchmark using Levels.fyi, Glassdoor, and AmbitionBox for your location & YOE.\n2. Never give the first exact number if possible—give a target range (e.g. "Based on market research for Senior Analysts, I am targeting 18–22 LPA").\n3. Highlight competing offers or your unique technical value (SQL + Python + MLOps).';
		} else if (qLower.indexOf('behavioral') !== -1 || qLower.indexOf('behavioural') !== -1) {
			faqAnswer = 'Behavioral Interview Tips:\n1. Prepare 4–5 core stories covering: Conflict resolution, Failure & learning, Tight deadlines, Stakeholder pushback, and Leadership.\n2. Always structure using STAR (Situation, Task, Action, Result).\n3. Offer metrics whenever possible (time saved, revenue boost, accuracy increased).';
		}

		if (faqAnswer) {
			add('assistant', faqAnswer, text, 'Search Google for more →');
			push({ role: 'assistant', text: faqAnswer, searchQuery: text });
			return;
		}

		// Try API backend first before fallback
		fetchBackendChat(historyTurns).then(function (apiReply) {
			if (apiReply) {
				add('assistant', apiReply, text);
				push({ role: 'assistant', text: apiReply, searchQuery: text });
			} else {
				fetchWikipedia(text).then(function (w) {
					add('assistant', w || "I couldn't find a direct answer. Use Google below.", text, w ? null : 'Tap here to search on Google →');
					push({
						role: 'assistant',
						text: w || "I couldn't find a direct answer. Use Google below.",
						searchQuery: text,
					});
				});
			}
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


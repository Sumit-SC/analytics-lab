/**
 * Global dictionary flyout: free Dictionary API (dictionaryapi.dev), fallback Wiktionary API; "Search Google" link.
 * Available on all pages. Small flyout from the left (near bottom).
 */
(function () {
	'use strict';

	var API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
	var WIKTIONARY_API = 'https://en.wiktionary.org/w/api.php?action=query&titles=WORD&prop=extracts&exintro&explaintext&format=json&origin=*';

	var toggle = document.getElementById('global-dict-toggle');
	var flyout = document.getElementById('global-dict-flyout');
	var input = document.getElementById('global-dict-input');
	var searchBtn = document.getElementById('global-dict-search');
	var closeBtn = document.getElementById('global-dict-close');
	var bodyEl = document.getElementById('global-dict-body');
	var googleLink = document.getElementById('global-dict-google');

	function openFlyout() {
		if (flyout) flyout.classList.add('global-dict-open');
		if (input) input.focus();
	}
	function closeFlyout() {
		if (flyout) flyout.classList.remove('global-dict-open');
	}

	function escapeHtml(s) {
		if (!s) return '';
		var div = document.createElement('div');
		div.textContent = s;
		return div.innerHTML;
	}

	function renderResult(data, word) {
		if (!bodyEl) return;
		if (!data || !Array.isArray(data) || data.length === 0) {
			bodyEl.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No definition found. Try another word or use "Search Google" below.</p>';
			if (googleLink) {
				googleLink.href = 'https://www.google.com/search?q=define+' + encodeURIComponent(word || '');
				googleLink.textContent = 'Search Google for “‘ + escapeHtml(word || '') + '"';
				googleLink.style.display = 'block';
			}
			return;
		}
		var entry = data[0];
		var wordStr = entry.word || word || '';
		var html = '<div class="dict-word">' + escapeHtml(wordStr) + '</div>';
		if (entry.phonetic) {
			html += '<div class="dict-pos">' + escapeHtml(entry.phonetic) + '</div>';
		}
		html += '<div class="dict-meanings">';
		(entry.meanings || []).forEach(function (m) {
			var pos = m.partOfSpeech || '';
			html += '<div class="dict-pos">' + escapeHtml(pos) + '</div>';
			(m.definitions || []).slice(0, 5).forEach(function (d) {
				html += '<div class="dict-def">';
				html += '<span>' + escapeHtml(d.definition || '') + '</span>';
				if (d.example) {
					html += '<div class="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">“' + escapeHtml(d.example) + '"</div>';
				}
				html += '</div>';
			});
		});
		html += '</div>';
		bodyEl.innerHTML = html;
		showGoogleLink(wordStr, 'Search Google for more results');
	}

	function renderWiktionaryExtract(extract, word) {
		if (!bodyEl) return;
		var text = (extract || '').trim();
		if (!text) {
			bodyEl.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No definition found. Use "Search Google" below.</p>';
			showGoogleLink(word);
			return;
		}
		var html = '<div class="dict-word">' + escapeHtml(word) + '</div>';
		html += '<div class="dict-meanings"><div class="dict-def">' + escapeHtml(text.slice(0, 1500)) + (text.length > 1500 ? '…' : '') + '</div></div>';
		bodyEl.innerHTML = html;
		showGoogleLink(word, 'Search Google for more results');
	}

	function showGoogleLink(word, label) {
		if (!googleLink) return;
		googleLink.href = 'https://www.google.com/search?q=define+' + encodeURIComponent(word || '');
		googleLink.textContent = typeof label === 'string' ? label : ('Search Google for "' + escapeHtml(word || '') + '"');
		googleLink.style.display = 'block';
	}

	function setLoading(loading) {
		if (!bodyEl) return;
		if (loading) {
			bodyEl.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Looking up…</p>';
			if (googleLink) googleLink.style.display = 'none';
		}
	}

	function tryWiktionary(word, onDone) {
		var url = WIKTIONARY_API.replace('WORD', encodeURIComponent(word));
		fetch(url)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (json) {
				if (!json || !json.query || !json.query.pages) return onDone(null);
				var pages = json.query.pages;
				var pageId = Object.keys(pages)[0];
				var extract = pages[pageId] && pages[pageId].extract;
				onDone(extract || null);
			})
			.catch(function () { onDone(null); });
	}

	function search() {
		var word = (input && input.value || '').trim();
		if (!word) return;
		openFlyout();
		setLoading(true);
		fetch(API_BASE + encodeURIComponent(word))
			.then(function (r) {
				if (r.ok) return r.json();
				return r.text().then(function (txt) {
					try { return txt ? JSON.parse(txt) : null; } catch (e) { return null; }
				});
			})
			.then(function (data) {
				if (data && Array.isArray(data) && data.length > 0) {
					renderResult(data, word);
					return;
				}
				tryWiktionary(word, function (extract) {
					if (extract) renderWiktionaryExtract(extract, word);
					else {
						if (bodyEl) bodyEl.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No definition found. Use "Search Google" below.</p>';
						showGoogleLink(word);
					}
				});
			})
			.catch(function () {
				tryWiktionary(word, function (extract) {
					if (extract) renderWiktionaryExtract(extract, word);
					else {
						if (bodyEl) bodyEl.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Could not fetch definition. Use "Search Google" below.</p>';
						showGoogleLink(word);
					}
				});
			});
	}

	if (toggle) {
		toggle.addEventListener('click', function () {
			if (flyout && flyout.classList.contains('global-dict-open')) {
				closeFlyout();
			} else {
				openFlyout();
				if (bodyEl && !bodyEl.textContent.trim()) {
					bodyEl.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Type a word and press Search or Enter.</p>';
				}
			}
		});
	}
	if (closeBtn) closeBtn.addEventListener('click', closeFlyout);
	if (searchBtn && input) {
		searchBtn.addEventListener('click', search);
		input.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') search();
		});
	}
	if (googleLink) googleLink.style.display = 'none';
})();

/**
 * IMDb/OMDb flyout on Playground: search-as-you-type, results (thumb, title, year), click for details.
 * Uses backend proxy /api/omdb (s=search, i=imdbID) so the key stays server-side.
 */
(function () {
	var toggle = document.getElementById('global-omdb-toggle');
	var flyout = document.getElementById('global-omdb-flyout');
	var input = document.getElementById('global-omdb-input');
	var closeBtn = document.getElementById('global-omdb-close');
	var bodyEl = document.getElementById('global-omdb-body');

	if (!toggle || !flyout || !input || !bodyEl) return;

	function proxyUrl() {
		var base = (typeof window !== 'undefined' && window.OMDB_PROXY_URL) ? String(window.OMDB_PROXY_URL).replace(/\/$/, '') : '';
		return (base || '') + '/api/omdb';
	}

	function openFlyout() {
		flyout.classList.add('global-omdb-open');
		input.focus();
	}
	function closeFlyout() {
		flyout.classList.remove('global-omdb-open');
	}

	toggle.addEventListener('click', function () {
		if (flyout.classList.contains('global-omdb-open')) closeFlyout();
		else openFlyout();
	});
	if (closeBtn) closeBtn.addEventListener('click', closeFlyout);

	var debounceTimer = null;
	var lastQuery = '';

	function renderHint(text) {
		bodyEl.innerHTML = '<p class="global-omdb-hint text-sm text-gray-500 dark:text-gray-400 p-3">' + (text || 'Type to search. Results show thumbnail, title, year.') + '</p>';
	}

	function renderSearchResults(results) {
		if (!results || results.length === 0) {
			renderHint('No results.');
			return;
		}
		var html = '';
		results.forEach(function (item) {
			var poster = item.Poster && item.Poster.indexOf('http') === 0 ? item.Poster : '';
			var img = poster ? '<img src="' + poster.replace(/"/g, '&quot;') + '" alt="" loading="lazy">' : '<div style="width:48px;height:72px;background:#e2e8f0;border-radius:4px;"></div>';
			html += '<button type="button" class="global-omdb-result" data-imdb-id="' + (item.imdbID || '').replace(/"/g, '&quot;') + '">';
			html += img;
			html += '<div><span class="global-omdb-result-title">' + (item.Title || '').replace(/</g, '&lt;') + '</span>';
			html += '<div class="global-omdb-result-meta">' + (item.Year || '').replace(/</g, '&lt;') + (item.Type ? ' · ' + item.Type : '') + '</div></div>';
			html += '</button>';
		});
		bodyEl.innerHTML = html;
		bodyEl.querySelectorAll('.global-omdb-result').forEach(function (btn) {
			btn.addEventListener('click', function () {
				var id = btn.getAttribute('data-imdb-id');
				if (id) fetchDetail(id);
			});
		});
	}

	function fetchDetail(imdbID) {
		bodyEl.innerHTML = '<p class="global-omdb-hint text-sm text-gray-500 dark:text-gray-400 p-3">Loading…</p>';
		fetch(proxyUrl() + '?i=' + encodeURIComponent(imdbID))
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || data.error) {
					renderHint('Could not load details.');
					return;
				}
				var poster = data.Poster && data.Poster.indexOf('http') === 0 ? '<img class="global-omdb-detail-poster" src="' + data.Poster.replace(/"/g, '&quot;') + '" alt="">' : '';
				var html = '<div class="global-omdb-detail">';
				html += poster;
				html += '<h3>' + (data.Title || '').replace(/</g, '&lt;') + ' (' + (data.Year || '').replace(/</g, '&lt;') + ')</h3>';
				if (data.Rated && data.Rated !== 'N/A') html += '<p><strong>Rated:</strong> ' + data.Rated.replace(/</g, '&lt;') + '</p>';
				if (data.Released && data.Released !== 'N/A') html += '<p><strong>Released:</strong> ' + data.Released.replace(/</g, '&lt;') + '</p>';
				if (data.Runtime && data.Runtime !== 'N/A') html += '<p><strong>Runtime:</strong> ' + data.Runtime.replace(/</g, '&lt;') + '</p>';
				if (data.Genre && data.Genre !== 'N/A') html += '<p><strong>Genre:</strong> ' + data.Genre.replace(/</g, '&lt;') + '</p>';
				if (data.Director && data.Director !== 'N/A') html += '<p><strong>Director:</strong> ' + data.Director.replace(/</g, '&lt;') + '</p>';
				if (data.Actors && data.Actors !== 'N/A') html += '<p><strong>Actors:</strong> ' + data.Actors.replace(/</g, '&lt;') + '</p>';
				if (data.imdbRating && data.imdbRating !== 'N/A') html += '<p><strong>IMDb:</strong> ' + data.imdbRating.replace(/</g, '&lt;') + '</p>';
				if (data.Plot && data.Plot !== 'N/A') html += '<p>' + data.Plot.replace(/</g, '&lt;') + '</p>';
				html += '<p><a href="https://www.imdb.com/title/' + (data.imdbID || '').replace(/"/g, '&quot;') + '/" target="_blank" rel="noopener" class="text-primary hover:underline">View on IMDb ↗</a></p>';
				html += '</div>';
				bodyEl.innerHTML = html;
			})
			.catch(function () { renderHint('Network error.'); });
	}

	function doSearch(query) {
		query = (query || '').trim();
		if (!query) {
			renderHint('Type to search. Results show thumbnail, title, year.');
			return;
		}
		bodyEl.innerHTML = '<p class="global-omdb-hint text-sm text-gray-500 dark:text-gray-400 p-3">Searching…</p>';
		fetch(proxyUrl() + '?s=' + encodeURIComponent(query))
			.then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }).catch(function () { return { ok: false, data: null }; }); })
			.then(function (out) {
				var data = out && out.data;
				if (!out.ok || (data && data.error)) renderHint((data && data.error) || 'OMDb proxy not configured. Deploy api/omdb.js and set OMDB_API_KEY.');
				else renderSearchResults((data && data.results) ? data.results : []);
			})
			.catch(function () { renderHint('Network error.'); });
	}

	input.addEventListener('input', function () {
		var q = input.value.trim();
		lastQuery = q;
		clearTimeout(debounceTimer);
		if (!q) {
			renderHint('Type to search. Results show thumbnail, title, year.');
			return;
		}
		debounceTimer = setTimeout(function () {
			if (input.value.trim() === lastQuery) doSearch(lastQuery);
		}, 320);
	});

	input.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') closeFlyout();
	});
})();

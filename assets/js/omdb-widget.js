/**
 * IMDb/OMDb flyout on Playground: search-as-you-type, results (thumb, title, year), click for details.
 * Uses backend proxy /api/omdb (s=search, i=imdbID) and /api/cinematerial so the key stays server-side.
 * Detail shows full fields + CineMaterial & ThePosterDB links and optional poster fetch.
 */
(function () {
	var toggle = document.getElementById('global-omdb-toggle');
	var flyout = document.getElementById('global-omdb-flyout');
	var input = document.getElementById('global-omdb-input');
	var closeBtn = document.getElementById('global-omdb-close');
	var bodyEl = document.getElementById('global-omdb-body');
	var usageEl = document.getElementById('global-omdb-usage');

	if (!toggle || !flyout || !input || !bodyEl) return;

	function proxyBase() {
		return (typeof window !== 'undefined' && window.OMDB_PROXY_URL) ? String(window.OMDB_PROXY_URL).replace(/\/$/, '') : '';
	}
	function proxyUrl() {
		return proxyBase() + '/api/omdb';
	}
	function cinematerialUrl() {
		return proxyBase() + '/api/cinematerial';
	}
	function slugify(s) {
		if (!s) return 'title';
		return String(s).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'title';
	}
	function cinematerialPageUrl(imdbId, title, type) {
		var id = (imdbId || '').replace(/^tt/i, '');
		if (!/^\d+$/.test(id)) return 'https://www.cinematerial.com/';
		var path = type === 'series' ? 'tv' : 'movies';
		return 'https://www.cinematerial.com/' + path + '/' + slugify(title) + '-i' + id;
	}
	function theposterdbSearchUrl(title, type) {
		var section = type === 'series' ? 'shows' : 'movies';
		var term = encodeURIComponent((title || '').trim() || '');
		return term ? 'https://theposterdb.com/search?term=' + term + '&section=' + section : 'https://theposterdb.com/search';
	}
	function esc(s) { return (s || '').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

	var currentDetail = { imdbID: '', title: '', type: 'movie' };

	function updateUsageDisplay(usage) {
		if (!usageEl || !usage) return;
		var daily = usage.dailyCount != null ? usage.dailyCount : '';
		var limit = usage.dailyLimit != null ? usage.dailyLimit : 1000;
		usageEl.textContent = (daily !== '' ? daily : '—') + '/' + limit + ' today';
	}
	function fetchUsageOnly() {
		if (!proxyBase()) return;
		fetch(proxyUrl() + '?usage=1')
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (data && data.dailyCount != null) updateUsageDisplay(data);
			})
			.catch(function () {});
	}
	function openFlyout() {
		flyout.classList.add('global-omdb-open');
		input.focus();
		fetchUsageOnly();
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

	function fetchCineMaterialPosters() {
		var wrap = bodyEl.querySelector('.global-omdb-poster-sources');
		var grid = wrap && wrap.querySelector('.global-omdb-cinematerial-grid');
		if (!grid) return;
		if (!currentDetail.imdbID || !proxyBase()) {
			grid.innerHTML = '<span class="text-xs text-gray-500 dark:text-gray-400">Set OMDB_PROXY_URL and open a title.</span>';
			return;
		}
		grid.innerHTML = '<span class="text-xs text-gray-500 dark:text-gray-400">Loading…</span>';
		var q = 'i=' + encodeURIComponent(currentDetail.imdbID) + '&title=' + encodeURIComponent(currentDetail.title) + '&type=' + encodeURIComponent(currentDetail.type);
		fetch(cinematerialUrl() + '?' + q)
			.then(function (r) { return r.json(); })
			.then(function (data) {
				var list = (data && data.posters) ? data.posters : [];
				if (data && data.error && list.length === 0) {
					grid.innerHTML = '<span class="text-xs text-gray-500 dark:text-gray-400">' + esc(data.error) + ' Use link above.</span>';
					return;
				}
				if (list.length === 0) {
					grid.innerHTML = '<span class="text-xs text-gray-500 dark:text-gray-400">No images found. Open CineMaterial above.</span>';
					return;
				}
				var h = '';
				list.forEach(function (p) {
					var u = (p && p.url) ? p.url : p;
					h += '<img src="' + esc(u) + '" alt="" loading="lazy" class="global-omdb-cinematerial-img">';
				});
				grid.innerHTML = h;
			})
			.catch(function () { grid.innerHTML = '<span class="text-xs text-gray-500 dark:text-gray-400">Network error.</span>'; });
	}

	function fetchDetail(imdbID) {
		bodyEl.innerHTML = '<p class="global-omdb-hint text-sm text-gray-500 dark:text-gray-400 p-3">Loading…</p>';
		fetch(proxyUrl() + '?i=' + encodeURIComponent(imdbID))
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (data && data.usage) updateUsageDisplay(data.usage);
				if (!data || data.error) {
					renderHint('Could not load details.');
					return;
				}
				var type = (data.Type || 'movie').toLowerCase();
				currentDetail = { imdbID: data.imdbID || imdbID, title: data.Title || '', type: type === 'series' ? 'series' : 'movie' };

				var poster = data.Poster && data.Poster.indexOf('http') === 0 ? '<img class="global-omdb-detail-poster" src="' + data.Poster.replace(/"/g, '&quot;') + '" alt="">' : '';
				var html = '<div class="global-omdb-detail">';
				html += poster;
				html += '<h3>' + esc(data.Title) + ' (' + esc(data.Year) + ')</h3>';
				if (data.Rated && data.Rated !== 'N/A') html += '<p><strong>Rated:</strong> ' + esc(data.Rated) + '</p>';
				if (data.Released && data.Released !== 'N/A') html += '<p><strong>Released:</strong> ' + esc(data.Released) + '</p>';
				if (data.Runtime && data.Runtime !== 'N/A') html += '<p><strong>Runtime:</strong> ' + esc(data.Runtime) + '</p>';
				if (data.Genre && data.Genre !== 'N/A') html += '<p><strong>Genre:</strong> ' + esc(data.Genre) + '</p>';
				if (data.Director && data.Director !== 'N/A') html += '<p><strong>Director:</strong> ' + esc(data.Director) + '</p>';
				if (data.Writer && data.Writer !== 'N/A') html += '<p><strong>Writer:</strong> ' + esc(data.Writer) + '</p>';
				if (data.Actors && data.Actors !== 'N/A') html += '<p><strong>Actors:</strong> ' + esc(data.Actors) + '</p>';
				if (data.Language && data.Language !== 'N/A') html += '<p><strong>Language:</strong> ' + esc(data.Language) + '</p>';
				if (data.Country && data.Country !== 'N/A') html += '<p><strong>Country:</strong> ' + esc(data.Country) + '</p>';
				if (data.Awards && data.Awards !== 'N/A') html += '<p><strong>Awards:</strong> ' + esc(data.Awards) + '</p>';
				if (data.BoxOffice && data.BoxOffice !== 'N/A') html += '<p><strong>Box office:</strong> ' + esc(data.BoxOffice) + '</p>';
				if (data.imdbRating && data.imdbRating !== 'N/A') html += '<p><strong>IMDb:</strong> ' + esc(data.imdbRating) + '</p>';
				if (data.Plot && data.Plot !== 'N/A') html += '<p>' + esc(data.Plot) + '</p>';
				html += '<p><a href="https://www.imdb.com/title/' + esc(data.imdbID) + '/" target="_blank" rel="noopener" class="text-primary hover:underline">View on IMDb ↗</a></p>';

				html += '<div class="global-omdb-poster-sources">';
				html += '<p class="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-3 mb-1">Poster sources</p>';
				html += '<p class="text-xs text-gray-500 dark:text-gray-400 mb-1"><a href="' + esc(cinematerialPageUrl(currentDetail.imdbID, currentDetail.title, currentDetail.type)) + '" target="_blank" rel="noopener" class="text-primary hover:underline">CineMaterial</a>';
				html += ' <button type="button" id="global-omdb-fetch-cinematerial" class="px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700">Fetch posters</button>';
				html += ' · <a href="' + esc(theposterdbSearchUrl(currentDetail.title, currentDetail.type)) + '" target="_blank" rel="noopener" class="text-primary hover:underline">ThePosterDB</a></p>';
				html += '<div class="global-omdb-cinematerial-grid"></div>';
				html += '</div>';
				html += '</div>';
				bodyEl.innerHTML = html;

				bodyEl.querySelector('#global-omdb-fetch-cinematerial').addEventListener('click', fetchCineMaterialPosters);
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
			.then(function (r) { return r.json().then(function (data) { return { ok: r.ok, status: r.status, data: data }; }).catch(function () { return { ok: false, status: r.status, data: null }; }); })
			.then(function (out) {
				var data = out && out.data;
				if (data && data.usage) updateUsageDisplay(data.usage);
				if (!out.ok || (data && data.error)) renderHint((data && data.error) || (out.status === 429 ? 'Daily API limit reached. Resets midnight UTC.' : 'OMDb proxy not configured. Deploy api/omdb.js and set OMDB_API_KEY.'));
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

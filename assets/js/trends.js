(function () {
\t// Hacker News top stories (lightweight snapshot)
\tvar listEl = document.getElementById('trends-hn-list');
\tvar statusEl = document.getElementById('trends-hn-status');
\tif (!listEl || !statusEl) return;

\tfunction setStatus(text) {
\t\tstatusEl.textContent = text;
\t}

\tsetStatus('Loading…');

\tfunction fetchTopStories() {
\t\tfetch('https://hacker-news.firebaseio.com/v0/topstories.json')
\t\t\t.then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HN error')); })
\t\t\t.then(function (ids) {
\t\t\t\tif (!Array.isArray(ids) || ids.length === 0) {
\t\t\t\t\tsetStatus('No stories available right now.');
\t\t\t\t\treturn;
\t\t\t\t}
\t\t\t\tvar top = ids.slice(0, 10);
\t\t\t\treturn Promise.all(top.map(function (id) {
\t\t\t\t\treturn fetch('https://hacker-news.firebaseio.com/v0/item/' + id + '.json')
\t\t\t\t\t\t.then(function (r) { return r.ok ? r.json() : null; })
\t\t\t\t\t\t.catch(function () { return null; });
\t\t\t\t})).then(function (items) {
\t\t\t\t\tvar clean = items.filter(Boolean);
\t\t\t\t\tif (!clean.length) {
\t\t\t\t\t\tsetStatus('Could not load story details.');
\t\t\t\t\t\treturn;
\t\t\t\t\t}
\t\t\t\t\tsetStatus('Showing top ' + clean.length + ' stories.');
\t\t\t\t\tvar html = '';
\t\t\t\t\tclean.forEach(function (item) {
\t\t\t\t\t\tvar title = item.title || 'Untitled';
\t\t\t\t\t\tvar url = item.url || ('https://news.ycombinator.com/item?id=' + item.id);
\t\t\t\t\t\tvar score = item.score || 0;
\t\t\t\t\t\tvar comments = typeof item.descendants === 'number' ? item.descendants : null;
\t\t\t\t\t\thtml += '<li class=\"border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0\">';
\t\t\t\t\t\thtml += '<a href=\"' + url + '\" target=\"_blank\" rel=\"noopener\" class=\"font-semibold text-primary hover:underline\">' + title.replace(/</g, '&lt;') + '</a>';
\t\t\t\t\t\thtml += '<div class=\"mt-0.5 text-[11px] text-gray-500 dark:text-gray-400\">';
\t\t\t\t\t\thtml += score + ' points';
\t\t\t\t\t\tif (comments != null) html += ' &middot; ' + comments + ' comments';
\t\t\t\t\t\thtml += '</div>';
\t\t\t\t\t\thtml += '</li>';
\t\t\t\t\t});
\t\t\t\t\tlistEl.innerHTML = html;
\t\t\t\t});
\t\t\t})
\t\t\t.catch(function () {
\t\t\t\tsetStatus('Could not reach Hacker News. Open it directly instead.');
\t\t\t});
\t}

\tfetchTopStories();
})();

(function () {
\t// Wikipedia top pageviews today
\tvar listEl = document.getElementById('trends-wiki-list');
\tvar statusEl = document.getElementById('trends-wiki-status');
\tif (!listEl || !statusEl) return;

\tfunction setStatus(text) {
\t\tstatusEl.textContent = text;
\t}

\tsetStatus('Loading…');

\tfunction fetchTopPages() {
\t\t// Today in UTC; API uses yyyy/mm/dd
\t\tvar now = new Date();
\t\tvar y = now.getUTCFullYear();
\t\tvar m = String(now.getUTCMonth() + 1).padStart(2, '0');
\t\tvar d = String(now.getUTCDate()).padStart(2, '0');
\t\tvar url = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/' + y + '/' + m + '/' + d;

\t\tfetch(url)
\t\t\t.then(function (r) { return r.ok ? r.json() : null; })
\t\t\t.then(function (data) {
\t\t\t\tif (!data || !data.items || !data.items[0] || !Array.isArray(data.items[0].articles)) {
\t\t\t\t\tsetStatus('No pageview data available yet. Wikipedia may still be generating today&apos;s stats.');
\t\t\t\t\treturn;
\t\t\t\t}
\t\t\t\tvar articles = data.items[0].articles
\t\t\t\t\t.filter(function (a) { return a.article && a.article.indexOf('Main_Page') === -1 && a.article.indexOf('Special:') !== 0; })
\t\t\t\t\t.slice(0, 10);
\t\t\t\tif (!articles.length) {
\t\t\t\t\tsetStatus('No trending pages in this snapshot.');
\t\t\t\t\treturn;
\t\t\t\t}
\t\t\t\tsetStatus('Top ' + articles.length + ' English pages today.');
\t\t\t\tvar html = '';
\t\t\t\tarticles.forEach(function (a) {
\t\t\t\t\tvar title = decodeURIComponent(a.article.replace(/_/g, ' '));
\t\t\t\t\tvar views = a.views || 0;
\t\t\t\t\tvar href = 'https://en.wikipedia.org/wiki/' + encodeURIComponent(a.article);
\t\t\t\t\thtml += '<li class=\"border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0\">';
\t\t\t\t\thtml += '<a href=\"' + href + '\" target=\"_blank\" rel=\"noopener\" class=\"font-semibold text-primary hover:underline\">' + title.replace(/</g, '&lt;') + '</a>';
\t\t\t\t\thtml += '<div class=\"mt-0.5 text-[11px] text-gray-500 dark:text-gray-400\">' + views.toLocaleString() + ' views</div>';
\t\t\t\t\thtml += '</li>';
\t\t\t\t});
\t\t\t\tlistEl.innerHTML = html;
\t\t\t})
\t\t\t.catch(function () {
\t\t\t\tsetStatus('Could not reach Wikipedia metrics API. Try the main page instead.');
\t\t\t});
\t}

\tfetchTopPages();
})();

(function () {
\t// Visual inspiration grid (Picsum)
\tvar grid = document.getElementById('trends-visual-grid');
\tvar refreshBtn = document.getElementById('trends-visual-refresh');
\tif (!grid) return;

\tfunction applyImages() {
\t\tvar cards = grid.querySelectorAll('.trends-visual-card');
\t\tcards.forEach(function (card, idx) {
\t\t\tvar seed = card.getAttribute('data-seed') || ('trends-' + idx);
\t\t\t// Slight randomness per refresh to keep it fun
\t\t\tvar fullSeed = seed + '-' + Math.floor(Math.random() * 10000);
\t\t\tvar url = 'https://picsum.photos/seed/' + encodeURIComponent(fullSeed) + '/600/400';
\t\t\tcard.style.backgroundImage = 'url(' + url + ')';
\t\t\tcard.style.backgroundSize = 'cover';
\t\t\tcard.style.backgroundPosition = 'center';
\t\t\tvar link = card.querySelector('a');
\t\t\tif (link) link.href = url;
\t\t});
\t}

\tif (refreshBtn) {
\t\trefreshBtn.addEventListener('click', applyImages);
\t}

\tapplyImages();
})();


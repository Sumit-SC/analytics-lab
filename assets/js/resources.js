/**
 * Resources page: topic selector, tabs (YouTube / Read / Courses / Best), fetch resources.json.
 */
(function () {
	var params = new URLSearchParams(window.location.search);
	var initialTopic = (params.get('topic') || 'python').toLowerCase().replace(/[^a-z0-9-]/g, '');
	var root = document.getElementById('resource-root');
	var notFound = document.getElementById('resource-not-found');

	function setDocumentTitle(topic) {
		if (topic && topic.title) {
			document.title = topic.title + ' | Resources | Standalone Playground';
		}
	}

	function updateUrl(topicKey) {
		try {
			var search = new URLSearchParams(window.location.search);
			search.set('topic', topicKey);
			var newUrl = window.location.pathname + '?' + search.toString();
			history.replaceState(null, '', newUrl);
		} catch (e) {}
	}

	function renderTopic(topicKey, topics) {
		var t = topics[topicKey];
		if (!t) {
			root.classList.add('hidden');
			notFound.classList.remove('hidden');
			return;
		}

		root.classList.remove('hidden');
		notFound.classList.add('hidden');
		setDocumentTitle(t);

		var topicKeys = Object.keys(topics);

		var html = '';
		html += '<div class="mb-4 flex flex-wrap items-center justify-between gap-3">';
		html += '  <a href="./index.html" class="text-primary hover:underline text-sm">← Back to Playground</a>';
		html += '  <div class="flex items-center gap-2 text-sm">';
		html += '    <label for="topic-select" class="text-gray-600 dark:text-gray-300">Topic:</label>';
		html += '    <select id="topic-select" class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-2 py-1 text-sm">';
		topicKeys.forEach(function (key) {
			var meta = topics[key];
			var label = meta && meta.title ? meta.title : key;
			html += '<option value="' + key + '"' + (key === topicKey ? ' selected' : '') + '>' + label + '</option>';
		});
		html += '    </select>';
		html += '  </div>';
		html += '</div>';

		html += '<h1 class="text-3xl font-bold mb-2">Learn ' + (t.title || '') + '</h1>';
		if (t.summary) {
			html += '<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">' + t.summary + '</p>';
		}

		html += '<div class="mb-6 inline-flex flex-wrap gap-2 rounded-full bg-gray-100 dark:bg-gray-800 p-1 text-xs sm:text-sm">';
		html += '<button type="button" data-tab="youtube" class="tab-btn px-3 py-1.5 rounded-full bg-white dark:bg-gray-900 text-primary font-semibold shadow-sm">YouTube</button>';
		html += '<button type="button" data-tab="read" class="tab-btn px-3 py-1.5 rounded-full text-gray-700 dark:text-gray-200 hover:bg-white/70">Read / Blogs / Books</button>';
		html += '<button type="button" data-tab="course" class="tab-btn px-3 py-1.5 rounded-full text-gray-700 dark:text-gray-200 hover:bg-white/70">Courses & paths</button>';
		html += '<button type="button" data-tab="best" class="tab-btn px-3 py-1.5 rounded-full text-gray-700 dark:text-gray-200 hover:bg-white/70">Best playlists & lists</button>';
		html += '</div>';

		html += '<div id="tab-panels" class="space-y-6">';

		// Panel: YouTube
		html += '<section data-tab-panel="youtube" class="rounded-xl border-2 border-gray-200 bg-white dark:bg-gray-900 overflow-hidden">';
		html += '<div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between gap-2">';
		html += '<h2 class="text-lg font-bold flex items-center gap-2">▶ YouTube</h2>';
		html += '<p class="text-xs text-gray-500 dark:text-gray-400">Preview top video here, open others in new tab.</p>';
		html += '</div><div class="p-4 space-y-3">';
				if (t.youtube && t.youtube.length) {
					var embedVideo = t.youtube.find(function (y) { return y.embed && !y.playlist; });
					if (embedVideo) {
						html += '<div class="rounded-lg overflow-hidden bg-black" style="aspect-ratio:16/9;"><iframe class="w-full h-full" src="https://www.youtube.com/embed/' + embedVideo.id + '?rel=0" title="' + (embedVideo.title || '') + '" allowfullscreen></iframe></div>';
					}
					html += '<ul class="space-y-1 pt-2">';
					t.youtube.slice(0, 10).forEach(function (y) {
						var title = y.title || 'Watch on YouTube';
						var url = y.playlist ? 'https://www.youtube.com/playlist?list=' + y.id : 'https://www.youtube.com/watch?v=' + y.id;
						var icon = y.playlist ? '📚 ' : '';
						html += '<li><a class="text-sm text-primary hover:underline block truncate" target="_blank" rel="noopener" href="' + url + '">' + icon + title + ' →</a></li>';
					});
					html += '</ul>';
					html += '<button type="button" id="yt-search" class="inline-flex items-center gap-1 mt-3 rounded-full border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Search on YouTube</button>';
				} else {
					html += '<p class="text-sm text-gray-500">(no curated videos yet)</p>';
				}
		html += '</div></section>';

		// Panel: Read / Blogs / Books
		html += '<section data-tab-panel="read" class="hidden rounded-xl border-2 border-gray-200 bg-white dark:bg-gray-900 overflow-hidden">';
		html += '<div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"><h2 class="text-lg font-bold">📖 Read / blogs / books</h2></div><div class="p-4 space-y-4 text-sm">';
		if (t.books && t.books.length) {
			html += '<div><h3 class="font-semibold mb-1">Books & official docs</h3><ul class="space-y-1">';
			t.books.forEach(function (r) {
				html += '<li><a class="text-primary hover:underline" target="_blank" rel="noopener" href="' + r.url + '">' + r.name + ' →</a></li>';
			});
			html += '</ul></div>';
		}
		if (t.blogs && t.blogs.length) {
			html += '<div><h3 class="font-semibold mb-1">Blogs & long reads</h3><ul class="space-y-1">';
			t.blogs.forEach(function (b) {
				html += '<li><a class="text-primary hover:underline" target="_blank" rel="noopener" href="' + b.url + '">' + b.name + ' →</a></li>';
			});
			html += '</ul></div>';
		}
		if (t.github && t.github.length) {
			html += '<div class="mt-4"><h3 class="font-semibold mb-1">GitHub Repositories</h3><ul class="space-y-1">';
			t.github.forEach(function (g) {
				html += '<li><a class="text-primary hover:underline" target="_blank" rel="noopener" href="' + g.url + '">⭐ ' + g.name + ' →</a></li>';
			});
			html += '</ul></div>';
		}
		if ((!t.books || !t.books.length) && (!t.blogs || !t.blogs.length) && (!t.github || !t.github.length)) {
			html += '<p class="text-sm text-gray-500">(no reading list yet)</p>';
		}
		html += '</div></section>';

		// Panel: Courses & paths
		html += '<section data-tab-panel="course" class="hidden rounded-xl border-2 border-gray-200 bg-white dark:bg-gray-900 overflow-hidden">';
		html += '<div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"><h2 class="text-lg font-bold">🎓 Courses & learning paths</h2></div><div class="p-4">';
		if (t.courses && t.courses.length) {
			html += '<ul class="space-y-2 text-sm">';
			t.courses.forEach(function (c) {
				html += '<li><a class="text-primary hover:underline" target="_blank" rel="noopener" href="' + c.url + '">' + c.name + ' →</a></li>';
			});
			html += '</ul>';
		} else {
			html += '<p class="text-sm text-gray-500">(no courses added yet)</p>';
		}
		if (t.paths && t.paths.length) {
			html += '<div class="mt-4 space-y-2"><h3 class="font-semibold">Suggested paths</h3><ul class="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">';
			t.paths.forEach(function (p) {
				html += '<li>' + p + '</li>';
			});
			html += '</ul></div>';
		}
		html += '</div></section>';

		// Panel: Best playlists & lists
		html += '<section data-tab-panel="best" class="hidden rounded-xl border-2 border-gray-200 bg-white dark:bg-gray-900 overflow-hidden">';
		html += '<div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"><h2 class="text-lg font-bold">⭐ Best playlists & must‑read lists</h2></div><div class="p-4 space-y-4 text-sm">';
		html += '<p class="text-xs text-gray-500 dark:text-gray-400">Opinionated picks: YouTube playlists, GitHub book lists, and awesome repos. All open in a new tab.</p>';
		html += '<div><h3 class="font-semibold mb-1">Awesome & curated lists</h3><ul class="space-y-1">';
		html += '<li><a href="https://github.com/vinta/awesome-python" target="_blank" rel="noopener" class="underline hover:text-primary">awesome-python</a> · Python ecosystem</li>';
		html += '<li><a href="https://github.com/academic/awesome-datascience" target="_blank" rel="noopener" class="underline hover:text-primary">awesome-datascience</a> · data science resources</li>';
		html += '<li><a href="https://github.com/josephmisiti/awesome-machine-learning" target="_blank" rel="noopener" class="underline hover:text-primary">awesome-machine-learning</a> · ML libraries & papers</li>';
		html += '<li><a href="https://github.com/awesomedata/awesome-public-datasets" target="_blank" rel="noopener" class="underline hover:text-primary">awesome-public-datasets</a> · datasets to practice on</li>';
		html += '</ul></div>';
		html += '<div><h3 class="font-semibold mb-1">Free books & code repos</h3><ul class="space-y-1">';
		html += '<li><a href="https://github.com/EbookFoundation/free-programming-books" target="_blank" rel="noopener" class="underline hover:text-primary">free-programming-books</a> · free books (all topics)</li>';
		html += '<li><a href="https://github.com/ageron/handson-ml3" target="_blank" rel="noopener" class="underline hover:text-primary">Hands‑On ML (code)</a> · practical ML notebook repo</li>';
		html += '<li><a href="https://github.com/rasbt/python-machine-learning-book-3rd-edition" target="_blank" rel="noopener" class="underline hover:text-primary">Python ML book (code)</a> · Python ML examples</li>';
		html += '<li><a href="https://github.com/fastai/fastbook" target="_blank" rel="noopener" class="underline hover:text-primary">fastbook</a> · Deep Learning for Coders (fast.ai)</li>';
		html += '</ul></div>';
		html += '<div><h3 class="font-semibold mb-1">Must‑read blogs & magazines</h3><ul class="space-y-1">';
		html += '<li><a href="https://www.freecodecamp.org/news/" target="_blank" rel="noopener" class="underline hover:text-primary">freeCodeCamp News</a> · long‑form tutorials</li>';
		html += '<li><a href="https://towardsdatascience.com" target="_blank" rel="noopener" class="underline hover:text-primary">Towards Data Science</a> · data / ML stories & guides</li>';
		html += '<li><a href="https://medium.com/tag/data-science" target="_blank" rel="noopener" class="underline hover:text-primary">Medium · Data Science tag</a> · curated DS posts</li>';
		html += '<li><a href="https://medium.com/tag/machine-learning" target="_blank" rel="noopener" class="underline hover:text-primary">Medium · Machine Learning tag</a> · ML deep dives</li>';
		html += '</ul></div>';
		html += '</div></section>';

		html += '</div>';
		root.innerHTML = html;

		var selectEl = document.getElementById('topic-select');
		if (selectEl) {
			selectEl.addEventListener('change', function () {
				var nextKey = selectEl.value;
				updateUrl(nextKey);
				renderTopic(nextKey, topics);
			});
		}

		var buttons = root.querySelectorAll('.tab-btn');
		var panels = root.querySelectorAll('[data-tab-panel]');
		buttons.forEach(function (btn) {
			btn.addEventListener('click', function () {
				var target = btn.getAttribute('data-tab');
				buttons.forEach(function (b) {
					b.classList.remove('bg-white', 'dark:bg-gray-900', 'text-primary', 'font-semibold', 'shadow-sm');
					b.classList.add('text-gray-700', 'dark:text-gray-200');
				});
				btn.classList.add('bg-white', 'dark:bg-gray-900', 'text-primary', 'font-semibold', 'shadow-sm');
				btn.classList.remove('text-gray-700', 'dark:text-gray-200');
				panels.forEach(function (p) {
					if (p.getAttribute('data-tab-panel') === target) p.classList.remove('hidden');
					else p.classList.add('hidden');
				});
			});
		});

		var searchBtn = document.getElementById('yt-search');
		if (searchBtn) {
			searchBtn.addEventListener('click', function () {
				var q = 'best ' + (t.title || '') + ' tutorial for beginners';
				var url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
				window.open(url, '_blank', 'noopener');
			});
		}
	}

	fetch('./assets/resources.json')
		.then(function (res) {
			return res.json();
		})
		.then(function (data) {
			if (!data || typeof data !== 'object') {
				throw new Error('Invalid resources data');
			}
			var topicKey = initialTopic;
			if (!data[topicKey]) {
				var keys = Object.keys(data);
				if (!keys.length) throw new Error('No topics configured');
				topicKey = keys[0];
			}
			renderTopic(topicKey, data);
		})
		.catch(function () {
			root.classList.add('hidden');
			notFound.classList.remove('hidden');
		});
})();

if (typeof initAnalyticsTracking === 'function') {
	initAnalyticsTracking({ site: 'analytics-lab', baseEvent: 'resources' });
}

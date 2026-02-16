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
		html += '<section data-tab-panel="youtube" class="rounded-2xl border-2 border-gray-200 bg-white dark:bg-gray-900 overflow-hidden material-elevation-1">';
		html += '<div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between gap-2">';
		html += '<h2 class="text-lg font-bold flex items-center gap-2">▶ YouTube</h2>';
		html += '<p class="text-xs text-gray-500 dark:text-gray-400">Primary player on the left, queue of videos on the right.</p>';
		html += '</div>';
		html += '<div id="yt-panel" class="p-5"></div>';
		html += '</section>';

		// Panel: Read / Blogs / Books
		html += '<section data-tab-panel="read" class="hidden rounded-xl border-2 border-gray-200 bg-white dark:bg-gray-900 overflow-hidden">';
		html += '<div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"><h2 class="text-lg font-bold">📖 Read / blogs / books</h2></div><div class="p-4 space-y-4 text-sm">';
		if (t.books && t.books.length) {
			html += '<div><h3 class="font-semibold mb-2">Books & official docs</h3><div class="grid gap-3 sm:grid-cols-2">';
			t.books.forEach(function (r) {
				html += '<a class="notion-card block hover:no-underline" target="_blank" rel="noopener" href="' + r.url + '">';
				html += '<div class="notion-card-title">' + r.name + '</div>';
				html += '<div class="notion-card-meta">Book / docs</div>';
				html += '</a>';
			});
			html += '</div></div>';
		}
		if (t.blogs && t.blogs.length) {
			html += '<div><h3 class="font-semibold mb-2">Blogs & long reads</h3><div class="grid gap-3 sm:grid-cols-2">';
			t.blogs.forEach(function (b) {
				html += '<a class="notion-card block hover:no-underline" target="_blank" rel="noopener" href="' + b.url + '">';
				html += '<div class="notion-card-title">' + b.name + '</div>';
				html += '<div class="notion-card-meta">Blog / article</div>';
				html += '</a>';
			});
			html += '</div></div>';
		}
		if (t.github && t.github.length) {
			html += '<div class="mt-2"><h3 class="font-semibold mb-2">GitHub repositories</h3><div class="grid gap-3 sm:grid-cols-2">';
			t.github.forEach(function (g) {
				html += '<a class="notion-card block hover:no-underline" target="_blank" rel="noopener" href="' + g.url + '">';
				html += '<div class="notion-card-title">⭐ ' + g.name + '</div>';
				html += '<div class="notion-card-meta">GitHub repo</div>';
				html += '</a>';
			});
			html += '</div></div>';
		}
		if ((!t.books || !t.books.length) && (!t.blogs || !t.blogs.length) && (!t.github || !t.github.length)) {
			html += '<p class="text-sm text-gray-500">(no reading list yet)</p>';
		}
		html += '</div></section>';

		// Panel: Courses & paths
		html += '<section data-tab-panel="course" class="hidden rounded-xl border-2 border-gray-200 bg-white dark:bg-gray-900 overflow-hidden">';
		html += '<div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"><h2 class="text-lg font-bold">🎓 Courses & learning paths</h2></div><div class="p-4 space-y-4 text-sm">';
		if (t.courses && t.courses.length) {
			html += '<div><h3 class="font-semibold mb-2">Courses</h3><div class="grid gap-3 sm:grid-cols-2">';
			t.courses.forEach(function (c) {
				html += '<a class="notion-card block hover:no-underline" target="_blank" rel="noopener" href="' + c.url + '">';
				html += '<div class="notion-card-title">' + c.name + '</div>';
				html += '<div class="notion-card-meta">Course</div>';
				html += '</a>';
			});
			html += '</div></div>';
		} else {
			html += '<p class="text-sm text-gray-500">(no courses added yet)</p>';
		}
		if (t.paths && t.paths.length) {
			html += '<div class="mt-2 space-y-2"><h3 class="font-semibold">Suggested paths</h3><ul class="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">';
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
		// Show topic-specific GitHub repos if available
		if (t.github && t.github.length) {
			html += '<div><h3 class="font-semibold mb-1">Topic-specific GitHub Repos</h3><ul class="space-y-1">';
			t.github.forEach(function (g) {
				html += '<li><a href="' + g.url + '" target="_blank" rel="noopener" class="underline hover:text-primary">⭐ ' + g.name + ' →</a></li>';
			});
			html += '</ul></div>';
		}
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

		// YouTube hero + queue layout with Videos / Playlists toggle
		(function setupYouTubePanel(topic) {
			var panel = root.querySelector('[data-tab-panel="youtube"]');
			if (!panel) return;
			var container = panel.querySelector('#yt-panel');
			if (!container) return;

			var vids = (topic.youtube || []).slice(0, 15);
			if (!vids.length) {
				container.innerHTML = '<p class="text-sm text-gray-500">(no curated videos yet)</p>';
				return;
			}

			var videosOnly = vids.filter(function (v) {
				return v && !v.playlist;
			});
			var playlistsOnly = vids.filter(function (v) {
				return v && v.playlist;
			});

			var mode = videosOnly.length ? 'videos' : 'playlists';

			function pickInitialIndex(list) {
				var idx = -1;
				for (var i = 0; i < list.length; i++) {
					var v0 = list[i];
					if (v0 && v0.embed && !v0.playlist) {
						idx = i;
						break;
					}
				}
				if (idx === -1) idx = 0;
				return idx;
			}

			function getActiveList() {
				return mode === 'playlists' ? playlistsOnly : videosOnly.length ? videosOnly : vids;
			}

			function render(heroIdx) {
				container.innerHTML = '';

				var active = getActiveList();
				if (!active.length) {
					container.innerHTML = '<p class="text-sm text-gray-500">(no videos in this view yet)</p>';
					return;
				}

				if (heroIdx == null || heroIdx < 0 || heroIdx >= active.length) {
					heroIdx = pickInitialIndex(active);
				}

				// Filter toggle row
				var toggleRow = document.createElement('div');
				toggleRow.className = 'flex items-center justify-end gap-2 mb-3 text-xs';
				var label = document.createElement('span');
				label.className = 'text-gray-500 dark:text-gray-400';
				label.textContent = 'View:';
				toggleRow.appendChild(label);

				function makeToggle(type, text) {
					var btn = document.createElement('button');
					btn.type = 'button';
					var isActive = mode === type;
					btn.className =
						'px-3 py-1 rounded-full border text-xs font-semibold transition ' +
						(isActive
							? 'border-primary text-primary bg-white dark:bg-gray-900 shadow-sm'
							: 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700');
					btn.textContent = text;
					btn.disabled = type === 'videos' ? !videosOnly.length : !playlistsOnly.length;
					if (btn.disabled) {
						btn.className += ' opacity-50 cursor-not-allowed';
					}
					btn.addEventListener('click', function () {
						if (btn.disabled || mode === type) return;
						mode = type;
						render();
					});
					return btn;
				}

				toggleRow.appendChild(makeToggle('videos', 'Videos'));
				toggleRow.appendChild(makeToggle('playlists', 'Playlists'));
				container.appendChild(toggleRow);

				var grid = document.createElement('div');
				grid.className = 'grid grid-cols-1 md:grid-cols-3 gap-4';

				var left = document.createElement('div');
				left.className = 'md:col-span-2 space-y-2';
				var hv = active[heroIdx];

				var iframeWrapper = document.createElement('div');
				iframeWrapper.className = 'rounded-lg overflow-hidden bg-black material-elevation-2';
				iframeWrapper.style.aspectRatio = '16 / 9';
				var iframe = document.createElement('iframe');
				iframe.className = 'w-full h-full';
				iframe.src = hv.playlist
					? 'https://www.youtube.com/embed/videoseries?list=' + hv.id
					: 'https://www.youtube.com/embed/' + hv.id + '?rel=0';
				iframe.title = hv.title || '';
				iframe.allowFullscreen = true;
				iframeWrapper.appendChild(iframe);
				left.appendChild(iframeWrapper);

				var heroTitle = document.createElement('p');
				heroTitle.className = 'text-sm font-medium text-gray-800 dark:text-gray-100';
				heroTitle.textContent = hv.title || 'YouTube video';
				left.appendChild(heroTitle);

				var hint = document.createElement('p');
				hint.className = 'text-xs text-gray-500 dark:text-gray-400';
				hint.textContent = 'Click a video on the right to change the main player.';
				left.appendChild(hint);

				grid.appendChild(left);

				var right = document.createElement('div');
				right.className = 'space-y-2 max-h-[360px] overflow-y-auto';

				for (var j = 0; j < active.length; j++) {
					if (j === heroIdx) continue;
					var v = active[j];
					if (!v || !v.id) continue;

					var item = document.createElement('button');
					item.type = 'button';
					item.className =
						'w-full flex items-center gap-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-2 text-xs sm:text-sm';
					item.setAttribute('data-yt-index', String(j));

					var thumbWrap = document.createElement('div');
					thumbWrap.className = 'w-16 h-10 rounded-md overflow-hidden bg-black flex-shrink-0';
					var img = document.createElement('img');
					img.className = 'w-full h-full object-cover';
					if (!v.playlist) {
						img.src = 'https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg';
					} else {
						img.src = 'https://img.youtube.com/vi/' + (v.thumbnailId || v.id) + '/mqdefault.jpg';
					}
					img.alt = v.title || '';
					thumbWrap.appendChild(img);
					item.appendChild(thumbWrap);

					var metaBox = document.createElement('div');
					metaBox.className = 'flex-1 space-y-0.5';
					var tEl = document.createElement('p');
					tEl.className = 'font-medium text-gray-800 dark:text-gray-100 truncate';
					tEl.textContent = v.title || 'YouTube';
					metaBox.appendChild(tEl);
					if (v.playlist) {
						var badge = document.createElement('span');
						badge.className =
							'inline-flex items-center rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-0.5 text-[10px] font-semibold';
						badge.textContent = 'Playlist';
						metaBox.appendChild(badge);
					}
					item.appendChild(metaBox);

					(function () {
						item.addEventListener('click', function (ev) {
							var idx = parseInt(ev.currentTarget.getAttribute('data-yt-index'), 10);
							if (!isNaN(idx)) {
								render(idx);
							}
						});
					})();

					right.appendChild(item);
				}

				grid.appendChild(right);
				container.appendChild(grid);

				var searchBtnEl = document.createElement('button');
				searchBtnEl.type = 'button';
				searchBtnEl.id = 'yt-search';
				searchBtnEl.className =
					'inline-flex items-center gap-1 mt-4 rounded-full border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800';
				searchBtnEl.textContent = 'Search on YouTube';
				searchBtnEl.addEventListener('click', function () {
					var q = 'best ' + (topic.title || '') + ' tutorial for beginners';
					var url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
					window.open(url, '_blank', 'noopener');
				});
				container.appendChild(searchBtnEl);

				// Recommended channels: tap channel name to show mini embed (channel uploads) + link to open full channel
				var channels = topic.channels || [];
				if (channels.length) {
					var chSection = document.createElement('div');
					chSection.className = 'mt-6 pt-4 border-t border-gray-200 dark:border-gray-700';
					var chTitle = document.createElement('h3');
					chTitle.className = 'text-sm font-bold text-gray-800 dark:text-gray-100 mb-2';
					chTitle.textContent = 'Recommended channels (tap to explore on this page)';
					chSection.appendChild(chTitle);
					var chList = document.createElement('div');
					chList.className = 'flex flex-wrap gap-2';
					channels.forEach(function (ch) {
						if (!ch || !ch.id) return;
						var uploadsListId = 'UU' + ch.id.slice(2);
						var channelUrl = 'https://www.youtube.com/channel/' + ch.id;
						var btn = document.createElement('button');
						btn.type = 'button';
						btn.className = 'resource-channel-btn px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left';
						btn.setAttribute('data-channel-id', ch.id);
						btn.setAttribute('data-uploads-list', uploadsListId);
						btn.setAttribute('data-channel-url', channelUrl);
						btn.innerHTML = (ch.name || 'Channel') + (ch.description ? ' <span class="text-gray-500 dark:text-gray-400 font-normal">· ' + ch.description + '</span>' : '');
						chList.appendChild(btn);
					});
					chSection.appendChild(chList);
					var chExpand = document.createElement('div');
					chExpand.className = 'resource-channel-embed-wrap hidden mt-3 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800';
					chSection.appendChild(chExpand);
					container.appendChild(chSection);

					chList.addEventListener('click', function (e) {
						var btn = e.target.closest('.resource-channel-btn');
						if (!btn) return;
						var channelId = btn.getAttribute('data-channel-id');
						var uploadsListId = btn.getAttribute('data-uploads-list');
						var channelUrl = btn.getAttribute('data-channel-url');
						var wrap = container.querySelector('.resource-channel-embed-wrap');
						if (!wrap) return;
						var isOpen = wrap.classList.contains('hidden') === false;
						var sameChannel = wrap.getAttribute('data-current-channel') === channelId;
						if (sameChannel && isOpen) {
							wrap.classList.add('hidden');
							wrap.innerHTML = '';
							wrap.removeAttribute('data-current-channel');
							return;
						}
						wrap.classList.remove('hidden');
						wrap.setAttribute('data-current-channel', channelId);
						wrap.innerHTML = '';
						var embedRow = document.createElement('div');
						embedRow.className = 'p-3 flex flex-col sm:flex-row gap-3';
						var iframeWrap = document.createElement('div');
						iframeWrap.className = 'flex-1 rounded-lg overflow-hidden bg-black';
						iframeWrap.style.aspectRatio = '16 / 9';
						iframeWrap.style.minHeight = '200px';
						var iframe = document.createElement('iframe');
						iframe.className = 'w-full h-full';
						iframe.src = 'https://www.youtube.com/embed/videoseries?list=' + uploadsListId + '&rel=0';
						iframe.title = 'Channel uploads';
						iframe.allowFullscreen = true;
						iframeWrap.appendChild(iframe);
						embedRow.appendChild(iframeWrap);
						var linkBox = document.createElement('div');
						linkBox.className = 'flex flex-col justify-center gap-2';
						var openLink = document.createElement('a');
						openLink.href = channelUrl;
						openLink.target = '_blank';
						openLink.rel = 'noopener';
						openLink.className = 'text-sm font-semibold text-primary hover:underline';
						openLink.textContent = 'Open channel on YouTube →';
						linkBox.appendChild(openLink);
						var closeBtn = document.createElement('button');
						closeBtn.type = 'button';
						closeBtn.className = 'text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200';
						closeBtn.textContent = 'Close embed';
						closeBtn.addEventListener('click', function () {
							wrap.classList.add('hidden');
							wrap.innerHTML = '';
							wrap.removeAttribute('data-current-channel');
						});
						linkBox.appendChild(closeBtn);
						embedRow.appendChild(linkBox);
						wrap.appendChild(embedRow);
					});
				}
			}

			render();
		})(t);
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

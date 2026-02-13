/**
 * Homepage: quotes (Quotable, Animechan, static lists). Quote image matches source when possible (e.g. Reply 1988 → Reply 1988 image).
 * Image: curated map (Wikimedia/free) per source; fallback Picsum seeded by source name.
 */
(function () {
	'use strict';

	var QUOTE_CATEGORY_KEY = 'home_quote_category';

	// Source → image URL (Wikimedia Commons / Wikipedia, free use). Same source = same picture as the quote.
	var QUOTE_IMAGE_MAP = {
		'Reply 1988': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d8/TVN%27s_Reply_1988_%28%EC%9D%91%EB%8B%B5%ED%95%98%EB%9D%BC_1988%29_poster.jpg/800px-TVN%27s_Reply_1988_%28%EC%9D%91%EB%8B%B5%ED%95%98%EB%9D%BC_1988%29_poster.jpg',
		'Itaewon Class': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/Itaewon_Class.jpg/800px-Itaewon_Class.jpg',
		'Goblin': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Guardian_The_Lonely_and_Great_God_poster.jpg/800px-Guardian_The_Lonely_and_Great_God_poster.jpg',
		'Crash Landing on You': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/Crash_Landing_on_You_poster.jpg/800px-Crash_Landing_on_You_poster.jpg',
		'Guardian: The Lonely and Great God': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Guardian_The_Lonely_and_Great_God_poster.jpg/800px-Guardian_The_Lonely_and_Great_God_poster.jpg',
		'Casablanca': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/CasablancaPoster.jpg/800px-CasablancaPoster.jpg',
		'Star Wars': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6c/Star_Wars_Logo.svg/800px-Star_Wars_Logo.svg.png',
		'Jaws': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/JAWS_Movie_poster.jpg/800px-JAWS_Movie_poster.jpg',
		'The Godfather': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/af/The_Godfather%2C_The_Game.jpg/800px-The_Godfather%2C_The_Game.jpg',
		'Finding Nemo': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Finding_Nemo.jpg/800px-Finding_Nemo.jpg',
		'Steve Jobs': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/800px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg',
		'Einstein': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/800px-Albert_Einstein_Head.jpg',
		'Plutarch': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Plutarch_engraving.jpg/800px-Plutarch_engraving.jpg',
		'Nelson Mandela': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Nelson_Mandela-2008_%28edit%29.jpg/800px-Nelson_Mandela-2008_%28edit%29.jpg',
		'Mahatma Gandhi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Mahatma-Gandhi%2C_studio%2C_1931.jpg/800px-Mahatma-Gandhi%2C_studio%2C_1931.jpg',
		'Martin Luther King Jr.': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Martin_Luther_King%2C_Jr..jpg/800px-Martin_Luther_King%2C_Jr..jpg',
		'Abraham Lincoln': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Abraham_Lincoln_O-77_matte_collodion_print.jpg/800px-Abraham_Lincoln_O-77_matte_collodion_print.jpg',
		'Winston Churchill': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Sir_Winston_Churchill_-_19086236948.jpg/800px-Sir_Winston_Churchill_-_19086236948.jpg'
	};

	// Cache for dynamically discovered images from Wikipedia (keyed by source name)
	var QUOTE_IMAGE_CACHE_KEY = 'standalone_quote_image_cache';
	var quoteImageCache = {};
	try {
		var rawCache = localStorage.getItem(QUOTE_IMAGE_CACHE_KEY);
		if (rawCache) quoteImageCache = JSON.parse(rawCache) || {};
	} catch (e) {
		quoteImageCache = {};
	}

	function saveQuoteImageCache() {
		try { localStorage.setItem(QUOTE_IMAGE_CACHE_KEY, JSON.stringify(quoteImageCache)); } catch (e) {}
	}

	// Try to fetch a poster/thumbnail for a given source from Wikipedia (no API key)
	function fetchWikipediaImage(source, cb) {
		if (!source || !source.trim()) {
			cb(null);
			return;
		}
		source = source.trim();
		if (quoteImageCache[source] && quoteImageCache[source].url) {
			cb(quoteImageCache[source].url);
			return;
		}
		var apiUrl = 'https://en.wikipedia.org/w/api.php?action=query&titles=' +
			encodeURIComponent(source) +
			'&prop=pageimages&format=json&pithumbsize=800&origin=*';
		fetch(apiUrl)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.query || !data.query.pages) {
					cb(null);
					return;
				}
				var pages = data.query.pages;
				var pageId = Object.keys(pages)[0];
				var page = pages[pageId];
				var thumb = page && page.thumbnail && page.thumbnail.source;
				if (thumb) {
					quoteImageCache[source] = { url: thumb };
					saveQuoteImageCache();
					cb(thumb);
				} else {
					cb(null);
				}
			})
			.catch(function () { cb(null); });
	}

	// Fallback / static quotes when API fails or for categories without a free API
	var QUOTES_FALLBACK = [
		{ text: 'The only way to do great work is to love what you do.', attr: 'Steve Jobs' },
		{ text: 'The mind is not a vessel to be filled but a fire to be kindled.', attr: 'Plutarch' },
		{ text: 'Make things as simple as possible, but not simpler.', attr: 'Einstein' }
	];
	var QUOTES_MOVIE = [
		{ text: 'May the Force be with you.', attr: 'Star Wars' },
		{ text: 'Here\'s looking at you, kid.', attr: 'Casablanca' },
		{ text: 'You\'re gonna need a bigger boat.', attr: 'Jaws' },
		{ text: 'I\'m gonna make him an offer he can\'t refuse.', attr: 'The Godfather' },
		{ text: 'Just keep swimming.', attr: 'Finding Nemo' },
		{ text: 'There\'s no place like home.', attr: 'The Wizard of Oz' },
		{ text: 'I\'ll be back.', attr: 'The Terminator' },
		{ text: 'You can\'t handle the truth!', attr: 'A Few Good Men' }
	];
	var QUOTES_KDRAMA = [
		{ text: 'Every moment is a chance to turn things around.', attr: 'Itaewon Class' },
		{ text: 'The past is the past. What matters is the present.', attr: 'Goblin' },
		{ text: 'If you love someone, you have to say it.', attr: 'Crash Landing on You' },
		{ text: 'Don\'t run from your fate. Face it.', attr: 'Guardian: The Lonely and Great God' },
		{ text: 'Life is about the people who make you smile.', attr: 'Reply 1988' },
		{ text: 'Happiness is something we create together.', attr: 'Reply 1988' },
		{ text: 'Time doesn\'t wait. So don\'t waste it on regret.', attr: 'Reply 1997' },
		{ text: 'Even if the world changes, some things stay the same.', attr: 'Reply 1988' }
	];
	var QUOTES_LEADERS = [
		{ text: 'It always seems impossible until it\'s done.', attr: 'Nelson Mandela' },
		{ text: 'Be the change you wish to see in the world.', attr: 'Mahatma Gandhi' },
		{ text: 'Darkness cannot drive out darkness; only light can do that.', attr: 'Martin Luther King Jr.' },
		{ text: 'In the end, it\'s not the years in your life that count. It\'s the life in your years.', attr: 'Abraham Lincoln' },
		{ text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', attr: 'Winston Churchill' },
		{ text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.', attr: 'Nelson Mandela' },
		{ text: 'First they ignore you, then they laugh at you, then they fight you, then you win.', attr: 'Mahatma Gandhi' }
	];

	var REFRESH_TIPS = [
		'Take a breath. Stretch.',
		'Step away for 2 minutes.',
		'Hydrate.',
		'Look at something 20 feet away for 20 seconds.',
		'One small win today counts.'
	];

	function pick(arr) {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	function setQuoteUI(text, attr, meta) {
		var quoteEl = document.getElementById('home-quote-text');
		var quoteAttr = document.getElementById('home-quote-attr');
		var quoteMeta = document.getElementById('home-quote-meta');
		if (quoteEl) quoteEl.textContent = text || '';
		if (quoteAttr) quoteAttr.textContent = attr ? '— ' + attr : '';
		if (quoteMeta) {
			quoteMeta.textContent = meta || '';
			quoteMeta.classList.toggle('hidden', !meta);
		}
	}

	function setQuoteImage(seedOrSource, attr) {
		var bg = document.getElementById('home-quote-bg');
		if (!bg) return;
		// Prefer image that matches the quote source (e.g. Reply 1988 quote → Reply 1988 image)
		var source = (attr && typeof attr === 'string') ? attr.trim() : '';
		var url = source && QUOTE_IMAGE_MAP[source];
		if (!url && source && quoteImageCache[source] && quoteImageCache[source].url) {
			url = quoteImageCache[source].url;
		}
		if (url) {
			bg.style.backgroundImage = 'url(' + url + ')';
			return;
		}
		// Fallback immediately: Picsum with seed from source or seed so same source = same image
		var s = (source || seedOrSource || Date.now()).toString().replace(/\W/g, '') || Date.now();
		bg.style.backgroundImage = 'url(https://picsum.photos/seed/' + s + '/800/400)';
		// Then try to upgrade to a Wikipedia image for this source (async override)
		if (source) {
			fetchWikipediaImage(source, function (foundUrl) {
				if (foundUrl) {
					bg.style.backgroundImage = 'url(' + foundUrl + ')';
				}
			});
		}
	}

	function useFallback(category) {
		var list = QUOTES_FALLBACK;
		if (category === 'movie') list = QUOTES_MOVIE;
		if (category === 'kdrama') list = QUOTES_KDRAMA;
		if (category === 'leaders') list = QUOTES_LEADERS;
		var q = pick(list);
		setQuoteUI(q.text, q.attr, '');
		setQuoteImage(null, q.attr);
	}

	function fetchQuotable(tags, done) {
		var url = 'https://api.quotable.io/random';
		if (tags && tags.length) url += '?tags=' + encodeURIComponent(tags.join(','));
		fetch(url)
			.then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('Quotable error')); })
			.then(function (data) {
				done({
					text: data.content,
					attr: data.author || '',
					meta: ''
				});
			})
			.catch(function () { done(null); });
	}

	function fetchAnimechan(done) {
		// Animechan (api.animechan.io): free, 5 req/hour. Response: { quote, character, anime } or wrapped in .data
		fetch('https://api.animechan.io/v1/quotes/random')
			.then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('Animechan error')); })
			.then(function (res) {
				var data = res.data || res;
				var quote = data.quote || data.content;
				var character = data.character || '';
				var anime = data.anime || data.animeName || '';
				if (!quote) return done(null);
				done({
					text: quote,
					attr: character,
					meta: anime ? 'From: ' + anime : ''
				});
			})
			.catch(function () { done(null); });
	}

	function setQuoteLoading(loading) {
		if (quoteRefreshBtn) {
			quoteRefreshBtn.disabled = !!loading;
			quoteRefreshBtn.textContent = loading ? '…' : '↻ Refresh';
		}
	}

	function loadQuote(category) {
		category = category || 'all';
		if (category === 'all') {
			var choices = ['wisdom', 'books', 'anime', 'movie', 'kdrama', 'leaders'];
			category = choices[Math.floor(Math.random() * choices.length)];
		}

		setQuoteLoading(true);

		if (category === 'anime') {
			fetchAnimechan(function (q) {
				setQuoteLoading(false);
				if (q) {
					setQuoteUI(q.text, q.attr, q.meta);
					var animeName = (q.meta || '').replace(/^From:\s*/i, '').trim();
					setQuoteImage(null, animeName || q.attr);
				} else {
					useFallback('all');
				}
			});
			return;
		}

		if (category === 'books') {
			fetchQuotable(['literature'], function (q) {
				setQuoteLoading(false);
				if (q) {
					setQuoteUI(q.text, q.attr, q.meta);
					setQuoteImage(null, q.attr);
				} else {
					useFallback('all');
				}
			});
			return;
		}

		if (category === 'wisdom') {
			fetchQuotable(['wisdom', 'life', 'inspirational'], function (q) {
				setQuoteLoading(false);
				if (q) {
					setQuoteUI(q.text, q.attr, q.meta);
					setQuoteImage(null, q.attr);
				} else {
					useFallback('all');
				}
			});
			return;
		}

		if (category === 'movie' || category === 'kdrama' || category === 'leaders') {
			useFallback(category);
			setQuoteLoading(false);
			return;
		}

		useFallback('all');
		setQuoteLoading(false);
	}

	// Quote: category select, refresh buttons (quote + wallpaper), load initial
	var quoteCategoryEl = document.getElementById('home-quote-category');
	var quoteRefreshBtn = document.getElementById('home-quote-refresh');
	var quoteBgRefreshBtn = document.getElementById('home-quote-bg-refresh');

	function getCategory() {
		if (quoteCategoryEl) return quoteCategoryEl.value || 'all';
		try { return localStorage.getItem(QUOTE_CATEGORY_KEY) || 'all'; } catch (e) { return 'all'; }
	}

	function saveCategory(cat) {
		try { localStorage.setItem(QUOTE_CATEGORY_KEY, cat); } catch (e) {}
	}

	if (quoteCategoryEl) {
		try {
			var saved = localStorage.getItem(QUOTE_CATEGORY_KEY);
			if (saved) quoteCategoryEl.value = saved;
		} catch (e) {}
		quoteCategoryEl.addEventListener('change', function () {
			saveCategory(quoteCategoryEl.value);
			loadQuote(quoteCategoryEl.value);
		});
	}

	if (quoteRefreshBtn) {
		quoteRefreshBtn.addEventListener('click', function () {
			loadQuote(getCategory());
		});
	}

	function getCurrentQuoteSource() {
		var metaEl = document.getElementById('home-quote-meta');
		var attrEl = document.getElementById('home-quote-attr');
		var metaText = metaEl && metaEl.textContent ? metaEl.textContent.trim() : '';
		var attrText = attrEl && attrEl.textContent ? attrEl.textContent.trim() : '';
		var src = '';
		if (metaText) {
			src = metaText.replace(/^From:\s*/i, '').trim();
		}
		if (!src && attrText) {
			src = attrText.replace(/^—\s*/, '').trim();
		}
		return src;
	}

	if (quoteBgRefreshBtn) {
		quoteBgRefreshBtn.addEventListener('click', function () {
			var bg = document.getElementById('home-quote-bg');
			if (!bg) return;
			var src = getCurrentQuoteSource() || 'quote';
			// New random but source-themed wallpaper from Picsum
			var seed = (src + '-' + Date.now()).replace(/\W/g, '') || Date.now();
			bg.style.backgroundImage = 'url(https://picsum.photos/seed/' + seed + '/800/400)';
		});
	}

	// Initial quote and image
	loadQuote(getCategory());

	// Refresh spot
	var refreshEl = document.getElementById('home-refresh-text');
	if (refreshEl) refreshEl.textContent = pick(REFRESH_TIPS);

	var refreshBtn = document.getElementById('home-refresh-btn');
	if (refreshBtn) {
		refreshBtn.addEventListener('click', function () {
			if (refreshEl) refreshEl.textContent = pick(REFRESH_TIPS);
		});
	}

	// Real clock and calendar (updates every second)
	var clockTimeEl = document.getElementById('home-clock-time');
	var clockDateEl = document.getElementById('home-clock-date');
	function updateClock() {
		var now = new Date();
		if (clockTimeEl) clockTimeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
		if (clockDateEl) clockDateEl.textContent = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
	}
	if (clockTimeEl || clockDateEl) {
		updateClock();
		setInterval(updateClock, 1000);
	}

	// Weather (Open-Meteo): saved location, search city, or use my location
	var WEATHER_LOCATION_KEY = 'standalone_weather_location';
	var weatherEl = document.getElementById('home-weather');
	var weatherCity = document.getElementById('home-weather-city');
	var weatherSearch = document.getElementById('home-weather-search');
	var weatherSetBtn = document.getElementById('home-weather-set');
	var weatherMyLocBtn = document.getElementById('home-weather-mylocation');
	var defaultLat = 51.5074, defaultLon = -0.1278;

	function getSavedLocation() {
		try {
			var raw = localStorage.getItem(WEATHER_LOCATION_KEY);
			if (raw) {
				var o = JSON.parse(raw);
				if (o.lat != null && o.lon != null) return { lat: o.lat, lon: o.lon, name: o.name || '' };
			}
		} catch (e) {}
		return null;
	}
	function saveLocation(lat, lon, name) {
		try { localStorage.setItem(WEATHER_LOCATION_KEY, JSON.stringify({ lat: lat, lon: lon, name: name || '' })); } catch (e) {}
	}

	function renderWeather(data, locationName) {
		if (!weatherEl || !data) return;
		var temp = data.current_weather && data.current_weather.temperature != null
			? Math.round(data.current_weather.temperature) + '°C'
			: '—';
		var code = (data.current_weather && data.current_weather.weathercode) || 0;
		var desc = code >= 80 ? 'Cloudy' : code >= 61 ? 'Rain' : code >= 51 ? 'Drizzle' : code >= 3 ? 'Cloudy' : code === 1 ? 'Clear' : 'Clear';
		weatherEl.innerHTML = '<span class="font-semibold text-lg">' + temp + '</span><span class="text-sm opacity-80 ml-1">' + desc + '</span>';
		if (weatherCity) weatherCity.textContent = locationName || (data.timezone ? data.timezone.split('/').pop().replace(/_/g, ' ') : '—');
	}

	function fetchWeather(lat, lon, locationName) {
		var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true';
		fetch(url)
			.then(function (r) { return r.json(); })
			.then(function (data) {
				renderWeather(data, locationName);
			})
			.catch(function () {
				if (weatherEl) weatherEl.innerHTML = '<span class="text-sm opacity-70">Weather unavailable</span>';
			});
	}

	function setWeatherByCoords(lat, lon, name) {
		saveLocation(lat, lon, name);
		fetchWeather(lat, lon, name);
	}

	function searchCityAndSet(query) {
		query = (query || '').trim();
		if (!query) return;
		var url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(query) + '&count=1';
		fetch(url)
			.then(function (r) { return r.json(); })
			.then(function (data) {
				var r = data.results && data.results[0];
				if (r && r.latitude != null && r.longitude != null) {
					var name = (r.name || '') + (r.country_code ? ', ' + r.country_code.toUpperCase() : '');
					setWeatherByCoords(r.latitude, r.longitude, name);
				} else {
					if (weatherCity) weatherCity.textContent = 'City not found';
				}
			})
			.catch(function () {
				if (weatherCity) weatherCity.textContent = 'Search failed';
			});
	}

	if (weatherSetBtn && weatherSearch) {
		weatherSetBtn.addEventListener('click', function () { searchCityAndSet(weatherSearch.value); });
		weatherSearch.addEventListener('keydown', function (e) { if (e.key === 'Enter') searchCityAndSet(weatherSearch.value); });
	}
	if (weatherMyLocBtn) {
		weatherMyLocBtn.addEventListener('click', function () {
			if (!navigator.geolocation || !navigator.geolocation.getCurrentPosition) {
				setWeatherByCoords(defaultLat, defaultLon, 'London (no geolocation)');
				return;
			}
			navigator.geolocation.getCurrentPosition(
				function (pos) { setWeatherByCoords(pos.coords.latitude, pos.coords.longitude, 'My location'); },
				function () { setWeatherByCoords(defaultLat, defaultLon, 'London (location denied)'); }
			);
		});
	}

	if (weatherEl) {
		var saved = getSavedLocation();
		if (saved) {
			fetchWeather(saved.lat, saved.lon, saved.name);
		} else if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
			navigator.geolocation.getCurrentPosition(
				function (pos) { setWeatherByCoords(pos.coords.latitude, pos.coords.longitude, 'My location'); },
				function () { fetchWeather(defaultLat, defaultLon, 'London'); }
			);
		} else {
			fetchWeather(defaultLat, defaultLon, 'London');
		}
	}

	// Focus timer: configurable work/break + session log (localStorage)
	var TIMER_LOG_KEY = 'standalone_timer_log';
	var TIMER_SETTINGS_KEY = 'standalone_timer_settings';
	var timerDisplay = document.getElementById('home-timer-display');
	var timerPhaseEl = document.getElementById('home-timer-phase');
	var timerBtn = document.getElementById('home-timer-btn');
	var timerReset = document.getElementById('home-timer-reset');
	var timerLogBtn = document.getElementById('home-timer-log');
	var timerLogEntries = document.getElementById('home-timer-log-entries');
	var timerWorkInput = document.getElementById('home-timer-work-min');
	var timerBreakInput = document.getElementById('home-timer-break-min');
	var timerApplyBtn = document.getElementById('home-timer-apply');
	var timerSessionLabel = document.getElementById('home-timer-session-label');
	var timerInterval = null;
	var timerSeconds = 25 * 60;
	var timerRemaining = 25 * 60;
	var timerWorkMins = 25;
	var timerBreakMins = 5;
	var timerIsBreak = false;

	function formatTime(s) {
		var m = Math.floor(s / 60);
		var sec = s % 60;
		return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
	}
	function getTimerSettings() {
		try {
			var raw = localStorage.getItem(TIMER_SETTINGS_KEY);
			if (raw) {
				var o = JSON.parse(raw);
				if (o.work != null) timerWorkMins = Math.max(1, Math.min(120, parseInt(o.work, 10) || 25));
				if (o.break != null) timerBreakMins = Math.max(0, Math.min(30, parseInt(o.break, 10) || 0));
			}
		} catch (e) {}
	}
	function saveTimerSettings() {
		try { localStorage.setItem(TIMER_SETTINGS_KEY, JSON.stringify({ work: timerWorkMins, break: timerBreakMins })); } catch (e) {}
	}
	function applyTimerSpan() {
		var w = Math.max(1, Math.min(120, parseInt(timerWorkInput && timerWorkInput.value, 10) || 25));
		var b = Math.max(0, Math.min(30, parseInt(timerBreakInput && timerBreakInput.value, 10) || 0));
		timerWorkMins = w;
		timerBreakMins = b;
		saveTimerSettings();
		if (timerWorkInput) timerWorkInput.value = w;
		if (timerBreakInput) timerBreakInput.value = b;
		if (!timerInterval) {
			timerIsBreak = false;
			timerSeconds = w * 60;
			timerRemaining = w * 60;
			updateTimerDisplay();
			updatePhaseLabel();
		}
	}

	function getTimerLog() {
		try {
			var raw = localStorage.getItem(TIMER_LOG_KEY);
			return raw ? JSON.parse(raw) : [];
		} catch (e) { return []; }
	}
	function saveTimerLog(log) {
		try { localStorage.setItem(TIMER_LOG_KEY, JSON.stringify(log.slice(-100))); } catch (e) {}
	}
	function addTimerLogEntry(mins, label) {
		var log = getTimerLog();
		log.unshift({
			date: new Date().toISOString(),
			mins: mins,
			label: label || ''
		});
		saveTimerLog(log);
		renderTimerLog();
	}
	function renderTimerLog() {
		if (!timerLogEntries) return;
		var log = getTimerLog();
		timerLogEntries.innerHTML = log.slice(0, 15).map(function (e) {
			var d = new Date(e.date);
			var when = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			return '<li>' + when + ' — ' + (e.mins || 25) + ' min' + (e.label ? ' · ' + e.label : '') + '</li>';
		}).join('') || '<li class="text-gray-500 dark:text-gray-500">No sessions yet. Click Log session or finish a focus block.</li>';
	}

	function updateTimerDisplay() {
		if (timerDisplay) timerDisplay.textContent = formatTime(timerRemaining);
	}
	function updatePhaseLabel() {
		if (timerPhaseEl) timerPhaseEl.textContent = timerIsBreak ? 'Break' : 'Work';
	}

	function tick() {
		timerRemaining--;
		updateTimerDisplay();
		if (timerRemaining <= 0) {
			if (timerIsBreak) {
				timerIsBreak = false;
				timerSeconds = timerWorkMins * 60;
				timerRemaining = timerSeconds;
				updatePhaseLabel();
				if (typeof document.hidden !== 'undefined' && !document.hidden) {
					try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2').play(); } catch (e) {}
				}
				return;
			}
			var minsLogged = Math.round((timerWorkMins * 60 - 0) / 60) || timerWorkMins;
			addTimerLogEntry(minsLogged, timerSessionLabel && timerSessionLabel.value ? timerSessionLabel.value.trim() : '');
			if (timerSessionLabel) timerSessionLabel.value = '';
			if (timerBreakMins > 0) {
				timerIsBreak = true;
				timerSeconds = timerBreakMins * 60;
				timerRemaining = timerSeconds;
				updatePhaseLabel();
				if (typeof document.hidden !== 'undefined' && !document.hidden) {
					try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2').play(); } catch (e) {}
				}
			} else {
				clearInterval(timerInterval);
				timerInterval = null;
				if (timerBtn) {
					timerBtn.textContent = 'Start';
					timerBtn.dataset.running = '0';
				}
			}
		}
	}

	if (timerApplyBtn) {
		timerApplyBtn.addEventListener('click', applyTimerSpan);
	}
	getTimerSettings();
	if (timerWorkInput) timerWorkInput.value = timerWorkMins;
	if (timerBreakInput) timerBreakInput.value = timerBreakMins;
	timerSeconds = timerWorkMins * 60;
	timerRemaining = timerSeconds;
	updatePhaseLabel();

	if (timerBtn && timerDisplay) {
		timerBtn.addEventListener('click', function () {
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
				timerBtn.textContent = 'Resume';
				timerBtn.dataset.running = '0';
			} else {
				timerBtn.textContent = 'Pause';
				timerBtn.dataset.running = '1';
				timerInterval = setInterval(tick, 1000);
			}
		});
	}
	if (timerReset && timerDisplay) {
		timerReset.addEventListener('click', function () {
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
			timerIsBreak = false;
			timerSeconds = timerWorkMins * 60;
			timerRemaining = timerSeconds;
			updateTimerDisplay();
			updatePhaseLabel();
			if (timerBtn) {
				timerBtn.textContent = 'Start';
				timerBtn.dataset.running = '0';
			}
		});
	}
	if (timerLogBtn) {
		timerLogBtn.addEventListener('click', function () {
			var elapsed = timerIsBreak ? 0 : (timerWorkMins * 60 - timerRemaining);
			var mins = Math.round(elapsed / 60) || (timerIsBreak ? timerBreakMins : timerWorkMins);
			var label = timerSessionLabel && timerSessionLabel.value ? timerSessionLabel.value.trim() : '';
			addTimerLogEntry(mins, label);
			if (timerSessionLabel) timerSessionLabel.value = '';
		});
	}
	updateTimerDisplay();
	renderTimerLog();

	// To-do list (localStorage)
	var TODO_KEY = 'standalone_todo_list';
	var todoInput = document.getElementById('home-todo-input');
	var todoAdd = document.getElementById('home-todo-add');
	var todoList = document.getElementById('home-todo-list');

	function getTodos() {
		try {
			var raw = localStorage.getItem(TODO_KEY);
			return raw ? JSON.parse(raw) : [];
		} catch (e) { return []; }
	}
	function setTodos(todos) {
		try { localStorage.setItem(TODO_KEY, JSON.stringify(todos)); } catch (e) {}
	}
	function renderTodos() {
		if (!todoList) return;
		var todos = getTodos();
		todoList.innerHTML = todos.map(function (t, i) {
			var done = t.done ? ' line-through opacity-70' : '';
			return '<li class="flex items-center gap-2 group"><input type="checkbox" class="home-todo-check rounded border-gray-400" data-i="' + i + '"' + (t.done ? ' checked' : '') + '><span class="flex-1 min-w-0' + done + '">' + (t.text || '').replace(/</g, '&lt;') + '</span><button type="button" class="home-todo-del text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 text-xs" data-i="' + i + '" aria-label="Delete">✕</button></li>';
		}).join('') || '<li class="text-gray-500 dark:text-gray-500 text-xs">No tasks. Add one above.</li>';
		todoList.querySelectorAll('.home-todo-check').forEach(function (el) {
			el.addEventListener('change', function () {
				var idx = parseInt(el.dataset.i, 10);
				var list = getTodos();
				if (list[idx]) {
					list[idx].done = el.checked;
					setTodos(list);
					renderTodos();
				}
			});
		});
		todoList.querySelectorAll('.home-todo-del').forEach(function (el) {
			el.addEventListener('click', function () {
				var idx = parseInt(el.dataset.i, 10);
				var list = getTodos().filter(function (_, i) { return i !== idx; });
				setTodos(list);
				renderTodos();
			});
		});
	}
	if (todoAdd && todoInput) {
		todoAdd.addEventListener('click', function () {
			var text = (todoInput.value || '').trim();
			if (!text) return;
			var list = getTodos();
			list.push({ text: text, done: false });
			setTodos(list);
			todoInput.value = '';
			renderTodos();
		});
	}
	if (todoInput) {
		todoInput.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') todoAdd && todoAdd.click();
		});
	}

	// Export to-dos as markdown file
	var todoExportMd = document.getElementById('home-todo-export-md');
	if (todoExportMd) {
		todoExportMd.addEventListener('click', function () {
			var todos = getTodos();
			var lines = ['# To-do', ''];
			todos.forEach(function (t) {
				lines.push('- [' + (t.done ? 'x' : ' ') + '] ' + (t.text || '').replace(/\n/g, ' '));
			});
			var md = lines.join('\n');
			var d = new Date();
			var name = 'todos-' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + '.md';
			try {
				var blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
				var url = URL.createObjectURL(blob);
				var a = document.createElement('a');
				a.href = url;
				a.download = name;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			} catch (e) {}
		});
	}

	renderTodos();
})();

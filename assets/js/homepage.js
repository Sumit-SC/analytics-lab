/**
 * Homepage: quotes (Quotable, Animechan, static lists). Quote image matches source when possible (e.g. Reply 1988 → Reply 1988 image).
 * Image: curated map (Wikimedia/free) per source; fallback Picsum seeded by source name.
 */
(function () {
	'use strict';

	var QUOTE_CATEGORY_KEY = 'home_quote_category';
	var QUOTE_IMAGE_MODE_KEY = 'home_quote_image_mode'; // 'live' or 'local'
	// With "Use live posters" ON: images from API (Jikan for anime, OMDb for movie/series) when available, else from quote.images in JSON. OFF: local map + embedded quote.images only.

	// Local quote DB: faster than APIs, no broken endpoints. Loaded from assets/data/quotes-db.json
	var quotesDb = null;
	var lastQuoteFromDb = null; // { quote: { text, author, source, images }, category } for wallpaper refresh
	var currentQuoteCategory = null; // actual category of the currently displayed quote (for image-refresh fetch)

	// OMDb: poster fetched via backend proxy so the API key stays secret. Set window.OMDB_PROXY_URL to your proxy origin if API is on another host (e.g. https://your-omdb-proxy.vercel.app).

	// Source/author → image URL(s). Same source = same picture. String = one URL (used twice for cycle), or [url1, url2].
	// Wikimedia/Wikipedia posters for K-drama, movies, anime, books, leaders. OMDB/Jikan used at runtime when available.
	var QUOTE_IMAGE_MAP = {
		'Reply 1988': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d8/TVN%27s_Reply_1988_%28%EC%9D%91%EB%8B%B5%ED%95%98%EB%9D%BC_1988%29_poster.jpg/800px-TVN%27s_Reply_1988_%28%EC%9D%91%EB%8B%B5%ED%95%98%EB%9D%BC_1988%29_poster.jpg',
		'Reply 1997': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d8/TVN%27s_Reply_1988_%28%EC%9D%91%EB%8B%B5%ED%95%98%EB%9D%BC_1988%29_poster.jpg/800px-TVN%27s_Reply_1988_%28%EC%9D%91%EB%8B%B5%ED%95%98%EB%9D%BC_1988%29_poster.jpg',
		'Itaewon Class': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/Itaewon_Class.jpg/800px-Itaewon_Class.jpg',
		'Goblin': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Guardian_The_Lonely_and_Great_God_poster.jpg/800px-Guardian_The_Lonely_and_Great_God_poster.jpg',
		'Guardian: The Lonely and Great God': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Guardian_The_Lonely_and_Great_God_poster.jpg/800px-Guardian_The_Lonely_and_Great_God_poster.jpg',
		'Crash Landing on You': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/Crash_Landing_on_You_poster.jpg/800px-Crash_Landing_on_You_poster.jpg',
		'Start-Up': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Guardian_The_Lonely_and_Great_God_poster.jpg/800px-Guardian_The_Lonely_and_Great_God_poster.jpg',
		'Vincenzo': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/Itaewon_Class.jpg/800px-Itaewon_Class.jpg',
		'Squid Game': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/dd/Squid_Game.jpg/800px-Squid_Game.jpg',
		'Casablanca': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/CasablancaPoster.jpg/800px-CasablancaPoster.jpg',
		'Star Wars': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6c/Star_Wars_Logo.svg/800px-Star_Wars_Logo.svg.png',
		'Jaws': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/JAWS_Movie_poster.jpg/800px-JAWS_Movie_poster.jpg',
		'The Godfather': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/af/The_Godfather%2C_The_Game.jpg/800px-The_Godfather%2C_The_Game.jpg',
		'Finding Nemo': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Finding_Nemo.jpg/800px-Finding_Nemo.jpg',
		'The Wizard of Oz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/The_Wizard_of_Oz_Movie_Poster.jpg/800px-The_Wizard_of_Oz_Movie_Poster.jpg',
		'The Terminator': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/76/Terminator1984movieposter.jpg/800px-Terminator1984movieposter.jpg',
		'A Few Good Men': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/A_Few_Good_Men_poster.jpg/800px-A_Few_Good_Men_poster.jpg',
		'Forrest Gump': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/67/Forrest_Gump_poster.jpg/800px-Forrest_Gump_poster.jpg',
		'Titanic': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/22/Titanic_poster.jpg/800px-Titanic_poster.jpg',
		'Taxi Driver': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/33/Taxi_Driver_poster.JPG/800px-Taxi_Driver_poster.JPG',
		'The Dark Knight': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8a/Dark_Knight.jpg/800px-Dark_Knight.jpg',
		'Toy Story': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/13/Toy_Story.jpg/800px-Toy_Story.jpg',
		'The Sixth Sense': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/The_Sixth_Sense_poster.jpg/800px-The_Sixth_Sense_poster.jpg',
		'Apollo 13': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/27/Apollo_13_movie_poster.jpg/800px-Apollo_13_movie_poster.jpg',
		'The Lord of the Rings': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Ringstrilogyposter.jpg/800px-Ringstrilogyposter.jpg',
		'There Will Be Blood': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/da/There_Will_Be_Blood_Poster.jpg/800px-There_Will_Be_Blood_Poster.jpg',
		'The Lord of the Rings': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Ringstrilogyposter.jpg/800px-Ringstrilogyposter.jpg',
		'Jerry Maguire': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/Jerry_Maguire_movie_poster.jpg/800px-Jerry_Maguire_movie_poster.jpg',
		'Dirty Dancing': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/42/Dirty_Dancing_poster.jpg/800px-Dirty_Dancing_poster.jpg',
		'Sherlock Holmes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Arthur_Conan_Doyle_by_Newell_Conan_Doyle.jpg/800px-Arthur_Conan_Doyle_by_Newell_Conan_Doyle.jpg',
		'One Piece': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg/800px-One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg',
		'Code Geass': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5b/Code_Geass_Promo.jpg/800px-Code_Geass_Promo.jpg',
		'Death Note': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6f/Death_Note_Vol_1.jpg/800px-Death_Note_Vol_1.jpg',
		'Gurren Lagann': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6a/Gurren_Lagann_DVD_1.jpg/800px-Gurren_Lagann_DVD_1.jpg',
		'Naruto': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/94/NarutoCoverTankobon1.jpg/800px-NarutoCoverTankobon1.jpg',
		'Berserk': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Berserk_volume_1.jpg/800px-Berserk_volume_1.jpg',
		'Fullmetal Alchemist': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Fullmetal_Alchemist_vol1.jpg/800px-Fullmetal_Alchemist_vol1.jpg',
		'Dragon Ball Z': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/ca/Dragon_Ball_Z_Logo.svg/800px-Dragon_Ball_Z_Logo.svg.png',
		"Kuroko's Basketball": 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4a/Kuroko_no_Basuke_volume_1_cover.jpg/800px-Kuroko_no_Basuke_volume_1_cover.jpg',
		'Mob Psycho 100': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Mob_Psycho_100_volume_1_cover.jpg/800px-Mob_Psycho_100_volume_1_cover.jpg',
		'Claymore': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4a/Claymore_vol1.jpg/800px-Claymore_vol1.jpg',
		'One Punch Man': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2c/One_Punch_Man_volume_1_cover.jpg/800px-One_Punch_Man_volume_1_cover.jpg',
		'Attack on Titan': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/Shingeki_no_Kyojin_manga_volume_1.jpg/800px-Shingeki_no_Kyojin_manga_volume_1.jpg',
		'The Little Prince': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/The_Little_Prince_%28book_cover%29.jpg/800px-The_Little_Prince_%28book_cover%29.jpg',
		'Harry Potter': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/Harry_Potter_Word_Bubble.svg/800px-Harry_Potter_Word_Bubble.svg.png',
		'The Great Gatsby': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/The_Great_Gatsby_Cover_1925_Retouched.jpg/800px-The_Great_Gatsby_Cover_1925_Retouched.jpg',
		'Hamlet': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Edmund_Kean_as_Hamlet.jpg/800px-Edmund_Kean_as_Hamlet.jpg',
		'1984': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/1984first.jpg/800px-1984first.jpg',
		'Steve Jobs': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/800px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg',
		'Albert Einstein': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/800px-Albert_Einstein_Head.jpg',
		'Einstein': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/800px-Albert_Einstein_Head.jpg',
		'Plutarch': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Plutarch_engraving.jpg/800px-Plutarch_engraving.jpg',
		'Nelson Mandela': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Nelson_Mandela-2008_%28edit%29.jpg/800px-Nelson_Mandela-2008_%28edit%29.jpg',
		'Mahatma Gandhi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Mahatma-Gandhi%2C_studio%2C_1931.jpg/800px-Mahatma-Gandhi%2C_studio%2C_1931.jpg',
		'Martin Luther King Jr.': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Martin_Luther_King%2C_Jr..jpg/800px-Martin_Luther_King%2C_Jr..jpg',
		'Abraham Lincoln': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Abraham_Lincoln_O-77_matte_collodion_print.jpg/800px-Abraham_Lincoln_O-77_matte_collodion_print.jpg',
		'Winston Churchill': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Sir_Winston_Churchill_-_19086236948.jpg/800px-Sir_Winston_Churchill_-_19086236948.jpg',
		'Theodore Roosevelt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/President_Roosevelt_-_Pach_Bros.jpg/800px-President_Roosevelt_-_Pach_Bros.jpg',
		'Ralph Waldo Emerson': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Ralph_Waldo_Emerson_ca1857_retouched.jpg/800px-Ralph_Waldo_Emerson_ca1857_retouched.jpg',
		'John Lennon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/John_Lennon_1969_%28cropped%29.jpg/800px-John_Lennon_1969_%28cropped%29.jpg',
		'Aristotle': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Aristotle_Altemps_Inv8575.jpg/800px-Aristotle_Altemps_Inv8575.jpg',
		'Oscar Wilde': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Oscar_Wilde_portrait.jpg/800px-Oscar_Wilde_portrait.jpg',
		'Maya Angelou': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Angelou_at_Clinton_inauguration_%28cropped_2%29.jpg/800px-Angelou_at_Clinton_inauguration_%28cropped_2%29.jpg',
		'Franklin D. Roosevelt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/FDR_1944_Color_Portrait.jpg/800px-FDR_1944_Color_Portrait.jpg',
		'Henry Ford': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Henry_ford_1919.jpg/800px-Henry_ford_1919.jpg',
		'George Orwell': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/George_Orwell_press_photo.jpg/800px-George_Orwell_press_photo.jpg',
		'J.K. Rowling': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/J._K._Rowling_2010.jpg/800px-J._K._Rowling_2010.jpg',
		'J.R.R. Tolkien': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/J._R._R._Tolkien%2C_1916.jpg/800px-J._R._R._Tolkien%2C_1916.jpg',
		'Charles Dickens': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Dickens_Gurney_head.jpg/800px-Dickens_Gurney_head.jpg',
		'William Shakespeare': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakespeare.jpg/800px-Shakespeare.jpg',
		'Robert Frost': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Robert_Frost_NYWTS.jpg/800px-Robert_Frost_NYWTS.jpg',
		'F. Scott Fitzgerald': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/F_Scott_Fitzgerald_1921.jpg/800px-F_Scott_Fitzgerald_1921.jpg',
		'Antoine de Saint-Exupéry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Saint-Exup%C3%A9ry_2.jpg/800px-Saint-Exup%C3%A9ry_2.jpg',
		'Socrates': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Socrates_Louvre.jpg/800px-Socrates_Louvre.jpg',
		'Lao Tzu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Laozi_in_taiji_circle.svg/800px-Laozi_in_taiji_circle.svg.png',
		'Buddha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Guanyin_in_Ngong_Ping_360.jpg/800px-Guanyin_in_Ngong_Ping_360.jpg',
		'Tony Robbins': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Tony_Robbins_%282017%29.jpg/800px-Tony_Robbins_%282017%29.jpg',
		'George Eliot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/George_Eliot%2C_by_Frederic_W._Burton.jpg/800px-George_Eliot%2C_by_Frederic_W._Burton.jpg'
	};

	// Cache for dynamically discovered images from Wikipedia / Jikan (keyed by source name)
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

	// Try to fetch an anime poster from Jikan (MyAnimeList API, no key, CORS-friendly)
	// bypassCache: when true (e.g. user clicked "change image"), skip cache and re-fetch from API
	function fetchJikanImage(animeTitle, cb, bypassCache) {
		if (!animeTitle || !animeTitle.trim()) {
			cb(null);
			return;
		}
		var key = 'anime:' + animeTitle.trim();
		if (!bypassCache && quoteImageCache[key] && quoteImageCache[key].url) {
			cb(quoteImageCache[key].url);
			return;
		}
		var url = 'https://api.jikan.moe/v4/anime?q=' + encodeURIComponent(animeTitle.trim()) + '&limit=1';
		fetch(url)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				if (!data || !data.data || !data.data[0] || !data.data[0].images) {
					cb(null);
					return;
				}
				var imgData = data.data[0].images;
				var src = (imgData.jpg && (imgData.jpg.large_image_url || imgData.jpg.image_url)) ||
					(imgData.webp && (imgData.webp.large_image_url || imgData.webp.image_url)) || '';
				if (src) {
					quoteImageCache[key] = { url: src };
					saveQuoteImageCache();
					cb(src);
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
	var QUOTES_BOLLYWOOD = [
		{ text: 'Mogambo khush hua.', attr: 'Mr. India' },
		{ text: 'Kitne aadmi the?', attr: 'Sholay' },
		{ text: 'Bade bade deshon mein aisi chhoti chhoti baatein hoti rehti hain.', attr: 'Dilwale Dulhania Le Jayenge' },
		{ text: 'Ek chutki sindoor ki keemat tum kya jaano Ramesh babu.', attr: 'Om Shanti Om' },
		{ text: 'Don ko pakadna mushkil hi nahi, namumkin hai.', attr: 'Don' }
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
		if (url && url.indexOf('http') === 0) {
			bg.style.backgroundImage = 'url(' + url + ')';
			return;
		}
		// Fallback: Picsum with seed from source so same source = same image
		var s = (source || (seedOrSource && String(seedOrSource)) || Date.now()).toString().replace(/\W/g, '') || String(Date.now());
		bg.style.backgroundImage = 'url(https://picsum.photos/seed/' + s + '/800/400)';
		// Then try to upgrade to a Wikipedia image for this source (async override)
		if (source) {
			fetchWikipediaImage(source, function (foundUrl) {
				if (foundUrl && bg && bg.style) bg.style.backgroundImage = 'url(' + foundUrl + ')';
			});
		}
	}

	function useFallback(category) {
		lastQuoteFromDb = null;
		currentQuoteCategory = category;
		var list = QUOTES_FALLBACK;
		if (category === 'movie') list = QUOTES_MOVIE;
		if (category === 'kdrama') list = QUOTES_KDRAMA;
		if (category === 'leaders') list = QUOTES_LEADERS;
		if (category === 'bollywood') list = QUOTES_BOLLYWOOD || QUOTES_FALLBACK;
		if (category === 'life' || category === 'tv_show' || category === 'meme') {
			var fromDb = pickFromLocalDb(category);
			if (fromDb) {
				applyQuoteFromDb(fromDb, category);
				return;
			}
		}
		var q = pick(list);
		setQuoteUI(q.text, q.attr, '');
		setQuoteImage(null, q.attr);
	}

	// Pick a random quote from local DB for category; return null if DB not ready or category empty
	function pickFromLocalDb(category) {
		if (!quotesDb || typeof quotesDb[category] !== 'object' || !quotesDb[category].length) return null;
		return pick(quotesDb[category]);
	}

	// Resolve 1–2 image URLs: prefer quote.images from DB (including Picsum), then QUOTE_IMAGE_MAP by source/author
	function getSourceImages(quote) {
		var urls = quote.images;
		if (Array.isArray(urls) && urls.length > 0) {
			var first = urls[0] && String(urls[0]).trim();
			if (first && first.indexOf('http') === 0) {
				return urls.length >= 2 && urls[1] && String(urls[1]).trim().indexOf('http') === 0
					? [first, String(urls[1]).trim()] : [first, first];
			}
		}
		var src = (quote.source && quote.source.trim()) || '';
		var attr = (quote.author && quote.author.trim()) || '';
		var fromMap = (src && QUOTE_IMAGE_MAP[src]) || (attr && QUOTE_IMAGE_MAP[attr]);
		if (fromMap) {
			return Array.isArray(fromMap) ? fromMap : [fromMap, fromMap];
		}
		return null;
	}

	function getImageMode() {
		try {
			// Default to 'live' so poster images load from API (OMDb/Jikan) or embedded JSON images
			return localStorage.getItem(QUOTE_IMAGE_MODE_KEY) || 'live';
		} catch (e) {
			return 'live';
		}
	}

	function isLivePostersEnabled() {
		return getImageMode() !== 'local';
	}

	function getProxyBase() {
		var base = (typeof window !== 'undefined' && window.OMDB_PROXY_URL) ? String(window.OMDB_PROXY_URL).replace(/\/$/, '') : '';
		return base;
	}

	// Fetch poster via backend proxy (key never sent to client). Proxy returns { poster: url, usage: { dailyCount, dailyLimit } } or { poster: null }.
	// First hit per title is cached in quoteImageCache; tap on wallpaper button cycles lastQuoteFromDb.quote.images (OMDb returns one poster, so we store [url, url]).
	// type: 'movie' | 'series' | omit. bypassCache: when true (e.g. user clicked "change image"), re-fetch from API.
	// Set window.OMDB_PROXY_URL if proxy is on another host.
	function fetchOMDBPoster(title, cb, type, bypassCache) {
		if (!title || !title.trim()) { cb(null); return; }
		var key = title.trim();
		if (!bypassCache && quoteImageCache[key] && quoteImageCache[key].url) {
			cb(quoteImageCache[key].url);
			return;
		}
		var base = getProxyBase();
		var source = 'website';
		try {
			if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname.indexOf('vercel.app') !== -1) source = 'vercel_app';
		} catch (e) {}
		var apiUrl = (base || '') + '/api/omdb?t=' + encodeURIComponent(title.trim()) + (type === 'movie' || type === 'series' ? '&type=' + type : '') + '&source=' + encodeURIComponent(source);
		fetch(apiUrl)
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (data) {
				var poster = data && data.poster && data.poster.indexOf && data.poster.indexOf('http') === 0 ? data.poster : null;
				if (poster) {
					quoteImageCache[key] = { url: poster, ts: Date.now() };
					saveQuoteImageCache();
				}
				cb(poster);
			})
			.catch(function () { cb(null); });
	}

	// Apply a quote from the local DB: resolve source-accurate images (Jikan for anime, OMDB for movie if key set, else map/JSON)
	function applyQuoteFromDb(quote, category) {
		currentQuoteCategory = category === 'movies' ? 'movie' : category;
		var meta = (quote.source && quote.source.trim()) ? 'From: ' + quote.source.trim() : '';
		setQuoteUI(quote.text, quote.author || '', meta);
		var bg = document.getElementById('home-quote-bg');
		var resolved = getSourceImages(quote);
		// Keep a copy so we can set .images after async fetch; wallpaper refresh uses lastQuoteFromDb.quote.images
		lastQuoteFromDb = { quote: { text: quote.text, author: quote.author, source: quote.source, images: quote.images && quote.images.length ? quote.images : (resolved || []) }, category: category };

		function setBgAndImages(urls) {
			var firstUrl = urls && urls.length > 0 && urls[0] && String(urls[0]).trim();
			if (firstUrl && firstUrl.indexOf('http') === 0 && bg) {
				lastQuoteFromDb.quote.images = urls.length >= 2 && urls[1] ? [urls[0], urls[1]] : [urls[0], urls[0]];
				bg.style.backgroundImage = 'url(' + firstUrl + ')';
			} else {
				lastQuoteFromDb.quote.images = [];
				setQuoteImage(null, quote.author || quote.source);
			}
		}

		var livePosters = isLivePostersEnabled();

		if (livePosters && category === 'anime' && quote.source && quote.source.trim()) {
			setBgAndImages(resolved); // show DB/map image immediately
			fetchJikanImage(quote.source.trim(), function (url) {
				if (url) setBgAndImages([url, url]);
				else setBgAndImages(resolved);
			});
			return;
		}
		// OMDb for posters/wallpapers via backend proxy (movies, K-drama, Bollywood)
		if (livePosters && quote.source && quote.source.trim()) {
			var omdbType = null;
			var tryOmdb = false;
			if (category === 'movies' || category === 'movie') {
				omdbType = 'movie';
				tryOmdb = true;
			} else if (category === 'kdrama') {
				omdbType = 'series';
				tryOmdb = true;
			} else if (category === 'bollywood') {
				omdbType = 'movie';
				tryOmdb = true;
			}
			if (tryOmdb) {
				setBgAndImages(resolved); // show DB/map image immediately
				fetchOMDBPoster(quote.source.trim(), function (url) {
					if (url) setBgAndImages([url, url]);
					else setBgAndImages(resolved);
				}, omdbType);
				return;
			}
		}
		setBgAndImages(resolved);
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
		var actualCategory = category;
		
		// Handle simplified categories: all + random = pick one category at random; movies -> movie
		if (category === 'all' || category === 'random') {
			var allowed = ['kdrama', 'anime', 'movie', 'books', 'tv_show', 'leaders', 'meme', 'bollywood', 'life'];
			var choices = [];
			if (quotesDb && typeof quotesDb === 'object') {
				for (var i = 0; i < allowed.length; i++) {
					var k = allowed[i];
					if (Array.isArray(quotesDb[k]) && quotesDb[k].length > 0) choices.push(k);
				}
			}
			if (choices.length === 0) choices = ['anime', 'books', 'leaders', 'movie', 'kdrama', 'bollywood', 'life'];
			actualCategory = choices[Math.floor(Math.random() * choices.length)];
		} else if (category === 'movies') {
			actualCategory = 'movie';
		} else {
			actualCategory = category;
		}

		setQuoteLoading(true);

		// Prefer local DB (fast, no broken APIs)
		var fromDb = pickFromLocalDb(actualCategory);
		if (fromDb) {
			applyQuoteFromDb(fromDb, category); // Pass original category for OMDb logic
			setQuoteLoading(false);
			return;
		}

		if (actualCategory === 'anime') {
			currentQuoteCategory = 'anime';
			fetchAnimechan(function (q) {
				setQuoteLoading(false);
				if (q) {
					setQuoteUI(q.text, q.attr, q.meta);
					var animeName = (q.meta || '').replace(/^From:\s*/i, '').trim() || q.attr || '';
					// Prefer proper anime posters from Jikan; fall back to normal quote image logic
					if (animeName) {
						fetchJikanImage(animeName, function (url) {
							if (url) {
								var bg = document.getElementById('home-quote-bg');
								if (bg) bg.style.backgroundImage = 'url(' + url + ')';
							} else {
								setQuoteImage(null, animeName || q.attr);
							}
						});
					} else {
						setQuoteImage(null, q.attr);
					}
				} else {
					useFallback('all');
				}
			});
			return;
		}

		if (category === 'books') {
			currentQuoteCategory = 'books';
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

		// All other categories from local DB or static fallback: movie, kdrama, leaders, bollywood, life, tv_show, meme
		if (actualCategory === 'movie' || actualCategory === 'kdrama' || actualCategory === 'leaders' || actualCategory === 'bollywood' || actualCategory === 'life' || actualCategory === 'tv_show' || actualCategory === 'meme') {
			useFallback(actualCategory);
			setQuoteLoading(false);
			return;
		}

		useFallback('all');
		setQuoteLoading(false);
	}

	// Quote: category select, image-mode toggle, refresh buttons (quote + wallpaper), load initial
	var quoteCategoryEl = document.getElementById('home-quote-category');
	var quoteImageModeEl = document.getElementById('home-quote-image-live');
	var quoteRefreshBtn = document.getElementById('home-quote-refresh');
	var quoteBgRefreshBtn = document.getElementById('home-quote-bg-refresh');
	var quotePinterestBtn = document.getElementById('home-quote-pinterest');

	function getCategory() {
		if (quoteCategoryEl) return quoteCategoryEl.value || 'kdrama';
		try { return localStorage.getItem(QUOTE_CATEGORY_KEY) || 'kdrama'; } catch (e) { return 'kdrama'; }
	}

	function saveCategory(cat) {
		try { localStorage.setItem(QUOTE_CATEGORY_KEY, cat); } catch (e) {}
	}

	if (quoteCategoryEl) {
		try {
			var saved = localStorage.getItem(QUOTE_CATEGORY_KEY);
			quoteCategoryEl.value = saved || 'kdrama';
		} catch (e) {
			quoteCategoryEl.value = 'kdrama';
		}
		quoteCategoryEl.addEventListener('change', function () {
			saveCategory(quoteCategoryEl.value);
			loadQuote(quoteCategoryEl.value);
		});
	}

	if (quoteImageModeEl) {
		// Initialize from stored mode
		quoteImageModeEl.checked = isLivePostersEnabled();
		quoteImageModeEl.addEventListener('change', function () {
			try {
				localStorage.setItem(QUOTE_IMAGE_MODE_KEY, quoteImageModeEl.checked ? 'live' : 'local');
			} catch (e) {}
			// Reload current category so images update without changing text category
			loadQuote(getCategory());
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
			// Prefer stored source (show/movie name) so we always hit the right API
			var src = (lastQuoteFromDb && lastQuoteFromDb.quote && lastQuoteFromDb.quote.source)
				? lastQuoteFromDb.quote.source.trim()
				: getCurrentQuoteSource();
			var cat = currentQuoteCategory || (lastQuoteFromDb && lastQuoteFromDb.category) || getCategory();
			if (cat === 'movies') cat = 'movie';

			function setFetchedImages(urls) {
				if (!urls || urls.length === 0) return;
				var imgs = urls.length >= 2 ? [urls[0], urls[1]] : [urls[0], urls[0]];
				if (bg) bg.style.backgroundImage = 'url(' + imgs[0] + ')';
				if (lastQuoteFromDb) {
					lastQuoteFromDb.quote.images = imgs;
				} else {
					var quoteEl = document.getElementById('home-quote-text');
					var attrEl = document.getElementById('home-quote-attr');
					lastQuoteFromDb = {
						quote: {
							text: quoteEl ? quoteEl.textContent : '',
							author: attrEl ? (attrEl.textContent || '').replace(/^—\s*/, '') : '',
							source: src || '',
							images: imgs
						},
						category: cat
					};
				}
			}

			function setFetchedImagesAndPool(pool) {
				if (!pool || pool.length === 0) return;
				var chosen = pool[Math.floor(Math.random() * pool.length)];
				var imgs = pool.length >= 2 ? [pool[0], pool[1]] : [chosen, chosen];
				if (bg) bg.style.backgroundImage = 'url(' + chosen + ')';
				if (lastQuoteFromDb) {
					lastQuoteFromDb.quote.images = pool.length >= 2 ? pool : [chosen, chosen];
				} else {
					var quoteEl = document.getElementById('home-quote-text');
					var attrEl = document.getElementById('home-quote-attr');
					lastQuoteFromDb = {
						quote: { text: quoteEl ? quoteEl.textContent : '', author: attrEl ? (attrEl.textContent || '').replace(/^—\s*/, '') : '', source: src || '', images: imgs },
						category: cat
					};
				}
			}

			function fallbackCycleOrPicsum() {
				if (lastQuoteFromDb && lastQuoteFromDb.quote.images && lastQuoteFromDb.quote.images.length > 0) {
					var imgs = lastQuoteFromDb.quote.images;
					var currentUrl = (bg.style.backgroundImage || '').replace(/^url\(["']?|["']?\)$/g, '');
					var idx = -1;
					for (var i = 0; i < imgs.length; i++) {
						if (currentUrl.indexOf(imgs[i]) !== -1) { idx = i; break; }
					}
					if (idx === -1) idx = 0;
					var nextIdx = (idx + 1) % imgs.length;
					bg.style.backgroundImage = 'url(' + imgs[nextIdx] + ')';
				} else {
					var seed = (src || 'quote') + '-' + Date.now();
					seed = seed.replace(/\W/g, '') || Date.now();
					bg.style.backgroundImage = 'url(https://picsum.photos/seed/' + seed + '/800/400)';
				}
			}

			// Anime: re-fetch from Jikan (bypass cache so "change image" gets a fresh request)
			if (src && cat === 'anime') {
				fetchJikanImage(src, function (url) {
					if (url) setFetchedImages([url, url]);
					else fallbackCycleOrPicsum();
				}, true);
				return;
			}

			// Movie / K-drama / Bollywood / TV show: OMDb poster only (first API)
			if (src && (cat === 'movie' || cat === 'kdrama' || cat === 'bollywood' || cat === 'tv_show')) {
				if (!getProxyBase()) {
					fallbackCycleOrPicsum();
					return;
				}
				var omdbType = (cat === 'kdrama' || cat === 'tv_show') ? 'series' : 'movie';
				fetchOMDBPoster(src, function (posterUrl) {
					if (posterUrl) setFetchedImages([posterUrl, posterUrl]);
					else fallbackCycleOrPicsum();
				}, omdbType, true);
				return;
			}

			fallbackCycleOrPicsum();
		});
	}

	if (quotePinterestBtn) {
		quotePinterestBtn.addEventListener('click', function () {
			var src = getCurrentQuoteSource() || '';
			var q = src ? (src + ' quote') : 'inspirational quote';
			try {
				window.open('https://www.pinterest.com/search/pins/?q=' + encodeURIComponent(q), '_blank', 'noopener');
			} catch (e) {}
		});
	}

	// Load local quote DB then show initial quote (faster than APIs)
	fetch('./assets/data/quotes-db.json')
		.then(function (r) { return r.ok ? r.json() : null; })
		.then(function (data) {
			if (data && typeof data === 'object') {
				quotesDb = data;
				if (quotesDb.meta) delete quotesDb.meta;
			}
			loadQuote(getCategory());
		})
		.catch(function () {
			loadQuote(getCategory());
		});

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

	// Weather (Open-Meteo): saved location, search city, or use my location. Runs when DOM is ready.
	var WEATHER_LOCATION_KEY = 'standalone_weather_location';
	var defaultLat = 51.5074, defaultLon = -0.1278;
	var lastDailyForecast = null;
	var lastWeatherLat = null, lastWeatherLon = null;

	function initWeather() {
		var weatherEl = document.getElementById('home-weather');
		var weatherCity = document.getElementById('home-weather-city');
		var weatherSearch = document.getElementById('home-weather-search');
		var weatherSetBtn = document.getElementById('home-weather-set');
		var weatherMyLocBtn = document.getElementById('home-weather-mylocation');
		var weatherForecastPanel = document.getElementById('home-weather-forecast-panel');
		if (!weatherEl) return;
		weatherEl.innerHTML = '<span class="text-sm opacity-70">Loading…</span>';
		if (weatherCity) weatherCity.textContent = '—';

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

	function weatherCodeToDesc(code) {
		if (code >= 80) return 'Cloudy';
		if (code >= 61) return 'Rain';
		if (code >= 51) return 'Drizzle';
		if (code >= 3) return 'Cloudy';
		return code === 1 ? 'Clear' : 'Clear';
	}
	function aqiLabel(value) {
		if (value == null) return null;
		var n = Number(value);
		if (n <= 50) return 'Good';
		if (n <= 100) return 'Moderate';
		if (n <= 150) return 'Unhealthy (sensitive)';
		if (n <= 200) return 'Unhealthy';
		if (n <= 300) return 'Very unhealthy';
		return 'Hazardous';
	}
	function weatherIconAndClass(code, tempC) {
		var t = tempC != null ? Number(tempC) : NaN;
		if (code >= 80) return { icon: '☁️', class: 'home-weather-icon-cloudy' };
		if (code >= 61) return { icon: '🌧️', class: 'home-weather-icon-rain' };
		if (code >= 51) return { icon: '🌦️', class: 'home-weather-icon-drizzle' };
		if (code >= 3) return { icon: '⛅', class: 'home-weather-icon-cloudy' };
		if (code === 1) return { icon: '🌤️', class: 'home-weather-icon-clear' };
		if (!isNaN(t) && t >= 30) return { icon: '🌡️', class: 'home-weather-icon-hot' };
		if (!isNaN(t) && t <= 5) return { icon: '❄️', class: 'home-weather-icon-cold' };
		return { icon: '☀️', class: 'home-weather-icon-clear' };
	}
	function renderForecastPanel(panel, daily) {
		if (!panel || !daily) return;
		var times = daily.time || [];
		var codes = daily.weathercode || [];
		var maxT = daily.temperature_2m_max || [];
		var minT = daily.temperature_2m_min || [];
		var html = '<p class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Next 7 days</p><div class="grid grid-cols-7 gap-1 text-center">';
		for (var i = 0; i < Math.min(7, times.length); i++) {
			var d = new Date(times[i]);
			var dayName = d.toLocaleDateString([], { weekday: 'short' });
			var code = codes[i] != null ? codes[i] : 0;
			var desc = weatherCodeToDesc(code);
			var hi = maxT[i] != null ? Math.round(maxT[i]) + '°' : '—';
			var lo = minT[i] != null ? Math.round(minT[i]) + '°' : '—';
			html += '<div class="rounded px-1 py-1.5 bg-gray-100/80 dark:bg-gray-800/80">' +
				'<div class="text-[10px] font-medium text-gray-600 dark:text-gray-400">' + dayName + '</div>' +
				'<div class="text-xs font-semibold text-gray-800 dark:text-gray-100">' + hi + '</div>' +
				'<div class="text-[10px] text-gray-500 dark:text-gray-400">' + lo + '</div>' +
				'<div class="text-[10px] opacity-80">' + desc + '</div></div>';
		}
		html += '</div>';
		panel.innerHTML = html;
	}
	function renderWeather(data, aqiData, locationName) {
		if (!weatherEl || !data) return;
		lastDailyForecast = data.daily || null;
		var tempC = data.current_weather && data.current_weather.temperature != null ? data.current_weather.temperature : null;
		var temp = tempC != null ? Math.round(tempC) + '°C' : '—';
		var code = (data.current_weather && data.current_weather.weathercode) || 0;
		var desc = weatherCodeToDesc(code);
		var usAqi = aqiData && aqiData.current && aqiData.current.us_aqi != null ? aqiData.current.us_aqi : null;
		var aqiLabelText = usAqi != null ? aqiLabel(usAqi) : null;
		var aqiHtml = ' <span class="home-weather-aqi text-xs opacity-90">· AQI ' + (usAqi != null ? usAqi + ' ' + (aqiLabelText || '') : '—') + '</span>';
		var iconInfo = weatherIconAndClass(code, tempC);
		weatherEl.innerHTML =
			'<span class="home-weather-icon-wrap ' + iconInfo.class + '" aria-hidden="true">' + iconInfo.icon + '</span>' +
			'<span class="home-weather-temp font-semibold text-lg">' + temp + '</span>' +
			'<span class="text-sm opacity-80 ml-1">' + desc + '</span>' + aqiHtml +
			'<div class="mt-1"><a href="https://open-meteo.com/en/docs' + (lastWeatherLat != null && lastWeatherLon != null ? '?lat=' + lastWeatherLat + '&lon=' + lastWeatherLon : '') + '" target="_blank" rel="noopener" class="text-xs font-semibold text-primary hover:underline">Full forecast →</a></div>';
		if (weatherCity) weatherCity.textContent = locationName || (data.timezone ? data.timezone.split('/').pop().replace(/_/g, ' ') : '—');
		if (weatherForecastPanel && lastDailyForecast) {
			renderForecastPanel(weatherForecastPanel, lastDailyForecast);
			weatherForecastPanel.classList.remove('hidden');
			weatherForecastPanel.setAttribute('aria-hidden', 'false');
		}
	}

	function fetchWeather(lat, lon, locationName) {
		var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
			'&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7';
		var aqiUrl = 'https://air-quality.api.open-meteo.com/v1/air-quality?latitude=' + lat + '&longitude=' + lon + '&current=us_aqi';
		Promise.all([
			fetch(url).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('API error')); }),
			fetch(aqiUrl).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
		]).then(function (results) {
			var data = results[0];
			var aqiData = results[1];
			lastWeatherLat = lat;
			lastWeatherLon = lon;
			if (data && (data.current_weather || data.error !== true)) {
				renderWeather(data, aqiData, locationName);
			} else {
				renderWeatherUnavailable();
			}
		}).catch(function () {
			renderWeatherUnavailable();
		});
	}
	function renderWeatherUnavailable() {
		if (!weatherEl) return;
		lastDailyForecast = null;
		weatherEl.innerHTML = '<span class="text-sm opacity-70">Weather unavailable</span>' +
			'<div class="flex gap-2 mt-1">' +
			'<button type="button" class="weather-retry-btn text-xs font-semibold text-primary hover:underline">Retry</button>' +
			'<button type="button" class="weather-default-btn text-xs font-semibold text-gray-600 dark:text-gray-400 hover:underline">Use default city</button>' +
			'</div>';
		weatherEl.querySelector('.weather-retry-btn').addEventListener('click', function () {
			var saved = getSavedLocation();
			if (saved) fetchWeather(saved.lat, saved.lon, saved.name);
			else fetchWeather(defaultLat, defaultLon, 'London');
		});
		weatherEl.querySelector('.weather-default-btn').addEventListener('click', function () {
			setWeatherByCoords(defaultLat, defaultLon, 'London');
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
				function (pos) {
					var lat = pos.coords.latitude;
					var lon = pos.coords.longitude;
					console.log('[Weather] Location allowed — latitude:', lat, 'longitude:', lon);
					if (typeof window.trackEvent === 'function') {
						window.trackEvent('home_weather_location_allowed', { latitude: lat, longitude: lon });
					}
					var revUrl = 'https://geocoding-api.open-meteo.com/v1/reverse?latitude=' + lat + '&longitude=' + lon + '&count=1';
					fetch(revUrl).then(function (r) { return r.json(); }).then(function (rev) {
						var name = 'My location';
						if (rev.results && rev.results[0]) {
							var r = rev.results[0];
							name = (r.name || '') + (r.country_code ? ', ' + r.country_code.toUpperCase() : '');
						}
						setWeatherByCoords(lat, lon, name);
					}).catch(function () { setWeatherByCoords(lat, lon, 'My location'); });
				},
				function () { setWeatherByCoords(defaultLat, defaultLon, 'London (location denied)'); }
			);
		});
	}

		// No auto location popup on load — use saved location or default city only
		var saved = getSavedLocation();
		if (saved) {
			fetchWeather(saved.lat, saved.lon, saved.name);
		} else {
			fetchWeather(defaultLat, defaultLon, 'London');
		}
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initWeather);
	} else {
		initWeather();
	}

	// Focus timer: configurable work/break + session log (localStorage) + presets
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
	var timerRoundsInput = document.getElementById('home-timer-rounds');
	var timerAutoCheckbox = document.getElementById('home-timer-auto');
	var timerStatusText = document.getElementById('home-timer-status');
	var timerPresetButtons = document.querySelectorAll('.home-timer-preset');
	var timerInterval = null;
	var timerPenaltyInterval = null; // counts seconds after 0 until user clicks (penalty)
	var timerSeconds = 25 * 60;
	var timerRemaining = 25 * 60;
	var timerWorkMins = 25;
	var timerBreakMins = 5;
	var timerIsBreak = false;
	var timerTotalRounds = 1;
	var timerRemainingRounds = null;
	var timerWaitingForUser = false;
	var timerPenaltySeconds = 0;
	var timerGraceSeconds = 0;
	var timerPenaltyGraceEl = document.getElementById('home-timer-penalty-grace');

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

	// Preset buttons (e.g. 20/5, 40/10, 50/10)
	if (timerPresetButtons && timerPresetButtons.length) {
		Array.prototype.forEach.call(timerPresetButtons, function (btn) {
			btn.addEventListener('click', function () {
				var w = parseInt(btn.getAttribute('data-work'), 10) || 25;
				var b = parseInt(btn.getAttribute('data-break'), 10) || 5;
				if (timerWorkInput) timerWorkInput.value = w;
				if (timerBreakInput) timerBreakInput.value = b;
				applyTimerSpan();
				if (timerStatusText) {
					timerStatusText.textContent = w + ' / ' + b + ' preset selected';
				}
			});
		});
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
	function updatePenaltyGraceDisplay() {
		if (!timerPenaltyGraceEl) return;
		var g = Math.floor(timerGraceSeconds / 60);
		var p = Math.floor(timerPenaltySeconds / 60);
		timerPenaltyGraceEl.textContent = 'Grace: ' + g + 'm · Penalty: ' + p + 'm';
	}

	// Called when work phase ends (from tick at 0 or from Next with time left). usePenaltyAndGrace: use accumulated penalty/grace for next break length.
	function transitionWorkEnded(usePenaltyAndGrace) {
		var minsLogged = Math.round((timerWorkMins * 60 - 0) / 60) || timerWorkMins;
		addTimerLogEntry(minsLogged, timerSessionLabel && timerSessionLabel.value ? timerSessionLabel.value.trim() : '');
		if (timerSessionLabel) timerSessionLabel.value = '';

		var autoOn = !!(timerAutoCheckbox && timerAutoCheckbox.checked);
		if (autoOn && timerRoundsInput) {
			var total = timerTotalRounds;
			if (timerRemainingRounds == null) {
				total = parseInt(timerRoundsInput.value, 10) || 1;
				timerTotalRounds = Math.max(1, Math.min(12, total));
				timerRemainingRounds = timerTotalRounds;
			}
			timerRemainingRounds--;
			if (timerRemainingRounds <= 0) {
				timerIsBreak = false;
				timerSeconds = timerWorkMins * 60;
				timerRemaining = timerSeconds;
				timerWaitingForUser = false;
				timerPenaltySeconds = 0;
				timerGraceSeconds = 0;
				updatePenaltyGraceDisplay();
				updateTimerDisplay();
				updatePhaseLabel();
				if (timerBtn) { timerBtn.textContent = 'Start'; timerBtn.dataset.running = '0'; }
				if (timerStatusText) timerStatusText.textContent = 'Completed ' + timerTotalRounds + ' rounds';
				if (typeof document.hidden !== 'undefined' && !document.hidden) {
					try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2').play(); } catch (e) {}
					try { alert('All scheduled focus sessions are done.'); } catch (e) {}
				}
				timerRemainingRounds = null;
				return;
			}
			if (timerStatusText) {
				var doneRounds = timerTotalRounds - timerRemainingRounds;
				timerStatusText.textContent = 'Round ' + (doneRounds + 1) + ' of ' + timerTotalRounds;
			}
		}

		if (timerBreakMins > 0) {
			var effectiveBreakSec = timerBreakMins * 60;
			if (usePenaltyAndGrace) {
				effectiveBreakSec = Math.max(0, timerBreakMins * 60 + timerGraceSeconds - timerPenaltySeconds);
				timerGraceSeconds = 0;
				timerPenaltySeconds = 0;
				updatePenaltyGraceDisplay();
			}
			timerIsBreak = true;
			timerSeconds = effectiveBreakSec;
			timerRemaining = effectiveBreakSec;
			updatePhaseLabel();
			updateTimerDisplay();
			if (typeof document.hidden !== 'undefined' && !document.hidden) {
				try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2').play(); } catch (e) {}
				try { alert('Focus block done. Break started.'); } catch (e) {}
			}
			if (timerBtn) { timerBtn.textContent = 'Pause'; timerBtn.dataset.running = '1'; }
			timerInterval = setInterval(tick, 1000);
		} else {
			if (timerBtn) { timerBtn.textContent = 'Start'; timerBtn.dataset.running = '0'; }
		}
	}

	function tick() {
		if (timerWaitingForUser) return;
		timerRemaining--;
		updateTimerDisplay();
		if (timerRemaining <= 0) {
			if (timerIsBreak) {
				clearInterval(timerInterval);
				timerInterval = null;
				timerIsBreak = false;
				timerSeconds = timerWorkMins * 60;
				timerRemaining = timerSeconds;
				updatePhaseLabel();
				updateTimerDisplay();
				if (typeof document.hidden !== 'undefined' && !document.hidden) {
					try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2').play(); } catch (e) {}
					try { alert('Break over. Back to focus.'); } catch (e) {}
				}
				if (timerBtn) { timerBtn.textContent = 'Pause'; timerBtn.dataset.running = '1'; }
				timerInterval = setInterval(tick, 1000);
				return;
			}
			// Work phase ended: wait for user (count penalty until they click)
			clearInterval(timerInterval);
			timerInterval = null;
			timerWaitingForUser = true;
			timerPenaltySeconds = 0;
			updatePenaltyGraceDisplay();
			if (timerBtn) timerBtn.textContent = 'Continue';
			if (typeof document.hidden !== 'undefined' && !document.hidden) {
				try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2').play(); } catch (e) {}
				try { alert('Focus block done. Click Continue or Next to start break.'); } catch (e) {}
			}
			timerPenaltyInterval = setInterval(function () {
				timerPenaltySeconds++;
				updatePenaltyGraceDisplay();
				if (timerDisplay) timerDisplay.textContent = '0:00 +' + Math.floor(timerPenaltySeconds / 60) + 'm';
			}, 1000);
			return;
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
			if (timerWaitingForUser) {
				if (timerPenaltyInterval) {
					clearInterval(timerPenaltyInterval);
					timerPenaltyInterval = null;
				}
				timerWaitingForUser = false;
				transitionWorkEnded(true);
				return;
			}
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
				timerBtn.textContent = 'Resume';
				timerBtn.dataset.running = '0';
			} else {
				// Initialize rounds state when starting
				if (timerAutoCheckbox && timerAutoCheckbox.checked && timerRoundsInput) {
					var rounds = parseInt(timerRoundsInput.value, 10) || 1;
					timerTotalRounds = Math.max(1, Math.min(12, rounds));
					if (timerRemainingRounds == null) {
						timerRemainingRounds = timerTotalRounds;
					}
					if (timerStatusText) {
						var done = timerTotalRounds - timerRemainingRounds;
						timerStatusText.textContent = 'Round ' + (done + 1) + ' of ' + timerTotalRounds;
					}
				} else {
					timerRemainingRounds = null;
					if (timerStatusText) timerStatusText.textContent = '';
				}
				timerBtn.textContent = 'Pause';
				timerBtn.dataset.running = '1';
				timerInterval = setInterval(tick, 1000);
			}
		});
	}
	var timerNextBtn = document.getElementById('home-timer-next');
	if (timerNextBtn) {
		timerNextBtn.addEventListener('click', function () {
			if (timerWaitingForUser) {
				if (timerPenaltyInterval) {
					clearInterval(timerPenaltyInterval);
					timerPenaltyInterval = null;
				}
				timerWaitingForUser = false;
				transitionWorkEnded(true);
				return;
			}
			if (!timerInterval) return;
			if (timerRemaining > 0) {
				timerGraceSeconds += timerRemaining;
				updatePenaltyGraceDisplay();
			}
			if (timerIsBreak) {
				clearInterval(timerInterval);
				timerInterval = null;
				timerIsBreak = false;
				timerSeconds = timerWorkMins * 60;
				timerRemaining = timerSeconds;
				updateTimerDisplay();
				updatePhaseLabel();
				if (typeof document.hidden !== 'undefined' && !document.hidden) {
					try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2').play(); } catch (e) {}
					try { alert('Break ended early. Grace added. Back to focus.'); } catch (e) {}
				}
				timerInterval = setInterval(tick, 1000);
			} else {
				clearInterval(timerInterval);
				timerInterval = null;
				transitionWorkEnded(true);
			}
		});
	}
	if (timerReset && timerDisplay) {
		timerReset.addEventListener('click', function () {
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
			if (timerPenaltyInterval) {
				clearInterval(timerPenaltyInterval);
				timerPenaltyInterval = null;
			}
			timerWaitingForUser = false;
			timerPenaltySeconds = 0;
			timerGraceSeconds = 0;
			updatePenaltyGraceDisplay();
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
	updatePenaltyGraceDisplay();
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

	// Export to-dos: format select (.md, .txt, or PDF via print)
	var todoExportFormat = document.getElementById('home-todo-export-format');
	var todoExportBtn = document.getElementById('home-todo-export-btn');
	if (todoExportBtn && getTodos) {
		todoExportBtn.addEventListener('click', function () {
			var todos = getTodos();
			var lines = ['# To-do', ''];
			todos.forEach(function (t) {
				lines.push('- [' + (t.done ? 'x' : ' ') + '] ' + (t.text || '').replace(/\n/g, ' '));
			});
			var md = lines.join('\n');
			var txt = lines.slice(2).join('\n'); // plain list without # To-do header
			var format = (todoExportFormat && todoExportFormat.value) || 'md';
			var d = new Date();
			var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

			if (format === 'pdf') {
				var printHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>To-do</title><style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:40rem;} h1{font-size:1.25rem;} ul{list-style:none;padding:0;} li{margin:0.5rem 0;}</style></head><body><h1>To-do</h1><ul>';
				todos.forEach(function (t) {
					printHtml += '<li>' + (t.done ? '[x] ' : '[ ] ') + (t.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</li>';
				});
				printHtml += '</ul></body></html>';
				var w = window.open('', '_blank');
				if (w) {
					w.document.write(printHtml);
					w.document.close();
					w.focus();
					setTimeout(function () { w.print(); w.close(); }, 250);
				}
				return;
			}

			var ext = format === 'txt' ? 'txt' : 'md';
			var content = format === 'txt' ? txt : md;
			var name = 'todos-' + dateStr + '.' + ext;
			var mime = format === 'txt' ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8';
			try {
				var blob = new Blob([content], { type: mime });
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

// Analytics: track visits and time-on-page for Home
if (typeof initAnalyticsTracking === 'function') {
	initAnalyticsTracking({ site: 'analytics-lab', baseEvent: 'home' });
}

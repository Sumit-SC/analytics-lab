/**
 * MoviePosterDB scraper — builds URL from IMDb ID, fetches page, returns poster image URLs.
 * No API key; scrapes the public page. Use sparingly and respect the site's terms.
 *
 * Query: i=tt1187043 (imdbID), title=3 Idiots (for slug)
 */

const BASE = 'https://www.movieposterdb.com';

function slugify(s) {
	if (typeof s !== 'string') return '';
	return s
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '') || 'title';
}

function buildPageUrl(imdbId, title) {
	const id = String(imdbId || '').replace(/^tt/i, '');
	if (!/^\d+$/.test(id)) return null;
	const slug = slugify(title || 'title');
	// Pattern: https://www.movieposterdb.com/3-idiots-i1187043
	return BASE + '/' + slug + '-i' + id;
}

function extractImageUrls(html) {
	const urls = [];
	const srcRegex = /<img[^>]+(?:src|data-src)=["']([^"']+)["']/gi;
	let m;
	while ((m = srcRegex.exec(html)) !== null) {
		let u = m[1].trim();
		if (u.startsWith('//')) u = 'https:' + u;
		else if (u.startsWith('/')) u = BASE + u;
		if (!u.startsWith('http')) continue;
		// Prefer MoviePosterDB / common image formats
		if (u.includes('movieposterdb.com') || /\.(jpe?g|png|webp)(\?|$)/i.test(u)) {
			urls.push(u);
		}
	}
	const seen = new Set();
	const unique = urls.filter(function (u) {
		const k = u.replace(/\?.*$/, '');
		if (seen.has(k)) return false;
		seen.add(k);
		return true;
	});
	return unique;
}

module.exports = async function handler(req, res) {
	res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
	if (req.method === 'OPTIONS') {
		res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
		res.setHeader('Access-Control-Max-Age', '86400');
		return res.status(204).end();
	}
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed', posters: [] });
	}

	const imdbId = typeof req.query.i === 'string' ? req.query.i.trim() : '';
	const title = typeof req.query.title === 'string' ? req.query.title.trim() : '';

	if (!/^tt\d+$/.test(imdbId)) {
		return res.status(400).json({
			error: 'Missing or invalid IMDb ID. Use i=tt1187043 (from OMDb).',
			posters: [],
			pageUrl: null
		});
	}

	const pageUrl = buildPageUrl(imdbId, title);
	if (!pageUrl) {
		return res.status(400).json({ error: 'Could not build MoviePosterDB URL.', posters: [], pageUrl: null });
	}

	try {
		const r = await fetch(pageUrl, {
			headers: {
				'User-Agent': 'Poster-Proxy/1.0 (personal project; +https://github.com)',
				'Accept': 'text/html'
			},
			redirect: 'follow'
		});
		const html = await r.text();
		if (!r.ok) {
			return res.status(200).json({
				error: 'MoviePosterDB page returned ' + r.status,
				posters: [],
				pageUrl: pageUrl,
				sourceUrl: pageUrl
			});
		}
		const images = extractImageUrls(html);
		return res.status(200).json({
			posters: images.map(function (url) { return { url: url }; }),
			pageUrl: pageUrl,
			sourceUrl: pageUrl
		});
	} catch (e) {
		return res.status(502).json({
			error: 'Failed to fetch MoviePosterDB: ' + (e.message || 'network error'),
			posters: [],
			pageUrl: pageUrl,
			sourceUrl: pageUrl
		});
	}
};


/**
 * CineMaterial poster scraper — builds URL from IMDb ID (from OMDb), fetches page, returns poster image URLs.
 * No API key; scrapes the public list page. Use sparingly and respect the site's terms.
 *
 * Query: i=tt1375666 (imdbID), title=Inception (for slug), type=movie|series
 */

const BASE = 'https://www.cinematerial.com';

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

function buildPageUrl(imdbId, title, type) {
	const id = String(imdbId || '').replace(/^tt/i, '');
	if (!/^\d+$/.test(id)) return null;
	const slug = slugify(title || 'title');
	const path = type === 'series' ? 'tv' : 'movies';
	return BASE + '/' + path + '/' + slug + '-i' + id;
}

function extractImageUrls(html, baseUrl) {
	const urls = [];

	// Try JSON-LD first: it usually contains the primary poster image
	try {
		const ldMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
		if (ldMatch && ldMatch[1]) {
			let jsonText = ldMatch[1].trim();
			jsonText = jsonText.replace(/^\s*<!--/, '').replace(/-->\s*$/, '');
			const data = JSON.parse(jsonText);
			const img = (data && typeof data.image === 'string') ? data.image.trim() : '';
			if (img && img.indexOf('http') === 0) {
				urls.push(img);
			}
		}
	} catch (e) {
		// Ignore JSON-LD parse errors; fall back to <img> scraping
	}

	const srcRegex = /<img[^>]+(?:src|data-src)=["']([^"']+)["']/gi;
	let m;
	while ((m = srcRegex.exec(html)) !== null) {
		let u = m[1].trim();
		if (u.startsWith('//')) u = 'https:' + u;
		else if (u.startsWith('/')) u = BASE + u;
		if (!u.startsWith('http')) continue;
		// Prefer CineMaterial CDN poster URLs: https://cdn.cinematerial.com/p/...
		if (u.indexOf('cdn.cinematerial.com') !== -1 && /\/p\//.test(u)) {
			urls.push(u);
		}
	}
	// Filter down to real posters (skip logos etc), and prefer larger sizes
	const posterLike = [];
	const others = [];
	for (let i = 0; i < urls.length; i++) {
		let u = urls[i];
		let lower = u.toLowerCase();
		// Skip obvious logos
		if (lower.indexOf('logo') !== -1) continue;
		// Try to upgrade thumbnail (e.g. /p/136x/...-sm.jpg -> /p/297x/...-md.jpg)
		if (u.indexOf('cdn.cinematerial.com') !== -1 && /\/p\/\d+x\//.test(u)) {
			u = u.replace(/\/p\/\d+x\//, '/p/297x/').replace(/-sm(\.[a-z0-9]+)(\?|$)/i, '-md$1$2');
			lower = u.toLowerCase();
		}
		if (lower.indexOf('poster-') !== -1) {
			posterLike.push(u);
		} else {
			others.push(u);
		}
	}
	const raw = posterLike.length ? posterLike : others;
	const seen = new Set();
	const unique = raw.filter(function (u) {
		const k = u.replace(/\?.*$/, '');
		if (seen.has(k)) return false;
		seen.add(k);
		return true;
	});
	return { images: unique, posterPages: [] };
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
	const type = (req.query.type === 'series' || req.query.type === 'movie') ? req.query.type : 'movie';

	if (!/^tt\d+$/.test(imdbId)) {
		return res.status(400).json({
			error: 'Missing or invalid IMDb ID. Use i=tt1375666 (from OMDb).',
			posters: [],
			pageUrl: null
		});
	}

	const pageUrl = buildPageUrl(imdbId, title, type);
	if (!pageUrl) {
		return res.status(400).json({ error: 'Could not build CineMaterial URL.', posters: [], pageUrl: null });
	}

	try {
		const r = await fetch(pageUrl, {
			headers: {
				'User-Agent': 'OMDb-Proxy/1.0 (personal project; +https://github.com)',
				'Accept': 'text/html'
			},
			redirect: 'follow'
		});
		const html = await r.text();
		if (!r.ok) {
			return res.status(200).json({
				error: 'CineMaterial page returned ' + r.status,
				posters: [],
				pageUrl: pageUrl,
				sourceUrl: pageUrl
			});
		}
		const { images, posterPages } = extractImageUrls(html, pageUrl);
		return res.status(200).json({
			posters: images.map(function (url) { return { url: url }; }),
			posterPages: posterPages,
			pageUrl: pageUrl,
			sourceUrl: pageUrl
		});
	} catch (e) {
		return res.status(502).json({
			error: 'Failed to fetch CineMaterial: ' + (e.message || 'network error'),
			posters: [],
			pageUrl: pageUrl,
			sourceUrl: pageUrl
		});
	}
};

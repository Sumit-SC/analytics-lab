/**
 * OMDb poster proxy — keeps the API key on the server.
 * Set env: OMDB_API_KEY (required). Optional: ALLOWED_ORIGINS (comma-separated) to restrict CORS.
 * Deploy this with Vercel/Netlify so the key is never sent to the client.
 */

const OMDB_BASE = 'https://www.omdbapi.com/';
const MAX_TITLE_LENGTH = 200;
let OMDB_REQUEST_COUNT = 0;

function getKey() {
	return process.env.OMDB_API_KEY || '';
}

function allowedOrigin(origin) {
	if (!origin) return true;
	const list = (process.env.ALLOWED_ORIGINS || '').trim().split(',').map(function (o) { return o.trim(); }).filter(Boolean);
	if (list.length === 0) return true;
	return list.some(function (o) { return o === origin || origin.endsWith(o); });
}

module.exports = async function handler(req, res) {
	OMDB_REQUEST_COUNT += 1;

	// CORS: allow same-origin or list from env
	var origin = req.headers.origin || '';
	if (!origin && req.headers.referer) {
		try { origin = new URL(req.headers.referer).origin; } catch (e) {}
	}
	if (req.method === 'OPTIONS') {
		res.setHeader('Access-Control-Allow-Origin', allowedOrigin(origin) ? (origin || '*') : '');
		res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
		res.setHeader('Access-Control-Max-Age', '86400');
		return res.status(204).end();
	}

	if (req.method !== 'GET') {
		res.setHeader('Access-Control-Allow-Origin', origin || '*');
		return res.status(405).json({ poster: null, error: 'Method not allowed', usage: { requestCount: OMDB_REQUEST_COUNT } });
	}

	const key = getKey();
	if (!key) {
		res.setHeader('Access-Control-Allow-Origin', origin || '*');
		return res.status(503).json({ poster: null, error: 'OMDb proxy not configured', usage: { requestCount: OMDB_REQUEST_COUNT } });
	}

	const setCors = function () {
		res.setHeader('Access-Control-Allow-Origin', allowedOrigin(origin) ? (origin || '*') : '*');
	};

	// Search: s=query → returns { results: [ { Title, Year, imdbID, Poster, Type } ] }
	const searchQuery = typeof req.query.s === 'string' ? req.query.s.trim() : '';
	if (searchQuery && searchQuery.length <= MAX_TITLE_LENGTH) {
		try {
			const url = OMDB_BASE + '?s=' + encodeURIComponent(searchQuery) + '&apikey=' + encodeURIComponent(key);
			const r = await fetch(url);
			const data = await r.json().catch(function () { return null; });
			const list = (data && data.Search && Array.isArray(data.Search)) ? data.Search : [];
			const results = list.slice(0, 10).map(function (item) {
				return {
					Title: item.Title || '',
					Year: item.Year || '',
					imdbID: item.imdbID || '',
					Poster: (item.Poster && item.Poster !== 'N/A' && String(item.Poster).indexOf('http') === 0) ? item.Poster : null,
					Type: item.Type || ''
				};
			});
			setCors();
			res.setHeader('Cache-Control', 'public, max-age=300');
			return res.status(200).json({ results: results, usage: { requestCount: OMDB_REQUEST_COUNT } });
		} catch (e) {
			res.setHeader('Access-Control-Allow-Origin', origin || '*');
			return res.status(502).json({ results: [], error: 'Upstream error', usage: { requestCount: OMDB_REQUEST_COUNT } });
		}
	}

	// By ID: i=imdbID → returns one item details (sanitized)
	const idQuery = typeof req.query.i === 'string' ? req.query.i.trim() : '';
	if (idQuery && /^tt\d+$/.test(idQuery)) {
		try {
			const url = OMDB_BASE + '?i=' + encodeURIComponent(idQuery) + '&apikey=' + encodeURIComponent(key);
			const r = await fetch(url);
			const data = await r.json().catch(function () { return null; });
			if (!data || data.Response === 'False') {
				setCors();
				return res.status(200).json({ error: 'Not found', usage: { requestCount: OMDB_REQUEST_COUNT } });
			}
			const out = {
				Title: data.Title || '',
				Year: data.Year || '',
				Rated: data.Rated || '',
				Released: data.Released || '',
				Runtime: data.Runtime || '',
				Genre: data.Genre || '',
				Director: data.Director || '',
				Writer: data.Writer || '',
				Actors: data.Actors || '',
				Plot: data.Plot || '',
				Language: data.Language || '',
				Country: data.Country || '',
				Awards: data.Awards || '',
				BoxOffice: data.BoxOffice || '',
				Poster: (data.Poster && data.Poster !== 'N/A' && String(data.Poster).indexOf('http') === 0) ? data.Poster : null,
				imdbRating: data.imdbRating || '',
				imdbID: data.imdbID || '',
				Type: data.Type || ''
			};
			setCors();
			res.setHeader('Cache-Control', 'public, max-age=86400');
			return res.status(200).json(Object.assign({}, out, { usage: { requestCount: OMDB_REQUEST_COUNT } }));
		} catch (e) {
			res.setHeader('Access-Control-Allow-Origin', origin || '*');
			return res.status(502).json({ error: 'Upstream error', usage: { requestCount: OMDB_REQUEST_COUNT } });
		}
	}

	// Poster by title: t=Title&type=movie|series (existing)
	const t = typeof req.query.t === 'string' ? req.query.t.trim() : '';
	if (!t || t.length > MAX_TITLE_LENGTH) {
		res.setHeader('Access-Control-Allow-Origin', origin || '*');
		return res.status(400).json({ poster: null, error: 'Missing or invalid title', usage: { requestCount: OMDB_REQUEST_COUNT } });
	}
	const type = (req.query.type === 'movie' || req.query.type === 'series') ? req.query.type : '';
	let url = OMDB_BASE + '?t=' + encodeURIComponent(t) + '&apikey=' + encodeURIComponent(key);
	if (type) url += '&type=' + type;
	try {
		const r = await fetch(url);
		const data = await r.json().catch(function () { return null; });
		const poster = data && data.Poster && data.Poster !== 'N/A' && String(data.Poster).indexOf('http') === 0 ? data.Poster : null;
		setCors();
		res.setHeader('Cache-Control', 'public, max-age=86400');
		return res.status(200).json({ poster: poster, usage: { requestCount: OMDB_REQUEST_COUNT } });
	} catch (e) {
		res.setHeader('Access-Control-Allow-Origin', origin || '*');
		return res.status(502).json({ poster: null, error: 'Upstream error', usage: { requestCount: OMDB_REQUEST_COUNT } });
	}
};

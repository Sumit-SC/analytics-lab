/**
 * Indeed job search proxy — optional.
 * To enable: use a job-search API (e.g. HasData, SerpAPI, or a scraper) and set env (e.g. HASDATA_API_KEY, SERP_API_KEY).
 * Until then, returns an empty list with a clear "Not configured" message so the Jobs page does not break.
 */

module.exports = async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	const q = (req.query && req.query.q) || 'data science';
	const l = (req.query && req.query.l) || 'remote';

	// Optional: implement real fetch when you have an API key (HasData, SerpAPI, etc.)
	// const apiKey = process.env.HASDATA_API_KEY || process.env.SERP_API_KEY;
	// if (apiKey) { ... fetch from provider ... return res.status(200).json({ results: normalized }); }

	return res.status(200).json({
		success: true,
		results: [],
		count: 0,
		note: 'Indeed proxy not configured. Add api/indeed.js implementation with HasData, SerpAPI, or similar; set HASDATA_API_KEY or SERP_API_KEY in project env.'
	});
};

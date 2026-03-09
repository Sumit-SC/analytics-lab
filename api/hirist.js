module.exports = async (req, res) => {
	// CORS headers
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	const { keywords = 'data science', location = 'remote' } = req.query;

	try {
		// Hirist doesn't have a public API
		// This would require web scraping, which may violate ToS
		// For now, return a placeholder response
		// In production, you'd need to use a scraping service like Apify, ScraperAPI, or build a custom scraper

		// Not configured: return empty results with a clear message.
		return res.status(200).json({
			success: true,
			results: [],
			count: 0,
			configured: false,
			note: 'Not configured. Hirist requires backend setup (Apify/ScraperAPI). Set APIFY_API_KEY or SCRAPER_API_KEY in project env to enable.'
		});

	} catch (error) {
		console.error('Hirist API error:', error);
		return res.status(500).json({
			error: 'Failed to fetch jobs from Hirist',
			message: error.message
		});
	}
};

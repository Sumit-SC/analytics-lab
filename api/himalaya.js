module.exports = async (req, res) => {
	// CORS headers
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	const { keywords = 'data science', remote = 'true' } = req.query;

	try {
		// Himalaya (himalayas.app) doesn't have a public API
		// This would require web scraping
		// For now, return a placeholder response

		// Not configured: return empty results with a clear message.
		return res.status(200).json({
			success: true,
			results: [],
			count: 0,
			configured: false,
			note: 'Not configured. Himalaya requires backend setup (Apify/ScraperAPI). Set APIFY_API_KEY or SCRAPER_API_KEY in project env to enable.'
		});

	} catch (error) {
		console.error('Himalaya API error:', error);
		return res.status(500).json({
			error: 'Failed to fetch jobs from Himalaya',
			message: error.message
		});
	}
};

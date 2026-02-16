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
		// Instahyre doesn't have a public API
		// This would require web scraping, which may violate ToS
		// For now, return a placeholder response
		// In production, you'd need to use a scraping service like Apify, ScraperAPI, or build a custom scraper

		// Example: Using Apify actor (requires API key)
		// const APIFY_API_KEY = process.env.APIFY_API_KEY;
		// if (!APIFY_API_KEY) {
		//   return res.status(500).json({ error: 'Apify API key not configured' });
		// }

		// For now, return empty results with a note
		return res.status(200).json({
			success: true,
			results: [],
			count: 0,
			note: 'Instahyre scraping requires backend setup with Apify/ScraperAPI. Configure APIFY_API_KEY or SCRAPER_API_KEY environment variable.'
		});

	} catch (error) {
		console.error('Instahyre API error:', error);
		return res.status(500).json({
			error: 'Failed to fetch jobs from Instahyre',
			message: error.message
		});
	}
};

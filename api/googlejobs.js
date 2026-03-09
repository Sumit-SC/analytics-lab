module.exports = async (req, res) => {
	// CORS headers
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	const { q = 'data science', location = 'remote' } = req.query;
	const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
	const SERP_API_KEY = process.env.SERP_API_KEY;

	try {
		// Google Jobs requires ScraperAPI or SerpAPI
		if (SCRAPER_API_KEY) {
			const scraperUrl = `https://api.scraperapi.com/structured/google/jobs?api_key=${SCRAPER_API_KEY}&query=${encodeURIComponent(q)}&country_code=us`;
			
			const response = await fetch(scraperUrl);
			if (!response.ok) {
				throw new Error(`ScraperAPI error: ${response.status}`);
			}

			const data = await response.json();
			const jobs = data.jobs || [];

			const formattedJobs = jobs.map(item => ({
				id: item.job_id || item.id,
				title: item.title,
				company: item.company_name || item.company,
				location: item.location || location,
				url: item.link || item.apply_link || '#',
				description: item.description || item.snippet || '',
				postedAt: item.detected_extensions?.posted_at || new Date().toISOString()
			}));

			return res.status(200).json({
				success: true,
				jobs: formattedJobs,
				count: formattedJobs.length
			});
		} else if (SERP_API_KEY) {
			// Alternative: SerpAPI
			const serpUrl = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}&api_key=${SERP_API_KEY}`;
			
			const response = await fetch(serpUrl);
			if (!response.ok) {
				throw new Error(`SerpAPI error: ${response.status}`);
			}

			const data = await response.json();
			const jobs = data.jobs_results || [];

			const formattedJobs = jobs.map(item => ({
				id: item.job_id || item.id,
				title: item.title,
				company: item.company_name || item.company,
				location: item.location || location,
				url: item.apply_link || item.link || '#',
				description: item.description || item.snippet || '',
				postedAt: item.detected_extensions?.posted_at || new Date().toISOString()
			}));

			return res.status(200).json({
				success: true,
				jobs: formattedJobs,
				count: formattedJobs.length
			});
		} else {
			return res.status(200).json({
				success: true,
				jobs: [],
				count: 0,
				note: 'Google Jobs requires SCRAPER_API_KEY or SERP_API_KEY environment variable. Sign up at scraperapi.com or serpapi.com'
			});
		}

	} catch (error) {
		console.error('Google Jobs API error:', error);
		return res.status(500).json({
			error: 'Failed to fetch jobs from Google Jobs',
			message: error.message
		});
	}
};

const https = require('https');

module.exports = async (req, res) => {
	// CORS headers
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	const { keyword = 'data science', location = 'remote' } = req.query;

	if (!keyword) {
		return res.status(400).json({ error: 'Keyword parameter is required' });
	}

	try {
		// Naukri public API endpoint
		const encodedKeyword = encodeURIComponent(keyword);
		const encodedLocation = encodeURIComponent(location);
		const apiUrl = `https://www.naukri.com/jobapi/v2/search?keyword=${encodedKeyword}&location=${encodedLocation}&pageNo=0&pageSize=50`;

		const response = await fetch(apiUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				'Accept': 'application/json',
				'Referer': 'https://www.naukri.com/'
			}
		});

		if (!response.ok) {
			throw new Error(`Naukri API error: ${response.status}`);
		}

		const data = await response.json();
		const jobs = data.jobDetails || data.results || (data.data && data.data.jobDetails) || [];

		const formattedJobs = jobs.map(item => ({
			id: item.jobId || item.id,
			title: item.title || item.jobTitle,
			company: item.companyName || item.company,
			location: item.location || item.locations?.[0] || location,
			url: item.url || item.jobUrl || (item.jobId ? `https://www.naukri.com/job-details/${item.jobId}` : '#'),
			description: item.description || item.jobDescription || item.jd || '',
			skills: item.skills || item.keySkills || [],
			postedDate: item.postedDate || item.createdDate || new Date().toISOString()
		}));

		return res.status(200).json({
			success: true,
			results: formattedJobs,
			count: formattedJobs.length
		});

	} catch (error) {
		console.error('Naukri API error:', error);
		return res.status(500).json({
			error: 'Failed to fetch jobs from Naukri',
			message: error.message
		});
	}
};

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
		// Wellfound doesn't have a public API, so we'll use RSS feed via rss2json
		const rssUrl = `https://wellfound.com/jobs.rss?keywords=${encodeURIComponent(keywords)}&remote=${remote}`;
		const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&api_key=public&count=50`;

		const response = await fetch(rss2jsonUrl);

		if (!response.ok) {
			throw new Error(`RSS2JSON API error: ${response.status}`);
		}

		const data = await response.json();
		const items = data.items || [];

		const formattedJobs = items.map(item => {
			const titleParts = item.title.split(' at ');
			const company = titleParts.length > 1 ? titleParts[1].trim() : 'Unknown';
			const jobTitle = titleParts[0] || item.title;

			return {
				id: item.guid || item.link,
				title: jobTitle,
				company: company,
				location: 'Remote',
				url: item.link || '#',
				description: item.description || item.content || '',
				tags: [],
				createdAt: item.pubDate || new Date().toISOString()
			};
		});

		return res.status(200).json({
			success: true,
			results: formattedJobs,
			count: formattedJobs.length
		});

	} catch (error) {
		console.error('Wellfound API error:', error);
		return res.status(500).json({
			error: 'Failed to fetch jobs from Wellfound',
			message: error.message
		});
	}
};

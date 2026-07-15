/**
 * Resources flyout: floating button (like Dict) that opens a dropdown with subject and subsection links.
 * Same topics as the Playground sidebar.
 */
(function () {
	'use strict';

	var toggle = document.getElementById('global-resources-toggle');
	var flyout = document.getElementById('global-resources-flyout');
	var closeBtn = document.getElementById('global-resources-close');
	var body = document.getElementById('global-resources-body');

	if (!toggle || !flyout || !body) return;

	var topics = [
		{ label: 'Programming', items: [
			{ topic: 'python', label: 'Python' }, { topic: 'sql', label: 'SQL' }, { topic: 'git', label: 'Git' },
			{ topic: 'stats', label: 'Statistics' }, { topic: 'math', label: 'Mathematics' }, { topic: 'oops', label: 'OOP' }, { topic: 'prompting', label: 'Prompting' }
		]},
		{ label: 'Data Analytics', items: [
			{ topic: 'data-analytics', label: 'Data Analytics' }, { topic: 'pandas', label: 'Pandas' }, { topic: 'numpy', label: 'NumPy' },
			{ topic: 'data-visualization', label: 'Data Visualization' }, { topic: 'matplotlib', label: 'Visualization (Python)' },
			{ topic: 'product-analytics', label: 'Product Analytics' }, { topic: 'ab-testing', label: 'A/B Testing' }, { topic: 'time-series', label: 'Time Series' }
		]},
		{ label: 'Data Science & ML', items: [
			{ topic: 'data-science', label: 'Data Science' }, { topic: 'machine-learning', label: 'Machine Learning' }, { topic: 'deep-learning', label: 'Deep Learning' },
			{ topic: 'llms', label: 'LLMs & Gen AI' }, { topic: 'nlp', label: 'NLP' }, { topic: 'computer-vision', label: 'Computer Vision' },
			{ topic: 'opencv', label: 'OpenCV' }, { topic: 'reinforcement-learning', label: 'Reinforcement Learning' }, { topic: 'feature-engineering', label: 'Feature Engineering' }
		]},
		{ label: 'Data Engineering', items: [
			{ topic: 'data-engineering', label: 'Data Engineering' }, { topic: 'spark', label: 'Apache Spark' }, { topic: 'streaming', label: 'Streaming Data' },
			{ topic: 'data-warehousing', label: 'Data Warehousing' }, { topic: 'databases', label: 'Databases' }, { topic: 'cloud-data', label: 'Cloud Platforms' },
			{ topic: 'airflow', label: 'Airflow' }, { topic: 'dbt', label: 'dbt' }, { topic: 'mlops', label: 'MLOps' }, { topic: 'devops', label: 'DevOps' }
		]},
		{ label: 'Programming Languages', items: [
			{ topic: 'r', label: 'R Programming' }
		]},
		{ label: 'Business Intelligence', items: [
			{ topic: 'business-analytics', label: 'Business Analytics' }, { topic: 'excel', label: 'Excel' }, { topic: 'power-bi', label: 'Power BI' }, { topic: 'tableau', label: 'Tableau' }
		]},
		{ label: 'Tools & Career', items: [
			{ topic: 'editors-ides', label: 'Editors & IDEs' }, { topic: 'productivity-tools', label: 'Productivity Tools' },
			{ topic: 'communication', label: 'Communication Skills' }, { topic: 'resume-interview', label: 'Resume & Interview Prep' }
		]}
	];

	var inPages = typeof window !== 'undefined' && window.location && (window.location.pathname.indexOf('/pages/') !== -1 || window.location.pathname.indexOf('\\pages\\') !== -1);
	var resourcesPath = inPages ? './resources.html' : 'pages/resources.html';

	var html = '<p class="global-resources-flyout-title">Learn by topic</p><nav class="global-resources-nav">';
	topics.forEach(function (group) {
		html += '<div class="global-resources-group">';
		html += '<p class="global-resources-group-label">' + escapeHtml(group.label) + '</p>';
		html += '<ul class="global-resources-sublist">';
		group.items.forEach(function (item) {
			html += '<li><a href="' + resourcesPath + '?topic=' + encodeURIComponent(item.topic) + '">' + escapeHtml(item.label) + '</a></li>';
		});
		html += '</ul></div>';
	});
	html += '</nav>';
	body.innerHTML = html;

	function escapeHtml(s) {
		var div = document.createElement('div');
		div.textContent = s;
		return div.innerHTML;
	}

	function openFlyout() {
		flyout.classList.add('global-resources-open');
	}
	function closeFlyout() {
		flyout.classList.remove('global-resources-open');
	}

	toggle.addEventListener('click', function () {
		if (flyout.classList.contains('global-resources-open')) closeFlyout();
		else openFlyout();
	});
	if (closeBtn) closeBtn.addEventListener('click', closeFlyout);
})();

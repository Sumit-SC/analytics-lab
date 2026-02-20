"""
Simple Flask server for JobSpy HTML scraper
Run this server, then open jobspy-scraper.html in your browser
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from jobspy import scrape_jobs
import pandas as pd
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for HTML file

# Serve the HTML file
@app.route('/')
def index():
    return send_from_directory('.', 'jobspy-scraper.html')

# API endpoint for job search
@app.route('/api/search', methods=['POST'])
def search_jobs():
    try:
        data = request.json
        
        # Prepare scrape parameters
        scrape_params = {
            "site_name": data.get('site_name', ['indeed']),
            "search_term": data.get('search_term', 'data analyst'),
            "location": data.get('location', 'Remote'),
            "results_wanted": data.get('results_wanted', 50),
            "country_indeed": data.get('country_indeed', 'USA'),
            "is_remote": data.get('is_remote', True),
            "linkedin_fetch_description": data.get('linkedin_fetch_description', False),
            "verbose": 1
        }
        
        # Add optional parameters
        if data.get('hours_old', 0) > 0:
            scrape_params["hours_old"] = data['hours_old']
        
        if data.get('job_type'):
            scrape_params["job_type"] = data['job_type']
        
        if data.get('google_search_term'):
            scrape_params["google_search_term"] = data['google_search_term']
        
        if data.get('proxies'):
            scrape_params["proxies"] = data['proxies']
        
        # Run scraper
        jobs = scrape_jobs(**scrape_params)
        
        # Convert to JSON
        jobs_json = jobs.to_dict(orient='records')
        
        return jsonify({
            "success": True,
            "jobs": jobs_json,
            "count": len(jobs_json)
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "jobs": [],
            "count": 0
        }), 500

if __name__ == '__main__':
    print("Starting JobSpy server...")
    print("Open http://localhost:5000 in your browser")
    app.run(debug=True, port=5000)

"""
# JobSpy Interactive Job Scraper

Interactive job scraper using [JobSpy](https://github.com/speedyapply/JobSpy) with Marimo.
Scrape jobs from LinkedIn, Indeed, Glassdoor, Google, ZipRecruiter & more.

**Usage:** Adjust the parameters below and the scraper will run automatically.
"""

import marimo

__generated_with = "0.1.0"
app = marimo.App(width="medium")


@app.cell
def __():
    import marimo as mo
    import pandas as pd
    from jobspy import scrape_jobs
    import csv
    from datetime import datetime
    from io import StringIO
    import json
    return csv, datetime, json, mo, pd, scrape_jobs, StringIO


@app.cell
def __(mo):
    # Interactive form for job search parameters
    mo.md("""
    ## 🔍 Job Search Parameters
    
    Configure your search below. The scraper will run automatically when you change values.
    """)
    return


@app.cell
def __(mo):
    # Search term input
    search_term = mo.ui.text(
        value="data analyst",
        label="Search Term",
        placeholder="e.g., data analyst, software engineer",
        full_width=True
    )
    search_term
    return search_term,


@app.cell
def __(mo):
    # Location input
    location = mo.ui.text(
        value="Remote",
        label="Location",
        placeholder="e.g., Remote, San Francisco CA, India",
        full_width=True
    )
    location
    return location,


@app.cell
def __(mo):
    # Multiple site selection (checkboxes)
    available_sites = [
        "indeed",
        "linkedin", 
        "zip_recruiter",
        "google",
        "glassdoor",
        "bayt",
        "naukri",
        "bdjobs"
    ]
    
    site_selection = mo.ui.multiselect(
        options=available_sites,
        value=["indeed", "linkedin", "zip_recruiter", "google"],
        label="Job Sites (select multiple)",
        full_width=True
    )
    site_selection
    return available_sites, site_selection


@app.cell
def __(mo):
    # Results wanted slider
    results_wanted = mo.ui.slider(
        start=10,
        stop=100,
        step=10,
        value=50,
        label="Results per site",
        full_width=True
    )
    results_wanted
    return results_wanted,


@app.cell
def __(mo):
    # Hours old slider
    hours_old = mo.ui.slider(
        start=24,
        stop=168,
        step=24,
        value=72,
        label="Hours old (only jobs posted in last N hours)",
        full_width=True
    )
    hours_old
    return hours_old,


@app.cell
def __(mo):
    # Country dropdown for Indeed/Glassdoor
    country_options = [
        "USA", "India", "UK", "Canada", "Australia", "Germany", 
        "France", "Netherlands", "Singapore", "Brazil", "Mexico"
    ]
    
    country_indeed = mo.ui.dropdown(
        options=country_options,
        value="USA",
        label="Country (for Indeed/Glassdoor)",
        full_width=True
    )
    country_indeed
    return country_indeed, country_options


@app.cell
def __(mo):
    # Google search term (optional, specific syntax)
    google_search_term = mo.ui.text(
        value="",
        label="Google Search Term (optional, specific syntax)",
        placeholder="e.g., software engineer jobs near San Francisco, CA since yesterday",
        full_width=True
    )
    google_search_term
    return google_search_term,


@app.cell
def __(mo):
    # Remote filter checkbox
    is_remote = mo.ui.checkbox(
        value=True,
        label="Remote jobs only"
    )
    is_remote
    return is_remote,


@app.cell
def __(mo):
    # LinkedIn fetch description checkbox
    linkedin_fetch_description = mo.ui.checkbox(
        value=False,
        label="LinkedIn: Fetch full descriptions (slower but more info)"
    )
    linkedin_fetch_description
    return linkedin_fetch_description,


@app.cell
def __(mo):
    # Proxies input (optional)
    proxies_input = mo.ui.text(
        value="",
        label="Proxies (optional, comma-separated)",
        placeholder="e.g., user:pass@host:port, localhost",
        full_width=True
    )
    proxies_input
    return proxies_input,


@app.cell
def __(mo, csv, datetime, google_search_term, hours_old, is_remote, linkedin_fetch_description, location, proxies_input, results_wanted, search_term, site_selection, country_indeed):
    # Scrape jobs based on form inputs
    mo.md("""
    ## 📊 Scraping Jobs...
    
    Running JobSpy scraper with your parameters...
    """)
    
    # Parse proxies if provided
    proxies = None
    if proxies_input.value and proxies_input.value.strip():
        proxies = [p.strip() for p in proxies_input.value.split(",") if p.strip()]
    
    # Prepare scrape parameters
    scrape_params = {
        "site_name": site_selection.value if site_selection.value else ["indeed"],
        "search_term": search_term.value or "data analyst",
        "location": location.value or "Remote",
        "results_wanted": results_wanted.value,
        "hours_old": hours_old.value,
        "country_indeed": country_indeed.value,
        "is_remote": is_remote.value,
        "linkedin_fetch_description": linkedin_fetch_description.value,
        "verbose": 1
    }
    
    # Add optional parameters
    if google_search_term.value and google_search_term.value.strip():
        scrape_params["google_search_term"] = google_search_term.value
    
    if proxies:
        scrape_params["proxies"] = proxies
    
    # Run scraper
    try:
        jobs = scrape_jobs(**scrape_params)
        
        if len(jobs) > 0:
            mo.md(f"""
            ### ✅ Found {len(jobs)} jobs!
            
            Scraped from: {', '.join(scrape_params['site_name'])}
            """)
        else:
            mo.md("""
            ### ⚠️ No jobs found
            
            Try adjusting your search parameters or expanding the time range.
            """)
    except Exception as e:
        mo.md(f"""
        ### ❌ Error
        
        {str(e)}
        
        Check your parameters and try again.
        """)
        jobs = pd.DataFrame()
    
    jobs
    return jobs, proxies, scrape_params


@app.cell
def __(jobs, mo, pd):
    # Display summary statistics
    if len(jobs) > 0:
        summary_html = f"""
        <div style="padding: 1rem; background: #f3f4f6; border-radius: 0.5rem; margin: 1rem 0;">
            <h3 style="margin-top: 0;">📈 Summary</h3>
            <p><strong>Total jobs:</strong> {len(jobs)}</p>
        """
        
        if 'site' in jobs.columns:
            site_counts = jobs['site'].value_counts()
            summary_html += "<p><strong>By source:</strong></p><ul>"
            for site, count in site_counts.items():
                summary_html += f"<li>{site}: {count}</li>"
            summary_html += "</ul>"
        
        if 'job_type' in jobs.columns:
            job_types = jobs['job_type'].value_counts()
            summary_html += "<p><strong>Job types:</strong></p><ul>"
            for jtype, count in job_types.items():
                summary_html += f"<li>{jtype}: {count}</li>"
            summary_html += "</ul>"
        
        if 'is_remote' in jobs.columns:
            remote_count = jobs['is_remote'].sum() if jobs['is_remote'].dtype == bool else 0
            summary_html += f"<p><strong>Remote jobs:</strong> {remote_count}</p>"
        
        summary_html += "</div>"
        mo.html(summary_html)
    return


@app.cell
def __(jobs, mo, pd):
    # Display jobs table
    if len(jobs) > 0:
        # Select key columns for display
        display_cols = ['title', 'company', 'location', 'site', 'job_type', 'job_url']
        if 'min_amount' in jobs.columns and 'max_amount' in jobs.columns:
            display_cols.extend(['min_amount', 'max_amount'])
        if 'date_posted' in jobs.columns:
            display_cols.append('date_posted')
        
        # Filter to available columns
        display_cols = [col for col in display_cols if col in jobs.columns]
        
        mo.md("## 📋 Job Listings")
        jobs[display_cols].head(100)
    return


@app.cell
def __(csv, datetime, jobs, mo, pd, StringIO):
    # Export functionality
    if len(jobs) > 0:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        search_safe = search_term.value.replace(' ', '_') if search_term.value else 'jobs'
        
        # Generate CSV
        csv_buffer = StringIO()
        jobs.to_csv(csv_buffer, quoting=csv.QUOTE_NONNUMERIC, escapechar="\\", index=False)
        csv_data = csv_buffer.getvalue()
        
        # Generate JSON
        json_data = jobs.to_json(orient='records', indent=2, date_format='iso', default=str)
        
        mo.md("""
        ## 💾 Export Results
        
        Download your results:
        """)
        
        # Create download buttons
        csv_filename = f"jobs_{search_safe}_{timestamp}.csv"
        json_filename = f"jobs_{search_safe}_{timestamp}.json"
        
        mo.html(f"""
        <div style="display: flex; gap: 1rem; margin: 1rem 0;">
            <a href="data:text/csv;charset=utf-8,{mo.html.escape(csv_data)}" 
               download="{csv_filename}"
               style="padding: 0.5rem 1rem; background: #6366f1; color: white; border-radius: 0.375rem; text-decoration: none;">
                📥 Download CSV ({len(jobs)} jobs)
            </a>
            <a href="data:application/json;charset=utf-8,{mo.html.escape(json_data)}" 
               download="{json_filename}"
               style="padding: 0.5rem 1rem; background: #10b981; color: white; border-radius: 0.375rem; text-decoration: none;">
                📥 Download JSON ({len(jobs)} jobs)
            </a>
        </div>
        """)
    return csv_data, csv_filename, json_data, json_filename, search_safe, timestamp


@app.cell
def __(jobs, mo):
    # Display raw JSON preview (for API integration)
    if len(jobs) > 0:
        mo.md("""
        ## 🔗 JSON Output (for API integration)
        
        First 3 jobs as JSON:
        """)
        
        import json
        import math
        
        jobs_json = jobs.head(3).to_dict(orient='records')
        
        # Clean NaN values
        def clean_json(obj):
            if isinstance(obj, dict):
                return {k: clean_json(v) for k, v in obj.items() if not (isinstance(v, float) and math.isnan(v))}
            elif isinstance(obj, list):
                return [clean_json(item) for item in obj]
            return obj
        
        clean_jobs = clean_json(jobs_json)
        json_preview = json.dumps(clean_jobs, indent=2, default=str)
        
        mo.html(f"""
        <pre style="background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 0.5rem; overflow-x: auto;">
{mo.html.escape(json_preview)}
        </pre>
        """)
    return clean_jobs, json_preview, jobs_json


@app.cell
def __(mo):
    # Footer with resources
    mo.md("""
    ---
    
    ## 📚 Resources
    
    - **JobSpy GitHub**: https://github.com/speedyapply/JobSpy
    - **Marimo Docs**: https://marimo.io/docs
    - **Supported Sites**: LinkedIn, Indeed, Glassdoor, Google, ZipRecruiter, Bayt, Naukri, BDJobs
    
    **Note**: Indeed is the most reliable scraper. LinkedIn may rate limit around the 10th page.
    """)
    return


if __name__ == "__main__":
    app.run()

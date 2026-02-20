"""
# JobSpy Interactive Job Scraper

Interactive job scraper using [JobSpy](https://github.com/speedyapply/JobSpy) with Marimo.
Scrape jobs from 65+ job boards, ATS platforms, and company career pages.

**Usage:** Configure parameters below, then click "Search Jobs" button to fetch results.
"""

import marimo

__generated_with = "0.3.0"
app = marimo.App(width="full")


@app.cell
def __():
    import marimo as mo
    import pandas as pd
    from jobspy import scrape_jobs
    import csv
    from datetime import datetime
    from io import StringIO
    import json
    import math
    from urllib.parse import quote
    return csv, datetime, json, math, mo, pd, quote, scrape_jobs, StringIO


@app.cell
def __(mo):
    mo.md("""
    # 🔍 JobSpy Interactive Job Scraper
    
    Configure your search parameters below, then click **"Search Jobs"** to fetch results.
    Results will be stored and available for analysis and export.
    """)
    return


@app.cell
def __(mo):
    # ============================================================================
    # UNIFIED SEARCH PARAMETERS PANEL
    # ============================================================================
    
    # Job Boards (21 sources)
    job_boards = [
        "indeed", "linkedin", "zip_recruiter", "glassdoor", "google",
        "dice", "simplyhired", "monster", "careerbuilder", "stepstone",
        "wellfound", "bayt", "naukri", "bdjobs", "internshala",
        "exa", "upwork", "builtin", "snagajob", "dribbble"
    ]
    
    # Remote Job Boards (6 sources)
    remote_boards = [
        "remoteok", "remotive", "weworkremotely", "jobicy", 
        "himalayas", "arbeitnow"
    ]
    
    # ATS Platforms (22 sources)
    ats_platforms = [
        "greenhouse", "lever", "ashby", "workable", "smartrecruiters",
        "rippling", "workday", "recruitee", "teamtailor", "bamboohr",
        "personio", "jazzhr", "icims", "taleo", "successfactors",
        "jobvite", "adp", "ukg", "breezyhr", "comeet", "pinpoint"
    ]
    
    # Company Career Pages (12 sources)
    company_pages = [
        "amazon", "apple", "microsoft", "nvidia", "tiktok", "uber",
        "cursor", "google_careers", "meta", "netflix", "stripe", "openai"
    ]
    
    # Aggregator APIs (4 sources)
    aggregators = [
        "usajobs", "adzuna", "reed", "jooble", "careerjet"
    ]
    
    # Combine all sources
    all_sources = sorted(list(set(job_boards + remote_boards + ats_platforms + company_pages + aggregators)))
    
    # Default selection (JobSpy supported sources)
    default_sources = ["indeed", "linkedin", "zip_recruiter", "google"]
    
    return (
        aggregators,
        all_sources,
        ats_platforms,
        company_pages,
        default_sources,
        job_boards,
        remote_boards,
    )


@app.cell
def __(all_sources, default_sources, mo):
    # ============================================================================
    # UNIFIED SEARCH FORM - ALL PARAMETERS IN ONE SINGLE CELL
    # ============================================================================
    
    mo.md("""
    ## ⚙️ Search Configuration
    
    **Configure all parameters below in this single form, then click "Search Jobs" to fetch results.**
    """)
    
    # Define country options
    country_options = [
        "USA", "India", "UK", "Canada", "Australia", "Germany", "France",
        "Netherlands", "Singapore", "Brazil", "Mexico", "Spain", "Italy",
        "Japan", "South Korea", "China", "Ireland", "Sweden", "Norway",
        "Denmark", "Poland", "Belgium", "Switzerland", "Austria", "Portugal"
    ]
    
    # Create all UI elements in one place
    search_term = mo.ui.text(
        value="data analyst",
        label="🔎 Search Term",
        placeholder="e.g., data analyst, software engineer, AI/ML Engineer",
        full_width=True
    )
    
    location = mo.ui.text(
        value="Remote",
        label="📍 Location",
        placeholder="e.g., Remote, San Francisco CA, London, India",
        full_width=True
    )
    
    site_selection = mo.ui.multiselect(
        options=all_sources,
        value=default_sources,
        label="🌐 Job Sites (Select Multiple)",
        full_width=True
    )
    
    results_wanted = mo.ui.slider(
        start=10,
        stop=200,
        step=10,
        value=50,
        label="📊 Results per site",
        full_width=True
    )
    
    hours_old = mo.ui.slider(
        start=0,
        stop=720,  # 30 days
        step=24,
        value=72,
        label="⏰ Hours old (0 = no filter)",
        full_width=True
    )
    
    country_indeed = mo.ui.dropdown(
        options=country_options,
        value="USA",
        label="🌍 Country (for Indeed/Glassdoor)",
        full_width=True
    )
    
    google_search_term = mo.ui.text(
        value="",
        label="🔍 Google Search Term (optional)",
        placeholder="e.g., software engineer jobs near San Francisco, CA since yesterday",
        full_width=True
    )
    
    is_remote = mo.ui.checkbox(
        value=True,
        label="🏠 Remote jobs only"
    )
    
    job_type = mo.ui.dropdown(
        options=["", "fulltime", "parttime", "contract", "internship", "temporary"],
        value="",
        label="💼 Job Type (empty = all types)",
        full_width=True
    )
    
    linkedin_fetch_description = mo.ui.checkbox(
        value=False,
        label="📄 LinkedIn: Fetch full descriptions (slower)"
    )
    
    proxies_input = mo.ui.text(
        value="",
        label="🔐 Proxies (optional, comma-separated)",
        placeholder="e.g., user:pass@host:port, localhost",
        full_width=True
    )
    
    search_button = mo.ui.button(
        label="🔍 Search Jobs",
        kind="success",
        full_width=True
    )
    
    # Render ALL form elements together in ONE unified display
    # All parameters are in this single cell - they will display together
    # Using mo.Html to create a visual container
    mo.Html("""
    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 0.75rem; border: 2px solid #e5e7eb; margin: 1rem 0;">
        <h3 style="margin-top: 0; color: #374151; font-size: 1.25rem; margin-bottom: 1rem;">📋 All Search Parameters</h3>
        <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">Configure all parameters below, then click "Search Jobs" at the bottom.</p>
    </div>
    """)
    
    # Render all form elements together (they're all in this single cell)
    search_term
    location
    site_selection
    results_wanted
    hours_old
    country_indeed
    google_search_term
    is_remote
    job_type
    linkedin_fetch_description
    proxies_input
    
    # Final button at the end
    mo.Html("""
    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #e5e7eb;">
    </div>
    """)
    
    search_button
    
    # Button value (increments when clicked) drives the scrape cell
    button_clicked = search_button.value
    
    return (
        button_clicked,
        country_indeed,
        country_options,
        google_search_term,
        hours_old,
        is_remote,
        job_type,
        linkedin_fetch_description,
        location,
        proxies_input,
        results_wanted,
        search_term,
        site_selection,
    )


@app.cell
def __(
    button_clicked,
    country_indeed,
    google_search_term,
    hours_old,
    is_remote,
    job_type,
    linkedin_fetch_description,
    location,
    mo,
    pd,
    proxies_input,
    results_wanted,
    scrape_jobs,
    search_term,
    site_selection,
):
    # ============================================================================
    # SCRAPE JOBS - Only runs when button is clicked
    # ============================================================================
    
    # Store results in a way that persists (using a simple pattern)
    # Initialize on first run
    if '_marimo_stored_jobs' not in globals():
        globals()['_marimo_stored_jobs'] = pd.DataFrame()
        globals()['_marimo_stored_params'] = {}
    
    stored_jobs = globals().get('_marimo_stored_jobs', pd.DataFrame())
    stored_params = globals().get('_marimo_stored_params', {})
    
    # Only scrape when button is clicked (button_clicked changes)
    if button_clicked:
        mo.md("## 📊 Scraping Jobs...")
        mo.md("⏳ Please wait while we fetch job listings...")
        
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
            "country_indeed": country_indeed.value,
            "is_remote": is_remote.value,
            "linkedin_fetch_description": linkedin_fetch_description.value,
            "verbose": 1
        }
        
        # Add optional parameters
        if hours_old.value > 0:
            scrape_params["hours_old"] = hours_old.value
        
        if job_type.value:
            scrape_params["job_type"] = job_type.value
        
        if google_search_term.value and google_search_term.value.strip():
            scrape_params["google_search_term"] = google_search_term.value
        
        if proxies:
            scrape_params["proxies"] = proxies
        
        # Run scraper
        try:
            jobs = scrape_jobs(**scrape_params)
            
            # Store results for use in other cells
            globals()['_marimo_stored_jobs'] = jobs.copy()
            globals()['_marimo_stored_params'] = scrape_params.copy()
            stored_jobs = jobs.copy()
            stored_params = scrape_params.copy()
            
            if len(jobs) > 0:
                mo.md(f"""
                ### ✅ Successfully scraped {len(jobs)} jobs!
                
                **Sources:** {', '.join(scrape_params['site_name'])}
                
                **Results stored!** You can now view analytics, export, or search again with different parameters.
                """)
            else:
                mo.md("""
                ### ⚠️ No jobs found
                
                Try adjusting your search parameters or expanding the time range.
                """)
                globals()['_marimo_stored_jobs'] = pd.DataFrame()
                stored_jobs = pd.DataFrame()
        except Exception as e:
            error_msg = str(e)
            globals()['_marimo_stored_jobs'] = pd.DataFrame()
            stored_jobs = pd.DataFrame()
            mo.md(f"""
            ### ❌ Error
            
            {error_msg}
            
            **Note**: JobSpy currently supports: `indeed`, `linkedin`, `zip_recruiter`, `glassdoor`, `google`, `bayt`, `naukri`, `bdjobs`
            """)
    else:
        # Button not clicked yet - show instructions
        if len(stored_jobs) == 0:
            mo.md("""
            ## 📊 Ready to Search
            
            Configure your search parameters above and click **"Search Jobs"** button to fetch results.
            """)
        else:
            # Show stored results info
            mo.md(f"""
            ## 📊 Current Results
            
            **{len(stored_jobs)} jobs** stored from last search.
            
            Click **"Search Jobs"** again to fetch new results with updated parameters.
            """)
    
    # Return stored results (always available for other cells)
    jobs = stored_jobs.copy() if len(stored_jobs) > 0 else pd.DataFrame()
    scrape_params = stored_params.copy() if stored_params else {}
    
    jobs
    return jobs, scrape_params


@app.cell
def __(jobs, mo, pd):
    # ============================================================================
    # COMPREHENSIVE ANALYTICS & STATISTICS
    # ============================================================================
    if len(jobs) > 0:
        # Calculate comprehensive statistics
        total_jobs = len(jobs)
        
        # By source
        source_stats = ""
        if 'site' in jobs.columns:
            site_counts = jobs['site'].value_counts()
            source_stats = "<div style='margin-top: 1rem;'><strong>By Source:</strong><ul style='margin-top: 0.5rem;'>"
            for site, count in site_counts.items():
                percentage = (count / total_jobs) * 100
                source_stats += f"<li>{site}: <strong>{count}</strong> ({percentage:.1f}%)</li>"
            source_stats += "</ul></div>"
        
        # By job type
        type_stats = ""
        if 'job_type' in jobs.columns:
            job_types = jobs['job_type'].value_counts()
            type_stats = "<div style='margin-top: 1rem;'><strong>By Job Type:</strong><ul style='margin-top: 0.5rem;'>"
            for jtype, count in job_types.items():
                if pd.notna(jtype) and jtype:
                    percentage = (count / total_jobs) * 100
                    type_stats += f"<li>{jtype}: <strong>{count}</strong> ({percentage:.1f}%)</li>"
            type_stats += "</ul></div>"
        
        # Remote vs On-site
        remote_stats = ""
        if 'is_remote' in jobs.columns:
            remote_count = jobs['is_remote'].sum() if jobs['is_remote'].dtype == bool else (jobs['is_remote'] == True).sum()
            on_site_count = total_jobs - remote_count
            remote_pct = (remote_count / total_jobs) * 100 if total_jobs > 0 else 0
            on_site_pct = (on_site_count / total_jobs) * 100 if total_jobs > 0 else 0
            remote_stats = f"""
            <div style='margin-top: 1rem;'>
                <strong>Remote vs On-site:</strong>
                <ul style='margin-top: 0.5rem;'>
                    <li>Remote: <strong>{remote_count}</strong> ({remote_pct:.1f}%)</li>
                    <li>On-site: <strong>{on_site_count}</strong> ({on_site_pct:.1f}%)</li>
                </ul>
            </div>
            """
        
        # Top companies
        company_stats = ""
        if 'company' in jobs.columns:
            top_companies = jobs['company'].value_counts().head(10)
            company_stats = "<div style='margin-top: 1rem;'><strong>Top Companies:</strong><ul style='margin-top: 0.5rem;'>"
            for company, count in top_companies.items():
                if pd.notna(company):
                    company_stats += f"<li>{company}: <strong>{count}</strong> jobs</li>"
            company_stats += "</ul></div>"
        
        # Top locations
        location_stats = ""
        if 'location' in jobs.columns:
            top_locations = jobs['location'].value_counts().head(10)
            location_stats = "<div style='margin-top: 1rem;'><strong>Top Locations:</strong><ul style='margin-top: 0.5rem;'>"
            for loc, count in top_locations.items():
                if pd.notna(loc):
                    location_stats += f"<li>{loc}: <strong>{count}</strong> jobs</li>"
            location_stats += "</ul></div>"
        
        # Salary statistics
        salary_stats = ""
        if 'min_amount' in jobs.columns and 'max_amount' in jobs.columns:
            salary_jobs = jobs[(jobs['min_amount'].notna()) | (jobs['max_amount'].notna())]
            if len(salary_jobs) > 0:
                avg_min = salary_jobs['min_amount'].mean() if salary_jobs['min_amount'].notna().any() else None
                avg_max = salary_jobs['max_amount'].mean() if salary_jobs['max_amount'].notna().any() else None
                if avg_min is not None or avg_max is not None:
                    salary_stats = "<div style='margin-top: 1rem;'><strong>Salary Info:</strong><ul style='margin-top: 0.5rem;'>"
                    salary_stats += f"<li>Jobs with salary info: <strong>{len(salary_jobs)}</strong> ({len(salary_jobs)/total_jobs*100:.1f}%)</li>"
                    if avg_min is not None:
                        salary_stats += f"<li>Average min salary: <strong>${avg_min:,.0f}</strong></li>"
                    if avg_max is not None:
                        salary_stats += f"<li>Average max salary: <strong>${avg_max:,.0f}</strong></li>"
                    salary_stats += "</ul></div>"
        
        # Build comprehensive analytics HTML
        analytics_html = f"""
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 2rem; 
                    border-radius: 1rem; 
                    margin: 1.5rem 0;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="margin-top: 0; color: white; font-size: 1.75rem;">📈 Analytics Dashboard</h2>
            <div style="font-size: 2.5rem; font-weight: bold; margin: 1rem 0;">
                {total_jobs} Total Jobs
            </div>
            <div style="background: rgba(255,255,255,0.2); padding: 1.5rem; border-radius: 0.5rem; margin-top: 1rem;">
                {source_stats}
                {type_stats}
                {remote_stats}
                {company_stats}
                {location_stats}
                {salary_stats}
            </div>
        </div>
        """
        
        mo.Html(analytics_html)
    else:
        mo.md("""
        ## 📈 Analytics Dashboard
        
        No results yet. Click **"Search Jobs"** button above to fetch job listings.
        """)
    return


@app.cell
def __(jobs, mo, pd):
    # ============================================================================
    # DISPLAY OPTIONS - Show all or paginated
    # ============================================================================
    if len(jobs) > 0:
        # Toggle for showing all results
        show_all = mo.ui.checkbox(
            value=False,
            label="📋 Show all results (may be slow for large datasets)"
        )
        show_all
        
        # Number of results to show
        num_to_show = len(jobs) if show_all.value else min(100, len(jobs))
        
        mo.md(f"## 📋 Job Listings ({num_to_show} of {len(jobs)} displayed)")
        
        # Select key columns for display
        display_cols = ['title', 'company', 'location', 'site', 'job_type', 'job_url']
        if 'min_amount' in jobs.columns and 'max_amount' in jobs.columns:
            display_cols.extend(['min_amount', 'max_amount'])
        if 'date_posted' in jobs.columns:
            display_cols.append('date_posted')
        
        # Filter to available columns
        display_cols = [col for col in display_cols if col in jobs.columns]
        
        # Display DataFrame
        display_df = jobs[display_cols].head(num_to_show)
        display_df
        
        # If not showing all, provide HTML table for full results
        if not show_all.value and len(jobs) > 100:
            mo.md(f"""
            **Note:** Showing first 100 results. Check "Show all results" above to see all {len(jobs)} jobs.
            """)
    else:
        mo.md("""
        ## 📋 Job Listings
        
        No results to display. Click **"Search Jobs"** button above to fetch job listings.
        """)
    return


@app.cell
def __(jobs, mo, pd):
    # ============================================================================
    # FULL RESULTS HTML TABLE (for complete display)
    # ============================================================================
    if len(jobs) > 0:
        # Create HTML table for all results
        def create_html_table(df, max_rows=500):
            """Create a styled HTML table from DataFrame"""
            # Select display columns
            display_cols = ['title', 'company', 'location', 'site', 'job_type', 'job_url']
            if 'min_amount' in df.columns and 'max_amount' in df.columns:
                display_cols.extend(['min_amount', 'max_amount'])
            if 'date_posted' in df.columns:
                display_cols.append('date_posted')
            
            display_cols = [col for col in display_cols if col in df.columns]
            df_display = df[display_cols].head(max_rows)
            
            # Build HTML
            html = """
            <div style="overflow-x: auto; margin: 1rem 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                    <thead>
                        <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
            """
            
            # Header row
            for col in display_cols:
                html += f'<th style="padding: 0.75rem; text-align: left; font-weight: 600; color: #374151;">{col.replace("_", " ").title()}</th>'
            html += "</tr></thead><tbody>"
            
            # Data rows
            for idx, row in df_display.iterrows():
                html += '<tr style="border-bottom: 1px solid #e5e7eb;">'
                for col in display_cols:
                    value = row[col]
                    if pd.isna(value):
                        value = ""
                    elif col == 'job_url' and pd.notna(value):
                        value = f'<a href="{value}" target="_blank" style="color: #3b82f6; text-decoration: none;">View Job</a>'
                    else:
                        value = str(value)[:100]  # Truncate long values
                    html += f'<td style="padding: 0.75rem; color: #1f2937;">{value}</td>'
                html += "</tr>"
            
            html += """
                    </tbody>
                </table>
            </div>
            """
            return html
        
        # Show HTML table option
        show_html_table = mo.ui.checkbox(
            value=False,
            label="📊 Display full results as HTML table (all columns, clickable links)"
        )
        show_html_table
        
        if show_html_table.value:
            mo.md("### Full Results HTML Table")
            table_html = create_html_table(jobs, max_rows=len(jobs))
            mo.Html(table_html)
    return


@app.cell
def __(csv, datetime, jobs, mo, pd, search_term, StringIO):
    # ============================================================================
    # EXPORT FUNCTIONALITY
    # ============================================================================
    if len(jobs) > 0:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        search_safe = search_term.value.replace(' ', '_')[:50] if search_term.value else 'jobs'
        
        # Generate CSV
        csv_buffer = StringIO()
        jobs.to_csv(csv_buffer, quoting=csv.QUOTE_NONNUMERIC, escapechar="\\", index=False)
        csv_data = csv_buffer.getvalue()
        
        # Generate JSON
        json_data = jobs.to_json(orient='records', indent=2, date_format='iso', default=str)
        
        mo.md("## 💾 Export Results")
        
        # Create download links using HTML
        csv_filename = f"jobs_{search_safe}_{timestamp}.csv"
        json_filename = f"jobs_{search_safe}_{timestamp}.json"
        
        # Encode data for data URLs
        csv_encoded = quote(csv_data)
        json_encoded = quote(json_data)
        
        download_html = f"""
        <div style="display: flex; gap: 1rem; margin: 1rem 0; flex-wrap: wrap;">
            <a href="data:text/csv;charset=utf-8,{csv_encoded}" 
               download="{csv_filename}"
               style="padding: 0.75rem 1.5rem; background: #6366f1; color: white; border-radius: 0.5rem; text-decoration: none; font-weight: bold; transition: background 0.2s;">
                📥 Download CSV ({len(jobs)} jobs)
            </a>
            <a href="data:application/json;charset=utf-8,{json_encoded}" 
               download="{json_filename}"
               style="padding: 0.75rem 1.5rem; background: #10b981; color: white; border-radius: 0.5rem; text-decoration: none; font-weight: bold; transition: background 0.2s;">
                📥 Download JSON ({len(jobs)} jobs)
            </a>
        </div>
        <p style="color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem;">
            Files will be saved as: <code>{csv_filename}</code> and <code>{json_filename}</code>
        </p>
        """
        
        mo.Html(download_html)
    else:
        mo.md("""
        ## 💾 Export Results
        
        No results to export. Click **"Search Jobs"** button above to fetch job listings.
        """)
    return csv_data, csv_filename, json_data, json_filename, search_safe, timestamp


@app.cell
def __(jobs, json, math, mo, pd):
    # ============================================================================
    # JSON PREVIEW (for API integration)
    # ============================================================================
    if len(jobs) > 0:
        mo.md("## 🔗 JSON Output Preview (for API integration)")
        
        # Number of preview records
        preview_count = mo.ui.slider(
            start=1,
            stop=min(10, len(jobs)),
            step=1,
            value=3,
            label="Number of records to preview",
            full_width=True
        )
        preview_count
        
        jobs_json = jobs.head(preview_count.value).to_dict(orient='records')
        
        # Clean NaN values
        def clean_json(obj):
            if isinstance(obj, dict):
                return {k: clean_json(v) for k, v in obj.items() 
                       if not (isinstance(v, float) and math.isnan(v))}
            elif isinstance(obj, list):
                return [clean_json(item) for item in obj]
            return obj
        
        clean_jobs = clean_json(jobs_json)
        json_preview = json.dumps(clean_jobs, indent=2, default=str)
        
        preview_html = f"""
        <div style="background: #1e293b; color: #e2e8f0; padding: 1.5rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0;">
            <pre style="margin: 0; font-size: 0.875rem; line-height: 1.5; font-family: 'Courier New', monospace;">
{json_preview}
            </pre>
        </div>
        """
        
        mo.Html(preview_html)
    else:
        mo.md("""
        ## 🔗 JSON Output Preview
        
        No results to preview. Click **"Search Jobs"** button above to fetch job listings.
        """)
    return


@app.cell
def __(mo):
    # ============================================================================
    # FOOTER & RESOURCES
    # ============================================================================
    mo.md("""
    ---
    
    ## 📚 Resources & Notes
    
    - **JobSpy GitHub**: https://github.com/speedyapply/JobSpy
    - **Marimo Docs**: https://marimo.io/docs
    - **Ever-Jobs** (65+ sources): https://github.com/ever-co/ever-jobs
    
    ### Currently Supported by JobSpy Library:
    - `indeed` ✅ (most reliable, no rate limiting)
    - `linkedin` ✅ (may rate limit around 10th page)
    - `zip_recruiter` ✅
    - `glassdoor` ✅
    - `google` ✅ (requires specific syntax)
    - `bayt` ✅ (Middle East/North Africa)
    - `naukri` ✅ (India)
    - `bdjobs` ✅ (Bangladesh)
    
    **Note**: Indeed is the most reliable scraper. LinkedIn may rate limit around the 10th page. Use proxies for better results.
    
    ### How to Use:
    1. Configure search parameters above
    2. Click **"Search Jobs"** button to fetch results
    3. Results are stored and available for analysis/export
    4. Change parameters and click button again to search with new criteria
    """)
    return


if __name__ == "__main__":
    app.run()

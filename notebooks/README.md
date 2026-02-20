# JobSpy Interactive Notebook

This folder contains a Jupyter notebook that uses [JobSpy](https://github.com/speedyapply/JobSpy) to scrape jobs from LinkedIn, Indeed, Glassdoor, Google, ZipRecruiter & more.

## Files

- `jobspy-scraper.ipynb` - Main notebook with JobSpy scraper
- `requirements.txt` - Python dependencies
- `binder/environment.yml` - Conda environment for Binder

## Setup for Binder

### Option 1: Using this repository (if pushed to GitHub)

1. **Push this repo to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Add JobSpy notebook"
   git push origin main
   ```

2. **Get your Binder URL:**
   - Go to [mybinder.org](https://mybinder.org)
   - Enter your repo URL: `github.com/YOUR_USERNAME/YOUR_REPO`
   - Select branch: `main` (or your default branch)
   - Click "launch"
   - Copy the URL from the address bar

3. **Update jobs.html:**
   - Open `analytics-lab/jobs.html`
   - Find `var BINDER_NOTEBOOK_URL = '';`
   - Replace with: `var BINDER_NOTEBOOK_URL = 'https://mybinder.org/v2/gh/YOUR_USERNAME/YOUR_REPO/main?urlpath=notebooks/jobspy-scraper.ipynb';`

### Option 2: Using a separate GitHub repo

1. Create a new GitHub repo (e.g., `jobspy-notebook`)
2. Copy the `notebooks/` folder contents to that repo
3. Follow steps 2-3 from Option 1, using the new repo URL

### Option 3: Run locally

1. Install dependencies:
   ```bash
   pip install -r notebooks/requirements.txt
   ```

2. Launch Jupyter:
   ```bash
   jupyter notebook notebooks/jobspy-scraper.ipynb
   ```

## Usage

1. Open the notebook (via Binder or locally)
2. Modify the search parameters in the "Search Parameters" cell:
   - `SEARCH_TERM`: Job title/keywords (e.g., "data analyst")
   - `LOCATION`: Location (e.g., "Remote", "San Francisco, CA")
   - `SITES`: Job boards to search (e.g., ["indeed", "linkedin"])
   - `RESULTS_WANTED`: Number of results per site
   - `HOURS_OLD`: Only jobs posted in last N hours
3. Run all cells (Cell → Run All)
4. View results in the table
5. Export to CSV or JSON

## Supported Job Boards

- LinkedIn
- Indeed
- Glassdoor
- Google Jobs
- ZipRecruiter
- Bayt
- Naukri
- BDJobs

## Notes

- Indeed is the most reliable scraper with no rate limiting
- LinkedIn is restrictive and may rate limit around the 10th page
- All boards are capped at ~1000 jobs per search
- Use proxies if you encounter rate limiting (429 errors)

## Resources

- [JobSpy GitHub](https://github.com/speedyapply/JobSpy)
- [Binder Documentation](https://mybinder.readthedocs.io/)

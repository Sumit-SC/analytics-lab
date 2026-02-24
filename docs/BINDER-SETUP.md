# Binder Setup Guide for JobSpy Notebook

This guide will help you set up the JobSpy interactive notebook on Binder so it can be embedded in your jobs page.

## Quick Setup (5 minutes)

### Step 1: Push to GitHub

If your repo isn't on GitHub yet:

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Add JobSpy notebook"

# Create a GitHub repo, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 2: Get Your Binder URL

1. Go to **[mybinder.org](https://mybinder.org)**
2. Enter your GitHub repo URL:
   ```
   github.com/YOUR_USERNAME/YOUR_REPO
   ```
3. Select branch: `main` (or your default branch)
4. Click **"launch"** (or copy the URL shown)
5. Wait for Binder to build (first time takes 2-3 minutes)

### Step 3: Update jobs.html

1. Open `analytics-lab/jobs.html`
2. Find this line (around line 620):
   ```javascript
   var BINDER_NOTEBOOK_URL = '';
   ```
3. Replace with your Binder URL:
   ```javascript
   var BINDER_NOTEBOOK_URL = 'https://mybinder.org/v2/gh/YOUR_USERNAME/YOUR_REPO/main?urlpath=notebooks/jobspy-scraper.ipynb';
   ```

**Important:** Make sure the path includes `/notebooks/jobspy-scraper.ipynb` at the end!

### Step 4: Test

1. Open `jobs.html` in your browser
2. Click the **"JobSpy Interactive Scraper"** section at the top
3. The notebook should load (first load may take 1-2 minutes)

## Alternative: Use a Separate Repo

If you prefer to keep the notebook in a separate repo:

1. Create a new GitHub repo: `jobspy-notebook` (or any name)
2. Copy the `notebooks/` folder contents to that repo
3. Use that repo URL in Step 2-3 above

## Troubleshooting

### Notebook doesn't load
- Check that the Binder URL is correct
- Make sure `jobspy-scraper.ipynb` exists in `notebooks/` folder
- Verify the branch name matches (main/master/etc.)
- Check browser console for errors

### Binder build fails
- Make sure `requirements.txt` or `binder/environment.yml` exists
- Check that Python version is >= 3.10
- Verify all dependencies are valid

### First load is slow
- Normal! Binder builds the environment on first launch (2-3 minutes)
- Subsequent loads are faster (cached)

## Manual Testing

Test the notebook locally first:

```bash
# Install dependencies
pip install -r notebooks/requirements.txt

# Launch Jupyter
jupyter notebook notebooks/jobspy-scraper.ipynb
```

## Files Created

- `notebooks/jobspy-scraper.ipynb` - Main notebook
- `notebooks/requirements.txt` - Python dependencies
- `notebooks/binder/environment.yml` - Conda environment (for Binder)
- `notebooks/README.md` - Usage instructions

## Resources

- [JobSpy GitHub](https://github.com/speedyapply/JobSpy)
- [Binder Documentation](https://mybinder.readthedocs.io/)
- [Binder Examples](https://github.com/binder-examples)

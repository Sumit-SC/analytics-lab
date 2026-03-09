# JobSpy HTML Scraper - Single Page Application

A single HTML file with a complete interactive form for job searching. Everything runs in one page - no cells, no notebooks, just a clean HTML form.

## Files

- **`jobspy-scraper.html`** - Single HTML file with complete UI
- **`jobspy-scraper-server.py`** - Python Flask backend server
- **`requirements-html.txt`** - Dependencies

## Quick Start

### Option 1: Using Flask Server (Recommended)

1. **Install dependencies:**
   ```bash
   pip install flask flask-cors python-jobspy
   ```

2. **Run the server:**
   ```bash
   python jobspy-scraper-server.py
   ```

3. **Open in browser:**
   - Navigate to: `http://localhost:5000`
   - The HTML form will load automatically
   - Configure parameters and click "Search Jobs"

### Option 2: Standalone HTML (Requires Backend)

1. **Start the Flask server** (as above)

2. **Open `jobspy-scraper.html`** in your browser
   - Or serve it via: `python -m http.server 8000`
   - Then open: `http://localhost:8000/jobspy-scraper.html`

## Features

✅ **Single HTML Page** - Everything in one file, no cells to run
✅ **Interactive Form** - All parameters in one place
✅ **Button-Triggered Search** - Click "Search Jobs" to fetch results
✅ **Real-time Analytics** - Beautiful dashboard with statistics
✅ **Full Results Table** - Scrollable table with all jobs
✅ **Export Options** - Download CSV or JSON
✅ **Responsive Design** - Works on desktop and mobile

## How It Works

1. **Configure Parameters:**
   - Search term, location, job sites
   - Results count, filters, etc.

2. **Click "Search Jobs":**
   - Button sends request to Python backend
   - Backend runs JobSpy scraper
   - Results returned to HTML page

3. **View Results:**
   - Analytics dashboard shows statistics
   - Full table displays all jobs
   - Export buttons download data

## API Endpoint

The Flask server provides:
- `GET /` - Serves the HTML file
- `POST /api/search` - Searches for jobs

Request body:
```json
{
  "site_name": ["indeed", "linkedin"],
  "search_term": "data analyst",
  "location": "Remote",
  "results_wanted": 50,
  "country_indeed": "USA",
  "is_remote": true,
  "hours_old": 72,
  "job_type": "fulltime"
}
```

## Advantages Over Notebook

- ✅ **Single page** - No cells to run individually
- ✅ **Traditional HTML form** - Familiar UX
- ✅ **Faster** - No cell-by-cell execution
- ✅ **Better for sharing** - Just open HTML file
- ✅ **Cleaner UI** - Professional form layout

## Troubleshooting

**"Error: Make sure the Python server is running!"**
- Start the Flask server: `python jobspy-scraper-server.py`
- Make sure port 5000 is available

**CORS errors:**
- The Flask server has CORS enabled
- Make sure you're accessing via `http://localhost:5000`

**No results:**
- Check that JobSpy supports the selected sites
- Try different search parameters
- Check server logs for errors

## Customization

Edit `jobspy-scraper.html` to:
- Change colors/styling
- Add more form fields
- Modify analytics display
- Customize export format

Edit `jobspy-scraper-server.py` to:
- Add authentication
- Add rate limiting
- Modify API response format
- Add caching

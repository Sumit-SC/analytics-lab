# How to Refresh Marimo Notebook

When you update the code in `jobspy-scraper-marimo.py`, here's how to refresh the running notebook:

## Quick Methods (Fastest)

### 1. Browser Refresh ⚡
- **Press `F5`** or **`Ctrl+R`** (Windows/Linux) or **`Cmd+R`** (Mac)
- Marimo automatically detects file changes and reloads
- **This is the fastest method!**

### 2. Reload Button in UI
- Look for a **"Reload"** or **"🔄"** button in the Marimo interface
- Click it to reload from disk

## Full Restart Methods

### 3. Restart Marimo Server
```bash
# In the terminal where Marimo is running:
# Press Ctrl+C to stop the server

# Then restart:
marimo run analytics-lab/notebooks/jobspy-scraper-marimo.py
```

### 4. Use Edit Mode (Auto-Reload)
```bash
# Edit mode watches for file changes automatically
marimo edit analytics-lab/notebooks/jobspy-scraper-marimo.py
```
When you save changes to the `.py` file, Marimo will automatically reload.

## Troubleshooting

### If changes don't appear:

1. **Check file was saved**
   - Make sure you saved the `.py` file
   - Check the file timestamp

2. **Hard refresh browser**
   - `Ctrl+Shift+R` (Windows/Linux)
   - `Cmd+Shift+R` (Mac)
   - This clears cache and forces reload

3. **Restart Marimo completely**
   ```bash
   # Stop server
   Ctrl+C
   
   # Clear any cached files (optional)
   # Marimo doesn't cache much, but you can restart
   
   # Start fresh
   marimo run analytics-lab/notebooks/jobspy-scraper-marimo.py
   ```

4. **Check you're editing the right file**
   - Verify the file path matches what Marimo is running
   - Check: `marimo run <path>` matches your file location

## Best Practice

**Recommended workflow:**
1. Edit `jobspy-scraper-marimo.py` in your editor
2. Save the file
3. Press `F5` in the browser (fastest!)
4. Marimo will reload automatically

## File Watching

Marimo watches the `.py` file for changes. When you save:
- The file timestamp changes
- Marimo detects the change
- Browser refresh (`F5`) loads the new code

**Note**: If you're using `marimo edit`, it watches automatically. If using `marimo run`, you need to refresh the browser after saving.

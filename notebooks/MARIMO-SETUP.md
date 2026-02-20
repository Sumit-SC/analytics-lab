# Marimo Setup Guide

## What is Marimo?

Marimo is a reactive Python notebook framework that creates interactive web apps. It's great for building interactive tools with HTML widgets.

## Files Created

- `jobspy-scraper-marimo.py` - Marimo notebook (standalone web app)
- `requirements-marimo.txt` - Dependencies for Marimo version

## Running Marimo Locally

### Option 1: Run as Web App

```bash
# Install Marimo
pip install marimo

# Run the notebook
marimo run notebooks/jobspy-scraper-marimo.py

# Or edit mode
marimo edit notebooks/jobspy-scraper-marimo.py
```

This will start a local web server (usually at http://localhost:8080)

### Option 2: Use Marimo Cloud

1. Sign up at [marimo.io](https://marimo.io)
2. Upload `jobspy-scraper-marimo.py`
3. Share the public URL

## Features

- ✅ **Interactive widgets** - Text inputs, sliders, checkboxes, multi-select
- ✅ **Reactive updates** - Changes automatically trigger re-runs
- ✅ **HTML output** - Beautiful formatted results
- ✅ **Multiple site selection** - Select multiple job boards at once
- ✅ **Real-time scraping** - Updates as you change parameters

## For Binder/Embedding

Marimo can be embedded, but requires:
1. Running Marimo server
2. Embedding the Marimo app URL

**Recommendation**: Use the `jobspy-scraper-interactive.ipynb` version for Binder embedding (uses ipywidgets, works better in iframes).

## Comparison

| Feature | Jupyter + ipywidgets | Marimo |
|---------|----------------------|--------|
| Binder support | ✅ Excellent | ⚠️ Requires server setup |
| Interactivity | ✅ Good | ✅ Excellent |
| HTML widgets | ✅ Yes | ✅ Yes (better) |
| Multi-select | ✅ Yes | ✅ Yes |
| Embedding | ✅ Easy | ⚠️ More complex |
| **Best for Binder** | ✅ **Recommended** | ⚠️ Local/Cloud |

## Recommendation

- **For Binder embedding**: Use `jobspy-scraper-interactive.ipynb` (Jupyter + ipywidgets)
- **For local/cloud use**: Use `jobspy-scraper-marimo.py` (Marimo)

Both support:
- Multiple site selection
- Interactive parameters
- HTML output
- CSV/JSON export

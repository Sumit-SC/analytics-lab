# Notebook location update

This folder previously held notebook experiments.  
The actively maintained job-scraping notebooks now live under `job-search-api/`:

- `job-search-api/jobspy-testing/jobspy_test.ipynb` (JobSpy UI notebook)
- `job-search-api/jobsentinel-testing/boards_test.ipynb` (multi-board test harness)
- `job-search-api/rssjobs-testing/rssjobs_test.ipynb` (rssjobs/jobber RSS tester)

## Why moved

- Keeps notebook testing close to the API implementation and scraper modules.
- Uses per-folder dependencies (`pyproject.toml` / `requirements.txt`) for cleaner local runs.
- Better path for future Marimo conversion and memory-conscious notebook patterns.

## Run (from each notebook folder)

```bash
# preferred
uv sync
uv run jupyter notebook <notebook_name>.ipynb

# fallback
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
jupyter notebook <notebook_name>.ipynb
```

## References

- [JobSpy GitHub](https://github.com/speedyapply/JobSpy)
- [Jobber GitHub](https://github.com/alwedo/jobber)

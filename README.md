## Standalone Playground

This folder is a **standalone, deployable** version of the Playground (no links to the main portfolio pages).

### What’s included
- **Code runner** (browser-only):
  - **Python** via Pyodide (loads on first Python run)
  - **JavaScript** (instant)
  - **SQL (SQLite)** via sql.js (loads on first SQL run) + sample data buttons
- **Resources** page: `resources.html?topic=python` (same 3-card layout)
- **Learning assistant** (optional):
  - Default: FAQ + Wikipedia + Google search button
  - Optional: “Enable full chatbot (~80MB)” (downloads model once; stores chat history in `localStorage`)

### Run locally
Any static server works. Examples:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/standalone-playground/`.

### Deploy
Deploy the `standalone-playground/` folder to any static host (GitHub Pages, Netlify, Vercel static, etc.).


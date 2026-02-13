# Standalone Playground — Notion-like second brain

A **second-brain hub** (Notion-like UI and use): **JS libraries** and **free on-the-fly APIs** only — no custom backend, pre-made and compiled services. View, search, edit in the browser, then export code, notes, or Word-style docs. Minimal code; off-the-shelf and public APIs only.

---

## Built with

| Kind | What |
|------|------|
| **JS libraries & runtimes** | Pyodide, sql.js, Tailwind (CDN), vanilla JS, JupyterLite, YouTube IFrame API |
| **Free APIs & services** | Quotable, Animechan, Open-Meteo, Picsum, Dictionary API, DevDocs, YouTube — all no-key or public |

---

## What's included

| Area | Features |
|------|----------|
| **Home** (`index.html`) | **Second-brain dashboard**: quote, refresh tip, weather (Open-Meteo), 25‑min focus timer, Spotify link. Quick links to Playground, Resources, Tools. Notion/DeepMind-style cards. |
| **Playground** (`playground.html`) | **Tech mode:** Code runner (Python/JS/SQL), **Search hub** → DevDocs (in-page) + **GitHub** (new tab), JupyterLite, quick launch, roadmap panel, learning assistant. **Non-tech mode:** Same search hub → Google, Wikipedia, Stack Overflow; embedded **Tools** (notes + PDF) in an iframe. Mode persisted in `localStorage`. |
| **Resources** (`resources.html`) | Curated topics (Programming, Data Analytics, Data Science & ML, Data Engineering, BI, etc.) with **courses**, **books**, **YouTube** (hero + queue), **GitHub**, and **learning paths**. Notion-style cards; sidebar nav. |
| **Tools** (`tools.html`) | **Word-style editor**: rich text, toolbar, auto-save to `localStorage`, download **.txt / .md / .html**, open .txt/.md. **Backup & restore**: download one .json (notes + to-dos + timer log), restore from file or from **timely local backups** (auto every 5 min, last 15). **PDF viewer**: pick a file, view in-page. |

---

## Notes & export (temp use, no database)

- **Editor (Tools)**: Auto-saves to `localStorage` for the session. **Download .md / .txt / .html** to keep a copy. **Backup now** downloads one `.json` (notes + to-dos + timer log); **Restore from file** or **from local backup** loads it back — useful before closing, not required for normal use.
- **To-dos (Home)**: **Export .md** for a markdown copy. All data stays in the browser; clearing site data wipes it. No server, no database — headless, on-the-fly only.

---

## Run locally

Serve the `analytics-lab` folder with any static server:

```bash
# From repo root
cd analytics-lab
python -m http.server 8000
```

Then open **http://localhost:8000/** (Home) or **http://localhost:8000/playground.html** (Playground).

---

## Deploy

Deploy the **analytics-lab** folder to any static host (GitHub Pages, Netlify, Vercel, etc.). No build step; no server required.

---

## Search hub (index)

- **One query** in the “Search hub” box.
- **DevDocs** opens in-page (iframe). Tip: in DevDocs, enable Python / SQL / Pandas for best results.
- **Google, YouTube, Wikipedia, Stack Overflow, GitHub** open in a new tab with the same query (or the site home if the box is empty).

---

## Updating resources

Edit **`assets/resources.json`** to add or change topics, courses, books, YouTube entries, GitHub links, and learning paths. The Resources page and sidebar are driven by this file. See existing entries for structure (e.g. `courses`, `books`, `youtube`, `github`, `paths`).

---

## Optional: offline / CDN fallback

- **Tailwind**: `assets/js/tailwind-loader.js` tries CDN first, then `assets/vendor/tailwind.min.js` if present.
- **sql.js**: Playground uses CDN by default; optional local copy in `assets/vendor/sql.js/` (see `scripts/download-vendor.ps1` and `assets/vendor/README.md`).
- **Python (Pyodide)** needs network on first run; JS and SQL can run offline once assets are cached.

---

## Script load order

On **index.html**, load **`analytics.js`** before **`playground.js`** and **`roadmap.js`** so tracking and init run correctly.

---

## Meta & sharing

- **index**, **resources**, and **tools** include `meta name="description"` and `og:title` / `og:description` for better SEO and link previews.

---

## License

Same as the parent project.

# Standalone Playground — Notion-like second brain

A **second-brain hub** (Notion-like UI and use): **JS libraries** and **free on-the-fly APIs** only — no custom backend, pre-made and compiled services. View, search, edit in the browser, then export code, notes, or Word-style docs. Minimal code; off-the-shelf and public APIs only.

---

## Built with

| Kind | What |
|------|------|
| **JS libraries & runtimes** | Pyodide, sql.js, Tailwind (CDN), vanilla JS, JupyterLite, YouTube IFrame API |
| **Free APIs & services** | Quotable, Animechan, Open-Meteo, Picsum, Dictionary API (dictionaryapi.dev + Wiktionary fallback), DevDocs, GitHub API, Wikipedia API, Stack Overflow API, DuckDuckGo API, Hacker News API, Wikimedia pageviews API, Wikimedia Commons (images) — all no-key or public |

---

## What's included

| Area | Features |
|------|----------|
| **Home** (`index.html`) | **Second-brain dashboard**: **Quote** (Quotable, Animechan, static lists — Leaders, Movies, K-drama, Books, Wisdom) with **source-matched images** (e.g. Reply 1988 quote → Reply 1988 poster), **Clock & calendar** (real-time), **Weather** (Open-Meteo with location search + "My location"), **Focus timer** (configurable work/break durations, session labels, auto work→break cycles), **Refresh tips**, **Notes & to-do** (export .md). Quick links to Playground, Resources, Tools. Notion/DeepMind-style cards. |
| **Playground** (`playground.html`) | **Tech mode:** Code runner (Python/JS/SQL), **Search hub** with **search history** (last 10 queries, clickable to reuse, clear button) → **DevDocs** (embedded iframe, always visible, minimize-able), **GitHub** (embedded API results with repo name, description, stars, language), JupyterLite, quick launch, roadmap panel, learning assistant. **Non-tech mode:** Search hub → **DuckDuckGo** (embedded), **Wikipedia** (embedded API results), **Stack Overflow** (embedded API results); **Word processor** cards (Microsoft Word Online, Google Docs links). All result panels have minimize/close buttons. Mode persisted in `localStorage`. Bottom bar = global YouTube music player (Paste URL / Focus mix), right-side panel = YouTube big player + search helper. |
| **Trends** (`trends.html`) | **Fun page** with no login or keys: **Hacker News** top stories (via official Firebase API), **Wikipedia top pageviews** (Wikimedia metrics API), and a small **visual inspiration wall** (Picsum images) in a Notion-style layout. Uses the same global music bar, dictionary, and video panel as other pages. |
| **Resources** (`resources.html`) | Curated topics (Programming, Data Analytics, Data Science & ML, Data Engineering, BI, etc.) with **courses**, **books**, **YouTube** (hero + queue), **GitHub**, and **learning paths**. Notion-style cards; sidebar nav. |
| **Tools** (`tools.html`) | **Online Word editor (embedded)**: iframe switcher between **Filestash Word** and **OnlineOCR Word**, plus quick links to **Word Online** and **Google Docs**. **Notebook / scratch notes**: rich text, toolbar, auto-save to `localStorage`, download **.txt / .md / .html**, open .txt/.md. **Backup & restore**: download one .json (notes + to-dos + timer log), restore from file or from **timed local backups** (auto every 5 min, last 15). **PDF viewer**: pick a file, view in-page. |

---

## Notes & export (temp use, no database)

- **Editor (Tools)**: Auto-saves to `localStorage` for the session. **Download .md / .txt / .html** to keep a copy. **Backup now** downloads one `.json` (notes + to-dos + timer log); **Restore from file** or **from local backup** loads it back — useful before closing, not required for normal use.
- **To-dos (Home)**: **Export .md** for a markdown copy. All data stays in the browser; clearing site data wipes it. No server, no database — headless, on-the-fly only.

---

## Search hub (Playground)

- **One query** in the "Search hub" box with **search history** (last 10 queries, clickable to reuse, clear button).
- **Tech mode:** **DevDocs** (embedded iframe, always visible, minimize-able), **GitHub** (embedded API results with repo name, description, stars, language).
- **Non-tech mode:** **DuckDuckGo** (embedded results), **Wikipedia** (embedded API results with article summaries), **Stack Overflow** (embedded API results with questions, scores, tags).
- All result panels have **minimize (−)** and **close (✕)** buttons. Collapsed state persists in `localStorage`.

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

## Analytics

All pages (Home, Playground, Tools, Resources, Trends) send **visit** and **unload** events to the configured endpoint (e.g. `https://events.colab.indevs.in/api/events`) so you can see traffic in your dashboard. On the Playground, analytics is initialized **at the start** of the script so it runs even if later code throws.

**If the dashboard shows no logs from the Playground (or any page):**

1. **Debug in the browser:** Open the page with `?analytics_debug=1` (e.g. `playground.html?analytics_debug=1`) or set `localStorage.setItem('analytics_debug','1')`, then open DevTools → Console. You should see `[Analytics] Init: ...` and either `Sent via sendBeacon` / `Sent via fetch` or warnings if requests are blocked or fail.
2. **Test connectivity:** Use **test-analytics.html** (Health check, endpoint test, send test event) and open the dashboard link for **Playground** to confirm events are stored.
3. **Ad-blockers:** Some blockers filter requests to analytics/events domains; try disabling them for the site or use a different network.

---

## Deploy

Deploy the **analytics-lab** folder to any static host (GitHub Pages, Netlify, Vercel, etc.). No build step; no server required.

---

## Updating resources

Edit **`assets/resources.json`** to add or change topics, courses, books, YouTube entries, GitHub links, and learning paths. The Resources page and sidebar are driven by this file. See existing entries for structure (e.g. `courses`, `books`, `youtube`, `github`, `paths`).

---

## Optional: offline / CDN fallback

- **Tailwind**: `assets/js/tailwind-loader.js` tries CDN first, then `assets/vendor/tailwind.min.js` if present.
- **sql.js**: Playground uses CDN by default; optional local copy in `assets/vendor/sql.js/` (see `scripts/download-vendor.ps1` and `assets/vendor/README.md`).
- **Python (Pyodide)** needs network on first run; JS and SQL can run offline once assets are cached.

---

## Performance optimizations

- **Lazy loading**: Images and iframes load on demand (`loading="lazy"`).
- **Deferred scripts**: Non-critical JS loads after page render.
- **localStorage caching**: Search history, settings, and collapsed states persist.
- **Minimal dependencies**: Vanilla JS, CDN assets only when needed.

---

## Meta & sharing

- **index**, **resources**, and **tools** include `meta name="description"` and `og:title` / `og:description` for better SEO and link previews.

---

## License

Same as the parent project.

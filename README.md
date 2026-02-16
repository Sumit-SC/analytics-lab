# Standalone Playground — Notion-like second brain

A **second-brain hub** (Notion-like UI and use): **JS libraries** and **free on-the-fly APIs** only — no custom backend, pre-made and compiled services. View, search, edit in the browser, then export code, notes, or Word-style docs. Minimal code; off-the-shelf and public APIs only.

---

## Built with

| Kind | What |
|------|------|
| **JS libraries & runtimes** | Pyodide, sql.js, Tailwind (CDN), vanilla JS, JupyterLite, YouTube IFrame API |
| **Free APIs & services** | Quotable, Animechan, Open-Meteo, Picsum, Dictionary API (dictionaryapi.dev + Wiktionary fallback), DevDocs, GitHub API, Wikipedia API, Stack Overflow API, DuckDuckGo API, Hacker News API, Wikimedia pageviews API, Wikimedia Commons (images), Jikan (anime posters), **Inshorts API** ([inshorts.vercel.app](https://inshorts.vercel.app/) — news headlines). Optional: **OMDb** (posters/wallpapers for movie, K-drama, Bollywood — key kept secret via [backend proxy](#omdb-api-key-posters--wallpapers--backend-proxy-key-stays-secret); see below) — all no-key or public where possible |

---

## What's included

| Area | Features |
|------|----------|
| **Home** (`index.html`) | **Second-brain dashboard**: **Quote** (local DB + Quotable, Animechan fallback — categories: All, Anime, Books, Wisdom, Leaders, Inspiring, Life, Love, Friendship, Heartbreak, Wishes, Past, Future, Hollywood, International, Bollywood, K-drama) with **source-matched images**: anime → Jikan poster; movie / K-drama / Bollywood / International → OMDb poster (via backend proxy) or Wikimedia; books/leaders → Wikimedia. Same source reuses the same poster; 1–2 images per quote for wallpaper cycle. **Clock & calendar** (real-time), **Weather** (Open-Meteo with location search + "My location"), **Focus timer** (configurable work/break durations, session labels, auto work→break cycles), **Refresh tips**, **Notes & to-do** (export .md). Quick links to Playground, Resources, Tools. Notion/DeepMind-style cards. |
| **Playground** (`playground.html`) | **Tech mode:** Code runner (Python/JS/SQL), **Search hub** with **search history** (last 10 queries, clickable to reuse, clear button) → **DevDocs** (embedded iframe, always visible, minimize-able), **GitHub** (embedded API results with repo name, description, stars, language), JupyterLite, quick launch, roadmap panel, learning assistant. **Non-tech mode:** Search hub → **DuckDuckGo** (embedded), **Wikipedia** (embedded API results), **Stack Overflow** (embedded API results); **Word processor** cards (Microsoft Word Online, Google Docs links). All result panels have minimize/close buttons. Mode persisted in `localStorage`. Bottom bar = global music player: **YouTube** (paste URL / Focus mix) or **JioSaavn** (search songs, play via unofficial API); right-side panel = YouTube player or JioSaavn search results. |
| **Trends** (`trends.html`) | **Filter by category:** All, Tech, News, Entertainment, Anime. **Tech:** Hacker News top stories (Firebase API). **News:** [Inshorts API](https://inshorts.vercel.app/) (unofficial, by Sumit Kolhe) short headlines + **Wikipedia** top pageviews (Wikimedia). **Entertainment:** visual inspiration strip (Picsum). **Anime:** placeholder for future Jikan / Pinterest / Shorts-style embeds. Filter choice is saved in `localStorage`. Same global music bar, dictionary, video panel as other pages. |
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

### OMDb API key (posters / wallpapers)

The key is **never** sent to the browser. A small backend calls OMDb and returns only poster/search/details.

Get a free key at [omdbapi.com](https://www.omdbapi.com/).

**GitHub Pages (recommended): use a separate backend repo**

1. Use the **`omdb-proxy`** folder (sibling to `analytics-lab` in this workspace). Copy it into a **new GitHub repo** (e.g. `omdb-proxy`) and push.
2. Deploy that repo on **Vercel**: Import the repo → add env var **`OMDB_API_KEY`** → deploy. Note the URL (e.g. `https://omdb-proxy-xxx.vercel.app`).
3. In your **main site** (e.g. in `index.html` and `playground.html`), set before other scripts:  
   `window.OMDB_PROXY_URL = 'https://omdb-proxy-xxx.vercel.app';`  
   (Use your real Vercel URL; no trailing slash.)

Your main repo stays front-end only; the key lives only in Vercel’s env for the proxy repo. See **`playground-serveless/README.md`** (or `omdb-proxy`) for step-by-step details.

**Playground IMDb embed:** The **Playground** page has an IMDb flyout (button “IMDb”): search movies/series, click a result for **full detail** (including Writer, Language, Country, Awards, Box office). In the detail view you get links to **CineMaterial** and **ThePosterDB** and a “Fetch posters” button that calls the proxy’s `/api/cinematerial` (if your proxy exposes it, e.g. the `playground-serveless` deploy).

**If you deploy the main site on Vercel/Netlify** you can instead run the backend from the same deploy (use the `api/` folder in analytics-lab — it includes `omdb.js` and `cinematerial.js` — and set `OMDB_API_KEY` in that project’s env). Then you don’t need `OMDB_PROXY_URL` if the site and API are on the same host.


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

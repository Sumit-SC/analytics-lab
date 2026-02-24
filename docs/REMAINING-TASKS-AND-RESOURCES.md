# Remaining tasks & resources for building

Consolidated from **TODO.md**, **TODO-TOMORROW.md**, **ROADMAP.md**, and **REFACTOR-TODO.md**.  
Use this before starting Mobile UI dev or next sprint.

---

## What’s already done (no action)

- **Weather fallback** — Implemented in `homepage.js`: “Weather unavailable” + “Retry” + “Use default city” (`renderWeatherUnavailable`). ROADMAP marks this done.
- **Backup includes planner** — Tools backup/restore already includes planner entries (`buildBackupPayload` / `applyRestore` in `tools.js`). ROADMAP marks this done.

---

## 1. Remaining tasks (by area)

### 1.1 Setup & config (do first)

| Task | Where | Notes |
|------|--------|--------|
| OMDb proxy | Vercel + site | Confirm `playground-serveless` (or your proxy) is deployed; set `OMDB_API_KEY` in Vercel project env. Site uses `window.OMDB_PROXY_URL` (e.g. `index.html` L13, `homepage.js`). |
| JioSaavn API | Backend + frontend | Confirm `https://saavn.sumit.co` is up, or set `JIOSAAVN_API_BASE` in `assets/js/global-widgets.js` (L19). |
| Job proxy (optional) | Vercel + jobs | Deploy `analytics-lab/api/` to Vercel; set env (e.g. `SERP_API_KEY`, `APIFY_API_KEY`); set `window.JOB_PROXY_URL` in `jobs.html` (L20–21). |
| Pipeline (GitHub Actions) | Repo | Add deploy step (e.g. GitHub Pages) in `.github/workflows/inject-omdb-and-deploy.yml`. Deploy block is commented (L18–26). |
| OMDb API key | Local / Production | Local: `localStorage.setItem('omdb_api_key', 'YOUR_KEY')`. Production: repo secret `OMDB_API_KEY`. Get key: [omdbapi.com](https://www.omdbapi.com/). |
| Quote categories | Data | Edit `assets/data/quotes-db.json`. Current: All, Random, Movies, Bollywood, K-drama, Anime, Books, Leaders. |
| Use live posters | Doc only | README: Home quote card “Use live posters” = OMDb/Jikan when on; off = DB/map only. |

---

### 1.2 Job tracker

| Task | Where | Notes |
|------|--------|--------|
| Indeed | Backend + frontend | **No `api/indeed.js` exists.** Add serverless at `api/indeed.js` (e.g. HasData, SerpAPI, or scraper). `jobs.js` already calls `proxyUrl + '/api/indeed?q=...&l=...'` (L1776–1783) when `JOB_PROXY_URL` is set. |
| Planner export | Jobs page | Add “Export planner” (CSV/JSON) for application planner entries. Data in `localStorage`; no backend. See ROADMAP “Quick wins”. |
| Proxy stubs | `api/` | In `api/instahyre.js`, `api/hirist.js`, `api/himalaya.js`: either implement real fetch (with API keys) or return a clear “Not configured” message instead of empty array. |

---

### 1.3 Trends & content

| Task | Where | Notes |
|------|--------|--------|
| Anime feed | Trends | Trends “Anime” already uses Jikan top list (`trends.js` L985–1030). TV schedule block (`trends-schedule-anime-list`) can be wired to Jikan schedules: `https://api.jikan.moe/v4/schedules` or seasonal. Replace placeholder / “Could not load schedule” with real data. |
| Entertainment strip | Home / Trends | Optional: swap or augment Picsum with a themed/curated source. |

---

### 1.4 Patches & fixes

| Task | Where | Notes |
|------|--------|--------|
| Resources channels | `assets/resources.json` | Verify YouTube channel IDs (python, data-science, machine-learning sections) and that embeds load; fix broken IDs. |
| freeCodeCamp channel ID | `assets/resources.json` | Confirm freeCodeCamp.org ID `UCX8OftAXkEIJB7DoMyEiqKw` (used in resources.json L136). |
| Single nav | All HTML | Optional: one script or build step that injects nav into each page. Nav duplicated in `index.html`, `playground.html`, `resources.html`, `tools.html`, `trends.html`, `jobs.html`, `docs.html`. |

---

### 1.5 Docs & polish

| Task | Where | Notes |
|------|--------|--------|
| README | `README.md` | Add one line under “Music & Video bar”: JioSaavn depends on `saavn.sumit.co` (or `JIOSAAVN_API_BASE`) and how to change it. |
| TODO sync | `TODO.md`, `TODO-TOMORROW.md`, `ROADMAP.md` | After completing items, tick here and in ROADMAP; move remaining to “later” or next sprint. |
| Document script order | README + HTML | Add “Script order” section in README and comment block in each HTML (Tailwind → main.css → analytics → page script). |

---

### 1.6 Optional (if time)

| Task | Where | Notes |
|------|--------|--------|
| Accessibility | Overlays / panels | Add/improve `aria-expanded`, `aria-label`, focus trap in overlays (assistant/roadmap panels). |
| Backup/restore | Tools | Include job planner entries in Tools backup JSON (ROADMAP says already done; verify). |

---

## 2. Resources dump (APIs, env, files, docs)

Use this when implementing the tasks above.

### 2.1 APIs & external services

| Resource | Purpose | URL / notes |
|----------|---------|-------------|
| OMDb | Movie/posters | [omdbapi.com](https://www.omdbapi.com/) — API key required. |
| Open-Meteo | Weather + geocoding + AQI | `https://api.open-meteo.com/v1/forecast?...`, `https://geocoding-api.open-meteo.com/v1/search`, `https://air-quality.api.open-meteo.com/v1/air-quality` — no key. Used in `homepage.js`. |
| Jikan (MyAnimeList) | Anime posters, top anime, schedule | `https://api.jikan.moe/v4/anime?q=...`, `https://api.jikan.moe/v4/top/anime`, `https://api.jikan.moe/v4/schedules` — no key, rate limit 3 req/s. |
| Animechan | Anime quotes | `https://api.animechan.io/v1/quotes/random` — no key, 5 req/hour. |
| JioSaavn | Music search (unofficial) | Backend at `JIOSAAVN_API_BASE` (default `https://saavn.sumit.co`). |
| Job proxies | Indeed, LinkedIn, etc. | Backend must implement `/api/indeed`, `/api/instahyre`, `/api/hirist`, `/api/himalaya`, etc. Optional: SerpAPI, HasData, Apify, ScraperAPI. |

### 2.2 Environment / config (frontend)

| Variable | Set in | Purpose |
|----------|--------|---------|
| `window.OMDB_PROXY_URL` | `index.html`, `playground.html`, `poster-test.html` | OMDb proxy origin (e.g. `https://playground-serveless.vercel.app`). |
| `window.JOB_PROXY_URL` | `jobs.html` | Job API origin (e.g. playground-serveless or job-search-api). |
| `JIOSAAVN_API_BASE` | `assets/js/global-widgets.js` (L19) | JioSaavn backend URL. |

### 2.3 Environment / config (backend / Vercel)

| Variable | Where | Purpose |
|----------|--------|---------|
| `OMDB_API_KEY` | Vercel (or repo secret for inject script) | OMDb API key for `api/omdb.js`. |
| `APIFY_API_KEY` / `SCRAPER_API_KEY` | Vercel | Optional: for Instahyre/job scrapers. |
| `SERP_API_KEY` | Vercel | Optional: for job search APIs. |

### 2.4 Key files to touch

| Area | Files |
|------|--------|
| OMDb / posters | `api/omdb.js`, `index.html` (OMDB_PROXY_URL), `assets/js/homepage.js`, `assets/js/omdb-widget.js` |
| Weather | `assets/js/homepage.js` (initWeather, fetchWeather, renderWeatherUnavailable) |
| Jobs | `jobs.html` (JOB_PROXY_URL), `assets/js/jobs.js` (Indeed: L1776–1803), `api/instahyre.js`, `api/hirist.js`, `api/himalaya.js` |
| Indeed backend | **Create** `api/indeed.js` (serverless), wire to proxyUrl in `jobs.js` |
| Trends / Anime | `trends.html`, `assets/js/trends.js` (anime section L985–1030, TV schedule L559–624) |
| Resources / YouTube | `assets/resources.json` (youtube channels: `id` in each topic’s `youtube` and channel list) |
| Nav | All HTML: `index.html`, `playground.html`, `resources.html`, `tools.html`, `trends.html`, `jobs.html`, `docs.html` |
| Docs | `README.md`, `TODO.md`, `TODO-TOMORROW.md`, `ROADMAP.md` |
| Pipeline | `.github/workflows/inject-omdb-and-deploy.yml` |
| Quotes | `assets/data/quotes-db.json` |

### 2.5 Docs to read when building

- **README.md** — Deploy, env, OMDb proxy, JioSaavn.
- **ROADMAP.md** — Priorities (P0/P1/P2), effort, quick wins.
- **REFACTOR-TODO.md** — Nav, script order, root cleanup, tests.

---

## 3. Suggested order (from TODO-TOMORROW)

1. **Setup & config** — OMDb, JioSaavn URL, optional Job proxy.
2. **Patches** — Resources channel IDs, freeCodeCamp ID, (optional) single nav.
3. **Pick one:** Job tracker (Indeed + planner export + stubs) **or** Trends (Anime feed + entertainment).
4. **Docs & polish** — README line for JioSaavn, TODO sync, script order.
5. **Optional** — Pipeline, a11y, backup scope.

---

## 4. Next: Mobile UI dev

After the above (or in parallel), use this repo as-is for **Mobile UI** work: same HTML/JS/CSS; focus on responsive layout, touch targets, and breakpoints in `assets/css/main.css` and page-specific styles. No new resources required beyond the existing codebase and this doc.

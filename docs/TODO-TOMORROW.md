# To-do for tomorrow — build & cover up

A single, actionable list for the next session: patches, setup, and features left to cover.

---

## 1. Setup & config (do first)

- [ ] **OMDb proxy** – Confirm `playground-serveless` (or your OMDb proxy) is deployed on Vercel and `OMDB_API_KEY` is set in project env. Home/Playground already use `window.OMDB_PROXY_URL`.
- [ ] **JioSaavn API** – Confirm `https://saavn.sumit.co` is up, or change `JIOSAAVN_API_BASE` in `assets/js/global-widgets.js` to your backend URL.
- [ ] **Job proxy (optional)** – If you want Indeed/Google Jobs/LinkedIn/Instahyre/Hirist/Himalaya: deploy `analytics-lab/api/` to Vercel, set env (e.g. `SERP_API_KEY`, `APIFY_API_KEY`), and set `window.JOB_PROXY_URL` in `jobs.html`.

---

## 2. Job tracker

- [x] **Indeed** – Stub added at `api/indeed.js` (returns empty results + “Not configured” note). Wire real API (HasData/SerpAPI) when keys are set.
- [x] **Planner export** – Already on Jobs page: “Export JSON” and “Export CSV” buttons for planner entries.
- [x] **Proxy stubs** – `api/instahyre.js`, `api/hirist.js`, `api/himalaya.js` return `configured: false` and clear “Not configured” message.

---

## 3. Trends & content

- [x] **Anime feed** – Trends “Anime” uses Jikan top list + TV schedule uses Jikan `/v4/schedules?filter=<weekday>` in `trends.js`.
- [x] **Weather fallback** – Already in `homepage.js`: “Weather unavailable” + “Retry” + “Use default city” (see ROADMAP Done).
- [ ] **Entertainment strip** – Optional: swap or augment Picsum with a themed/curated source, or leave as-is.

---

## 4. Patches & fixes

- [x] **Resources channels** – freeCodeCamp channel ID corrected in `resources.json` (was wrong; now `UC8butISFwT-Wl7EV0hUK0BQ`). Other sections use same IDs; verify embeds if needed.
- [x] **freeCodeCamp channel ID** – Fixed: replaced `UCX8OftAXkEIJB7DoMyEiqKw` with `UC8butISFwT-Wl7EV0hUK0BQ` in `assets/resources.json`.
- [x] **Single nav** – Nav defined in `assets/js/nav-data.js`; `nav-inject.js` injects into pages with `data-nav-inject="main"` / `data-nav-inject="drawer"`. Used on index, trends, tools, jobs, docs. Playground and resources keep static nav (Roadmap button).

---

## 5. Docs & polish

- [x] **README** – Added JioSaavn line under “Music & Video bar”; “Use live posters” note; “Script load order” section; script-order comments in each main HTML.
- [x] **TODO.md** – Completed items ticked here and in ROADMAP.md; remaining stay for next sprint.

---

## 6. Optional (if time)

- [x] **Pipeline** – GitHub Pages deploy step added in `.github/workflows/inject-omdb-and-deploy.yml`.
- [ ] **Accessibility** – Add/improve `aria-expanded`, `aria-label`, focus trap in overlays for assistant/roadmap panels.
- [x] **Backup/restore** – Already includes planner (see ROADMAP Done).

---

## Summary

| # | Area           | Count | Focus                                      |
|---|----------------|-------|--------------------------------------------|
| 1 | Setup & config | 3     | OMDb, JioSaavn URL, optional Job proxy     |
| 2 | Job tracker    | 3     | Indeed, planner export, proxy stubs        |
| 3 | Trends & content | 3   | Anime feed, weather fallback, entertainment |
| 4 | Patches        | 3     | Resources channels, nav                    |
| 5 | Docs & polish  | 2     | README, TODO sync                           |
| 6 | Optional       | 3     | Pipeline, a11y, backup scope                |

**Suggested order:** 1 → 4 (quick checks) → 2 or 3 (pick one area) → 5 → 6 if time.

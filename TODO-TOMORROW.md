# To-do for tomorrow — build & cover up

A single, actionable list for the next session: patches, setup, and features left to cover.

---

## 1. Setup & config (do first)

- [ ] **OMDb proxy** – Confirm `playground-serveless` (or your OMDb proxy) is deployed on Vercel and `OMDB_API_KEY` is set in project env. Home/Playground already use `window.OMDB_PROXY_URL`.
- [ ] **JioSaavn API** – Confirm `https://saavn.sumit.co` is up, or change `JIOSAAVN_API_BASE` in `assets/js/global-widgets.js` to your backend URL.
- [ ] **Job proxy (optional)** – If you want Indeed/Google Jobs/LinkedIn/Instahyre/Hirist/Himalaya: deploy `analytics-lab/api/` to Vercel, set env (e.g. `SERP_API_KEY`, `APIFY_API_KEY`), and set `window.JOB_PROXY_URL` in `jobs.html`.

---

## 2. Job tracker

- [ ] **Indeed** – Implement or wire backend at `/api/indeed` (e.g. HasData or similar) and ensure `jobs.js` calls it when `JOB_PROXY_URL` is set.
- [ ] **Planner export** – Add “Export planner” (CSV/JSON) on Jobs page so application planner entries can be backed up or used elsewhere.
- [ ] **Proxy stubs** – In `api/instahyre.js`, `api/hirist.js`, `api/himalaya.js`, either implement real fetch (with your API keys) or return a clear “Not configured” message instead of empty array.

---

## 3. Trends & content

- [ ] **Anime feed** – Replace Trends “Anime” placeholder with real data: e.g. Jikan API (seasonal/top anime) or a simple list with links; show in `trends.html` and `trends.js`.
- [ ] **Weather fallback** – In Home weather widget: on fetch/CORS failure, show “Weather unavailable” and a “Retry” or “Use default city” button (see ROADMAP / IMPROVEMENTS).
- [ ] **Entertainment strip** – Optional: swap or augment Picsum with a themed/curated source, or leave as-is.

---

## 4. Patches & fixes

- [ ] **Resources channels** – Verify YouTube channel IDs in `assets/resources.json` (python, data-science, machine-learning) are correct and embeds load; fix any broken channel IDs.
- [ ] **freeCodeCamp channel ID** – In `resources.json`, confirm freeCodeCamp.org channel ID `UCX8OftAXkEIJB7DoMyEiqKw` is correct (or replace with the real ID).
- [ ] **Single nav** – Optional: add a small script or build step so nav is defined once and injected into each page (reduces duplication and drift).

---

## 5. Docs & polish

- [ ] **README** – Add one line under “Music & Video bar” that JioSaavn depends on `saavn.sumit.co` (or `JIOSAAVN_API_BASE`) and how to change it.
- [ ] **TODO.md** – After tomorrow, tick completed items here and in ROADMAP.md, and move remaining items to “later” or next sprint.

---

## 6. Optional (if time)

- [ ] **Pipeline** – Add GitHub Actions deploy step (e.g. GitHub Pages) after OMDb inject in `.github/workflows/inject-omdb-and-deploy.yml`.
- [ ] **Accessibility** – Add/improve `aria-expanded`, `aria-label`, focus trap in overlays for assistant/roadmap panels.
- [ ] **Backup/restore** – Include job planner entries in the Tools backup JSON so one file has notes + to-dos + timer log + planner.

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

# Remaining Enhancements & To-Do List

A single backlog of setup tasks, enhancements, and future work for the Standalone Playground (analytics-lab).

---

## Setup & configuration

- [ ] **Pipeline (GitHub Actions)** – Add a deploy step (e.g. GitHub Pages) so the site is deployed after the OMDb inject workflow runs. See `.github/workflows/inject-omdb-and-deploy.yml`.
- [ ] **OMDb API key** – Configure in one of:
  - **Local / dev:** Browser Console → `localStorage.setItem('omdb_api_key', 'YOUR_KEY')` then refresh. Get a key at [omdbapi.com](https://www.omdbapi.com/).
  - **Production:** Repo → Settings → Secrets and variables → Actions → New repository secret: `OMDB_API_KEY`. The workflow injects it into `homepage.js` before deploy.
- [ ] **Quote categories** – Extend or edit the list (All, Random, Movies, Bollywood, K-drama, Anime, Books, Leaders). Data in `assets/data/quotes-db.json`.
- [ ] **Use live posters** – Home quote card “Use live posters” checkbox: off = DB/map images only (faster, no API calls).

---

## Job tracker

- [ ] **Indeed source** – Implement backend proxy at `/api/indeed`; currently a placeholder in `jobs.js`.
- [ ] **Job proxy (Instahyre, Hirist, Himalaya, LinkedIn)** – API placeholders exist in `api/`; wire `window.JOB_PROXY_URL` and implement or stub responses for production use.
- [ ] **Planner export** – Optional: export application planner entries to CSV/JSON for backup or use in other tools.

---

## Trends & content

- [ ] **Anime feed** – Replace Trends “Anime” placeholder with real data (e.g. Jikan, seasonal list). Mentioned: “Jikan / Pinterest / Shorts-style embeds coming in a later update” (`trends.html`).
- [ ] **Entertainment strip** – Currently Picsum placeholders; optional: themed or curated image source.
- [ ] **Weather fallback** – On API/CORS failure, show a clear “Weather unavailable” message and optional “Retry” or “Use default city” (see IMPROVEMENTS.md).

---

## Codebase & structure (from IMPROVEMENTS.md)

- [ ] **Single nav source** – Nav is duplicated in every HTML file. Add a shared fragment or tiny build step (e.g. JS that injects nav, or Eleventy includes) so nav is defined once.
- [ ] **Split Playground logic** – `playground.js` is large. Split by feature (e.g. `playground-mode.js`, `playground-runner.js`, `playground-search.js`, `playground-assistant.js`) or use a minimal framework (Alpine/Preact) for smaller components.
- [ ] **Single Tools UI** – Editor/PDF exist on both `tools.html` and inside Playground (non-tech iframe). Prefer one implementation and iframe it where needed.
- [ ] **Accessibility** – Add/improve `aria-expanded`, `aria-label`, `role="dialog"`; focus trap in overlays; theme/mode announced to screen readers.
- [ ] **Automated tests** – Add a few E2E tests (e.g. Playwright/Cypress): Home → Playground → Tech → run snippet; Non-tech → Tools iframe; Resources topic. Even 5–10 tests to catch regressions.
- [ ] **Script load order** – Document required script order in README and/or use a single entry script that imports and inits in order so analytics and other inits don’t break if scripts are reordered or lazy-loaded.

---

## Optional / nice-to-have

- [ ] **Focus timer** – Optional: different alarm sounds or “Do not disturb” window when phase ends.
- [ ] **Analytics dashboard** – Optional: more filters, date range picker, or export of raw logs (already has JSON password protection).
- [ ] **Backup/restore** – Tools backup already includes notes + to-dos + timer log; optional: include planner entries in the same backup file.

---

## Summary

| Area              | Count | Focus |
|-------------------|-------|--------|
| Setup & config    | 4     | OMDb, pipeline, quotes |
| Job tracker       | 3     | Indeed, proxy, planner export |
| Trends & content  | 3     | Anime feed, entertainment, weather |
| Codebase/structure| 6     | Nav, split playground, Tools, a11y, tests, script order |
| Optional          | 3     | Timer, analytics, backup |

**Total:** 19 items. Tackle setup first, then job sources and Trends content, then structure and optional enhancements.

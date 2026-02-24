# Remaining Enhancements & To-Do List

A single backlog for the Standalone Playground (analytics-lab). Each item has **priority** (P0 = must-do, P1 = should-do, P2 = nice-to-have) and **effort** (Quick &lt;1 hr, Medium 1–4 hr, Large 4+ hr).

---

## Quick wins (effort: Quick, good impact)

- [x] **Document script load order** – “Script order” section in README + comment block in each main HTML. *Priority: P1 · Effort: Quick*
- [x] **Planner export (CSV/JSON)** – Already on Jobs page (“Export JSON” / “Export CSV” for planner). *Priority: P2 · Effort: Quick*

---

## Setup & configuration

- [x] **Pipeline (GitHub Actions)** – Deploy step (GitHub Pages) added in `.github/workflows/inject-omdb-and-deploy.yml`. *Priority: P0 if you deploy via Actions · Effort: Medium*
- [ ] **OMDb API key** – Configure once:
  - **Local:** Browser Console → `localStorage.setItem('omdb_api_key', 'YOUR_KEY')` then refresh. Key from [omdbapi.com](https://www.omdbapi.com/).
  - **Production:** Repo → Settings → Secrets → Actions → New secret `OMDB_API_KEY`. *Priority: P0 for live posters · Effort: Quick*
- [ ] **Quote categories** – Edit or extend categories and data in `assets/data/quotes-db.json`. Current: All, Random, Movies, Bollywood, K-drama, Anime, Books, Leaders. *Priority: P2 · Effort: Quick*
- [x] **Use live posters** – Documented in README. *Priority: P2 · Effort: Quick (doc only)*

---

## Job tracker

- [x] **Indeed source** – Stub at `api/indeed.js` (returns empty + “Not configured”). Wire real API (HasData/SerpAPI) when keys set. *Priority: P1 · Effort: Medium*
- [x] **Other job proxies** – Instahyre, Hirist, Himalaya return `configured: false` and clear message. *Priority: P2 · Effort: Medium per source*

---

## Trends & content

- [x] **Anime feed** – Trends uses Jikan top list + TV schedule (`/v4/schedules?filter=<weekday>`). *Priority: P2 · Effort: Medium*
- [ ] **Entertainment strip** – Optional: replace or complement Picsum with a themed/curated image source. *Priority: P2 · Effort: Quick–Medium*

---

## Codebase & structure (from IMPROVEMENTS.md)

- [x] **Single nav source** – `nav-data.js` + `nav-inject.js`; nav defined once, injected on index, trends, tools, jobs, docs. *Priority: P1 · Effort: Medium*
- [ ] **Split Playground logic** – Break `playground.js` into smaller modules (e.g. `playground-mode.js`, `playground-runner.js`, `playground-search.js`, `playground-assistant.js`) or use a minimal framework. *Priority: P2 · Effort: Large*
- [ ] **Single Tools UI** – Use one implementation of editor/PDF (e.g. always iframe `tools.html` from Playground non-tech) instead of two. *Priority: P2 · Effort: Medium*
- [ ] **Accessibility** – Add `aria-expanded`, `aria-label`, `role="dialog"` where needed; focus trap in overlays; theme/mode announced to screen readers. *Priority: P1 · Effort: Medium*
- [ ] **Automated tests** – Add 5–10 E2E tests (Playwright/Cypress): Home → Playground → run snippet; Non-tech → Tools; Resources topic. *Priority: P2 · Effort: Medium*

---

## Optional / nice-to-have

- [ ] **Focus timer** – Optional: choice of alarm sound or “Do not disturb” style when phase ends. *Priority: P2 · Effort: Quick*
- [ ] **Analytics dashboard** – Optional: date range picker, extra filters, or export of raw logs (JSON already password-protected). *Priority: P2 · Effort: Medium*

---

## Done (removed from backlog)

- **Weather fallback** – Already implemented: “Weather unavailable” + “Retry” and “Use default city” in `homepage.js` (`renderWeatherUnavailable`).
- **Backup includes planner** – Tools backup/restore already includes planner entries (`buildBackupPayload` / `applyRestore` in `tools.js`).

---

## Summary

| Area              | Open | Priority focus        | Suggested order                    |
|-------------------|------|------------------------|------------------------------------|
| Quick wins        | 2    | Doc + planner export  | Do first                           |
| Setup & config    | 4    | Pipeline, OMDb        | Before/with deploy                 |
| Job tracker      | 2    | Indeed, then others   | When you need more job sources     |
| Trends & content  | 2    | Anime, then strip      | When you want richer Trends        |
| Codebase/structure| 5    | Nav, a11y, then split  | Incremental                        |
| Optional          | 2    | Timer, dashboard       | As needed                          |

**Total open:** 17. **Quick wins:** 2. Tackle quick wins first, then setup, then job sources and structure.

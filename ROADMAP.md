# Remaining Enhancements & To-Do List

A single backlog for the Standalone Playground (analytics-lab). Each item has **priority** (P0 = must-do, P1 = should-do, P2 = nice-to-have) and **effort** (Quick &lt;1 hr, Medium 1–4 hr, Large 4+ hr).

---

## Quick wins (effort: Quick, good impact)

- [ ] **Document script load order** – Add a short “Script order” section in README and a comment block in each HTML listing required order (e.g. Tailwind → main.css → analytics → page script). Prevents breakage if someone reorders or lazy-loads. *Priority: P1 · Effort: Quick*
- [ ] **Planner export (CSV/JSON)** – On Jobs page, add “Export planner” button to download application planner entries as CSV or JSON for backup or use in spreadsheets. Data is already in `localStorage`; no backend. *Priority: P2 · Effort: Quick*

---

## Setup & configuration

- [ ] **Pipeline (GitHub Actions)** – Add a deploy step (e.g. GitHub Pages) so the site is deployed after the OMDb inject workflow. See `.github/workflows/inject-omdb-and-deploy.yml`. *Priority: P0 if you deploy via Actions · Effort: Medium*
- [ ] **OMDb API key** – Configure once:
  - **Local:** Browser Console → `localStorage.setItem('omdb_api_key', 'YOUR_KEY')` then refresh. Key from [omdbapi.com](https://www.omdbapi.com/).
  - **Production:** Repo → Settings → Secrets → Actions → New secret `OMDB_API_KEY`. *Priority: P0 for live posters · Effort: Quick*
- [ ] **Quote categories** – Edit or extend categories and data in `assets/data/quotes-db.json`. Current: All, Random, Movies, Bollywood, K-drama, Anime, Books, Leaders. *Priority: P2 · Effort: Quick*
- [ ] **Use live posters** – Document in README: Home quote card “Use live posters” = OMDb/Jikan when on; off = DB/map only (faster, no API). *Priority: P2 · Effort: Quick (doc only)*

---

## Job tracker

- [ ] **Indeed source** – Implement backend proxy (e.g. serverless at `/api/indeed`) and wire it in `jobs.js`; currently a placeholder. *Priority: P1 · Effort: Medium*
- [ ] **Other job proxies** – Instahyre, Hirist, Himalaya, LinkedIn: stubs exist in `api/`. Set `window.JOB_PROXY_URL` and implement or stub responses. *Priority: P2 · Effort: Medium per source*

---

## Trends & content

- [ ] **Anime feed** – Replace Trends “Anime” placeholder with real data (e.g. Jikan seasonal, or links to Pinterest/Shorts-style embeds). *Priority: P2 · Effort: Medium*
- [ ] **Entertainment strip** – Optional: replace or complement Picsum with a themed/curated image source. *Priority: P2 · Effort: Quick–Medium*

---

## Codebase & structure (from IMPROVEMENTS.md)

- [ ] **Single nav source** – Nav is duplicated in every HTML. Add a shared fragment (e.g. JS that injects nav, or Eleventy includes) so nav is defined once. *Priority: P1 · Effort: Medium*
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

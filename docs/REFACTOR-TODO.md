# Refactor, patch & test – consolidated list

Single list for: **root directory cleanup**, **standard structure**, **HTML/MD refactoring**, **tests**, and **patches**.  
Use with [ROADMAP.md](./ROADMAP.md) for full backlog; this file focuses on structure and quality.

---

## 1. Root directory – keep clean & simple

- [x] **Move all docs into `/docs`**  
  Done: `BINDER-TEST.md`, `BINDER-SETUP.md`, `HOME-LAYOUT-LOGIC.md`, `IMPROVEMENTS.md`, `ROADMAP.md`, `TODO-TOMORROW.md`, `TODO.md`, `REFACTOR-TODO.md`, `REMAINING-TASKS-AND-RESOURCES.md` → `docs/`.  
  Root: `README.md` only (of .md files), plus `.gitignore`, `vercel.json`, `sitemap.xml`, `sw.js`.

- [ ] **Move notebooks into a single place**  
  Keep `notebooks/` as-is or rename to `docs/notebooks` if you want all non-app content under `docs/`.  
  Ensure `notebooks/README.md` and setup guides stay discoverable.

- [ ] **Optional: move API stubs**  
  `api/*.js` could live under `scripts/api/` or stay at root; decide one convention and document in README.

- [ ] **Single entry for “what to read”**  
  In root `README.md`, add a short “Project docs” section with links to `docs/` (and `ROADMAP.md` / `TODO.md` if they stay in root).

**Target root (minimal):**  
`index.html`, `README.md`, `assets/`, `scripts/`, `api/`, `docs/`, `pages/`, `notebooks/`, config files, `.github/`. All other HTML live in `pages/`; all other .md in `docs/`.

---

## 2. HTML refactoring

- [x] **Single nav source**  
  Done: `nav-data.js` + `nav-inject.js` inject nav into pages with `data-nav-inject` (see TODO-TOMORROW.md, ROADMAP.md). Nav defined once; add/rename pages in one place.

- [x] **Document script load order**  
  Done: “Script order” section in README and comment block at top of each main HTML (Tailwind → main.css → analytics → page script). See ROADMAP.md.

- [ ] **Consistent layout and semantics**  
  Same wrapper/landmark structure across pages (e.g. `<main>`, nav, footer if any); shared class names for app bar and drawer so CSS stays predictable.

- [ ] **Optional: single Tools UI**  
  Tools (editor + PDF) exist on `tools.html` and inside Playground non-tech iframe. Prefer one implementation (e.g. non-tech always iframes `tools.html`).

---

## 3. Markdown / docs refactoring

- [ ] **Consolidate or merge small MDs**  
  After moving to `docs/`, consider merging `BINDER-TEST.md` + `BINDER-SETUP.md` into one `docs/BINDER.md`.  
  Merge or cross-link `HOME-LAYOUT-LOGIC.md` with `IMPROVEMENTS.md` if they overlap.

- [ ] **Single “Contributing / dev setup” doc**  
  One place for: how to run locally, script order, env/secrets (OMDb, etc.), and link to ROADMAP/REFACTOR-TODO.

- [ ] **README as entry point**  
  README: what the project is, link to docs, link to ROADMAP and REFACTOR-TODO so new contributors know where to look.

---

## 4. Tests

- [ ] **Add E2E tests (Playwright or Cypress)**  
  At least 5–10 critical-path tests, e.g.:  
  - Home loads; quote category change works; weather shows or fallback.  
  - Playground → Tech → run snippet.  
  - Playground → Non-tech → Tools iframe loads.  
  - Resources → open a topic.  
  - Jobs page loads; planner interaction (if applicable).

- [ ] **Optional: smoke test for deploy**  
  After deploy (e.g. GitHub Actions), hit main URLs and check 200 (or a single “smoke” E2E that runs in CI).

- [ ] **No unit tests yet**  
  Optional later: unit tests for pure JS (e.g. quote DB parsing, weather formatting). Not required for first pass.

---

## 5. Patches and small fixes

- [ ] **Pipeline (GitHub Actions)**  
  Add deploy step (e.g. GitHub Pages or Vercel) after OMDb inject. See `.github/workflows/inject-omdb-and-deploy.yml`.

- [ ] **OMDb API key**  
  Document: local `localStorage.setItem('omdb_api_key', '...')`; production repo secret `OMDB_API_KEY`.

- [ ] **Accessibility**  
  Add `aria-expanded`, `aria-label`, `role="dialog"` where needed; focus trap in modals (weather hourly, nav drawer, roadmap, assistant); theme/mode announced to screen readers.

- [ ] **Quotes DB v4 follow-up**  
  We added `quotes-db.v4.json`, migration script, and homepage wired to v4 with API-first image logic.  
  Optional: finish migrating old `quotes-db.json` into v4 shape (or retire old file and rely on v4 only); add more entries per category if desired.

- [ ] **Weather card**  
  Done: bigger card, location name, AQI/wind/sunrise–sunset/min–max/rain, weather animation, hourly modal.  
  Patch if needed: fix timezone for sunrise/sunset display; or improve “My location” label (e.g. show city name from reverse geocode more prominently).

- [ ] **Quote card poster**  
  Done: taller card, `background-size: contain` so poster isn’t cropped.  
  Patch if needed: tune min-heights for small screens so layout doesn’t break.

---

## 6. Standard structure (summary)

| Area        | Goal |
|------------|------|
| **Root**    | Only entry HTML, README, TODO, config, and top-level dirs (`assets/`, `scripts/`, `docs/`, `api/`, etc.). |
| **Docs**    | All `.md` except README/TODO in `docs/` (or clearly listed in README). |
| **Scripts** | Build/inject/migrate scripts in `scripts/`; optional `scripts/api/` if API stubs move. |
| **Assets**  | `assets/js`, `assets/css`, `assets/data` (e.g. quotes-db), `assets/vendor`. |
| **HTML**    | One nav source; consistent layout; script order documented. |
| **Tests**   | E2E in repo (e.g. `tests/` or `e2e/`); run in CI if you have a pipeline. |

---

## Done (from our recent work)

- Quotes DB v4 structure and migration script; homepage loads v4 and uses API-first image logic.
- Weather card: larger, location name, AQI/wind/sunrise/sunset/min–max/rain, weather-based background animation, hourly forecast modal.
- Quote card: increased height, poster `contain` to avoid top/bottom crop.
- Pushed to branch `refactor` on GitHub.

---

## Suggested order

1. **Root + docs** – Move MDs to `docs/`, tidy root, update README links.
2. **Script order** – Document in README and in each HTML (quick).
3. **Single nav** – Implement shared nav (JS or build); then refactor HTML.
4. **E2E tests** – Add Playwright/Cypress and 5–10 tests; run locally (and in CI if you add deploy step).
5. **Pipeline + OMDb** – Deploy step and key docs.
6. **A11y and patches** – Modal focus, ARIA, then any remaining small fixes.

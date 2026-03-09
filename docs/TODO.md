# Project TODO (quick list)

Full backlog (priorities, effort, quick wins): **[ROADMAP.md](./ROADMAP.md)**.  
**Refactor, root cleanup, HTML/MD, tests:** **[REFACTOR-TODO.md](./REFACTOR-TODO.md)**.  
Quick wins in ROADMAP: document script order ✅, planner export (CSV/JSON) ✅ (already on Jobs page).

- [x] **Pipeline (GitHub Actions)** – Deploy step (GitHub Pages) added in `.github/workflows/inject-omdb-and-deploy.yml`.
- [ ] **OMDb API key** – Local: `localStorage.setItem('omdb_api_key', 'YOUR_KEY')`; Production: repo secret `OMDB_API_KEY`. [omdbapi.com](https://www.omdbapi.com/).
- [ ] **Quote categories** – Edit `assets/data/quotes-db.json`. Current: All, Random, Movies, Bollywood, K-drama, Anime, Books, Leaders.
- [x] **Use live posters** – Documented in README: “Use live posters” = OMDb/Jikan when on; off = DB/map only (faster).

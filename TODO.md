# Project TODO (quick list)

Full backlog (priorities, effort, quick wins): **[ROADMAP.md](./ROADMAP.md)**.  
**Refactor, root cleanup, HTML/MD, tests:** **[REFACTOR-TODO.md](./REFACTOR-TODO.md)**.  
Quick wins in ROADMAP: document script order, add planner export (CSV/JSON).

- [ ] **Pipeline (GitHub Actions)** – Add deploy step (e.g. GitHub Pages) after OMDb inject. See `.github/workflows/inject-omdb-and-deploy.yml`.
- [ ] **OMDb API key** – Local: `localStorage.setItem('omdb_api_key', 'YOUR_KEY')`; Production: repo secret `OMDB_API_KEY`. [omdbapi.com](https://www.omdbapi.com/).
- [ ] **Quote categories** – Edit `assets/data/quotes-db.json`. Current: All, Random, Movies, Bollywood, K-drama, Anime, Books, Leaders.
- [ ] **Use live posters** – Home quote card: “Use live posters” off = DB/map only (faster).

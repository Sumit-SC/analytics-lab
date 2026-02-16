# Project TODO

- [ ] **Pipeline (GitHub Actions)** – The OMDb inject workflow runs on push; add your deploy step (e.g. GitHub Pages) so the site is actually deployed after injecting the key. See `.github/workflows/inject-omdb-and-deploy.yml`.
- [ ] **OMDb API key** – Put the key in one of two places:
  - **Local / dev:** Browser Console → `localStorage.setItem('omdb_api_key', 'YOUR_KEY')` then refresh. Get a free key at [omdbapi.com](https://www.omdbapi.com/).
  - **Production:** GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** → Name: `OMDB_API_KEY`, Value: your key. The workflow injects it into `homepage.js` before deploy.
- [ ] **Quote categories** – Current list: All, Random, Movies, Bollywood, K-drama, Anime, Books, Leaders. DB in `assets/data/quotes-db.json`.
- [ ] **Use live posters** – Home quote card has a “Use live posters” checkbox; off = DB/map images only (faster, no API calls).

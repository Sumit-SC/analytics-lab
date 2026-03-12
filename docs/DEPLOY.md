# Deploy checklist (Vercel)

## After push

1. **Vercel** – If the project is connected to GitHub repo `Sumit-SC/analytics-lab` and branch `analytics-lab-silo`:
   - Vercel should auto-deploy on this push. Check the [Vercel dashboard](https://vercel.com/dashboard) for the latest deployment.
   - Build: static site (no build command needed; output is root).
   - Root directory: set to `analytics-lab` if the Vercel project points at the monorepo root; otherwise leave as `.` when the repo is analytics-lab only.

2. **Cache behavior** (already configured in `vercel.json`):
   - **HTML** (`.html`): `max-age=0, must-revalidate` – always revalidate so deploys show up.
   - **Assets** (`/assets/*`, `.js`, `.css`, fonts): `max-age=86400, stale-while-revalidate=604800` (1 day cache, 7 days stale-while-revalidate).
   - **JSON** (e.g. `quotes-db.v4.json`): `max-age=300, stale-while-revalidate=3600` (5 min cache).
   - Service worker cache name is `standalone-playground-v2`; bump version in `sw.js` on major updates to force clients to fetch new assets.

3. **If deployment fails**
   - Confirm **Root Directory** in Vercel project settings: use `.` if the repo root is this folder (analytics-lab); use the folder name if the repo is the parent monorepo.
   - No build step required for static HTML/JS/CSS.
   - Ensure `vercel.json` is valid JSON (no trailing commas).

4. **Verify live**
   - Open the deployed URL and check: Home (quotes, weather), Trends (Live & Breaking, Alerts load), and a hard refresh (Ctrl+Shift+R) to see new cache headers / SW v2.

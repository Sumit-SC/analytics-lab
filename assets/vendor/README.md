# Offline / CDN fallback assets

The site tries CDN first and falls back to these local files when offline or when the CDN fails.

## One-time setup: download vendor files

Run the download script from the **analytics-lab** folder (project root):

```powershell
.\scripts\download-vendor.ps1
```

Or manually:

1. **Tailwind** – save as `assets/vendor/tailwind.min.js`:
   - https://cdn.tailwindcss.com

2. **sql.js** – save into `assets/vendor/sql.js/`:
   - https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js
   - https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm

## Optional: Large offline assets

These are very large (~30MB+ each) and are optional for offline use:

3. **Pyodide** (Python runtime, ~30MB):
   - CDN: https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js
   - To use offline: Download the full Pyodide distribution and host locally
   - Note: Python mode will fallback to JavaScript if Pyodide fails to load

4. **JupyterLite** (embedded notebook, ~50MB+):
   - CDN: https://jupyterlite.github.io/demo/lab/
   - To use offline: Host JupyterLite locally or use a local Jupyter server
   - Note: The embedded iframe will show an error if offline

5. **Transformers.js** (chatbot model, ~80MB):
   - CDN: https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2
   - Model: Xenova/flan-t5-small (downloads on first use)
   - Note: Chatbot falls back to Wikipedia search if model fails to load

After downloading Tailwind + sql.js, the playground works offline for basic features (Tailwind styling + SQL execution). Python, JupyterLite, and the full chatbot require network connectivity unless you host them locally.

# Download CDN assets for offline / fallback use. Run from analytics-lab root.
$ErrorActionPreference = 'Stop'
$base = $PSScriptRoot + '\..'
$vendor = Join-Path $base 'assets\vendor'
$sqlDir = Join-Path $vendor 'sql.js'

New-Item -ItemType Directory -Force -Path $vendor | Out-Null
New-Item -ItemType Directory -Force -Path $sqlDir | Out-Null

Write-Host 'Downloading Tailwind (CDN copy)...'
Invoke-WebRequest -Uri 'https://cdn.tailwindcss.com' -OutFile (Join-Path $vendor 'tailwind.min.js') -UseBasicParsing

Write-Host 'Downloading sql.js...'
Invoke-WebRequest -Uri 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js' -OutFile (Join-Path $sqlDir 'sql-wasm.js') -UseBasicParsing
Invoke-WebRequest -Uri 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm' -OutFile (Join-Path $sqlDir 'sql-wasm.wasm') -UseBasicParsing

Write-Host 'Done. Vendor assets are in assets/vendor/'

/**
 * Replaces __OMDB_API_KEY__ in homepage.js with the value from env OMDB_API_KEY.
 * Used in CI: GitHub Secrets → OMDB_API_KEY; run before deploy so the key is not in the repo.
 * Run: OMDB_API_KEY=yourkey node scripts/inject-omdb-key.js
 */
const fs = require('fs');
const path = require('path');

const key = process.env.OMDB_API_KEY || '';
const file = path.resolve(__dirname, '..', 'assets', 'js', 'homepage.js');
if (!fs.existsSync(file)) {
  console.error('File not found:', file);
  process.exit(1);
}
let content = fs.readFileSync(file, 'utf8');

// Escape for use inside single-quoted JS string
const escaped = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
content = content.replace('__OMDB_API_KEY__', escaped);
fs.writeFileSync(file, content);
console.log('OMDb key injected into homepage.js');

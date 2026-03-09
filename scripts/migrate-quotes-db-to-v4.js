// Simple migration helper to transform the existing quotes-db.json (v2 flat arrays)
// into the new v4 structure with nested categories and normalized schema.
//
// This does NOT fetch ISBN/Goodreads/IMDb or curate images – it just:
// - wraps categories into `categories.{name}`
// - normalizes each quote to the new shape
// - converts string image arrays into { type, url } objects
// - drops clearly invalid items (empty text, missing author)
//
// You can run this with:
//   node analytics-lab/scripts/migrate-quotes-db-to-v4.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INPUT_PATH = path.join(ROOT, 'assets', 'data', 'quotes-db.json');
const OUTPUT_PATH = path.join(ROOT, 'assets', 'data', 'quotes-db.migrated.v4.json');

// Categories expected in the new structure
const CATEGORY_KEYS = [
  'anime',
  'kdrama',
  'books',
  'leaders',
  'tv_show',
  'movie',
  'bollywood',
  'hollywood',
  'international',
  'wisdom',
  'life',
  'love',
  'friendship',
  'heartbreak',
  'future',
  'past',
  'inspiring',
  'meme',
  'random'
];

// Categories where "Unknown" authors are allowed
const ALLOW_UNKNOWN_AUTHOR = new Set([
  'random',
  'meme',
  'life',
  'love',
  'friendship',
  'heartbreak',
  'inspiring'
]);

function normalizeImages(rawImages) {
  if (!Array.isArray(rawImages)) return [];
  const unique = Array.from(new Set(rawImages.filter((u) => typeof u === 'string' && u.trim())));

  const typeOrder = ['poster', 'still', 'alternate'];

  return unique.map((url, index) => ({
    type: typeOrder[index] || 'alternate',
    url
  }));
}

function normalizeQuote(category, quote) {
  if (!quote || typeof quote !== 'object') return null;

  const text = (quote.text || '').trim();
  const author = (quote.author || '').trim();

  if (!text) return null;

  if (!ALLOW_UNKNOWN_AUTHOR.has(category) && (!author || author.toLowerCase() === 'unknown')) {
    return null;
  }

  const source = (quote.source || '').trim();

  return {
    text,
    author,
    source,
    year: '',
    isbn: '',
    goodreads_id: '',
    imdb_id: '',
    images: normalizeImages(quote.images)
  };
}

function migrate() {
  const raw = fs.readFileSync(INPUT_PATH, 'utf-8');
  const data = JSON.parse(raw);

  const result = {
    meta: {
      version: 4,
      description: 'Structured, API-enriched quote database with ISBN and IMDb support (auto-migrated base; IDs/images still need enrichment)'
    },
    categories: {}
  };

  CATEGORY_KEYS.forEach((key) => {
    const original = Array.isArray(data[key]) ? data[key] : [];
    const normalized = original
      .map((q) => normalizeQuote(key, q))
      .filter(Boolean);

    result.categories[key] = normalized;
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8');
  // eslint-disable-next-line no-console
  console.log(`Migrated quotes written to ${OUTPUT_PATH}`);
}

if (require.main === module) {
  migrate();
}


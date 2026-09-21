import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

console.log('Total items in catalog:', catalog.length);

// Let's test different similarity / duplicate patterns
// 1. Same category + highly similar title (e.g. after removing color, size, parenthesis, special chars)
function normalizeTitle(t) {
  return t
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ') // remove anything in ( )
    .replace(/\[.*?\]/g, ' ') // remove anything in [ ]
    .replace(/[-–—:|/+,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const colorWords = [
  'black', 'white', 'red', 'blue', 'navy', 'navy blue', 'royal blue', 'sky blue',
  'green', 'olive', 'olive green', 'teal', 'maroon', 'wine', 'pink', 'baby pink',
  'purple', 'violet', 'yellow', 'mustard', 'orange', 'brown', 'chocolate', 'coffee',
  'grey', 'gray', 'silver', 'golden', 'gold', 'beige', 'cream', 'off white', 'off-white',
  'peach', 'coral', 'lavender', 'charcoal', 'rust', 'mint', 'magenta', 'turquoise',
  'khaki', 'ash', 'paste', 'camo', 'multi', 'multicolor', 'multi color', 'cyan', 'rose',
  'bottle green', 'sea green', 'deep blue', 'light blue', 'dark blue', 'dark green'
];

function stripColorsAndJunk(title) {
  let cleaned = title.toLowerCase();
  // Remove parenthesized words first
  cleaned = cleaned.replace(/\([^)]*\)/g, ' ');
  cleaned = cleaned.replace(/\[[^\]]*\]/g, ' ');

  // Remove common color suffixes / prefixes / patterns
  for (const c of colorWords.sort((a,b) => b.length - a.length)) {
    // word boundary color word
    const reg = new RegExp(`\\b${c}\\b(?:\\s*(?:color|colour))?`, 'gi');
    cleaned = cleaned.replace(reg, ' ');
  }

  // Remove trailing or leading punctuation & extra words
  cleaned = cleaned
    .replace(/\b(?:color|colour|edition|set|piece|pcs)\b/gi, ' ')
    .replace(/[-–—:|/+,._]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

const clusters = new Map();
for (const p of catalog) {
  const base = stripColorsAndJunk(p.title);
  const key = `${p.category_id}:::${base}`;
  if (!clusters.has(key)) {
    clusters.set(key, []);
  }
  clusters.get(key).push(p);
}

const dupeClusters = Array.from(clusters.entries()).filter(([k, v]) => v.length > 1);
console.log(`Clusters found: ${clusters.size}`);
console.log(`Clusters with > 1 product (potential duplicates): ${dupeClusters.length}`);

let totalDupeItems = 0;
dupeClusters.forEach(([k, items]) => {
  totalDupeItems += items.length;
});
console.log(`Total items that belong to duplicate clusters: ${totalDupeItems}`);

console.log('\nTop 20 Duplicate Clusters sample:');
dupeClusters.slice(0, 20).forEach(([k, items], idx) => {
  console.log(`\n#${idx + 1} Cluster [${items.length} items]: "${k}"`);
  items.forEach(item => {
    console.log(`  - [${item.sku}] ${item.title}`);
  });
});

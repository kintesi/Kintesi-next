import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/dropshippingCatalog.json'), 'utf8'));
console.log('Total products in catalog:', catalog.length);

const sample = catalog.slice(0, 15);
for (let i = 0; i < sample.length; i++) {
  const p = sample[i];
  console.log(`[${i + 1}] Title: ${p.title}`);
  console.log(`    Category: ${p.category_id} | Sub: ${p.sub_category || 'N/A'}`);
  console.log(`    Tags (${p.tags?.length || 0}):`, p.tags);
}

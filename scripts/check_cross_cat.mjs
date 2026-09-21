import fs from 'fs';

const catalog = JSON.parse(fs.readFileSync('src/data/dropshippingCatalog.json', 'utf8'));

const titleMap = new Map();
for (const p of catalog) {
  const norm = p.title.toLowerCase().trim();
  if (!titleMap.has(norm)) titleMap.set(norm, []);
  titleMap.get(norm).push(p);
}

const dupesAcrossCats = [];
for (const [t, items] of titleMap.entries()) {
  const cats = new Set(items.map(i => i.category_id));
  if (items.length > 1) {
    dupesAcrossCats.push({ title: t, count: items.length, cats: Array.from(cats), skus: items.map(i => i.sku) });
  }
}

console.log('Total exact title duplicates across catalog:', dupesAcrossCats.length);
dupesAcrossCats.forEach(d => {
  console.log(`- "${d.title}" (${d.count} items, cats: ${d.cats.join(', ')}, skus: ${d.skus.join(', ')})`);
});

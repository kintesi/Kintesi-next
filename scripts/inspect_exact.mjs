import fs from 'fs';

const catalog = JSON.parse(fs.readFileSync('src/data/dropshippingCatalog.json', 'utf8'));

const testTitles = [
  "women's handbag solid",
  "high end ladies' handbag multi-layer large capacity commuting bag",
  "halei premium women's quartz analog watch – stainless steel strap, round case, mineral glass, water resistant, elegant japanese movement wristwatch for ladies",
  "elegant palazzo long khimar set"
];

for (const t of testTitles) {
  const matches = catalog.filter(p => p.title.toLowerCase().trim() === t);
  console.log(`\nMatch for "${t}" (${matches.length} items):`);
  matches.forEach(m => {
    console.log(`  SKU: ${m.sku} | URL: ${m.dropshipping_url} | Cat: ${m.category_id} | Colors count: ${(m.colors||[]).length}`);
  });
}

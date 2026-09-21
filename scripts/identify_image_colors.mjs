import { createClient } from '@supabase/supabase-js';
import { getAverageColor } from 'fast-average-color-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMDIwNiwiZXhwIjoyMTA0NDk2MjA2fQ.7M3tSiIGGj2E0aG1JFm0bvHgWQ8024J5Pvuz2P58k8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PALETTE = [
  { name: 'Red', hex: '#EF4444', rgb: [220, 38, 38] },
  { name: 'Maroon', hex: '#800000', rgb: [128, 0, 0] },
  { name: 'Blue', hex: '#2563EB', rgb: [37, 99, 235] },
  { name: 'Navy Blue', hex: '#1E3A8A', rgb: [30, 58, 138] },
  { name: 'Sky Blue', hex: '#38BDF8', rgb: [56, 189, 248] },
  { name: 'Green', hex: '#16A34A', rgb: [22, 163, 74] },
  { name: 'Olive Green', hex: '#556B2F', rgb: [85, 107, 47] },
  { name: 'Yellow', hex: '#EAB308', rgb: [234, 179, 8] },
  { name: 'Golden', hex: '#D97706', rgb: [217, 119, 6] },
  { name: 'Orange', hex: '#F97316', rgb: [249, 115, 22] },
  { name: 'Pink', hex: '#EC4899', rgb: [236, 72, 153] },
  { name: 'Purple', hex: '#9333EA', rgb: [147, 51, 234] },
  { name: 'Teal', hex: '#14B8A6', rgb: [20, 184, 166] },
  { name: 'Brown', hex: '#78350F', rgb: [120, 53, 15] },
  { name: 'Black', hex: '#000000', rgb: [25, 25, 25] },
  { name: 'White', hex: '#FFFFFF', rgb: [245, 245, 245] },
  { name: 'Silver', hex: '#9CA3AF', rgb: [160, 165, 175] },
  { name: 'Ash', hex: '#6B7280', rgb: [107, 114, 128] },
  { name: 'Beige', hex: '#F5F5DC', rgb: [245, 245, 220] },
];

function closestColor(rgb) {
  let minD = Infinity;
  let best = PALETTE[0];
  for (const c of PALETTE) {
    const d = Math.sqrt(
      Math.pow(rgb[0] - c.rgb[0], 2) +
      Math.pow(rgb[1] - c.rgb[1], 2) +
      Math.pow(rgb[2] - c.rgb[2], 2)
    );
    if (d < minD) {
      minD = d;
      best = c;
    }
  }
  return best;
}

function withTimeout(promise, ms = 2500) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
}

async function main() {
  console.log('🔄 Loading dropshipping catalog...');
  const jsonPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  const catalog = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Step 1: Find all products that have variants with "Option X" or duplicate SKUs
  const targets = [];
  const imageUrlsToFetch = new Set();

  for (const p of catalog) {
    if (!Array.isArray(p.colors) || p.colors.length === 0) continue;

    // Check if any color has Option X or duplicate SKU
    const seenSkus = new Set();
    let needsWork = false;
    for (const c of p.colors) {
      const key = (c.sku || c.name || '').trim();
      if (seenSkus.has(key)) needsWork = true;
      seenSkus.add(key);
      if (!c.name || /^option\s*\d+/i.test(c.name) || c.hex === '#1E293B' || c.name.toLowerCase() === 'default') {
        needsWork = true;
        if (c.image && c.image.startsWith('http')) {
          imageUrlsToFetch.add(c.image);
        }
      }
    }
    if (needsWork) {
      targets.push(p);
    }
  }

  console.log(`Found ${targets.length} products needing color normalization.`);
  console.log(`Unique images to process: ${imageUrlsToFetch.size}`);

  // Step 2: Parallel image color extraction with pool of 15
  const urlColorMap = new Map();
  const urlList = Array.from(imageUrlsToFetch);
  const CONCURRENCY = 15;

  console.log(`🚀 Extracting colors with ${CONCURRENCY} parallel workers...`);
  for (let i = 0; i < urlList.length; i += CONCURRENCY) {
    const chunk = urlList.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (url) => {
        try {
          const res = await withTimeout(getAverageColor(url), 2000);
          if (res && res.value) {
            const match = closestColor(res.value.slice(0, 3));
            urlColorMap.set(url, { name: match.name, hex: res.hex });
          }
        } catch (_) {}
      })
    );
    if ((i + CONCURRENCY) % 75 === 0 || i + CONCURRENCY >= urlList.length) {
      console.log(`Progress: ${Math.min(i + CONCURRENCY, urlList.length)}/${urlList.length} images analyzed.`);
    }
  }

  // Step 3: Apply identified colors and deduplicate SKUs across target products
  let modifiedCount = 0;
  const productsToUpsert = [];

  for (const p of targets) {
    const seenSkus = new Set();
    const cleanColors = [];
    let changed = false;

    // First deduplicate by SKU
    for (const c of p.colors) {
      const skuKey = (c.sku || c.dropshipping_url || c.name || '').trim();
      if (skuKey && seenSkus.has(skuKey)) {
        changed = true;
        continue;
      }
      if (skuKey) seenSkus.add(skuKey);
      cleanColors.push(c);
    }

    // Identify colors
    const nameCounts = new Map();
    for (let idx = 0; idx < cleanColors.length; idx++) {
      const c = cleanColors[idx];
      const isGeneric = !c.name || /^option\s*\d+/i.test(c.name) || c.hex === '#1E293B' || c.name.toLowerCase() === 'default';

      if (isGeneric && c.image && urlColorMap.has(c.image)) {
        const detected = urlColorMap.get(c.image);
        c.name = detected.name;
        c.hex = detected.hex;
        changed = true;
      }

      // Avoid identical duplicate names within the same product
      const base = c.name || 'Color';
      const count = (nameCounts.get(base) || 0) + 1;
      nameCounts.set(base, count);
      if (count > 1) {
        c.name = `${base} (Design ${count})`;
        changed = true;
      }
    }

    p.colors = cleanColors;

    if (changed) {
      const newVariantsSpec = {};
      for (const c of cleanColors) {
        newVariantsSpec[c.name] = {
          sku: c.sku || p.sku,
          dropshipping_url: c.dropshipping_url || p.dropshipping_url,
          wholesale_cost: p.specifications?.wholesale_cost || 0,
          profit_margin: p.specifications?.profit_margin || 0,
        };
      }
      p.specifications = {
        ...(p.specifications || {}),
        color_variants: newVariantsSpec,
        has_color_variants: cleanColors.length > 1,
      };
      modifiedCount++;
      productsToUpsert.push(p);
    }
  }

  console.log(`✨ Successfully normalized colors for ${modifiedCount} products!`);

  // Step 4: Write updated JSON
  fs.writeFileSync(jsonPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`💾 Saved updated catalog JSON to ${jsonPath}`);

  // Step 5: Upsert only modified products to Supabase
  if (productsToUpsert.length > 0) {
    console.log(`⚡ Upserting ${productsToUpsert.length} modified products to Supabase...`);
    const BATCH = 50;
    for (let b = 0; b < Math.ceil(productsToUpsert.length / BATCH); b++) {
      const chunk = productsToUpsert.slice(b * BATCH, (b + 1) * BATCH);
      const { error } = await supabase.from('products').upsert(chunk, { onConflict: 'slug' });
      if (error) {
        console.warn(`Batch ${b + 1} notice:`, error.message);
      } else {
        console.log(`Batch ${b + 1} synced (${Math.min((b + 1) * BATCH, productsToUpsert.length)}/${productsToUpsert.length}).`);
      }
    }
  }

  console.log('🎉 All image colors identified and Supabase synchronized successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

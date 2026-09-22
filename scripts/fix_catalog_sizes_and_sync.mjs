import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMDIwNiwiZXhwIjoyMTA0NDk2MjA2fQ.7M3tSiIGGj2E0aG1JFm0bvHgWQ8024J5Pvuz2P58k8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function getExactSizesFromDescription(p) {
  const desc = p.description || '';
  const title = (p.title || '').toLowerCase();

  // Pattern 1: Kids range 1-2, 3-4, 5-6, 7-8, 9-10, 11-12
  if (desc.includes('1-2') && desc.includes('3-4') && desc.includes('5-6') && desc.includes('7-8')) {
    const list = ['1-2 Years', '3-4 Years', '5-6 Years', '7-8 Years'];
    if (desc.includes('9-10')) list.push('9-10 Years');
    if (desc.includes('11-12')) list.push('11-12 Years');
    return list;
  }

  // Pattern 2: Kids other ranges: e.g. 2-3, 3-4, 4-5
  const rangeMatches = [];
  const lines = desc.split('\n');
  lines.forEach(l => {
    const rm = l.match(/^•?\s*([0-9]{1,2})\s*[-–]\s*([0-9]{1,2})\s*(?:yrs|years|y|yr|বছর)?\b\s*[:=-]/i);
    if (rm) {
      const val = `${rm[1]}-${rm[2]} Years`;
      if (!rangeMatches.includes(val)) rangeMatches.push(val);
    }
  });
  if (rangeMatches.length >= 2) {
    return rangeMatches;
  }

  // Pattern 3: Kids single years: e.g. 6 yrs, 8 yrs, 10 yrs, 12 yrs
  const singleYrMatches = [];
  lines.forEach(l => {
    const ym = l.match(/^•?\s*([0-9]{1,2})\s*(?:yrs|years|y|yr|বছর)\b\s*[-–—:]/i);
    if (ym) {
      const y = `${ym[1]} Years`;
      if (!singleYrMatches.includes(y)) singleYrMatches.push(y);
    }
  });
  if (singleYrMatches.length >= 2) {
    return singleYrMatches;
  }

  // Pattern 4: Panjabi numeric sizes: 38, 40, 42, 44, 46
  if (title.includes('panjabi') || title.includes('punjabi')) {
    const pSizes = [];
    ['38', '40', '42', '44', '46'].forEach(num => {
      // Must appear as a size option or measurement in desc
      const r = new RegExp(`(?:size|মাপ|সাইজ|•|\\*|\\b)${num}\\s*[:=-]|\\b${num}\\s*(?:inch|ইঞ্চি|\\")`, 'i');
      if (r.test(desc) || desc.includes(`• ${num}:`)) {
        pSizes.push(num);
      }
    });
    if (pSizes.length >= 2) {
      return pSizes;
    }
  }

  // Pattern 5: Adult Letter sizes: S, M, L, XL, XXL, XXXL
  const letterSizes = [];
  ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].forEach(sz => {
    const r = new RegExp(`(?:•|\\*|\\b)${sz}\\s*[:=-]`, 'i');
    if (r.test(desc)) {
      letterSizes.push(sz);
    }
  });
  if (letterSizes.length >= 2) {
    return letterSizes;
  }

  return null;
}

async function main() {
  const jsonPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  const catalog = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const modified = [];

  catalog.forEach(p => {
    const correctSizes = getExactSizesFromDescription(p);
    if (!correctSizes || correctSizes.length === 0) return;

    const currentSizes = p.sizes || [];
    const customAttrs = p.custom_attributes || [];
    const sizeAttrs = customAttrs.filter(a => (a.attribute || '').toLowerCase() === 'size');

    // Check if current sizes differ from correct sizes
    const areIdentical = currentSizes.length === correctSizes.length &&
      correctSizes.every((sz, idx) => currentSizes[idx] === sz);

    if (!areIdentical) {
      // Update sizes
      p.sizes = correctSizes;

      // Update custom_attributes: preserve non-size attributes, replace size attributes
      const nonSizeAttrs = customAttrs.filter(a => (a.attribute || '').toLowerCase() !== 'size');
      const newSizeAttrs = correctSizes.map(sz => ({
        attribute: 'Size',
        name: sz,
        price_offset: 0,
        stock: 50
      }));
      p.custom_attributes = [...nonSizeAttrs, ...newSizeAttrs];

      modified.push({
        id: p.id,
        sku: p.sku,
        title: p.title,
        oldSizes: currentSizes,
        newSizes: correctSizes,
        custom_attributes: p.custom_attributes
      });
    }
  });

  console.log(`✅ Total products needing size corrections: ${modified.length}`);

  modified.slice(0, 25).forEach((m, idx) => {
    console.log(`${idx + 1}. [${m.sku}] ${m.title.slice(0, 40)}`);
    console.log(`   Old: [${m.oldSizes.join(', ')}]`);
    console.log(`   New: [${m.newSizes.join(', ')}]`);
  });

  // Save to catalog file
  fs.writeFileSync(jsonPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`\n💾 Saved updated catalog to ${jsonPath}`);

  // Sync to Supabase
  console.log(`\n⚡ Syncing ${modified.length} corrected products to Supabase...`);
  const CONCURRENCY = 25;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < modified.length; i += CONCURRENCY) {
    const chunk = modified.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (item) => {
        const { error } = await supabase
          .from('products')
          .update({
            sizes: item.newSizes,
            custom_attributes: item.custom_attributes,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (error) {
          console.error(`❌ Error updating [${item.sku}] ${item.id}:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      })
    );
    console.log(`Processed ${Math.min(i + CONCURRENCY, modified.length)} / ${modified.length}`);
  }

  console.log(`\n🎉 SYNC COMPLETED!`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

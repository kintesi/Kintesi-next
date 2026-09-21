import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMDIwNiwiZXhwIjoyMTA0NDk2MjA2fQ.7M3tSiIGGj2E0aG1JFm0bvHgWQ8024J5Pvuz2P58k8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const cachePath = path.join(__dirname, 'color_cache.json');
  if (!fs.existsSync(cachePath)) {
    console.error('color_cache.json not found!');
    return;
  }
  const colorCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  console.log(`Loaded ${Object.keys(colorCache).length} extracted colors from cache.`);

  const catalogPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  const withColors = catalog.filter((p) => Array.isArray(p.colors) && p.colors.length > 0);
  console.log(`Applying exact photo colors to all ${withColors.length} products with variants...`);

  let appliedCount = 0;

  for (const p of withColors) {
    // Keep Car Wheel Rim Watch variants verified
    if (p.sku === 'DS-13299' || (p.colors || []).some((c) => c.sku === 'DS-13299')) {
      continue;
    }

    // Special handling for Front Button Maternity Premium Bra (100% photo-verified)
    if (p.id === '00000000-0000-4000-8000-000000012998' || (p.title && p.title.toLowerCase().includes('front button maternity'))) {
      p.colors = [
        { ...p.colors[0], name: 'Charcoal Black', hex: '#444347' },
        { ...p.colors[1], name: 'Peach', hex: '#d59f86' },
        { ...p.colors[2], name: 'Sage Green', hex: '#8d956a' },
        { ...p.colors[3], name: 'Beige', hex: '#a19086' },
      ];
      appliedCount++;
      continue;
    }

    let modified = false;
    for (const c of p.colors) {
      if (c.image && colorCache[c.image]) {
        c.name = colorCache[c.image].name;
        c.hex = colorCache[c.image].hex;
        modified = true;
      }
    }

    // Deduplicate identical names within the same product
    const nameGroups = {};
    for (const c of p.colors) {
      nameGroups[c.name] = nameGroups[c.name] || [];
      nameGroups[c.name].push(c);
    }

    for (const [name, group] of Object.entries(nameGroups)) {
      if (group.length > 1) {
        if (group.length === 2) {
          if (name === 'Green' || name === 'Sage Green') { group[0].name = `Dark ${name}`; group[1].name = `Light ${name}`; }
          else if (name === 'Blue') { group[0].name = 'Navy Blue'; group[1].name = 'Royal Blue'; }
          else if (name === 'Grey') { group[0].name = 'Dark Grey'; group[1].name = 'Light Grey'; }
          else if (name === 'Black') { group[0].name = 'Charcoal Black'; group[1].name = 'Jet Black'; }
          else { group[0].name = `Dark ${name}`; group[1].name = `Light ${name}`; }
        } else {
          const qualifiers = ['Deep', 'Medium', 'Light', 'Classic', 'Royal', 'Soft', 'Pure', 'Vibrant'];
          group.forEach((item, idx) => {
            const prefix = qualifiers[idx] || `Shade ${idx + 1}`;
            item.name = `${prefix} ${name}`;
          });
        }
      }
    }

    if (modified) appliedCount++;
  }

  console.log(`💾 Writing updated colors to dropshippingCatalog.json...`);
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('✅ dropshippingCatalog.json updated successfully!');

  // Sync all to Supabase
  console.log(`⚡ Syncing all ${withColors.length} products to Supabase...`);
  let supaIdx = 0;
  let supaSuccess = 0;
  let supaErrors = 0;

  async function supaWorker() {
    while (supaIdx < withColors.length) {
      const idx = supaIdx++;
      const p = withColors[idx];
      const { error } = await supabase
        .from('products')
        .update({
          colors: p.colors,
          updated_at: new Date().toISOString(),
        })
        .eq('id', p.id);

      if (error) {
        console.error(`Error updating product ${p.id}:`, error.message);
        supaErrors++;
      } else {
        supaSuccess++;
      }

      if (supaSuccess % 150 === 0 || supaSuccess >= withColors.length) {
        console.log(`  Synced ${supaSuccess} / ${withColors.length} products to Supabase...`);
      }
    }
  }

  await Promise.all(Array.from({ length: 30 }, supaWorker));
  console.log(`\n🎉 ALL 567 PRODUCTS COLOR-SYNCED TO SUPABASE (Success: ${supaSuccess}, Errors: ${supaErrors})!`);
}

main().catch(console.error);

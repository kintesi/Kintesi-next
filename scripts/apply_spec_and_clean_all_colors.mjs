import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMDIwNiwiZXhwIjoyMTA0NDk2MjA2fQ.7M3tSiIGGj2E0aG1JFm0bvHgWQ8024J5Pvuz2P58k8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const COLOR_HEX_MAP = {
  black: '#111827',
  white: '#FFFFFF',
  'off-white': '#F8FAFC',
  'off white': '#F8FAFC',
  cream: '#FDFBF7',
  beige: '#F5F5DC',
  biscuit: '#EAD8C3',
  ash: '#94A3B8',
  grey: '#6B7280',
  gray: '#6B7280',
  charcoal: '#374151',
  navy: '#1E3A8A',
  'navy blue': '#1E3A8A',
  'royal blue': '#1D4ED8',
  blue: '#2563EB',
  'sky blue': '#38BDF8',
  'deep blue': '#0F172A',
  maroon: '#831843',
  red: '#DC2626',
  rose: '#F43F5E',
  pink: '#EC4899',
  'baby pink': '#FBCFE8',
  orange: '#EA580C',
  peach: '#FDBA74',
  green: '#16A34A',
  olive: '#556B2F',
  'olive green': '#556B2F',
  'army green': '#4B5320',
  mint: '#6EE7B7',
  yellow: '#EAB308',
  gold: '#D97706',
  golden: '#D97706',
  silver: '#CBD5E1',
  brown: '#78350F',
  chocolate: '#451A03',
  coffee: '#451A03',
  purple: '#9333EA',
  lavender: '#C084FC',
  magenta: '#D946EF',
  katali: '#C2410C',
  khaki: '#C3B091',
  camo: '#5E6D4E',
  paste: '#A7F3D0',
  petrol: '#0E7490',
  multicolor: '#6366F1',
};

function getHexForColorName(name) {
  if (!name) return '#1E293B';
  const clean = name.replace(/\(Design \d+\)/i, '').trim().toLowerCase();
  if (COLOR_HEX_MAP[clean]) return COLOR_HEX_MAP[clean];
  for (const [k, v] of Object.entries(COLOR_HEX_MAP)) {
    if (clean.includes(k)) return v;
  }
  return '#1E293B';
}

const PRESERVED_PRODUCT_IDS = new Set([
  '00000000-0000-4000-8000-000000012998', // Front Button Maternity Bra
]);

const PRESERVED_SKUS = new Set([
  'DS-13299', // Car Wheel Rim Watch
  'DS-7978',  // Butter Fly Lock OLEVS Watch
]);

async function main() {
  const jsonPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  const catalog = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  let updatedProductsCount = 0;
  const productsToUpdate = [];

  for (const p of catalog) {
    // Check if preserved
    const isPreserved =
      PRESERVED_PRODUCT_IDS.has(p.id) ||
      (p.sku && PRESERVED_SKUS.has(p.sku)) ||
      (Array.isArray(p.colors) && p.colors.some((c) => PRESERVED_SKUS.has(c.sku)));

    if (isPreserved) {
      console.log(`🛡️ Preserving manually verified product: "${p.title}" (${p.id})`);
      continue;
    }

    const specCv = p.specifications?.color_variants;
    if (!specCv || typeof specCv !== 'object' || Object.keys(specCv).length === 0) {
      continue;
    }

    if (!Array.isArray(p.colors) || p.colors.length === 0) {
      continue;
    }

    let changed = false;
    const newColors = p.colors.map((c) => {
      let matchedName = null;
      for (const [specName, specData] of Object.entries(specCv)) {
        if (specData?.sku && c.sku && specData.sku.trim() === c.sku.trim()) {
          matchedName = specName.trim();
          break;
        }
      }

      if (!matchedName) {
        for (const [specName, specData] of Object.entries(specCv)) {
          if (
            specData?.dropshipping_url &&
            c.dropshipping_url &&
            specData.dropshipping_url.trim() === c.dropshipping_url.trim()
          ) {
            matchedName = specName.trim();
            break;
          }
        }
      }

      // Explicit override for Brazil cap
      if (c.sku === 'DS-9080') matchedName = 'Black';
      if (c.sku === 'DS-12871') matchedName = 'White';

      if (matchedName) {
        const authenticHex = getHexForColorName(matchedName);
        if (c.name !== matchedName || c.hex !== authenticHex) {
          changed = true;
          return {
            ...c,
            name: matchedName,
            hex: authenticHex,
          };
        }
      }
      return c;
    });

    if (changed) {
      p.colors = newColors;
      updatedProductsCount++;
      productsToUpdate.push(p);
    }
  }

  console.log(`\n✅ Finished mapping! Total updated products: ${updatedProductsCount}`);

  // Write back to catalog JSON
  fs.writeFileSync(jsonPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`💾 Saved updated catalog to ${jsonPath}`);

  // Check customized-head-cap
  const cap = catalog.find((p) => p.slug === 'customized-head-cap');
  if (cap) {
    console.log('\n🧢 Brazil Cap Verification:');
    console.log(
      JSON.stringify(
        cap.colors.map((c) => ({ name: c.name, hex: c.hex, sku: c.sku })),
        null,
        2
      )
    );
  }

  // Update Supabase in parallel
  console.log(`\n⚡ Syncing ${productsToUpdate.length} updated products to Supabase...`);
  const CONCURRENCY = 25;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < productsToUpdate.length; i += CONCURRENCY) {
    const chunk = productsToUpdate.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (p) => {
        const { error } = await supabase
          .from('products')
          .update({
            colors: p.colors,
            updated_at: new Date().toISOString(),
          })
          .eq('id', p.id);

        if (error) {
          console.error(`Error updating product ${p.id}:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      })
    );
    if ((i + CONCURRENCY) % 100 === 0 || i + CONCURRENCY >= productsToUpdate.length) {
      console.log(
        `  Synced ${Math.min(i + CONCURRENCY, productsToUpdate.length)} / ${productsToUpdate.length}...`
      );
    }
  }

  console.log(`\n🎉 Done! Supabase updated successfully: ${successCount}, errors: ${errorCount}`);
}

main().catch(console.error);

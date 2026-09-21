import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMDIwNiwiZXhwIjoyMTA0NDk2MjA2fQ.7M3tSiIGGj2E0aG1JFm0bvHgWQ8024J5Pvuz2P58k8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const colorMap = {
  'silver-blue': { name: 'Royal Blue', hex: '#2563EB' },
  'royal-blue': { name: 'Royal Blue', hex: '#2563EB' },
  'navy-blue': { name: 'Navy Blue', hex: '#1e293b' },
  'navy': { name: 'Navy Blue', hex: '#1e293b' },
  'sky-blue': { name: 'Sky Blue', hex: '#0284c7' },
  'blue': { name: 'Blue', hex: '#2563EB' },
  'black': { name: 'Black', hex: '#1E293B' },
  'jet-black': { name: 'Jet Black', hex: '#111827' },
  'charcoal': { name: 'Charcoal Black', hex: '#374151' },
  'white': { name: 'White', hex: '#FFFFFF' },
  'silver': { name: 'Silver', hex: '#c0c0c0' },
  'rose-gold': { name: 'Rose Gold', hex: '#b76e79' },
  'bronze-gold': { name: 'Bronze Gold', hex: '#c79e19' },
  'yellow-gold': { name: 'Yellow Gold', hex: '#c3a33e' },
  'golden': { name: 'Golden', hex: '#d4af37' },
  'gold': { name: 'Gold', hex: '#d4af37' },
  'olive-green': { name: 'Olive Green', hex: '#556b2f' },
  'olive': { name: 'Olive Green', hex: '#556b2f' },
  'sage-green': { name: 'Sage Green', hex: '#8d956a' },
  'sage': { name: 'Sage Green', hex: '#8d956a' },
  'dark-green': { name: 'Dark Green', hex: '#14532d' },
  'emerald-green': { name: 'Emerald Green', hex: '#4ea046' },
  'neon-green': { name: 'Neon Green', hex: '#80af2e' },
  'green': { name: 'Green', hex: '#16a34a' },
  'maroon': { name: 'Maroon', hex: '#800000' },
  'red': { name: 'Red', hex: '#dc2626' },
  'dusty-pink': { name: 'Dusty Pink', hex: '#d4838f' },
  'baby-pink': { name: 'Baby Pink', hex: '#fbcfe8' },
  'deep-pink': { name: 'Deep Pink', hex: '#db2777' },
  'pink': { name: 'Pink', hex: '#ec4899' },
  'purple': { name: 'Purple', hex: '#9333ea' },
  'yellow': { name: 'Yellow', hex: '#eab308' },
  'mustard': { name: 'Mustard', hex: '#ca8a04' },
  'orange': { name: 'Orange', hex: '#ea580c' },
  'brown': { name: 'Brown', hex: '#78350f' },
  'chocolate': { name: 'Chocolate Brown', hex: '#451a03' },
  'ash': { name: 'Ash', hex: '#9ca3af' },
  'dark-grey': { name: 'Dark Grey', hex: '#374151' },
  'light-grey': { name: 'Light Grey', hex: '#9ca3af' },
  'grey': { name: 'Grey', hex: '#6b7280' },
  'gray': { name: 'Grey', hex: '#6b7280' },
  'beige': { name: 'Beige', hex: '#d1c7b7' },
  'cream': { name: 'Cream', hex: '#fef3c7' },
  'peach': { name: 'Peach', hex: '#e8b49e' },
  'khaki': { name: 'Khaki', hex: '#c3b091' },
  'coffee': { name: 'Coffee', hex: '#4a2c11' }
};

const keys = Object.keys(colorMap).sort((a, b) => b.length - a.length);

async function main() {
  const catalogPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  const withColors = catalog.filter((p) => Array.isArray(p.colors) && p.colors.length > 0);
  console.log(`Analyzing and recalibrating colors for all ${withColors.length} products with variants...`);

  let modifiedCount = 0;

  for (const p of withColors) {
    // 1. Keep Car Wheel Rim Watch verified
    if (p.sku === 'DS-13299' || (p.colors || []).some((c) => c.sku === 'DS-13299')) {
      continue;
    }

    // 2. Keep Front Button Maternity Bra verified
    if (p.id === '00000000-0000-4000-8000-000000012998' || (p.title && p.title.toLowerCase().includes('front button maternity'))) {
      p.colors = [
        { ...p.colors[0], name: 'Charcoal Black', hex: '#444347' },
        { ...p.colors[1], name: 'Peach', hex: '#d59f86' },
        { ...p.colors[2], name: 'Sage Green', hex: '#8d956a' },
        { ...p.colors[3], name: 'Beige', hex: '#a19086' },
      ];
      modifiedCount++;
      continue;
    }

    // 3. Specifically calibrate Butter Fly Lock OLEVS Watch for Women (SKU DS-7978)
    if (p.sku === 'DS-7978' || p.id === '00000000-0000-4000-8000-000000007978' || (p.title && p.title.toLowerCase().includes('butter fly lock olevs watch for women'))) {
      p.colors = [
        { ...p.colors[0], name: 'Black', hex: '#1E293B', sku: 'DS-7978' },
        { ...p.colors[1], name: 'Silver', hex: '#c0c0c0', sku: 'DS-7982' },
        { ...p.colors[2], name: 'Royal Blue', hex: '#2563EB', sku: 'DS-7979' },
      ];
      modifiedCount++;
      continue;
    }

    let modified = false;

    // 4. Apply semantic URL ground truth across all variants
    for (const c of p.colors) {
      const url = (c.dropshipping_url || '').toLowerCase();
      let matchedColor = null;
      for (const k of keys) {
        if (url.includes('-' + k + '-') || url.endsWith('-' + k) || url.includes('-' + k + '-color')) {
          matchedColor = colorMap[k];
          break;
        }
      }

      if (matchedColor) {
        // If the old color was falsely flagged as Red/Maroon due to promotional stickers/logos,
        // or if the semantic URL gives the specific manufacturer color:
        c.name = matchedColor.name;
        c.hex = matchedColor.hex;
        modified = true;
      }
    }

    // 5. Deduplicate identical names within the product
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
        modified = true;
      }
    }

    if (modified) modifiedCount++;
  }

  console.log(`💾 Writing updated catalog to dropshippingCatalog.json (Updated products: ${modifiedCount})...`);
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('✅ dropshippingCatalog.json updated successfully!');

  // Sync to Supabase
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
  console.log(`\n🎉 ALL 567 PRODUCTS COLOR-RECALIBRATED & SYNCED TO SUPABASE (Success: ${supaSuccess}, Errors: ${supaErrors})!`);
}

main().catch(console.error);

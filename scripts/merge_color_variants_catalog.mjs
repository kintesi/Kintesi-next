import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMDIwNiwiZXhwIjoyMTA0NDk2MjA2fQ.7M3tSiIGGj2E0aG1JFm0bvHgWQ8024J5Pvuz2P58k8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const COLOR_MAP = {
  black: '#000000',
  white: '#FFFFFF',
  red: '#EF4444',
  blue: '#3B82F6',
  'navy blue': '#1E3A8A',
  navy: '#1E3A8A',
  'royal blue': '#1D4ED8',
  'sky blue': '#38BDF8',
  green: '#10B981',
  'olive green': '#556B2F',
  olive: '#556B2F',
  teal: '#14B8A6',
  maroon: '#800000',
  wine: '#722F37',
  pink: '#EC4899',
  'baby pink': '#FBCFE8',
  purple: '#8B5CF6',
  violet: '#7C3AED',
  yellow: '#EAB308',
  mustard: '#D97706',
  orange: '#F97316',
  brown: '#78350F',
  chocolate: '#451A03',
  coffee: '#6F4E37',
  grey: '#6B7280',
  gray: '#6B7280',
  silver: '#9CA3AF',
  golden: '#F59E0B',
  gold: '#F59E0B',
  beige: '#F5F5DC',
  cream: '#FFFDD0',
  'off white': '#FAF9F6',
  'off-white': '#FAF9F6',
  peach: '#FFDAB9',
  coral: '#FF7F50',
  lavender: '#E6E6FA',
  charcoal: '#374151',
  rust: '#B7410E',
  mint: '#98FF98',
  magenta: '#D946EF',
  turquoise: '#06B6D4',
  khaki: '#C3B091',
};

const BENGALI_COLOR_MAP = {
  black: 'কালো',
  white: 'সাদা',
  red: 'লাল',
  blue: 'নীল',
  navy: 'নেভি ব্লু',
  'navy blue': 'নেভি ব্লু',
  'sky blue': 'আকাশি',
  green: 'সবুজ',
  olive: 'অলিভ',
  teal: 'টিল',
  maroon: 'মেরুন',
  wine: 'ওয়াইন',
  pink: 'গোলাপী',
  purple: 'বেগুনি',
  yellow: 'হলুদ',
  mustard: 'সরিষা হলুদ',
  orange: 'কমলা',
  brown: 'বাদামি',
  grey: 'ধূসর',
  gray: 'ধূসর',
  golden: 'গোল্ডেন',
  gold: 'গোল্ডেন',
  silver: 'সিলভার',
};

function capitalize(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function extractColorAndBase(title) {
  const cleaned = title.trim();

  // Pattern 1: '... [Color] Color' or '... - [Color]' or '... ([Color])' at end
  for (const c of Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length)) {
    const p1 = new RegExp('\\s*[-–—:\\(\\[/]?\\s*' + c + '\\s*(?:color|colour)?\\s*[\\)\\]]?$', 'i');
    if (p1.test(cleaned)) {
      const base = cleaned.replace(p1, '').trim().replace(/[-–—:\(\[\/]+$/, '').trim();
      if (base.length > 5) {
        return { color: c, baseTitle: base };
      }
    }
  }

  // Pattern 2: '[Color] ...' at beginning
  for (const c of Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length)) {
    const p2 = new RegExp('^' + c + '\\s*[-–—:\\(\\[/]?\\s*', 'i');
    if (p2.test(cleaned)) {
      const base = cleaned.replace(p2, '').trim();
      if (base.length > 5) {
        return { color: c, baseTitle: base };
      }
    }
  }

  return { color: null, baseTitle: cleaned };
}

async function main() {
  console.log('🔄 Loading existing Dropshipping Catalog JSON...');
  const jsonPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Loaded ${rawData.length} products.`);

  // Step 1: Group products by category and base title
  const groups = new Map();

  for (const p of rawData) {
    const { color, baseTitle } = extractColorAndBase(p.title);
    const key = (p.category_id + ':::' + baseTitle.toLowerCase()).replace(/\s+/g, ' ');

    if (!groups.has(key)) {
      groups.set(key, {
        baseTitle,
        category_id: p.category_id,
        items: [],
      });
    }

    groups.get(key).items.push({ product: p, color });
  }

  console.log(`📊 Grouped into ${groups.size} unique master products (consolidating duplicate color items).`);

  // Step 2: Build consolidated master products
  const mergedProducts = [];

  for (const [key, group] of groups.entries()) {
    const firstItem = group.items[0].product;

    // Build consolidated colors array
    const colors = [];
    const colorVariantsSpec = {};
    const allImages = [...(firstItem.images || [])];
    const allTags = new Set(firstItem.tags || []);
    let maxStock = 0;

    for (let i = 0; i < group.items.length; i++) {
      const { product, color } = group.items[i];
      maxStock += (product.stock || 50);

      // Color name
      const colorName = color ? capitalize(color) : (group.items.length > 1 ? `Option ${i + 1}` : null);
      const colorHex = color ? COLOR_MAP[color] : '#1E293B';

      if (colorName) {
        const colorOption = {
          name: colorName,
          hex: colorHex,
          price: product.price,
          discount_price: product.discount_price,
          discount_percent: product.specifications?.discount_percent || 8,
          image: product.images[0] || '/logo.webp',
          images: product.images || [],
          stock: product.stock || 50,
          sku: product.sku,
          dropshipping_url: product.dropshipping_url, // Separate dropshipping link per color!
        };

        colors.push(colorOption);

        colorVariantsSpec[colorName] = {
          sku: product.sku,
          dropshipping_url: product.dropshipping_url,
          wholesale_cost: product.specifications?.wholesale_cost || 0,
          profit_margin: product.specifications?.profit_margin || 0,
        };

        // Add color tags in both English and Bengali
        allTags.add(colorName.toLowerCase());
        if (color && BENGALI_COLOR_MAP[color]) {
          allTags.add(BENGALI_COLOR_MAP[color]);
        }
      }

      // Add product images to master gallery
      if (Array.isArray(product.images)) {
        product.images.forEach((img) => {
          if (img && !allImages.includes(img)) {
            allImages.push(img);
          }
        });
      }

      // Merge tags
      if (Array.isArray(product.tags)) {
        product.tags.forEach((t) => allTags.add(t));
      }
    }

    // Master clean product
    const masterProduct = {
      ...firstItem,
      title: group.baseTitle,
      images: allImages.slice(0, 10), // Up to 10 high quality images
      colors: colors.length > 0 ? colors : (firstItem.colors || []),
      stock: Math.min(maxStock, 500),
      tags: Array.from(allTags).slice(0, 20),
      specifications: {
        ...(firstItem.specifications || {}),
        color_variants: colorVariantsSpec,
        has_color_variants: colors.length > 1,
      },
    };

    mergedProducts.push(masterProduct);
  }

  console.log(`✨ Successfully generated ${mergedProducts.length} deduplicated products with color variants!`);

  // Step 3: Save updated JSON cache
  fs.writeFileSync(jsonPath, JSON.stringify(mergedProducts, null, 2), 'utf-8');
  console.log(`💾 Saved updated catalog JSON to ${jsonPath} (${(fs.statSync(jsonPath).size / 1024 / 1024).toFixed(2)} MB)`);

  // Step 4: Sync to Supabase Database
  console.log('⚡ Synchronizing with Supabase Database...');

  // 4.1 First remove all existing DS products so there are no duplicates left in Supabase
  console.log('🗑️ Cleaning previous duplicate dropshipping products from Supabase...');
  const { error: delErr } = await supabase
    .from('products')
    .delete()
    .like('sku', 'DS-%');

  if (delErr) {
    console.warn('Delete notice:', delErr.message);
  } else {
    console.log('✅ Cleaned previous records successfully.');
  }

  // 4.2 Insert consolidated products in batches of 75
  const BATCH_SIZE = 75;
  const totalBatches = Math.ceil(mergedProducts.length / BATCH_SIZE);
  console.log(`🚀 Inserting ${mergedProducts.length} clean products in ${totalBatches} batches...`);

  let insertedCount = 0;
  for (let b = 0; b < totalBatches; b++) {
    const chunk = mergedProducts.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const { error: insertErr } = await supabase
      .from('products')
      .upsert(chunk, { onConflict: 'slug' });

    if (insertErr) {
      console.warn(`⚠️ Batch ${b + 1} error:`, insertErr.message);
      // single rescue
      for (const item of chunk) {
        const { error: sErr } = await supabase.from('products').upsert(item, { onConflict: 'slug' });
        if (!sErr) insertedCount++;
      }
    } else {
      insertedCount += chunk.length;
      if ((b + 1) % 5 === 0 || b === totalBatches - 1) {
        console.log(` Progress: ${insertedCount}/${mergedProducts.length} saved (${Math.round((insertedCount / mergedProducts.length) * 100)}%)`);
      }
    }
  }

  console.log('\n======================================================');
  console.log(`🎉 COLOR VARIANT CONSOLIDATION COMPLETE!`);
  console.log(`✅ Total consolidated products in store: ${insertedCount}`);
  console.log(`🎨 Every color variant now has its own specific Dropshipping BD link!`);
  console.log('======================================================');
}

main().catch((err) => {
  console.error('Fatal merge error:', err);
  process.exit(1);
});

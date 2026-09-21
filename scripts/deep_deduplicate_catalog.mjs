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
  black: { name: 'Black', hex: '#000000', bn: 'কালো' },
  white: { name: 'White', hex: '#FFFFFF', bn: 'সাদা' },
  red: { name: 'Red', hex: '#EF4444', bn: 'লাল' },
  blue: { name: 'Blue', hex: '#3B82F6', bn: 'নীল' },
  'navy blue': { name: 'Navy Blue', hex: '#1E3A8A', bn: 'নেভি ব্লু' },
  navy: { name: 'Navy Blue', hex: '#1E3A8A', bn: 'নেভি ব্লু' },
  nevi: { name: 'Navy Blue', hex: '#1E3A8A', bn: 'নেভি ব্লু' },
  'royal blue': { name: 'Royal Blue', hex: '#1D4ED8', bn: 'রয়্যাল ব্লু' },
  'sky blue': { name: 'Sky Blue', hex: '#38BDF8', bn: 'আকাশি' },
  sky: { name: 'Sky Blue', hex: '#38BDF8', bn: 'আকাশি' },
  green: { name: 'Green', hex: '#10B981', bn: 'সবুজ' },
  'olive green': { name: 'Olive Green', hex: '#556B2F', bn: 'অলিভ গ্রিন' },
  olive: { name: 'Olive', hex: '#556B2F', bn: 'অলিভ' },
  teal: { name: 'Teal', hex: '#14B8A6', bn: 'টিল' },
  maroon: { name: 'Maroon', hex: '#800000', bn: 'মেরুন' },
  marun: { name: 'Maroon', hex: '#800000', bn: 'মেরুন' },
  wine: { name: 'Wine', hex: '#722F37', bn: 'ওয়াইন' },
  pink: { name: 'Pink', hex: '#EC4899', bn: 'গোলাপী' },
  'baby pink': { name: 'Baby Pink', hex: '#FBCFE8', bn: 'বেবি পিংক' },
  purple: { name: 'Purple', hex: '#8B5CF6', bn: 'বেগুনি' },
  violet: { name: 'Violet', hex: '#7C3AED', bn: 'ভায়োলেট' },
  yellow: { name: 'Yellow', hex: '#EAB308', bn: 'হলুদ' },
  mustard: { name: 'Mustard', hex: '#D97706', bn: 'সরিষা হলুদ' },
  orange: { name: 'Orange', hex: '#F97316', bn: 'কমলা' },
  brown: { name: 'Brown', hex: '#78350F', bn: 'বাদামি' },
  chocolate: { name: 'Chocolate', hex: '#451A03', bn: 'চকলেট' },
  coffee: { name: 'Coffee', hex: '#6F4E37', bn: 'কফি' },
  grey: { name: 'Grey', hex: '#6B7280', bn: 'ধূসর' },
  gray: { name: 'Gray', hex: '#6B7280', bn: 'ধূসর' },
  silver: { name: 'Silver', hex: '#9CA3AF', bn: 'সিলভার' },
  golden: { name: 'Golden', hex: '#F59E0B', bn: 'গোল্ডেন' },
  gold: { name: 'Gold', hex: '#F59E0B', bn: 'গোল্ডেন' },
  beige: { name: 'Beige', hex: '#F5F5DC', bn: 'বেইজ' },
  cream: { name: 'Cream', hex: '#FFFDD0', bn: 'ক্রিম' },
  'off white': { name: 'Off White', hex: '#FAF9F6', bn: 'অফ হোয়াইট' },
  'off-white': { name: 'Off White', hex: '#FAF9F6', bn: 'অফ হোয়াইট' },
  peach: { name: 'Peach', hex: '#FFDAB9', bn: 'পিচ' },
  coral: { name: 'Coral', hex: '#FF7F50', bn: 'কোরাল' },
  lavender: { name: 'Lavender', hex: '#E6E6FA', bn: 'ল্যাভেন্ডার' },
  charcoal: { name: 'Charcoal', hex: '#374151', bn: 'চারকোল' },
  rust: { name: 'Rust', hex: '#B7410E', bn: 'মরিচা লাল' },
  mint: { name: 'Mint', hex: '#98FF98', bn: 'মিন্ট' },
  magenta: { name: 'Magenta', hex: '#D946EF', bn: 'ম্যাজেন্টা' },
  turquoise: { name: 'Turquoise', hex: '#06B6D4', bn: 'টারকোয়েজ' },
  khaki: { name: 'Khaki', hex: '#C3B091', bn: 'খাকি' },
  ash: { name: 'Ash', hex: '#9CA3AF', bn: 'অ্যাশ' },
  paste: { name: 'Paste', hex: '#A7F3D0', bn: 'পেস্ট' },
  petrol: { name: 'Petrol', hex: '#0E7490', bn: 'পেট্রোল' },
  pettrol: { name: 'Petrol', hex: '#0E7490', bn: 'পেট্রোল' },
  katali: { name: 'Katali', hex: '#B45309', bn: 'কাঁঠালি' },
  khatali: { name: 'Katali', hex: '#B45309', bn: 'কাঁঠালি' },
  'deep sepia': { name: 'Deep Sepia', hex: '#704214', bn: 'সেপিয়া' },
  sepia: { name: 'Sepia', hex: '#704214', bn: 'সেপিয়া' },
  biscuit: { name: 'Biscuit', hex: '#E3C193', bn: 'বিস্কুট কালার' },
  army: { name: 'Army Green', hex: '#4B5320', bn: 'আর্মি গ্রিন' },
  'army green': { name: 'Army Green', hex: '#4B5320', bn: 'আর্মি গ্রিন' },
  camo: { name: 'Camo', hex: '#78866B', bn: 'ক্যামো' },
  'camo cargo': { name: 'Camo', hex: '#78866B', bn: 'ক্যামো' },
  cyan: { name: 'Cyan', hex: '#06B6D4', bn: 'সায়ান' },
  rose: { name: 'Rose', hex: '#FB7185', bn: 'রোজ' },
  'bottle green': { name: 'Bottle Green', hex: '#006A4E', bn: 'বটল গ্রিন' },
  'sea green': { name: 'Sea Green', hex: '#2E8B57', bn: 'সি গ্রিন' },
  'deep blue': { name: 'Deep Blue', hex: '#00008B', bn: 'ডিপ ব্লু' },
  'light blue': { name: 'Light Blue', hex: '#ADD8E6', bn: 'লাইট ব্লু' },
  'dark blue': { name: 'Dark Blue', hex: '#00008B', bn: 'ডার্ক ব্লু' },
  'dark green': { name: 'Dark Green', hex: '#006400', bn: 'ডার্ক গ্রিন' },
  multicolor: { name: 'Multicolor', hex: '#6366F1', bn: 'মাল্টিকালার' },
  'multi color': { name: 'Multicolor', hex: '#6366F1', bn: 'মাল্টিকালার' },
  multi: { name: 'Multicolor', hex: '#6366F1', bn: 'মাল্টিকালার' },
  // Bengali words
  'কালো': { name: 'Black', hex: '#000000', bn: 'কালো' },
  'সাদা': { name: 'White', hex: '#FFFFFF', bn: 'সাদা' },
  'লাল': { name: 'Red', hex: '#EF4444', bn: 'লাল' },
  'নীল': { name: 'Blue', hex: '#3B82F6', bn: 'নীল' },
  'সবুজ': { name: 'Green', hex: '#10B981', bn: 'সবুজ' },
  'হলুদ': { name: 'Yellow', hex: '#EAB308', bn: 'হলুদ' },
  'গোলাপী': { name: 'Pink', hex: '#EC4899', bn: 'গোলাপী' },
  'গোলাপি': { name: 'Pink', hex: '#EC4899', bn: 'গোলাপি' },
  'মেরুন': { name: 'Maroon', hex: '#800000', bn: 'মেরুন' },
  'বেগুনি': { name: 'Purple', hex: '#8B5CF6', bn: 'বেগুনি' },
  'আকাশি': { name: 'Sky Blue', hex: '#38BDF8', bn: 'আকাশি' },
  'আকাশী': { name: 'Sky Blue', hex: '#38BDF8', bn: 'আকাশী' },
  'অলিভ': { name: 'Olive', hex: '#556B2F', bn: 'অলিভ' },
  'কমলা': { name: 'Orange', hex: '#F97316', bn: 'কমলা' },
  'বাদামি': { name: 'Brown', hex: '#78350F', bn: 'বাদামি' },
  'ধূসর': { name: 'Grey', hex: '#6B7280', bn: 'ধূসর' },
  'ছাই': { name: 'Ash', hex: '#9CA3AF', bn: 'ছাই' },
  'পেস্ট': { name: 'Paste', hex: '#A7F3D0', bn: 'পেস্ট' },
  'গোল্ডেন': { name: 'Golden', hex: '#F59E0B', bn: 'গোল্ডেন' },
  'সিলভার': { name: 'Silver', hex: '#9CA3AF', bn: 'সিলভার' },
  'টিল': { name: 'Teal', hex: '#14B8A6', bn: 'টিল' },
  'নেভি ব্লু': { name: 'Navy Blue', hex: '#1E3A8A', bn: 'নেভি ব্লু' },
  'কাঁঠালি': { name: 'Katali', hex: '#B45309', bn: 'কাঁঠালি' },
};

function normalizeUnicodeText(str) {
  if (!str) return '';
  return str
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

function cleanTitlePunctuation(t) {
  return t
    .replace(/^[-–—:;,+.\s\/|]+/, '')
    .replace(/[-–—:;,+.\s\/|]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractColorAndCleanBase(title) {
  let cleaned = normalizeUnicodeText(title).trim();
  let detectedColorKey = null;

  const colorKeys = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length);

  // Pattern 0: Unclosed parenthesis at the end e.g. "( Ash", "(Nevi", "(Black", "(coffee", "(Light", "(Full"
  const unclosedMatch = cleaned.match(/\(\s*([^)]*)$/);
  if (unclosedMatch) {
    const candidate = unclosedMatch[1].trim().toLowerCase();
    for (const c of colorKeys) {
      if (candidate.startsWith(c) || candidate.includes(c)) {
        detectedColorKey = c;
        break;
      }
    }
    // Remove the unclosed parenthesis regardless
    cleaned = cleaned.replace(/\(\s*([^)]*)$/, '').trim();
  }

  // Pattern A: Parentheses or brackets with color: (Ash Color), (paste), (Sky), (petrol), (deep Sepia), (Black Dial)
  if (!detectedColorKey) {
    for (const c of colorKeys) {
      const isBengali = /[\u0980-\u09FF]/.test(c);
      const regStr = isBengali
        ? `\\(\\s*${c}(?:\\s*(?:কালার|রং))?\\s*\\)`
        : `\\(\\s*\\b${c}\\b(?:\\s*(?:color|colour|dial|shape))?\\s*\\)`;
      const pParen = new RegExp(regStr, 'i');
      if (pParen.test(cleaned)) {
        detectedColorKey = c;
        cleaned = cleaned.replace(pParen, ' ').trim();
        break;
      }
    }
  }

  // Pattern B: At the end of title: " - Teal Color", " Teal", " Ash"
  if (!detectedColorKey) {
    for (const c of colorKeys) {
      const isBengali = /[\u0980-\u09FF]/.test(c);
      const regStr = isBengali
        ? `[-–—:\\(\\[/|]?\\s*${c}\\s*(?:কালার|রং)?\\s*[\\)\\]]?$`
        : `[-–—:\\(\\[/|]?\\s*\\b${c}\\b\\s*(?:color|colour)?\\s*[\\)\\]]?$`;
      const pEnd = new RegExp(regStr, 'i');
      if (pEnd.test(cleaned)) {
        detectedColorKey = c;
        cleaned = cleaned.replace(pEnd, '').trim();
        break;
      }
    }
  }

  // Pattern C: At start of title: "& White Halfsilk...", "Teal ...", "Premium White Jersey..."
  if (!detectedColorKey) {
    for (const c of colorKeys) {
      const isBengali = /[\u0980-\u09FF]/.test(c);
      const regStr = isBengali
        ? `^[&\\s-–—:]*${c}\\s*[-–—:]?\\s*`
        : `^[&\\s-–—:]*\\b${c}\\b\\s*[-–—:]?\\s*`;
      const pStart = new RegExp(regStr, 'i');
      if (pStart.test(cleaned)) {
        detectedColorKey = c;
        cleaned = cleaned.replace(pStart, '').trim();
        break;
      }
    }
  }

  // Pattern D: Inside middle of title: e.g. "Premium White Jersey T-Shirt"
  if (!detectedColorKey) {
    for (const c of colorKeys) {
      if (['in', 'to', 'at', 'an', 'as', 'by', 'for', 'men', 'man', 'bag', 'set', 'edition', 'only', 'with'].includes(c.toLowerCase())) continue;
      const isBengali = /[\u0980-\u09FF]/.test(c);
      const regStr = isBengali
        ? `\\s+${c}(?:\\s+(?:কালার|রং))?\\s+`
        : `\\s+\\b${c}\\b(?:\\s+(?:color|colour))?\\s+`;
      const pMid = new RegExp(regStr, 'i');
      if (pMid.test(cleaned)) {
        const candidate = cleaned.replace(pMid, ' ').replace(/\s+/g, ' ').trim();
        if (candidate.length > 10) {
          detectedColorKey = c;
          cleaned = candidate;
          break;
        }
      }
    }
  }

  cleaned = cleanTitlePunctuation(cleaned);
  return {
    colorInfo: detectedColorKey ? COLOR_MAP[detectedColorKey] : null,
    baseTitle: cleaned,
  };
}

function chooseBestCategory(categories) {
  const priority = ['womens-fashion', 'mens-fashion', 'gadgets-electronics', 'computer-gaming', 'beauty-health', 'home-living'];
  for (const cat of priority) {
    if (categories.includes(cat)) return cat;
  }
  return categories[0] || 'womens-fashion';
}

async function main() {
  console.log('🔄 Loading dropshipping catalog...');
  const jsonPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  const rawCatalog = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${rawCatalog.length} items from JSON.`);

  // Step 1: Group by Base Title (across categories, handling miscategorization)
  const groups = new Map();

  for (const p of rawCatalog) {
    const { colorInfo, baseTitle } = extractColorAndCleanBase(p.title);
    
    // Normalized grouping key
    const normKey = baseTitle.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/gi, ' ').replace(/\s+/g, ' ').trim();

    if (!groups.has(normKey)) {
      groups.set(normKey, {
        baseTitle,
        categories: [p.category_id],
        items: [],
      });
    } else {
      if (!groups.get(normKey).categories.includes(p.category_id)) {
        groups.get(normKey).categories.push(p.category_id);
      }
    }
    groups.get(normKey).items.push({ product: p, colorInfo });
  }

  console.log(`📊 Clustered into ${groups.size} unique master products.`);

  // Step 2: Build master products
  const finalMasterProducts = [];
  const usedSlugs = new Set();

  for (const [normKey, group] of groups.entries()) {
    const firstProduct = group.items[0].product;
    const bestCat = chooseBestCategory(group.categories);

    // Collect all unique color variants
    const colorsMap = new Map();
    const colorVariantsSpec = {};
    const allImages = [];
    const allTags = new Set(firstProduct.tags || []);
    let maxStock = 0;

    // Collect existing colors on the first item if already merged
    if (Array.isArray(firstProduct.colors)) {
      for (const c of firstProduct.colors) {
        if (c && c.name) {
          colorsMap.set(c.name.toLowerCase(), c);
        }
      }
    }

    for (let idx = 0; idx < group.items.length; idx++) {
      const { product, colorInfo } = group.items[idx];
      maxStock += (product.stock || 50);

      // Collect product's existing colors if any
      if (Array.isArray(product.colors)) {
        for (const c of product.colors) {
          if (c && c.name && !colorsMap.has(c.name.toLowerCase())) {
            colorsMap.set(c.name.toLowerCase(), c);
          }
        }
      }

      // Add variant color from title
      if (colorInfo) {
        const cKey = colorInfo.name.toLowerCase();
        if (!colorsMap.has(cKey)) {
          colorsMap.set(cKey, {
            name: colorInfo.name,
            hex: colorInfo.hex,
            price: product.price,
            discount_price: product.discount_price,
            discount_percent: product.specifications?.discount_percent || 8,
            image: product.images?.[0] || '/logo.webp',
            images: product.images || [],
            stock: product.stock || 50,
            sku: product.sku,
            dropshipping_url: product.dropshipping_url,
          });
        }
        allTags.add(colorInfo.name.toLowerCase());
        if (colorInfo.bn) allTags.add(colorInfo.bn);
      }

      // Gather images
      if (Array.isArray(product.images)) {
        for (const img of product.images) {
          if (img && img !== '/logo.webp' && !allImages.includes(img)) {
            allImages.push(img);
          }
        }
      }

      // Gather tags
      if (Array.isArray(product.tags)) {
        for (const t of product.tags) allTags.add(t);
      }
    }

    if (allImages.length === 0) {
      allImages.push(firstProduct.images?.[0] || '/logo.webp');
    }

    const consolidatedColors = Array.from(colorsMap.values());
    for (const c of consolidatedColors) {
      colorVariantsSpec[c.name] = {
        sku: c.sku || firstProduct.sku,
        dropshipping_url: c.dropshipping_url || firstProduct.dropshipping_url,
        wholesale_cost: firstProduct.specifications?.wholesale_cost || 0,
        profit_margin: firstProduct.specifications?.profit_margin || 0,
      };
    }

    // Unique clean slug
    let baseSlug = (firstProduct.slug || 'product')
      .replace(/-[0-9]+(-[0-9]+)?$/, '') // strip old duplicate counters
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    let finalSlug = baseSlug;
    let sIdx = 1;
    while (usedSlugs.has(finalSlug)) {
      finalSlug = `${baseSlug}-${sIdx++}`;
    }
    usedSlugs.add(finalSlug);

    const masterProduct = {
      ...firstProduct,
      title: group.baseTitle,
      slug: finalSlug,
      category_id: bestCat,
      images: allImages.slice(0, 10),
      colors: consolidatedColors,
      stock: Math.min(maxStock, 500),
      rating: 0,
      review_count: 0,
      tags: Array.from(allTags).slice(0, 20),
      specifications: {
        ...(firstProduct.specifications || {}),
        color_variants: colorVariantsSpec,
        has_color_variants: consolidatedColors.length > 1,
      },
    };

    finalMasterProducts.push(masterProduct);
  }

  console.log(`✨ Generated ${finalMasterProducts.length} final master products (100% duplicate free)!`);

  // Step 3: Write JSON
  fs.writeFileSync(jsonPath, JSON.stringify(finalMasterProducts, null, 2), 'utf8');
  console.log(`💾 Saved updated dropshippingCatalog.json (${(fs.statSync(jsonPath).size / 1024 / 1024).toFixed(2)} MB).`);

  // Step 4: Sync with Supabase Database
  console.log('⚡ Synchronizing with Supabase Database...');

  console.log('🗑️ Deleting all previous dropshipping products from Supabase...');
  const { error: delErr } = await supabase
    .from('products')
    .delete()
    .like('sku', 'DS-%');

  if (delErr) {
    console.error('Delete error:', delErr);
  } else {
    console.log('✅ Cleaned previous records from Supabase.');
  }

  // Insert consolidated products in batches
  const BATCH_SIZE = 75;
  const totalBatches = Math.ceil(finalMasterProducts.length / BATCH_SIZE);
  console.log(`🚀 Inserting ${finalMasterProducts.length} clean products into Supabase in ${totalBatches} batches...`);

  let inserted = 0;
  for (let b = 0; b < totalBatches; b++) {
    const chunk = finalMasterProducts.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const { error: insErr } = await supabase.from('products').upsert(chunk, { onConflict: 'slug' });
    if (insErr) {
      console.warn(`⚠️ Batch ${b + 1} error:`, insErr.message);
      for (const item of chunk) {
        const { error: sErr } = await supabase.from('products').upsert(item, { onConflict: 'slug' });
        if (!sErr) inserted++;
      }
    } else {
      inserted += chunk.length;
      if ((b + 1) % 5 === 0 || b === totalBatches - 1) {
        console.log(`Progress: ${inserted}/${finalMasterProducts.length} saved (${Math.round((inserted / finalMasterProducts.length) * 100)}%)`);
      }
    }
  }

  console.log(`🎉 Supabase database sync completed! Saved ${inserted} products.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

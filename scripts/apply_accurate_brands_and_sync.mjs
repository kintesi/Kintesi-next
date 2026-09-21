import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMDIwNiwiZXhwIjoyMTA0NDk2MjA2fQ.7M3tSiIGGj2E0aG1JFm0bvHgWQ8024J5Pvuz2P58k8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Authentic Brands recognized in Bangladesh E-Commerce / Dropshipping BD
// Multi-word and longer strings FIRST to prevent partial matching
const authenticBrands = [
  // Multi-word brands
  'Pagani Design', 'Arctic Hunter', 'Anaya Hoor', 'Ali Leather', 'Mark Ryden',
  'Mini Focus', 'Hannah Martin', 'Charles Delon', 'Under Armour', 'New Balance',
  'Louis Vuitton', 'Tommy Hilfiger', 'Calvin Klein', 'Royal Kludge', 'Cooler Master',
  'SteelSeries', 'Golden Field', 'VEN-DENS', 'TP-Link', 'Western Digital', 'Bin Saeed',
  'Gul Ahmed', 'North Edge', 'Fire-Boltt', 'SoundPEATS', 'Zero Lifestyle',

  // Single-word brands
  'OLEVS', 'Poedagar', 'Curren', 'Naviforce', 'Casio', 'SKMEI', 'Binbond', 'LIGE', 'Benyar',
  'Megir', 'Chenxi', 'Sanda', 'WWOOR', 'SMAEL', 'Kademan', 'Sinobi', 'Crnaira', 'Nibosi',
  'Bidigo', 'Fastrack', 'Fossil', 'Titan', 'Citizen', 'Seiko', 'Tissot', 'Rolex', 'Rado',
  'Omega', 'Hublot', 'Zeblaze', 'Colmi', 'Amazfit', 'boAt', 'Dizo', 'Kospet',
  'Apple', 'Samsung', 'Xiaomi', 'Realme', 'OnePlus', 'Infinix', 'Tecno', 'Vivo', 'Oppo',
  'Sony', 'Lenovo', 'Remax', 'Havit', 'Baseus', 'Anker', 'Oraimo', 'Awei', 'Joyroom',
  'LDNIO', 'Hoco', 'Borofone', 'WiWU', 'Mcdodo', 'Usams', 'Ugreen', 'Vention', 'Orico',
  'Choetech', 'Essager', 'Kuulaa', 'Toocki', 'Haylou', 'QCY', 'Sanag', 'Celebrat', 'Yison',
  'Plextone', 'Edifier', 'Microlab', 'F&D', 'Jmary', 'Yunteng', 'Boya', 'Maxline', 'Joykaly',
  'Defender', 'Gree', 'Haier', 'Midea', 'G-Tide', 'Kisonli', 'Zealot', 'Tronsmart',
  'Logitech', 'Fantech', 'A4Tech', 'Rapoo', 'Redragon', 'Meetion', 'Motospeed', 'Dareu',
  'Ajazz', 'Keychron', 'Corsair', 'Razer', 'HyperX', 'Asus', 'MSI', 'Gigabyte', 'HP',
  'Dell', 'Acer', 'Tenda', 'Mercusys', 'D-Link', 'Netgear', 'V380', 'Hikvision', 'Dahua',
  'Imou', 'Ezviz', 'SanDisk', 'Kingston', 'Transcend', 'Lexar', 'Netac', 'Seagate',
  'Kemei', 'VGR', 'Gemei', 'HTC', 'Nova', 'Philips', 'Panasonic', 'Braun', 'Enchen',
  'ShowSee', 'Miyako', 'Walton', 'Singer', 'Bajaj', 'Jaipan', 'Prestige', 'Hawkins',
  'Geepas', 'Bange', 'Tigernu', 'Bullcaptain', 'Baellerry', 'Wildcraft', 'Samsonite',
  'Nike', 'Adidas', 'Puma', 'Reebok', 'Vans', 'Converse', 'Gucci', 'Zara', 'H&M',
  'Tawakkal', 'Bata', 'Apex', 'Lotto', 'Kaizar', 'Rezzel', 'SnowSoft'
];

export function detectBrand(title, desc) {
  const t = title || '';
  const d = desc || '';

  // 1. Check description explicit Brand: pattern
  const descMatch = d.match(/(?:brand|ব্র্যান্ড|Brand Name)\s*[:：\-–]\s*([^\r\n,<|.]+)/i);
  if (descMatch) {
    const rawB = descMatch[1].trim().split(/(?:model|sku|color|colour|material|origin|size|movement|dial|water|type|made|quality)/i)[0].trim();
    if (/no\s*brand|non[\s-]*brand|china|kintesi/i.test(rawB)) {
      return 'No Brand';
    }
    for (const b of authenticBrands) {
      if (new RegExp('^' + b.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i').test(rawB) ||
          new RegExp('\\b' + b.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i').test(rawB)) {
        return b;
      }
    }
  }

  // 2. Check title against authentic brands
  for (const b of authenticBrands) {
    const escaped = b.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp('(?:^|[\\s\\[\\(\\/\\-_])' + escaped + '(?:$|[\\s\\]\\)\\/\\-_:,])', 'i');
    if (regex.test(t)) {
      if (b.toLowerCase() === 'vision' && /night\s+vision|clear\s+vision/i.test(t)) {
        continue;
      }
      if (b.toLowerCase() === 'nova' && /super\s+nova/i.test(t)) {
        continue;
      }
      return b;
    }
  }

  // Default to 'No Brand' as requested by user
  return 'No Brand';
}

function generateAccurateTags(title, categoryId, subCategory, brand) {
  const tagSet = new Set();
  const rawWords = (title || '')
    .toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  rawWords.forEach((w) => tagSet.add(w));
  if (categoryId) tagSet.add(categoryId.replace(/-/g, ' '));
  if (subCategory) tagSet.add(subCategory.toLowerCase());
  if (brand && brand !== 'No Brand' && brand !== 'Generic' && brand !== 'Kintesi') {
    tagSet.add(brand.toLowerCase());
  }

  tagSet.add('অনলাইন শপিং');
  tagSet.add('ক্যাশ অন ডেলিভারি');
  tagSet.add('Kintesi');

  return Array.from(tagSet);
}

async function run() {
  console.log('🔄 Loading local catalog...');
  const catalogPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  console.log(`Loaded ${catalog.length} products.`);

  let updatedCount = 0;
  let brandedCount = 0;
  let noBrandCount = 0;
  const brandStats = {};

  const updatedCatalog = catalog.map((p) => {
    const prevBrand = p.brand;
    const newBrand = detectBrand(p.title, p.description);

    brandStats[newBrand] = (brandStats[newBrand] || 0) + 1;

    if (newBrand === 'No Brand') {
      noBrandCount++;
    } else {
      brandedCount++;
    }

    if (prevBrand !== newBrand) {
      updatedCount++;
    }

    const tags = generateAccurateTags(p.title, p.category_id, p.sub_category, newBrand);
    const searchKey = `${p.title || ''} ${p.sub_category || ''} ${p.category_id || ''} ${newBrand} ${p.sku || ''} ${tags.join(' ')}`.toLowerCase();

    return {
      ...p,
      brand: newBrand,
      tags: tags,
      _searchKey: searchKey,
    };
  });

  console.log(`\n📊 Brand Assignment Summary:`);
  console.log(`- Total Products: ${catalog.length}`);
  console.log(`- Products with Authentic Brand: ${brandedCount}`);
  console.log(`- Products with 'No Brand': ${noBrandCount}`);
  console.log(`- Brand values changed: ${updatedCount}`);

  console.log('\nTop 20 Assigned Brands:');
  const sortedBrands = Object.entries(brandStats).sort((a, b) => b[1] - a[1]);
  console.log(sortedBrands.slice(0, 20));

  // Save updated catalog to disk
  fs.writeFileSync(catalogPath, JSON.stringify(updatedCatalog, null, 2), 'utf8');
  console.log(`\n💾 Saved updated catalog to ${catalogPath}`);

  // Sync to Supabase with all required fields
  console.log('\n🚀 Syncing updated brands & tags to Supabase...');
  const BATCH_SIZE = 100;
  let successCount = 0;

  for (let i = 0; i < updatedCatalog.length; i += BATCH_SIZE) {
    const chunk = updatedCatalog.slice(i, i + BATCH_SIZE).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      discount_price: p.discount_price,
      category_id: p.category_id,
      stock: p.stock || 50,
      images: p.images || ['/logo.webp'],
      brand: p.brand,
      sku: p.sku || '',
      gender: p.gender || 'Unisex',
      tags: p.tags || [],
      sizes: p.sizes || [],
      specifications: {
        ...(p.specifications || {}),
        sub_category: p.sub_category,
      },
      dropshipping_url: p.dropshipping_url || '',
    }));

    let retries = 0;
    let saved = false;

    while (!saved && retries < 3) {
      retries++;
      const { error } = await supabase.from('products').upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.warn(`\n⚠️ Batch error (${i} - ${i + chunk.length}), attempt ${retries}:`, error.message);
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        saved = true;
        successCount += chunk.length;
        process.stdout.write(`\r✅ Synced ${successCount} / ${updatedCatalog.length} products to Supabase...`);
      }
    }

    if (!saved) {
      console.error(`\n❌ Failed to sync batch starting at ${i} after 3 attempts.`);
    }
  }

  console.log('\n\n🎉 Brand update & Supabase sync completed successfully!');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

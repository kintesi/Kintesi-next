import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const COLOR_MAP = {
  black: { name: 'Black', hex: '#000000', bn: 'কালো' },
  white: { name: 'White', hex: '#FFFFFF', bn: 'সাদা' },
  red: { name: 'Red', hex: '#EF4444', bn: 'লাল' },
  blue: { name: 'Blue', hex: '#3B82F6', bn: 'নীল' },
  'navy blue': { name: 'Navy Blue', hex: '#1E3A8A', bn: 'নেভি ব্লু' },
  navy: { name: 'Navy', hex: '#1E3A8A', bn: 'নেভি' },
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
  return str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
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

  // Pattern A: Parentheses or brackets with color
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

  // Pattern B: At the end of title
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

  // Pattern C: At start of title
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

  // Pattern D: Inside middle of title
  if (!detectedColorKey) {
    for (const c of colorKeys) {
      if (['in', 'to', 'at', 'an', 'as', 'by', 'for', 'men', 'man', 'bag', 'set'].includes(c.toLowerCase())) continue;
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

// Group products
const groups = new Map();
for (const p of catalog) {
  const { colorInfo, baseTitle } = extractColorAndCleanBase(p.title);
  
  // Keep English and Bengali characters!
  const normKey = (p.category_id + ':::' + baseTitle.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/gi, ' ').replace(/\s+/g, ' ')).trim();

  if (!groups.has(normKey)) {
    groups.set(normKey, {
      baseTitle,
      category_id: p.category_id,
      items: [],
    });
  }
  groups.get(normKey).items.push({ product: p, colorInfo });
}

console.log(`Initial items: ${catalog.length}`);
console.log(`Groups after advanced deduplication: ${groups.size}`);

const mergedGroups = Array.from(groups.entries()).filter(([k, v]) => v.items.length > 1);
console.log(`Multi-variant groups (consolidated products): ${mergedGroups.length}`);

let totalMergedItems = 0;
mergedGroups.forEach(([k, v]) => {
  totalMergedItems += v.items.length;
});
console.log(`Total items consolidated into multi-variant master products: ${totalMergedItems}`);

console.log('\nSample consolidated products:');
mergedGroups.slice(20).forEach(([k, v], idx) => {
  console.log(`\n#${idx + 1} "${v.baseTitle}" (${v.items.length} variants):`);
  v.items.forEach(i => {
    console.log(`   - [${i.product.sku}] color: ${i.colorInfo ? i.colorInfo.name : 'default'} | "${i.product.title}"`);
  });
});

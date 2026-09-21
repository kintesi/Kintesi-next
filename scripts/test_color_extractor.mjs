import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Expand COLOR_MAP to include ALL colors and local Bengali color transliterations
const COLOR_MAP = {
  black: '#000000',
  white: '#FFFFFF',
  red: '#EF4444',
  blue: '#3B82F6',
  'navy blue': '#1E3A8A',
  navy: '#1E3A8A',
  'royal blue': '#1D4ED8',
  'sky blue': '#38BDF8',
  sky: '#38BDF8',
  green: '#10B981',
  'olive green': '#556B2F',
  olive: '#556B2F',
  teal: '#14B8A6',
  maroon: '#800000',
  marun: '#800000',
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
  ash: '#9CA3AF',
  paste: '#A7F3D0',
  petrol: '#0E7490',
  pettrol: '#0E7490',
  katali: '#B45309',
  khatali: '#B45309',
  'deep sepia': '#704214',
  sepia: '#704214',
  army: '#4B5320',
  'army green': '#4B5320',
  camo: '#78866B',
  'camo cargo': '#78866B',
  cyan: '#06B6D4',
  rose: '#FB7185',
  'bottle green': '#006A4E',
  'sea green': '#2E8B57',
  'deep blue': '#00008B',
  'light blue': '#ADD8E6',
  'dark blue': '#00008B',
  'dark green': '#006400',
  multicolor: '#6366F1',
  'multi color': '#6366F1',
  multi: '#6366F1',
};

const BENGALI_COLOR_MAP = {
  black: 'কালো',
  white: 'সাদা',
  red: 'লাল',
  blue: 'নীল',
  navy: 'নেভি ব্লু',
  'navy blue': 'নেভি ব্লু',
  'sky blue': 'আকাশি',
  sky: 'আকাশি',
  green: 'সবুজ',
  olive: 'অলিভ',
  teal: 'টিল',
  maroon: 'মেরুন',
  marun: 'মেরুন',
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
  ash: 'অ্যাশ / ছাই',
  paste: 'পেস্ট কালার',
  petrol: 'পেট্রোল ব্লু',
  katali: 'কাঁঠালি কালার',
  khatali: 'কাঁঠালি কালার',
  'deep sepia': 'সেপিয়া',
  army: 'আর্মি গ্রিন',
};

function normalizeUnicodeText(str) {
  if (!str) return '';
  return str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

function extractColorAndCleanBase(title) {
  const normTitle = normalizeUnicodeText(title).trim();
  let cleaned = normTitle;
  let detectedColor = null;

  // Sorted colors from longest to shortest
  const colorKeys = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length);

  // Pattern A: Parentheses or brackets containing color e.g. (Ash Color), (Paste), (Sky), (PetroL), (deep Sepia)
  for (const c of colorKeys) {
    const pParen = new RegExp(`\\(\\s*${c}(?:\\s*(?:color|colour|dial|shape))?\\s*\\)`, 'i');
    if (pParen.test(cleaned)) {
      detectedColor = c;
      cleaned = cleaned.replace(pParen, ' ').trim();
      break;
    }
  }

  // Pattern B: At the end of title: ' - Teal Color' or ': Teal' or ' Teal'
  if (!detectedColor) {
    for (const c of colorKeys) {
      const pEnd = new RegExp(`[-–—:\\(\\[/|]?\\s*\\b${c}\\b\\s*(?:color|colour)?\\s*[\\)\\]]?$`, 'i');
      if (pEnd.test(cleaned)) {
        detectedColor = c;
        cleaned = cleaned.replace(pEnd, '').trim();
        break;
      }
    }
  }

  // Pattern C: At start of title: '& White Halfsilk...' or 'Teal ...' or 'Premium White Jersey...'
  if (!detectedColor) {
    for (const c of colorKeys) {
      // Check start: e.g. "^[& ]*white\s+"
      const pStart = new RegExp(`^[&\\s-–—:]*\\b${c}\\b\\s*[-–—:]?\\s*`, 'i');
      if (pStart.test(cleaned)) {
        detectedColor = c;
        cleaned = cleaned.replace(pStart, '').trim();
        break;
      }
    }
  }

  // Pattern D: Inside middle of title: e.g. "Premium White Jersey T-Shirt" -> "Premium Jersey T-Shirt"
  if (!detectedColor) {
    for (const c of colorKeys) {
      const pMid = new RegExp(`\\b${c}\\b(?:\\s*(?:color|colour))?\\s*`, 'i');
      if (pMid.test(cleaned)) {
        // Only strip if not altering a completely different word
        const candidate = cleaned.replace(pMid, '').replace(/\s+/g, ' ').trim();
        if (candidate.length > 10) {
          detectedColor = c;
          cleaned = candidate;
          break;
        }
      }
    }
  }

  // Clean trailing and leading punctuation / artifacts
  cleaned = cleaned
    .replace(/[,\.+-–—:;\\/|]+$/, '')
    .replace(/^[,\.+-–—:;\\/|]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { detectedColor, baseTitle: cleaned };
}

// Test on our problematic clusters
const testTitles = [
  "Premium White Jersey T-Shirt – Lightweight & Breathable",
  "Premium Pink Jersey T-Shirt – Lightweight & Breathable",
  "Men's Solid Colour Ban color Shirt  (paste)",
  "Men's Solid Colour Ban color Shirt  ( deep Sepia )",
  "Men's Solid Colour Ban color Shirt",
  "𝐂𝐨𝐭𝐭𝐨𝐧 𝐂𝐨𝐥𝐥𝐚𝐫 𝐒𝐡𝐢𝐫𝐭(Sky)",
  "𝐂𝐨𝐭𝐭𝐨𝐧 𝐂𝐨𝐥𝐥𝐚𝐫 𝐒𝐡𝐢𝐫𝐭",
  "Double Pocket  shirt for men( katali)",
  "Double Pocket  shirt for men",
  "& White Halfsilk Saree for Women",
  "& Blue Halfsilk Saree for Women",
  "vibrant gold ring adorned with colorful gemstones,",
  "vibrant gold ring adorned with colorful gemstones.",
  "Premium Zafran Felix Luxury Abaya with Embroidery & Stone Work | Matching Hijab & Adjustable Inner | Modest Fashion Teal",
  "Premium Zafran Felix Luxury Abaya with Embroidery & Stone Work | Matching Hijab & Adjustable Inner | Modest Fashion"
];

console.log('--- TEST RESULTS ---');
for (const t of testTitles) {
  const res = extractColorAndCleanBase(t);
  console.log(`Original: "${t}"`);
  console.log(`  -> Color: "${res.detectedColor}" | Base: "${res.baseTitle}"`);
}

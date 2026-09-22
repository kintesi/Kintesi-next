/**
 * Product Specification & Gender Presentation Utilities
 * Ensures internal supplier metadata (profit margins, wholesale costs, dropship IDs)
 * are never exposed to end-users, and handles gender context appropriately.
 */

export const INTERNAL_SPEC_KEYS = new Set([
  'profit_margin',
  'profitmargin',
  'profit',
  'wholesale_cost',
  'wholesalecost',
  'wholesale_price',
  'wholesaleprice',
  'cost_price',
  'costprice',
  'buy_price',
  'buyprice',
  'dropshipping_id',
  'dropshippingid',
  'dropship_id',
  'dropship_price',
  'dropshipping_price',
  'retail_suggested',
  'retailsuggested',
  'suggested_retail_price',
  'suggested_price',
  'discount_percent',
  'discountpercent',
  'has_color_variants',
  'hascolorvariants',
  'color_variants',
  'colorvariants',
  'supplier',
  'supplier_id',
  'supplier_wholesale_price',
  'supplier_status',
  'vendor',
  'vendor_id',
  'mohasagor_id',
  'mohasagor',
  'source_url',
  'source',
  'api_id',
  'product_code',
  'original_category',
  'admin_notes',
  'inventory_id',
  'stock_quantity',
  'is_sync',
  'sync_status',
  'custom_attributes',
  'customattributes',
  'custom_attribute',
  'spec_mode',
  'sub_category',
  'subcategory',
  'category_id',
  'category',
  'id',
  'product_id',
  'created_at',
  'updated_at',
  'is_featured',
  'is_published',
  'is_active',
  'gender',
  'status',
]);

/**
 * Validates whether a specification key is suitable for customer display.
 * Strips out dropshipping internals, pricing secrets, and admin flags.
 */
export function isSpecKeyValid(key: string): boolean {
  if (!key) return false;
  const k = key.toLowerCase().trim().replace(/[\s-_]/g, '');

  for (const internalKey of INTERNAL_SPEC_KEYS) {
    if (k === internalKey.replace(/[\s-_]/g, '')) return false;
  }

  if (
    k.includes('profit') ||
    k.includes('wholesale') ||
    k.includes('dropship') ||
    k.includes('supplier') ||
    k.includes('vendor') ||
    k.includes('costprice') ||
    k.includes('buyprice') ||
    k.includes('margin') ||
    k.includes('suggestedprice') ||
    k.includes('colorvariant')
  ) {
    return false;
  }

  return true;
}

/**
 * Validates whether a specification value is meaningful and non-empty.
 * Rejects booleans (e.g. false/true), empty objects, nulls, and blanks.
 */
export function isSpecValueValid(val: any): boolean {
  if (val === null || val === undefined) return false;
  // Never show raw booleans (e.g. has_color_variants: false)
  if (typeof val === 'boolean') return false;
  if (typeof val === 'object') {
    if (Array.isArray(val)) return val.length > 0 && typeof val[0] !== 'object';
    return false;
  }
  const s = String(val).trim();
  return (
    s !== '' &&
    s !== 'null' &&
    s !== 'undefined' &&
    s !== '[]' &&
    s !== '{}' &&
    s !== '-' &&
    s !== 'false' &&
    s !== 'true'
  );
}

export interface ProductGenderInfo {
  label: 'Men' | 'Women';
  textBn: string;
  colorClass: string;
}

const NON_FASHION_TERMS = [
  'fan', 'fans', 'battery', 'batteries', 'charger', 'chargers', 'cable', 'cables', 'adapter', 'powerbank', 'power bank',
  'phone', 'mobile', 'smartphone', 'laptop', 'computer', 'mouse', 'keyboard',
  'headphone', 'headphones', 'earphone', 'earphones', 'airpod', 'airpods', 'earbuds', 'speaker', 'speakers', 'bluetooth',
  'camera', 'light', 'lights', 'lamp', 'bulb', 'stand', 'tripod',
  'gadget', 'gadgets', 'electronic', 'electronics', 'appliance', 'appliances', 'kitchen', 'home decor',
  'tool', 'tools', 'device', 'motor', 'knife', 'knives', 'fry pan', 'cooker', 'iron machine', 'trimmer', 'shaver',
  'groceries', 'grocery', 'food', 'snack', 'snacks', 'spice', 'spices', 'oil', 'tea', 'coffee', 'honey'
];

const FEMALE_KEYWORDS = [
  'women', 'woman', 'womens', 'female', 'ladies', 'lady', 'girl', 'girls',
  'saree', 'shari', 'kurti', 'kurtis', 'borka', 'burqa', 'abaya', 'hijab',
  'salwar', 'kameez', 'three piece', '3 piece', 'bra', 'panty', 'lingerie',
  'lehenga', 'gown'
];

const MALE_KEYWORDS = [
  'men', 'man', 'mens', 'male', 'gents', 'gent', 'boy', 'boys',
  'panjabi', 'punjabi', 'payjama', 'pyjama', 'shirt', 't shirt', 'polo',
  'trouser', 'trousers', 'lungi', 'boxer', 'blazer', 'suit'
];

/**
 * Returns clean gender information ONLY when relevant to genuine apparel/fashion.
 * Non-wearables (fans, batteries, electronics, gadgets, groceries) and "Unisex" items
 * will strictly return null so that no misleading gender badges are displayed.
 */
export function getProductGenderInfo(product: {
  title?: string;
  category_id?: string;
  sub_category?: string;
  gender?: string;
  fabric?: string;
  fit_type?: string;
}): ProductGenderInfo | null {
  if (!product) return null;

  const rawGender = (product.gender || '').trim().toLowerCase();

  const title = product.title || '';
  const cat = product.category_id || '';
  const sub = product.sub_category || '';

  const fullClean = ' ' + (title + ' ' + cat + ' ' + sub).toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]/g, ' ') + ' ';

  // 1. If it's a non-wearable product (fan, battery, charger, phone, appliance, grocery, etc.), NEVER show gender
  if (NON_FASHION_TERMS.some((term) => fullClean.includes(' ' + term + ' '))) {
    return null;
  }

  // 2. Explicit direct gender mapping (excluding Unisex/both)
  if (rawGender === 'women' || rawGender === 'female' || rawGender === 'ladies') {
    return { label: 'Women', textBn: 'মেয়েদের', colorClass: 'text-pink-700 bg-pink-50 border-pink-200/60' };
  }
  if (rawGender === 'men' || rawGender === 'male' || rawGender === 'gents') {
    return { label: 'Men', textBn: 'ছেলেদের', colorClass: 'text-indigo-700 bg-indigo-50 border-indigo-200/60' };
  }

  // 3. For fashion items, detect gender from title and categories
  const isFashionCategory =
    cat.includes('fashion') ||
    cat.includes('clothing') ||
    cat.includes('apparel') ||
    cat.includes('footwear') ||
    cat.includes('shoes') ||
    Boolean(product.fabric) ||
    Boolean(product.fit_type);

  const hasFemaleKeywords =
    FEMALE_KEYWORDS.some((kw) => fullClean.includes(' ' + kw + ' ')) ||
    /মেয়েদের|মহিলা|বোরকা|শাড়ি|কুর্তি/.test(fullClean);

  const hasMaleKeywords =
    MALE_KEYWORDS.some((kw) => fullClean.includes(' ' + kw + ' ')) ||
    /ছেলেদের|পুরুষ|পাঞ্জাবি|শার্ট/.test(fullClean);

  if (isFashionCategory || hasFemaleKeywords || hasMaleKeywords) {
    if (hasFemaleKeywords && !hasMaleKeywords) {
      return { label: 'Women', textBn: 'মেয়েদের', colorClass: 'text-pink-700 bg-pink-50 border-pink-200/60' };
    }
    if (hasMaleKeywords && !hasFemaleKeywords) {
      return { label: 'Men', textBn: 'ছেলেদের', colorClass: 'text-indigo-700 bg-indigo-50 border-indigo-200/60' };
    }
  }

  // If unisex, neutral, or non-gendered, return null (never show "Unisex" label)
  return null;
}

/**
 * Parses description text to extract clean technical & sizing specifications
 * that dropshipping suppliers frequently embed in unstructured text.
 */
export function extractCleanSpecsFromDescription(description?: string): Record<string, string> {
  if (!description || typeof description !== 'string') return {};

  const cleanSpecs: Record<string, string> = {};

  const SPEC_PATTERNS = [
    { label: 'Product Size', regex: /(?:Product\s*size|Dimensions?|সাইজ|পরিমাপ)\s*[:：]\s*([^\r\n,;।]{2,60})/i },
    { label: 'Length', regex: /(?:Available\s*Length|Length|লং|দৈর্ঘ্য)\s*[:：]\s*([^\r\n,;।]{1,60})/i },
    { label: 'Body / Chest', regex: /(?:Body\s*[\/&]\s*Chest|Chest|বডি)\s*[:：]\s*([^\r\n,;।]{1,60})/i },
    { label: 'Flair / Gher', regex: /(?:Flair|Gher|ঘের)\s*[:：]\s*([^\r\n,;।]{1,60})/i },
    { label: 'Hijab Size', regex: /(?:Hijab\s*Size|হিজাব\s*সাইজ)\s*[:：]\s*([^\r\n,;।]{1,60})/i },
    { label: 'Material', regex: /(?:Material|উপাদান|মেটেরিয়াল|মেটেরিয়াল)\s*[:：]\s*([^\r\n,;।]{2,60})/i },
    { label: 'Battery Capacity', regex: /(?:Battery\s*capacity|Battery|ব্যাটারি\s*ক্ষমতা|ব্যাটারি)\s*[:：]\s*([^\r\n,;।]{2,60})/i },
    { label: 'Charging Method', regex: /(?:Charging\s*method|চার্জিং\s*সিস্টেম|চার্জিং\s*মেথড)\s*[:：]\s*([^\r\n,;।]{2,60})/i },
    { label: 'Weight', regex: /(?:Net\s*Weight|Weight|ওজন)\s*[:：]\s*([^\r\n,;।]{2,60})/i },
    { label: 'Voltage / Power', regex: /(?:Voltage|Power|Watt|ভোল্টেজ|পাওয়ার)\s*[:：]\s*([^\r\n,;।]{2,60})/i },
  ];

  for (const item of SPEC_PATTERNS) {
    const match = description.match(item.regex);
    if (match && match[1]) {
      const val = match[1].trim();
      if (val && !val.toLowerCase().includes('http') && val.length > 1) {
        cleanSpecs[item.label] = val;
      }
    }
  }

  return cleanSpecs;
}

/**
 * Cleanly formats dropshipping supplier description text to match Dropshipping BD's exact native layout:
 * - Proper paragraphs
 * - Distinct emoji bullet sections (👉, ✨, etc.)
 * - Line-by-line age and size measurements (never smushed together)
 * - Line-by-line product attributes (Material, Fabrics, GSM, etc.)
 */
export function formatDescriptionDropshippingStyle(text?: string): string {
  if (!text || !text.trim()) return '';

  let clean = text
    .replace(/https?:\/\/(?:mohasagor|dropshipping)\S+/gi, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Fix glued dot hashtags like .#babys.#hoodies.
  clean = clean.replace(/\.+#/g, ' #');

  // Emojis at beginning of sections
  clean = clean.replace(/([^\n])\s*(👉|⚡|✨|🔥|🌟|📦|🌸|💨|💡|📌|🌼)/g, '$1\n\n$2 ');

  // Sentence ends (Bengali Dari or English period followed immediately by capital letter or Bengali word)
  clean = clean.replace(/([।!?])\s*(?=[A-Za-z\u0980-\u09ff])/g, '$1\n\n');

  // Unglue parenthesis-based size specs like (*M:* লেন্থ ২৮", বক্ষ ৩৯")(*L:*...)
  clean = clean.replace(/\)\s*\(\s*(?=[*A-Za-z0-9\u0980-\u09ff]+[:=])/g, ')\n• ');
  clean = clean.replace(/(?:[-–—:*]\s*)?\(\s*(?=[*A-Za-z0-9\u0980-\u09ff]+[:=])/g, '\n• ');

  // Unglue letter size specs like "M = length 28", chest 39"L= length 29"..." or "XXLM = length"
  clean = clean.replace(/([0-9"”\'\.\,])\s*(?=\b(?:XXXL|XXL|XL|L|M|S|XS)\s*[:=]\s*(?:length|chest|body|লেন্থ|বক্ষ|বডি|লম্বা))/gi, '$1\n• ');

  // Unglue age/year size specifications (English & Bengali):
  // e.g. Chest-27"8 yrs- or ৩২"১২ বছর - or 30.10yrs- or :-6 yrs-
  clean = clean.replace(/([^\d\n])\s*[-–—]?\s*(?=(?:[1-9]|1[0-9]|[১-৯]|[১-৯][০-৯])\s*(?:yrs|years|y|yr|বছর)\s*[-–—:]*\s*(?:Lenth|Length|দৈর্ঘ্য|বুক|Chest|Body))/gi, '$1\n• ');

  // Standardize first bullet after "সাইজের বিবরণ" or "Size measurements"
  clean = clean.replace(/(সাইজের বিবরণ[^\n:]*[:：][-–—]*)\s*[-–—]?\s*(?=(?:[1-9]|1[0-9]|[১-৯]|[১-৯][০-৯])\s*(?:yrs|years|y|yr|বছর))/gi, '$1\n• ');
  clean = clean.replace(/(Size measurements?[^\n:]*[:：][-–—]*)\s*[-–—]?\s*(?=(?:[1-9]|1[0-9]|[১-৯]|[১-৯][০-৯])\s*(?:yrs|years|y|yr|বছর))/gi, '$1\n• ');

  // English spec headers
  const specHeaders = [
    'Product Type', 'Material', 'Export Quality Hoodie', 'Export Quality', 'Fabrics', 'Fabric & Print Color Guaranteed',
    'Fabric', 'Fabrication', 'GSMFabric', 'Size measurements', 'Size measurement', 'Size Measurement', 'Size',
    'Package included', 'Package includes', 'Specification', 'Specifications', 'Color', 'Colors', 'Brand', 'Warranty', 'Origin'
  ];
  for (const h of specHeaders) {
    const regex = new RegExp('([^\\n])\\s*(?=' + h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[:：])', 'gi');
    clean = clean.replace(regex, '$1\n');
  }

  // Common glued phrases in BD dropshipping descriptions
  clean = clean.replace(/([a-z0-9"”\'.])\s*(?=(?:Export Quality|Fabric & Print|Fabrication|GSMFabric|GSM|Size:))/gi, '$1\n');

  // Unglue dashed bullets like "- স্টাইলিশ ও আরামদায়ক।- দীর্ঘস্থায়ী এবং টেকসই।"
  clean = clean.replace(/([।!?.:：\n])\s*[-–—]\s*(?=[A-Za-z\u0980-\u09ff])/g, '$1\n• ');

  // Hashtags separated
  clean = clean.replace(/([^\n])\s*(?=#[\w\u0980-\u09ff]+)/g, '$1\n\n');
  clean = clean.replace(/(#[\w\u0980-\u09ff]+)\s*(?=[A-Z\u0980-\u09ff])/g, '$1\n\n');

  // Double space cleanup
  clean = clean.replace(/[ \t]+/g, ' ');

  return clean.trim();
}

/**
 * Maps size names (e.g. "6 Years", "8 Years", "M", "XL") to their exact measurement string
 * extracted from description (e.g. "Length: 17.5\", Chest: 27\"").
 */
export function extractSizeMeasurementsMap(desc?: string): Record<string, string> {
  if (!desc) return {};
  const formatted = formatDescriptionDropshippingStyle(desc);
  const map: Record<string, string> = {};

  const lines = formatted.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // 1. Year based: e.g. "• 6 yrs- Lenth-17.5", Chest-27"" or "• ৬ বছর - দৈর্ঘ্য: ১৮", বুক: ২৮""
    const yrMatch = line.match(/^•?\s*([1-9]|1[0-9]|[১-৯]|[১-৯][০-৯])\s*(?:yrs|years|y|yr|বছর)\b\s*[-–—:]*\s*(.*)$/i);
    if (yrMatch) {
      const rawNum = yrMatch[1];
      const enNum = rawNum.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
      const details = yrMatch[2].replace(/^[-–—:,]+/, '').replace(/[*)]+$/g, '').trim();
      if (details) {
        map[`${enNum} years`] = details;
        map[`${enNum} yrs`] = details;
        map[`${enNum}y`] = details;
        map[`${enNum}`] = details;
        map[`${rawNum} বছর`] = details;
      }
      continue;
    }

    // 2. Letter based: e.g. "• *M:* লেন্থ ২৮", বক্ষ ৩৯"" or "• M = length 28", chest 39""
    const letterMatch = line.match(/^•?\s*\*?(XXXL|XXL|XL|L|M|S|XS)\*?\s*[:=]\s*(.*)$/i);
    if (letterMatch) {
      const sz = letterMatch[1].toUpperCase();
      const details = letterMatch[2].replace(/^[-–—:,]+/, '').replace(/[*)]+$/g, '').trim();
      if (details) {
        map[sz] = details;
      }
    }
  }

  return map;
}

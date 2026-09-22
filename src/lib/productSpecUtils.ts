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

import { Product } from '../types';

// Comprehensive Bengali-English eCommerce Synonym Dictionaries
const SYNONYM_DICTIONARY: Record<string, string[]> = {
  // Saree & Traditional Wear
  sharee: ['saree', 'sari', 'শাড়ি', 'শাড়ি', 'শাড়ী', 'kota', 'women', 'পোশাক', 'মহিলা'],
  saree: ['sharee', 'sari', 'শাড়ি', 'শাড়ি', 'শাড়ী', 'kota', 'women', 'পোশাক', 'মহিলা'],
  sari: ['sharee', 'saree', 'শাড়ি', 'শাড়ি', 'women'],
  'শাড়ি': ['sharee', 'saree', 'sari', 'শাড়ি', 'শাড়ী', 'women'],
  'শাড়ি': ['sharee', 'saree', 'sari', 'শাড়ি', 'women'],
  'শাড়ী': ['sharee', 'saree', 'sari', 'শাড়ি', 'women'],
  kapor: ['fabric', 'cloth', 'dress', 'শাড়ি', 'কাপড়', 'কাপড়', 'পোশাক'],
  'কাপড়': ['kapor', 'fabric', 'cloth', 'dress', 'শাড়ি', 'পোশাক'],
  'কাপড়': ['kapor', 'fabric', 'cloth', 'dress', 'শাড়ি', 'পোশাক'],

  // Panjabi & Kurti
  panjabi: ['punjabi', 'পাঞ্জাবি', 'পাঞ্জাবী', 'kurta', 'men', 'কাতুয়া'],
  punjabi: ['panjabi', 'পাঞ্জাবি', 'পাঞ্জাবী', 'kurta', 'men'],
  'পাঞ্জাবি': ['panjabi', 'punjabi', 'পাঞ্জাবী', 'men', 'kurta'],
  'পাঞ্জাবী': ['panjabi', 'punjabi', 'পাঞ্জাবি', 'men'],
  kurti: ['kurtis', 'কুর্তি', 'kamiz', 'কামিজ', 'three piece', 'থ্রি পিস'],
  kurtis: ['kurti', 'কুর্তি', 'kamiz', 'কামিজ'],
  'কুর্তি': ['kurti', 'kurtis', 'kamiz', 'কামিজ'],

  // T-Shirt & Polo
  tshirt: ['t-shirt', 'tee', 'টি-শার্ট', 'টি শার্ট', 'polo', 'ড্রপ শোল্ডার', 'drop shoulder'],
  't-shirt': ['tshirt', 'tee', 'টি-শার্ট', 'টি শার্ট', 'polo'],
  'টি-শার্ট': ['tshirt', 't-shirt', 'tee', 'polo', 'টি শার্ট'],
  'টি শার্ট': ['tshirt', 't-shirt', 'tee', 'polo', 'টি-শার্ট'],
  polo: ['t-shirt', 'tshirt', 'পোলো', 'পোলো শার্ট'],

  // Electronics & Phones
  phone: ['smartphone', 'mobile', 'ফোন', 'মোবাইল', 'স্মার্টফোন', 'iphone', 'samsung', 'xiaomi'],
  mobile: ['phone', 'smartphone', 'ফোন', 'মোবাইল', 'স্মার্টফোন'],
  smartphone: ['phone', 'mobile', 'ফোন', 'মোবাইল'],
  'ফোন': ['phone', 'mobile', 'smartphone', 'মোবাইল'],
  'মোবাইল': ['phone', 'mobile', 'smartphone', 'ফোন'],
  laptop: ['computer', 'ল্যাপটপ', 'ম্যাকবুক', 'macbook', 'notebook'],
  'ল্যাপটপ': ['laptop', 'computer', 'macbook', 'notebook'],

  // Watch & Smartwatch
  watch: ['watches', 'smartwatch', 'wristwatch', 'ঘড়ি', 'ঘড়ি', 'হাতের ঘড়ি', 'হাত ঘড়ি', 'হাতঘড়ি', 'ঘড়ী'],
  watches: ['watch', 'smartwatch', 'wristwatch', 'ঘড়ি', 'ঘড়ি'],
  smartwatch: ['watch', 'wristwatch', 'ঘড়ি', 'ঘড়ি', 'স্মার্ট ওয়াচ'],
  wristwatch: ['watch', 'smartwatch', 'ঘড়ি', 'ঘড়ি'],
  'ঘড়ি': ['watch', 'watches', 'smartwatch', 'wristwatch', 'ঘড়ি', 'হাতের ঘড়ি'],
  'ঘড়ি': ['watch', 'watches', 'smartwatch', 'wristwatch', 'ঘড়ি', 'হাতের ঘড়ি'],
  'হাত ঘড়ি': ['watch', 'wristwatch', 'ঘড়ি', 'ঘড়ি'],
  'হাতঘড়ি': ['watch', 'wristwatch', 'ঘড়ি', 'ঘড়ি'],
  ghori: ['watch', 'watches', 'smartwatch', 'wristwatch', 'ঘড়ি', 'ঘড়ি', 'gori', 'হাতের ঘড়ি'],
  gori: ['watch', 'watches', 'smartwatch', 'wristwatch', 'ঘড়ি', 'ঘড়ি', 'ghori'],
  clock: ['wall clock', 'clock', 'ঘড়ি', 'ঘড়ি', 'দেয়াল ঘড়ি'],

  // Fan & Cooling
  fan: ['fans', 'turbo fan', 'handheld fan', 'portable fan', 'rechargeable fan', 'mini fan', 'cooler', 'ফ্যান', 'হাত ফ্যান', 'চার্জার ফ্যান', 'রিচার্জেবল ফ্যান'],
  fans: ['fan', 'turbo fan', 'rechargeable fan', 'ফ্যান'],
  'turbo fan': ['fan', 'handheld fan', 'ফ্যান', 'টার্বো ফ্যান'],
  'handheld fan': ['fan', 'portable fan', 'হাত ফ্যান', 'মিনি ফ্যান'],
  'rechargeable fan': ['fan', 'চার্জার ফ্যান', 'রিচার্জেবল ফ্যান', 'ফ্যান'],
  'ফ্যান': ['fan', 'fans', 'turbo fan', 'rechargeable fan', 'হাত ফ্যান', 'চার্জার ফ্যান', 'বাতাস'],
  'হাত ফ্যান': ['fan', 'handheld fan', 'portable fan', 'ফ্যান'],
  'চার্জার ফ্যান': ['fan', 'rechargeable fan', 'ফ্যান'],
  fyan: ['fan', 'fans', 'ফ্যান', 'হাত ফ্যান', 'চার্জার ফ্যান'],

  // Mouse & Gaming
  mouse: ['mice', 'wireless mouse', 'gaming mouse', 'bluetooth mouse', 'মাউস', 'ওয়্যারলেস মাউস', 'কম্পিউটার মাউস'],
  mice: ['mouse', 'wireless mouse', 'মাউস'],
  'wireless mouse': ['mouse', 'bluetooth mouse', 'ওয়্যারলেস মাউস', 'মাউস'],
  'মাউস': ['mouse', 'mice', 'wireless mouse', 'gaming mouse', 'ওয়্যারলেস মাউস'],
  'ওয়্যারলেস মাউস': ['mouse', 'wireless mouse', 'মাউস'],
  keyboard: ['keyboards', 'mechanical keyboard', 'কীবোর্ড', 'কিবোর্ড'],
  'কীবোর্ড': ['keyboard', 'mechanical keyboard', 'কিবোর্ড'],

  // Charger & Cable
  charger: ['chargers', 'adapter', 'fast charger', 'চার্জার', 'ফাস্ট চার্জার', 'charjar', 'মোবাইল চার্জার'],
  chargers: ['charger', 'adapter', 'fast charger', 'চার্জার'],
  'চার্জার': ['charger', 'chargers', 'adapter', 'fast charger', 'charjar', 'মোবাইল চার্জার'],
  charjar: ['charger', 'chargers', 'চার্জার', 'fast charger'],
  cable: ['cables', 'charging cable', 'usb cable', 'type-c', 'ক্যাবল', 'কেবিল', 'ডাটা ক্যাবল'],
  cables: ['cable', 'charging cable', 'usb cable', 'ক্যাবল'],
  'ক্যাবল': ['cable', 'cables', 'charging cable', 'ডাটা ক্যাবল', 'কেবিল'],
  'কেবিল': ['cable', 'cables', 'charging cable'],
  'ডাটা ক্যাবল': ['cable', 'charging cable', 'type-c'],

  // Table & Home Decor
  table: ['table cloth', 'tablecloth', 'table cover', 'টেবিল', 'টেবিল ক্লথ'],
  'table cloth': ['tablecloth', 'table cover', 'table runner', 'টেবিল ক্লথ', 'টেবিল কভার', 'ডাইনিং টেবিল'],
  tablecloth: ['table cloth', 'table cover', 'টেবিল ক্লথ'],
  'টেবিল': ['table', 'table cloth', 'টেবিল ক্লথ'],
  'টেবিল ক্লথ': ['table cloth', 'tablecloth', 'table cover', 'টেবিল কভার'],

  // Water & Pump & Dispenser
  water: ['water dispenser', 'water pump', 'water bottle', 'পানির পাম্প', 'পানির বোতল', 'ডিসপেনসার', 'বোতল'],
  'water dispenser': ['water pump', 'water bottle pump', 'পানির পাম্প', 'ডিসপেনসার', 'পানির ডিসপেনসার'],
  'water pump': ['water dispenser', 'পানির পাম্প', 'পানি তোলার পাম্প', 'পাম্প'],
  pump: ['water pump', 'air pump', 'পাম্প', 'পানির পাম্প'],
  'পাম্প': ['pump', 'water pump', 'পানির পাম্প'],
  'পানির পাম্প': ['water dispenser', 'water pump', 'ডিসপেনসার', 'পানি তোলার পাম্প'],
  'পানি তোলার পাম্প': ['water pump', 'পানির পাম্প'],
  'ডিসপেনসার': ['dispenser', 'water dispenser', 'water pump'],
  bottle: ['water bottle', 'flask', 'বোতল', 'পানির বোতল', 'ফ্লাস্ক', 'থার্মাস'],
  'পানির বোতল': ['water bottle', 'bottle', 'flask', 'বোতল'],

  // Waterproof
  waterproof: ['water proof', 'water resistant', 'ওয়াটারপ্রুফ', 'পানি নিরোধক', 'ওয়াটারপ্রুফ', 'waterproof watch'],
  'ওয়াটারপ্রুফ': ['waterproof', 'water proof', 'পানি নিরোধক'],
  'ওয়াটারপ্রুফ': ['waterproof', 'water proof', 'পানি নিরোধক'],

  // Hoodie & Jacket & Winterwear
  hoodie: ['hoodies', 'winterwear', 'jacket', 'হুডি', 'জ্যাকেট', 'সুইটার', 'sweatshirt'],
  hoodies: ['hoodie', 'winterwear', 'হুডি', 'জ্যাকেট'],
  'হুডি': ['hoodie', 'hoodies', 'winterwear', 'জ্যাকেট', 'সুইটার'],
  jacket: ['jackets', 'winterwear', 'জ্যাকেট', 'উইন্টার জ্যাকেট', 'hoodie', 'হুডি'],
  'জ্যাকেট': ['jacket', 'jackets', 'hoodie', 'হুডি'],

  // Ring & Jewelry
  ring: ['finger ring', 'আংটি', 'রিং', 'jewelry'],
  'আংটি': ['ring', 'finger ring', 'গহনা'],
  'রিং': ['ring', 'finger ring'],
  jewellery: ['jewelry', 'necklace', 'earrings', 'bridal', 'ornaments', 'গহনা', 'জুয়েলারি', 'জুয়েলারি', 'নেকলেস', 'হার', 'দুল'],
  jewelry: ['jewellery', 'necklace', 'earrings', 'bridal', 'ornaments', 'গহনা', 'জুয়েলারি', 'জুয়েলারি', 'নেকলেস', 'হার'],
  necklace: ['jewellery', 'jewelry', 'গহনা', 'নেকলেস', 'হার', 'গলার হার'],
  earrings: ['jewellery', 'jewelry', 'কানের দুল', 'দুল'],
  'গহনা': ['jewellery', 'jewelry', 'necklace', 'earrings', 'জুয়েলারি', 'জুয়েলারি', 'নেকলেস', 'হার'],
  'জুয়েলারি': ['jewellery', 'jewelry', 'গহনা', 'নেকলেস', 'হার'],
  'জুয়েলারি': ['jewellery', 'jewelry', 'গহনা', 'নেকলেস', 'হার'],
  'নেকলেস': ['necklace', 'jewellery', 'jewelry', 'গলার হার', 'হার', 'গহনা'],
  'হার': ['necklace', 'jewellery', 'নেকলেস', 'গহনা'],
  'দুল': ['earrings', 'jewellery', 'কানের দুল', 'গহনা'],
  'কানের দুল': ['earrings', 'jewellery', 'দুল', 'গহনা'],

  // Borka & Abaya
  borka: ['borkha', 'burqa', 'burkha', 'abaya', 'hijab', 'koti', 'বোরকা', 'বোরখা', 'আবায়া', 'হিজাব', 'কটি'],
  borkha: ['borka', 'abaya', 'hijab', 'burqa', 'বোরকা', 'বোরখা'],
  abaya: ['borka', 'borkha', 'hijab', 'burqa', 'আবায়া', 'বোরকা'],
  burqa: ['borka', 'abaya', 'hijab', 'বোরকা'],
  hijab: ['borka', 'abaya', 'হিজাব', 'স্কার্ফ'],
  'বোরকা': ['borka', 'borkha', 'abaya', 'hijab', 'koti', 'burqa', 'বোরখা', 'আবায়া', 'হিজাব'],
  'বোরখা': ['borka', 'abaya', 'hijab', 'বোরকা', 'আবায়া'],
  'আবায়া': ['borka', 'abaya', 'hijab', 'বোরকা'],
  'হিজাব': ['hijab', 'borka', 'abaya', 'বোরকা', 'আবায়া'],

  // Heating Belt
  belt: ['heating belt', 'period belt', 'waist belt', 'heating pad', 'massager', 'বেল্ট', 'হিটিং বেল্ট', 'কোমর বেল্ট'],
  'heating belt': ['belt', 'period belt', 'waist belt', 'হিটিং বেল্ট', 'বেল্ট', 'কোমর বেল্ট'],
  'period belt': ['belt', 'heating belt', 'পিরিয়ড বেল্ট', 'হিটিং বেল্ট'],
  'বেল্ট': ['belt', 'heating belt', 'কোমর বেল্ট', 'হিটিং বেল্ট'],
  'হিটিং বেল্ট': ['belt', 'heating belt', 'period belt', 'কোমর বেল্ট', 'বেল্ট'],
  'কোমর বেল্ট': ['belt', 'heating belt', 'বেল্ট'],

  // Shoe & Footwear
  shoe: ['shoes', 'জুতা', 'জুতো', 'sneakers', 'লোফার', 'sandal'],
  shoes: ['shoe', 'জুতা', 'জুতো', 'sneakers', 'লোফার', 'sandal'],
  'জুতা': ['shoe', 'shoes', 'sneakers', 'স্যান্ডেল'],
  'জুতো': ['shoe', 'shoes', 'sneakers', 'স্যান্ডেল'],
  juta: ['shoe', 'shoes', 'জুতা', 'জুতো', 'sneakers', 'sandal', 'লোফার'],
  juto: ['shoe', 'shoes', 'জুতা', 'জুতো', 'sneakers', 'sandal'],

  // Bag & Backpack
  bag: ['handbag', 'backpack', 'ব্যাগ', 'লেডিস ব্যাগ'],
  'ব্যাগ': ['bag', 'handbag', 'backpack'],

  // Fabric & Materials
  cotton: ['কটন', 'সুতি', 'সুতি কাপড়', 'সুতী'],
  'সুতি': ['cotton', 'কটন', 'সুতি কাপড়'],
  silk: ['সিল্ক', 'কাতান', 'রেশম'],
  'সিল্ক': ['silk', 'katan', 'কাতান'],

  // Lights & LED
  light: ['led', 'lamp', 'বাতি', 'লাইট', 'ল্যাম্প', 'night light'],
  'বাতি': ['light', 'led', 'lamp', 'লাইট'],
  'লাইট': ['light', 'led', 'বাতি'],

  // Bed & Home
  chador: ['bedsheet', 'চাদর', 'বেডশিট', 'কম্বল'],
  bedsheet: ['chador', 'চাদর', 'বেডশিট', 'bed cover'],
  'চাদর': ['bedsheet', 'chador', 'বেডশিট'],
  'বেডশিট': ['bedsheet', 'chador', 'চাদর'],

  // Eyewear
  choshma: ['sunglasses', 'সানগ্লাস', 'চশমা', 'eyewear'],
  sunglasses: ['choshma', 'সানগ্লাস', 'চশমা'],
  'চশমা': ['sunglasses', 'choshma', 'সানগ্লাস'],

  // Audio & Earphones
  headphone: ['headphones', 'earphone', 'earbuds', 'হেডফোন', 'ইয়ারফোন', 'hedfon', 'tws', 'airpods'],
  headphones: ['headphone', 'earphone', 'earbuds', 'হেডফোন'],
  'হেডফোন': ['headphone', 'headphones', 'earphone', 'ইয়ারফোন', 'hedfon', 'earbuds', 'tws'],
  hedfon: ['headphone', 'headphones', 'earphone', 'হেডফোন', 'ইয়ারফোন'],
};

/**
 * Normalizes text for case-insensitive, Bengali Unicode unified, and punctuation-free matching
 */
export function normalizeSearchTerm(term: string): string {
  return (term || '')
    .toLowerCase()
    .trim()
    .replace(/\u09A1\u09BC/g, '\u09DC') // ড + ় -> ড়
    .replace(/\u09A2\u09BC/g, '\u09DD') // ঢ + ় -> ঢ়
    .replace(/\u09AF\u09BC/g, '\u09DF') // য + ় -> য়
    .replace(/[,\-_/\\|.;:!?'"()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Returns expanded query terms including bilingual synonyms
 */
export function expandQueryTerms(rawQuery: string): string[] {
  const normalized = normalizeSearchTerm(rawQuery);
  if (!normalized) return [];

  // Filter out single-character tokens so they don't match every single letter
  const individualWords = normalized.split(' ').filter((w) => w.length >= 2);
  const unhyphenated = rawQuery.toLowerCase().replace(/[-\s]+/g, '').trim();

  const termsSet = new Set<string>();
  if (normalized.length >= 2) termsSet.add(normalized);
  if (unhyphenated.length >= 2) termsSet.add(unhyphenated);
  individualWords.forEach((w) => termsSet.add(w));

  // Check synonym dictionary for full phrase, unhyphenated, and individual words
  const lookups = [normalized, unhyphenated, ...individualWords];
  for (const item of lookups) {
    if (item && item.length >= 2 && SYNONYM_DICTIONARY[item]) {
      SYNONYM_DICTIONARY[item].forEach((syn) => {
        const normSyn = normalizeSearchTerm(syn);
        if (normSyn && normSyn.length >= 2) termsSet.add(normSyn);
      });
    }
  }

  return Array.from(termsSet).filter((t) => Boolean(t) && t.length >= 2);
}

/**
 * Evaluates relevance score for a product against a search query
 * Higher score = higher ranking in search results
 */
export function calculateSearchScore(product: Product, searchQuery: string): number {
  if (!searchQuery || searchQuery.trim() === '') return 1;

  const normalizedQuery = normalizeSearchTerm(searchQuery);
  if (!normalizedQuery) return 1;

  const queryTerms = expandQueryTerms(searchQuery);
  const words = normalizedQuery.split(' ').filter((w) => w.length >= 2);

  const title = normalizeSearchTerm(product.title || '');
  const brand = normalizeSearchTerm(product.brand || '');
  const sku = normalizeSearchTerm(product.sku || '');
  const tagsStr = normalizeSearchTerm(Array.isArray(product.tags) ? product.tags.join(' ') : (product.tags || ''));
  const subCategory = normalizeSearchTerm(product.sub_category || '');

  let score = 0;

  // Exact full query match in title (Highest priority)
  if (title.includes(normalizedQuery)) {
    score += 120;
    if (title.startsWith(normalizedQuery)) score += 30;
  }

  // Exact full query match in tags
  if (tagsStr.includes(normalizedQuery)) {
    score += 100;
  }

  // SKU exact or prefix match
  if (sku && (sku === normalizedQuery || sku.includes(normalizedQuery))) {
    score += 150;
  }

  // Brand exact match
  if (brand && brand.includes(normalizedQuery)) {
    score += 80;
  }

  // Subcategory match
  if (subCategory && subCategory.includes(normalizedQuery)) {
    score += 60;
  }

  // All individual words matched across corpus
  const fullCorpus = `${title} ${subCategory} ${brand} ${tagsStr} ${sku}`;
  const matchedWordsCount = words.filter((w) => fullCorpus.includes(w)).length;
  if (words.length > 0 && matchedWordsCount === words.length) {
    score += 50;
  } else {
    score += matchedWordsCount * 15;
  }

  // Any expanded synonym matched
  for (const term of queryTerms) {
    if (fullCorpus.includes(term)) {
      score += 25;
    }
  }

  return score;
}

/**
 * Smart product search evaluator
 * Matches across: Title, Description, Brand, Category, Fabric, Material, Tags, SKU
 */
export function matchesProductSearch(product: Product, searchQuery: string): boolean {
  if (!searchQuery || searchQuery.trim() === '') return true;
  return calculateSearchScore(product, searchQuery) > 0;
}

/**
 * Rank and filter products by search relevance
 */
export function rankAndFilterProducts(products: Product[], searchQuery: string): Product[] {
  if (!searchQuery || searchQuery.trim() === '') return products;
  return products
    .map((p) => ({ product: p, score: calculateSearchScore(p, searchQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.product);
}

/**
 * Helper to fetch all live products (combining local custom products and initial data)
 */
export function getAllLiveProducts(initialProducts: Product[] = []): Product[] {
  try {
    const savedCustom: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
    const cleanCustom = savedCustom.filter((p) => p && p.id && !p.id.startsWith('prod-'));
    
    let baseList = initialProducts;
    if (!baseList || baseList.length === 0) {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('kintesi_initial_products');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              baseList = parsed;
            }
          } catch {}
        }
      }
    }

    // Combine custom and fallback, prioritizing custom products
    const customIds = new Set(cleanCustom.map((p) => p.id));
    const combined = [...cleanCustom, ...baseList.filter((p) => !customIds.has(p.id))];
    return combined;
  } catch (e) {
    return initialProducts;
  }
}

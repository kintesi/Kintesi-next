import { Product } from '../types';

// Common Bengali-English eCommerce Synonym Dictionaries
const SYNONYM_DICTIONARY: Record<string, string[]> = {
  sharee: ['saree', 'sari', 'শাড়ি', 'শাড়ি', 'শাড়ী', 'শাড়ী', 'saree', 'kota', 'women', 'পোশাক', 'মহিলা'],
  saree: ['sharee', 'sari', 'শাড়ি', 'শাড়ি', 'শাড়ী', 'kota', 'women', 'পোশাক', 'মহিলা'],
  sari: ['sharee', 'saree', 'শাড়ি', 'শাড়ি', 'women'],
  'শাড়ি': ['sharee', 'saree', 'sari', 'শাড়ি', 'শাড়ী', 'women'],
  'শাড়ি': ['sharee', 'saree', 'sari', 'শাড়ি', 'women'],
  'শাড়ী': ['sharee', 'saree', 'sari', 'শাড়ি', 'women'],
  kapor: ['fabric', 'cloth', 'dress', 'শাড়ি', 'কাপড়', 'কাপড়', 'পোশাক'],
  'কাপড়': ['kapor', 'fabric', 'cloth', 'dress', 'শাড়ি', 'পোশাক'],
  'কাপড়': ['kapor', 'fabric', 'cloth', 'dress', 'শাড়ি', 'পোশাক'],
  panjabi: ['punjabi', 'পাঞ্জাবি', 'পাঞ্জাবী', 'kurta', 'men'],
  punjabi: ['panjabi', 'পাঞ্জাবি', 'পাঞ্জাবী', 'kurta', 'men'],
  'পাঞ্জাবি': ['panjabi', 'punjabi', 'পাঞ্জাবী', 'men'],
  'পাঞ্জাবী': ['panjabi', 'punjabi', 'পাঞ্জাবি', 'men'],
  kurti: ['kurtis', 'কুর্তি', 'kamiz', 'কামিজ', 'three piece', 'থ্রি পিস'],
  kurtis: ['kurti', 'কুর্তি', 'kamiz', 'কামিজ'],
  'কুর্তি': ['kurti', 'kurtis', 'kamiz', 'কামিজ'],
  tshirt: ['t-shirt', 'tee', 'টি-শার্ট', 'টি শার্ট', 'polo'],
  't-shirt': ['tshirt', 'tee', 'টি-শার্ট', 'টি শার্ট', 'polo'],
  'টি-শার্ট': ['tshirt', 't-shirt', 'tee', 'polo'],
  phone: ['smartphone', 'mobile', 'ফোন', 'মোবাইল', 'স্মার্টফোন', 'iphone', 'samsung', 'xiaomi'],
  mobile: ['phone', 'smartphone', 'ফোন', 'মোবাইল', 'স্মার্টফোন'],
  smartphone: ['phone', 'mobile', 'ফোন', 'মোবাইল'],
  'ফোন': ['phone', 'mobile', 'smartphone', 'মোবাইল'],
  'মোবাইল': ['phone', 'mobile', 'smartphone', 'ফোন'],
  laptop: ['computer', 'ল্যাপটপ', 'ম্যাকবুক', 'macbook', 'notebook'],
  'ল্যাপটপ': ['laptop', 'computer', 'macbook', 'notebook'],
  // Watch
  watch: ['watches', 'smartwatch', 'wristwatch', 'ঘড়ি', 'ঘড়ি', 'হাতের ঘড়ি', 'হাত ঘড়ি', 'হাতঘড়ি', 'ঘড়ী'],
  watches: ['watch', 'smartwatch', 'wristwatch', 'ঘড়ি', 'ঘড়ি'],
  smartwatch: ['watch', 'wristwatch', 'ঘড়ি', 'ঘড়ি'],
  wristwatch: ['watch', 'smartwatch', 'ঘড়ি', 'ঘড়ি'],
  'ঘড়ি': ['watch', 'watches', 'smartwatch', 'wristwatch', 'ঘড়ি', 'হাতের ঘড়ি'],
  'ঘড়ি': ['watch', 'watches', 'smartwatch', 'wristwatch', 'ঘড়ি', 'হাতের ঘড়ি'],
  'হাত ঘড়ি': ['watch', 'wristwatch', 'ঘড়ি', 'ঘড়ি'],
  'হাতঘড়ি': ['watch', 'wristwatch', 'ঘড়ি', 'ঘড়ি'],

  // Fan
  fan: ['fans', 'turbo fan', 'handheld fan', 'portable fan', 'rechargeable fan', 'mini fan', 'cooler', 'ফ্যান', 'হাত ফ্যান', 'চার্জার ফ্যান', 'রিচার্জেবল ফ্যান'],
  fans: ['fan', 'turbo fan', 'rechargeable fan', 'ফ্যান'],
  'turbo fan': ['fan', 'handheld fan', 'ফ্যান', 'টার্বো ফ্যান'],
  'handheld fan': ['fan', 'portable fan', 'হাত ফ্যান', 'মিনি ফ্যান'],
  'rechargeable fan': ['fan', 'চার্জার ফ্যান', 'রিচার্জেবল ফ্যান', 'ফ্যান'],
  'ফ্যান': ['fan', 'fans', 'turbo fan', 'rechargeable fan', 'হাত ফ্যান', 'চার্জার ফ্যান', 'বাতাস'],
  'হাত ফ্যান': ['fan', 'handheld fan', 'portable fan', 'ফ্যান'],
  'চার্জার ফ্যান': ['fan', 'rechargeable fan', 'ফ্যান'],

  // Mouse
  mouse: ['mice', 'wireless mouse', 'gaming mouse', 'bluetooth mouse', 'মাউস', 'ওয়্যারলেস মাউস', 'কম্পিউটার মাউস'],
  mice: ['mouse', 'wireless mouse', 'মাউস'],
  'wireless mouse': ['mouse', 'bluetooth mouse', 'ওয়্যারলেস মাউস', 'মাউস'],
  'মাউস': ['mouse', 'mice', 'wireless mouse', 'gaming mouse', 'ওয়্যারলেস মাউস'],
  'ওয়্যারলেস মাউস': ['mouse', 'wireless mouse', 'মাউস'],

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

  // Jewellery & Necklace
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

  shoe: ['shoes', 'জুতা', 'জুতো', 'sneakers', 'লোফার', 'sandal'],
  shoes: ['shoe', 'জুতা', 'জুতো', 'sneakers', 'লোফার', 'sandal'],
  'জুতা': ['shoe', 'shoes', 'sneakers', 'স্যান্ডেল'],
  'জুতো': ['shoe', 'shoes', 'sneakers', 'স্যান্ডেল'],
  bag: ['handbag', 'backpack', 'ব্যাগ', 'লেডিস ব্যাগ'],
  'ব্যাগ': ['bag', 'handbag', 'backpack'],
  cotton: ['কটন', 'সুতি', 'সুতি কাপড়', 'সুতী'],
  'সুতি': ['cotton', 'কটন', 'সুতি কাপড়'],
  silk: ['সিল্ক', 'কাতান', 'রেশম'],
  'সিল্ক': ['silk', 'katan', 'কাতান'],
};

/**
 * Normalizes text for case-insensitive and punctuation-free matching
 */
export function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[,\-_/\\|.;:!?'"()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Returns expanded query terms including bilingual synonyms
 */
export function expandQueryTerms(rawQuery: string): string[] {
  const normalized = normalizeSearchTerm(rawQuery);
  if (!normalized) return [];

  const individualWords = normalized.split(' ').filter(Boolean);
  const termsSet = new Set<string>([normalized, ...individualWords]);

  // Check each word in the synonym dictionary
  for (const word of individualWords) {
    if (SYNONYM_DICTIONARY[word]) {
      SYNONYM_DICTIONARY[word].forEach((syn) => termsSet.add(syn.toLowerCase()));
    }
  }

  // Also check the full phrase
  if (SYNONYM_DICTIONARY[normalized]) {
    SYNONYM_DICTIONARY[normalized].forEach((syn) => termsSet.add(syn.toLowerCase()));
  }

  return Array.from(termsSet);
}

/**
 * Smart product search evaluator
 * Matches across: Title, Description, Brand, Category, Fabric, Material, Tags, Highlights, SKU
 */
export function matchesProductSearch(product: Product, searchQuery: string): boolean {
  if (!searchQuery || searchQuery.trim() === '') return true;

  const queryTerms = expandQueryTerms(searchQuery);

  const tagsList = Array.isArray(product.tags)
    ? product.tags
    : typeof product.tags === 'string'
    ? [product.tags]
    : [];

  const highlightsList = Array.isArray(product.highlights)
    ? product.highlights
    : typeof product.highlights === 'string'
    ? [product.highlights]
    : [];

  // Compile all searchable text from the product
  const searchableTextParts: string[] = [
    product.title || '',
    product.slug || '',
    product.brand || '',
    product.category_id || '',
    product.sub_category || '',
    product.description || '',
    product.fabric || '',
    product.material || '',
    product.fit_type || '',
    product.origin || '',
    product.sku || '',
    product.gender || '',
    ...tagsList,
    ...highlightsList,
    ...(product.specifications ? Object.values(product.specifications) : []),
  ];

  const fullSearchableCorpus = searchableTextParts.join(' ').toLowerCase();

  // If any of the expanded query terms or original words match the corpus
  return queryTerms.some((term) => fullSearchableCorpus.includes(term));
}

/**
 * Helper to fetch all live products (combining local custom products and initial data)
 */
export function getAllLiveProducts(initialProducts: Product[] = []): Product[] {
  try {
    const savedCustom: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
    const cleanCustom = savedCustom.filter((p) => p && p.id && !p.id.startsWith('prod-'));
    
    // Combine custom and fallback, prioritizing custom products
    const customIds = new Set(cleanCustom.map((p) => p.id));
    const combined = [...cleanCustom, ...initialProducts.filter((p) => !customIds.has(p.id))];
    return combined;
  } catch (e) {
    return initialProducts;
  }
}

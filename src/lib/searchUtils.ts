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
  watch: ['smartwatch', 'ঘড়ি', 'ঘড়ি', 'হাতের ঘড়ি'],
  smartwatch: ['watch', 'ঘড়ি', 'ঘড়ি'],
  'ঘড়ি': ['watch', 'smartwatch', 'ঘড়ি'],
  'ঘড়ি': ['watch', 'smartwatch', 'ঘড়ি'],
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

  // Compile all searchable text from the product
  const searchableTextParts: string[] = [
    product.title || '',
    product.slug || '',
    product.brand || '',
    product.category_id || '',
    product.description || '',
    product.fabric || '',
    product.material || '',
    product.fit_type || '',
    product.origin || '',
    product.sku || '',
    product.gender || '',
    ...(product.tags || []),
    ...(product.highlights || []),
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

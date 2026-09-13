import { Product } from '../types';

export interface UserInterestProfile {
  categories: Record<string, number>; // categoryId -> weight
  keywords: Record<string, number>;   // keyword -> weight
  brands: Record<string, number>;     // brand -> weight
  viewedProductIds: string[];         // recently viewed product IDs
  lastUpdated: number;
}

const STORAGE_KEY = 'kintesi_user_interests';
const SEARCH_INTENT_KEY = 'kintesi_detected_search_intent';
const MAX_RECENT_PRODUCTS = 25;

/**
 * Extracts and normalizes search terms/keywords (Bengali & English)
 */
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'our', 'all',
    'buy', 'best', 'online', 'price', 'bd', 'bangladesh', 'in', 'on', 'at',
    'কি', 'বা', 'এবং', 'এর', 'একটি', 'দাম', 'কিনুন', 'অনলাইন', 'বাংলাদেশ'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF]/gi, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !stopWords.has(w));
}

/**
 * Safely retrieves user interest profile from localStorage
 */
export function getUserInterestProfile(): UserInterestProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        categories: parsed.categories || {},
        keywords: parsed.keywords || {},
        brands: parsed.brands || {},
        viewedProductIds: parsed.viewedProductIds || [],
        lastUpdated: parsed.lastUpdated || Date.now(),
      };
    }
  } catch {}

  return {
    categories: {},
    keywords: {},
    brands: {},
    viewedProductIds: [],
    lastUpdated: Date.now(),
  };
}

/**
 * Saves updated user interest profile
 */
export function saveUserInterestProfile(profile: UserInterestProfile): void {
  try {
    profile.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {}
}

/**
 * Saves active high-priority search intent keywords (e.g. from Google search or site search)
 */
export function saveSearchIntent(terms: string[]): void {
  try {
    if (!terms || terms.length === 0) return;
    const existing = getSavedSearchIntent();
    const merged = Array.from(new Set([...terms, ...existing])).slice(0, 20);
    localStorage.setItem(SEARCH_INTENT_KEY, JSON.stringify(merged));
  } catch {}
}

/**
 * Retrieves active search intent keywords
 */
export function getSavedSearchIntent(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_INTENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

/**
 * Clears saved search intent
 */
export function clearSearchIntent(): void {
  try {
    localStorage.removeItem(SEARCH_INTENT_KEY);
  } catch {}
}

/**
 * Detects search intent from:
 * 1. Landing URL query parameters (Google Ads, Google organic search results, campaign links: ?q=, ?query=, ?utm_term=, ?keyword=, ?search=)
 * 2. Search engine referrer URLs (e.g. google.com/search?q=..., bing.com?q=..., yahoo.com?p=...)
 */
export function detectAndSaveSearchIntent(): string[] {
  if (typeof window === 'undefined') return [];
  const detected: string[] = [];

  // 1. Landing URL query parameters
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const searchKeys = ['q', 'query', 'search', 'utm_term', 'keyword', 'term', 's', 'ref_query', 'product'];
    for (const key of searchKeys) {
      const val = urlParams.get(key);
      if (val) {
        detected.push(...extractKeywords(val));
      }
    }
  } catch {}

  // 2. Search engine referrer URLs
  try {
    if (document.referrer) {
      const refUrl = new URL(document.referrer);
      const isSearchEngine = /google\.|bing\.|yahoo\.|duckduckgo\.|ecosia\.|ask\./i.test(refUrl.hostname);
      if (isSearchEngine) {
        const refParams = new URLSearchParams(refUrl.search);
        const refKeys = ['q', 'query', 'p', 'search', 'wd', 'text'];
        for (const key of refKeys) {
          const val = refParams.get(key);
          if (val) {
            detected.push(...extractKeywords(val));
          }
        }
      }
    }
  } catch {}

  if (detected.length > 0) {
    saveSearchIntent(detected);
    const profile = getUserInterestProfile();
    for (const term of detected) {
      profile.keywords[term] = (profile.keywords[term] || 0) + 10;
    }
    saveUserInterestProfile(profile);
    return detected;
  }

  return getSavedSearchIntent();
}

/**
 * Tracks when a user views a product or inspects product media/images/video
 */
export function trackProductView(product: Product, isMediaInteraction = false): void {
  if (!product || !product.id) return;
  const profile = getUserInterestProfile();

  const boost = isMediaInteraction ? 3 : 2;

  // Category weight
  if (product.category_id) {
    profile.categories[product.category_id] = (profile.categories[product.category_id] || 0) + boost;
  }

  // Brand weight
  if (product.brand) {
    const b = product.brand.toLowerCase().trim();
    profile.brands[b] = (profile.brands[b] || 0) + boost;
  }

  // Title keywords
  if (product.title) {
    const words = extractKeywords(product.title);
    for (const w of words) {
      profile.keywords[w] = (profile.keywords[w] || 0) + 1;
    }
  }

  // Tags
  if (product.tags && Array.isArray(product.tags)) {
    for (const t of product.tags) {
      const cleanTag = t.toLowerCase().trim();
      if (cleanTag) {
        profile.keywords[cleanTag] = (profile.keywords[cleanTag] || 0) + boost;
      }
    }
  }

  // Prepend to recently viewed
  profile.viewedProductIds = [
    product.id,
    ...profile.viewedProductIds.filter((id) => id !== product.id),
  ].slice(0, MAX_RECENT_PRODUCTS);

  saveUserInterestProfile(profile);
}

/**
 * Tracks search query terms entered by user
 */
export function trackSearchQuery(query: string): void {
  if (!query || !query.trim()) return;
  const profile = getUserInterestProfile();
  const terms = extractKeywords(query);

  if (terms.length > 0) {
    saveSearchIntent(terms);
    for (const t of terms) {
      profile.keywords[t] = (profile.keywords[t] || 0) + 8;
    }
    saveUserInterestProfile(profile);
  }
}

/**
 * Tracks user viewing or filtering a category
 */
export function trackCategoryView(categoryId: string): void {
  if (!categoryId) return;
  const profile = getUserInterestProfile();
  profile.categories[categoryId] = (profile.categories[categoryId] || 0) + 3;
  saveUserInterestProfile(profile);
}

/**
 * Deterministic pseudo-random 32-bit hash for stable periodic shuffling
 */
function getPseudoHash(str: string, seed: number): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Evaluates how strongly a product matches active search intent (Google search / query terms)
 */
function evaluateSearchIntentMatch(product: Product, intentTerms: string[]): { isMatch: boolean; intentScore: number } {
  if (!intentTerms || intentTerms.length === 0) return { isMatch: false, intentScore: 0 };

  const titleLower = (product.title || '').toLowerCase();
  const categoryLower = (product.category_id || '').toLowerCase();
  const brandLower = (product.brand || '').toLowerCase();
  const skuLower = (product.sku || '').toLowerCase();
  const descLower = (product.description || '').toLowerCase();
  const tagsLower = Array.isArray(product.tags) ? product.tags.map((t) => t.toLowerCase()) : [];

  let matchCount = 0;
  let totalScore = 0;

  for (const term of intentTerms) {
    const t = term.toLowerCase().trim();
    if (!t) continue;

    // Direct Title match: Top Priority
    if (titleLower.includes(t)) {
      totalScore += 2500;
      matchCount++;
    }

    // SKU match
    if (skuLower.includes(t)) {
      totalScore += 2000;
      matchCount++;
    }

    // Tags match
    if (tagsLower.some((tag) => tag.includes(t))) {
      totalScore += 1800;
      matchCount++;
    }

    // Category match
    if (categoryLower.includes(t)) {
      totalScore += 1400;
      matchCount++;
    }

    // Brand match
    if (brandLower.includes(t)) {
      totalScore += 1200;
      matchCount++;
    }

    // Description match
    if (descLower.includes(t)) {
      totalScore += 600;
      matchCount++;
    }
  }

  return {
    isMatch: matchCount > 0,
    intentScore: totalScore,
  };
}

/**
 * Personalizes and dynamically rotates product listing:
 * 1. Intent Match (e.g. what the user searched for on Google / site) ALWAYS APPEARS 1ST!
 * 2. Behavioral History (viewed categories, brands, high ratings, discounts)
 * 3. Dynamic periodic rotation so returning visitors experience variety
 * 
 * @param products Full list of products
 * @param rotationIntervalHours How often product order reshuffles (default: 2 hours)
 */
export function getPersonalizedAndRotatedProducts(
  products: Product[],
  rotationIntervalHours = 2
): Product[] {
  if (!products || products.length === 0) return [];

  // Active search intent terms (from Google / URL / recent searches)
  const activeIntentTerms = detectAndSaveSearchIntent();
  const profile = getUserInterestProfile();

  const hasInterests =
    Object.keys(profile.categories).length > 0 ||
    Object.keys(profile.keywords).length > 0 ||
    Object.keys(profile.brands).length > 0;

  // Time slice seed: changes every `rotationIntervalHours`
  const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * rotationIntervalHours));

  const rankedProducts = products.map((prod) => {
    let score = 0;

    // 1. TOP PRIORITY: Search Intent from Google or Site Search
    // Matches here are given a massive boost (+20,000 to +50,000) so they always appear 1st!
    const { isMatch, intentScore } = evaluateSearchIntentMatch(prod, activeIntentTerms);
    if (isMatch) {
      score += 20000 + intentScore;
    }

    // 2. Behavioral Personalization match
    if (hasInterests) {
      if (prod.category_id && profile.categories[prod.category_id]) {
        score += profile.categories[prod.category_id] * 5;
      }
      if (prod.brand && profile.brands[prod.brand.toLowerCase().trim()]) {
        score += profile.brands[prod.brand.toLowerCase().trim()] * 4;
      }
      if (prod.title) {
        const titleWords = extractKeywords(prod.title);
        for (const w of titleWords) {
          if (profile.keywords[w]) {
            score += profile.keywords[w] * 2;
          }
        }
      }
      if (prod.tags && Array.isArray(prod.tags)) {
        for (const t of prod.tags) {
          const cleanTag = t.toLowerCase().trim();
          if (cleanTag && profile.keywords[cleanTag]) {
            score += profile.keywords[cleanTag] * 3;
          }
        }
      }
    }

    // 3. High-converting boosts
    if (prod.is_trending) score += 3;
    if (prod.rating && prod.rating >= 4.5) score += 2;
    if (prod.discount_price && prod.discount_price < prod.price) score += 2.5;

    // 4. Dynamic time-based rotational variance
    // Shifts positions smoothly every few hours so returning visitors see variety
    const rotationFactor = (getPseudoHash(prod.id, timeSeed) % 100) / 10;
    const finalScore = score * 2.5 + rotationFactor;

    return { product: prod, score: finalScore };
  });

  rankedProducts.sort((a, b) => b.score - a.score);

  return rankedProducts.map((item) => item.product);
}

import { Product } from '../types';

export interface UserInterestProfile {
  categories: Record<string, number>; // categoryId -> weight
  keywords: Record<string, number>;   // keyword -> weight
  brands: Record<string, number>;     // brand -> weight
  viewedProductIds: string[];         // recently viewed product IDs
  lastUpdated: number;
}

const STORAGE_KEY = 'kintesi_user_interests';
const MAX_RECENT_PRODUCTS = 25;

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
    const words = product.title.toLowerCase().replace(/[^\w\s\u0980-\u09FF]/gi, ' ').split(/\s+/);
    for (const w of words) {
      if (w.length > 2) {
        profile.keywords[w] = (profile.keywords[w] || 0) + 1;
      }
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

  const terms = query.toLowerCase().replace(/[^\w\s\u0980-\u09FF]/gi, ' ').split(/\s+/);
  for (const t of terms) {
    if (t.length > 1) {
      profile.keywords[t] = (profile.keywords[t] || 0) + 3;
    }
  }

  saveUserInterestProfile(profile);
}

/**
 * Tracks user viewing or filtering a category
 */
export function trackCategoryView(categoryId: string): void {
  if (!categoryId) return;
  const profile = getUserInterestProfile();
  profile.categories[categoryId] = (profile.categories[categoryId] || 0) + 2;
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
 * Personalizes and dynamically rotates product listing
 * - Matches user interest history (categories, brands, search keywords)
 * - Automatically changes order every `rotationIntervalHours` so the homepage stays fresh
 * 
 * @param products Full list of products
 * @param rotationIntervalHours How often product order reshuffles (default: 2 hours)
 */
export function getPersonalizedAndRotatedProducts(
  products: Product[],
  rotationIntervalHours = 2
): Product[] {
  if (!products || products.length === 0) return [];

  const profile = getUserInterestProfile();
  const hasInterests =
    Object.keys(profile.categories).length > 0 ||
    Object.keys(profile.keywords).length > 0 ||
    Object.keys(profile.brands).length > 0;

  // Time slice seed: changes every `rotationIntervalHours`
  const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * rotationIntervalHours));

  const rankedProducts = products.map((prod) => {
    let score = 0;

    // 1. Behavioral Personalization match
    if (hasInterests) {
      if (prod.category_id && profile.categories[prod.category_id]) {
        score += profile.categories[prod.category_id] * 5;
      }
      if (prod.brand && profile.brands[prod.brand.toLowerCase().trim()]) {
        score += profile.brands[prod.brand.toLowerCase().trim()] * 4;
      }
      if (prod.title) {
        const titleWords = prod.title.toLowerCase().replace(/[^\w\s\u0980-\u09FF]/gi, ' ').split(/\s+/);
        for (const w of titleWords) {
          if (w.length > 2 && profile.keywords[w]) {
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

    // 2. High-converting boosts
    if (prod.is_trending) score += 3;
    if (prod.rating && prod.rating >= 4.5) score += 2;
    if (prod.discount_price && prod.discount_price < prod.price) score += 2.5;

    // 3. Dynamic time-based rotational variance
    // Shifts positions smoothly every few hours so returning visitors see variety
    const rotationFactor = (getPseudoHash(prod.id, timeSeed) % 100) / 10;
    const finalScore = score * 2.5 + rotationFactor;

    return { product: prod, score: finalScore };
  });

  rankedProducts.sort((a, b) => b.score - a.score);

  return rankedProducts.map((item) => item.product);
}

import { Product } from '../types';
import { supabase, isDatabaseConnected } from './supabase';
import { expandQueryTerms } from './searchUtils';

/**
 * ---------------------------------------------------------------------------
 * 1. PERSISTENT ANONYMOUS SESSION ID (First-party cookie with fallback)
 * ---------------------------------------------------------------------------
 */
const COOKIE_NAME = 'kintesi_rec_session_id';
const STORAGE_KEY_FALLBACK = 'kintesi_rec_session_fallback';
const CACHE_PROFILE_KEY = 'kintesi_user_interests';
const SEARCH_INTENT_KEY = 'kintesi_detected_search_intent';

/**
 * Retrieves or establishes a persistent anonymous session ID via first-party cookie.
 */
export function getOrCreateSessionId(): string {
  if (typeof document === 'undefined') {
    return 'ssr_session';
  }

  // 1. Try reading first-party cookie
  const match = document.cookie.match(new RegExp('(^| )' + COOKIE_NAME + '=([^;]+)'));
  if (match && match[2] && match[2].length > 8) {
    return match[2];
  }

  // 2. Try reading from fallback localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FALLBACK);
    if (saved && saved.length > 8) {
      setSessionCookie(saved);
      return saved;
    }
  } catch {}

  // 3. Generate new persistent UUID v4 session ID
  const newSessionId = 's_' + crypto.randomUUID();
  setSessionCookie(newSessionId);

  try {
    localStorage.setItem(STORAGE_KEY_FALLBACK, newSessionId);
  } catch {}

  return newSessionId;
}

function setSessionCookie(sessionId: string): void {
  if (typeof document === 'undefined') return;
  const expiryDays = 365;
  const date = new Date();
  date.setTime(date.getTime() + expiryDays * 24 * 60 * 60 * 1000);
  document.cookie = `${COOKIE_NAME}=${sessionId}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * ---------------------------------------------------------------------------
 * 2. WEIGHTED EVENT HIERARCHY & TYPES
 * ---------------------------------------------------------------------------
 */
export type InteractionEventType =
  | 'view'
  | 'media_interaction'
  | 'add_to_wishlist'
  | 'add_to_cart'
  | 'purchase';

export const EVENT_WEIGHTS: Record<InteractionEventType, number> = {
  view: 1.0,
  media_interaction: 1.5,
  add_to_wishlist: 3.0,
  add_to_cart: 5.0,
  purchase: 10.0,
};

export interface UserInterestProfile {
  categories: Record<string, number>; // categoryId -> weight
  keywords: Record<string, number>;   // keyword -> weight
  brands: Record<string, number>;     // brand -> weight
  viewedProductIds: string[];         // recently viewed product IDs
  lastUpdated: number;
}

/**
 * Extracts and normalizes search terms/keywords (Bengali & English)
 */
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'our', 'all',
    'buy', 'best', 'online', 'price', 'bd', 'bangladesh', 'in', 'on', 'at',
    'কি', 'বা', 'এবং', 'এর', 'একটি', 'দাম', 'কিনুন', 'অনলাইন', 'বাংলাদেশ',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF]/gi, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !stopWords.has(w));
}

/**
 * ---------------------------------------------------------------------------
 * 3. WRITE-THROUGH LOCAL CACHE (Instant 0ms UI Rendering Layer)
 * ---------------------------------------------------------------------------
 */
export function getUserInterestProfile(): UserInterestProfile {
  try {
    const raw = localStorage.getItem(CACHE_PROFILE_KEY);
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

export function saveUserInterestProfile(profile: UserInterestProfile): void {
  try {
    profile.lastUpdated = Date.now();
    localStorage.setItem(CACHE_PROFILE_KEY, JSON.stringify(profile));
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('kintesi_intent_updated'));
      }, 50);
    }
  } catch {}
}

/**
 * ---------------------------------------------------------------------------
 * 4. EVENT DISPATCHER & ASYNCHRONOUS SUPABASE PERSISTENCE
 * ---------------------------------------------------------------------------
 */
let eventBuffer: Array<{
  session_id: string;
  user_id: string | null;
  event_type: InteractionEventType;
  product_id: string;
  weight: number;
  metadata: Record<string, any>;
  created_at: string;
}> = [];

let flushTimeout: any = null;

/**
 * Flushes buffered interaction events to Supabase user_events table in batches.
 */
async function flushEvents(): Promise<void> {
  if (eventBuffer.length === 0 || !isDatabaseConnected) return;

  const toSend = [...eventBuffer];
  eventBuffer = [];

  try {
    const { error } = await supabase.from('user_events').insert(toSend);
    if (error) {
      console.warn('[RecEngine] Event batch flush warning:', error.message);
    }
  } catch (err) {
    console.warn('[RecEngine] Error sending events:', err);
  }
}

function scheduleFlush(): void {
  if (flushTimeout) return;
  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushEvents();
  }, 1500); // 1.5s batch window
}

/**
 * Canonical interaction tracking function
 */
export function trackInteractionEvent(
  eventType: InteractionEventType,
  product: { id: string; category_id?: string; brand?: string; title?: string },
  metadata: Record<string, any> = {}
): void {
  if (!product || !product.id) return;

  const sessionId = getOrCreateSessionId();
  let currentUserId: string | null = null;
  try {
    const authData = localStorage.getItem('sb-jhewkxwfujkigvbmybry-auth-token');
    if (authData) {
      const parsed = JSON.parse(authData);
      currentUserId = parsed?.user?.id || null;
    }
  } catch {}

  const weight = EVENT_WEIGHTS[eventType] || 1.0;

  // 1. Write-through to local cache immediately for zero-latency UI
  const profile = getUserInterestProfile();
  if (product.category_id) {
    profile.categories[product.category_id] = (profile.categories[product.category_id] || 0) + weight;
  }
  if (product.brand) {
    const b = product.brand.toLowerCase().trim();
    if (b !== 'no brand' && b !== 'generic' && b !== 'kintesi') {
      profile.brands[b] = (profile.brands[b] || 0) + weight;
    }
  }
  if (product.title) {
    const words = extractKeywords(product.title);
    for (const w of words) {
      profile.keywords[w] = (profile.keywords[w] || 0) + Math.min(weight, 3.0);
    }
  }
  profile.viewedProductIds = [
    product.id,
    ...profile.viewedProductIds.filter((id) => id !== product.id),
  ].slice(0, 30);
  saveUserInterestProfile(profile);

  // 2. Buffer for server-side persistence in user_events
  eventBuffer.push({
    session_id: sessionId,
    user_id: currentUserId,
    event_type: eventType,
    product_id: product.id,
    weight,
    metadata,
    created_at: new Date().toISOString(),
  });

  scheduleFlush();
}

/**
 * Public tracking shortcuts matching buying intent hierarchy
 */
export function trackProductView(product: Product): void {
  trackInteractionEvent('view', product);
}

export function trackMediaInteraction(productId: string, mediaType: 'zoom' | 'video' | 'gallery'): void {
  trackInteractionEvent('media_interaction', { id: productId }, { media_type: mediaType });
}

export function trackWishlistAdd(product: { id: string; category_id?: string; brand?: string; title?: string }): void {
  trackInteractionEvent('add_to_wishlist', product);
}

export function trackCartAdd(
  product: { id: string; category_id?: string; brand?: string; title?: string },
  quantity = 1
): void {
  trackInteractionEvent('add_to_cart', product, { quantity });
}

export function trackPurchase(
  orderId: string,
  items: Array<{ id: string; category_id?: string; brand?: string; title?: string; quantity?: number; price?: number }>,
  totalAmount: number
): void {
  items.forEach((item) => {
    trackInteractionEvent('purchase', item, {
      order_id: orderId,
      quantity: item.quantity || 1,
      price: item.price || 0,
      total_amount: totalAmount,
    });
  });
  flushEvents(); // Immediate flush for critical purchase events
}

export function trackCategoryView(categoryId: string): void {
  if (!categoryId || categoryId === 'all') return;
  const profile = getUserInterestProfile();
  profile.categories[categoryId] = (profile.categories[categoryId] || 0) + 1.2;
  saveUserInterestProfile(profile);
}

export function trackSearchQuery(query: string): void {
  if (!query) return;
  const terms = extractKeywords(query);
  if (terms.length > 0) {
    saveSearchIntent(terms);
    const profile = getUserInterestProfile();
    for (const t of terms) {
      profile.keywords[t] = (profile.keywords[t] || 0) + 2.0;
    }
    saveUserInterestProfile(profile);
  }
}

/**
 * ---------------------------------------------------------------------------
 * 5. SESSION MERGE ON AUTHENTICATION
 * ---------------------------------------------------------------------------
 */
export async function mergeAnonymousSessionOnAuth(userId: string): Promise<void> {
  if (!isDatabaseConnected || !userId) return;
  const sessionId = getOrCreateSessionId();

  try {
    const { data, error } = await supabase.rpc('merge_anonymous_session_to_user', {
      p_session_id: sessionId,
      p_user_id: userId,
    });

    if (!error) {
      console.log('[RecEngine] Anonymous session merged successfully with user:', userId);
    }
  } catch (err) {
    console.warn('[RecEngine] Session merge error:', err);
  }
}

/**
 * ---------------------------------------------------------------------------
 * 6. SEARCH INTENT HANDLING
 * ---------------------------------------------------------------------------
 */
export function saveSearchIntent(terms: string[]): void {
  try {
    if (!terms || terms.length === 0) return;
    let existing: string[] = [];
    const raw = localStorage.getItem(SEARCH_INTENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) existing = parsed;
    }
    // Prepend new terms to the front, avoiding duplicates
    const merged = Array.from(new Set([...terms, ...existing.filter((t) => !terms.includes(t))])).slice(0, 20);
    localStorage.setItem(SEARCH_INTENT_KEY, JSON.stringify(merged));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kintesi_intent_updated'));
    }
  } catch {}
}

export function getSavedSearchIntent(): string[] {
  // 1. In-session explicit search has highest priority
  try {
    const raw = localStorage.getItem(SEARCH_INTENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3);
      }
    }
  } catch {}

  // 2. Active URL parameters (Direct user action / ad campaign intent)
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const siteSearch = params.get('search');
      if (siteSearch) {
        const words = extractKeywords(siteSearch);
        if (words.length > 0) return words;
      }

      const utmTerm = params.get('utm_term') || params.get('utm_content') || params.get('utm_campaign');
      if (utmTerm) {
        const words = extractKeywords(utmTerm);
        if (words.length > 0) return words;
      }
    } catch {}
  }

  return [];
}

export function clearSearchIntent(): void {
  try {
    localStorage.removeItem(SEARCH_INTENT_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kintesi_intent_updated'));
    }
  } catch {}
}

export function detectAndSaveSearchIntent(): string[] {
  const intentTerms: string[] = [];

  try {
    if (typeof window !== 'undefined') {
      const ref = document.referrer;
      if (ref) {
        try {
          const refUrl = new URL(ref);
          // YouTube (search_query), Google (q), Bing (q), Yahoo (p), DuckDuckGo (q), Yandex (text), Baidu (wd)
          const q =
            refUrl.searchParams.get('q') ||
            refUrl.searchParams.get('search_query') ||
            refUrl.searchParams.get('query') ||
            refUrl.searchParams.get('p') ||
            refUrl.searchParams.get('text') ||
            refUrl.searchParams.get('wd');
          if (q) intentTerms.push(...extractKeywords(q));
        } catch {}
      }

      const params = new URLSearchParams(window.location.search);
      const utmTerm = params.get('utm_term') || params.get('utm_content') || params.get('utm_campaign');
      if (utmTerm) intentTerms.push(...extractKeywords(utmTerm));

      const siteSearch = params.get('search');
      if (siteSearch) intentTerms.push(...extractKeywords(siteSearch));
    }
  } catch {}

  if (intentTerms.length > 0) {
    saveSearchIntent(intentTerms);
  }

  return getSavedSearchIntent();
}

/**
 * ---------------------------------------------------------------------------
 * 7. REAL-TIME HYBRID RECOMMENDATIONS (Edge Function + Offline Heuristic Fallback)
 * ---------------------------------------------------------------------------
 */
export interface HybridRecommendationOptions {
  userId?: string;
  categoryId?: string;
  searchQuery?: string;
  utmTerm?: string;
  limit?: number;
  variantId?: string;
}

export interface HybridRecommendationResult {
  products: Product[];
  requestId: string;
  variantId: string;
  latencyMs: number;
  isColdStart: boolean;
  modelVersion: string;
}

/**
 * Calls Supabase Edge Function for v2 hybrid recommendations.
 */
export async function fetchHybridRecommendations(
  options: HybridRecommendationOptions = {}
): Promise<HybridRecommendationResult | null> {
  if (!isDatabaseConnected) return null;

  try {
    const sessionId = getOrCreateSessionId();

    const { data, error } = await supabase.functions.invoke('recommendations', {
      body: {
        userId: options.userId,
        sessionId,
        categoryId: options.categoryId,
        searchQuery: options.searchQuery,
        utmTerm: options.utmTerm,
        limit: options.limit || 24,
        variantId: options.variantId,
      },
    });

    if (error || !data || !Array.isArray(data.data)) {
      return null;
    }

    return {
      products: data.data,
      requestId: data.requestId || 'offline',
      variantId: data.variantId || 'v2_hybrid_default',
      latencyMs: data.latencyMs || 0,
      isColdStart: Boolean(data.isColdStart),
      modelVersion: data.modelVersion || 'v2.0',
    };
  } catch (err) {
    console.warn('[RecEngine] Edge Function retrieval fallback:', err);
    return null;
  }
}

/**
 * Asynchronously logs click, cart_add, or purchase against request_id and position.
 */
export async function trackRecommendationTelemetry(
  requestId: string,
  productId: string,
  action: 'impression' | 'click' | 'wishlist' | 'cart_add' | 'purchase',
  position: number,
  variantId = 'v2_hybrid_default'
): Promise<void> {
  if (!isDatabaseConnected || !requestId || requestId === 'offline') return;

  try {
    const sessionId = getOrCreateSessionId();
    await supabase.from('recommendation_telemetry').insert([
      {
        request_id: requestId,
        session_id: sessionId,
        product_id: productId,
        position,
        action,
        variant_id: variantId,
        model_version: 'v2.0',
      },
    ]);
  } catch {}
}

// Backward compatibility aliases
export const fetchVectorRecommendations = fetchHybridRecommendations;
export const trackRecommendationAction = trackRecommendationTelemetry;

export function calculateProductRelevanceScore(
  prod: Product,
  intentTerms: string[] | Set<string> = getSavedSearchIntent(),
  profile: UserInterestProfile = getUserInterestProfile()
): number {
  if (!prod) return 0;
  let score = 0;
  const text = (
    (prod as any)._searchKey ||
    `${prod.title || ''} ${prod.sub_category || ''} ${prod.category_id || ''} ${prod.brand || ''} ${Array.isArray(prod.tags) ? prod.tags.join(' ') : (prod.tags || '')}`
  ).toLowerCase();

  if (intentTerms) {
    const isSet = intentTerms instanceof Set;
    const termSet = isSet ? (intentTerms as Set<string>) : new Set<string>();
    if (!isSet) {
      for (const t of intentTerms as string[]) {
        if (!t) continue;
        const clean = t.toLowerCase().trim();
        termSet.add(clean);
        expandQueryTerms(clean).forEach((e) => termSet.add(e.toLowerCase().trim()));
      }
    }
    for (const t of termSet) {
      if (t && text.includes(t)) score += 500;
    }
  }

  if (prod.category_id && profile.categories[prod.category_id]) {
    score += profile.categories[prod.category_id] * 50;
  }
  if (prod.brand && profile.brands[prod.brand.toLowerCase().trim()]) {
    score += profile.brands[prod.brand.toLowerCase().trim()] * 30;
  }
  return score;
}

/**
 * Amazon / Daraz Style: "Recommended For You" (আপনার পছন্দ হতে পারে)
 * Personalizes specifically based on the user's browsing history, category affinities,
 * and search keywords, or falls back to top-converting trending deals for new visitors.
 */
export function getRecommendedForYou(allProducts: Product[], limit = 12): Product[] {
  if (!allProducts || allProducts.length === 0) return [];
  const profile = getUserInterestProfile();
  const hasInterests =
    Object.keys(profile.categories).length > 0 ||
    Object.keys(profile.keywords).length > 0 ||
    profile.viewedProductIds.length > 0;

  const viewedSet = new Set(profile.viewedProductIds);

  if (hasInterests) {
    // Score products based on user's demonstrated category, brand & keyword interests
    const scored = allProducts
      .filter((p) => p && p.id && !viewedSet.has(p.id)) // Recommend items they haven't viewed yet
      .map((p) => {
        let score = 0;
        if (p.category_id && profile.categories[p.category_id]) {
          score += profile.categories[p.category_id] * 50;
        }
        if (p.brand && profile.brands[p.brand.toLowerCase().trim()]) {
          score += profile.brands[p.brand.toLowerCase().trim()] * 30;
        }
        const text = ((p as any)._searchKey || `${p.title || ''} ${p.tags || ''} ${p.sub_category || ''}`).toLowerCase();
        for (const [kw, w] of Object.entries(profile.keywords)) {
          if (text.includes(kw.toLowerCase())) score += w * 25;
        }
        if (p.is_trending) score += 15;
        if (p.is_featured) score += 10;
        if (p.rating && p.rating >= 4.5) score += 10;
        if (p.discount_price && p.discount_price < p.price) score += 5;
        return { product: p, score };
      })
      .filter((item) => item.score > 20);

    if (scored.length >= 4) {
      scored.sort((a, b) => b.score - a.score || a.product.id.localeCompare(b.product.id));
      return scored.slice(0, limit).map((item) => item.product);
    }
  }

  // Cold-start fallback: Top trending, high-rated deals across popular categories
  const topPicks = [...allProducts]
    .filter((p) => p.is_trending || p.is_featured || (p.rating && p.rating >= 4.5))
    .sort((a, b) => {
      const scoreA = (a.rating || 0) * 10 + (a.is_trending ? 15 : 0) + (a.is_featured ? 10 : 0);
      const scoreB = (b.rating || 0) * 10 + (b.is_trending ? 15 : 0) + (b.is_featured ? 10 : 0);
      return scoreB - scoreA || a.id.localeCompare(b.id);
    });

  return topPicks.slice(0, limit);
}

/**
 * Amazon / Daraz Style: "Recently Viewed Items" (সম্প্রতি দেখা পণ্য)
 * Preserves the exact chronological order of products the user explored.
 */
export function getRecentlyViewedProducts(allProducts: Product[], limit = 12): Product[] {
  if (!allProducts || allProducts.length === 0) return [];
  const profile = getUserInterestProfile();
  if (!profile.viewedProductIds || profile.viewedProductIds.length === 0) return [];

  const productMap = new Map<string, Product>();
  for (const p of allProducts) {
    if (p && p.id) productMap.set(p.id, p);
  }

  const result: Product[] = [];
  for (const id of profile.viewedProductIds) {
    const prod = productMap.get(id);
    if (prod) {
      result.push(prod);
      if (result.length >= limit) break;
    }
  }
  return result;
}

/**
 * Amazon / Daraz Style: "Customers Who Viewed This Also Viewed" (সম্পর্কিত পণ্য)
 * Computes deep relevance against the active product using subcategory, tags, and category match.
 */
export function getRelatedProducts(currentProduct: Product, allProducts: Product[], limit = 10): Product[] {
  if (!currentProduct || !allProducts || allProducts.length === 0) return [];

  const currentTags = new Set(
    (Array.isArray(currentProduct.tags) ? currentProduct.tags : [])
      .map((t) => t.toLowerCase().trim())
  );
  const currentSubCat = (currentProduct.sub_category || '').toLowerCase().trim();

  const scored = allProducts
    .filter((p) => p && p.id && p.id !== currentProduct.id)
    .map((p) => {
      let score = 0;
      const subCat = (p.sub_category || '').toLowerCase().trim();
      if (currentSubCat && subCat && currentSubCat === subCat) {
        score += 120; // Exact sub-category match is the strongest signal
      }
      if (p.category_id && currentProduct.category_id && p.category_id === currentProduct.category_id) {
        score += 40;
      }
      if (Array.isArray(p.tags)) {
        for (const t of p.tags) {
          if (currentTags.has(t.toLowerCase().trim())) score += 25;
        }
      }
      if (p.is_trending) score += 10;
      if (p.is_featured) score += 5;
      if (p.rating && p.rating >= 4.5) score += 5;

      // Price range proximity bonus (±40% price bracket)
      if (p.price && currentProduct.price) {
        const ratio = p.price / currentProduct.price;
        if (ratio >= 0.6 && ratio <= 1.4) score += 15;
      }

      return { product: p, score };
    })
    .filter((item) => item.score > 0);

  scored.sort((a, b) => b.score - a.score || a.product.id.localeCompare(b.product.id));
  return scored.slice(0, limit).map((item) => item.product);
}

export function getBaseProductTitle(title?: string): string {
  if (!title) return '';
  return title
    .replace(/\s*\([^)]*\)\s*$/g, '') // remove trailing (Green), (Golden)
    .replace(/\s*–\s*.*$/g, '') // remove trailing subtitle
    .toLowerCase()
    .trim();
}

// Session-locked feed cache:
// Stays strictly frozen during the entire SPA browser session as the user navigates from page to page.
// ONLY changes when the browser window is reloaded (F5 / hard refresh)!
let _sessionLockedCatalogFeed: Product[] | null = null;
let _sessionLockedSeed: number = Math.floor(Math.random() * 1000000) + 1;

export function getSessionSeed(): number {
  return _sessionLockedSeed;
}

export function invalidateSessionFeed() {
  _sessionLockedCatalogFeed = null;
  _sessionLockedSeed = Math.floor(Math.random() * 1000000) + 1;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('kintesi_initial_products');
    } catch {}
    window.dispatchEvent(new CustomEvent('kintesi_session_feed_refreshed'));
  }
}

/**
 * Amazon / Daraz Style: Rich Mixed & Diverse Catalog Feed ("Just For You" / "সকল পণ্য")
 * 1. Product Sanity: Filters out products without real images (e.g. logo placeholder) or without descriptions.
 * 2. Base-title deduplication: Prevents 8 copies of the same watch or 15 copies of the same bra.
 * 3. Reload-seeded freshness: Reloading the page produces a fresh mix with rotated categories, but while in the app, the order is 100% frozen.
 * 4. Round-robin category interleaving: Every row has a diverse mix of all categories.
 */
export function getCuratedCatalogFeed(products: Product[], reloadSeed?: number): Product[] {
  if (!products || products.length === 0) return [];

  // Filter out any product without genuine images or valid descriptions
  const validProducts = products.filter((p) => {
    if (!p || !p.id || !p.title) return false;
    if (typeof p.id === 'string' && p.id.startsWith('prod-')) return false;
    const desc = typeof p.description === 'string' ? p.description.trim() : '';
    if (desc.length < 5) return false;
    const imgs: string[] = Array.isArray(p.images) ? p.images : [];
    return imgs.some(
      (img) =>
        typeof img === 'string' &&
        img.trim().length > 5 &&
        !img.includes('/logo.webp') &&
        !img.includes('placeholder')
    );
  });

  if (validProducts.length === 0) return [];

  // If already computed for full catalog for this browser session, return it immediately without any reshuffle!
  if (_sessionLockedCatalogFeed && _sessionLockedCatalogFeed.length >= validProducts.length) {
    return _sessionLockedCatalogFeed;
  }

  const effectiveSeed = reloadSeed || _sessionLockedSeed;

  // Deterministic pseudo-random shuffle using effectiveSeed (changes on reload, 100% stable while in app)
  function pseudoShuffle<T>(arr: T[], seed: number): T[] {
    const res = [...arr];
    let s = seed;
    for (let i = res.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const rnd = s / 233280;
      const j = Math.floor(rnd * (i + 1));
      [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
  }

  // 1. Group products by base title so variant duplicates (e.g. 8 colors of the same watch or 15 bras)
  // are distributed across separate layers rather than clustered together or discarded.
  // This preserves all catalog products while ensuring 100% diversity!
  const variantGroups = new Map<string, Product[]>();
  for (const p of validProducts) {
    if (!p || !p.id) continue;
    const base = getBaseProductTitle(p.title) || p.id;
    if (!variantGroups.has(base)) variantGroups.set(base, []);
    variantGroups.get(base)!.push(p);
  }

  // Decompose into progressive layers:
  // Layer 0 contains 1 of every unique product in the store (1,700+ unique products).
  // Layer 1 has the 2nd variant, Layer 2 has the 3rd, etc.
  const layers: Product[][] = [];
  let hasMoreVariants = true;
  let pass = 0;
  while (hasMoreVariants) {
    hasMoreVariants = false;
    const layer: Product[] = [];
    for (const list of variantGroups.values()) {
      if (pass < list.length) {
        layer.push(list[pass]);
        if (pass + 1 < list.length) hasMoreVariants = true;
      }
    }
    if (layer.length > 0) layers.push(layer);
    pass++;
  }

  const BASE_CATEGORY_CYCLE = [
    'electronic-accessories',
    'womens-fashion',
    'home-living',
    'mens-fashion',
    'watches-bags',
    'computer-gaming',
    'mother-baby',
    'health-beauty',
    'tv-home-appliances',
    'automotives-motorbikes',
  ];

  // Rotate starting category on each reload seed so initial view is noticeably fresh and exciting
  const catOffset = effectiveSeed > 0 ? effectiveSeed % BASE_CATEGORY_CYCLE.length : 0;
  const CATEGORY_CYCLE = [
    ...BASE_CATEGORY_CYCLE.slice(catOffset),
    ...BASE_CATEGORY_CYCLE.slice(0, catOffset),
  ];

  const mixedFeed: Product[] = [];

  for (let lIdx = 0; lIdx < layers.length; lIdx++) {
    const layer = layers[lIdx];
    const categoryBuckets = new Map<string, Product[]>();
    for (const cat of CATEGORY_CYCLE) {
      categoryBuckets.set(cat, []);
    }
    const otherBucket: Product[] = [];

    for (const p of layer) {
      const cat = p.category_id;
      if (cat && categoryBuckets.has(cat)) {
        categoryBuckets.get(cat)!.push(p);
      } else {
        otherBucket.push(p);
      }
    }

    const preparedBuckets = new Map<string, Product[]>();
    for (const [cat, items] of categoryBuckets.entries()) {
      let processedItems = items;
      if (effectiveSeed !== undefined && effectiveSeed > 0) {
        processedItems = pseudoShuffle(items, effectiveSeed + lIdx * 19);
      } else {
        processedItems.sort((a, b) => {
          const scoreA =
            (a.is_trending ? 30 : 0) +
            (a.is_featured ? 20 : 0) +
            (a.rating || 0) +
            (a.discount_price && a.discount_price < a.price ? 5 : 0);
          const scoreB =
            (b.is_trending ? 30 : 0) +
            (b.is_featured ? 20 : 0) +
            (b.rating || 0) +
            (b.discount_price && b.discount_price < b.price ? 5 : 0);
          return scoreB - scoreA || a.id.localeCompare(b.id);
        });
      }

      // Sub-group by sub_category
      const subGroups = new Map<string, Product[]>();
      for (const item of processedItems) {
        const sub = (item.sub_category || item.title.slice(0, 15) || 'general').toLowerCase().trim();
        if (!subGroups.has(sub)) subGroups.set(sub, []);
        subGroups.get(sub)!.push(item);
      }

      // Interleave sub-categories inside this category
      const diversifiedCategoryList: Product[] = [];
      const subLists = Array.from(subGroups.values());
      let hasMoreSub = true;
      let subRound = 0;

      while (hasMoreSub) {
        hasMoreSub = false;
        for (const list of subLists) {
          if (subRound < list.length) {
            diversifiedCategoryList.push(list[subRound]);
            hasMoreSub = true;
          }
        }
        subRound++;
      }

      preparedBuckets.set(cat, diversifiedCategoryList);
    }

    const preparedOther =
      effectiveSeed !== undefined && effectiveSeed > 0
        ? pseudoShuffle(otherBucket, effectiveSeed + lIdx * 31)
        : otherBucket;

    const activeBuckets = CATEGORY_CYCLE.map((c) => preparedBuckets.get(c));
    let round = 0;
    let moreInLayer = true;

    while (moreInLayer) {
      moreInLayer = false;
      for (const bucket of activeBuckets) {
        if (bucket && round < bucket.length) {
          mixedFeed.push(bucket[round]);
          moreInLayer = true;
        }
      }
      if (round < preparedOther.length) {
        mixedFeed.push(preparedOther[round]);
        moreInLayer = true;
      }
      round++;
    }
  }

  if (validProducts.length >= 100) {
    _sessionLockedCatalogFeed = mixedFeed;
  }

  return mixedFeed;
}

/**
 * Backwards compatible stable feed generator.
 * If reloadSeed is passed, applies fresh deterministic mix on reload.
 * When on the page, seed remains static so products NEVER change while user is browsing.
 */
export function getPersonalizedAndRotatedProducts(
  products: Product[],
  _rotationIntervalHours = 2,
  _explicitIntentTerms?: string[],
  reloadSeed?: number
): Product[] {
  return getCuratedCatalogFeed(products, reloadSeed);
}

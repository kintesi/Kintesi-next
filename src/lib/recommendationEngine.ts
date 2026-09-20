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
    profile.brands[b] = (profile.brands[b] || 0) + weight;
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

/**
 * ---------------------------------------------------------------------------
 * 8. ZERO-LATENCY FALLBACK & INSTANT UI HYBRID ROTATOR
 * ---------------------------------------------------------------------------
 */
function getPseudoHash(str: string, seed: number): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Calculates a comprehensive relevance score for a product based on active search intent
 * and the user's historical interaction profile.
 */
export function calculateProductRelevanceScore(
  prod: Product,
  intentTerms: string[] = getSavedSearchIntent(),
  profile: UserInterestProfile = getUserInterestProfile()
): number {
  if (!prod) return 0;
  let score = 0;
  const tagsText = Array.isArray(prod.tags)
    ? prod.tags.join(' ')
    : typeof prod.tags === 'string'
    ? prod.tags
    : '';
  const text = `${prod.title || ''} ${prod.sub_category || ''} ${prod.category_id || ''} ${prod.brand || ''} ${prod.slug || ''} ${prod.description || ''} ${tagsText}`.toLowerCase();

  // 1. Explicit search intent boost (Top priority - overrides all default rankings)
  if (intentTerms && intentTerms.length > 0) {
    const allExpandedTerms = new Set<string>();
    for (const t of intentTerms) {
      if (!t) continue;
      const clean = t.toLowerCase().trim();
      allExpandedTerms.add(clean);
      const expanded = expandQueryTerms(clean);
      expanded.forEach((e) => allExpandedTerms.add(e.toLowerCase().trim()));
    }

    let matchCount = 0;
    for (const t of allExpandedTerms) {
      if (t && text.includes(t)) matchCount++;
    }
    if (matchCount > 0) {
      score += 100000 + matchCount * 5000;
    }
  }

  // 2. Keyword profile match
  if (profile.keywords) {
    for (const [kw, weight] of Object.entries(profile.keywords)) {
      if (kw && text.includes(kw.toLowerCase())) {
        score += weight * 150;
      }
    }
  }

  // 3. Category match
  if (prod.category_id && profile.categories && profile.categories[prod.category_id]) {
    score += profile.categories[prod.category_id] * 80;
  }

  // 4. Brand match
  if (prod.brand && profile.brands && profile.brands[prod.brand.toLowerCase().trim()]) {
    score += profile.brands[prod.brand.toLowerCase().trim()] * 60;
  }

  return score;
}

/**
 * Returns instantaneous personalized product list for UI render (0ms),
 * preserving existing contract and signature for callers in HomePage.tsx.
 */
export function getPersonalizedAndRotatedProducts(
  products: Product[],
  rotationIntervalHours = 2,
  explicitIntentTerms?: string[]
): Product[] {
  if (!products || products.length === 0) return [];

  const activeIntentTerms = explicitIntentTerms && explicitIntentTerms.length > 0
    ? explicitIntentTerms
    : getSavedSearchIntent();
  const profile = getUserInterestProfile();

  const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * rotationIntervalHours));

  const ranked = products.map((prod) => {
    let score = calculateProductRelevanceScore(prod, activeIntentTerms, profile);

    // High conversion factors
    if (prod.is_trending) score += 4;
    if (prod.is_featured) score += 3;
    if (prod.discount_price && prod.discount_price < prod.price) score += 2.5;

    // Subtle rotation
    const rotationFactor = (getPseudoHash(prod.id, timeSeed) % 100) / 10;
    return { product: prod, score: score * 2.5 + rotationFactor };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked.map((item) => item.product);
}

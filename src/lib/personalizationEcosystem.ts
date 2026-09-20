import { useState, useEffect, useCallback } from 'react';
import { supabase, isDatabaseConnected } from './supabase';
import { getOrCreateSessionId, trackWishlistAdd } from './recommendationEngine';
import { Product } from '../types';

export interface SocialProofData {
  viewersNow: number;
  recentlyPurchased24h: number;
  stockRemaining: number;
  isPopular: boolean;
  isLowStock: boolean;
  loading: boolean;
}

export interface BundleSuggestion {
  bundleItems: Product[];
  totalOriginalPrice: number;
  bundlePrice: number;
  savings: number;
  discountPercent: number;
  loading: boolean;
  error?: string | null;
}

export type CustomerSegmentType =
  | 'new_visitor'
  | 'browser_no_purchase'
  | 'repeat_customer'
  | 'high_value'
  | 'at_risk_churn'
  | 'price_sensitive';

export interface HomepageSlotRule {
  id: string;
  slot_key: string;
  segment: CustomerSegmentType;
  priority: number;
  banner_title?: string;
  banner_subtitle?: string;
  banner_image_url?: string;
  cta_text?: string;
  cta_link?: string;
  boosted_category_ids?: string[];
  recommendation_collection?: string;
}

export interface LoyaltyProfile {
  totalPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lifetimeSpent: number;
  loading: boolean;
}

/**
 * 1. REAL-TIME AUDITABLE SOCIAL PROOF HOOK
 * Queries Postgres get_product_social_proof RPC based on actual user_events
 * and catalog inventory.
 */
export function useSocialProof(productId?: string): SocialProofData {
  const [data, setData] = useState<Omit<SocialProofData, 'loading'>>({
    viewersNow: 0,
    recentlyPurchased24h: 0,
    stockRemaining: 0,
    isPopular: false,
    isLowStock: false,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!productId || !isDatabaseConnected) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchSocialProof() {
      try {
        const { data: rpcData, error } = await supabase.rpc('get_product_social_proof', {
          target_product_id: productId,
        });

        if (error) throw error;

        if (rpcData && rpcData[0] && isMounted) {
          const row = rpcData[0];
          const viewers = Number(row.viewers_now || 0);
          const purchases = Number(row.recently_purchased_24h || 0);
          const stock = Number(row.stock_remaining || 0);

          setData({
            viewersNow: viewers,
            recentlyPurchased24h: purchases,
            stockRemaining: stock,
            isPopular: viewers >= 3 || purchases >= 2,
            isLowStock: stock > 0 && stock <= 5,
          });
        }
      } catch {
        if (isMounted) {
          setData({
            viewersNow: 0,
            recentlyPurchased24h: 0,
            stockRemaining: 0,
            isPopular: false,
            isLowStock: false,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSocialProof();
    const interval = setInterval(fetchSocialProof, 45000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [productId]);

  return { ...data, loading };
}

/**
 * 2. FREQUENTLY BOUGHT TOGETHER / BUNDLE SUGGESTIONS HOOK
 * Calls the Supabase Edge Function `bundle-suggestions` which blends FBT pairs with
 * cold-start embedding fallback.
 */
export function useBundleSuggestions(
  productId?: string,
  catalogFallback: Product[] = []
): BundleSuggestion {
  const [bundleItems, setBundleItems] = useState<Product[]>([]);
  const [totalOriginalPrice, setTotalOriginalPrice] = useState(0);
  const [bundlePrice, setBundlePrice] = useState(0);
  const [savings, setSavings] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchBundles() {
      setLoading(true);
      try {
        if (!isDatabaseConnected) {
          throw new Error('Database not connected');
        }

        const { data: resData, error: fnError } = await supabase.functions.invoke(
          'bundle-suggestions',
          {
            body: {
              product_id: productId,
              limit: 2,
              discount_rate: 0.1, // 10% bundle discount
            },
          }
        );

        if (fnError || !resData || !resData.bundle_items) {
          throw fnError || new Error('No bundle data returned');
        }

        if (isMounted) {
          setBundleItems(resData.bundle_items);
          setTotalOriginalPrice(resData.total_original_price || 0);
          setBundlePrice(resData.bundle_price || 0);
          setSavings(resData.bundle_savings || 0);
          setDiscountPercent(Math.round((resData.bundle_discount_rate || 0.1) * 100));
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          const currentProd = catalogFallback.find((p) => p.id === productId);
          const alternates = catalogFallback
            .filter((p) => p.id !== productId && p.category_id !== currentProd?.category_id)
            .slice(0, 2);

          const origTotal = alternates.reduce((acc, it) => acc + Number(it.price || 0), 0);
          const discounted = Math.round(origTotal * 0.9);

          setBundleItems(alternates);
          setTotalOriginalPrice(origTotal);
          setBundlePrice(discounted);
          setSavings(origTotal - discounted);
          setDiscountPercent(10);
          setError(err?.message || 'Fallback used');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchBundles();

    return () => {
      isMounted = false;
    };
  }, [productId, catalogFallback]);

  return {
    bundleItems,
    totalOriginalPrice,
    bundlePrice,
    savings,
    discountPercent,
    loading,
    error,
  };
}

/**
 * 3. PERSONALIZED SEARCH RE-RANKING HOOK
 * Sends search queries and keyword candidate lists through the Edge Function
 * `search-rerank`, preserving exact matches while re-ordering relevant items.
 */
export function usePersonalizedSearch() {
  const [isReranking, setIsReranking] = useState(false);

  const rerankSearchResults = useCallback(
    async (
      query: string,
      candidates: Product[],
      userSessionId?: string,
      currentUserId?: string
    ): Promise<Product[]> => {
      if (!query.trim() || candidates.length <= 1 || !isDatabaseConnected) {
        return candidates;
      }

      setIsReranking(true);
      try {
        const sessionId = userSessionId || getOrCreateSessionId();
        const candidateIds = candidates.map((p) => p.id);

        const { data, error } = await supabase.functions.invoke('search-rerank', {
          body: {
            query,
            candidate_ids: candidateIds,
            session_id: sessionId,
            user_id: currentUserId || null,
          },
        });

        if (error || !data || !Array.isArray(data.ranked_ids)) {
          return candidates;
        }

        const idMap = new Map(candidates.map((p) => [p.id, p]));
        const reordered: Product[] = [];

        for (const id of data.ranked_ids) {
          const item = idMap.get(id);
          if (item) {
            reordered.push(item);
            idMap.delete(id);
          }
        }

        for (const remaining of idMap.values()) {
          reordered.push(remaining);
        }

        return reordered;
      } catch {
        return candidates;
      } finally {
        setIsReranking(false);
      }
    },
    []
  );

  return { rerankSearchResults, isReranking };
}

/**
 * 4. CUSTOMER SEGMENTATION HOOK
 */
export function useCustomerSegment(userId?: string) {
  const [segment, setSegment] = useState<CustomerSegmentType>('new_visitor');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function determineSegment() {
      if (!userId || !isDatabaseConnected) {
        if (isMounted) {
          setSegment('new_visitor');
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_segments')
          .select('segment')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;

        if (data && data.segment && isMounted) {
          setSegment(data.segment as CustomerSegmentType);
        } else if (isMounted) {
          setSegment('new_visitor');
        }
      } catch {
        if (isMounted) setSegment('new_visitor');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    determineSegment();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { segment, loading };
}

/**
 * 5. DYNAMIC HOMEPAGE MERCHANDISING HOOK
 */
export function useHomepageSlotRules(segment: CustomerSegmentType = 'new_visitor') {
  const [rules, setRules] = useState<HomepageSlotRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchRules() {
      if (!isDatabaseConnected) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('homepage_slot_rules')
          .select('*')
          .eq('is_active', true)
          .or(`segment.eq.${segment},segment.eq.new_visitor`)
          .order('priority', { ascending: false });

        if (error) throw error;

        if (isMounted && data) {
          setRules(data as HomepageSlotRule[]);
        }
      } catch {
        if (isMounted) setRules([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRules();

    return () => {
      isMounted = false;
    };
  }, [segment]);

  return { rules, loading };
}

/**
 * 6. WISHLIST & PRICE-DROP ALERT HELPER
 */
export async function trackWishlistWithPriceAlert(
  productId: string,
  currentPrice: number,
  userId?: string
) {
  trackWishlistAdd({ id: productId });

  if (!userId || !isDatabaseConnected) return;

  try {
    await supabase.from('wishlist_items').upsert(
      {
        user_id: userId,
        product_id: productId,
        price_at_add: currentPrice,
        notify_on_price_drop: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,product_id' }
    );
  } catch (err) {
    console.error('Failed to sync wishlist price alert:', err);
  }
}

/**
 * 7. LOYALTY & GAMIFICATION HOOK
 */
export function useLoyaltyPoints(userId?: string): LoyaltyProfile {
  const [profile, setProfile] = useState<Omit<LoyaltyProfile, 'loading'>>({
    totalPoints: 0,
    tier: 'bronze',
    lifetimeSpent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !isDatabaseConnected) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchLoyalty() {
      try {
        const { data, error } = await supabase
          .from('loyalty_points')
          .select('total_points, tier, lifetime_spent')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;

        if (data && isMounted) {
          setProfile({
            totalPoints: Number(data.total_points || 0),
            tier: data.tier || 'bronze',
            lifetimeSpent: Number(data.lifetime_spent || 0),
          });
        }
      } catch {
        // Fallback default
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLoyalty();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { ...profile, loading };
}

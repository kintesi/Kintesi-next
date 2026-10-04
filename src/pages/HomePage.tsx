import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getCategoriesFromDB, getProductsFromDB, getInitialProducts, getCachedTotalCount, getCachedProducts, isValidDisplayProduct } from '../lib/dbService';
import { Product, Category } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/mockData';
import { FLASH_SALE_PRODUCTS } from '../data/flashSaleProducts';
import { ProductCard } from '../components/common/ProductCard';
import { FlashSaleBanner } from '../components/home/FlashSaleBanner';
import { ShowcaseStrip } from '../components/home/ShowcaseStrip';
import { RecentlyViewedShelf } from '../components/home/RecentlyViewedShelf';
import { HeroBentoGrid } from '../components/home/HeroBentoGrid';
import { ExploreCategoryRow } from '../components/home/ExploreCategoryRow';
import { FlashSaleGrid } from '../components/home/FlashSaleGrid';
import { JustForYouSection } from '../components/home/JustForYouSection';
import { TrustFeaturesBar } from '../components/home/TrustFeaturesBar';
import { VoucherSubscription } from '../components/home/VoucherSubscription';
import { SecondaryTrustRow } from '../components/home/SecondaryTrustRow';
import { useSettings, ShowcaseSection, DEFAULT_SHOWCASES } from '../contexts/SettingsContext';
import {
  getPersonalizedAndRotatedProducts,
  getCuratedCatalogFeed,
  getSessionSeed,
  invalidateSessionFeed,
  detectAndSaveSearchIntent,
  extractKeywords,
  getSavedSearchIntent,
  clearSearchIntent,
} from '../lib/recommendationEngine';
import { matchesProductSearch } from '../lib/searchUtils';
import {
  ArrowRight,
  Sparkles,
  Flame,
  TrendingUp,
  ShieldCheck,
  Truck,
  RotateCcw,
  RotateCw,
  Headphones,
  ShoppingBag,
  Home,
  Shirt,
  Footprints,
  Smartphone,
  Laptop,
  Watch,
  HeartPulse,
  Dumbbell,
  Timer,
  CheckCircle2,
  ChevronRight,
  Star,
  Zap,
  Plus,
  Package,
  Tags,
} from 'lucide-react';
import { formatPrice, calculateDiscount } from '../lib/utils';

const ProductSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-3 space-y-2.5 animate-pulse shadow-xs">
    <div className="aspect-square bg-gray-100 rounded-xl w-full" />
    <div className="h-3.5 bg-gray-100 rounded-md w-3/4" />
    <div className="h-3 bg-gray-100 rounded-md w-1/2" />
    <div className="h-4 bg-gray-100 rounded-md w-1/3 pt-1" />
  </div>
);

const ICON_MAP: Record<string, any> = {
  ShoppingBag,
  Sparkles,
  Home,
  Shirt,
  Footprints,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  HeartPulse,
  Dumbbell,
  Tags,
};

// Global in-memory session variables to preserve visible counts across in-app page transitions
let _sessionMobileVisibleCount = 12;
let _sessionDesktopVisibleCount = 18;

export const HomePage: React.FC = () => {
  const location = useLocation();
  const { settings, isSettingsLoaded } = useSettings();
  const banners = settings.banners;

  const [products, setProducts] = useState<Product[]>(() => {
    // 1. In-memory cache is priority (prevents empty/reload state when returning from another page)
    const mem = getCachedProducts();
    if (mem && mem.length > 50) return mem.filter(isValidDisplayProduct);

    // 2. LocalStorage initial products
    try {
      const saved = localStorage.getItem('kintesi_initial_products') || localStorage.getItem('kintesi_custom_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        const valid = parsed.filter(isValidDisplayProduct);
        if (valid.length > 0) {
          const existingIds = new Set(valid.map((p: any) => p.id));
          const missingFlash = FLASH_SALE_PRODUCTS.filter((p) => isValidDisplayProduct(p) && !existingIds.has(p.id));
          return [...missingFlash, ...valid];
        }
      }
      return INITIAL_PRODUCTS.filter(isValidDisplayProduct);
    } catch {
      return INITIAL_PRODUCTS.filter(isValidDisplayProduct);
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('kintesi_custom_categories');
      if (saved) {
        return JSON.parse(saved);
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [feedRefreshCount, setFeedRefreshCount] = useState(0);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);

  // Progressive batch loading: preserves exact count when user returns from product detail or cart
  const [mobileVisibleCount, setMobileVisibleCount] = useState(() => _sessionMobileVisibleCount);
  const [desktopVisibleCount, setDesktopVisibleCount] = useState(() => _sessionDesktopVisibleCount);
  const [intentVersion, setIntentVersion] = useState<number>(0);
  const mobileSentinelRef = useRef<HTMLDivElement | null>(null);
  const desktopSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    _sessionMobileVisibleCount = mobileVisibleCount;
  }, [mobileVisibleCount]);

  useEffect(() => {
    _sessionDesktopVisibleCount = desktopVisibleCount;
  }, [desktopVisibleCount]);

  useEffect(() => {
    const handleIntentUpdate = () => setIntentVersion((v) => v + 1);
    window.addEventListener('kintesi_intent_updated', handleIntentUpdate);
    return () => window.removeEventListener('kintesi_intent_updated', handleIntentUpdate);
  }, []);

  useEffect(() => {
    const handleFeedRefresh = () => setFeedRefreshCount((c) => c + 1);
    window.addEventListener('kintesi_session_feed_refreshed', handleFeedRefresh);
    return () => window.removeEventListener('kintesi_session_feed_refreshed', handleFeedRefresh);
  }, []);

  const handleRefreshFeed = () => {
    setIsRefreshingFeed(true);
    invalidateSessionFeed();
    setFeedRefreshCount((c) => c + 1);
    setMobileVisibleCount(12);
    setDesktopVisibleCount(18);
    setTimeout(() => {
      setIsRefreshingFeed(false);
    }, 450);
  };

  // Flash sale countdown timer state
  const isInfinite = banners.flashSaleDurationType === 'infinite' || banners.flashSaleInfinite === true;

  const calculateFlashTime = () => {
    if (isInfinite) {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: false };
    }
    if (!banners.flashSaleEndsAt) {
      return { hours: banners.flashSaleHours || 4, minutes: 0, seconds: 0, isExpired: false };
    }
    const diff = new Date(banners.flashSaleEndsAt).getTime() - Date.now();
    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { hours, minutes, seconds, isExpired: false };
  };

  const [timeLeft, setTimeLeft] = useState(calculateFlashTime());

  useEffect(() => {
    setTimeLeft(calculateFlashTime());
  }, [banners.flashSaleEndsAt, banners.flashSaleHours, banners.flashSaleDurationType, banners.flashSaleInfinite, isInfinite]);

  useEffect(() => {
    if (isInfinite) return;
    const timer = setInterval(() => {
      setTimeLeft(calculateFlashTime());
    }, 1000);
    return () => clearInterval(timer);
  }, [banners.flashSaleEndsAt, banners.flashSaleHours, banners.flashSaleDurationType, banners.flashSaleInfinite, isInfinite]);

  const isFlashSaleActive = Boolean(
    isSettingsLoaded &&
    banners.showFlashSale === true &&
    (isInfinite || (!timeLeft.isExpired && (!banners.flashSaleEndsAt || new Date(banners.flashSaleEndsAt).getTime() > Date.now())))
  );

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        // Fast Phase 1: If no products rendered yet, immediately fetch initial screen batch (36 products) in ~40ms
        if (products.length === 0) {
          setIsLoadingData(true);
          const initialBatch = await getInitialProducts(36);
          if (!isCancelled && initialBatch && initialBatch.length > 0) {
            setProducts(initialBatch);
            setIsLoadingData(false);
          }
        }

        // Fast Phase 2: Stream categories and curated catalog in background without blocking UI
        const [cats, prods] = await Promise.all([
          getCategoriesFromDB(),
          getProductsFromDB({ all: true }),
        ]);
        if (!isCancelled) {
          if (cats && cats.length > 0) setCategories(cats);
          if (prods && prods.length > 0) setProducts(prods);
        }
      } catch (err) {
        console.warn('Home page data note:', err);
      } finally {
        if (!isCancelled) setIsLoadingData(false);
      }
    }

    loadData();
    detectAndSaveSearchIntent();
    window.addEventListener('kintesi_products_updated', loadData);
    window.addEventListener('kintesi_categories_updated', loadData);
    return () => {
      isCancelled = true;
      window.removeEventListener('kintesi_products_updated', loadData);
      window.removeEventListener('kintesi_categories_updated', loadData);
    };
  }, []);

  const hasValidSpotlight = Boolean(
    isSettingsLoaded &&
    banners.showSpotlight &&
    banners.spotlightTitle &&
    banners.spotlightTitle.trim().length > 0 &&
    (Number(banners.spotlightPrice) > 0 || Number(banners.spotlightDiscountPrice) > 0)
  );

  // 1. Featured Products:

  // Active Showcase sections (Trending, Featured, New Arrival, Flash Sale)
  // ONLY showcases explicitly enabled by admin will be shown.
  const activeShowcases = useMemo(() => {
    const rawList: ShowcaseSection[] = (banners.showcases && banners.showcases.length > 0)
      ? banners.showcases
      : DEFAULT_SHOWCASES;

    return rawList
      .filter((s) => Boolean(s.enabled) === true)
      .map((s) => {
        let showcaseProds: Product[] = [];
        if (s.productIds && s.productIds.length > 0) {
          showcaseProds = s.productIds
            .map((id) => products.find((p) => p.id === id) || FLASH_SALE_PRODUCTS.find((p) => p.id === id))
            .filter(Boolean) as Product[];
        }

        // Automatic smart fallback: ONLY if no specific products were manually selected AND type is NOT flash_sale
        // Strict rule: Flash Sale NEVER adds random fallback products!
        if (showcaseProds.length === 0 && (!s.productIds || s.productIds.length === 0)) {
          if (s.type === 'trending') {
            showcaseProds = products.filter((p) => p.is_trending).slice(0, 16);
            if (showcaseProds.length === 0) showcaseProds = products.slice(0, 16);
          } else if (s.type === 'featured') {
            showcaseProds = products.filter((p) => p.is_featured).slice(0, 16);
            if (showcaseProds.length === 0) showcaseProds = products.slice(0, 16);
          } else if (s.type === 'new_arrival') {
            showcaseProds = [...products].reverse().slice(0, 16);
          }
        }
        showcaseProds = showcaseProds.slice(0, 16);

        return {
          showcase: s,
          products: showcaseProds,
        };
      })
      .filter((item) => item.products.length > 0);
  }, [banners.showcases, products]);

  // Detected active search intent for visual confirmation badge
  const activeIntentBadge = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const utm = params.get('utm_term') || params.get('utm_content') || params.get('utm_campaign') || params.get('search');
    if (utm) return utm;
    const saved = getSavedSearchIntent();
    return saved && saved.length > 0 ? saved[0] : null;
  }, [location.search, intentVersion]);

  // Curated, diverse mixed catalog feed:
  // - On browser page reload: Fresh random seed produces a new exciting product mix
  // - While user navigates pages inside the app: Seed & feed are session-locked so products NEVER change or jump!
  const personalizedProducts = useMemo(() => {
    const uniqueMap = new Map<string, Product>();
    for (const p of products) {
      if (p && p.id && isValidDisplayProduct(p) && !uniqueMap.has(p.id)) {
        uniqueMap.set(p.id, p);
      }
    }
    const uniquePool = Array.from(uniqueMap.values());
    return getCuratedCatalogFeed(uniquePool, getSessionSeed());
  }, [products, feedRefreshCount]);

  const totalCatalogCount = useMemo(() => {
    return Math.max(personalizedProducts.length, getCachedTotalCount());
  }, [personalizedProducts.length]);

  const handleClearIntent = () => {
    clearSearchIntent();
    if (location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    setIntentVersion((v) => v + 1);
  };

  // Infinite scroll observer for Mobile (loads 6 items per batch strictly on viewport approach)
  useEffect(() => {
    const sentinel = mobileSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setMobileVisibleCount((prev) => {
            if (prev < totalCatalogCount) {
              return prev + 6;
            }
            return prev;
          });
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [totalCatalogCount]);

  return (
    <div className="pb-20 space-y-4 sm:space-y-6">
      {/* 1. Hero Bento Grid matching Stitch Mockup */}
      {banners.showBentoHero !== false && (
        <HeroBentoGrid
          mainBadge={banners.bentoMainBadge}
          mainTitle={banners.bentoMainTitle}
          mainSubtitle={banners.bentoMainSubtitle}
          mainTag1={banners.bentoMainTag1}
          mainTag2={banners.bentoMainTag2}
          mainTag3={banners.bentoMainTag3}
          mainPrice={banners.bentoMainPrice}
          mainOriginalPrice={banners.bentoMainOriginalPrice}
          mainSavings={banners.bentoMainSavings}
          mainClaimedText={banners.bentoMainClaimedText}
          mainImage={banners.bentoMainImage}
          mainLink={banners.bentoMainLink}
          topBadge={banners.bentoTopBadge}
          topTitle={banners.bentoTopTitle}
          topSubtitle={banners.bentoTopSubtitle}
          topLink={banners.bentoTopLink}
          topPrice={banners.bentoTopPrice}
          topImage={banners.bentoTopImage}
          bottomBadge={banners.bentoBottomBadge}
          bottomTitle={banners.bentoBottomTitle}
          bottomSubtitle={banners.bentoBottomSubtitle}
          bottomLink={banners.bentoBottomLink}
          bottomPrice={banners.bentoBottomPrice}
          bottomImage={banners.bentoBottomImage}
        />
      )}

      {/* 2. Trust Pillars Bar (64 Districts, 100% Genuine, 7-Day Free Replacement, 24/7 Care) */}
      <TrustFeaturesBar />

      {/* 3. Explore by Category (8 Pastel Circles + View All) */}
      <ExploreCategoryRow categories={categories} />

      {/* 4. Flash Sale Grid with Countdown Timer & Claim Deal CTAs */}
      {isFlashSaleActive && (
        <FlashSaleGrid
          products={FLASH_SALE_PRODUCTS.length > 0 ? FLASH_SALE_PRODUCTS : products}
          endsAt={banners.flashSaleEndsAt}
        />
      )}

      {/* 4b. Optional Custom Slider Banner if configured in Admin */}
      {isFlashSaleActive && banners.flashSaleSlides && banners.flashSaleSlides.length > 1 && (
        <section className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
          <FlashSaleBanner
            slides={banners.flashSaleSlides}
            defaultTag={banners.flashSaleTag}
            defaultTitle={banners.flashSaleTitle}
            defaultSubtitle={banners.flashSaleSubtitle}
            defaultBgImage={banners.flashSaleBgImage}
            defaultDesktopImage={banners.flashSaleDesktopImage}
            defaultMobileImage={banners.flashSaleMobileImage}
            defaultLink={banners.flashSaleLink || '/showcase/flash_sale'}
            theme={banners.flashSaleTheme}
            timeLeft={timeLeft}
            isMobile={false}
            bannerType={banners.flashSaleBannerType}
            showTimer={banners.flashSaleShowTimer === true}
          />
        </section>
      )}

      {/* 5. Active Showcase Strips (Trending, Featured, New Arrival) */}
      {activeShowcases.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
          {activeShowcases.map(({ showcase, products: showProds }) => (
            <ShowcaseStrip
              key={showcase.id}
              showcase={showcase}
              products={showProds}
              autoSlide={true}
            />
          ))}
        </section>
      )}

      {/* 6. "Just For You" Curated Feed with Interactive Recommendation Filters */}
      <JustForYouSection
        products={personalizedProducts}
        onRefreshFeed={handleRefreshFeed}
        isRefreshingFeed={isRefreshingFeed}
      />

      {/* 7. Newsletter / Voucher Subscription Banner (৳100 OFF Lead Magnet) */}
      <VoucherSubscription />

      {/* 8. Secondary Trust Features */}
      <SecondaryTrustRow />

      {/* 9. Recently Viewed Products Shelf */}
      <section className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
        <RecentlyViewedShelf products={products} />
      </section>
    </div>
  );
};

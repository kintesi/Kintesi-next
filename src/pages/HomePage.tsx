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
    <div className="pb-20">
      
      {/* ========================================================
          📱 MOBILE VIEW: Clean & Authentic E-Commerce (All Devices)
         ======================================================== */}
      <div className="block md:hidden bg-white min-h-screen space-y-5 pb-28 pt-2.5">
        
        {/* 1. Mobile Hero Banner (Controlled by showHeroSection & heroShowOnMobile) */}
        {isSettingsLoaded && banners.showHeroSection === true && banners.heroShowOnMobile !== false && (
          <div className="px-3">
            <div className="relative rounded-2xl bg-gradient-to-br from-rose-50/70 via-white to-rose-50/40 border border-rose-100/90 p-4 shadow-[0_2px_12px_rgba(225,29,72,0.03)] space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-rose-200/80 text-rose-700 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                <span>{(banners.heroBadge || 'OFFICIAL MARKETPLACE').replace(/•?\s*kintesi\.com/gi, '').trim()}</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-gray-950 leading-tight">
                {banners.heroTitle}{' '}
                <span className="text-rose-600">{banners.heroHighlightText}</span>
              </h2>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                {banners.heroSubtitle}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  to="/shop"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition"
                >
                  <span>Explore Shop</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/shop"
                  className="px-3.5 py-2 bg-white text-gray-800 font-semibold rounded-xl border border-rose-200/80 text-xs active:scale-95 transition"
                >
                  Categories
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 1b. Mobile Spotlight Promo Card (Controlled by showSpotlight & spotlightShowOnMobile) */}
        {hasValidSpotlight && banners.spotlightShowOnMobile !== false && (
          <div className="px-3">
            <div className="bg-white rounded-2xl p-3 border border-rose-100/90 shadow-2xs flex items-center gap-3">
              <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 relative flex items-center justify-center">
                {banners.spotlightImage ? (
                  <img
                    src={banners.spotlightImage}
                    alt={banners.spotlightTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-rose-50 flex items-center justify-center text-rose-500">
                    <Package className="w-6 h-6" />
                  </div>
                )}
                {banners.spotlightSavingsText && (
                  <span className="absolute bottom-1 left-1 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow">
                    {banners.spotlightSavingsText}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded uppercase">
                    {banners.spotlightBadge || 'Deal of the Day'}
                  </span>
                  <span className="text-[10px] text-gray-400 truncate">{banners.spotlightBrand || 'Exclusive'}</span>
                </div>
                <h4 className="text-xs font-bold text-gray-900 truncate">
                  {banners.spotlightTitle}
                </h4>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-sm font-black text-rose-600">
                    {formatPrice(banners.spotlightDiscountPrice || banners.spotlightPrice)}
                  </span>
                  <Link
                    to={banners.spotlightBtnLink || '/shop'}
                    className="px-3 py-1 bg-gray-950 text-white font-bold rounded-lg text-[10px] active:scale-95 shadow-xs"
                  >
                    Buy Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Mobile Flash Sale Countdown Banner */}
        {isFlashSaleActive && (
          <div className="px-3">
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
              isMobile={true}
              bannerType={banners.flashSaleBannerType}
              showTimer={banners.flashSaleShowTimer === true}
            />
          </div>
        )}

        {/* 3. SHOWCASE STRIPS (Trending, Featured, New Arrival, Flash Sale - 4 per row with auto-slide) */}
        {activeShowcases.length > 0 && (
          <div className="px-3 space-y-4 pt-1">
            {activeShowcases.map(({ showcase, products: showProds }) => (
              <ShowcaseStrip
                key={showcase.id}
                showcase={showcase}
                products={showProds}
                autoSlide={true}
              />
            ))}
          </div>
        )}

        {/* 4. Product Feed with Progressive Infinite Scroll */}
        <div className="px-3 space-y-3 pt-2">
          {/* Feed Title & Fresh Mix / Reload button */}
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-sm font-black text-gray-900 tracking-tight">Just For You</h2>
            </div>
            <button
              type="button"
              onClick={handleRefreshFeed}
              disabled={isRefreshingFeed}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-gray-700 hover:text-rose-600 rounded-full border border-gray-200 text-[11px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Fresh Mix"
            >
              <RotateCw className={`w-3 h-3 ${isRefreshingFeed ? 'animate-spin text-rose-600' : 'text-gray-500'}`} />
              <span>Fresh Mix</span>
            </button>
          </div>

          {personalizedProducts.length === 0 ? (
            isLoadingData ? (
              <div className="grid grid-cols-2 gap-2.5">
                {[1, 2, 3, 4].map((n) => (
                  <ProductSkeleton key={n} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 text-center space-y-2 border border-gray-100 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Package className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-gray-800">No Products Yet</p>
                <p className="text-[10px] text-gray-400">Add products from your Admin Panel</p>
              </div>
            )
          ) : (
            <>
              {/* Product Grid Loaded in Progressive Batches */}
              <div className="grid grid-cols-2 gap-2.5">
                {personalizedProducts.slice(0, mobileVisibleCount).map((product, idx) => (
                  <ProductCard key={product.id} product={product} priority={idx < 4} />
                ))}
              </div>

              {/* Mobile Infinite Scroll Sentinel & Indicator */}
              <div ref={mobileSentinelRef} className="w-full flex items-center justify-center py-4">
                {mobileVisibleCount < personalizedProducts.length ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-full border border-gray-200/60 shadow-2xs">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                    <span>Loading more products...</span>
                  </div>
                ) : (
                  personalizedProducts.length > 12 && (
                    <div className="text-center py-2 space-y-1">
                      <p className="text-[11px] font-medium text-gray-400">
                        ✓ All products loaded
                      </p>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>

        {/* 6. Amazon / Daraz Style: Recently Viewed Shelf */}
        <div className="px-3">
          <RecentlyViewedShelf products={products} />
        </div>

      </div>

      {/* ========================================================
          💻 DESKTOP VIEW: Full Featured Luxury Mega Store
         ======================================================== */}
      <div className="hidden md:block space-y-10 sm:space-y-12">
        
        {/* 1. Desktop Hero Banner */}
        {isSettingsLoaded && banners.showHeroSection === true && (
          <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
            <div className="relative rounded-3xl bg-gradient-to-br from-rose-50/40 via-white to-gray-50/70 border border-rose-100/90 shadow-[0_2px_16px_rgba(225,29,72,0.03)] overflow-hidden">
              <div className="relative px-6 sm:px-10 lg:px-12 py-8 lg:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Left Column: Refined Typography & Clean CTAs */}
                  <div className="space-y-4 lg:col-span-7">
                    
                    {/* Minimalist Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-rose-200/80 shadow-xs text-rose-700 text-[11px] font-bold tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                      <span>
                        {(banners.heroBadge || 'CURATED LIFESTYLE & SHOPPING')
                          .replace(/•?\s*kintesi\.com/gi, '')
                          .trim()}
                      </span>
                    </div>

                    {/* Proportional Editorial Title */}
                    <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight text-gray-950 leading-[1.18]">
                      {banners.heroTitle}{' '}
                      <span className="text-rose-600">
                        {banners.heroHighlightText}
                      </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xs sm:text-sm text-gray-600 max-w-lg font-normal leading-relaxed">
                      {banners.heroSubtitle}
                    </p>

                    {/* Compact Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <Link
                        to={banners.heroPrimaryBtnLink || '/shop'}
                        className="px-6 py-2.5 bg-gray-950 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-xs hover:shadow-md flex items-center gap-2 text-xs active:scale-95"
                      >
                        <span>{banners.heroPrimaryBtnText || 'Explore Catalog'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <Link
                        to="/shop"
                        className="px-5 py-2.5 bg-white hover:bg-rose-50/60 text-gray-800 hover:text-rose-700 font-semibold rounded-xl border border-rose-200/80 transition text-xs flex items-center gap-1.5 shadow-2xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-rose-600" />
                        <span>All Categories</span>
                      </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex items-center gap-6 pt-3 border-t border-rose-100/70 text-[11px] text-gray-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                        <span className="font-semibold text-gray-800">100% Genuine</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                        <span className="font-semibold text-gray-800">Express Delivery</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                        <span className="font-semibold text-gray-800">7-Day Easy Return</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Hero Spotlight Promo Product Card */}
                  {hasValidSpotlight ? (
                    <div className="lg:col-span-5 relative">
                      <div className="relative rounded-3xl bg-white border border-rose-100/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-rose-200">
                        
                        {/* Top Header with Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3.5">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
                            <Flame className="w-3.5 h-3.5 fill-white" />
                            <span>{banners.spotlightBadge || 'Deal of the Day'}</span>
                          </div>
                          <span className="text-[11px] font-bold text-gray-500 bg-gray-100/80 px-2.5 py-0.5 rounded-full">
                            {banners.spotlightStockText || 'In Stock'}
                          </span>
                        </div>

                        {/* Product Image Stage */}
                        <div className="relative w-full h-52 sm:h-56 rounded-2xl bg-gradient-to-b from-gray-50 to-rose-50/30 border border-gray-100 overflow-hidden mb-4 group flex items-center justify-center">
                          {banners.spotlightImage ? (
                            <img
                              src={banners.spotlightImage}
                              alt={banners.spotlightTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-rose-50/50 flex flex-col items-center justify-center text-rose-500">
                              <Package className="w-10 h-10 mb-1" />
                              <span className="text-[11px] font-bold">Featured Product</span>
                            </div>
                          )}
                          {banners.spotlightSavingsText && (
                            <div className="absolute bottom-2.5 left-2.5 bg-gray-950/90 backdrop-blur-md text-amber-300 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md border border-white/10">
                              {banners.spotlightSavingsText}
                            </div>
                          )}
                          <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-gray-200/80">
                            {banners.spotlightBrand || 'Exclusive'}
                          </span>
                        </div>

                        {/* Product Info & Action */}
                        <div className="space-y-3">
                          <h3 className="text-base sm:text-lg font-black text-gray-950 line-clamp-1 leading-snug">
                            {banners.spotlightTitle}
                          </h3>

                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-black text-rose-600">
                                  {formatPrice(banners.spotlightDiscountPrice || banners.spotlightPrice)}
                                </span>
                                {banners.spotlightPrice &&
                                  banners.spotlightDiscountPrice &&
                                  Number(banners.spotlightPrice) > Number(banners.spotlightDiscountPrice) && (
                                    <span className="text-xs sm:text-sm text-gray-400 line-through font-semibold">
                                      {formatPrice(banners.spotlightPrice)}
                                    </span>
                                  )}
                              </div>
                              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verified Authentic Product</span>
                              </span>
                            </div>

                            <Link
                              to={banners.spotlightBtnLink || '/shop'}
                              className="px-5 py-2.5 bg-gray-950 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 active:scale-95"
                            >
                              <span>Buy Now</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>

                      </div>
                    </div>
                  ) : (
                    /* Authentic Trust Pillars when Spotlight is turned OFF or not yet set */
                    <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white rounded-2xl p-4 border border-rose-100/90 shadow-2xs hover:border-rose-300 transition space-y-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-gray-900">100% Genuine</h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed">Authentic items sourced directly from verified brands.</p>
                      </div>

                      <div className="bg-white rounded-2xl p-4 border border-rose-100/90 shadow-2xs hover:border-rose-300 transition space-y-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                          <Truck className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-gray-900">Express Delivery</h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed">Swift doorstep courier across all 64 districts in Bangladesh.</p>
                      </div>

                      <div className="bg-white rounded-2xl p-4 border border-rose-100/90 shadow-2xs hover:border-rose-300 transition space-y-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-gray-900">Cash on Delivery</h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed">Inspect on arrival. bKash, Nagad & Cards supported.</p>
                      </div>

                      <div className="bg-white rounded-2xl p-4 border border-rose-100/90 shadow-2xs hover:border-rose-300 transition space-y-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-gray-900">Easy Returns</h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed">Hassle-free 7-day replacement with doorstep pickup.</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2. Desktop Flash Sale Banner */}
        {isFlashSaleActive && (
          <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* 3. DESKTOP SHOWCASE STRIPS (Trending, Featured, New Arrival, Flash Sale) */}
        {activeShowcases.length > 0 && (
          <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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

        {/* 4. DESKTOP PRODUCT FEED */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Feed Title & Fresh Mix / Reload button */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-950 tracking-tight">Just For You</h2>
                <p className="text-xs text-gray-500 font-medium">Explore curated products selected for you</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefreshFeed}
              disabled={isRefreshingFeed}
              className="group inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-rose-50 text-gray-700 hover:text-rose-600 rounded-xl border border-gray-200 hover:border-rose-200 text-xs font-bold shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Fresh Mix"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshingFeed ? 'animate-spin text-rose-600' : 'text-gray-500 group-hover:text-rose-600'}`} />
              <span>Fresh Mix</span>
            </button>
          </div>

          {personalizedProducts.length === 0 ? (
            isLoadingData ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-4.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((n) => (
                  <ProductSkeleton key={n} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-rose-100 p-8 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Your Store Catalog is Ready</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Add products from your Admin Panel to showcase them here.
                </p>
                <Link
                  to="/admin/products"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 hover:bg-rose-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Products in Admin</span>
                </Link>
              </div>
            )
          ) : (
            <>
              {/* Product Grid Loaded in Progressive Batches (6 items per row on PC) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-4.5">
                {personalizedProducts.slice(0, desktopVisibleCount).map((product, idx) => (
                  <ProductCard key={product.id} product={product} priority={idx < 6} />
                ))}
              </div>

              {/* Desktop Interactive Load More Section (Eliminates scroll lag and DOM freeze) */}
              <div className="w-full flex flex-col items-center justify-center pt-8 pb-4 gap-3">
                {desktopVisibleCount < totalCatalogCount ? (
                  <button
                    type="button"
                    onClick={() => setDesktopVisibleCount((prev) => Math.min(prev + 18, totalCatalogCount))}
                    className="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-white hover:bg-rose-600 text-gray-800 hover:text-white font-extrabold text-sm rounded-2xl border-2 border-rose-200 hover:border-rose-600 shadow-xs hover:shadow-lg hover:shadow-rose-600/20 transition-all duration-300 cursor-pointer active:scale-98"
                  >
                    <ShoppingBag className="w-4 h-4 text-rose-600 group-hover:text-white transition-colors" />
                    <span>Load More Products</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  totalCatalogCount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200/60">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>All products loaded</span>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </section>

        {/* 6. Amazon / Daraz Style: Recently Viewed Shelf */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <RecentlyViewedShelf products={products} />
        </section>

      </div>

    </div>
  );
};

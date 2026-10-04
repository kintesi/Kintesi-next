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
    <div className="pb-20">
      
      {/* ========================================================
          📱 MOBILE VIEW: Clean & Authentic E-Commerce (All Devices - Unchanged)
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
                timeLeft={timeLeft}
              />
            ))}
          </div>
        )}

        {/* 4. Product Feed with Progressive Infinite Scroll */}
        <div className="px-3 space-y-3 pt-2">
          {/* Feed Title */}
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-sm font-black text-gray-900 tracking-tight">Just For You</h2>
            </div>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
              Curated Picks
            </span>
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

      </div>

      {/* ========================================================
          💻 DESKTOP VIEW: High-Conversion E-Commerce Marketplace
         ======================================================== */}
      <div className="hidden md:block space-y-6 pt-2 pb-12">
        
        {/* 1. Top Banner Slider (At top where requested) */}
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

        {/* Optional Bento Hero Grid (Only if explicitly enabled) */}
        {banners.showBentoHero === true && (
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

        {/* 5. Active Showcase Strips (Trending, Featured, New Arrival) */}
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
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <RecentlyViewedShelf products={products} />
        </section>
      </div>

    </div>
  );
};

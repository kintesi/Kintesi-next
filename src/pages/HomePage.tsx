import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getCategoriesFromDB, getProductsFromDB } from '../lib/dbService';
import { Product, Category } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/mockData';
import { ProductCard } from '../components/common/ProductCard';
import { FlashSaleBanner } from '../components/home/FlashSaleBanner';
import { useSettings } from '../contexts/SettingsContext';
import { getPersonalizedAndRotatedProducts, detectAndSaveSearchIntent } from '../lib/recommendationEngine';
import {
  ArrowRight,
  Sparkles,
  Flame,
  TrendingUp,
  ShieldCheck,
  Truck,
  RotateCcw,
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
};

export const HomePage: React.FC = () => {
  const { settings } = useSettings();
  const banners = settings.banners;

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('kintesi_custom_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter((p: any) => p && p.id && !p.id.startsWith('prod-'));
      }
      return [];
    } catch {
      return [];
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
  const [activeTab, setActiveTab] = useState<'all' | 'groceries' | 'fashion' | 'tech'>('all');

  // Progressive batch loading / Infinite scroll states
  const [mobileVisibleCount, setMobileVisibleCount] = useState(12);
  const [desktopVisibleCount, setDesktopVisibleCount] = useState(16);
  const mobileSentinelRef = useRef<HTMLDivElement | null>(null);
  const desktopSentinelRef = useRef<HTMLDivElement | null>(null);

  // Flash sale countdown timer state
  const calculateFlashTime = () => {
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
  }, [banners.flashSaleEndsAt, banners.flashSaleHours]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateFlashTime());
    }, 1000);
    return () => clearInterval(timer);
  }, [banners.flashSaleEndsAt, banners.flashSaleHours]);

  const isFlashSaleActive = Boolean(
    banners.showFlashSale !== false &&
    !timeLeft.isExpired &&
    (!banners.flashSaleEndsAt || new Date(banners.flashSaleEndsAt).getTime() > Date.now())
  );

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoadingData(true);
        const [cats, prods] = await Promise.all([
          getCategoriesFromDB(),
          getProductsFromDB(),
        ]);
        if (cats && cats.length > 0) setCategories(cats);
        setProducts(prods);
      } catch (err) {
        console.warn('Home page data note:', err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
    detectAndSaveSearchIntent();
    window.addEventListener('kintesi_products_updated', loadData);
    return () => window.removeEventListener('kintesi_products_updated', loadData);
  }, []);

  const hasValidSpotlight = Boolean(
    banners.showSpotlight &&
    banners.spotlightTitle &&
    banners.spotlightTitle.trim().length > 0 &&
    (Number(banners.spotlightPrice) > 0 || Number(banners.spotlightDiscountPrice) > 0)
  );

  const activeFlashProducts = useMemo(() => {
    const discounted = products.filter((p) => p.discount_price && p.discount_price < p.price);
    if (discounted.length > 0) return discounted;
    return products.slice(0, 4);
  }, [products]);

  // 1. Featured Products: ONLY products where admin checked is_featured === true
  const featuredProducts = useMemo(() => {
    return products.filter((p) => Boolean(p.is_featured));
  }, [products]);

  const isFeaturedActive = Boolean(
    banners.showFeaturedProducts !== false &&
    featuredProducts.length > 0
  );

  // 2. Personalized & Periodically Rotated Products (Matches user search, category visits, and dynamically shifts order every 2 hours)
  const personalizedProducts = useMemo(() => {
    return getPersonalizedAndRotatedProducts(products, 2);
  }, [products]);

  // Filtered by department tabs for desktop
  const filteredPersonalizedProducts = useMemo(() => {
    return personalizedProducts.filter((p) => {
      if (activeTab === 'groceries') {
        return (
          p.category_id.includes('groceries') ||
          p.category_id.includes('home') ||
          p.category_id.includes('beauty')
        );
      }
      if (activeTab === 'fashion') {
        return p.category_id.includes('fashion') || p.category_id.includes('footwear');
      }
      if (activeTab === 'tech') {
        return (
          p.category_id.includes('smartphones') ||
          p.category_id.includes('laptops') ||
          p.category_id.includes('audio') ||
          p.category_id.includes('cameras') ||
          p.category_id.includes('watches')
        );
      }
      return true;
    });
  }, [personalizedProducts, activeTab]);

  // Infinite scroll observer for Mobile
  useEffect(() => {
    const sentinel = mobileSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setMobileVisibleCount((prev) => {
            if (prev < personalizedProducts.length) {
              return prev + 12;
            }
            return prev;
          });
        }
      },
      { rootMargin: '350px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [personalizedProducts.length]);

  // Infinite scroll observer for Desktop
  useEffect(() => {
    const sentinel = desktopSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDesktopVisibleCount((prev) => {
            if (prev < filteredPersonalizedProducts.length) {
              return prev + 12;
            }
            return prev;
          });
        }
      },
      { rootMargin: '350px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredPersonalizedProducts.length]);

  return (
    <div className="pb-20">
      
      {/* ========================================================
          📱 MOBILE VIEW: Clean & Authentic E-Commerce (All Devices)
         ======================================================== */}
      <div className="block md:hidden bg-white min-h-screen space-y-5 pb-28 pt-2.5">
        
        {/* 1. Mobile Hero Banner */}
        {banners.showHeroSection !== false && (
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

        {/* 1b. Mobile Spotlight Promo Card (ONLY when configured by Admin) */}
        {hasValidSpotlight && (
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

        {/* 2. FEATURED PRODUCTS (SHOWN UP ABOVE ONLY IF ADMIN ENABLED & MARKED PRODUCTS) */}
        {isFeaturedActive && (
          <div className="px-3 space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-rose-600 text-rose-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  {banners.featuredProductsTitle || 'Featured Products'}
                </h3>
              </div>
              <Link to="/shop?featured=true" className="text-xs text-rose-600 font-bold flex items-center">
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {banners.featuredProductsSubtitle && (
              <p className="text-[11px] text-gray-500 -mt-1">{banners.featuredProductsSubtitle}</p>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {featuredProducts.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* 3. Mobile Flash Sale Countdown & Deals */}
        {isFlashSaleActive && (
          <div className="px-3 space-y-3">
            <FlashSaleBanner
              slides={banners.flashSaleSlides}
              defaultTag={banners.flashSaleTag}
              defaultTitle={banners.flashSaleTitle}
              defaultSubtitle={banners.flashSaleSubtitle}
              defaultBgImage={banners.flashSaleBgImage}
              theme={banners.flashSaleTheme}
              timeLeft={timeLeft}
              isMobile={true}
            />

            {/* Mobile Flash Deals Grid */}
            {activeFlashProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {activeFlashProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-4 text-center border border-rose-100 shadow-2xs space-y-1">
                <p className="text-xs font-bold text-gray-900">Flash Deals Starting Soon</p>
                <p className="text-[10px] text-gray-400">Add discounted products in admin to showcase them here!</p>
              </div>
            )}
          </div>
        )}

        {/* 4. Product Feed with Progressive Infinite Scroll */}
        <div className="px-3 space-y-3 pt-1">
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
                {personalizedProducts.slice(0, mobileVisibleCount).map((product) => (
                  <ProductCard key={product.id} product={product} />
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
                        ✓ All {personalizedProducts.length} items loaded
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
          💻 DESKTOP VIEW: Full Featured Luxury Mega Store
         ======================================================== */}
      <div className="hidden md:block space-y-10 sm:space-y-12">
        
        {/* 1. Desktop Hero Banner */}
        {banners.showHeroSection !== false && (
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

        {/* 2. DESKTOP FEATURED PRODUCTS (SHOWN UP ABOVE ONLY IF ADMIN ENABLED & MARKED PRODUCTS) */}
        {isFeaturedActive && (
          <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-rose-600 text-rose-600" />
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    {banners.featuredProductsTitle || 'Featured Products'}
                  </h2>
                </div>
                {banners.featuredProductsSubtitle && (
                  <p className="text-xs text-gray-500 mt-0.5">{banners.featuredProductsSubtitle}</p>
                )}
              </div>

              <Link
                to="/shop?featured=true"
                className="text-xs font-bold text-rose-600 hover:text-rose-700 transition flex items-center gap-1"
              >
                <span>View All ({featuredProducts.length})</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 3. Desktop Flash Sale */}
        {isFlashSaleActive && (
          <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <FlashSaleBanner
              slides={banners.flashSaleSlides}
              defaultTag={banners.flashSaleTag}
              defaultTitle={banners.flashSaleTitle}
              defaultSubtitle={banners.flashSaleSubtitle}
              defaultBgImage={banners.flashSaleBgImage}
              theme={banners.flashSaleTheme}
              timeLeft={timeLeft}
              isMobile={false}
            />

            {activeFlashProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {activeFlashProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center border border-rose-100 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                  <Flame className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-gray-900">Flash Deals Starting Soon</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Limited-time flash discounts are currently being updated. Check back soon or browse our catalog!
                </p>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 transition shadow-xs"
                >
                  <span>Explore Shop</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </section>
        )}

        {/* 4. DESKTOP PRODUCT FEED */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <div className="flex gap-2 text-xs font-bold">
              {[
                { key: 'all', label: 'All Items' },
                { key: 'groceries', label: 'Groceries & Home' },
                { key: 'fashion', label: 'Fashion & Footwear' },
                { key: 'tech', label: 'Tech & Gadgets' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
                    activeTab === tab.key
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-rose-100/90 hover:border-rose-300 hover:bg-rose-50/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredPersonalizedProducts.length === 0 ? (
            isLoadingData ? (
              <div className="grid grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
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
                  No products in this department yet. Add products from your Admin Panel to showcase them here.
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
              {/* Product Grid Loaded in Progressive Batches */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {filteredPersonalizedProducts.slice(0, desktopVisibleCount).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Desktop Infinite Scroll Sentinel & Indicator */}
              <div ref={desktopSentinelRef} className="w-full flex items-center justify-center pt-4">
                {desktopVisibleCount < filteredPersonalizedProducts.length ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-5 py-2.5 rounded-full border border-gray-200/60 shadow-2xs">
                    <div className="w-4 h-4 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                    <span>Loading more curated products...</span>
                  </div>
                ) : (
                  filteredPersonalizedProducts.length > 16 && (
                    <p className="text-xs text-gray-400 text-center py-2">
                      ✓ All {filteredPersonalizedProducts.length} items loaded
                    </p>
                  )
                )}
              </div>
            </>
          )}
        </section>

      </div>

    </div>
  );
};

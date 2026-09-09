import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/mockData';
import { ProductCard } from '../components/common/ProductCard';
import { useSettings } from '../contexts/SettingsContext';
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
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'groceries' | 'fashion' | 'tech'>('all');

  // Flash sale countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    hours: banners.flashSaleHours || 4,
    minutes: 59,
    seconds: 31,
  });

  useEffect(() => {
    setTimeLeft((prev) => ({ ...prev, hours: banners.flashSaleHours || 4 }));
  }, [banners.flashSaleHours]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: banners.flashSaleHours || 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [banners.flashSaleHours]);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoadingData(true);
        const savedCustom: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
        
        // Fetch categories and products concurrently for max speed
        const [catRes, prodRes] = await Promise.all([
          supabase.from('categories').select('*'),
          supabase.from('products').select('*')
        ]);

        if (catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data);
          localStorage.setItem('kintesi_custom_categories', JSON.stringify(catRes.data));
        }

        const merged = [...savedCustom, ...(prodRes.data || [])].filter(
          (p) => p && p.id && !p.id.startsWith('prod-')
        );
        const unique = Array.from(new Map(merged.map((p) => [p.slug || p.id, p])).values());
        setProducts(unique);
        localStorage.setItem('kintesi_custom_products', JSON.stringify(unique));
      } catch (err) {
        console.warn('Home page data note:', err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
    window.addEventListener('kintesi_products_updated', loadData);
    return () => window.removeEventListener('kintesi_products_updated', loadData);
  }, []);

  const flashSaleProducts = products.filter((p) => p.discount_price && p.discount_price < p.price);

  const tabFilteredProducts = products.filter((p) => {
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

  return (
    <div className="pb-20">
      
      {/* ========================================================
          📱 MOBILE VIEW: Clean & Authentic E-Commerce (All Devices)
         ======================================================== */}
      <div className="block md:hidden bg-white min-h-screen space-y-4 pb-28 pt-2.5">
        
        {/* 1. Mobile Hero Banner - 100% Authentic, Clean & Minimal */}
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

        {/* 2. Browse by Categories */}
        <div className="px-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900">Browse by Categories</h3>
            <Link to="/shop" className="text-xs text-rose-600 font-bold flex items-center">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2.5 text-center">
            {categories.slice(0, 4).map((cat) => {
              const IconComp = ICON_MAP[cat.icon] || ShoppingBag;
              return (
                <Link
                  key={cat.slug || cat.id}
                  to={`/shop?category=${cat.slug}`}
                  className="flex flex-col items-center group active:scale-95 transition"
                >
                  <div className="w-14 h-14 rounded-2xl bg-rose-50/70 border border-rose-100/90 flex items-center justify-center text-rose-600 mb-1.5 group-hover:bg-rose-600 group-hover:text-white transition shadow-2xs">
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="w-full h-full object-cover rounded-2xl"
                        loading="lazy"
                      />
                    ) : (
                      <IconComp className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 line-clamp-1">
                    {cat.name.split('&')[0].trim()}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 3. Trendy Collections Grid */}
        <div className="px-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900">Trendy Collections</h3>
            <Link to="/shop" className="text-xs text-rose-600 font-bold flex items-center">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {products.length === 0 ? (
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
            <div className="grid grid-cols-2 gap-2.5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          💻 DESKTOP VIEW: Full Featured Luxury Mega Store
         ======================================================== */}
      <div className="hidden md:block space-y-10 sm:space-y-12">
        
        {/* 1. Desktop Hero Banner - Sleek, Minimal, Compact & Highly Professional (Zero Fake Items) */}
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

                  {/* Right Column: 4 Authentic Value Prop Pillars (ZERO Fake Products, 100% High-End Credibility) */}
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

                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. Desktop Flash Sale */}
        {banners.showFlashSale && flashSaleProducts.length > 0 && (
          <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-rose-600 via-orange-600 to-amber-500 rounded-3xl p-8 text-white mb-6 shadow-lg flex items-center justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  <span>{banners.flashSaleTag}</span>
                </div>
                <h3 className="text-3xl font-black">{banners.flashSaleTitle}</h3>
                <p className="text-white/80 text-xs">{banners.flashSaleSubtitle}</p>
              </div>

              <div className="flex items-center gap-2 bg-black/40 p-2.5 rounded-2xl border border-white/20">
                <Timer className="w-5 h-5 text-amber-300" />
                <div className="text-center bg-white/10 px-3 py-1 rounded-lg min-w-12">
                  <span className="text-base font-black font-mono block leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-[8px] uppercase tracking-wider text-rose-200">Hours</span>
                </div>
                <span className="font-bold">:</span>
                <div className="text-center bg-white/10 px-3 py-1 rounded-lg min-w-12">
                  <span className="text-base font-black font-mono block leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-[8px] uppercase tracking-wider text-rose-200">Mins</span>
                </div>
                <span className="font-bold">:</span>
                <div className="text-center bg-white/10 px-3 py-1 rounded-lg min-w-12">
                  <span className="text-base font-black font-mono block leading-none text-amber-300">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-[8px] uppercase tracking-wider text-rose-200">Secs</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
              {flashSaleProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 4. Desktop Featured Tabs */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between border-b border-rose-100 pb-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Featured Products</h2>
              <p className="text-xs text-gray-500 mt-0.5">Top-rated selections for home, fashion, and tech</p>
            </div>

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
                  className={`px-3.5 py-2 rounded-xl transition ${
                    activeTab === tab.key
                      ? 'bg-gray-950 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-rose-100/90 hover:border-rose-300 hover:bg-rose-50/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {tabFilteredProducts.length === 0 ? (
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
            <div className="grid grid-cols-4 gap-6">
              {tabFilteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

      </div>

    </div>
  );
};

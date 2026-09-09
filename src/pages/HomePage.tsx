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
        
        {/* 1. Flash Sale Hero Banner (Controlled by Admin Banners settings) */}
        {banners.showFlashSale && (
          <div className="px-3">
            <Link
              to={banners.spotlightBtnLink || "/shop"}
              className="relative block rounded-2xl overflow-hidden bg-gradient-to-r from-rose-600 via-rose-600 to-amber-500 p-4 text-white shadow-xs transition hover:brightness-105"
            >
              <div className="relative z-10 max-w-[62%] space-y-1">
                <div className="inline-block px-2.5 py-0.5 bg-black/40 backdrop-blur-xs text-white rounded-full text-[9px] font-black uppercase tracking-wider">
                  {banners.flashSaleTag || '30% OFF'}
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase leading-none">
                  {banners.flashSaleTitle || 'FLASH SALE'}
                </h2>
                <p className="text-[10px] sm:text-xs text-white/95 font-medium leading-tight line-clamp-2">
                  {banners.flashSaleSubtitle || 'Exclusive offers across our store for a limited time.'}
                </p>
              </div>
              
              <div className="absolute right-2 top-0 bottom-0 w-2/5 flex items-center justify-end">
                <img
                  src={banners.spotlightImage || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&auto=format&fit=crop&q=75"}
                  alt="Flash Sale"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
            </Link>
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
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.slug}
                to={`/shop?category=${cat.slug}`}
                className="flex flex-col items-center group active:scale-95 transition"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-rose-100/90 shadow-xs mb-1 group-hover:border-rose-300">
                  <img
                    src={cat.image_url ? `${cat.image_url.split('?')[0]}?w=160&auto=format&fit=crop&q=75` : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=160&auto=format&fit=crop&q=75'}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="text-[11px] font-bold text-gray-800 line-clamp-1">
                  {cat.name.split('&')[0].trim()}
                </span>
              </Link>
            ))}
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
      <div className="hidden md:block space-y-16">
        
        {/* 1. Desktop Hero Banner */}
        {banners.showHeroSection !== false && (
          <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-rose-950 text-white relative overflow-hidden border-b border-rose-950/40">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                <div className={`space-y-5 ${banners.showSpotlight ? 'lg:col-span-7' : 'lg:col-span-12 text-center max-w-3xl mx-auto'}`}>
                  {banners.heroBadge && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{banners.heroBadge}</span>
                    </div>
                  )}

                  <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                    {banners.heroTitle}{' '}
                    <span className="bg-gradient-to-r from-rose-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
                      {banners.heroHighlightText}
                    </span>
                  </h1>

                  <p className="text-base text-gray-300 max-w-xl font-normal leading-relaxed">
                    {banners.heroSubtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Link
                      to={banners.heroPrimaryBtnLink || '/shop'}
                      className="px-8 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center gap-2 text-sm active:scale-95"
                    >
                      <span>{banners.heroPrimaryBtnText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      to={banners.heroSecondaryBtnLink || '/shop?category=mens-fashion'}
                      className="px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/15 transition text-sm flex items-center gap-2"
                    >
                      <Shirt className="w-4 h-4 text-rose-300" />
                      <span>{banners.heroSecondaryBtnText}</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/10 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span className="font-bold text-gray-200">100% Genuine</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="font-bold text-gray-200">Express Delivery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span className="font-bold text-gray-200">7-Day Return</span>
                    </div>
                  </div>
                </div>

                {banners.showSpotlight && (
                  <div className="lg:col-span-5">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4 shadow-2xl">
                      <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center">
                        <img src={banners.spotlightImage} alt={banners.spotlightTitle} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow">
                          {banners.spotlightBadge}
                        </div>
                        {banners.spotlightSavingsText && (
                          <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-amber-300 font-extrabold text-[11px] px-3 py-1 rounded-full border border-white/10">
                            {banners.spotlightSavingsText}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="uppercase font-bold text-rose-400">{banners.spotlightBrand}</span>
                          <span className="text-gray-400 bg-white/5 px-2 py-0.5 rounded text-[11px]">
                            {banners.spotlightStockText}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-white line-clamp-1">{banners.spotlightTitle}</h3>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                          <div>
                            <span className="text-2xl font-black text-white">{formatPrice(banners.spotlightDiscountPrice)}</span>
                            {banners.spotlightPrice && (
                              <span className="text-xs text-gray-500 line-through ml-2">{formatPrice(banners.spotlightPrice)}</span>
                            )}
                          </div>
                          <Link to={banners.spotlightBtnLink || '/shop'} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs transition shadow">
                            Buy Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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

              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm p-2.5 rounded-2xl border border-white/20">
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

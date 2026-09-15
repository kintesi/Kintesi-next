import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product } from '../types';
import { getProductsFromDB } from '../lib/dbService';
import { useSettings, DEFAULT_SHOWCASES, ShowcaseType } from '../contexts/SettingsContext';
import { ProductCard } from '../components/common/ProductCard';
import {
  Flame,
  Star,
  Sparkles,
  Zap,
  ArrowLeft,
  ChevronRight,
  ShoppingBag,
  SlidersHorizontal,
  Home,
  CheckCircle2,
} from 'lucide-react';

const ProductSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-3 space-y-2.5 animate-pulse shadow-xs">
    <div className="aspect-square bg-gray-100 rounded-xl w-full" />
    <div className="h-3.5 bg-gray-100 rounded-md w-3/4" />
    <div className="h-3 bg-gray-100 rounded-md w-1/2" />
    <div className="h-4 bg-gray-100 rounded-md w-1/3 pt-1" />
  </div>
);

interface ShowcasePageProps {
  showcaseType?: string;
}

export const ShowcasePage: React.FC<ShowcasePageProps> = ({ showcaseType }) => {
  const { type: paramType } = useParams<{ type: string }>();
  const { settings } = useSettings();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'name'>('default');

  // Normalized showcase identifier
  const activeSlug = (showcaseType || paramType || 'trending').toLowerCase().replace(/-/g, '_');

  // Load products from DB with real-time update support
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const prods = await getProductsFromDB();
        if (isMounted && prods) {
          setAllProducts(prods);
        }
      } catch (err) {
        console.warn('Error loading showcase products:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('kintesi_products_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('kintesi_products_updated', handleUpdate);
    };
  }, []);

  // Find the showcase configuration from SettingsContext
  const currentShowcase = useMemo(() => {
    const list =
      settings.banners.showcases && settings.banners.showcases.length > 0
        ? settings.banners.showcases
        : DEFAULT_SHOWCASES;

    const matched = list.find(
      (s) =>
        s.id.toLowerCase() === activeSlug ||
        s.type.toLowerCase() === activeSlug ||
        s.id.toLowerCase().replace(/_/g, '-') === activeSlug ||
        s.type.toLowerCase().replace(/_/g, '-') === activeSlug
    );

    if (matched) return matched;

    // Fallback if not found in custom list
    const fallbackDef = DEFAULT_SHOWCASES.find(
      (s) => s.id.toLowerCase() === activeSlug || s.type.toLowerCase() === activeSlug
    );

    return (
      fallbackDef || {
        id: activeSlug,
        type: (['trending', 'featured', 'new_arrival', 'flash_sale'].includes(activeSlug)
          ? activeSlug
          : 'trending') as ShowcaseType,
        title: activeSlug.replace(/_/g, ' ').toUpperCase(),
        subtitle: 'Exclusive curated collection for you',
        enabled: true,
        productIds: [],
      }
    );
  }, [settings.banners.showcases, activeSlug]);

  // Document Title update
  useEffect(() => {
    if (currentShowcase?.title) {
      document.title = `${currentShowcase.title} | Kintesi`;
    }
  }, [currentShowcase?.title]);

  // Filter STRICTLY to the products added to this showcase:
  // "just oi product goloi jegolo oikhane add kora thakbe"
  const rawShowcaseProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];

    // If specific products were added by admin, display EXACTLY those products in assigned order:
    if (currentShowcase?.productIds && currentShowcase.productIds.length > 0) {
      const idMap = new Map<string, Product>();
      for (const p of allProducts) {
        if (p && p.id) {
          idMap.set(String(p.id), p);
        }
      }

      return currentShowcase.productIds
        .map((id) => idMap.get(String(id)))
        .filter(Boolean) as Product[];
    }

    // Smart automatic fallback if admin hasn't explicitly selected specific IDs:
    if (currentShowcase?.type === 'trending') {
      const trending = allProducts.filter((p) => p.is_trending);
      return trending.length > 0 ? trending : allProducts.slice(0, 18);
    } else if (currentShowcase?.type === 'featured') {
      const featured = allProducts.filter((p) => p.is_featured);
      return featured.length > 0 ? featured : allProducts.slice(0, 18);
    } else if (currentShowcase?.type === 'new_arrival') {
      return [...allProducts].reverse().slice(0, 24);
    } else if (currentShowcase?.type === 'flash_sale') {
      const sale = allProducts.filter((p) => p.discount_price && p.discount_price < p.price);
      return sale.length > 0 ? sale : allProducts.slice(0, 18);
    }

    return [];
  }, [currentShowcase, allProducts]);

  // Apply sorting
  const finalProducts = useMemo(() => {
    const list = [...rawShowcaseProducts];
    if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [rawShowcaseProducts, sortBy]);

  // Styling & Theme per showcase type
  const themeConfig = useMemo(() => {
    switch (currentShowcase.type) {
      case 'flash_sale':
        return {
          icon: <Zap className="w-5 h-5 fill-rose-600 text-rose-600" />,
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          gradientBg: 'from-rose-50/70 via-white to-orange-50/40 border-rose-100',
          pillColor: 'bg-rose-600',
        };
      case 'featured':
        return {
          icon: <Star className="w-5 h-5 fill-amber-500 text-amber-500" />,
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          gradientBg: 'from-amber-50/60 via-white to-yellow-50/30 border-amber-100',
          pillColor: 'bg-amber-500',
        };
      case 'new_arrival':
        return {
          icon: <Sparkles className="w-5 h-5 text-blue-600" />,
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          gradientBg: 'from-blue-50/60 via-white to-sky-50/30 border-blue-100',
          pillColor: 'bg-blue-600',
        };
      case 'trending':
      default:
        return {
          icon: <Flame className="w-5 h-5 fill-rose-600 text-rose-600" />,
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          gradientBg: 'from-rose-50/70 via-white to-red-50/40 border-rose-100',
          pillColor: 'bg-rose-600',
        };
    }
  }, [currentShowcase.type]);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Top Breadcrumb Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Link to="/" className="hover:text-rose-600 transition flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-gray-400">Showcase</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="font-bold text-gray-900">{currentShowcase.title}</span>
          </div>

          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-rose-600 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 space-y-6">
        {/* Showcase Hero Banner */}
        <div
          className={`relative rounded-3xl bg-gradient-to-br ${themeConfig.gradientBg} border shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-8 lg:p-10 overflow-hidden`}
        >
          <div className="relative z-10 max-w-2xl space-y-3">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${themeConfig.badgeBg}`}
            >
              {themeConfig.icon}
              <span className="uppercase tracking-wider">Official Curated Collection</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-950 tracking-tight leading-tight">
              {currentShowcase.title}
            </h1>

            {currentShowcase.subtitle && (
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-xl font-normal">
                {currentShowcase.subtitle}
              </p>
            )}

            <div className="flex items-center gap-4 pt-2 text-xs font-semibold text-gray-700">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>100% Genuine Products</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                <span>
                  {isLoading ? 'Loading items...' : `${finalProducts.length} Items in this Showcase`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar (Product Count & Sort Option) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:px-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
            <span className="font-extrabold text-gray-950">
              {isLoading ? 'Loading catalog...' : `${finalProducts.length} Products`}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500 text-xs">Exclusively in this showcase</span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">Sort by:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-rose-500 transition cursor-pointer"
            >
              <option value="default">Assigned Order (Default)</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Product Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Product Grid (PC: 6 per row, Mobile: 2 per row) */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-4.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
              <ProductSkeleton key={n} />
            ))}
          </div>
        ) : finalProducts.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-gray-100 p-8 shadow-xs max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-2xs">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                কোনো প্রোডাক্ট যোগ করা হয়নি
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                এই শোকেসে প্রদর্শনের জন্য অ্যাডমিন প্যানেল থেকে পছন্দের প্রোডাক্টগুলো যুক্ত করুন।
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-950 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition shadow-sm active:scale-95"
              >
                <span>সব প্রোডাক্ট দেখুন (Explore All Products)</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-4.5">
            {finalProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product } from '../types';
import { getProductsFromDB } from '../lib/dbService';
import { useSettings, DEFAULT_SHOWCASES, ShowcaseType } from '../contexts/SettingsContext';
import { FLASH_SALE_PRODUCTS } from '../data/flashSaleProducts';
import { ProductCard } from '../components/common/ProductCard';
import {
  ArrowLeft,
  ChevronRight,
  ShoppingBag,
  SlidersHorizontal,
  Home,
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
        const prods = await getProductsFromDB({ all: true });
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

  // Find the showcase configuration from SettingsContext or Banner Slides
  const currentShowcase = useMemo(() => {
    const rawParam = (showcaseType || paramType || 'trending').toLowerCase();
    const cleanBannerId = rawParam.replace(/^banner[-_]/, '');

    // 1. First check if matching a Banner Slide (e.g. /showcase/banner-1 or /showcase/banner-slide-xxx)
    const bannerSlides = settings.banners.flashSaleSlides || [];
    const matchedSlide = bannerSlides.find((s) => {
      if (!s || !s.id) return false;
      const sId = String(s.id).toLowerCase();
      return (
        sId === cleanBannerId ||
        sId === rawParam ||
        `banner-${sId}` === rawParam ||
        `banner_${sId}` === rawParam
      );
    });

    if (matchedSlide) {
      const pIds = (matchedSlide.productIds && matchedSlide.productIds.length > 0)
        ? matchedSlide.productIds
        : (matchedSlide.productId ? [matchedSlide.productId] : []);

      return {
        id: `banner-${matchedSlide.id}`,
        type: 'flash_sale' as ShowcaseType,
        title: matchedSlide.pageTitle?.trim() || matchedSlide.title?.trim() || 'Special Collection',
        subtitle: matchedSlide.subtitle?.trim() || 'Exclusive curated collection for you',
        enabled: true,
        productIds: pIds,
        isBannerShowcase: true,
      };
    }

    // 2. Otherwise check standard showcases
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
        isBannerShowcase: false,
      }
    );
  }, [settings.banners.flashSaleSlides, settings.banners.showcases, activeSlug, paramType, showcaseType]);

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
          if (p.slug) idMap.set(String(p.slug), p);
        }
      }

      return currentShowcase.productIds
        .map((id) => idMap.get(String(id)) || FLASH_SALE_PRODUCTS.find((p) => p.id === id || p.slug === id))
        .filter(Boolean) as Product[];
    }

    // If it is a banner showcase and no products are assigned:
    if ((currentShowcase as any)?.isBannerShowcase) {
      return [];
    }

    // Smart automatic fallback: ONLY for non-flash-sale showcases
    if (currentShowcase?.type === 'trending') {
      const trending = allProducts.filter((p) => p.is_trending);
      return trending.length > 0 ? trending : allProducts.slice(0, 18);
    } else if (currentShowcase?.type === 'featured') {
      const featured = allProducts.filter((p) => p.is_featured);
      return featured.length > 0 ? featured : allProducts.slice(0, 18);
    } else if (currentShowcase?.type === 'new_arrival') {
      return [...allProducts].reverse().slice(0, 24);
    } else if (currentShowcase?.type === 'flash_sale') {
      // Flash sale strictly shows only the genuine flash sale products
      return FLASH_SALE_PRODUCTS;
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

  // Progressive batch rendering to relieve screen load
  const [displayCount, setDisplayCount] = useState<number>(24);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDisplayCount(24);
  }, [sortBy, activeSlug]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setDisplayCount((prev) => prev + 24);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [finalProducts.length, displayCount]);

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

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 space-y-5">
        {/* Simple & Clean Header: Just the Title & Sort */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-200/80">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
              {currentShowcase.title}
            </h1>
            <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
              {isLoading ? '...' : `${finalProducts.length} items`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-bold text-gray-800 bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-rose-500 transition cursor-pointer shadow-2xs"
            >
              <option value="default">Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name (A-Z)</option>
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
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-4.5">
              {finalProducts.slice(0, displayCount).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Viewport On-demand Load Sentinel */}
            {displayCount < finalProducts.length && (
              <div ref={loadMoreSentinelRef} className="py-6 flex justify-center">
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-5 py-2.5 rounded-full border border-gray-200/80 shadow-2xs">
                  <div className="w-4 h-4 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                  <span>আরও প্রোডাক্ট লোড হচ্ছে...</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

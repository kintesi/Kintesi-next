import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { History, Trash2, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { ProductCard } from '../common/ProductCard';
import { getRecentlyViewedProducts, getUserInterestProfile, saveUserInterestProfile } from '../../lib/recommendationEngine';

interface RecentlyViewedShelfProps {
  products: Product[];
  title?: string;
  subtitle?: string;
}

export const RecentlyViewedShelf: React.FC<RecentlyViewedShelfProps> = ({
  products,
  title = 'Recently Viewed',
  subtitle = 'Easily find products you explored recently',
}) => {
  const [version, setVersion] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleUpdate = () => setVersion((v) => v + 1);
    window.addEventListener('kintesi_intent_updated', handleUpdate);
    return () => window.removeEventListener('kintesi_intent_updated', handleUpdate);
  }, []);

  const recentlyViewed = useMemo(() => {
    return getRecentlyViewedProducts(products, 12);
  }, [products, version]);

  const handleClearHistory = () => {
    const profile = getUserInterestProfile();
    profile.viewedProductIds = [];
    saveUserInterestProfile(profile);
    setVersion((v) => v + 1);
  };

  const scrollLeft = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScroll - 15) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: 220, behavior: 'smooth' });
      }
    }
  }, []);

  // Auto-scroll effect: smoothly scrolls horizontally every 2.8 seconds, pauses on hover/touch
  useEffect(() => {
    if (isPaused || recentlyViewed.length <= 1) return;

    const timer = setInterval(() => {
      const container = scrollRef.current;
      if (!container) return;

      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) return;

      if (container.scrollLeft >= maxScroll - 15) {
        // Smoothly loop back to start
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Scroll forward by card step
        const step = container.clientWidth > 640 ? 220 : 170;
        container.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 2800);

    return () => clearInterval(timer);
  }, [isPaused, recentlyViewed.length]);

  if (recentlyViewed.length === 0) return null;

  return (
    <section className="my-6 md:my-10">
      <div 
        className="bg-white border border-gray-200/80 rounded-2xl md:rounded-3xl p-4 sm:p-6 shadow-xs transition-shadow hover:shadow-sm"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 flex-shrink-0">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg md:text-xl font-black text-gray-900 tracking-tight truncate">
                {title}
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Scroll navigation arrows */}
            {recentlyViewed.length > 2 && (
              <div className="flex items-center gap-1 mr-1">
                <button
                  type="button"
                  onClick={scrollLeft}
                  title="Scroll Left"
                  aria-label="Scroll left"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={scrollRight}
                  title="Scroll Right"
                  aria-label="Scroll right"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleClearHistory}
              title="Clear History"
              className="text-[11px] font-semibold text-gray-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Clear History</span>
            </button>
            <Link
              to="/shop"
              className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            >
              <span>Shop</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Horizontal scrollable row with auto-scroll */}
        <div
          ref={scrollRef}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory scroll-smooth"
        >
          {recentlyViewed.map((prod) => (
            <div
              key={`recent-${prod.id}`}
              className="w-[155px] sm:w-[190px] md:w-[210px] flex-shrink-0 snap-start"
            >
              <ProductCard product={prod} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

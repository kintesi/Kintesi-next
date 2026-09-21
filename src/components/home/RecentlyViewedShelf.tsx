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
  const scrollRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleUpdate = () => setVersion((v) => v + 1);
    window.addEventListener('kintesi_intent_updated', handleUpdate);
    return () => window.removeEventListener('kintesi_intent_updated', handleUpdate);
  }, []);

  const recentlyViewed = useMemo(() => {
    return getRecentlyViewedProducts(products, 12);
  }, [products, version]);

  // Expand array to at least 24 items to guarantee continuous infinite runway without hitting scroll ceiling
  const displayItems = useMemo(() => {
    if (recentlyViewed.length === 0) return [];
    let list = [...recentlyViewed];
    while (list.length < 24) {
      list = [...list, ...recentlyViewed];
    }
    return list;
  }, [recentlyViewed]);

  // Safety resume listener: unpauses if touch/mouse releases anywhere
  useEffect(() => {
    const handleRelease = () => {
      setTimeout(() => {
        isHoveredRef.current = false;
      }, 300);
    };

    window.addEventListener('pointerup', handleRelease);
    window.addEventListener('touchend', handleRelease);
    window.addEventListener('blur', handleRelease);

    return () => {
      window.removeEventListener('pointerup', handleRelease);
      window.removeEventListener('touchend', handleRelease);
      window.removeEventListener('blur', handleRelease);
    };
  }, []);

  const handleClearHistory = () => {
    const profile = getUserInterestProfile();
    profile.viewedProductIds = [];
    saveUserInterestProfile(profile);
    setVersion((v) => v + 1);
  };

  const scrollPrev = useCallback(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const firstChild = el.children[0] as HTMLElement | undefined;
      const targetChild = el.children[recentlyViewed.length] as HTMLElement | undefined;
      const oneCycleWidth = (targetChild && firstChild)
        ? (targetChild.offsetLeft - firstChild.offsetLeft)
        : el.clientWidth * 0.75;

      el.scrollBy({ left: -240, behavior: 'smooth' });
      if (el.scrollLeft <= 0 && oneCycleWidth > 0) {
        el.scrollLeft += oneCycleWidth;
      }
    }
  }, [recentlyViewed.length]);

  const scrollNext = useCallback(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const firstChild = el.children[0] as HTMLElement | undefined;
      const targetChild = el.children[recentlyViewed.length] as HTMLElement | undefined;
      const oneCycleWidth = (targetChild && firstChild)
        ? (targetChild.offsetLeft - firstChild.offsetLeft)
        : el.clientWidth * 0.75;

      el.scrollBy({ left: 240, behavior: 'smooth' });
      if (el.scrollLeft >= oneCycleWidth && oneCycleWidth > 0) {
        el.scrollLeft -= oneCycleWidth;
      }
    }
  }, [recentlyViewed.length]);

  // Smooth continuous infinite scrolling (never freezes, zero jumps)
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || recentlyViewed.length <= 1) return;

    let lastTime = performance.now();
    const speed = 18; // Gentle, steady, readable gliding speed (18px/sec)

    const animate = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (!isHoveredRef.current && container) {
        const firstChild = container.children[0] as HTMLElement | undefined;
        const targetChild = container.children[recentlyViewed.length] as HTMLElement | undefined;
        const oneCycleWidth = (targetChild && firstChild)
          ? (targetChild.offsetLeft - firstChild.offsetLeft)
          : (container.scrollWidth / (displayItems.length / recentlyViewed.length));

        if (oneCycleWidth > 0) {
          container.scrollLeft += speed * delta;
          if (container.scrollLeft >= oneCycleWidth) {
            container.scrollLeft -= oneCycleWidth;
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [recentlyViewed.length, displayItems]);

  if (recentlyViewed.length === 0) return null;

  return (
    <section className="my-6 md:my-10">
      <div 
        className="bg-white border border-gray-200/80 rounded-2xl md:rounded-3xl p-4 sm:p-6 shadow-xs"
        onMouseEnter={() => { isHoveredRef.current = true; }}
        onMouseLeave={() => { isHoveredRef.current = false; }}
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
            {/* Manual navigation buttons */}
            {recentlyViewed.length > 2 && (
              <div className="flex items-center gap-1 mr-1">
                <button
                  type="button"
                  onClick={scrollPrev}
                  title="Scroll Left"
                  aria-label="Scroll left"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={scrollNext}
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

        {/* Horizontal scrollable row: Seamless infinite smooth glide, NO scrollbar slider */}
        <div
          ref={scrollRef}
          onTouchStart={() => { isHoveredRef.current = true; }}
          onTouchEnd={() => {
            setTimeout(() => {
              isHoveredRef.current = false;
            }, 300);
          }}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1 select-none cursor-grab active:cursor-grabbing"
        >
          {displayItems.map((prod, idx) => (
            <div
              key={`recent-${prod.id}-${idx}`}
              className="w-[155px] sm:w-[190px] md:w-[210px] flex-shrink-0"
            >
              <ProductCard product={prod} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

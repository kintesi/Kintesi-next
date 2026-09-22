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
  const trackRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const posRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  const touchStartXRef = useRef(0);
  const touchStartPosRef = useRef(0);

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

  // Safety resume listener
  useEffect(() => {
    const handleRelease = () => {
      isDraggingRef.current = false;
      setTimeout(() => {
        isPausedRef.current = false;
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

  const getCycleWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track || recentlyViewed.length === 0) return 0;
    const firstChild = track.children[0] as HTMLElement | undefined;
    const targetChild = track.children[recentlyViewed.length] as HTMLElement | undefined;
    if (firstChild && targetChild) {
      return targetChild.offsetLeft - firstChild.offsetLeft;
    }
    return track.scrollWidth / (displayItems.length / recentlyViewed.length);
  }, [recentlyViewed.length, displayItems.length]);

  const handleClearHistory = () => {
    const profile = getUserInterestProfile();
    profile.viewedProductIds = [];
    saveUserInterestProfile(profile);
    setVersion((v) => v + 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isPausedRef.current = true;
    isDraggingRef.current = true;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartPosRef.current = posRef.current;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    const diff = touchStartXRef.current - e.touches[0].clientX;
    const cycleWidth = getCycleWidth();
    let newPos = touchStartPosRef.current + diff;
    if (cycleWidth > 0) {
      newPos = (newPos % cycleWidth + cycleWidth) % cycleWidth;
    }
    posRef.current = newPos;
    trackRef.current.style.transform = `translate3d(-${newPos}px, 0, 0)`;
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    setTimeout(() => {
      isPausedRef.current = false;
    }, 400);
  };

  const scrollPrev = () => {
    const cycleWidth = getCycleWidth();
    posRef.current -= 240;
    if (cycleWidth > 0 && posRef.current < 0) {
      posRef.current += cycleWidth;
    }
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(-${posRef.current}px, 0, 0)`;
    }
  };

  const scrollNext = () => {
    const cycleWidth = getCycleWidth();
    posRef.current += 240;
    if (cycleWidth > 0 && posRef.current >= cycleWidth) {
      posRef.current -= cycleWidth;
    }
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(-${posRef.current}px, 0, 0)`;
    }
  };

  // Hardware-accelerated GPU translate3d animation for 100% buttery smooth 60fps/120fps motion
  useEffect(() => {
    const track = trackRef.current;
    if (!track || recentlyViewed.length <= 1) return;

    lastTimeRef.current = performance.now();
    const speed = 28; // Balanced golden speed (28px/sec)

    const step = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      if (!isPausedRef.current && !isDraggingRef.current && track) {
        const cycleWidth = getCycleWidth();
        if (cycleWidth > 0) {
          posRef.current += speed * delta;
          if (posRef.current >= cycleWidth) {
            posRef.current -= cycleWidth;
          }
          track.style.transform = `translate3d(-${posRef.current}px, 0, 0)`;
        }
      }

      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [recentlyViewed.length, displayItems, getCycleWidth]);

  if (recentlyViewed.length === 0) return null;

  return (
    <section className="hidden md:block my-6 md:my-10">
      <div 
        className="bg-white border border-gray-200/80 rounded-2xl md:rounded-3xl p-4 sm:p-6 shadow-xs"
        onMouseEnter={() => { isPausedRef.current = true; }}
        onMouseLeave={() => { isPausedRef.current = false; }}
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

        {/* Row: GPU-accelerated translate3d glide with NO bottom slider */}
        <div
          className="w-full overflow-hidden select-none py-1 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={trackRef}
            style={{
              willChange: 'transform',
              transform: 'translate3d(0, 0, 0)',
            }}
            className="flex gap-3 sm:gap-4 transition-none"
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
      </div>
    </section>
  );
};

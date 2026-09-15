import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { ShowcaseSection } from '../../contexts/SettingsContext';
import { Flame, Star, Sparkles, Zap, ChevronRight, ChevronLeft } from 'lucide-react';

interface ShowcaseStripProps {
  showcase: ShowcaseSection;
  products: Product[];
}

export const ShowcaseStrip: React.FC<ShowcaseStripProps> = ({ showcase, products }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // If there are 0 products, do not render
  if (!products || products.length === 0) return null;

  const hasMoreThan4 = products.length > 4;

  // Duplicate list if > 4 to enable infinite wrap-around feel
  const displayItems = hasMoreThan4
    ? [...products, ...products, ...products]
    : products;

  // Check scroll bounds
  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  // Slide step calculation
  const getStepWidth = () => {
    const el = containerRef.current;
    if (!el) return 100;
    // Exactly 1 product width plus gap (4 items per view, so clientWidth / 4)
    return (el.clientWidth / 4);
  };

  const scrollNext = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const step = getStepWidth();
    // If reached near the end of duplicated list, reset smoothly to middle
    if (el.scrollLeft >= (el.scrollWidth * 2) / 3) {
      el.scrollLeft = el.scrollWidth / 3;
    }
    el.scrollBy({ left: step, behavior: 'smooth' });
  }, []);

  const scrollPrev = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const step = getStepWidth();
    if (el.scrollLeft <= el.scrollWidth / 4) {
      el.scrollLeft = el.scrollWidth / 2;
    }
    el.scrollBy({ left: -step, behavior: 'smooth' });
  }, []);

  // Auto-slide every 3.5 seconds if more than 4 products and not paused
  useEffect(() => {
    if (!hasMoreThan4 || isPaused) return;

    const timer = setInterval(() => {
      scrollNext();
    }, 3500);

    return () => clearInterval(timer);
  }, [hasMoreThan4, isPaused, scrollNext]);

  // Track scroll state
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState]);

  // Icon mapping
  const getIcon = () => {
    switch (showcase.type) {
      case 'trending':
        return <Flame className="w-4 h-4 fill-rose-600 text-rose-600" />;
      case 'featured':
        return <Star className="w-4 h-4 fill-amber-500 text-amber-500" />;
      case 'new_arrival':
        return <Sparkles className="w-4 h-4 text-blue-600" />;
      case 'flash_sale':
        return <Zap className="w-4 h-4 fill-rose-600 text-rose-600" />;
      default:
        return <Flame className="w-4 h-4 fill-rose-600 text-rose-600" />;
    }
  };

  const linkTarget = `/shop?filter=${showcase.type}`;

  return (
    <div className="space-y-2.5">
      {/* Sleek Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {getIcon()}
          <h3 className="text-sm font-extrabold text-gray-950 tracking-tight">
            {showcase.title}
          </h3>
          {showcase.subtitle && (
            <span className="hidden sm:inline text-[11px] text-gray-400 font-normal ml-1">
              • {showcase.subtitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {hasMoreThan4 && (
            <div className="hidden sm:flex items-center gap-1 mr-1">
              <button
                type="button"
                onClick={scrollPrev}
                className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
                aria-label="Previous"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
                aria-label="Next"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <Link
            to={linkTarget}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-0.5 transition"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4-Item Row (Auto-sliding if > 4, completely static if <= 4) */}
      {!hasMoreThan4 ? (
        /* Static 4-column grid when <= 4 products */
        <div className="grid grid-cols-4 gap-2 sm:gap-3.5">
          {products.slice(0, 4).map((product, idx) => (
            <ShowcaseItem key={`${product.id}-${idx}`} product={product} />
          ))}
        </div>
      ) : (
        /* Smooth Horizontal Auto-Slide Carousel when > 4 products */
        <div
          ref={containerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => {
            setTimeout(() => setIsPaused(false), 2000);
          }}
          className="flex gap-2 sm:gap-3.5 overflow-x-auto no-scrollbar scroll-smooth select-none py-0.5"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {displayItems.map((product, idx) => (
            <div
              key={`${product.id}-${idx}`}
              className="flex-shrink-0 w-[calc((100%-24px)/4)] sm:w-[calc((100%-36px)/4)]"
              style={{ scrollSnapAlign: 'start' }}
            >
              <ShowcaseItem product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Pure image card with NO external text/info as strictly requested
const ShowcaseItem: React.FC<{ product: Product }> = ({ product }) => {
  const coverImage = product.images?.[0] || (product as any).image || '/logo.webp';

  return (
    <Link
      to={`/product/${product.slug || product.id}`}
      className="block relative aspect-square w-full rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer"
      title={product.title}
    >
      <div className="w-full h-full p-1 sm:p-2 flex items-center justify-center">
        <img
          src={coverImage}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300 pointer-events-none"
        />
      </div>
    </Link>
  );
};

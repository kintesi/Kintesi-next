import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { ShowcaseSection } from '../../contexts/SettingsContext';
import { Flame, Star, Sparkles, Zap, ChevronRight, ChevronLeft } from 'lucide-react';
import { optimizeImageUrl } from '../../lib/utils';

interface ShowcaseStripProps {
  showcase: ShowcaseSection;
  products: Product[];
  viewAllLink?: string;
  icon?: React.ReactNode;
  autoSlide?: boolean;
}

export const ShowcaseStrip: React.FC<ShowcaseStripProps> = ({
  showcase,
  products,
  viewAllLink,
  icon,
  autoSlide = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const validProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    return products.filter((p) => p && (p.id || p.slug));
  }, [products]);

  // Check scroll bounds for chevron buttons
  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [validProducts, checkScroll]);

  // Clean, flicker-free auto-slide (only when explicitly enabled)
  useEffect(() => {
    if (!autoSlide || isPaused) return;
    const el = containerRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;

    const timer = setInterval(() => {
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const firstChild = el.children[0] as HTMLElement | undefined;
        const secondChild = el.children[1] as HTMLElement | undefined;
        const step = firstChild && secondChild
          ? (secondChild.offsetLeft - firstChild.offsetLeft) * 2
          : el.clientWidth * 0.5;
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 3800);

    return () => clearInterval(timer);
  }, [autoSlide, isPaused]);

  if (!showcase || validProducts.length === 0) return null;

  const scrollLeft = () => {
    const el = containerRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.75;
    el.scrollBy({ left: -step, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const el = containerRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.75;
    el.scrollBy({ left: step, behavior: 'smooth' });
  };

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

  const linkTarget = viewAllLink || `/showcase/${showcase.id || showcase.type || 'trending'}`;
  const displayIcon = icon || getIcon();

  return (
    <div className="space-y-2.5">
      {/* Sleek Header (Clean title, chevron controls, and View All) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          {displayIcon}
          <h3 className="text-sm font-extrabold text-gray-950 tracking-tight truncate">
            {showcase.title}
          </h3>
          {showcase.subtitle && (
            <span className="hidden sm:inline text-[11px] text-gray-400 font-normal ml-1 truncate">
              • {showcase.subtitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Subtle desktop navigation chevrons */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${
                canScrollLeft
                  ? 'border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 cursor-pointer shadow-2xs'
                  : 'border-gray-100 text-gray-300 cursor-not-allowed opacity-40'
              }`}
              aria-label="Previous items"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${
                canScrollRight
                  ? 'border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 cursor-pointer shadow-2xs'
                  : 'border-gray-100 text-gray-300 cursor-not-allowed opacity-40'
              }`}
              aria-label="Next items"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <Link
            to={linkTarget}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-0.5 transition"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Row: 4 items visible on mobile, 6 on tablet, 8 on PC
          - Hardware accelerated smooth scrolling with snap
          - Zero flickering, zero loop jumping */}
      <div
        ref={containerRef}
        onScroll={checkScroll}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex gap-2 sm:gap-3 overflow-x-auto select-none py-1 scroll-smooth snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {validProducts.map((product, idx) => (
          <div
            key={`${product.id || product.slug || idx}`}
            className="flex-shrink-0 snap-start w-[calc((100%-24px)/4)] sm:w-[calc((100%-50px)/6)] lg:w-[calc((100%-84px)/8)]"
          >
            <ShowcaseItem product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Pure image card with NO external text/info as strictly requested
const ShowcaseItem: React.FC<{ product: Product }> = React.memo(({ product }) => {
  if (!product) return null;
  const coverImage = product.images?.[0] || (product as any).image || '/logo.webp';
  const targetUrl = `/product/${product.slug || product.id || ''}`;

  return (
    <Link
      to={targetUrl}
      className="block relative aspect-square w-full rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer"
      title={product.title || ''}
    >
      <div className="w-full h-full p-1 sm:p-2 flex items-center justify-center bg-gray-50/50">
        <img
          src={optimizeImageUrl(coverImage, 350)}
          alt={product.title || 'Product'}
          decoding="async"
          loading="eager"
          fetchPriority="high"
          className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300 pointer-events-none"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/logo.webp';
          }}
        />
      </div>
    </Link>
  );
});
ShowcaseItem.displayName = 'ShowcaseItem';

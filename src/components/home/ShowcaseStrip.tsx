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
  autoSlide = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isHoveredRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const validProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    return products.filter((p) => p && (p.id || p.slug));
  }, [products]);

  // Expand array to at least 24 items to guarantee continuous infinite runway without hitting scroll ceiling
  const displayProducts = useMemo(() => {
    if (validProducts.length === 0) return [];
    let list = [...validProducts];
    while (list.length < 24) {
      list = [...list, ...validProducts];
    }
    return list;
  }, [validProducts]);

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

  // Continuous smooth infinite scrolling (no sudden jump / ak dhape samne asbe na / never freezes)
  useEffect(() => {
    const el = containerRef.current;
    if (!autoSlide || !el || validProducts.length <= 1) return;

    let lastTime = performance.now();
    const speed = 18; // Gentle, steady, readable gliding speed (18px/sec)

    const step = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap delta to prevent jump on tab refocus
      lastTime = currentTime;

      if (!isHoveredRef.current && el) {
        // Measure exact width of one single cycle of products
        const firstChild = el.children[0] as HTMLElement | undefined;
        const targetChild = el.children[validProducts.length] as HTMLElement | undefined;
        const oneCycleWidth = (targetChild && firstChild)
          ? (targetChild.offsetLeft - firstChild.offsetLeft)
          : (el.scrollWidth / (displayProducts.length / validProducts.length));

        if (oneCycleWidth > 0) {
          el.scrollLeft += speed * delta;
          // When 1 full original cycle has passed, wrap back by exactly that cycle's width
          // Producing ZERO visual movement or jump
          if (el.scrollLeft >= oneCycleWidth) {
            el.scrollLeft -= oneCycleWidth;
          }
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
  }, [autoSlide, validProducts.length, displayProducts]);

  if (!showcase || validProducts.length === 0) return null;

  const scrollLeft = () => {
    const el = containerRef.current;
    if (!el) return;
    const firstChild = el.children[0] as HTMLElement | undefined;
    const targetChild = el.children[validProducts.length] as HTMLElement | undefined;
    const oneCycleWidth = (targetChild && firstChild)
      ? (targetChild.offsetLeft - firstChild.offsetLeft)
      : el.clientWidth * 0.75;

    el.scrollBy({ left: -240, behavior: 'smooth' });
    if (el.scrollLeft <= 0 && oneCycleWidth > 0) {
      el.scrollLeft += oneCycleWidth;
    }
  };

  const scrollRight = () => {
    const el = containerRef.current;
    if (!el) return;
    const firstChild = el.children[0] as HTMLElement | undefined;
    const targetChild = el.children[validProducts.length] as HTMLElement | undefined;
    const oneCycleWidth = (targetChild && firstChild)
      ? (targetChild.offsetLeft - firstChild.offsetLeft)
      : el.clientWidth * 0.75;

    el.scrollBy({ left: 240, behavior: 'smooth' });
    if (el.scrollLeft >= oneCycleWidth && oneCycleWidth > 0) {
      el.scrollLeft -= oneCycleWidth;
    }
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
    <div 
      className="space-y-2.5"
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => { isHoveredRef.current = false; }}
    >
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
          - Continuous hardware-accelerated smooth infinite glide
          - Completely hidden scrollbar slider across all devices */}
      <div
        ref={containerRef}
        onScroll={checkScroll}
        onTouchStart={() => { isHoveredRef.current = true; }}
        onTouchEnd={() => {
          setTimeout(() => {
            isHoveredRef.current = false;
          }, 300);
        }}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
        className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none py-1 cursor-grab active:cursor-grabbing"
      >
        {displayProducts.map((product, idx) => (
          <div
            key={`${product.id || product.slug || idx}-${idx}`}
            className="flex-shrink-0 w-[calc((100%-24px)/4)] sm:w-[calc((100%-50px)/6)] lg:w-[calc((100%-84px)/8)]"
          >
            <ShowcaseItem product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Pure image card with NO external text/info
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

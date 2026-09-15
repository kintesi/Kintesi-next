import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { ShowcaseSection } from '../../contexts/SettingsContext';
import { Flame, Star, Sparkles, Zap, ChevronRight } from 'lucide-react';

interface ShowcaseStripProps {
  showcase: ShowcaseSection;
  products: Product[];
}

export const ShowcaseStrip: React.FC<ShowcaseStripProps> = ({ showcase, products }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // If there are 0 products, do not render
  if (!products || products.length === 0) return null;

  // On PC view (Desktop >= 768px): 8 products per serial/row
  // On Mobile view: 4 products per serial/row
  const threshold = isDesktop ? 8 : 4;
  const hasMoreThanThreshold = products.length > threshold;

  // Duplicate list if > threshold to enable infinite continuous wrap-around feel
  const displayItems = useMemo(() => {
    if (!hasMoreThanThreshold) return products;
    return [...products, ...products, ...products];
  }, [products, hasMoreThanThreshold]);

  // Seamless infinite reset on scroll
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el || !hasMoreThanThreshold) return;
    const oneThird = el.scrollWidth / 3;
    if (el.scrollLeft >= oneThird * 2) {
      el.scrollLeft -= oneThird;
    } else if (el.scrollLeft <= 0) {
      el.scrollLeft += oneThird;
    }
  };

  // Set initial scroll to middle set so backward scroll/swipe is also infinite
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !hasMoreThanThreshold) return;
    const frame = requestAnimationFrame(() => {
      if (el && el.scrollWidth > 0) {
        el.scrollLeft = el.scrollWidth / 3;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [hasMoreThanThreshold, displayItems.length]);

  const scrollNext = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const firstCard = el.children[0] as HTMLElement | undefined;
    const secondCard = el.children[1] as HTMLElement | undefined;
    const step = (firstCard && secondCard)
      ? (secondCard.offsetLeft - firstCard.offsetLeft)
      : (el.clientWidth / (isDesktop ? 8 : 4));

    el.scrollBy({ left: step, behavior: 'smooth' });
  }, [isDesktop]);

  // Auto-advance infinitely every 3.5 seconds if more than threshold and not paused
  useEffect(() => {
    if (!hasMoreThanThreshold || isPaused) return;

    const timer = setInterval(() => {
      scrollNext();
    }, 3500);

    return () => clearInterval(timer);
  }, [hasMoreThanThreshold, isPaused, scrollNext]);

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

  const linkTarget = `/showcase/${showcase.id || showcase.type}`;

  return (
    <div className="space-y-2.5">
      {/* Sleek Header (Clean title and View All, no slider buttons) */}
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

        <Link
          to={linkTarget}
          className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-0.5 transition"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Row: 4 items on mobile, 8 items on PC view
          - Completely static if <= threshold (<=4 on mobile, <=8 on PC)
          - Seamless infinite auto-advance if > threshold */}
      {!hasMoreThanThreshold ? (
        /* Static grid: 4 columns on mobile, 8 columns on PC */
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3">
          {products.slice(0, threshold).map((product, idx) => (
            <ShowcaseItem key={`${product.id}-${idx}`} product={product} />
          ))}
        </div>
      ) : (
        /* Seamless Infinite Overflow-Hidden Auto-Slide when products > threshold */
        <div
          ref={containerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onScroll={handleScroll}
          className="flex gap-2 md:gap-3 overflow-hidden scroll-smooth select-none py-0.5"
        >
          {displayItems.map((product, idx) => (
            <div
              key={`${product.id}-${idx}`}
              className="flex-shrink-0 w-[calc((100%-24px)/4)] md:w-[calc((100%-84px)/8)]"
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

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { ShowcaseSection } from '../../contexts/SettingsContext';
import { Flame, Star, Sparkles, Zap, ChevronRight } from 'lucide-react';

interface ShowcaseStripProps {
  showcase: ShowcaseSection;
  products: Product[];
  viewAllLink?: string;
  icon?: React.ReactNode;
}

export const ShowcaseStrip: React.FC<ShowcaseStripProps> = ({
  showcase,
  products,
  viewAllLink,
  icon,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // Auto-slide whenever there are 2 or more products so items come one after another continuously
  const shouldSlide = products.length >= 2;

  // Duplicate list enough times so infinite continuous scrolling is completely seamless
  const displayItems = useMemo(() => {
    if (!shouldSlide) return products;
    const repeatCount = Math.max(4, Math.ceil(24 / products.length));
    const list: Product[] = [];
    for (let i = 0; i < repeatCount; i++) {
      list.push(...products);
    }
    return list;
  }, [products, shouldSlide]);

  // Set initial scroll to cycle 1 so backward swipe is also infinite
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !shouldSlide) return;

    const initTimer = setTimeout(() => {
      if (!el) return;
      const firstCard = el.children[0] as HTMLElement | undefined;
      const secondCard = el.children[1] as HTMLElement | undefined;
      if (firstCard && secondCard) {
        const cardStep = secondCard.offsetLeft - firstCard.offsetLeft;
        const cycleWidth = cardStep * products.length;
        el.scrollTo({ left: cycleWidth, behavior: 'auto' });
      }
    }, 100);

    return () => clearTimeout(initTimer);
  }, [shouldSlide, products.length]);

  // Seamless infinite reset check
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el || !shouldSlide) return;

    const firstCard = el.children[0] as HTMLElement | undefined;
    const secondCard = el.children[1] as HTMLElement | undefined;
    if (!firstCard || !secondCard) return;

    const cardStep = secondCard.offsetLeft - firstCard.offsetLeft;
    const cycleWidth = cardStep * products.length;
    const maxScroll = el.scrollWidth - el.clientWidth;

    // Reset forward seamlessly
    if (el.scrollLeft >= cycleWidth * 2 || el.scrollLeft >= maxScroll - cardStep) {
      el.scrollTo({ left: el.scrollLeft - cycleWidth, behavior: 'auto' });
    }
    // Reset backward seamlessly
    else if (el.scrollLeft <= cardStep) {
      el.scrollTo({ left: el.scrollLeft + cycleWidth, behavior: 'auto' });
    }
  };

  const scrollNext = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const firstCard = el.children[0] as HTMLElement | undefined;
    const secondCard = el.children[1] as HTMLElement | undefined;
    const step = (firstCard && secondCard)
      ? (secondCard.offsetLeft - firstCard.offsetLeft)
      : (el.clientWidth / (isDesktop ? 8 : 4));

    const cycleWidth = step * products.length;
    const maxScroll = el.scrollWidth - el.clientWidth;

    // If near the end of cycle 2, snap to cycle 1 instantly before smooth scrolling
    if (el.scrollLeft >= cycleWidth * 2 || el.scrollLeft >= maxScroll - step * 2) {
      el.scrollTo({ left: el.scrollLeft - cycleWidth, behavior: 'auto' });
    }

    el.scrollBy({ left: step, behavior: 'smooth' });
  }, [isDesktop, products.length]);

  // Auto-advance infinitely every 2.6 seconds when not paused
  useEffect(() => {
    if (!shouldSlide || isPaused) return;

    const timer = setInterval(() => {
      scrollNext();
    }, 2600);

    return () => clearInterval(timer);
  }, [shouldSlide, isPaused, scrollNext]);

  const handleTouchStart = () => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    setIsPaused(true);
  };

  const handleTouchEnd = () => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3000);
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

  const linkTarget = viewAllLink || `/showcase/${showcase.id || showcase.type}`;
  const displayIcon = icon || getIcon();

  return (
    <div className="space-y-2.5">
      {/* Sleek Header (Clean title and View All) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {displayIcon}
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

      {/* Row: 4 items visible on mobile, 8 items visible on PC
          - Seamless continuous auto-slide one after another
          - Supports touch swiping on mobile and trackpad scrolling */}
      {!shouldSlide ? (
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3">
          {products.map((product, idx) => (
            <ShowcaseItem key={`${product.id}-${idx}`} product={product} />
          ))}
        </div>
      ) : (
        <div
          ref={containerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onScroll={handleScroll}
          className="flex gap-2 md:gap-3 overflow-x-auto select-none py-0.5 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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

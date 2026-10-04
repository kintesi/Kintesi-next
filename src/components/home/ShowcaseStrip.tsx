import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { ShowcaseSection } from '../../contexts/SettingsContext';
import { Flame, Star, Sparkles, Zap, ChevronRight, ChevronLeft, Timer } from 'lucide-react';
import { optimizeImageUrl, formatPrice } from '../../lib/utils';

interface ShowcaseStripProps {
  showcase: ShowcaseSection;
  products: Product[];
  viewAllLink?: string;
  icon?: React.ReactNode;
  autoSlide?: boolean;
  timeLeft?: { hours: number; minutes: number; seconds: number };
}

export const ShowcaseStrip: React.FC<ShowcaseStripProps> = ({
  showcase,
  products,
  viewAllLink,
  icon,
  autoSlide = true,
  timeLeft,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isPausedRef = useRef(false);
  const posRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  const touchStartXRef = useRef(0);
  const touchStartPosRef = useRef(0);
  const isDraggingRef = useRef(false);

  const validProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    return products.filter((p) => p && (p.id || p.slug));
  }, [products]);

  // Expand array to ensure seamless infinite looping runway
  const displayProducts = useMemo(() => {
    if (validProducts.length === 0) return [];
    let list = [...validProducts];
    while (list.length < 24) {
      list = [...list, ...validProducts];
    }
    return list;
  }, [validProducts]);

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
    if (!track || validProducts.length === 0) return 0;
    const firstChild = track.children[0] as HTMLElement | undefined;
    const targetChild = track.children[validProducts.length] as HTMLElement | undefined;
    if (firstChild && targetChild) {
      return targetChild.offsetLeft - firstChild.offsetLeft;
    }
    return track.scrollWidth / (displayProducts.length / validProducts.length);
  }, [validProducts.length, displayProducts.length]);

  // Hardware-accelerated GPU translate3d animation for 100% buttery smooth 60fps/120fps motion
  useEffect(() => {
    const track = trackRef.current;
    if (!autoSlide || !track || validProducts.length <= 1) return;

    lastTimeRef.current = performance.now();
    // Balanced golden speed: 28px/second (calm, steady, not too fast, not too slow)
    const speed = 28;

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
  }, [autoSlide, validProducts.length, displayProducts, getCycleWidth]);

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

  const scrollLeft = () => {
    const cycleWidth = getCycleWidth();
    posRef.current -= 240;
    if (cycleWidth > 0 && posRef.current < 0) {
      posRef.current += cycleWidth;
    }
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(-${posRef.current}px, 0, 0)`;
    }
  };

  const scrollRight = () => {
    const cycleWidth = getCycleWidth();
    posRef.current += 240;
    if (cycleWidth > 0 && posRef.current >= cycleWidth) {
      posRef.current -= cycleWidth;
    }
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(-${posRef.current}px, 0, 0)`;
    }
  };

  // Countdown timer logic for Flash Sale
  const [internalTime, setInternalTime] = useState({ hours: 3, minutes: 24, seconds: 45 });

  useEffect(() => {
    if (showcase.type !== 'flash_sale' && !showcase.title.toLowerCase().includes('flash')) return;

    const tick = () => {
      const now = new Date();
      const h = 3 - (now.getHours() % 4);
      const m = 59 - now.getMinutes();
      const s = 59 - now.getSeconds();
      setInternalTime({ hours: h, minutes: m, seconds: s });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [showcase.type, showcase.title]);

  const timerState = timeLeft || internalTime;
  const isFlash = showcase.type === 'flash_sale' || showcase.title.toLowerCase().includes('flash');

  if (!showcase || validProducts.length === 0) return null;

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
      onMouseEnter={() => { isPausedRef.current = true; }}
      onMouseLeave={() => { isPausedRef.current = false; }}
    >
      {/* Sleek Header (Clean title, countdown timer, chevron controls, and View All) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            {displayIcon}
            <h3 className="text-sm font-black text-gray-950 tracking-tight truncate">
              {showcase.title}
            </h3>
          </div>

          {/* Live Flash Countdown Timer requested by user */}
          {isFlash && (
            <div className="inline-flex items-center gap-1 bg-gradient-to-r from-slate-950 to-gray-900 text-white px-2 py-0.5 rounded-lg shadow-xs font-mono font-bold text-[10px] border border-slate-800">
              <Timer className="w-3 h-3 text-rose-500 animate-pulse shrink-0" />
              <span>{String(timerState.hours).padStart(2, '0')}</span>
              <span className="text-slate-400 font-sans">:</span>
              <span>{String(timerState.minutes).padStart(2, '0')}</span>
              <span className="text-slate-400 font-sans">:</span>
              <span className="text-rose-400">{String(timerState.seconds).padStart(2, '0')}</span>
            </div>
          )}

          {showcase.subtitle && !isFlash && (
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
              className="w-6 h-6 rounded-full flex items-center justify-center border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 cursor-pointer shadow-2xs transition active:scale-95"
              aria-label="Previous items"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              className="w-6 h-6 rounded-full flex items-center justify-center border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 cursor-pointer shadow-2xs transition active:scale-95"
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
          - GPU Subpixel Translate3d for pure 60fps/120fps smoothness (no jitter, no jump)
          - Overflow-hidden guarantees zero bottom scrollbar slider */}
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
          className="flex gap-2 sm:gap-3 transition-none"
        >
          {displayProducts.map((product, idx) => (
            <div
              key={`${product.id || product.slug || idx}-${idx}`}
              className="flex-shrink-0 w-[calc((100vw-36px)/4)] sm:w-[calc((100vw-60px)/6)] lg:w-[130px]"
            >
              <ShowcaseItem product={product} isFlash={isFlash} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Ultra-premium card with floating glass price pill & discount badge
const ShowcaseItem: React.FC<{ product: Product; isFlash?: boolean }> = React.memo(({ product, isFlash }) => {
  if (!product) return null;
  const coverImage = product.images?.[0] || (product as any).image || '/logo.webp';
  const targetUrl = `/product/${product.slug || product.id || ''}`;
  const price = product.discount_price || product.price;
  const originalPrice = product.price;
  const hasDiscount = originalPrice && product.discount_price && Number(originalPrice) > Number(product.discount_price);
  const discountPercent = hasDiscount ? Math.round(((Number(originalPrice) - Number(product.discount_price)) / Number(originalPrice)) * 100) : 0;

  return (
    <Link
      to={targetUrl}
      className="block relative aspect-square w-full rounded-2xl bg-gradient-to-b from-white via-white to-rose-50/30 border border-rose-100/90 shadow-[0_2px_10px_rgba(225,29,72,0.04)] hover:shadow-md hover:border-rose-300 transition-all duration-300 overflow-hidden group cursor-pointer"
      title={product.title || ''}
    >
      {/* Top Discount Tag */}
      {hasDiscount && discountPercent > 0 && (
        <span className="absolute top-1 left-1 z-10 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-xs uppercase tracking-tight">
          {discountPercent}% OFF
        </span>
      )}

      {/* Product Image Stage */}
      <div className="w-full h-full p-2 flex items-center justify-center">
        <img
          src={optimizeImageUrl(coverImage, 350)}
          alt={product.title || 'Product'}
          decoding="async"
          loading="eager"
          fetchPriority="high"
          className="w-full h-full object-contain rounded-xl group-hover:scale-108 transition-transform duration-300 pointer-events-none"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/logo.webp';
          }}
        />
      </div>

      {/* Floating Bottom Price Tag for Premium Vibe */}
      {price && (
        <div className="absolute bottom-1 inset-x-1 z-10 flex items-center justify-between pointer-events-none">
          <span className="bg-gray-950/85 backdrop-blur-md text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs leading-none">
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="text-gray-400 text-[8px] font-bold line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
      )}
    </Link>
  );
});
ShowcaseItem.displayName = 'ShowcaseItem';

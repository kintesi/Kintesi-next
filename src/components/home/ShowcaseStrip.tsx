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
      className={`transition-all ${
        isFlash 
          ? 'bg-gradient-to-b from-rose-500/[0.08] via-amber-500/[0.04] to-rose-500/[0.05] border border-rose-300/80 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_4px_25px_rgba(244,63,94,0.08)] relative overflow-hidden space-y-3' 
          : 'space-y-2.5'
      }`}
      onMouseEnter={() => { isPausedRef.current = true; }}
      onMouseLeave={() => { isPausedRef.current = false; }}
    >
      {/* Decorative ambient flares when isFlash */}
      {isFlash && (
        <>
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-400" />
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
        </>
      )}

      {/* Sleek Header (Clean title, countdown timer, chevron controls, and View All) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          {isFlash ? (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Fiery Flash Sale Badge */}
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-black text-xs sm:text-sm px-2.5 py-1 rounded-xl shadow-xs uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300 animate-pulse shrink-0" />
                <span>{showcase.title || 'Flash Sale'}</span>
              </div>

              {/* Digital Countdown Timer */}
              <div className="inline-flex items-center gap-1 bg-gray-950 text-white px-2 py-0.5 rounded-lg shadow-xs font-mono font-bold text-[11px] border border-gray-800">
                <Timer className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />
                <span className="bg-gray-800/90 px-1 py-0.5 rounded text-white font-black">{String(timerState.hours).padStart(2, '0')}</span>
                <span className="text-amber-400 font-bold">:</span>
                <span className="bg-gray-800/90 px-1 py-0.5 rounded text-white font-black">{String(timerState.minutes).padStart(2, '0')}</span>
                <span className="text-amber-400 font-bold">:</span>
                <span className="bg-rose-600 px-1 py-0.5 rounded text-white font-black animate-pulse">{String(timerState.seconds).padStart(2, '0')}</span>
              </div>

              {/* Live Urgency Tag */}
              <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-100/90 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-tight">
                <Flame className="w-3 h-3 fill-rose-600 text-rose-600 shrink-0" />
                Limited Deals
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              {displayIcon}
              <h3 className="text-sm font-black text-gray-950 tracking-tight truncate">
                {showcase.title}
              </h3>
              {showcase.subtitle && (
                <span className="hidden sm:inline text-[11px] text-gray-400 font-normal ml-1 truncate">
                  • {showcase.subtitle}
                </span>
              )}
            </div>
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
            className={
              isFlash
                ? "bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-0.5 transition active:scale-95"
                : "text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-0.5 transition"
            }
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

  // Calculate simulated claimed percentage (72% - 93%) to induce high-converting flash sale urgency
  const claimPercent = useMemo(() => {
    if (!product.id) return 82;
    const charSum = String(product.id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return 72 + (charSum % 22);
  }, [product.id]);

  if (isFlash) {
    return (
      <Link
        to={targetUrl}
        className="block relative aspect-[1/1.22] w-full rounded-2xl bg-white border-2 border-rose-200/90 hover:border-rose-500 shadow-[0_2px_8px_rgba(225,29,72,0.08)] hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer"
        title={product.title || ''}
      >
        {/* Deal Discount Badge */}
        <span className="absolute top-1 left-1 z-10 bg-gradient-to-r from-red-600 to-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-xs uppercase tracking-tight flex items-center gap-0.5">
          <Zap className="w-2.5 h-2.5 fill-white shrink-0" />
          {discountPercent > 0 ? `${discountPercent}% OFF` : 'DEAL'}
        </span>

        {/* Product Image */}
        <div className="w-full h-[62%] p-1.5 flex items-center justify-center bg-gray-50/40">
          <img
            src={optimizeImageUrl(coverImage, 350)}
            alt={product.title || 'Product'}
            decoding="async"
            loading="eager"
            fetchPriority="high"
            className="w-full h-full object-contain rounded-lg group-hover:scale-110 transition-transform duration-300 pointer-events-none"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/logo.webp';
            }}
          />
        </div>

        {/* Dedicated Flash Deal Bottom Panel */}
        <div className="absolute bottom-0 inset-x-0 h-[38%] bg-gradient-to-t from-gray-950 via-gray-950/95 to-gray-900 text-white px-1.5 py-1 flex flex-col justify-between">
          <div className="flex items-baseline justify-between gap-1 leading-none">
            <span className="text-[10px] sm:text-[11px] font-black text-amber-300">
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="text-[7.5px] text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
          {/* Urgency Progress Bar */}
          <div className="w-full">
            <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 h-full rounded-full"
                style={{ width: `${claimPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[7px] text-rose-300 font-bold uppercase tracking-tighter leading-none mt-0.5">
              <span>Fast Selling</span>
              <span>{claimPercent}%</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

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

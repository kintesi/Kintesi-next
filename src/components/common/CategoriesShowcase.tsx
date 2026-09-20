import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../../types';
import { INITIAL_CATEGORIES } from '../../data/mockData';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoriesShowcaseProps {
  categories?: Category[];
  selectedCategory?: string;
  onSelectCategory?: (slug: string) => void;
  className?: string;
}

// Popular categories ordered logically for high-conversion browsing
const ORDERED_SLUGS = [
  'womens-fashion',
  'mens-fashion',
  'phones-accessories',
  'computer-gaming',
  'health-beauty',
  'watches-bags',
  'home-living',
  'groceries-pet-supplies',
  'electronic-accessories',
  'tv-home-appliances',
  'lifestyle-hobbies',
  'sports-outdoors',
  'mother-baby',
  'automotives-motorbikes',
];

interface InteractiveCategoryRowProps {
  categories: Category[];
  speed: number;
  selectedCategory?: string;
  onSelectCategory?: (slug: string) => void;
  rowPrefix: string;
  isPaused: () => boolean;
  trigger10SecondPause: () => void;
}

// Interactive Category Row: 1-line smooth 60fps auto-slide with touch/mouse swipe and desktop nudge arrows
const InteractiveCategoryRow: React.FC<InteractiveCategoryRowProps> = ({
  categories,
  speed,
  selectedCategory = 'all',
  onSelectCategory,
  rowPrefix,
  isPaused,
  trigger10SecondPause,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const currentXRef = useRef<number>(0);
  const loopDistanceRef = useRef<number>(0);

  const isDraggingRef = useRef<boolean>(false);
  const hasMovedRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartPosRef = useRef<number>(0);

  // Repeat items 6 times (3 sets in first half, 3 sets in second half) for seamless endless loop
  const repeatedCategories = useMemo(() => {
    if (!categories.length) return [];
    return [
      ...categories,
      ...categories,
      ...categories,
      ...categories,
      ...categories,
      ...categories,
    ];
  }, [categories]);

  // Measure the exact loop distance between item 0 and item (categories.length * 3)
  const updateLoopDistance = useCallback(() => {
    if (!trackRef.current) return;
    const children = trackRef.current.children;
    const halfCount = categories.length * 3;
    if (children.length > halfCount && children[0] && children[halfCount]) {
      const item0 = children[0] as HTMLElement;
      const itemHalf = children[halfCount] as HTMLElement;
      const dist = itemHalf.offsetLeft - item0.offsetLeft;
      if (dist > 0) {
        loopDistanceRef.current = dist;
      }
    }
  }, [categories.length]);

  // Handle window resize and layout changes
  useEffect(() => {
    updateLoopDistance();
    window.addEventListener('resize', updateLoopDistance);
    return () => window.removeEventListener('resize', updateLoopDistance);
  }, [updateLoopDistance]);

  // Main 60fps animation loop using GPU translate3d
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const tick = (time: number) => {
      const delta = Math.min((time - lastTime) / 16.67, 2.5);
      lastTime = time;

      if (!loopDistanceRef.current) {
        updateLoopDistance();
      }

      // Auto-slide when not interacting and not paused by 10s timer
      if (!isDraggingRef.current && !isPaused() && trackRef.current && loopDistanceRef.current > 0) {
        currentXRef.current -= speed * delta;

        // Seamless wrap when reaching end of loop
        if (currentXRef.current <= -loopDistanceRef.current) {
          currentXRef.current += loopDistanceRef.current;
        }

        trackRef.current.style.transform = `translate3d(${currentXRef.current}px, 0, 0)`;
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [speed, isPaused, updateLoopDistance]);

  // Clamp & wrap X position within [-loopDistance, 0]
  const applyWrappedPosition = (pos: number) => {
    let x = pos;
    const dist = loopDistanceRef.current;
    if (dist > 0) {
      while (x > 0) x -= dist;
      while (x <= -dist) x += dist;
    }
    currentXRef.current = x;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
    }
  };

  // Nudge left or right programmatically (desktop arrow clicks)
  const nudge = (delta: number) => {
    applyWrappedPosition(currentXRef.current + delta);
    trigger10SecondPause();
  };

  // Touch handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartXRef.current = e.touches[0].clientX;
    dragStartPosRef.current = currentXRef.current;
    trigger10SecondPause();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const diff = e.touches[0].clientX - dragStartXRef.current;
    if (Math.abs(diff) > 4) {
      hasMovedRef.current = true;
    }
    applyWrappedPosition(dragStartPosRef.current + diff);
    trigger10SecondPause();
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    trigger10SecondPause();
  };

  // Mouse handlers for Desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartPosRef.current = currentXRef.current;
    trigger10SecondPause();

    const onWindowMouseMove = (ev: MouseEvent) => {
      const diff = ev.clientX - dragStartXRef.current;
      if (Math.abs(diff) > 4) {
        hasMovedRef.current = true;
      }
      applyWrappedPosition(dragStartPosRef.current + diff);
      trigger10SecondPause();
    };

    const onWindowMouseUp = () => {
      isDraggingRef.current = false;
      trigger10SecondPause();
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
  };

  const handleCategoryClick = (slug: string, e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onSelectCategory) {
      e.preventDefault();
      if (selectedCategory === slug) {
        onSelectCategory('all');
      } else {
        onSelectCategory(slug);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      className="group/row relative w-full overflow-hidden cursor-grab active:cursor-grabbing select-none py-1"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Desktop Prev/Next Hover Arrows */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          nudge(240);
        }}
        className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-gray-700 hover:text-rose-600 shadow-md border border-gray-200 items-center justify-center transition-all opacity-0 group-hover/row:opacity-100 hover:scale-110 cursor-pointer"
        title="Previous Categories"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          nudge(-240);
        }}
        className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-gray-700 hover:text-rose-600 shadow-md border border-gray-200 items-center justify-center transition-all opacity-0 group-hover/row:opacity-100 hover:scale-110 cursor-pointer"
        title="Next Categories"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Infinite Translate3d Track */}
      <div
        ref={trackRef}
        className="flex items-start gap-2.5 sm:gap-3.5 will-change-transform"
        style={{ width: 'max-content' }}
      >
        {repeatedCategories.map((cat, idx) => {
          const isSelected = selectedCategory === cat.slug;
          const imgSrc = cat.image_url || `/categories/${cat.slug}.webp`;
          const linkTarget = onSelectCategory
            ? '#'
            : `/shop?category=${encodeURIComponent(cat.slug)}`;

          return (
            <Link
              key={`${rowPrefix}-${cat.slug}-${idx}`}
              to={linkTarget}
              onClick={(e) => handleCategoryClick(cat.slug, e)}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className={`group relative shrink-0 flex flex-col items-center text-center cursor-pointer select-none transition-all duration-200 active:scale-95 w-[76px] sm:w-[90px] md:w-[102px] p-1.5 sm:p-2 rounded-2xl ${
                isSelected
                  ? 'bg-rose-50/90 border-2 border-rose-600 shadow-sm shadow-rose-600/20'
                  : 'bg-white hover:bg-rose-50/30 border border-gray-100/90 hover:border-rose-200 shadow-2xs hover:-translate-y-0.5'
              }`}
            >
              {/* Active Selected Checkmark Pill */}
              {isSelected && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[8px] sm:text-[9px] font-black shadow-2xs z-20">
                  ✓
                </span>
              )}

              {/* Large, High-Clarity Category Image Container */}
              <div
                className={`relative w-[58px] h-[58px] sm:w-[70px] sm:h-[70px] md:w-[80px] md:h-[80px] rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-300 pointer-events-none ${
                  isSelected
                    ? 'bg-white shadow-2xs border border-rose-200 ring-1 ring-rose-100'
                    : 'bg-gradient-to-b from-slate-50 to-white group-hover:bg-white border border-gray-100/90 group-hover:border-rose-200/70 shadow-2xs'
                }`}
              >
                <img
                  src={imgSrc}
                  alt={cat.name}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 select-none pointer-events-none"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.webp';
                  }}
                />
              </div>

              {/* Category Title (Natural multi-line, no text cutting) */}
              <span
                className={`text-[10px] sm:text-[11px] md:text-xs leading-tight font-bold text-center line-clamp-2 select-none transition-colors pointer-events-none px-0.5 mt-1 sm:mt-1.5 ${
                  isSelected
                    ? 'text-rose-700 font-black'
                    : 'text-gray-800 group-hover:text-rose-600'
                }`}
              >
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export const CategoriesShowcase: React.FC<CategoriesShowcaseProps> = ({
  categories = INITIAL_CATEGORIES,
  selectedCategory = 'all',
  onSelectCategory,
  className = '',
}) => {
  const pauseUntilRef = useRef<number>(0);

  const trigger10SecondPause = useCallback(() => {
    pauseUntilRef.current = Date.now() + 10000;
  }, []);

  const isPaused = useCallback(() => {
    return Date.now() < pauseUntilRef.current;
  }, []);

  const sortedCategories = useMemo(() => {
    const list = [...categories];
    return list.sort((a, b) => {
      const idxA = ORDERED_SLUGS.indexOf(a.slug);
      const idxB = ORDERED_SLUGS.indexOf(b.slug);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [categories]);

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      {/* 
        1 Single Horizontal Line of Categories:
        - Sleek, compact, zero wasted vertical space
        - 60fps GPU auto-slide with manual touch swipe & mouse drag
        - 10-second auto-pause on interaction
      */}
      <InteractiveCategoryRow
        categories={sortedCategories}
        speed={0.4}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        rowPrefix="single-cat"
        isPaused={isPaused}
        trigger10SecondPause={trigger10SecondPause}
      />
    </div>
  );
};

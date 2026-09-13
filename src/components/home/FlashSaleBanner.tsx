import React, { useState, useEffect, useRef } from 'react';
import { Flame, Timer, ChevronLeft, ChevronRight } from 'lucide-react';
import { FlashSaleSlide } from '../../contexts/SettingsContext';

interface FlashSaleBannerProps {
  slides?: FlashSaleSlide[];
  defaultTag?: string;
  defaultTitle?: string;
  defaultSubtitle?: string;
  defaultBgImage?: string;
  theme?: string;
  timeLeft: { hours: number; minutes: number; seconds: number };
  isMobile?: boolean;
}

const getFlashThemeClasses = (theme?: string) => {
  switch (theme) {
    case 'emerald':
      return 'from-emerald-800 via-teal-800 to-cyan-900';
    case 'cyber':
      return 'from-purple-900 via-indigo-900 to-pink-900';
    case 'dark':
      return 'from-gray-950 via-slate-900 to-zinc-950 border border-amber-500/30';
    default:
      return 'from-rose-700 via-orange-700 to-amber-600';
  }
};

export const FlashSaleBanner: React.FC<FlashSaleBannerProps> = ({
  slides = [],
  defaultTag,
  defaultTitle,
  defaultSubtitle,
  defaultBgImage,
  theme = 'sunset',
  timeLeft,
  isMobile = false,
}) => {
  // Normalize slides
  const activeSlides: FlashSaleSlide[] =
    slides && slides.length > 0
      ? slides.map((s, idx) => ({
          id: s.id || `slide-${idx}`,
          tag: s.tag || defaultTag || '⚡ FLASH SALE',
          title: s.title || defaultTitle || 'Exclusive 24-Hour Super Deals',
          subtitle: s.subtitle || defaultSubtitle || 'Limited stock flash offers with special discount.',
          bgImage: s.bgImage || defaultBgImage || '',
        }))
      : [
          {
            id: 'default',
            tag: defaultTag || '⚡ FLASH SALE',
            title: defaultTitle || 'Exclusive 24-Hour Super Deals',
            subtitle: defaultSubtitle || 'Limited stock flash offers with up to 50% discount. Order before time runs out!',
            bgImage: defaultBgImage || '',
          },
        ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auto-slide transition: 4.5 seconds (sweet spot for reading text & seeing visual)
  useEffect(() => {
    if (activeSlides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [activeSlides.length, isPaused]);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  // Safe index in case slides array changes dynamically
  const safeIndex = currentIndex % activeSlides.length;

  if (isMobile) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl shadow-md min-h-[140px] text-white select-none transition-all"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Render Background Layer for each slide with crossfade */}
        {activeSlides.map((slide, idx) => {
          const isActive = idx === safeIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'
              }`}
            >
              {slide.bgImage ? (
                <img
                  src={slide.bgImage}
                  alt={slide.title}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-r ${getFlashThemeClasses(theme)}`} />
              )}
            </div>
          );
        })}

        {/* Content Container (Pinned Countdown & Dynamic Animated Text) */}
        <div className="relative z-10 p-3 space-y-2">
          {/* Top Row: Tag and Countdown Timer */}
          <div className="flex items-center justify-between gap-2">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/55 backdrop-blur-md text-[10px] font-black uppercase tracking-wider border border-white/20 shadow-sm">
              <Flame className="w-3 h-3 fill-white text-amber-300 animate-pulse" />
              <span>{activeSlides[safeIndex]?.tag || '⚡ FLASH SALE'}</span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/25 text-[10px] font-mono font-bold shadow-sm">
              <Timer className="w-3 h-3 text-amber-300 mr-0.5" />
              <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span>:</span>
              <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
              <span>:</span>
              <span className="text-amber-300">{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>
          </div>

          {/* Heading and Subtitle with keyframe animation */}
          <div
            key={safeIndex}
            className={`animate-in fade-in slide-in-from-bottom-2 duration-500 ${
              activeSlides[safeIndex]?.bgImage
                ? 'bg-black/50 backdrop-blur-md p-2.5 rounded-xl border border-white/20 shadow-lg'
                : ''
            }`}
          >
            <h3 className="text-sm font-black text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] line-clamp-2">
              {activeSlides[safeIndex]?.title}
            </h3>
            {activeSlides[safeIndex]?.subtitle && (
              <p className="text-white text-[10px] mt-0.5 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-2 font-medium">
                {activeSlides[safeIndex]?.subtitle}
              </p>
            )}
          </div>

          {/* Bottom Indicators (if multiple slides) */}
          {activeSlides.length > 1 && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                {activeSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === safeIndex ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/40'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
              <span className="text-[9px] font-bold text-white/60">
                {safeIndex + 1}/{activeSlides.length}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop View
  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-xl min-h-[175px] mb-6 text-white group select-none transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Layers for each slide */}
      {activeSlides.map((slide, idx) => {
        const isActive = idx === safeIndex;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'
            }`}
          >
            {slide.bgImage ? (
              <img
                src={slide.bgImage}
                alt={slide.title}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-r ${getFlashThemeClasses(theme)}`} />
            )}
          </div>
        );
      })}

      {/* Slide Navigation Arrows (Desktop hover) */}
      {activeSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Main Content Area */}
      <div className="relative z-10 p-7 flex items-center justify-between gap-6">
        <div className={`space-y-2 max-w-2xl ${
          activeSlides[safeIndex]?.bgImage
            ? 'bg-black/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl'
            : ''
        }`}>
          {/* Tag Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider border border-white/20 shadow-xs">
            <Flame className="w-3.5 h-3.5 fill-white text-amber-300 animate-pulse" />
            <span>{activeSlides[safeIndex]?.tag || '⚡ FLASH SALE'}</span>
          </div>

          {/* Heading and Subtitle with smooth transition */}
          <div key={safeIndex} className="animate-in fade-in slide-in-from-bottom-3 duration-600">
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
              {activeSlides[safeIndex]?.title}
            </h3>
            {activeSlides[safeIndex]?.subtitle && (
              <p className="text-white text-xs sm:text-sm mt-1 leading-relaxed max-w-xl drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] font-medium">
                {activeSlides[safeIndex]?.subtitle}
              </p>
            )}
          </div>

          {/* Dots Indicator */}
          {activeSlides.length > 1 && (
            <div className="flex items-center gap-1.5 pt-2">
              {activeSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    i === safeIndex ? 'w-7 bg-amber-400 shadow-sm shadow-amber-400/50' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
              <span className="text-[10px] font-bold text-white/80 ml-1.5">
                {safeIndex + 1} / {activeSlides.length}
              </span>
            </div>
          )}
        </div>

        {/* Persistent Countdown Timer */}
        <div className="flex items-center gap-2 bg-black/65 backdrop-blur-md p-3.5 rounded-2xl border border-white/25 shadow-2xl shrink-0">
          <Timer className="w-5 h-5 text-amber-300" />
          <div className="text-center bg-white/10 px-3.5 py-1.5 rounded-xl min-w-14">
            <span className="text-lg font-black font-mono block leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-[9px] uppercase tracking-wider text-rose-200 font-bold">Hours</span>
          </div>
          <span className="font-bold text-white/80">:</span>
          <div className="text-center bg-white/10 px-3.5 py-1.5 rounded-xl min-w-14">
            <span className="text-lg font-black font-mono block leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-[9px] uppercase tracking-wider text-rose-200 font-bold">Mins</span>
          </div>
          <span className="font-bold text-white/80">:</span>
          <div className="text-center bg-white/10 px-3.5 py-1.5 rounded-xl min-w-14">
            <span className="text-lg font-black font-mono block leading-none text-amber-300">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="text-[9px] uppercase tracking-wider text-rose-200 font-bold">Secs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

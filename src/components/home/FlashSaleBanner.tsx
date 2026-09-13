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

interface ThemePalette {
  bgGradient: string;
  badgeBg: string;
  timerBg: string;
  dotActive: string;
}

const getFlashThemeConfig = (theme?: string): ThemePalette => {
  switch (theme) {
    case 'emerald':
      return {
        bgGradient: 'from-emerald-700 via-teal-600 to-emerald-500',
        badgeBg: 'bg-teal-950 text-teal-200 border border-teal-800',
        timerBg: 'bg-emerald-950/40 text-white border-emerald-400/30',
        dotActive: 'bg-teal-200',
      };
    case 'cyber':
      return {
        bgGradient: 'from-purple-700 via-indigo-600 to-pink-600',
        badgeBg: 'bg-pink-500 text-white',
        timerBg: 'bg-purple-950/40 text-white border-pink-400/30',
        dotActive: 'bg-pink-300',
      };
    case 'dark':
      return {
        bgGradient: 'from-gray-950 via-slate-900 to-zinc-900',
        badgeBg: 'bg-amber-500 text-gray-950',
        timerBg: 'bg-black/60 text-white border-amber-500/30',
        dotActive: 'bg-amber-400',
      };
    case 'sunset':
    default:
      // Exact color scheme as shown in the demo:
      // Warm golden yellow background + vibrant hot pink badge!
      return {
        bgGradient: 'from-[#F5B81C] via-[#F7BE28] to-[#F2B212]',
        badgeBg: 'bg-[#FF3366] text-white',
        timerBg: 'bg-black/20 text-white border-white/25',
        dotActive: 'bg-white',
      };
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
          tag: s.tag || defaultTag || '30% OFF',
          title: s.title || defaultTitle || 'FLASH SALE',
          subtitle: s.subtitle || defaultSubtitle || 'Exclusive offers across our store for a limited time.',
          bgImage: s.bgImage || defaultBgImage || '',
        }))
      : [
          {
            id: 'default',
            tag: defaultTag || '30% OFF',
            title: defaultTitle || 'FLASH SALE',
            subtitle: defaultSubtitle || 'Exclusive offers across our store for a limited time.',
            bgImage: defaultBgImage || '',
          },
        ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auto-slide transition: 4.5 seconds
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

  const safeIndex = currentIndex % activeSlides.length;
  const currentSlide = activeSlides[safeIndex];
  const themeConfig = getFlashThemeConfig(theme);

  // ==========================================
  // MOBILE SPLIT BANNER (Styled like demo)
  // ==========================================
  if (isMobile) {
    return (
      <div
        className={`relative overflow-hidden rounded-[24px] shadow-lg flex select-none transition-all bg-gradient-to-r ${themeConfig.bgGradient} min-h-[145px]`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left Column: Pill Badge, Bold Title, Subtitle & Timer */}
        <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between z-10 min-w-0">
          <div className="space-y-1">
            {/* Pill Badge (like 30% OFF in demo) */}
            <div
              className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm self-start ${themeConfig.badgeBg}`}
            >
              <Flame className="w-3 h-3 fill-current animate-pulse" />
              <span>{currentSlide.tag || '30% OFF'}</span>
            </div>

            {/* Bold Headline (like FLASH SALE in demo) */}
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-xs truncate">
              {currentSlide.title || 'FLASH SALE'}
            </h2>

            {/* Subtitle */}
            {currentSlide.subtitle && (
              <p className="text-white/95 text-[10.5px] sm:text-xs font-medium leading-snug line-clamp-2 drop-shadow-xs">
                {currentSlide.subtitle}
              </p>
            )}
          </div>

          {/* Bottom Area: Timer & Indicators */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <div className={`flex items-center gap-1 backdrop-blur-xs px-2.5 py-1 rounded-xl border text-[10px] font-mono font-black shadow-xs ${themeConfig.timerBg}`}>
              <Timer className="w-3 h-3 text-white mr-0.5" />
              <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span className="opacity-60">:</span>
              <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
              <span className="opacity-60">:</span>
              <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>

            {activeSlides.length > 1 && (
              <div className="flex items-center gap-1">
                {activeSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === safeIndex ? `w-4 ${themeConfig.dotActive}` : 'w-1.5 bg-white/40'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Showcase Image (100% CLEAR, NATURAL, ZERO OVERLAYS) */}
        {currentSlide.bgImage ? (
          <div className="w-[42%] sm:w-[44%] shrink-0 relative overflow-hidden bg-black/5">
            {activeSlides.map((slide, idx) => (
              <img
                key={slide.id}
                src={slide.bgImage}
                alt={slide.title}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out ${
                  idx === safeIndex ? 'opacity-100 z-0' : 'opacity-0 -z-10'
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="w-[30%] shrink-0 flex items-center justify-center pr-4">
            <Flame className="w-16 h-16 text-white/25" />
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // DESKTOP SPLIT BANNER (Styled like demo)
  // ==========================================
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] sm:rounded-[32px] shadow-xl flex mb-6 text-white group select-none transition-all bg-gradient-to-r ${themeConfig.bgGradient} min-h-[220px] sm:min-h-[250px] lg:min-h-[280px]`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left Column: Tag, Large Bold Title, Subtitle & Timer (55% width) */}
      <div className="flex-1 p-7 sm:p-9 lg:p-11 flex flex-col justify-between z-10 min-w-0">
        <div className="space-y-3 max-w-xl">
          {/* Pill Badge (like 30% OFF in demo) */}
          <div
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm self-start ${themeConfig.badgeBg}`}
          >
            <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
            <span>{currentSlide.tag || '30% OFF'}</span>
          </div>

          {/* Huge Bold Title (like FLASH SALE in demo) */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-none drop-shadow-xs">
            {currentSlide.title || 'FLASH SALE'}
          </h2>

          {/* Subtitle */}
          {currentSlide.subtitle && (
            <p className="text-white/95 text-xs sm:text-sm lg:text-base font-medium leading-relaxed max-w-md drop-shadow-xs">
              {currentSlide.subtitle}
            </p>
          )}
        </div>

        {/* Bottom Area: Timer & Indicators */}
        <div className="pt-4 flex items-center justify-between gap-4">
          {/* Countdown Timer */}
          <div className={`flex items-center gap-2 backdrop-blur-xs px-4 py-2 rounded-2xl border shadow-md ${themeConfig.timerBg}`}>
            <Timer className="w-4 h-4 text-white shrink-0" />
            <div className="flex items-center gap-1.5 font-mono text-sm font-black tracking-wide">
              <div className="text-center">
                <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase font-sans font-bold block leading-none opacity-80">Hrs</span>
              </div>
              <span className="opacity-60 mb-2">:</span>
              <div className="text-center">
                <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase font-sans font-bold block leading-none opacity-80">Min</span>
              </div>
              <span className="opacity-60 mb-2">:</span>
              <div className="text-center">
                <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase font-sans font-bold block leading-none opacity-80">Sec</span>
              </div>
            </div>
          </div>

          {/* Slide Dots */}
          {activeSlides.length > 1 && (
            <div className="flex items-center gap-1.5">
              {activeSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    i === safeIndex ? `w-6 ${themeConfig.dotActive} shadow-xs` : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Dynamic Showcase Image (100% CLEAR, NATURAL, ZERO OVERLAYS) */}
      {currentSlide.bgImage ? (
        <div className="w-[42%] sm:w-[45%] lg:w-[46%] shrink-0 relative overflow-hidden bg-black/5">
          {activeSlides.map((slide, idx) => (
            <img
              key={slide.id}
              src={slide.bgImage}
              alt={slide.title}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out ${
                idx === safeIndex ? 'opacity-100 z-0' : 'opacity-0 -z-10'
              }`}
            />
          ))}
        </div>
      ) : (
        <div className="w-[35%] shrink-0 flex items-center justify-center pr-8">
          <Flame className="w-24 h-24 text-white/20" />
        </div>
      )}

      {/* Slide Navigation Arrows (Desktop hover) */}
      {activeSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 cursor-pointer shadow-md"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 cursor-pointer shadow-md"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};

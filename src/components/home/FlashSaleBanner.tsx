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
  cardBg: string;
  glowColor: string;
  badgeBg: string;
  timerBg: string;
  timerSecBg: string;
  timerSecText: string;
  dotActive: string;
  border: string;
}

const getFlashThemeConfig = (theme?: string): ThemePalette => {
  switch (theme) {
    case 'emerald':
      return {
        cardBg: 'from-[#05130d] via-[#091f16] to-[#040c08]',
        glowColor: 'bg-emerald-500/15',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35',
        timerBg: 'bg-black/55 border-emerald-500/25',
        timerSecBg: 'bg-emerald-500/25 border-emerald-500/40',
        timerSecText: 'text-emerald-300',
        dotActive: 'bg-emerald-400 shadow-emerald-400/50',
        border: 'border-emerald-500/25',
      };
    case 'cyber':
      return {
        cardBg: 'from-[#0c0819] via-[#140f28] to-[#07050e]',
        glowColor: 'bg-purple-500/15',
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/35',
        timerBg: 'bg-black/55 border-purple-500/25',
        timerSecBg: 'bg-purple-500/25 border-purple-500/40',
        timerSecText: 'text-purple-300',
        dotActive: 'bg-purple-400 shadow-purple-400/50',
        border: 'border-purple-500/25',
      };
    case 'dark':
      return {
        cardBg: 'from-[#09090b] via-[#141418] to-[#0a0a0c]',
        glowColor: 'bg-white/8',
        badgeBg: 'bg-white/10 text-white border-white/25',
        timerBg: 'bg-black/60 border-white/20',
        timerSecBg: 'bg-white/20 border-white/30',
        timerSecText: 'text-white',
        dotActive: 'bg-white shadow-white/50',
        border: 'border-white/15',
      };
    case 'sunset':
    default:
      // Kintesi Signature Luxury Brand: Deep Obsidian Ruby & Rose
      // Modern, high-end, bespoke (NO cheap yellow, NO direct demo copy)
      return {
        cardBg: 'from-[#14080e] via-[#1c0c16] to-[#0b0509]',
        glowColor: 'bg-rose-500/15',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/35',
        timerBg: 'bg-black/55 border-rose-500/25',
        timerSecBg: 'bg-rose-500/25 border-rose-500/40',
        timerSecText: 'text-rose-400',
        dotActive: 'bg-rose-500 shadow-rose-500/50',
        border: 'border-rose-500/25',
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
          tag: s.tag || defaultTag || '⚡ FLASH SALE',
          title: s.title || defaultTitle || 'EXCLUSIVE SUPER DEALS',
          subtitle: s.subtitle || defaultSubtitle || 'Limited stock flash offers with up to 50% discount. Order before time runs out!',
          bgImage: s.bgImage || defaultBgImage || '',
        }))
      : [
          {
            id: 'default',
            tag: defaultTag || '⚡ FLASH SALE',
            title: defaultTitle || 'EXCLUSIVE SUPER DEALS',
            subtitle: defaultSubtitle || 'Limited stock flash offers with up to 50% discount. Order before time runs out!',
            bgImage: defaultBgImage || '',
          },
        ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auto-slide transition: 5 seconds
  useEffect(() => {
    if (activeSlides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 5000);

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
  // MOBILE LUXURY FLASH SALE BANNER
  // ==========================================
  if (isMobile) {
    return (
      <div
        className={`relative overflow-hidden rounded-[22px] sm:rounded-[24px] shadow-xl flex select-none transition-all bg-gradient-to-r ${themeConfig.cardBg} border ${themeConfig.border} min-h-[145px]`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Ambient background glow */}
        <div className={`absolute -left-10 -top-10 w-44 h-44 rounded-full blur-2xl pointer-events-none ${themeConfig.glowColor}`} />

        {/* Left Content Area: Tag, Title, Subtitle & Timer */}
        <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between z-10 min-w-0">
          <div className="space-y-1.5">
            {/* Tag Badge */}
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider shadow-xs self-start border backdrop-blur-md ${themeConfig.badgeBg}`}
            >
              <Flame className="w-3 h-3 fill-current animate-pulse" />
              <span>{currentSlide.tag || '⚡ FLASH SALE'}</span>
            </div>

            {/* Main Heading */}
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-tight drop-shadow-xs truncate">
              {currentSlide.title || 'EXCLUSIVE SUPER DEALS'}
            </h2>

            {/* Subtitle */}
            {currentSlide.subtitle && (
              <p className="text-gray-300 text-[10.5px] sm:text-xs font-normal leading-snug line-clamp-2">
                {currentSlide.subtitle}
              </p>
            )}
          </div>

          {/* Bottom Area: Timer & Indicators */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <div className={`flex items-center gap-1 backdrop-blur-md px-2.5 py-1 rounded-xl border text-[10.5px] font-mono font-bold shadow-xs text-white ${themeConfig.timerBg}`}>
              <Timer className="w-3 h-3 text-white/80 mr-0.5 shrink-0" />
              <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span className="opacity-40">:</span>
              <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
              <span className="opacity-40">:</span>
              <span className={`font-black ${themeConfig.timerSecText}`}>{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>

            {activeSlides.length > 1 && (
              <div className="flex items-center gap-1">
                {activeSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      i === safeIndex ? `w-4 ${themeConfig.dotActive}` : 'w-1.5 bg-white/30'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Showcase Image (100% CLEAR, NATURAL, SMOOTH FEATHER BLEND ON LEFT EDGE) */}
        {currentSlide.bgImage ? (
          <div
            className="w-[42%] sm:w-[45%] shrink-0 relative overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 12%, black 28%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 12%, black 28%, black 100%)',
            }}
          >
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
            <Flame className="w-14 h-14 text-white/10" />
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // DESKTOP LUXURY FLASH SALE BANNER
  // ==========================================
  return (
    <div
      className={`relative overflow-hidden rounded-[26px] sm:rounded-[30px] shadow-2xl flex mb-6 text-white group select-none transition-all bg-gradient-to-r ${themeConfig.cardBg} border ${themeConfig.border} min-h-[220px] sm:min-h-[250px] lg:min-h-[270px]`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ambient background glows for luxury depth */}
      <div className={`absolute -left-20 -top-20 w-80 h-80 rounded-full blur-3xl pointer-events-none ${themeConfig.glowColor}`} />
      <div className={`absolute left-1/3 -bottom-20 w-60 h-60 rounded-full blur-3xl pointer-events-none ${themeConfig.glowColor}`} />

      {/* Left Content Column: Tag, Bold Headline, Subtitle, HUD Timer */}
      <div className="flex-1 p-7 sm:p-9 lg:p-10 flex flex-col justify-between z-10 min-w-0 max-w-2xl">
        <div className="space-y-3">
          {/* Pill Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md self-start border shadow-sm ${themeConfig.badgeBg}`}
          >
            <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
            <span>{currentSlide.tag || '⚡ FLASH SALE'}</span>
          </div>

          {/* Main Headline */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-sm">
            {currentSlide.title || 'EXCLUSIVE SUPER DEALS'}
          </h2>

          {/* Subtitle */}
          {currentSlide.subtitle && (
            <p className="text-gray-300 text-xs sm:text-sm font-normal leading-relaxed max-w-lg">
              {currentSlide.subtitle}
            </p>
          )}
        </div>

        {/* Bottom Area: Modern HUD Countdown Timer & Slide Indicators */}
        <div className="pt-5 flex items-center justify-between gap-4">
          {/* Countdown Timer HUD */}
          <div className={`flex items-center gap-2.5 backdrop-blur-md px-4 py-2.5 rounded-2xl border shadow-lg ${themeConfig.timerBg}`}>
            <Timer className="w-4 h-4 text-white/80 shrink-0" />
            <div className="flex items-center gap-1.5 font-mono text-sm font-black tracking-wide">
              <div className="bg-white/10 px-2.5 py-1 rounded-lg text-center min-w-[38px]">
                <span className="text-white block leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[8px] uppercase tracking-wider text-gray-400 font-sans font-bold block mt-0.5">Hrs</span>
              </div>
              <span className="text-white/40 font-bold">:</span>
              <div className="bg-white/10 px-2.5 py-1 rounded-lg text-center min-w-[38px]">
                <span className="text-white block leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[8px] uppercase tracking-wider text-gray-400 font-sans font-bold block mt-0.5">Min</span>
              </div>
              <span className="text-white/40 font-bold">:</span>
              <div className={`px-2.5 py-1 rounded-lg text-center min-w-[38px] border ${themeConfig.timerSecBg}`}>
                <span className={`block leading-none ${themeConfig.timerSecText}`}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className={`text-[8px] uppercase tracking-wider font-sans font-bold block mt-0.5 ${themeConfig.timerSecText} opacity-85`}>Sec</span>
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
                    i === safeIndex ? `w-7 ${themeConfig.dotActive} shadow-xs` : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Dynamic Showcase Image (100% CLEAR, NATURAL, ZERO OVERLAYS, SMOOTH FEATHER BLEND) */}
      {currentSlide.bgImage ? (
        <div
          className="w-[44%] sm:w-[46%] lg:w-[48%] shrink-0 relative overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 12%, black 28%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 12%, black 28%, black 100%)',
          }}
        >
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
          <Flame className="w-24 h-24 text-white/10" />
        </div>
      )}

      {/* Slide Navigation Arrows (Desktop hover) */}
      {activeSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 cursor-pointer shadow-md"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 cursor-pointer shadow-md"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};

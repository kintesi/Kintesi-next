import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Timer, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { FlashSaleSlide } from '../../contexts/SettingsContext';

interface FlashSaleBannerProps {
  slides?: FlashSaleSlide[];
  defaultTag?: string;
  defaultTitle?: string;
  defaultSubtitle?: string;
  defaultBgImage?: string;
  defaultDesktopImage?: string;
  defaultMobileImage?: string;
  defaultLink?: string;
  theme?: string;
  timeLeft: { hours: number; minutes: number; seconds: number };
  isMobile?: boolean;
  bannerType?: 'normal' | 'clickable';
  showTimer?: boolean;
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
  ctaBg: string;
}

const getFlashThemeConfig = (theme?: string): ThemePalette => {
  switch (theme) {
    case 'emerald':
      return {
        cardBg: 'from-[#04140d] via-[#092218] to-[#030d08]',
        glowColor: 'bg-emerald-500/20',
        badgeBg: 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40',
        timerBg: 'bg-black/55 border-emerald-500/25',
        timerSecBg: 'bg-emerald-500/30 border-emerald-500/50',
        timerSecText: 'text-emerald-300',
        dotActive: 'bg-emerald-400 shadow-emerald-400/50',
        border: 'border-emerald-500/30',
        ctaBg: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
      };
    case 'cyber':
      return {
        cardBg: 'from-[#0b071a] via-[#140c2b] to-[#070412]',
        glowColor: 'bg-purple-500/20',
        badgeBg: 'bg-purple-500/25 text-purple-300 border-purple-500/40',
        timerBg: 'bg-black/55 border-purple-500/25',
        timerSecBg: 'bg-purple-500/30 border-purple-500/50',
        timerSecText: 'text-purple-300',
        dotActive: 'bg-purple-400 shadow-purple-400/50',
        border: 'border-purple-500/30',
        ctaBg: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30',
      };
    case 'dark':
      return {
        cardBg: 'from-[#09090b] via-[#141418] to-[#070709]',
        glowColor: 'bg-white/10',
        badgeBg: 'bg-white/15 text-white border-white/30',
        timerBg: 'bg-black/60 border-white/20',
        timerSecBg: 'bg-white/25 border-white/40',
        timerSecText: 'text-white',
        dotActive: 'bg-white shadow-white/50',
        border: 'border-white/20',
        ctaBg: 'bg-white hover:bg-slate-200 text-black shadow-white/20',
      };
    case 'crimson':
      return {
        cardBg: 'from-[#180407] via-[#24060c] to-[#0f0205]',
        glowColor: 'bg-red-500/20',
        badgeBg: 'bg-red-500/25 text-red-300 border-red-500/40',
        timerBg: 'bg-black/55 border-red-500/25',
        timerSecBg: 'bg-red-500/30 border-red-500/50',
        timerSecText: 'text-red-300',
        dotActive: 'bg-red-500 shadow-red-500/50',
        border: 'border-red-500/30',
        ctaBg: 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30',
      };
    case 'gold':
      return {
        cardBg: 'from-[#170e03] via-[#241705] to-[#0c0701]',
        glowColor: 'bg-amber-500/20',
        badgeBg: 'bg-amber-500/25 text-amber-300 border-amber-500/40',
        timerBg: 'bg-black/55 border-amber-500/25',
        timerSecBg: 'bg-amber-500/30 border-amber-500/50',
        timerSecText: 'text-amber-300',
        dotActive: 'bg-amber-400 shadow-amber-400/50',
        border: 'border-amber-500/30',
        ctaBg: 'bg-amber-500 hover:bg-amber-400 text-black font-black shadow-amber-500/30',
      };
    case 'ocean':
      return {
        cardBg: 'from-[#050e1c] via-[#09172e] to-[#03070f]',
        glowColor: 'bg-blue-500/20',
        badgeBg: 'bg-blue-500/25 text-blue-300 border-blue-500/40',
        timerBg: 'bg-black/55 border-blue-500/25',
        timerSecBg: 'bg-blue-500/30 border-blue-500/50',
        timerSecText: 'text-blue-300',
        dotActive: 'bg-blue-400 shadow-blue-400/50',
        border: 'border-blue-500/30',
        ctaBg: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30',
      };
    case 'aurora':
      return {
        cardBg: 'from-[#041416] via-[#101026] to-[#060414]',
        glowColor: 'bg-teal-400/20',
        badgeBg: 'bg-teal-500/25 text-teal-300 border-teal-500/40',
        timerBg: 'bg-black/55 border-teal-500/25',
        timerSecBg: 'bg-teal-500/30 border-teal-500/50',
        timerSecText: 'text-teal-300',
        dotActive: 'bg-teal-400 shadow-teal-400/50',
        border: 'border-teal-500/30',
        ctaBg: 'bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white shadow-teal-500/30',
      };
    case 'cherry':
      return {
        cardBg: 'from-[#190514] via-[#270920] to-[#0f020d]',
        glowColor: 'bg-pink-500/20',
        badgeBg: 'bg-pink-500/25 text-pink-300 border-pink-500/40',
        timerBg: 'bg-black/55 border-pink-500/25',
        timerSecBg: 'bg-pink-500/30 border-pink-500/50',
        timerSecText: 'text-pink-300',
        dotActive: 'bg-pink-400 shadow-pink-400/50',
        border: 'border-pink-500/30',
        ctaBg: 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-600/30',
      };
    case 'solar':
      return {
        cardBg: 'from-[#1a0802] via-[#290f04] to-[#0d0301]',
        glowColor: 'bg-orange-500/20',
        badgeBg: 'bg-orange-500/25 text-orange-300 border-orange-500/40',
        timerBg: 'bg-black/55 border-orange-500/25',
        timerSecBg: 'bg-orange-500/30 border-orange-500/50',
        timerSecText: 'text-orange-300',
        dotActive: 'bg-orange-400 shadow-orange-400/50',
        border: 'border-orange-500/30',
        ctaBg: 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30',
      };
    case 'sunset':
    default:
      return {
        cardBg: 'from-[#14080e] via-[#1c0c16] to-[#0b0509]',
        glowColor: 'bg-rose-500/20',
        badgeBg: 'bg-rose-500/25 text-rose-300 border-rose-500/40',
        timerBg: 'bg-black/55 border-rose-500/25',
        timerSecBg: 'bg-rose-500/30 border-rose-500/50',
        timerSecText: 'text-rose-400',
        dotActive: 'bg-rose-500 shadow-rose-500/50',
        border: 'border-rose-500/30',
        ctaBg: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30',
      };
  }
};

export const FlashSaleBanner: React.FC<FlashSaleBannerProps> = ({
  slides = [],
  defaultTag,
  defaultTitle,
  defaultSubtitle,
  defaultBgImage,
  defaultDesktopImage,
  defaultMobileImage,
  defaultLink,
  theme = 'sunset',
  timeLeft,
  isMobile = false,
  bannerType,
  showTimer = false,
}) => {
  const navigate = useNavigate();

  // Normalize slides
  const activeSlides: FlashSaleSlide[] =
    slides && slides.length > 0
      ? slides.map((s, idx) => ({
          id: s.id || `slide-${idx}`,
          tag: s.tag !== undefined ? s.tag : (defaultTag ?? ''),
          title: s.title !== undefined ? s.title : (defaultTitle ?? ''),
          subtitle: s.subtitle !== undefined ? s.subtitle : (defaultSubtitle ?? ''),
          bgImage: s.bgImage || defaultBgImage || '',
          desktopImage: s.desktopImage || s.bgImage || defaultDesktopImage || defaultBgImage || '',
          mobileImage: s.mobileImage || s.bgImage || defaultMobileImage || defaultBgImage || '',
          link: s.link || defaultLink || '',
          productId: s.productId || '',
          bannerType: s.bannerType,
          layoutStyle: s.layoutStyle,
          showTimer: s.showTimer,
          hideText: s.hideText,
        }))
      : [
          {
            id: 'default',
            tag: defaultTag ?? '',
            title: defaultTitle ?? '',
            subtitle: defaultSubtitle ?? '',
            bgImage: defaultBgImage || '',
            desktopImage: defaultDesktopImage || defaultBgImage || '',
            mobileImage: defaultMobileImage || defaultBgImage || '',
            link: defaultLink || '',
          },
        ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auto-slide transition: 4 seconds
  useEffect(() => {
    if (activeSlides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [activeSlides.length, isPaused]);

  // Safety auto-resume so auto-sliding never permanently freezes on hover/touch
  useEffect(() => {
    if (!isPaused) return;
    const timeout = setTimeout(() => {
      setIsPaused(false);
    }, 6000);
    return () => clearTimeout(timeout);
  }, [isPaused]);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const handleTouchCancel = () => {
    setIsPaused(false);
    touchStartX.current = null;
  };

  const safeIndex = currentIndex % activeSlides.length;
  const currentSlide = activeSlides[safeIndex];
  const themeConfig = getFlashThemeConfig(theme);

  const getSlideImage = (slide: FlashSaleSlide) => {
    if (isMobile) {
      return slide.mobileImage || slide.bgImage || defaultMobileImage || defaultBgImage || '';
    }
    return slide.desktopImage || slide.bgImage || defaultDesktopImage || defaultBgImage || '';
  };

  const currentImage = getSlideImage(currentSlide);

  const isSlideTextHidden = Boolean(currentSlide.hideText);
  const hasTag = !isSlideTextHidden && Boolean(currentSlide.tag?.trim());
  const hasTitle = !isSlideTextHidden && Boolean(currentSlide.title?.trim());
  const hasSubtitle = !isSlideTextHidden && Boolean(currentSlide.subtitle?.trim());
  const hasText = hasTag || hasTitle || hasSubtitle;
  const hasTimer = Boolean(showTimer === true && currentSlide.showTimer !== false && timeLeft && (timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0));
  const isClickable =
    bannerType !== undefined
      ? bannerType === 'clickable'
      : currentSlide.bannerType !== 'normal';
  const isFullLayout = currentSlide.layoutStyle !== 'split' || (!hasText && !hasTimer);

  const handleBannerClick = (e: React.MouseEvent) => {
    if (!isClickable) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    const targetLink =
      currentSlide.link ||
      (currentSlide.productId ? `/product/${currentSlide.productId}` : '') ||
      defaultLink ||
      '/products';

    if (targetLink) {
      if (targetLink.startsWith('http://') || targetLink.startsWith('https://')) {
        window.open(targetLink, '_blank');
      } else {
        navigate(targetLink);
      }
    }
  };

  // ==========================================
  // MOBILE BANNER (Full Image or Split Layout)
  // ==========================================
  if (isMobile) {
    if (isFullLayout) {
      return (
        <div
          onClick={isClickable ? handleBannerClick : undefined}
          className={`relative w-full h-[155px] xs:h-[170px] sm:h-[190px] overflow-hidden rounded-[20px] sm:rounded-[24px] shadow-lg flex select-none transition-all ${
            isClickable ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'
          } bg-gradient-to-r ${themeConfig.cardBg} border ${themeConfig.border}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          {/* Full-bleed Background Image */}
          {currentImage ? (
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              {activeSlides.map((slide, idx) => (
                <img
                  key={slide.id}
                  src={getSlideImage(slide)}
                  alt={slide.title || 'Banner'}
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out ${
                    idx === safeIndex ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                />
              ))}
            </div>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-r ${themeConfig.cardBg}`} />
          )}

          {/* Readability backdrop when text or timer is present */}
          {(hasText || hasTimer) && (
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none z-[1]" />
          )}

          {/* Overlay Content (Only if text or timer exists) - absolute inset-0 locks height */}
          {(hasText || hasTimer) && (
            <div className="absolute inset-0 z-10 p-3.5 sm:p-4 flex flex-col justify-between min-w-0 max-w-[75%] overflow-hidden">
              <div className="space-y-1 sm:space-y-1.5 min-w-0">
                {/* Tag & Shop Deal Chip */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {hasTag && (
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs border backdrop-blur-md ${themeConfig.badgeBg}`}
                    >
                      <Flame className="w-3 h-3 fill-current animate-pulse" />
                      <span>{currentSlide.tag}</span>
                    </div>
                  )}
                  {isClickable && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-xs ${themeConfig.ctaBg}`}>
                      Shop Now <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Title */}
                {hasTitle && (
                  <h2 className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-tight leading-tight drop-shadow-md truncate">
                    {currentSlide.title}
                  </h2>
                )}

                {/* Subtitle */}
                {hasSubtitle && (
                  <p className="text-gray-200 text-[10px] sm:text-xs font-normal leading-snug line-clamp-2 drop-shadow-sm">
                    {currentSlide.subtitle}
                  </p>
                )}
              </div>

              {/* Bottom: Timer & Slide Dots */}
              <div className="pt-1.5 flex items-center justify-between gap-2">
                {hasTimer ? (
                  <div className={`flex items-center gap-1 backdrop-blur-md px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold shadow-xs text-white ${themeConfig.timerBg}`}>
                    <Timer className="w-3 h-3 text-white/80 mr-0.5 shrink-0" />
                    <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
                    <span className="opacity-40">:</span>
                    <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
                    <span className="opacity-40">:</span>
                    <span className={`font-black ${themeConfig.timerSecText}`}>{String(timeLeft.seconds).padStart(2, '0')}s</span>
                  </div>
                ) : <div />}

                {activeSlides.length > 1 && (
                  <div className="flex items-center gap-1">
                    {activeSlides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentIndex(i);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          i === safeIndex ? `w-4 ${themeConfig.dotActive}` : 'w-1.5 bg-white/40'
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Slide Indicators for pure-image mode (when no text is overlaid) */}
          {!hasText && !hasTimer && activeSlides.length > 1 && (
            <div className="absolute bottom-2.5 right-3 z-10 flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-full">
              {activeSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(i);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === safeIndex ? 'w-4 bg-white shadow-xs' : 'w-1.5 bg-white/40'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    // Mobile Split Layout
    return (
      <div
        onClick={isClickable ? handleBannerClick : undefined}
        className={`relative w-full h-[155px] xs:h-[170px] sm:h-[190px] overflow-hidden rounded-[22px] sm:rounded-[24px] shadow-xl flex select-none transition-all ${
          isClickable ? 'cursor-pointer' : 'cursor-default'
        } group bg-gradient-to-r ${themeConfig.cardBg} border ${themeConfig.border}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {/* Ambient background glow */}
        <div className={`absolute -left-10 -top-10 w-44 h-44 rounded-full blur-2xl pointer-events-none ${themeConfig.glowColor}`} />

        {/* Left Content Area: Tag, Title, Subtitle & Timer */}
        <div className="relative z-10 flex-1 p-3.5 sm:p-4 flex flex-col justify-between min-w-0 max-w-[60%] sm:max-w-[63%] h-full overflow-hidden">
          <div className="space-y-1 sm:space-y-1.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {hasTag && (
                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs border backdrop-blur-md ${themeConfig.badgeBg}`}
                >
                  <Flame className="w-3 h-3 fill-current animate-pulse" />
                  <span>{currentSlide.tag}</span>
                </div>
              )}
              {isClickable && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-xs transition-transform duration-200 group-hover:scale-105 ${themeConfig.ctaBg}`}>
                  Shop Deal <ArrowRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </div>

            {hasTitle && (
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight leading-tight drop-shadow-xs truncate">
                {currentSlide.title}
              </h2>
            )}

            {hasSubtitle && (
              <p className="text-gray-300 text-[10px] sm:text-xs font-normal leading-snug line-clamp-2">
                {currentSlide.subtitle}
              </p>
            )}
          </div>

          <div className="pt-1.5 flex items-center justify-between gap-2">
            {hasTimer && (
              <div className={`flex items-center gap-1 backdrop-blur-md px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold shadow-xs text-white ${themeConfig.timerBg}`}>
                <Timer className="w-3 h-3 text-white/80 mr-0.5 shrink-0" />
                <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
                <span className="opacity-40">:</span>
                <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
                <span className="opacity-40">:</span>
                <span className={`font-black ${themeConfig.timerSecText}`}>{String(timeLeft.seconds).padStart(2, '0')}s</span>
              </div>
            )}

            {activeSlides.length > 1 && (
              <div className="flex items-center gap-1">
                {activeSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(i);
                    }}
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

        {/* Right Showcase Image */}
        {currentImage ? (
          <div
            className="absolute inset-y-0 right-0 w-[46%] sm:w-[48%] pointer-events-none overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 10%, black 25%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 10%, black 25%, black 100%)',
            }}
          >
            {activeSlides.map((slide, idx) => (
              <img
                key={slide.id}
                src={getSlideImage(slide)}
                alt={slide.title || 'Product Offer'}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out ${
                  idx === safeIndex ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="absolute inset-y-0 right-0 w-[30%] shrink-0 flex items-center justify-center pr-4 pointer-events-none">
            <Flame className="w-14 h-14 text-white/10" />
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // DESKTOP FULL-BLEED IMAGE BANNER
  // ==========================================
  if (isFullLayout) {
    return (
      <div
        onClick={isClickable ? handleBannerClick : undefined}
        className={`relative w-full h-[240px] sm:h-[270px] lg:h-[300px] xl:h-[320px] overflow-hidden rounded-[24px] sm:rounded-[28px] shadow-2xl flex mb-6 text-white group select-none transition-all ${
          isClickable ? 'cursor-pointer' : 'cursor-default'
        } bg-gradient-to-r ${themeConfig.cardBg} border ${themeConfig.border}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Full-width Background Graphic */}
        {currentImage ? (
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {activeSlides.map((slide, idx) => (
              <img
                key={slide.id}
                src={getSlideImage(slide)}
                alt={slide.title || 'Banner'}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out ${
                  idx === safeIndex ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
                }`}
              />
            ))}
          </div>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-r ${themeConfig.cardBg}`} />
        )}

        {/* Readability backdrop when text or timer is present */}
        {(hasText || hasTimer) && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none z-[1]" />
        )}

        {/* Floating Content: Tag, Bold Headline, Subtitle, HUD Timer - absolute inset-0 locks height */}
        {(hasText || hasTimer) && (
          <div className="absolute inset-0 z-10 p-7 sm:p-9 lg:p-10 flex flex-col justify-between min-w-0 max-w-xl lg:max-w-2xl overflow-hidden">
            <div className="space-y-3 min-w-0">
              {hasTag && (
                <div
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md self-start border shadow-sm ${themeConfig.badgeBg}`}
                >
                  <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
                  <span>{currentSlide.tag}</span>
                </div>
              )}

              {hasTitle && (
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-md line-clamp-2">
                  {currentSlide.title}
                </h2>
              )}

              {hasSubtitle && (
                <p className="text-gray-200 text-xs sm:text-sm font-normal leading-relaxed max-w-lg drop-shadow-sm line-clamp-2">
                  {currentSlide.subtitle}
                </p>
              )}
            </div>

            {/* Bottom HUD: Timer & Action */}
            <div className="pt-4 flex items-center justify-between gap-4 flex-wrap">
              {hasTimer ? (
                <div className={`flex items-center gap-2.5 backdrop-blur-md px-4 py-2 rounded-2xl border shadow-lg ${themeConfig.timerBg}`}>
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
              ) : <div />}

              <div className="flex items-center gap-3">
                {isClickable && (
                  <span
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all duration-200 group-hover:scale-105 active:scale-95 ${themeConfig.ctaBg}`}
                  >
                    Shop Deal <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                )}

                {activeSlides.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    {activeSlides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentIndex(i);
                        }}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          i === safeIndex ? `w-7 ${themeConfig.dotActive} shadow-xs` : 'w-2 bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Slide Indicators for pure-image mode (when no text is overlaid) */}
        {!hasText && !hasTimer && activeSlides.length > 1 && (
          <div className="absolute bottom-4 right-5 z-10 flex items-center gap-2 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  i === safeIndex ? 'w-7 bg-white shadow-xs' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Slide Navigation Arrows */}
        {activeSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 cursor-pointer shadow-md"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 cursor-pointer shadow-md"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    );
  }

  // ==========================================
  // DESKTOP SPLIT PROMO BANNER (Legacy Layout)
  // ==========================================
  return (
    <div
      onClick={isClickable ? handleBannerClick : undefined}
      className={`relative w-full h-[240px] sm:h-[270px] lg:h-[300px] xl:h-[320px] overflow-hidden rounded-[24px] sm:rounded-[28px] shadow-2xl flex mb-6 text-white group select-none transition-all ${
        isClickable ? 'cursor-pointer' : 'cursor-default'
      } bg-gradient-to-r ${themeConfig.cardBg} border ${themeConfig.border}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ambient background glows for luxury depth */}
      <div className={`absolute -left-20 -top-20 w-80 h-80 rounded-full blur-3xl pointer-events-none ${themeConfig.glowColor}`} />
      <div className={`absolute left-1/3 -bottom-20 w-60 h-60 rounded-full blur-3xl pointer-events-none ${themeConfig.glowColor}`} />

      {/* Left Content Column: Tag, Bold Headline, Subtitle, HUD Timer */}
      <div className="relative z-10 flex-1 p-7 sm:p-9 lg:p-10 flex flex-col justify-between min-w-0 max-w-xl lg:max-w-2xl h-full overflow-hidden">
        <div className="space-y-3 min-w-0">
          {hasTag && (
            <div
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md self-start border shadow-sm ${themeConfig.badgeBg}`}
            >
              <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
              <span>{currentSlide.tag}</span>
            </div>
          )}

          {hasTitle && (
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-sm line-clamp-2">
              {currentSlide.title}
            </h2>
          )}

          {hasSubtitle && (
            <p className="text-gray-300 text-xs sm:text-sm font-normal leading-relaxed max-w-lg line-clamp-2">
              {currentSlide.subtitle}
            </p>
          )}
        </div>

        {/* Bottom Area: Modern HUD Countdown Timer, Slide Indicators & Shop Deal Button */}
        <div className="pt-4 flex items-center justify-between gap-4 flex-wrap">
          {hasTimer ? (
            <div className={`flex items-center gap-2.5 backdrop-blur-md px-4 py-2 rounded-2xl border shadow-lg ${themeConfig.timerBg}`}>
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
          ) : <div />}

          <div className="flex items-center gap-3">
            {isClickable && (
              <span
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all duration-200 group-hover:scale-105 active:scale-95 ${themeConfig.ctaBg}`}
              >
                Shop Deal <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            )}

            {activeSlides.length > 1 && (
              <div className="flex items-center gap-1.5">
                {activeSlides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(i);
                    }}
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
      </div>

      {/* Right Showcase Image Layer */}
      {currentImage ? (
        <div
          className="absolute inset-y-0 right-0 w-[50%] sm:w-[54%] lg:w-[58%] pointer-events-none overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 8%, black 22%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 8%, black 22%, black 100%)',
          }}
        >
          {activeSlides.map((slide, idx) => (
            <img
              key={slide.id}
              src={getSlideImage(slide)}
              alt={slide.title}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out ${
                idx === safeIndex ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
              }`}
            />
          ))}
        </div>
      ) : (
        <div className="absolute inset-y-0 right-0 w-[35%] flex items-center justify-center pr-8 pointer-events-none">
          <Flame className="w-24 h-24 text-white/10" />
        </div>
      )}

      {/* Slide Navigation Arrows */}
      {activeSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 cursor-pointer shadow-md"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 cursor-pointer shadow-md"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { formatPrice } from '../../lib/utils';

export interface HeroBentoProps {
  // Main Big Card (Left)
  mainBadge?: string;
  mainTitle?: string;
  mainSubtitle?: string;
  mainTag1?: string;
  mainTag2?: string;
  mainTag3?: string;
  mainPrice?: number;
  mainOriginalPrice?: number;
  mainSavings?: string;
  mainClaimedText?: string;
  mainImage?: string;
  mainLink?: string;

  // Top Right Card
  topBadge?: string;
  topTitle?: string;
  topSubtitle?: string;
  topLink?: string;
  topPrice?: number;
  topPriceLabel?: string;
  topImage?: string;

  // Bottom Right Card
  bottomBadge?: string;
  bottomTitle?: string;
  bottomSubtitle?: string;
  bottomLink?: string;
  bottomPrice?: number;
  bottomPriceLabel?: string;
  bottomImage?: string;
}

export const HeroBentoGrid: React.FC<HeroBentoProps> = ({
  mainBadge = '⚡ Summer Hot Deal • 15% OFF',
  mainTitle = 'High-Velocity Turbo Jet Fan',
  mainSubtitle = 'Ultra-quiet brushless airflow with 5000mAh extended battery. Beat the summer humidity wherever you commute.',
  mainTag1 = '100-Speed Micro Control',
  mainTag2 = '3000mAh Battery',
  mainTag3 = '12,000 RPM Motor',
  mainPrice = 1270,
  mainOriginalPrice = 1440,
  mainSavings = 'Save ৳ 170',
  mainClaimedText = '42 claimed this hour',
  mainImage = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
  mainLink = '/shop?search=fan',

  topBadge = 'TOP TRENDING',
  topTitle = 'Acoustic Audio & Wireless',
  topSubtitle = 'Noise-cancelling headsets with lossless bass response.',
  topLink = '/shop?search=headphone',
  topPrice = 1150,
  topPriceLabel = 'Starting from',
  topImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',

  bottomBadge = 'FESTIVE ARRIVAL',
  bottomTitle = 'Artisan Sarees & Abayas',
  bottomSubtitle = 'Pure hand-woven silk fabrics and embroidered cuts.',
  bottomLink = '/shop?search=saree',
  bottomPrice = 1870,
  bottomPriceLabel = 'Special Combos',
  bottomImage = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80',
}) => {
  return (
    <section className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-1">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4.5">
        
        {/* ========================================================
            🌟 LEFT MAIN HERO CARD (Dark Luxury Tech Theme)
           ======================================================== */}
        <div className="lg:col-span-8 relative rounded-3xl bg-gradient-to-br from-slate-900 via-gray-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-8 lg:p-9 shadow-2xl overflow-hidden flex flex-col justify-between group">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Row: Badge & Social Proof */}
          <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black tracking-wide shadow-xs shadow-rose-600/30 uppercase">
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>{mainBadge}</span>
            </span>

            {mainClaimedText && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-300 bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{mainClaimedText}</span>
              </span>
            )}
          </div>

          {/* Center Stage: Split between Content & Visual */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-auto">
            
            {/* Copy / Info */}
            <div className="md:col-span-7 space-y-3.5">
              <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-black text-white tracking-tight leading-[1.18]">
                {mainTitle}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed line-clamp-2 sm:line-clamp-3">
                {mainSubtitle}
              </p>

              {/* 3 Spec Feature Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {mainTag1 && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[10px] sm:text-[11px] font-semibold text-slate-200">
                    ⚡ {mainTag1}
                  </span>
                )}
                {mainTag2 && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[10px] sm:text-[11px] font-semibold text-slate-200">
                    🔋 {mainTag2}
                  </span>
                )}
                {mainTag3 && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[10px] sm:text-[11px] font-semibold text-slate-200">
                    🚀 {mainTag3}
                  </span>
                )}
              </div>
            </div>

            {/* Product Image Stage */}
            <div className="md:col-span-5 flex items-center justify-center relative">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-gradient-to-tr from-slate-800/50 to-white/5 border border-white/10 p-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-500 shadow-inner">
                <img
                  src={mainImage}
                  alt={mainTitle}
                  className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.src = '/navbar-logo.webp';
                  }}
                />
              </div>
            </div>

          </div>

          {/* Bottom Bar: Pricing + Grab Deal CTA */}
          <div className="relative z-10 pt-5 mt-4 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-4">
            
            {/* Price block */}
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {formatPrice(mainPrice)}
              </span>
              {mainOriginalPrice && mainOriginalPrice > mainPrice && (
                <span className="text-sm sm:text-base text-slate-400 line-through font-semibold">
                  {formatPrice(mainOriginalPrice)}
                </span>
              )}
              {mainSavings && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] sm:text-xs font-black">
                  {mainSavings}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <Link
                to={mainLink}
                className="px-6 py-3 bg-gradient-to-r from-rose-600 via-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
              >
                <span>Grab Deal Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>

        </div>


        {/* ========================================================
            🌟 RIGHT COLUMN: STACKED 2 CURATED CARDS
           ======================================================== */}
        <div className="lg:col-span-4 flex flex-col gap-3.5 sm:gap-4.5 justify-between">
          
          {/* Card 1: TOP TRENDING */}
          <Link
            to={topLink}
            className="group relative rounded-3xl bg-white border border-rose-100/80 p-5 shadow-[0_2px_12px_rgba(225,29,72,0.03)] hover:shadow-xl hover:border-rose-300 transition-all flex flex-col justify-between flex-1 overflow-hidden"
          >
            {/* Ambient Corner Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-50 via-transparent to-transparent pointer-events-none" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                  {topBadge}
                </span>
                <span className="text-[11px] font-bold text-gray-400 group-hover:text-rose-600 transition flex items-center gap-1">
                  Shop Now <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-gray-950 line-clamp-1 group-hover:text-rose-600 transition">
                {topTitle}
              </h2>
              <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                {topSubtitle}
              </p>
            </div>

            <div className="flex items-end justify-between gap-3 pt-3 mt-2 border-t border-gray-100">
              <div>
                <span className="text-[10px] text-gray-400 font-semibold block">{topPriceLabel}</span>
                <span className="text-lg font-black text-rose-600">{formatPrice(topPrice)}</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 p-1 flex items-center justify-center group-hover:scale-105 transition-transform">
                <img
                  src={topImage}
                  alt={topTitle}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          </Link>


          {/* Card 2: FESTIVE ARRIVAL */}
          <Link
            to={bottomLink}
            className="group relative rounded-3xl bg-white border border-rose-100/80 p-5 shadow-[0_2px_12px_rgba(225,29,72,0.03)] hover:shadow-xl hover:border-rose-300 transition-all flex flex-col justify-between flex-1 overflow-hidden"
          >
            {/* Ambient Corner Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-50 via-transparent to-transparent pointer-events-none" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                  {bottomBadge}
                </span>
                <span className="text-[11px] font-bold text-gray-400 group-hover:text-rose-600 transition flex items-center gap-1">
                  View Collection <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-gray-950 line-clamp-1 group-hover:text-rose-600 transition">
                {bottomTitle}
              </h2>
              <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                {bottomSubtitle}
              </p>
            </div>

            <div className="flex items-end justify-between gap-3 pt-3 mt-2 border-t border-gray-100">
              <div>
                <span className="text-[10px] text-gray-400 font-semibold block">{bottomPriceLabel}</span>
                <span className="text-lg font-black text-gray-900">{formatPrice(bottomPrice)}</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 p-1 flex items-center justify-center group-hover:scale-105 transition-transform">
                <img
                  src={bottomImage}
                  alt={bottomTitle}
                  className="w-full h-full object-cover rounded-xl"
                  loading="lazy"
                />
              </div>
            </div>
          </Link>

        </div>

      </div>
    </section>
  );
};

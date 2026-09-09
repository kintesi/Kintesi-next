import React, { useState, useEffect } from 'react';
import { useSettings, BannerSettings, DEFAULT_BANNERS } from '../../contexts/SettingsContext';
import { formatPrice } from '../../lib/utils';
import { ImageUploader } from '../../components/common/ImageUploader';
import {
  Sparkles,
  Flame,
  Save,
  Image as ImageIcon,
  Link as LinkIcon,
  Tag,
  Palette,
  Eye,
  Sliders,
  CheckCircle2,
  Timer,
  ArrowRight,
  Shirt,
  RefreshCw,
  Megaphone,
} from 'lucide-react';

export const AdminBanners: React.FC = () => {
  const { settings, updateBanners, isLoading } = useSettings();
  const [form, setForm] = useState<BannerSettings>(settings.banners);

  useEffect(() => {
    if (settings.banners) {
      setForm(settings.banners);
    }
  }, [settings.banners]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBanners(form);
  };

  const getFlashThemeClasses = (theme: string) => {
    switch (theme) {
      case 'emerald':
        return 'from-emerald-700 via-teal-700 to-cyan-800';
      case 'cyber':
        return 'from-purple-800 via-indigo-700 to-pink-700';
      case 'dark':
        return 'from-gray-950 via-slate-900 to-zinc-900 border border-amber-500/30';
      default:
        return 'from-rose-600 via-orange-600 to-amber-500';
    }
  };

  return (
    <div className="max-w-6xl space-y-10 text-white pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <Sliders className="w-8 h-8 text-emerald-400" />
            <span>Homepage Hero & Banner Customizer</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Control all text, images, spotlight products, top announcement bar, and flash sale countdown timers
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs transition shadow-xl shadow-emerald-600/30 active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isLoading ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        
        {/* Top Announcement Bar & Special Offer Broadcast */}
        <div className="bg-gray-800/80 rounded-3xl border border-gray-700 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-700 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <span>Top Announcement Bar & Offer Broadcast</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Controls the slim top announcement header visible across the entire store.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-700 text-xs">
              <input
                type="checkbox"
                checked={form.showTopAnnouncement !== false}
                onChange={(e) => setForm({ ...form, showTopAnnouncement: e.target.checked })}
                className="accent-amber-500 w-4 h-4 rounded"
              />
              <span className="font-bold text-gray-200">Show Top Bar</span>
            </label>
          </div>

          <div className="space-y-5 text-xs">
            {/* Mode status indicator & override toggle */}
            <div className={`p-4 rounded-2xl border transition-all ${
              form.isCustomAnnouncement
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-100'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${form.isCustomAnnouncement ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                    <span className="font-black text-sm text-white">
                      {form.isCustomAnnouncement 
                        ? '🔥 Special Offer Active — Broadcasted to ALL Users' 
                        : '⚡ Welcome Mode — Visible only 7 Days for New Users'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 mt-1">
                    {form.isCustomAnnouncement
                      ? 'This offer is currently broadcasted to ALL users (both new and existing visitors) across the whole store.'
                      : 'New visitors see this welcome discount for their first 7 days only. After 7 days, it automatically hides.'}
                  </p>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer bg-gray-900/90 px-4 py-2 rounded-xl border border-gray-600 hover:border-amber-400 text-xs flex-shrink-0 transition">
                  <input
                    type="checkbox"
                    checked={!!form.isCustomAnnouncement}
                    onChange={(e) => setForm({ ...form, isCustomAnnouncement: e.target.checked })}
                    className="accent-amber-500 w-4 h-4 rounded"
                  />
                  <span className="font-bold text-amber-300">Broadcast to ALL Users (Override 7-Day Limit)</span>
                </label>
              </div>
            </div>

            {/* Announcement text input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-gray-400 uppercase">
                  Top Announcement Bar Message
                </label>
                <span className="text-[11px] text-gray-400">
                  Highlight with <code className="text-amber-300 bg-gray-900 px-1 py-0.5 rounded font-mono">**TEXT**</code>
                </span>
              </div>
              <input
                type="text"
                value={form.topAnnouncementText ?? ''}
                onChange={(e) => setForm({ ...form, topAnnouncementText: e.target.value })}
                placeholder="⚡ Welcome to Kintesi! Use coupon KINTESI10 for 10% OFF + Free Express Delivery"
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 focus:border-amber-500 rounded-xl text-white font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 1: Hero Section Left Details */}
        <div className="bg-gray-800/80 rounded-3xl border border-gray-700 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-700 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>1. Hero Section Content & Buttons</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Customize the main hero title, highlight gradient, and CTA buttons</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-700 text-xs">
              <input
                type="checkbox"
                checked={form.showHeroSection !== false}
                onChange={(e) => setForm({ ...form, showHeroSection: e.target.checked })}
                className="accent-emerald-500 w-4 h-4 rounded"
              />
              <span className="font-bold text-gray-200">Show Hero Banner</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Hero Top Badge Pill Text</label>
              <input
                type="text"
                value={form.heroBadge}
                onChange={(e) => setForm({ ...form, heroBadge: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Hero Main Title (First Part)</label>
              <input
                type="text"
                value={form.heroTitle}
                onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-emerald-400 uppercase mb-1.5">Hero Highlight Gradient Text</label>
              <input
                type="text"
                value={form.heroHighlightText}
                onChange={(e) => setForm({ ...form, heroHighlightText: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-emerald-300 font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Hero Subtitle / Description</label>
              <textarea
                rows={2}
                value={form.heroSubtitle}
                onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Primary Button Text</label>
              <input
                type="text"
                value={form.heroPrimaryBtnText}
                onChange={(e) => setForm({ ...form, heroPrimaryBtnText: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Primary Button Link</label>
              <input
                type="text"
                value={form.heroPrimaryBtnLink}
                onChange={(e) => setForm({ ...form, heroPrimaryBtnLink: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Secondary Button Text</label>
              <input
                type="text"
                value={form.heroSecondaryBtnText}
                onChange={(e) => setForm({ ...form, heroSecondaryBtnText: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Secondary Button Link</label>
              <input
                type="text"
                value={form.heroSecondaryBtnLink}
                onChange={(e) => setForm({ ...form, heroSecondaryBtnLink: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-mono"
              />
            </div>

          </div>
        </div>

        {/* Section 2: Hero Spotlight Card (Right Side) */}
        <div className="bg-gray-800/80 rounded-3xl border border-gray-700 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-700 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span>2. Hero Spotlight Promo Card</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Control the featured deal card shown on the hero banner</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-700 text-xs">
              <input
                type="checkbox"
                checked={form.showSpotlight}
                onChange={(e) => setForm({ ...form, showSpotlight: e.target.checked })}
                className="accent-emerald-500 w-4 h-4 rounded"
              />
              <span className="font-bold text-gray-200">Show Spotlight Card</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
            
            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Top Badge (e.g. Deal of the Day)</label>
              <input
                type="text"
                value={form.spotlightBadge}
                onChange={(e) => setForm({ ...form, spotlightBadge: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Brand / Seller Tag</label>
              <input
                type="text"
                value={form.spotlightBrand}
                onChange={(e) => setForm({ ...form, spotlightBrand: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Stock Status Label</label>
              <input
                type="text"
                value={form.spotlightStockText}
                onChange={(e) => setForm({ ...form, spotlightStockText: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Product Title</label>
              <input
                type="text"
                value={form.spotlightTitle}
                onChange={(e) => setForm({ ...form, spotlightTitle: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Savings Badge Text</label>
              <input
                type="text"
                value={form.spotlightSavingsText}
                onChange={(e) => setForm({ ...form, spotlightSavingsText: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Original Regular Price (৳)</label>
              <input
                type="number"
                value={form.spotlightPrice}
                onChange={(e) => setForm({ ...form, spotlightPrice: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-emerald-400 uppercase mb-1.5">Sale Discount Price (৳)</label>
              <input
                type="number"
                value={form.spotlightDiscountPrice}
                onChange={(e) => setForm({ ...form, spotlightDiscountPrice: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-emerald-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Button Target Link</label>
              <input
                type="text"
                value={form.spotlightBtnLink}
                onChange={(e) => setForm({ ...form, spotlightBtnLink: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-mono"
              />
            </div>

            <div className="sm:col-span-3">
              <ImageUploader
                label="Spotlight Showcase Image (Cloudinary Auto-Upload)"
                value={form.spotlightImage}
                onChange={(url) => setForm({ ...form, spotlightImage: url })}
                helpText="Square high-resolution photo displayed on the homepage spotlight card"
              />
            </div>

          </div>
        </div>

        {/* Section 3: Super Flash Sale Banner */}
        <div className="bg-gray-800/80 rounded-3xl border border-gray-700 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-700 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Timer className="w-5 h-5 text-amber-400" />
                <span>3. Super Flash Sale Countdown Banner</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Control heading, subtitle, countdown hours and color theme</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-700 text-xs">
              <input
                type="checkbox"
                checked={form.showFlashSale}
                onChange={(e) => setForm({ ...form, showFlashSale: e.target.checked })}
                className="accent-emerald-500 w-4 h-4 rounded"
              />
              <span className="font-bold text-gray-200">Enable Flash Sale</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Flash Sale Tag Pill</label>
              <input
                type="text"
                value={form.flashSaleTag}
                onChange={(e) => setForm({ ...form, flashSaleTag: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Countdown Duration (Hours)</label>
              <input
                type="number"
                min="1"
                max="72"
                value={form.flashSaleHours}
                onChange={(e) => setForm({ ...form, flashSaleHours: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Banner Gradient Theme</label>
              <select
                value={form.flashSaleTheme}
                onChange={(e) => setForm({ ...form, flashSaleTheme: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold"
              >
                <option value="sunset">🔥 Sunset Glow (Rose / Orange / Amber)</option>
                <option value="emerald">🌲 Emerald Luxe (Emerald / Teal / Cyan)</option>
                <option value="cyber">🔮 Cyber Violet (Purple / Indigo / Pink)</option>
                <option value="dark">🖤 Midnight Luxury (Slate 950 / Gold)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Flash Sale Main Heading</label>
              <input
                type="text"
                value={form.flashSaleTitle}
                onChange={(e) => setForm({ ...form, flashSaleTitle: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Flash Sale Subtitle</label>
              <input
                type="text"
                value={form.flashSaleSubtitle}
                onChange={(e) => setForm({ ...form, flashSaleSubtitle: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Live Visual Preview */}
        <div className="bg-gray-800/80 rounded-3xl border border-gray-700 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-700 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              <span>Live Visual Preview (What customers see)</span>
            </h2>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full">
              Real-time Rendering
            </span>
          </div>

          {/* Top Announcement Bar Live Preview */}
          {form.showTopAnnouncement !== false && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>Top Announcement Bar Preview:</span>
                <span className={form.isCustomAnnouncement ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {form.isCustomAnnouncement ? '● Active: Broadcasted to ALL Users' : '● Active: Visible only to New Users (7-day window)'}
                </span>
              </div>
              <div className="bg-gradient-to-r from-gray-950 via-rose-950 to-gray-950 text-white text-[11px] font-semibold py-2 px-4 rounded-xl text-center flex items-center justify-center gap-2 border border-rose-900/40 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0 animate-pulse text-amber-300" />
                <span>
                  {form.topAnnouncementText || '⚡ Welcome to Kintesi! Use coupon KINTESI10 for 10% OFF + Free Express Delivery'}
                </span>
              </div>
            </div>
          )}

          {/* Flash Sale Banner Live Preview */}
          {form.showFlashSale && (
            <div className={`bg-gradient-to-r ${getFlashThemeClasses(form.flashSaleTheme)} rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  <span>{form.flashSaleTag}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black">{form.flashSaleTitle}</h3>
                <p className="text-white/80 text-xs">{form.flashSaleSubtitle}</p>
              </div>

              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                <Timer className="w-5 h-5 text-amber-300" />
                <div className="text-center bg-white/10 px-3 py-1 rounded-xl">
                  <span className="text-base font-black font-mono">04</span>
                  <span className="text-[8px] uppercase tracking-wider block text-white/70">Hours</span>
                </div>
                <span className="font-bold">:</span>
                <div className="text-center bg-white/10 px-3 py-1 rounded-xl">
                  <span className="text-base font-black font-mono">59</span>
                  <span className="text-[8px] uppercase tracking-wider block text-white/70">Mins</span>
                </div>
                <span className="font-bold">:</span>
                <div className="text-center bg-white/10 px-3 py-1 rounded-xl">
                  <span className="text-base font-black font-mono text-amber-300">30</span>
                  <span className="text-[8px] uppercase tracking-wider block text-white/70">Secs</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm transition shadow-xl shadow-emerald-600/30 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{isLoading ? 'Saving Changes...' : 'Save & Publish Live to Homepage'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};

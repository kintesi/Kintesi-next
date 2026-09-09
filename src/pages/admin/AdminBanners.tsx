import React, { useState, useEffect } from 'react';
import { useSettings, BannerSettings, DEFAULT_BANNERS, cleanAnnouncementText } from '../../contexts/SettingsContext';
import { formatPrice } from '../../lib/utils';
import { ImageUploader } from '../../components/common/ImageUploader';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
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
  RotateCcw,
  Megaphone,
  Check,
  Zap,
  Radio,
  ExternalLink,
  Package,
} from 'lucide-react';

export const AdminBanners: React.FC = () => {
  const { settings, updateBanners, isLoading } = useSettings();
  const [form, setForm] = useState<BannerSettings>(settings.banners);

  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [isSavingSpotlight, setIsSavingSpotlight] = useState(false);
  const [isSavingFlash, setIsSavingFlash] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const savedCustom: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
        const { data } = await supabase.from('products').select('*');
        const merged = [...savedCustom, ...(data || [])].filter((p) => p && p.id);
        const unique = Array.from(new Map(merged.map((p) => [p.id, p])).values());
        setCatalogProducts(unique);
      } catch (err) {
        console.warn('Error loading products for spotlight dropdown:', err);
      }
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    if (settings.banners) {
      setForm({
        ...settings.banners,
        topAnnouncementText: cleanAnnouncementText(settings.banners.topAnnouncementText || ''),
      });
    }
  }, [settings.banners]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sanitized: BannerSettings = {
      ...form,
      topAnnouncementText: cleanAnnouncementText(form.topAnnouncementText),
    };
    setForm(sanitized);
    await updateBanners(sanitized);
  };

  const handleSaveAnnouncementOnly = async () => {
    setIsSavingAnnouncement(true);
    try {
      const sanitizedText = cleanAnnouncementText(form.topAnnouncementText);
      await updateBanners({
        showTopAnnouncement: form.showTopAnnouncement !== false,
        topAnnouncementText: sanitizedText,
        isCustomAnnouncement: Boolean(form.isCustomAnnouncement),
      });
      setForm((prev) => ({ ...prev, topAnnouncementText: sanitizedText }));
      toast.success('Announcement Bar saved & published!');
    } catch {
      toast.error('Failed to save announcement bar');
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleSaveHeroOnly = async () => {
    setIsSavingHero(true);
    try {
      await updateBanners({
        showHeroSection: form.showHeroSection !== false,
        heroBadge: form.heroBadge || '',
        heroTitle: form.heroTitle || '',
        heroHighlightText: form.heroHighlightText || '',
        heroSubtitle: form.heroSubtitle || '',
        heroPrimaryBtnText: form.heroPrimaryBtnText || '',
        heroPrimaryBtnLink: form.heroPrimaryBtnLink || '',
        heroSecondaryBtnText: form.heroSecondaryBtnText || '',
        heroSecondaryBtnLink: form.heroSecondaryBtnLink || '',
      });
      toast.success('Hero Section saved & published!');
    } catch {
      toast.error('Failed to save Hero section');
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleSaveSpotlightOnly = async () => {
    setIsSavingSpotlight(true);
    try {
      await updateBanners({
        showSpotlight: Boolean(form.showSpotlight),
        spotlightBadge: form.spotlightBadge || '',
        spotlightBrand: form.spotlightBrand || '',
        spotlightImage: form.spotlightImage || '',
        spotlightPrice: Number(form.spotlightPrice) || 0,
        spotlightDiscountPrice: Number(form.spotlightDiscountPrice) || 0,
        spotlightStockText: form.spotlightStockText || '',
        spotlightSavingsText: form.spotlightSavingsText || '',
        spotlightBtnLink: form.spotlightBtnLink || '',
        spotlightTitle: form.spotlightTitle || '',
      });
      toast.success('Spotlight Promo Card saved & published!');
    } catch {
      toast.error('Failed to save Spotlight card');
    } finally {
      setIsSavingSpotlight(false);
    }
  };

  const handleSaveFlashOnly = async () => {
    setIsSavingFlash(true);
    try {
      await updateBanners({
        showFlashSale: Boolean(form.showFlashSale),
        flashSaleTag: form.flashSaleTag || '',
        flashSaleTitle: form.flashSaleTitle || '',
        flashSaleSubtitle: form.flashSaleSubtitle || '',
        flashSaleHours: Math.max(1, Math.min(72, Number(form.flashSaleHours) || 4)),
        flashSaleTheme: form.flashSaleTheme || 'sunset',
      });
      toast.success('Flash Sale Banner saved & published!');
    } catch {
      toast.error('Failed to save Flash Sale banner');
    } finally {
      setIsSavingFlash(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to restore all homepage banners to factory defaults?')) {
      setForm(DEFAULT_BANNERS);
      toast.info('Banners reset to defaults. Click "Save All Changes" to publish live.');
    }
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

  const renderAnnouncementPreview = (text?: string) => {
    let raw = (text || '⚡ Welcome to Kintesi! Use coupon KINTESI10 for 10% OFF')
      .replace(/\s*[\+\&]?\s*Free\s+Express\s+Delivery/gi, '')
      .replace(/\s*Free\s+Express\s+Delivery/gi, '')
      .replace(/\s*[\+\&]?\s*Express\s+Delivery/gi, '')
      .trim();
    if (!raw) {
      raw = '⚡ Welcome to Kintesi! Use coupon KINTESI10 for 10% OFF';
    }
    if (raw.includes('**')) {
      const parts = raw.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="text-amber-300 uppercase font-black mx-0.5">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      });
    }
    if (raw.includes('KINTESI10')) {
      const parts = raw.split(/(KINTESI10)/g);
      return parts.map((part, index) => {
        if (part === 'KINTESI10') {
          return (
            <strong key={index} className="text-amber-300 uppercase font-black mx-0.5">
              KINTESI10
            </strong>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      });
    }
    return raw;
  };

  return (
    <div className="w-full max-w-[1750px] mx-auto space-y-8 text-white pb-20">
      
      {/* Top Banner Header with Status Summary & Primary Actions */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center">
                <Sliders className="w-6 h-6 text-rose-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Homepage Hero & Banner Customizer</span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Design and control all text, spotlight deals, top announcement bar, and flash sale countdown timers in real time
              </p>
            </div>
          </div>

          {/* Quick Status Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[11px] text-gray-400 font-semibold mr-1">Live Features:</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              form.showTopAnnouncement !== false
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${form.showTopAnnouncement !== false ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              Top Bar: {form.showTopAnnouncement !== false ? 'Active' : 'Hidden'}
            </span>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              form.showHeroSection !== false
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${form.showHeroSection !== false ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              Hero Banner: {form.showHeroSection !== false ? 'Active' : 'Hidden'}
            </span>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              form.showSpotlight
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${form.showSpotlight ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              Spotlight Deal: {form.showSpotlight ? 'Active' : 'Hidden'}
            </span>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              form.showFlashSale
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${form.showFlashSale ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              Flash Sale: {form.showFlashSale ? 'Active' : 'Hidden'}
            </span>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-bold rounded-2xl text-xs border border-gray-700 transition active:scale-95 disabled:opacity-50"
            title="Restore all banners to factory defaults"
          >
            <RotateCcw className="w-4 h-4 text-gray-400" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            onClick={() => handleSubmit()}
            disabled={isLoading}
            className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black rounded-2xl text-xs transition shadow-xl shadow-rose-600/30 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Publishing Changes...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Configuration Forms (7 cols / 58% on desktop) */}
        <div className="xl:col-span-7 space-y-6">

          {/* Section 0: Top Announcement Bar & Offer Broadcast */}
          <div className="bg-gray-800/80 rounded-3xl border border-gray-700/80 p-6 sm:p-7 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-700 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-400" />
                  <span>Top Announcement Bar & Broadcast</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Controls the slim notification bar at the very top of the website
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-900 px-3.5 py-1.5 rounded-xl border border-gray-700 hover:border-gray-600 text-xs transition">
                  <input
                    type="checkbox"
                    checked={form.showTopAnnouncement !== false}
                    onChange={(e) => setForm({ ...form, showTopAnnouncement: e.target.checked })}
                    className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="font-bold text-gray-200">Show Top Bar</span>
                </label>

                <button
                  type="button"
                  onClick={handleSaveAnnouncementOnly}
                  disabled={isSavingAnnouncement || isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black rounded-xl text-xs transition shadow-md active:scale-95 disabled:opacity-50"
                  title="Save only this section"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingAnnouncement ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Broadcast Mode Indicator */}
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
                          ? '🔥 Broadcast Mode Active — Visible to ALL Users' 
                          : '⚡ New User Welcome Mode — Visible for 7 Days'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 mt-1">
                      {form.isCustomAnnouncement
                        ? 'Your message is currently broadcasted to ALL visitors across the entire website.'
                        : 'Shown strictly to new users during their first 7 days. Afterward, it automatically hides.'}
                    </p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer bg-gray-900/90 px-3.5 py-2 rounded-xl border border-gray-600 hover:border-amber-400 text-xs flex-shrink-0 transition">
                    <input
                      type="checkbox"
                      checked={!!form.isCustomAnnouncement}
                      onChange={(e) => setForm({ ...form, isCustomAnnouncement: e.target.checked })}
                      className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="font-bold text-amber-300">Broadcast to ALL</span>
                  </label>
                </div>
              </div>

              {/* Announcement text input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-gray-300 uppercase">
                    Top Bar Message
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Bold text with <code className="text-amber-300 bg-gray-900 px-1 py-0.5 rounded font-mono">**TEXT**</code>
                  </span>
                </div>
                <input
                  type="text"
                  value={form.topAnnouncementText ?? ''}
                  onChange={(e) => setForm({ ...form, topAnnouncementText: e.target.value })}
                  placeholder="⚡ Welcome to Kintesi! Use coupon KINTESI10 for 10% OFF"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 focus:border-amber-500 rounded-xl text-white font-medium placeholder-gray-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 1: Hero Section Content & Buttons */}
          <div className="bg-gray-800/80 rounded-3xl border border-gray-700/80 p-6 sm:p-7 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-700 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-400" />
                  <span>1. Hero Section Content & CTA Buttons</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Customize the main headline, gradient highlight, and action buttons on the homepage
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-900 px-3.5 py-1.5 rounded-xl border border-gray-700 hover:border-gray-600 text-xs transition">
                  <input
                    type="checkbox"
                    checked={form.showHeroSection !== false}
                    onChange={(e) => setForm({ ...form, showHeroSection: e.target.checked })}
                    className="accent-rose-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="font-bold text-gray-200">Show Hero</span>
                </label>

                <button
                  type="button"
                  onClick={handleSaveHeroOnly}
                  disabled={isSavingHero || isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-md active:scale-95 disabled:opacity-50"
                  title="Save only hero section"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingHero ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Hero Top Badge Pill Text</label>
                <input
                  type="text"
                  value={form.heroBadge}
                  onChange={(e) => setForm({ ...form, heroBadge: e.target.value })}
                  placeholder="e.g. PREMIER LIFESTYLE & SHOPPING MARKETPLACE"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-semibold focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Hero Main Title (First Part)</label>
                <input
                  type="text"
                  value={form.heroTitle}
                  onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
                  placeholder="e.g. Everything You Need for"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-rose-400 uppercase mb-1.5">Hero Highlight Gradient Text</label>
                <input
                  type="text"
                  value={form.heroHighlightText}
                  onChange={(e) => setForm({ ...form, heroHighlightText: e.target.value })}
                  placeholder="e.g. Life, Fashion & Tech"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-rose-300 font-bold focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Hero Subtitle / Description</label>
                <textarea
                  rows={2}
                  value={form.heroSubtitle}
                  onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
                  placeholder="Write a catchy summary of what customers can buy..."
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-medium focus:border-rose-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Primary Button Text</label>
                <input
                  type="text"
                  value={form.heroPrimaryBtnText}
                  onChange={(e) => setForm({ ...form, heroPrimaryBtnText: e.target.value })}
                  placeholder="e.g. Explore Kintesi Catalog"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Primary Button Link</label>
                <input
                  type="text"
                  value={form.heroPrimaryBtnLink}
                  onChange={(e) => setForm({ ...form, heroPrimaryBtnLink: e.target.value })}
                  placeholder="/shop"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-mono focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Secondary Button Text</label>
                <input
                  type="text"
                  value={form.heroSecondaryBtnText}
                  onChange={(e) => setForm({ ...form, heroSecondaryBtnText: e.target.value })}
                  placeholder="e.g. Browse Categories"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Secondary Button Link</label>
                <input
                  type="text"
                  value={form.heroSecondaryBtnLink}
                  onChange={(e) => setForm({ ...form, heroSecondaryBtnLink: e.target.value })}
                  placeholder="/shop"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-mono focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Hero Spotlight Promo Card */}
          <div className="bg-gray-800/80 rounded-3xl border border-gray-700/80 p-6 sm:p-7 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-700 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span>2. Hero Spotlight Promo Card (Deal of the Day)</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Featured product deal shown next to the hero headline
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-900 px-3.5 py-1.5 rounded-xl border border-gray-700 hover:border-gray-600 text-xs transition">
                  <input
                    type="checkbox"
                    checked={form.showSpotlight}
                    onChange={(e) => setForm({ ...form, showSpotlight: e.target.checked })}
                    className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="font-bold text-gray-200">Show Spotlight</span>
                </label>

                <button
                  type="button"
                  onClick={handleSaveSpotlightOnly}
                  disabled={isSavingSpotlight || isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-gray-950 font-black rounded-xl text-xs transition shadow-md active:scale-95 disabled:opacity-50"
                  title="Save only spotlight deal"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingSpotlight ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* 1-Click Product Selector from Store Catalog */}
            <div className="bg-gray-900/90 border border-orange-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                      Select Product from Store (1-Click Auto Fill)
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Pick any existing product to instantly fill title, image, price, discount & link
                    </p>
                  </div>
                </div>
                {catalogProducts.length > 0 && (
                  <span className="text-[10px] bg-gray-800 text-orange-300 font-bold px-2.5 py-1 rounded-full border border-gray-700">
                    {catalogProducts.length} Products Found
                  </span>
                )}
              </div>

              <select
                onChange={(e) => {
                  const prod = catalogProducts.find((p) => p.id === e.target.value);
                  if (prod) {
                    const price = prod.price || 0;
                    const discount = prod.discount_price || Math.round(price * 0.85);
                    const savings = price > discount ? `Save ৳${price - discount} Today` : 'Special Promo';
                    setForm((prev) => ({
                      ...prev,
                      showSpotlight: true,
                      spotlightTitle: prod.title,
                      spotlightBrand: prod.brand || 'Kintesi Exclusive',
                      spotlightPrice: price,
                      spotlightDiscountPrice: discount,
                      spotlightImage: (prod.images && prod.images[0]) || prev.spotlightImage,
                      spotlightBtnLink: `/product/${prod.slug || prod.id}`,
                      spotlightStockText: prod.stock ? `${prod.stock} Left in Stock` : 'Limited Stock',
                      spotlightSavingsText: savings,
                      spotlightBadge: '🔥 Deal of the Day',
                    }));
                    toast.success(`Spotlight filled with "${prod.title}"! Click "Save" to publish live.`);
                  }
                }}
                defaultValue=""
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white font-medium focus:border-orange-400 focus:outline-none"
              >
                <option value="" disabled>-- Select a product to feature in hero spotlight --</option>
                {catalogProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — ৳{p.discount_price || p.price} ({p.brand || 'Kintesi'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Top Badge</label>
                <input
                  type="text"
                  value={form.spotlightBadge}
                  onChange={(e) => setForm({ ...form, spotlightBadge: e.target.value })}
                  placeholder="🔥 Deal of the Day"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-orange-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Brand / Seller</label>
                <input
                  type="text"
                  value={form.spotlightBrand}
                  onChange={(e) => setForm({ ...form, spotlightBrand: e.target.value })}
                  placeholder="Kintesi Premium"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-orange-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Stock Status Label</label>
                <input
                  type="text"
                  value={form.spotlightStockText}
                  onChange={(e) => setForm({ ...form, spotlightStockText: e.target.value })}
                  placeholder="12 Left in Stock"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-orange-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Product Title</label>
                <input
                  type="text"
                  value={form.spotlightTitle}
                  onChange={(e) => setForm({ ...form, spotlightTitle: e.target.value })}
                  placeholder="Vintage Leather Jacket"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-orange-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Savings Badge Text</label>
                <input
                  type="text"
                  value={form.spotlightSavingsText}
                  onChange={(e) => setForm({ ...form, spotlightSavingsText: e.target.value })}
                  placeholder="Save ৳2,000 Today"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-orange-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Original Price (৳)</label>
                <input
                  type="number"
                  value={form.spotlightPrice || ''}
                  onChange={(e) => setForm({ ...form, spotlightPrice: Number(e.target.value) })}
                  placeholder="5000"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-orange-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-400 uppercase mb-1.5">Sale Discount Price (৳)</label>
                <input
                  type="number"
                  value={form.spotlightDiscountPrice || ''}
                  onChange={(e) => setForm({ ...form, spotlightDiscountPrice: Number(e.target.value) })}
                  placeholder="3990"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-emerald-300 font-bold focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Button Target Link</label>
                <input
                  type="text"
                  value={form.spotlightBtnLink}
                  onChange={(e) => setForm({ ...form, spotlightBtnLink: e.target.value })}
                  placeholder="/shop"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-mono focus:border-orange-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <ImageUploader
                  label="Spotlight Showcase Image"
                  value={form.spotlightImage}
                  onChange={(url) => setForm({ ...form, spotlightImage: url })}
                  helpText="High-resolution image shown inside the spotlight promo card"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Super Flash Sale Banner */}
          <div className="bg-gray-800/80 rounded-3xl border border-gray-700/80 p-6 sm:p-7 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-700 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Timer className="w-5 h-5 text-amber-400" />
                  <span>3. Super Flash Sale Countdown Banner</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Control countdown timer, heading, subtitle, and color theme
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-900 px-3.5 py-1.5 rounded-xl border border-gray-700 hover:border-gray-600 text-xs transition">
                  <input
                    type="checkbox"
                    checked={form.showFlashSale}
                    onChange={(e) => setForm({ ...form, showFlashSale: e.target.checked })}
                    className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="font-bold text-gray-200">Enable Flash Sale</span>
                </label>

                <button
                  type="button"
                  onClick={handleSaveFlashOnly}
                  disabled={isSavingFlash || isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black rounded-xl text-xs transition shadow-md active:scale-95 disabled:opacity-50"
                  title="Save only flash sale"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingFlash ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Tag Badge</label>
                <input
                  type="text"
                  value={form.flashSaleTag}
                  onChange={(e) => setForm({ ...form, flashSaleTag: e.target.value })}
                  placeholder="🔥 SUPER FLASH SALE"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Countdown Hours</label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={form.flashSaleHours || ''}
                  onChange={(e) => setForm({ ...form, flashSaleHours: Number(e.target.value) })}
                  placeholder="4"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Color Theme</label>
                <select
                  value={form.flashSaleTheme}
                  onChange={(e) => setForm({ ...form, flashSaleTheme: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                >
                  <option value="sunset">🔥 Sunset Glow (Rose / Amber)</option>
                  <option value="emerald">🌲 Emerald Luxe (Emerald / Teal)</option>
                  <option value="cyber">🔮 Cyber Violet (Purple / Pink)</option>
                  <option value="dark">🖤 Midnight Luxury (Slate / Gold)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Flash Sale Main Heading</label>
                <input
                  type="text"
                  value={form.flashSaleTitle}
                  onChange={(e) => setForm({ ...form, flashSaleTitle: e.target.value })}
                  placeholder="Limited Time Discounts Up to 35%"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Flash Sale Subtitle</label>
                <input
                  type="text"
                  value={form.flashSaleSubtitle}
                  onChange={(e) => setForm({ ...form, flashSaleSubtitle: e.target.value })}
                  placeholder="Hurry up! Special prices end when the timer reaches zero."
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-medium focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Real-time Live Visual Preview Studio (5 cols / 42% on desktop, sticky) */}
        <div className="xl:col-span-5 space-y-6 xl:sticky xl:top-14">
          
          <div className="bg-gray-800/90 rounded-3xl border border-gray-700/90 p-6 space-y-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-gray-700 pb-3.5">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">Live Store Preview</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2.5 py-1 rounded-full border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                Real-Time Rendering
              </span>
            </div>

            {/* 1. Live Announcement Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase">
                <span>Top Announcement Bar</span>
                <span className={form.showTopAnnouncement !== false ? 'text-emerald-400' : 'text-gray-500'}>
                  {form.showTopAnnouncement !== false ? '● Visible' : '○ Hidden'}
                </span>
              </div>

              {form.showTopAnnouncement !== false ? (
                <div className="bg-gradient-to-r from-gray-950 via-rose-950 to-gray-950 text-white text-[11px] font-semibold py-2 px-3.5 rounded-xl text-center flex items-center justify-center gap-2 border border-rose-900/40 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0 animate-pulse text-amber-300" />
                  <span className="truncate">
                    {renderAnnouncementPreview(form.topAnnouncementText)}
                  </span>
                </div>
              ) : (
                <div className="bg-gray-900/60 border border-dashed border-gray-700 text-gray-500 text-xs py-2 px-3 rounded-xl text-center">
                  Top Announcement Bar is turned OFF
                </div>
              )}
            </div>

            {/* 2. Live Hero Banner Mini-Preview */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase">
                <span>Hero Section Preview</span>
                <span className={form.showHeroSection !== false ? 'text-emerald-400' : 'text-gray-500'}>
                  {form.showHeroSection !== false ? '● Visible' : '○ Hidden'}
                </span>
              </div>

              {form.showHeroSection !== false ? (
                <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 border border-gray-700/80 rounded-2xl p-4 space-y-3">
                  {/* Badge */}
                  {form.heroBadge && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                      <Sparkles className="w-2.5 h-2.5 text-rose-400" />
                      <span>{form.heroBadge}</span>
                    </div>
                  )}

                  {/* Title & Highlight */}
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-white leading-tight">
                      {form.heroTitle || 'Everything You Need for'}{' '}
                      <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                        {form.heroHighlightText || 'Life, Fashion & Tech'}
                      </span>
                    </h4>
                    <p className="text-gray-400 text-[11px] mt-1 line-clamp-2">
                      {form.heroSubtitle || 'Browse catalog products...'}
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-3 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-black shadow-xs flex items-center gap-1">
                      <span>{form.heroPrimaryBtnText || 'Explore'}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                    <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-[10px] font-bold border border-gray-700">
                      {form.heroSecondaryBtnText || 'Categories'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900/60 border border-dashed border-gray-700 text-gray-500 text-xs py-2 px-3 rounded-xl text-center">
                  Hero Section is turned OFF
                </div>
              )}
            </div>

            {/* 3. Live Spotlight Promo Card Preview */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase">
                <span>Spotlight Deal Card</span>
                <span className={form.showSpotlight ? 'text-emerald-400' : 'text-gray-500'}>
                  {form.showSpotlight ? '● Visible' : '○ Hidden'}
                </span>
              </div>

              {form.showSpotlight ? (
                <div className="bg-gray-900 border border-gray-700/90 rounded-2xl p-3.5 flex gap-3.5 items-center">
                  <div className="w-20 h-20 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden flex-shrink-0 relative flex items-center justify-center">
                    {form.spotlightImage ? (
                      <img src={form.spotlightImage} alt={form.spotlightTitle} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-600" />
                    )}
                    {form.spotlightSavingsText && (
                      <span className="absolute bottom-1 left-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                        {form.spotlightSavingsText}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.5 rounded">
                        {form.spotlightBadge || 'Deal of the Day'}
                      </span>
                      <span className="text-[10px] text-gray-400">{form.spotlightBrand}</span>
                    </div>
                    <h5 className="font-bold text-white text-xs truncate">
                      {form.spotlightTitle || 'Spotlight Product Title'}
                    </h5>
                    <div className="flex items-baseline gap-2">
                      <span className="text-emerald-400 font-black text-xs">
                        ৳{form.spotlightDiscountPrice || 0}
                      </span>
                      {Number(form.spotlightPrice) > Number(form.spotlightDiscountPrice) && (
                        <span className="text-gray-500 line-through text-[10px]">
                          ৳{form.spotlightPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900/60 border border-dashed border-gray-700 text-gray-500 text-xs py-2 px-3 rounded-xl text-center">
                  Spotlight Promo Card is turned OFF
                </div>
              )}
            </div>

            {/* 4. Live Flash Sale Preview */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase">
                <span>Flash Sale Countdown Banner</span>
                <span className={form.showFlashSale ? 'text-emerald-400' : 'text-gray-500'}>
                  {form.showFlashSale ? '● Visible' : '○ Hidden'}
                </span>
              </div>

              {form.showFlashSale ? (
                <div className={`bg-gradient-to-r ${getFlashThemeClasses(form.flashSaleTheme)} rounded-2xl p-4 text-white shadow-lg space-y-2.5`}>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase">
                      <Flame className="w-3 h-3 fill-white" />
                      <span>{form.flashSaleTag || 'FLASH SALE'}</span>
                    </span>

                    {/* Timer preview */}
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold bg-black/40 px-2 py-0.5 rounded-lg border border-white/20">
                      <Timer className="w-3 h-3 text-amber-300 mr-0.5" />
                      <span>04h : 59m : 30s</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-black text-white leading-tight">
                      {form.flashSaleTitle || 'Flash Sale Heading'}
                    </h5>
                    <p className="text-white/80 text-[10px] mt-0.5 line-clamp-1">
                      {form.flashSaleSubtitle || 'Limited time special discounts'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900/60 border border-dashed border-gray-700 text-gray-500 text-xs py-2 px-3 rounded-xl text-center">
                  Flash Sale Banner is turned OFF
                </div>
              )}
            </div>

            {/* Sticky Save Bar */}
            <div className="pt-3 border-t border-gray-700 space-y-2">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black rounded-xl text-xs transition shadow-lg shadow-rose-600/30 active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? 'Publishing Changes...' : 'Save All Changes to Live Store'}</span>
              </button>
              <p className="text-[10px] text-gray-400 text-center">
                Instant sync: changes take effect immediately across all visitors.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

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
  ShoppingBag,
  Trash2,
  Plus,
  Layers,
  Search,
  X,
} from 'lucide-react';
import { FlashSaleSlide } from '../../contexts/SettingsContext';
import { FlashSaleBanner } from '../../components/home/FlashSaleBanner';
import { getProductsFromDB, saveProductToDB } from '../../lib/dbService';

export const AdminBanners: React.FC = () => {
  const { settings, updateBanners, isLoading } = useSettings();
  const [form, setForm] = useState<BannerSettings>(settings.banners);

  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [isSavingSpotlight, setIsSavingSpotlight] = useState(false);
  const [isSavingFlash, setIsSavingFlash] = useState(false);
  const [isSavingFeatured, setIsSavingFeatured] = useState(false);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [spotlightSearch, setSpotlightSearch] = useState('');
  const [featuredSearch, setFeaturedSearch] = useState('');
  const [isTogglingFeatured, setIsTogglingFeatured] = useState<string | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const prods = await getProductsFromDB();
        setCatalogProducts(prods);
      } catch (err) {
        console.warn('Error loading products for catalog:', err);
      }
    }
    loadCatalog();
    const handleUpdate = () => loadCatalog();
    window.addEventListener('kintesi_products_updated', handleUpdate);
    return () => window.removeEventListener('kintesi_products_updated', handleUpdate);
  }, []);

  // Filter products for Hero Spotlight by Title or SKU
  const filteredSpotlightProducts = spotlightSearch.trim()
    ? catalogProducts.filter((p) => {
        const q = spotlightSearch.toLowerCase().trim();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const skuMatch = (p.sku || '').toLowerCase().includes(q);
        const brandMatch = (p.brand || '').toLowerCase().includes(q);
        return titleMatch || skuMatch || brandMatch;
      })
    : [];

  // Filter products for Featured Products selector by Title or SKU
  const searchedProductsForFeatured = featuredSearch.trim()
    ? catalogProducts.filter((p) => {
        const q = featuredSearch.toLowerCase().trim();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const skuMatch = (p.sku || '').toLowerCase().includes(q);
        const brandMatch = (p.brand || '').toLowerCase().includes(q);
        return titleMatch || skuMatch || brandMatch;
      })
    : [];

  const featuredProductsList = catalogProducts.filter((p) => Boolean(p.is_featured));

  const applyProductToSpotlight = (prod: Product) => {
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
      spotlightBtnLink: `/product/${prod.id}`,
      spotlightStockText: prod.stock ? `${prod.stock} Left in Stock` : 'Limited Stock',
      spotlightSavingsText: savings,
      spotlightBadge: '🔥 Deal of the Day',
    }));
    setSpotlightSearch('');
    toast.success(`Spotlight filled with "${prod.title}"! Click "Save" to publish live.`);
  };

  const handleToggleProductFeatured = async (product: Product, featuredState: boolean) => {
    try {
      setIsTogglingFeatured(product.id);
      const updatedProduct: Product = {
        ...product,
        is_featured: featuredState,
      };

      // 1. Instant local state update for zero-latency UI
      setCatalogProducts((prev) =>
        prev.map((p) => (p.id === product.id ? updatedProduct : p))
      );

      // 2. Persist to Supabase, Firebase and LocalStorage
      await saveProductToDB(updatedProduct);

      if (featuredState) {
        toast.success(`"${product.title}" Featured Products-এ যোগ করা হয়েছে!`);
      } else {
        toast.info(`"${product.title}" Featured Products থেকে রিমুভ করা হয়েছে।`);
      }
    } catch (err) {
      console.error('Error toggling featured status:', err);
      toast.error('Failed to update featured status. Please try again.');
    } finally {
      setIsTogglingFeatured(null);
    }
  };

  useEffect(() => {
    if (settings.banners) {
      setForm({
        ...settings.banners,
        topAnnouncementText: cleanAnnouncementText(settings.banners.topAnnouncementText || ''),
      });
    }
  }, [settings.banners]);

  const currentSlides: FlashSaleSlide[] = (form.flashSaleSlides && form.flashSaleSlides.length > 0)
    ? form.flashSaleSlides
    : [
        {
          id: 'slide-1',
          tag: form.flashSaleTag || '⚡ FLASH SALE',
          title: form.flashSaleTitle || 'Exclusive 24-Hour Super Deals',
          subtitle: form.flashSaleSubtitle || 'Limited stock flash offers with up to 50% discount. Order before time runs out!',
          bgImage: form.flashSaleBgImage || '',
        },
      ];

  const handleAddSlide = () => {
    const newSlide: FlashSaleSlide = {
      id: `slide-${Date.now()}`,
      tag: '⚡ FLASH SALE',
      title: 'Mega Flash Deals',
      subtitle: 'Grab your favorite products at huge discounts before the timer ends!',
      bgImage: '',
    };
    const updated = [...currentSlides, newSlide];
    setForm((prev) => ({ ...prev, flashSaleSlides: updated }));
    setSelectedSlideIndex(updated.length - 1);
    toast.success(`Slide ${updated.length} added! Configure its text & background image, then click Save.`);
  };

  const handleRemoveSlide = (idxToRemove: number) => {
    if (currentSlides.length <= 1) {
      toast.error('At least one slide is required.');
      return;
    }
    const updated = currentSlides.filter((_, idx) => idx !== idxToRemove);
    setForm((prev) => ({ ...prev, flashSaleSlides: updated }));
    setSelectedSlideIndex((prev) => Math.min(prev, updated.length - 1));
    toast.info('Slide removed. Click Save to publish changes.');
  };

  const handleUpdateCurrentSlide = (field: keyof FlashSaleSlide, value: string) => {
    const updated = [...currentSlides];
    const target = { ...updated[selectedSlideIndex], [field]: value };
    updated[selectedSlideIndex] = target;
    setForm((prev) => {
      const nextForm = { ...prev, flashSaleSlides: updated };
      if (selectedSlideIndex === 0) {
        if (field === 'title') nextForm.flashSaleTitle = value;
        if (field === 'subtitle') nextForm.flashSaleSubtitle = value;
        if (field === 'tag') nextForm.flashSaleTag = value;
        if (field === 'bgImage') nextForm.flashSaleBgImage = value;
      }
      return nextForm;
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const hours = Math.max(1, Math.min(72, Number(form.flashSaleHours) || 4));
    let endsAt = form.flashSaleEndsAt;
    if (form.showFlashSale && (!endsAt || new Date(endsAt).getTime() <= Date.now())) {
      endsAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    }
    const sanitized: BannerSettings = {
      ...form,
      flashSaleHours: hours,
      flashSaleEndsAt: endsAt,
      flashSaleBgImage: form.flashSaleBgImage || currentSlides[0]?.bgImage || '',
      flashSaleSlides: currentSlides,
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
      const hours = Math.max(1, Math.min(72, Number(form.flashSaleHours) || 4));
      let endsAt = form.flashSaleEndsAt;
      if (form.showFlashSale && (!endsAt || new Date(endsAt).getTime() <= Date.now())) {
        endsAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      }
      await updateBanners({
        showFlashSale: Boolean(form.showFlashSale),
        flashSaleTag: form.flashSaleTag || currentSlides[0]?.tag || '',
        flashSaleTitle: form.flashSaleTitle || currentSlides[0]?.title || '',
        flashSaleSubtitle: form.flashSaleSubtitle || currentSlides[0]?.subtitle || '',
        flashSaleHours: hours,
        flashSaleTheme: form.flashSaleTheme || 'sunset',
        flashSaleEndsAt: endsAt,
        flashSaleBgImage: form.flashSaleBgImage || currentSlides[0]?.bgImage || '',
        flashSaleSlides: currentSlides,
      });
      setForm((prev) => ({
        ...prev,
        flashSaleHours: hours,
        flashSaleEndsAt: endsAt,
        flashSaleBgImage: form.flashSaleBgImage || currentSlides[0]?.bgImage || '',
        flashSaleSlides: currentSlides,
      }));
      toast.success('Flash Sale Banner saved & published!');
    } catch {
      toast.error('Failed to save Flash Sale banner');
    } finally {
      setIsSavingFlash(false);
    }
  };

  const handleRestartFlashCountdown = () => {
    const hours = Math.max(1, Math.min(72, Number(form.flashSaleHours) || 4));
    const newEndsAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    setForm((prev) => ({
      ...prev,
      showFlashSale: true,
      flashSaleHours: hours,
      flashSaleEndsAt: newEndsAt,
    }));
    toast.info(`Flash Sale timer reset to ${hours} hours from now! Click "Save" to publish live.`);
  };

  const handleSaveFeaturedOnly = async () => {
    setIsSavingFeatured(true);
    try {
      await updateBanners({
        showFeaturedProducts: form.showFeaturedProducts !== false,
        featuredProductsTitle: form.featuredProductsTitle || 'Featured Products',
        featuredProductsSubtitle: form.featuredProductsSubtitle || 'Top-rated selections for home, fashion, and tech',
      });
      toast.success('Featured Products section saved & published!');
    } catch {
      toast.error('Failed to save Featured Products section');
    } finally {
      setIsSavingFeatured(false);
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
    <div className="w-full space-y-8 text-white pb-20">
      
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
              form.showFlashSale && (!form.flashSaleEndsAt || new Date(form.flashSaleEndsAt).getTime() > Date.now())
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : form.showFlashSale && form.flashSaleEndsAt && new Date(form.flashSaleEndsAt).getTime() <= Date.now()
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                form.showFlashSale && (!form.flashSaleEndsAt || new Date(form.flashSaleEndsAt).getTime() > Date.now())
                  ? 'bg-emerald-400'
                  : form.showFlashSale
                  ? 'bg-amber-400'
                  : 'bg-gray-500'
              }`} />
              Flash Sale: {
                form.showFlashSale && (!form.flashSaleEndsAt || new Date(form.flashSaleEndsAt).getTime() > Date.now())
                  ? 'Active'
                  : form.showFlashSale
                  ? 'Expired (Auto-Off)'
                  : 'Hidden'
              }
            </span>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              form.showFeaturedProducts !== false
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${form.showFeaturedProducts !== false ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              Featured Section: {form.showFeaturedProducts !== false ? 'Active' : 'Hidden'}
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        
        {/* Left Column: Configuration Forms */}
        <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-8 space-y-6">

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

            {/* 1-Click Product Selector from Store Catalog (with Title & SKU Search) */}
            <div className="bg-gray-900/90 border border-orange-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                      Select Product from Store (1-Click Auto Fill)
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      প্রোডাক্টের টাইটেল অথবা SKU দিয়ে সার্চ করে ১-ক্লিকে স্পটলাইটে বসান
                    </p>
                  </div>
                </div>
                {catalogProducts.length > 0 && (
                  <span className="text-[10px] bg-gray-800 text-orange-300 font-bold px-2.5 py-1 rounded-full border border-gray-700 self-start sm:self-auto">
                    {catalogProducts.length} Products Found
                  </span>
                )}
              </div>

              {/* Title & SKU Search Bar */}
              <div className="space-y-2">
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={spotlightSearch}
                    onChange={(e) => setSpotlightSearch(e.target.value)}
                    placeholder="Search by Product Title or SKU (e.g. KT-..., Polo, Watch)..."
                    className="w-full pl-10 pr-24 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 font-medium focus:border-orange-400 focus:outline-none"
                  />
                  {spotlightSearch && (
                    <button
                      type="button"
                      onClick={() => setSpotlightSearch('')}
                      className="absolute right-20 text-gray-400 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-orange-500 hover:bg-orange-400 text-gray-950 font-bold rounded-lg text-xs transition active:scale-95 flex items-center gap-1"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                </div>

                {/* Instant Live Search Results */}
                {spotlightSearch.trim().length > 0 && (
                  <div className="bg-gray-950 border border-orange-500/40 rounded-xl p-2 max-h-64 overflow-y-auto space-y-1.5 shadow-2xl divide-y divide-gray-800">
                    {filteredSpotlightProducts.length === 0 ? (
                      <div className="py-4 text-center text-xs text-gray-400">
                        "{spotlightSearch}" দিয়ে টাইটেল বা SKU-তে কোনো প্রোডাক্ট খুঁজে পাওয়া যায়নি।
                      </div>
                    ) : (
                      filteredSpotlightProducts.map((p) => (
                        <div
                          key={p.id}
                          className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-2 hover:bg-gray-900 rounded-xl transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden shrink-0 border border-gray-700">
                              {p.images && p.images[0] ? (
                                <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-gray-500 m-auto mt-2.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono font-bold bg-gray-800 text-orange-300 px-1.5 py-0.5 rounded border border-gray-700">
                                  SKU: {p.sku || 'KT-' + p.id.slice(0, 6).toUpperCase()}
                                </span>
                                <span className="text-[11px] text-emerald-400 font-bold">
                                  ৳{p.discount_price || p.price}
                                </span>
                                {p.discount_price && (
                                  <span className="text-[10px] text-gray-400 line-through">
                                    ৳{p.price}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => applyProductToSpotlight(p)}
                            className="shrink-0 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-gray-950 font-bold rounded-lg text-xs shadow transition active:scale-95 flex items-center gap-1"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>1-Click Fill</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Or Select from All Products Dropdown */}
              <div className="pt-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Or Pick from Catalog List ({catalogProducts.length} Products)
                </label>
                <select
                  onChange={(e) => {
                    const prod = catalogProducts.find((p) => p.id === e.target.value);
                    if (prod) applyProductToSpotlight(prod);
                  }}
                  defaultValue=""
                  className="w-full px-4 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white font-medium focus:border-orange-400 focus:outline-none"
                >
                  <option value="" disabled>-- Select a product to feature in hero spotlight --</option>
                  {catalogProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} [SKU: {p.sku || ('KT-' + p.id.slice(0, 6).toUpperCase())}] — ৳{p.discount_price || p.price}
                    </option>
                  ))}
                </select>
              </div>
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
                  নির্ধারিত সময় শেষ হলে ফ্ল্যাশ সেল স্বয়ংক্রিয়ভাবে বন্ধ (Auto-Off) হয়ে যাবে
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-900 px-3.5 py-1.5 rounded-xl border border-gray-700 hover:border-gray-600 text-xs transition">
                  <input
                    type="checkbox"
                    checked={form.showFlashSale}
                    onChange={(e) => {
                      const next = e.target.checked;
                      const hours = Math.max(1, Math.min(72, Number(form.flashSaleHours) || 4));
                      setForm({
                        ...form,
                        showFlashSale: next,
                        flashSaleEndsAt: next
                          ? (!form.flashSaleEndsAt || new Date(form.flashSaleEndsAt).getTime() <= Date.now()
                              ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
                              : form.flashSaleEndsAt)
                          : form.flashSaleEndsAt,
                      });
                    }}
                    className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="font-bold text-gray-200">
                    {form.showFlashSale ? 'Flash Sale ON' : 'Flash Sale OFF'}
                  </span>
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

            {/* Expiry & Countdown Status Alert */}
            {form.showFlashSale && (
              <div className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                form.flashSaleEndsAt && new Date(form.flashSaleEndsAt).getTime() <= Date.now()
                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
              }`}>
                <div className="flex items-start gap-2.5">
                  <Timer className={`w-4 h-4 shrink-0 mt-0.5 ${
                    form.flashSaleEndsAt && new Date(form.flashSaleEndsAt).getTime() <= Date.now()
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`} />
                  <div>
                    <p className="font-bold text-white">
                      {form.flashSaleEndsAt && new Date(form.flashSaleEndsAt).getTime() <= Date.now()
                        ? '⏳ সময় শেষ (Expired) - স্টোরফ্রন্টে ফ্ল্যাশ সেল অটোমেটিক অফ রয়েছে'
                        : '⚡ ফ্ল্যাশ সেল টাইমার সক্রিয় রয়েছে'}
                    </p>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      {form.flashSaleEndsAt
                        ? `নির্ধারিত শেষ সময়: ${new Date(form.flashSaleEndsAt).toLocaleString()}`
                        : 'টাইমার সেট করা নেই'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRestartFlashCountdown}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold rounded-xl text-xs shadow transition active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Countdown ({form.flashSaleHours || 4}h)</span>
                </button>
              </div>
            )}

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
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Countdown Hours (ঘণ্টা)</label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={form.flashSaleHours || ''}
                  onChange={(e) => {
                    const hrs = Number(e.target.value);
                    setForm({ ...form, flashSaleHours: hrs });
                  }}
                  placeholder="4"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                />
                {/* Preset quick buttons */}
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {[2, 4, 6, 12, 24, 48].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        const newEndsAt = new Date(Date.now() + h * 60 * 60 * 1000).toISOString();
                        setForm({
                          ...form,
                          showFlashSale: true,
                          flashSaleHours: h,
                          flashSaleEndsAt: newEndsAt,
                        });
                        toast.info(`Flash Sale set to ${h} hours from now! Click "Save" to apply.`);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                        form.flashSaleHours === h
                          ? 'bg-amber-500 text-gray-950 border-amber-400'
                          : 'bg-gray-900 text-gray-400 border-gray-700 hover:text-white'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
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
            </div>

            {/* Multi-Slide & Background Image Manager */}
            <div className="border-t border-gray-700/80 pt-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Flash Sale Slides & Background Images ({currentSlides.length} Slides)</span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    একাধিক স্লাইড ও ব্যাকগ্রাউন্ড ইমেজ যুক্ত করুন। ওয়েবসাইটে এগুলো ৪.৫ সেকেন্ড পর পর সুন্দর ট্রানজিশন অ্যানিমেশন দিয়ে একটির পর একটি আসবে।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddSlide}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-amber-300 font-bold rounded-xl text-xs border border-amber-500/30 transition shadow-sm self-start sm:self-auto cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Slide</span>
                </button>
              </div>

              {/* Slide Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {currentSlides.map((s, idx) => (
                  <button
                    key={s.id || idx}
                    type="button"
                    onClick={() => setSelectedSlideIndex(idx)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      selectedSlideIndex === idx
                        ? 'bg-amber-500 text-gray-950 shadow-md'
                        : 'bg-gray-900 text-gray-400 border border-gray-700 hover:text-white'
                    }`}
                  >
                    <span>Slide {idx + 1}</span>
                    {s.bgImage && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Has background image" />}
                  </button>
                ))}
              </div>

              {/* Active Slide Editor Box */}
              {currentSlides[selectedSlideIndex] && (
                <div className="bg-gray-900/90 border border-gray-700 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs">
                        Editing Slide #{selectedSlideIndex + 1}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {currentSlides[selectedSlideIndex].title || 'Untitled Slide'}
                      </span>
                    </div>

                    {currentSlides.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlide(selectedSlideIndex)}
                        className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Slide</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-gray-300 uppercase mb-1">Slide Tag Badge</label>
                      <input
                        type="text"
                        value={currentSlides[selectedSlideIndex]?.tag || ''}
                        onChange={(e) => handleUpdateCurrentSlide('tag', e.target.value)}
                        placeholder="⚡ FLASH SALE"
                        className="w-full px-3.5 py-2 bg-gray-950 border border-gray-700 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-gray-300 uppercase mb-1">Slide Main Heading</label>
                      <input
                        type="text"
                        value={currentSlides[selectedSlideIndex]?.title || ''}
                        onChange={(e) => handleUpdateCurrentSlide('title', e.target.value)}
                        placeholder="Exclusive 24-Hour Super Deals"
                        className="w-full px-3.5 py-2 bg-gray-950 border border-gray-700 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-bold text-gray-300 uppercase mb-1">Slide Subtitle</label>
                      <input
                        type="text"
                        value={currentSlides[selectedSlideIndex]?.subtitle || ''}
                        onChange={(e) => handleUpdateCurrentSlide('subtitle', e.target.value)}
                        placeholder="Limited stock flash offers with up to 50% discount. Order before time runs out!"
                        className="w-full px-3.5 py-2 bg-gray-950 border border-gray-700 rounded-xl text-white font-medium focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <ImageUploader
                        label="Slide Background Image (স্লাইডের ব্যাকগ্রাউন্ড ছবি)"
                        value={currentSlides[selectedSlideIndex]?.bgImage || ''}
                        onChange={(url) => handleUpdateCurrentSlide('bgImage', url)}
                        helpText="এই স্লাইডের ব্যাকগ্রাউন্ডে ছবি দেখানোর জন্য ইমেজ আপলোড করুন বা লিংক দিন। ডার্ক ওভারলে স্বয়ংক্রিয়ভাবে টেক্সটের সুস্পষ্টতা নিশ্চিত করবে।"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Featured Products Section */}
          <div className="bg-gray-800/80 rounded-3xl border border-gray-700/80 p-6 sm:p-7 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-700 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-rose-400" />
                  <span>4. Featured Products Section (ফিচার্ড প্রোডাক্টস সেকশন)</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  হোমপেজের Featured Products সেকশনটি অন অথবা অফ রাখুন এবং সেকশনের টাইটেল পরিবর্তন করুন
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-900 px-3.5 py-1.5 rounded-xl border border-gray-700 hover:border-gray-600 text-xs transition">
                  <input
                    type="checkbox"
                    checked={form.showFeaturedProducts !== false}
                    onChange={(e) => setForm({ ...form, showFeaturedProducts: e.target.checked })}
                    className="accent-rose-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="font-bold text-gray-200">
                    {form.showFeaturedProducts !== false ? 'Section ON' : 'Section OFF'}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleSaveFeaturedOnly}
                  disabled={isSavingFeatured || isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs transition shadow-md active:scale-95 disabled:opacity-50"
                  title="Save only featured products section"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingFeatured ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Section Main Heading</label>
                <input
                  type="text"
                  value={form.featuredProductsTitle || ''}
                  onChange={(e) => setForm({ ...form, featuredProductsTitle: e.target.value })}
                  placeholder="Featured Products"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-rose-400 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Default: Featured Products</p>
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase mb-1.5">Section Subtitle</label>
                <input
                  type="text"
                  value={form.featuredProductsSubtitle || ''}
                  onChange={(e) => setForm({ ...form, featuredProductsSubtitle: e.target.value })}
                  placeholder="Top-rated selections for home, fashion, and tech"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-medium focus:border-rose-400 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Default: Top-rated selections for home, fashion, and tech</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
              form.showFeaturedProducts !== false
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                : 'bg-gray-900/60 border-dashed border-gray-700 text-gray-400'
            }`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${form.showFeaturedProducts !== false ? 'text-emerald-400' : 'text-gray-500'}`} />
              <div>
                <p className="font-bold text-white">
                  {form.showFeaturedProducts !== false
                    ? 'Featured Products Section is ENABLED'
                    : 'Featured Products Section is DISABLED'}
                </p>
                <p className="text-[11px] mt-0.5 text-gray-300">
                  {form.showFeaturedProducts !== false
                    ? 'হোমপেজে শুধুমাত্র নিচে সিলেক্ট করা ফিচার্ড প্রোডাক্টগুলোই প্রদর্শিত হবে।'
                    : 'এই সেকশনটি বন্ধ রাখলে হোমপেজ থেকে সম্পূর্ণ Featured Products সেকশন সম্পূর্ণরূপে লুকানো থাকবে।'}
                </p>
              </div>
            </div>

            {/* Featured Products Manager with Product Search by Title & SKU */}
            <div className="bg-gray-900/90 border border-rose-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                      Select & Add Featured Products (ফিচার্ড প্রোডাক্ট নির্বাচন)
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      টাইটেল বা SKU দিয়ে সার্চ করে প্রোডাক্ট অ্যাড করুন (হোমপেজে শুধুমাত্র এগুলোই শো করবে)
                    </p>
                  </div>
                </div>
                <span className="text-[11px] bg-rose-950 text-rose-300 font-bold px-3 py-1 rounded-full border border-rose-800/80 self-start sm:self-auto">
                  {featuredProductsList.length} Active Featured Products
                </span>
              </div>

              {/* Product Search Bar (by Title or SKU) */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wide">
                  Search Product by Title or SKU (টাইটেল বা SKU দিয়ে সার্চ করুন)
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={featuredSearch}
                    onChange={(e) => setFeaturedSearch(e.target.value)}
                    placeholder="Type Product Title or SKU (e.g. KT-..., Cotton Shirt, Watch)..."
                    className="w-full pl-10 pr-24 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 font-medium focus:border-rose-400 focus:outline-none"
                  />
                  {featuredSearch && (
                    <button
                      type="button"
                      onClick={() => setFeaturedSearch('')}
                      className="absolute right-20 text-gray-400 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition active:scale-95 flex items-center gap-1"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                </div>

                {/* Instant Search Results Dropdown/List */}
                {featuredSearch.trim().length > 0 && (
                  <div className="bg-gray-950 border border-rose-500/40 rounded-xl p-2.5 max-h-64 overflow-y-auto space-y-2 shadow-2xl divide-y divide-gray-800">
                    {searchedProductsForFeatured.length === 0 ? (
                      <div className="py-4 text-center text-xs text-gray-400">
                        "{featuredSearch}" দিয়ে টাইটেল বা SKU-তে কোনো প্রোডাক্ট খুঁজে পাওয়া যায়নি।
                      </div>
                    ) : (
                      searchedProductsForFeatured.map((p) => {
                        const isFeatured = Boolean(p.is_featured);
                        return (
                          <div
                            key={p.id}
                            className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-2 hover:bg-gray-900 rounded-xl transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-lg bg-gray-800 overflow-hidden shrink-0 border border-gray-700">
                                {p.images && p.images[0] ? (
                                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 text-gray-500 m-auto mt-3" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-mono font-bold bg-gray-800 text-rose-300 px-1.5 py-0.5 rounded border border-gray-700">
                                    SKU: {p.sku || 'KT-' + p.id.slice(0, 6).toUpperCase()}
                                  </span>
                                  <span className="text-[11px] text-emerald-400 font-bold">
                                    ৳{p.discount_price || p.price}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isFeatured ? (
                              <button
                                type="button"
                                disabled={isTogglingFeatured === p.id}
                                onClick={() => handleToggleProductFeatured(p, false)}
                                className="shrink-0 px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/80 font-bold rounded-lg text-xs transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Featured (Remove)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isTogglingFeatured === p.id}
                                onClick={() => handleToggleProductFeatured(p, true)}
                                className="shrink-0 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs shadow transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Add to Featured</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Or Quick Select from catalog */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Or Pick Directly from Store Catalog
                </label>
                <select
                  onChange={(e) => {
                    const prod = catalogProducts.find((p) => p.id === e.target.value);
                    if (prod) {
                      handleToggleProductFeatured(prod, true);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="w-full px-4 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white font-medium focus:border-rose-400 focus:outline-none"
                >
                  <option value="" disabled>-- Select a product to add to Featured List --</option>
                  {catalogProducts
                    .filter((p) => !p.is_featured)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} [SKU: {p.sku || ('KT-' + p.id.slice(0, 6).toUpperCase())}] — ৳{p.discount_price || p.price}
                      </option>
                    ))}
                </select>
              </div>

              {/* Currently Featured Products List */}
              <div className="pt-3 border-t border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide flex items-center gap-1.5">
                    <span>Currently Active Featured Products</span>
                    <span className="px-2 py-0.5 bg-rose-900/60 text-rose-300 rounded-full text-[10px] font-bold">
                      {featuredProductsList.length}
                    </span>
                  </h4>
                </div>

                {featuredProductsList.length === 0 ? (
                  <div className="bg-gray-950/60 border border-dashed border-gray-800 rounded-2xl p-6 text-center space-y-2">
                    <ShoppingBag className="w-8 h-8 text-gray-600 mx-auto" />
                    <p className="text-xs font-bold text-gray-300">কোনো প্রোডাক্ট Featured লিস্টে নেই</p>
                    <p className="text-[11px] text-gray-500 max-w-md mx-auto">
                      উপরের সার্চ বক্স বা ড্রপডাউন থেকে প্রোডাক্ট অ্যাড করুন। আপনি এখানে যে প্রোডাক্টগুলো সিলেক্ট করবেন, হোমপেজে শুধুমাত্র সেগুলোই Featured Products হিসেবে দেখাবে।
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                    {featuredProductsList.map((p) => (
                      <div
                        key={p.id}
                        className="bg-gray-950 border border-gray-800 hover:border-gray-700 rounded-xl p-3 flex items-center justify-between gap-2.5 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden shrink-0 border border-gray-700">
                            {p.images && p.images[0] ? (
                              <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-gray-500 m-auto mt-2.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate" title={p.title}>
                              {p.title}
                            </h5>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-mono font-bold bg-gray-800 text-rose-300 px-1 py-0.5 rounded border border-gray-700">
                                {p.sku || 'KT-' + p.id.slice(0, 6).toUpperCase()}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-bold">
                                ৳{p.discount_price || p.price}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isTogglingFeatured === p.id}
                          onClick={() => handleToggleProductFeatured(p, false)}
                          className="shrink-0 p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                          title="Remove from featured"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Real-time Live Visual Preview Studio */}
        <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 space-y-6 lg:sticky lg:top-14">
          
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
                <span className={
                  form.showFlashSale && (!form.flashSaleEndsAt || new Date(form.flashSaleEndsAt).getTime() > Date.now())
                    ? 'text-emerald-400'
                    : form.showFlashSale
                    ? 'text-amber-400'
                    : 'text-gray-500'
                }>
                  {form.showFlashSale && (!form.flashSaleEndsAt || new Date(form.flashSaleEndsAt).getTime() > Date.now())
                    ? '● Visible (Active)'
                    : form.showFlashSale
                    ? '○ Expired (Auto-Off)'
                    : '○ Hidden'}
                </span>
              </div>

              {form.showFlashSale ? (
                <div className="relative">
                  {form.flashSaleEndsAt && new Date(form.flashSaleEndsAt).getTime() <= Date.now() && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] rounded-2xl flex items-center justify-center text-center p-3 z-30">
                      <div className="bg-rose-950/90 border border-rose-500/50 rounded-xl p-2.5 space-y-1">
                        <p className="text-xs font-bold text-rose-300">Countdown Expired</p>
                        <p className="text-[10px] text-gray-300">Auto-hidden from storefront visitors</p>
                      </div>
                    </div>
                  )}
                  <FlashSaleBanner
                    slides={currentSlides}
                    defaultTag={form.flashSaleTag}
                    defaultTitle={form.flashSaleTitle}
                    defaultSubtitle={form.flashSaleSubtitle}
                    defaultBgImage={form.flashSaleBgImage}
                    theme={form.flashSaleTheme}
                    timeLeft={{ hours: form.flashSaleHours || 4, minutes: 0, seconds: 0 }}
                    isMobile={true}
                  />
                </div>
              ) : (
                <div className="bg-gray-900/60 border border-dashed border-gray-700 text-gray-500 text-xs py-2 px-3 rounded-xl text-center">
                  Flash Sale Banner is turned OFF
                </div>
              )}
            </div>

            {/* 5. Live Featured Products Preview */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase">
                <span>Featured Products Section</span>
                <span className={form.showFeaturedProducts !== false ? 'text-emerald-400' : 'text-gray-500'}>
                  {form.showFeaturedProducts !== false ? '● Visible' : '○ Hidden'}
                </span>
              </div>

              {form.showFeaturedProducts !== false ? (
                <div className="bg-gray-900 border border-gray-700/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <div>
                      <h5 className="text-xs font-black text-white">
                        {form.featuredProductsTitle || 'Featured Products'}
                      </h5>
                      <p className="text-[10px] text-gray-400">
                        {form.featuredProductsSubtitle || 'Top-rated selections for home, fashion, and tech'}
                      </p>
                    </div>
                    <span className="text-[9px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      View All
                    </span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto text-[9px] font-bold text-gray-400">
                    <span className="bg-white text-gray-950 px-2 py-0.5 rounded-md">All Items</span>
                    <span className="bg-gray-800 px-2 py-0.5 rounded-md border border-gray-700">Groceries</span>
                    <span className="bg-gray-800 px-2 py-0.5 rounded-md border border-gray-700">Fashion</span>
                    <span className="bg-gray-800 px-2 py-0.5 rounded-md border border-gray-700">Tech</span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900/60 border border-dashed border-gray-700 text-gray-500 text-xs py-2 px-3 rounded-xl text-center">
                  Featured Products Section is turned OFF
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

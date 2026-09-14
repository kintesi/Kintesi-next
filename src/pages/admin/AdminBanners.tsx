import React, { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  Check,
  CheckCircle2,
  Eye,
  Flame,
  Megaphone,
  Package,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { useSettings, BannerSettings, DEFAULT_BANNERS, FlashSaleSlide, cleanAnnouncementText } from '../../contexts/SettingsContext';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { ImageUploader } from '../../components/common/ImageUploader';
import { Product } from '../../types';
import { getProductsFromDB, saveProductToDB } from '../../lib/dbService';

const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string }> = ({ checked, onChange, label }) => {
  const { isLight } = useAdminTheme();
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only peer"
      />
      <span
        className={`admin-toggle-track relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
          checked
            ? 'bg-rose-600 border-rose-600 shadow-xs'
            : isLight
            ? 'bg-slate-300 border-slate-400'
            : 'bg-gray-800 border-gray-600'
        }`}
        style={
          checked
            ? { backgroundColor: '#e11d48', borderColor: '#e11d48' }
            : isLight
            ? { backgroundColor: '#cbd5e1', borderColor: '#94a3b8' }
            : { backgroundColor: '#334155', borderColor: '#475569' }
        }
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out border border-slate-200/60 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
          style={{ backgroundColor: '#ffffff' }}
        />
      </span>
      <span
        className="text-xs font-black select-none"
        style={isLight ? { color: '#0f172a' } : { color: '#f8fafc' }}
      >
        {label}
      </span>
    </label>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, hint, children }) => (
  <label className="block space-y-1.5">
    <span className="flex items-center justify-between gap-3 text-[11px] font-black uppercase tracking-wide text-slate-700 dark:text-slate-300">
      {label}
      {hint && <span className="normal-case tracking-normal font-medium text-slate-400">{hint}</span>}
    </span>
    {children}
  </label>
);

export const AdminBanners: React.FC = () => {
  const { settings, updateBanners, isLoading } = useSettings();
  const { isLight } = useAdminTheme();
  const [form, setForm] = useState<BannerSettings>(settings.banners);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [spotlightSearch, setSpotlightSearch] = useState('');
  const [featuredSearch, setFeaturedSearch] = useState('');
  const [flashSlideSearch, setFlashSlideSearch] = useState('');
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const hasUserEdited = useRef(false);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setCatalogProducts(await getProductsFromDB());
      } catch (error) {
        console.warn('Could not load product catalog:', error);
      }
    };
    loadCatalog();
    window.addEventListener('kintesi_products_updated', loadCatalog);
    return () => window.removeEventListener('kintesi_products_updated', loadCatalog);
  }, []);

  useEffect(() => {
    if (!hasUserEdited.current) {
      setForm({ ...settings.banners, topAnnouncementText: cleanAnnouncementText(settings.banners.topAnnouncementText || '') });
    }
  }, [settings.banners]);

  const slides: FlashSaleSlide[] = form.flashSaleSlides?.length
    ? form.flashSaleSlides
    : [{
        id: 'slide-1',
        tag: form.flashSaleTag || '⚡ FLASH SALE',
        title: form.flashSaleTitle || 'Exclusive 24-Hour Super Deals',
        subtitle: form.flashSaleSubtitle || 'Limited stock flash offers with up to 50% discount.',
        bgImage: form.flashSaleBgImage || '',
      }];
  const currentSlide = slides[Math.min(selectedSlideIndex, slides.length - 1)];

  const matchedSpotlightProducts = useMemo(() => {
    const query = spotlightSearch.trim().toLowerCase();
    if (!query) return [];
    return catalogProducts.filter((product) => [product.title, product.sku, product.brand].some((value) => value?.toLowerCase().includes(query))).slice(0, 6);
  }, [catalogProducts, spotlightSearch]);

  const matchedFeaturedProducts = useMemo(() => {
    const query = featuredSearch.trim().toLowerCase();
    if (!query) return [];
    return catalogProducts.filter((product) => [product.title, product.sku, product.brand].some((value) => value?.toLowerCase().includes(query))).slice(0, 8);
  }, [catalogProducts, featuredSearch]);

  const matchedFlashSlideProducts = useMemo(() => {
    const query = flashSlideSearch.trim().toLowerCase();
    if (!query) return [];
    return catalogProducts
      .filter((product) =>
        [product.title, product.sku, product.brand].some((value) =>
          value?.toLowerCase().includes(query)
        )
      )
      .slice(0, 6);
  }, [catalogProducts, flashSlideSearch]);

  const selectFlashSlideProduct = (product: Product) => {
    const defaultProductImage =
      (product.images && product.images.length > 0 ? product.images[0] : '') ||
      (product as any).image ||
      '';

    const nextSlides = slides.map((slide, index) => {
      if (index !== selectedSlideIndex) return slide;
      return {
        ...slide,
        title: product.title,
        bgImage: defaultProductImage,
        link: `/product/${product.id}`,
        productId: product.id,
      };
    });
    setForm((previous) => ({
      ...previous,
      flashSaleSlides: nextSlides,
      ...(selectedSlideIndex === 0 ? {
        flashSaleTitle: nextSlides[0].title,
        flashSaleBgImage: nextSlides[0].bgImage,
        flashSaleLink: nextSlides[0].link,
      } : {}),
    }));
    setFlashSlideSearch('');
    toast.success(`"${product.title}" selected! Product's default image applied automatically.`);
  };

  const featuredProducts = catalogProducts.filter((product) => product.is_featured);

  const setValue = <K extends keyof BannerSettings>(key: K, value: BannerSettings[K]) => {
    hasUserEdited.current = true;
    setIsSaved(false);
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const selectSpotlightProduct = (product: Product) => {
    hasUserEdited.current = true;
    setIsSaved(false);
    const price = Number(product.price) || 0;
    const discountPrice = Number(product.discount_price) || Math.round(price * 0.85);
    setForm((previous) => ({
      ...previous,
      showSpotlight: true,
      spotlightTitle: product.title,
      spotlightBrand: product.brand || 'Kintesi Exclusive',
      spotlightImage: product.images?.[0] || '',
      spotlightPrice: price,
      spotlightDiscountPrice: discountPrice,
      spotlightStockText: product.stock ? `${product.stock} left in stock` : 'Limited stock',
      spotlightSavingsText: price > discountPrice ? `Save ৳${price - discountPrice}` : 'Special deal',
      spotlightBadge: 'Deal of the day',
      spotlightBtnLink: `/product/${product.id}`,
    }));
    setSpotlightSearch('');
    toast.success('Spotlight details filled from the selected product.');
  };

  const toggleFeaturedProduct = async (product: Product, isFeatured: boolean) => {
    setIsUpdatingProduct(product.id);
    const nextProduct = { ...product, is_featured: isFeatured };
    setCatalogProducts((previous) => previous.map((item) => item.id === product.id ? nextProduct : item));
    try {
      await saveProductToDB(nextProduct);
      toast.success(isFeatured ? 'Product added to Featured Products.' : 'Product removed from Featured Products.');
    } catch (error) {
      setCatalogProducts((previous) => previous.map((item) => item.id === product.id ? product : item));
      toast.error('Could not update the product. Please try again.');
    } finally {
      setIsUpdatingProduct(null);
    }
  };

  const updateSlide = (key: keyof FlashSaleSlide, value: string) => {
    hasUserEdited.current = true;
    setIsSaved(false);
    const nextSlides = slides.map((slide, index) => index === selectedSlideIndex ? { ...slide, [key]: value } : slide);
    setForm((previous) => ({
      ...previous,
      flashSaleSlides: nextSlides,
      ...(selectedSlideIndex === 0 ? {
        flashSaleTag: key === 'tag' ? value : previous.flashSaleTag,
        flashSaleTitle: key === 'title' ? value : previous.flashSaleTitle,
        flashSaleSubtitle: key === 'subtitle' ? value : previous.flashSaleSubtitle,
        flashSaleBgImage: key === 'bgImage' ? value : previous.flashSaleBgImage,
        flashSaleLink: key === 'link' ? value : previous.flashSaleLink,
      } : {}),
    }));
  };

  const addSlide = () => {
    hasUserEdited.current = true;
    setIsSaved(false);
    const nextSlides = [...slides, {
      id: `slide-${Date.now()}`,
      tag: '⚡ FLASH SALE',
      title: 'New Flash Deal',
      subtitle: 'Add a short, clear offer description.',
      bgImage: '',
      link: '/products',
    }];
    setForm((previous) => ({ ...previous, flashSaleSlides: nextSlides }));
    setSelectedSlideIndex(nextSlides.length - 1);
  };

  const removeSlide = () => {
    if (slides.length === 1) {
      toast.error('A flash sale needs at least one slide.');
      return;
    }
    hasUserEdited.current = true;
    setIsSaved(false);
    const nextSlides = slides.filter((_, index) => index !== selectedSlideIndex);
    setForm((previous) => ({ ...previous, flashSaleSlides: nextSlides }));
    setSelectedSlideIndex(Math.max(0, selectedSlideIndex - 1));
  };

  const resetFlashTimer = () => {
    hasUserEdited.current = true;
    setIsSaved(false);
    const hours = Math.max(1, Math.min(72, Number(form.flashSaleHours) || 4));
    setForm((previous) => ({ ...previous, showFlashSale: true, flashSaleHours: hours, flashSaleEndsAt: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() }));
    toast.info(`Timer reset to ${hours} hours. Click Save to publish.`);
  };

  const saveAll = async () => {
    hasUserEdited.current = false;
    const hours = Math.max(1, Math.min(72, Number(form.flashSaleHours) || 4));
    const expiresAt = form.showFlashSale && (!form.flashSaleEndsAt || new Date(form.flashSaleEndsAt).getTime() <= Date.now())
      ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
      : form.flashSaleEndsAt;
    const nextForm = {
      ...form,
      topAnnouncementText: cleanAnnouncementText(form.topAnnouncementText),
      flashSaleHours: hours,
      flashSaleEndsAt: expiresAt,
      flashSaleSlides: slides,
      flashSaleTag: slides[0]?.tag || form.flashSaleTag,
      flashSaleTitle: slides[0]?.title || form.flashSaleTitle,
      flashSaleSubtitle: slides[0]?.subtitle || form.flashSaleSubtitle,
      flashSaleBgImage: slides[0]?.bgImage || form.flashSaleBgImage,
      flashSaleLink: slides[0]?.link || form.flashSaleLink || '/products',
    };
    setForm(nextForm);
    setIsSaved(true);
    await updateBanners(nextForm);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const resetAll = () => {
    if (!window.confirm('Restore all homepage content to the default settings?')) return;
    setForm(DEFAULT_BANNERS);
    setSelectedSlideIndex(0);
    toast.info('Defaults restored locally. Save changes to publish them.');
  };

  const card = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-gray-900 border-gray-800';
  const input = `rounded-xl transition-all duration-150 outline-none ${
    isLight
      ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10'
      : 'bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
  }`;

  const sections = [
    { label: 'Announcement', enabled: form.showTopAnnouncement !== false },
    { label: 'Hero', enabled: form.showHeroSection !== false },
    { label: 'Spotlight', enabled: Boolean(form.showSpotlight) },
    { label: 'Flash sale', enabled: Boolean(form.showFlashSale) },
    { label: 'Featured', enabled: form.showFeaturedProducts !== false },
  ];

  return (
    <div className="banner-studio w-full max-w-[1500px] mx-auto space-y-6 pb-20 text-slate-900">
      <header className={`rounded-3xl border p-5 sm:p-7 ${card} flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] font-black text-rose-600">Homepage content</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight">Hero & Flash Banners</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-500">Manage only the homepage sections your customers see. Changes stay as drafts until you save.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetAll}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isLight ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700' : 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            type="button"
            onClick={saveAll}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-black shadow-lg transition active:scale-95 cursor-pointer ${
              isSaved
                ? 'bg-slate-900 shadow-slate-900/20'
                : 'bg-rose-600 shadow-rose-600/25 hover:bg-rose-700'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-rose-400" />
                <span>Saved Changes!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {sections.map((section) => (
          <div key={section.label} className={`rounded-xl border px-3 py-2.5 ${card} flex items-center gap-2`}>
            <span className={`w-2 h-2 rounded-full ${section.enabled ? 'bg-rose-500' : 'bg-slate-300'}`} />
            <span className="text-[11px] font-bold truncate">{section.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-5">
          <section className={`rounded-2xl border p-5 sm:p-6 ${card}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><Megaphone className="w-4 h-4" /></div>
                <div><h2 className="font-black">Announcement bar</h2><p className="text-xs text-slate-500">A short message above the storefront navigation.</p></div>
              </div>
              <Toggle checked={form.showTopAnnouncement !== false} onChange={(value) => setValue('showTopAnnouncement', value)} label={form.showTopAnnouncement !== false ? 'Visible' : 'Hidden'} />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Announcement message" hint="Use **text** for emphasis">
                <input value={form.topAnnouncementText || ''} onChange={(event) => setValue('topAnnouncementText', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} placeholder="e.g. Free delivery on orders over ৳2,000" />
              </Field>
              <Toggle checked={Boolean(form.isCustomAnnouncement)} onChange={(value) => setValue('isCustomAnnouncement', value)} label="Custom message" />
            </div>
          </section>

          <section className={`rounded-2xl border p-5 sm:p-6 ${card}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
                <div><h2 className="font-black">Hero section</h2><p className="text-xs text-slate-500">Main heading and two customer-facing actions.</p></div>
              </div>
              <Toggle checked={form.showHeroSection !== false} onChange={(value) => setValue('showHeroSection', value)} label={form.showHeroSection !== false ? 'Visible' : 'Hidden'} />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Badge"><input value={form.heroBadge || ''} onChange={(event) => setValue('heroBadge', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
              <Field label="Highlighted words"><input value={form.heroHighlightText || ''} onChange={(event) => setValue('heroHighlightText', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
              <Field label="Heading"><input value={form.heroTitle || ''} onChange={(event) => setValue('heroTitle', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
              <Field label="Description"><textarea rows={2} value={form.heroSubtitle || ''} onChange={(event) => setValue('heroSubtitle', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm resize-y ${input}`} /></Field>
              <Field label="Primary button"><input value={form.heroPrimaryBtnText || ''} onChange={(event) => setValue('heroPrimaryBtnText', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
              <Field label="Primary link"><input value={form.heroPrimaryBtnLink || ''} onChange={(event) => setValue('heroPrimaryBtnLink', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
              <Field label="Secondary button"><input value={form.heroSecondaryBtnText || ''} onChange={(event) => setValue('heroSecondaryBtnText', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
              <Field label="Secondary link"><input value={form.heroSecondaryBtnLink || ''} onChange={(event) => setValue('heroSecondaryBtnLink', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
            </div>
          </section>

          <section className={`rounded-2xl border p-5 sm:p-6 ${card}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><Zap className="w-4 h-4" /></div>
                <div><h2 className="font-black">Hero spotlight</h2><p className="text-xs text-slate-500">Optional product card displayed beside the hero.</p></div>
              </div>
              <Toggle checked={Boolean(form.showSpotlight)} onChange={(value) => setValue('showSpotlight', value)} label={form.showSpotlight ? 'Visible' : 'Hidden'} />
            </div>
            <div className="mt-5">
              <Field label="Pick from catalog" hint="Search fills the details below">
                <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={spotlightSearch} onChange={(event) => setSpotlightSearch(event.target.value)} className={`w-full pl-10 pr-3.5 py-2.5 border text-sm ${input}`} placeholder="Search product name, brand, or SKU" /></div>
              </Field>
              {matchedSpotlightProducts.length > 0 && <div className="mt-2 rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">{matchedSpotlightProducts.map((product) => <button key={product.id} type="button" onClick={() => selectSpotlightProduct(product)} className="w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-4 hover:bg-rose-50"><span className="min-w-0"><span className="block text-xs font-bold truncate">{product.title}</span><span className="text-[11px] text-slate-500">{product.brand || product.sku || 'Catalog product'}</span></span><span className="text-xs font-bold text-rose-600">Use</span></button>)}</div>}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Title"><input value={form.spotlightTitle || ''} onChange={(event) => setValue('spotlightTitle', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
              <Field label="Brand"><input value={form.spotlightBrand || ''} onChange={(event) => setValue('spotlightBrand', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
              <Field label="Badge"><input value={form.spotlightBadge || ''} onChange={(event) => setValue('spotlightBadge', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
              <Field label="Product link"><input value={form.spotlightBtnLink || ''} onChange={(event) => setValue('spotlightBtnLink', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
              <Field label="Original price"><input type="number" min="0" value={form.spotlightPrice || ''} onChange={(event) => setValue('spotlightPrice', Number(event.target.value))} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
              <Field label="Sale price"><input type="number" min="0" value={form.spotlightDiscountPrice || ''} onChange={(event) => setValue('spotlightDiscountPrice', Number(event.target.value))} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
              <Field label="Stock label"><input value={form.spotlightStockText || ''} onChange={(event) => setValue('spotlightStockText', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
              <Field label="Saving label"><input value={form.spotlightSavingsText || ''} onChange={(event) => setValue('spotlightSavingsText', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
              <div className="sm:col-span-2"><ImageUploader label="Spotlight product image" value={form.spotlightImage || ''} onChange={(value) => setValue('spotlightImage', value)} helpText="Shown on the product card beside the homepage hero." /></div>
            </div>
          </section>

          <section className={`rounded-2xl border p-5 sm:p-6 ${card}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><Flame className="w-4 h-4" /></div><div><h2 className="font-black">Flash sale</h2><p className="text-xs text-slate-500">Countdown banner and promotional slides.</p></div></div>
              <Toggle checked={Boolean(form.showFlashSale)} onChange={(value) => setValue('showFlashSale', value)} label={form.showFlashSale ? 'Visible' : 'Hidden'} />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-[160px_1fr_auto] sm:items-end">
              <Field label="Countdown hours"><input type="number" min="1" max="72" value={form.flashSaleHours || ''} onChange={(event) => setValue('flashSaleHours', Number(event.target.value))} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field>
              <Field label="Theme">
                <select
                  value={form.flashSaleTheme || 'sunset'}
                  onChange={(event) => setValue('flashSaleTheme', event.target.value as BannerSettings['flashSaleTheme'])}
                  className={`w-full px-3.5 py-2.5 border text-sm ${input}`}
                >
                  <option value="sunset">🌅 Sunset Radish (Signature Rose & Ruby)</option>
                  <option value="emerald">🌲 Emerald Luxe (Deep Forest & Teal)</option>
                  <option value="cyber">⚡ Cyber Neon (Electric Violet & Cyan)</option>
                  <option value="dark">🌑 Midnight Onyx (Obsidian & Silver)</option>
                  <option value="crimson">💎 Ruby Crimson (Vivid Crimson & Fire Red)</option>
                  <option value="gold">👑 Royal Gold (Imperial Amber & Gold)</option>
                  <option value="ocean">🌊 Deep Ocean (Sapphire & Royal Blue)</option>
                  <option value="aurora">🌌 Aurora Borealis (Mystic Teal & Magenta)</option>
                  <option value="cherry">🌸 Cherry Blossom (Neon Fuchsia & Pink)</option>
                  <option value="solar">☀️ Solar Flare (Fiery Orange & Flame)</option>
                </select>
              </Field>
              <button type="button" onClick={resetFlashTimer} className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold hover:bg-rose-50">Restart timer</button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-500 mr-1">Slides</span>
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setSelectedSlideIndex(index)}
                  className={`h-8 min-w-8 rounded-lg px-2.5 text-xs font-bold border ${index === selectedSlideIndex ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300'}`}
                >
                  {index + 1}
                </button>
              ))}
              <button type="button" onClick={addSlide} className="h-8 px-2.5 rounded-lg border border-dashed border-rose-300 text-rose-600 text-xs font-bold hover:bg-rose-50">
                <Plus className="w-3.5 h-3.5 inline mr-1" />Add slide
              </button>
              {slides.length > 1 && (
                <button type="button" onClick={removeSlide} className="h-8 px-2.5 rounded-lg text-rose-600 text-xs font-bold hover:bg-rose-50">
                  <Trash2 className="w-3.5 h-3.5 inline mr-1" />Remove
                </button>
              )}
            </div>

            {/* Catalog product search for linking this slide */}
            <div className="mt-4">
              <Field label="Link a product to this slide" hint="Search catalog to link slide directly to a product">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={flashSlideSearch}
                    onChange={(event) => setFlashSlideSearch(event.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2.5 border text-sm ${input}`}
                    placeholder="Search product by name, brand, or SKU to link..."
                  />
                </div>
              </Field>
              {matchedFlashSlideProducts.length > 0 && (
                <div className="mt-2 rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden bg-white shadow-sm">
                  {matchedFlashSlideProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => selectFlashSlideProduct(product)}
                      className="w-full px-3.5 py-2 text-left flex items-center justify-between gap-3 hover:bg-rose-50 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-[10px] text-slate-400 font-bold">
                            No img
                          </div>
                        )}
                        <span className="min-w-0">
                          <span className="block text-xs font-bold truncate text-slate-800">{product.title}</span>
                          <span className="text-[11px] text-slate-500">
                            ৳{product.price} {product.sku ? `• SKU: ${product.sku}` : ''}
                          </span>
                        </span>
                      </div>
                      <span className="text-xs font-bold text-rose-600 shrink-0">Use Product</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Slide tag">
                <input value={currentSlide.tag || ''} onChange={(event) => updateSlide('tag', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} />
              </Field>
              <Field label="Slide title">
                <input value={currentSlide.title} onChange={(event) => updateSlide('title', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} />
              </Field>
              <Field label="Click destination link" hint="Where clicking this slide takes customers">
                <input
                  value={currentSlide.link || ''}
                  onChange={(event) => updateSlide('link', event.target.value)}
                  className={`w-full px-3.5 py-2.5 border text-sm ${input}`}
                  placeholder="e.g. /product/abc-123 or /products"
                />
              </Field>
              <Field label="Slide description">
                <textarea rows={2} value={currentSlide.subtitle || ''} onChange={(event) => updateSlide('subtitle', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm resize-y ${input}`} />
              </Field>
              {currentSlide.link && (
                <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-900 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {currentSlide.bgImage ? (
                      <img
                        src={currentSlide.bgImage}
                        alt="Product Default"
                        className="w-11 h-11 rounded-lg object-cover border border-rose-200 shrink-0 bg-white shadow-2xs"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-[10px] font-bold text-rose-500">
                        IMG
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 truncate">
                        {currentSlide.title || 'Linked Product'}
                      </p>
                      <p className="text-[11px] text-rose-700 truncate font-medium">
                        ✓ Using product's default image • {currentSlide.link}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateSlide('link', '');
                      updateSlide('bgImage', '');
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 transition shrink-0"
                  >
                    Unlink
                  </button>
                </div>
              )}
              <div className="sm:col-span-2">
                <ImageUploader label="Custom banner image override (Optional)" value={currentSlide.bgImage || ''} onChange={(value) => updateSlide('bgImage', value)} helpText="Default product image is automatically used. Upload only if you want a custom wide banner graphic." />
              </div>
            </div>
          </section>

          <section className={`rounded-2xl border p-5 sm:p-6 ${card}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><Package className="w-4 h-4" /></div><div><h2 className="font-black">Featured products</h2><p className="text-xs text-slate-500">Heading and products in the homepage featured grid.</p></div></div><Toggle checked={form.showFeaturedProducts !== false} onChange={(value) => setValue('showFeaturedProducts', value)} label={form.showFeaturedProducts !== false ? 'Visible' : 'Hidden'} /></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Section heading"><input value={form.featuredProductsTitle || ''} onChange={(event) => setValue('featuredProductsTitle', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field><Field label="Section description"><input value={form.featuredProductsSubtitle || ''} onChange={(event) => setValue('featuredProductsSubtitle', event.target.value)} className={`w-full px-3.5 py-2.5 border text-sm ${input}`} /></Field></div>
            <div className="mt-5"><Field label="Add or remove products" hint={`${featuredProducts.length} featured`}><div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={featuredSearch} onChange={(event) => setFeaturedSearch(event.target.value)} className={`w-full pl-10 pr-3.5 py-2.5 border text-sm ${input}`} placeholder="Search the catalog" /></div></Field>{matchedFeaturedProducts.length > 0 && <div className="mt-2 grid gap-2 sm:grid-cols-2">{matchedFeaturedProducts.map((product) => <button key={product.id} disabled={isUpdatingProduct === product.id} onClick={() => toggleFeaturedProduct(product, !product.is_featured)} className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left ${product.is_featured ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white hover:border-rose-200'}`}><span className="min-w-0"><span className="block truncate text-xs font-bold">{product.title}</span><span className="text-[11px] text-slate-500">{product.is_featured ? 'Featured' : 'Not featured'}</span></span>{product.is_featured ? <Check className="w-4 h-4 text-rose-600" /> : <Plus className="w-4 h-4 text-slate-400" />}</button>)}</div>}</div>
          </section>
        </div>

        <aside className={`xl:sticky xl:top-20 rounded-2xl border p-5 ${card}`}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><Eye className="w-4 h-4" /></div><div><h2 className="font-black">Live overview</h2><p className="text-xs text-slate-500">What is currently enabled.</p></div></div>
          <div className="mt-4 space-y-3">
            {sections.map((section) => <div key={section.label} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"><span className="text-xs font-bold">{section.label}</span><span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${section.enabled ? 'text-rose-600' : 'text-slate-400'}`}><span className={`w-1.5 h-1.5 rounded-full ${section.enabled ? 'bg-rose-500' : 'bg-slate-300'}`} />{section.enabled ? 'Visible' : 'Hidden'}</span></div>)}
          </div>
          <div className="mt-5 rounded-xl bg-rose-50 border border-rose-100 p-3.5"><p className="text-xs font-bold text-rose-900">Publish checklist</p><ul className="mt-2 space-y-1.5 text-[11px] text-rose-800"><li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" />Use short, customer-facing messages.</li><li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" />Check product links before saving.</li><li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" />Upload wide images for flash sale slides.</li></ul></div>
          <button
            type="button"
            onClick={saveAll}
            disabled={isLoading}
            className={`mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-xs font-black shadow-lg transition active:scale-95 cursor-pointer ${
              isSaved
                ? 'bg-slate-900 shadow-slate-900/20'
                : 'bg-rose-600 shadow-rose-600/25 hover:bg-rose-700'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4 text-rose-400" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'All Changes Saved!' : 'Save All Changes'}</span>
          </button>
        </aside>
      </div>

      {/* Floating Instant Save Bar (always accessible wherever you scroll) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center">
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/10'
            : 'bg-gray-900/95 border-gray-700 text-white shadow-black/40'
        }`}>
          <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-gray-700">
            <span className={`w-2 h-2 rounded-full ${isSaved ? 'bg-rose-600' : (hasUserEdited.current ? 'bg-amber-500 animate-pulse' : 'bg-rose-500')}`} />
            <span className="text-xs font-bold">
              {isSaved ? 'Saved to Store' : (hasUserEdited.current ? 'Unsaved Edits' : 'Live Sync')}
            </span>
          </div>

          <button
            type="button"
            onClick={saveAll}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition active:scale-95 shadow-md cursor-pointer ${
              isSaved
                ? 'bg-slate-900 text-rose-400 shadow-slate-900/20'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-rose-400" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

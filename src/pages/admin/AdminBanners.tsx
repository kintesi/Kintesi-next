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
  X,
  Star,
  Timer,
} from 'lucide-react';
import {
  useSettings,
  BannerSettings,
  DEFAULT_BANNERS,
  FlashSaleSlide,
  cleanAnnouncementText,
  ShowcaseSection,
  DEFAULT_SHOWCASES,
} from '../../contexts/SettingsContext';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { ImageUploader } from '../../components/common/ImageUploader';
import { Product } from '../../types';
import { getProductsFromDB, saveProductToDB } from '../../lib/dbService';
import { formatPrice } from '../../lib/utils';
import { deleteImagesFromCloudinary } from '../../lib/cloudinary';

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
        tag: form.flashSaleTag ?? '',
        title: form.flashSaleTitle ?? '',
        subtitle: form.flashSaleSubtitle ?? '',
        bgImage: form.flashSaleBgImage || '',
        desktopImage: form.flashSaleDesktopImage || form.flashSaleBgImage || '',
        mobileImage: form.flashSaleMobileImage || form.flashSaleBgImage || '',
        link: form.flashSaleLink || '',
        productIds: [],
        pageTitle: '',
        bannerType: form.flashSaleBannerType || 'clickable',
        layoutStyle: form.flashSaleLayoutStyle || 'full',
        showTimer: form.flashSaleShowTimer || false,
        hideText: form.flashSaleHideText || false,
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

  const currentSlideProductIds: string[] = useMemo(() => {
    if (!currentSlide) return [];
    if (Array.isArray(currentSlide.productIds)) {
      return currentSlide.productIds;
    }
    if (currentSlide.productId) {
      return [currentSlide.productId];
    }
    return [];
  }, [currentSlide]);

  const selectedSlideProducts = useMemo(() => {
    const idMap = new Map<string, Product>();
    for (const p of catalogProducts) {
      if (p?.id) idMap.set(String(p.id), p);
    }
    return currentSlideProductIds
      .map((id) => idMap.get(String(id)))
      .filter(Boolean) as Product[];
  }, [catalogProducts, currentSlideProductIds]);

  const matchedFlashSlideProducts = useMemo(() => {
    const query = flashSlideSearch.trim().toLowerCase();
    if (!query) return [];
    return catalogProducts
      .filter((product) =>
        [product.title, product.sku, product.brand].some((value) =>
          value?.toLowerCase().includes(query)
        )
      )
      .slice(0, 8);
  }, [catalogProducts, flashSlideSearch]);

  const addProductToSlide = (product: Product) => {
    const existingIds = currentSlideProductIds;
    if (existingIds.includes(product.id)) {
      toast.info(`"${product.title}" is already linked to this banner.`);
      return;
    }

    hasUserEdited.current = true;
    setIsSaved(false);

    const nextProductIds = [...existingIds, product.id];
    let autoLink = '';

    if (nextProductIds.length === 1) {
      autoLink = `/product/${product.id}`;
    } else {
      autoLink = `/showcase/banner-${currentSlide.id}`;
    }

    setForm((previous) => {
      const currentSlides = previous.flashSaleSlides?.length ? previous.flashSaleSlides : slides;
      const nextSlides = currentSlides.map((slide, index) => {
        if (index !== selectedSlideIndex) return slide;
        return {
          ...slide,
          link: autoLink,
          productId: nextProductIds.length === 1 ? nextProductIds[0] : undefined,
          productIds: nextProductIds,
          pageTitle: slide.pageTitle || (nextProductIds.length > 1 ? (slide.title || 'Flash Sale') : ''),
          // NOTE: Banner images are strictly manual! Never auto-selected.
        };
      });
      return {
        ...previous,
        flashSaleSlides: nextSlides,
        ...(selectedSlideIndex === 0 ? {
          flashSaleLink: nextSlides[0].link,
        } : {}),
      };
    });

    setFlashSlideSearch('');
    if (nextProductIds.length === 1) {
      toast.success(`"${product.title}" linked (Single Product).`);
    } else {
      toast.success(`"${product.title}" added (${nextProductIds.length} products).`);
    }
  };

  const removeProductFromSlide = (productId: string) => {
    hasUserEdited.current = true;
    setIsSaved(false);

    const nextProductIds = currentSlideProductIds.filter((id) => id !== productId);
    let autoLink = '';
    if (nextProductIds.length === 1) {
      autoLink = `/product/${nextProductIds[0]}`;
    } else if (nextProductIds.length > 1) {
      autoLink = `/showcase/banner-${currentSlide.id}`;
    } else {
      autoLink = '';
    }

    setForm((previous) => {
      const currentSlides = previous.flashSaleSlides?.length ? previous.flashSaleSlides : slides;
      const nextSlides = currentSlides.map((slide, index) => {
        if (index !== selectedSlideIndex) return slide;
        return {
          ...slide,
          link: autoLink,
          productId: nextProductIds.length === 1 ? nextProductIds[0] : undefined,
          productIds: nextProductIds,
        };
      });
      return {
        ...previous,
        flashSaleSlides: nextSlides,
        ...(selectedSlideIndex === 0 ? {
          flashSaleLink: nextSlides[0].link,
        } : {}),
      };
    });
    toast.success('Product unlinked from banner.');
  };

  const clearSlideProducts = () => {
    hasUserEdited.current = true;
    setIsSaved(false);
    updateSlideFields({
      productId: undefined,
      productIds: [],
      link: '',
    });
    toast.success('All linked products removed from banner.');
  };

  const featuredProducts = catalogProducts.filter((product) => product.is_featured);

  const showcases: ShowcaseSection[] = form.showcases?.length
    ? form.showcases
    : DEFAULT_SHOWCASES;

  const [activeShowcaseId, setActiveShowcaseId] = useState<string>('trending');
  const [showcaseSearch, setShowcaseSearch] = useState('');

  const currentShowcase = showcases.find((s) => s.id === activeShowcaseId) || showcases[0] || DEFAULT_SHOWCASES[0];

  const updateShowcaseField = (key: keyof ShowcaseSection, value: any) => {
    hasUserEdited.current = true;
    setIsSaved(false);
    const nextShowcases = showcases.map((s) =>
      s.id === currentShowcase.id ? { ...s, [key]: value } : s
    );
    setForm((prev) => ({
      ...prev,
      showcases: nextShowcases,
      ...(currentShowcase.id === 'featured'
        ? {
            showFeaturedProducts: key === 'enabled' ? value : prev.showFeaturedProducts,
            featuredProductsTitle: key === 'title' ? value : prev.featuredProductsTitle,
            featuredProductsSubtitle: key === 'subtitle' ? value : prev.featuredProductsSubtitle,
          }
        : {}),
    }));
  };

  const toggleShowcaseProduct = (productId: string) => {
    hasUserEdited.current = true;
    setIsSaved(false);
    const existing = currentShowcase.productIds || [];
    const isSelected = existing.includes(productId);
    const nextProductIds = isSelected
      ? existing.filter((id) => id !== productId)
      : [...existing, productId];

    updateShowcaseField('productIds', nextProductIds);
    toast.success(isSelected ? 'Product removed from showcase' : 'Product added to showcase');
  };

  const matchedShowcaseProducts = useMemo(() => {
    const query = showcaseSearch.trim().toLowerCase();
    if (!query) return [];
    return catalogProducts
      .filter((product) =>
        [product.title, product.sku, product.brand, product.category_id].some((val) =>
          val?.toLowerCase().includes(query)
        )
      )
      .slice(0, 8);
  }, [catalogProducts, showcaseSearch]);

  const selectedShowcaseProducts = useMemo(() => {
    const ids = currentShowcase.productIds || [];
    return ids.map((id) => catalogProducts.find((p) => p.id === id)).filter(Boolean) as Product[];
  }, [catalogProducts, currentShowcase.productIds]);

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

  const setGlobalBannerType = (type: 'normal' | 'clickable') => {
    hasUserEdited.current = true;
    setIsSaved(false);
    const nextSlides = slides.map((slide) => ({
      ...slide,
      bannerType: type,
    }));
    setForm((previous) => ({
      ...previous,
      flashSaleBannerType: type,
      flashSaleSlides: nextSlides,
    }));
    toast.success(
      type === 'clickable'
        ? 'সবগুলো স্লাইডারে ক্লিক অন করা হয়েছে।'
        : 'সবগুলো স্লাইডারে ক্লিক অফ করা হয়েছে (Normal Banner)।'
    );
  };

  const updateSlideFields = (fields: Partial<FlashSaleSlide>) => {
    hasUserEdited.current = true;
    setIsSaved(false);
    setForm((previous) => {
      const currentSlides = previous.flashSaleSlides?.length ? previous.flashSaleSlides : slides;
      const nextSlides = currentSlides.map((slide, index) =>
        index === selectedSlideIndex ? { ...slide, ...fields } : slide
      );
      return {
        ...previous,
        flashSaleSlides: nextSlides,
        ...(selectedSlideIndex === 0 ? {
          ...('tag' in fields ? { flashSaleTag: fields.tag } : {}),
          ...('title' in fields ? { flashSaleTitle: fields.title } : {}),
          ...('subtitle' in fields ? { flashSaleSubtitle: fields.subtitle } : {}),
          ...('bgImage' in fields ? { flashSaleBgImage: fields.bgImage } : {}),
          ...('desktopImage' in fields ? { flashSaleDesktopImage: fields.desktopImage } : {}),
          ...('mobileImage' in fields ? { flashSaleMobileImage: fields.mobileImage } : {}),
          ...('link' in fields ? { flashSaleLink: fields.link } : {}),
          ...('bannerType' in fields ? { flashSaleBannerType: fields.bannerType } : {}),
          ...('layoutStyle' in fields ? { flashSaleLayoutStyle: fields.layoutStyle } : {}),
          ...('showTimer' in fields ? { flashSaleShowTimer: fields.showTimer } : {}),
          ...('hideText' in fields ? { flashSaleHideText: fields.hideText } : {}),
        } : {}),
      };
    });
  };

  const updateSlide = (key: keyof FlashSaleSlide, value: any) => {
    updateSlideFields({ [key]: value });
  };

  const clearSlideText = () => {
    hasUserEdited.current = true;
    setIsSaved(false);
    const nextSlides = slides.map((slide, index) =>
      index === selectedSlideIndex
        ? { ...slide, tag: '', title: '', subtitle: '', hideText: true }
        : slide
    );
    setForm((previous) => ({
      ...previous,
      flashSaleSlides: nextSlides,
      ...(selectedSlideIndex === 0
        ? {
            flashSaleTag: '',
            flashSaleTitle: '',
            flashSaleSubtitle: '',
            flashSaleHideText: true,
          }
        : {}),
    }));
    toast.success('স্লাইডারের টেক্সট মুছে দেওয়া হয়েছে (Pure Image Banner)।');
  };

  const addSlide = () => {
    hasUserEdited.current = true;
    setIsSaved(false);
    const currentBannerType = form.flashSaleBannerType || 'clickable';
    const nextSlides = [...slides, {
      id: `slide-${Date.now()}`,
      tag: '',
      title: '',
      subtitle: '',
      bgImage: '',
      desktopImage: '',
      mobileImage: '',
      link: '',
      productIds: [],
      pageTitle: '',
      bannerType: currentBannerType,
      layoutStyle: (form.flashSaleLayoutStyle || 'full') as any,
      showTimer: false,
      hideText: false,
    }];
    setForm((previous) => ({ ...previous, flashSaleSlides: nextSlides }));
    setSelectedSlideIndex(nextSlides.length - 1);
  };

  const removeSlide = () => {
    if (slides.length === 1) {
      toast.error('A flash sale needs at least one slide.');
      return;
    }
    const slideToRemove = slides[selectedSlideIndex];
    if (slideToRemove) {
      const urlsToPurge = [
        slideToRemove.desktopImage,
        slideToRemove.mobileImage,
        slideToRemove.bgImage,
      ].filter(Boolean) as string[];
      if (urlsToPurge.length > 0) {
        deleteImagesFromCloudinary(urlsToPurge).catch((err) =>
          console.warn('Cloudinary slide image deletion notice:', err)
        );
      }
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
    setForm((previous) => ({
      ...previous,
      showFlashSale: true,
      flashSaleDurationType: 'countdown',
      flashSaleInfinite: false,
      flashSaleHours: hours,
      flashSaleEndsAt: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
    }));
    toast.info(`Timer reset to ${hours} hours. Click Save to publish.`);
  };

  const saveAll = async () => {
    hasUserEdited.current = false;
    const isInfinite = (form.flashSaleDurationType || 'infinite') === 'infinite' || form.flashSaleInfinite === true;
    const hours = Math.max(1, Math.min(72, Number(form.flashSaleHours) || 4));
    const expiresAt = isInfinite
      ? ''
      : (form.showFlashSale && (!form.flashSaleEndsAt || new Date(form.flashSaleEndsAt).getTime() <= Date.now())
        ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
        : form.flashSaleEndsAt);

    const mappedSlides = slides.map((slide) => {
      const pIds = Array.isArray(slide.productIds)
        ? slide.productIds
        : (slide.productId ? [slide.productId] : []);

      let autoLink = slide.link;
      if (pIds.length === 1) {
        autoLink = `/product/${pIds[0]}`;
      } else if (pIds.length > 1) {
        autoLink = `/showcase/banner-${slide.id}`;
      } else {
        autoLink = slide.link && !slide.link.startsWith('/showcase/banner-') ? slide.link : '';
      }

      return {
        ...slide,
        link: autoLink || slide.link || '',
        productId: pIds.length === 1 ? pIds[0] : undefined,
        productIds: pIds,
        pageTitle: slide.pageTitle || '',
        showTimer: Boolean(form.flashSaleShowTimer),
      };
    });

    const nextForm = {
      ...form,
      topAnnouncementText: cleanAnnouncementText(form.topAnnouncementText),
      flashSaleDurationType: (isInfinite ? 'infinite' : 'countdown') as 'infinite' | 'countdown',
      flashSaleInfinite: isInfinite,
      flashSaleShowTimer: Boolean(form.flashSaleShowTimer),
      flashSaleHours: hours,
      flashSaleEndsAt: expiresAt,
      flashSaleSlides: mappedSlides,
      flashSaleTag: mappedSlides[0]?.tag || form.flashSaleTag,
      flashSaleTitle: mappedSlides[0]?.title || form.flashSaleTitle,
      flashSaleSubtitle: mappedSlides[0]?.subtitle || form.flashSaleSubtitle,
      flashSaleBgImage: mappedSlides[0]?.bgImage || form.flashSaleBgImage,
      flashSaleDesktopImage: mappedSlides[0]?.desktopImage || mappedSlides[0]?.bgImage || form.flashSaleDesktopImage,
      flashSaleMobileImage: mappedSlides[0]?.mobileImage || form.flashSaleMobileImage,
      flashSaleLink: mappedSlides[0]?.link || form.flashSaleLink || '/products',
      showcases: showcases,
      showFeaturedProducts: showcases.find((s) => s.id === 'featured')?.enabled ?? form.showFeaturedProducts,
      featuredProductsTitle: showcases.find((s) => s.id === 'featured')?.title ?? form.featuredProductsTitle,
      featuredProductsSubtitle: showcases.find((s) => s.id === 'featured')?.subtitle ?? form.featuredProductsSubtitle,
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
    { label: 'Banner', enabled: Boolean(form.showFlashSale) },
    ...showcases.map((s) => ({
      label: `Showcase: ${s.title}`,
      enabled: s.enabled === true,
    })),
  ];

  return (
    <div className="banner-studio w-full space-y-6 pb-20 text-slate-900">
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
        </div>
      </header>

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
                <div>
                  <h2 className="font-black">Hero section</h2>
                  <p className="text-xs text-slate-500">Main heading and two customer-facing actions.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Toggle
                  checked={form.heroShowOnMobile !== false}
                  onChange={(value) => setValue('heroShowOnMobile', value)}
                  label={form.heroShowOnMobile !== false ? '📱 Mobile: ON' : '📱 Mobile: OFF'}
                />
                <Toggle
                  checked={form.showHeroSection !== false}
                  onChange={(value) => setValue('showHeroSection', value)}
                  label={form.showHeroSection !== false ? 'Visible' : 'Hidden'}
                />
              </div>
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
                <div>
                  <h2 className="font-black">Hero spotlight</h2>
                  <p className="text-xs text-slate-500">Optional product card displayed beside the hero.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Toggle
                  checked={form.spotlightShowOnMobile !== false}
                  onChange={(value) => setValue('spotlightShowOnMobile', value)}
                  label={form.spotlightShowOnMobile !== false ? '📱 Mobile: ON' : '📱 Mobile: OFF'}
                />
                <Toggle
                  checked={Boolean(form.showSpotlight)}
                  onChange={(value) => setValue('showSpotlight', value)}
                  label={form.showSpotlight ? 'Visible' : 'Hidden'}
                />
              </div>
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

          {/* Banner */}
          <section className={`rounded-2xl border p-5 sm:p-6 ${card} space-y-5`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-sm sm:text-base text-gray-900 dark:text-white">
                    Banner
                  </h2>
                  <p className="text-xs text-slate-500">
                    Countdown banner and promotional slides.
                  </p>
                </div>
              </div>
              <Toggle
                checked={Boolean(form.showFlashSale)}
                onChange={(value) => setValue('showFlashSale', value)}
                label={form.showFlashSale ? 'Visible' : 'Hidden'}
              />
            </div>

            {/* Compact Banner Controls Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/80">
              {/* 1. Click Mode */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Click Action</span>
                <div className="inline-flex w-full rounded-xl p-0.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setGlobalBannerType('clickable')}
                    className={`flex-1 py-1 font-bold rounded-lg transition cursor-pointer text-center text-[11px] ${
                      (form.flashSaleBannerType || 'clickable') === 'clickable'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    Clickable
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlobalBannerType('normal')}
                    className={`flex-1 py-1 font-bold rounded-lg transition cursor-pointer text-center text-[11px] ${
                      (form.flashSaleBannerType || 'clickable') === 'normal'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    Image Only
                  </button>
                </div>
              </div>

              {/* 2. Duration Mode */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Duration</span>
                <div className="inline-flex w-full rounded-xl p-0.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setValue('flashSaleDurationType', 'infinite');
                      setValue('flashSaleInfinite', true);
                    }}
                    className={`flex-1 py-1 font-bold rounded-lg transition cursor-pointer text-center text-[11px] ${
                      (form.flashSaleDurationType || 'infinite') === 'infinite'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    ♾️ Infinite
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const hours = Math.max(1, Number(form.flashSaleHours) || 6);
                      setValue('flashSaleDurationType', 'countdown');
                      setValue('flashSaleInfinite', false);
                      if (!form.flashSaleEndsAt || new Date(form.flashSaleEndsAt).getTime() <= Date.now()) {
                        setValue('flashSaleHours', hours);
                        setValue('flashSaleEndsAt', new Date(Date.now() + hours * 60 * 60 * 1000).toISOString());
                      }
                    }}
                    className={`flex-1 py-1 font-bold rounded-lg transition cursor-pointer text-center text-[11px] ${
                      form.flashSaleDurationType === 'countdown'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    ⏳ Timed
                  </button>
                </div>
              </div>

              {/* 3. Timer on Banner */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Visitor Timer</span>
                <div className="inline-flex w-full rounded-xl p-0.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setValue('flashSaleShowTimer', false);
                      setValue('flashSaleSlides', slides.map((s) => ({ ...s, showTimer: false })));
                    }}
                    className={`flex-1 py-1 font-bold rounded-lg transition cursor-pointer text-center text-[11px] ${
                      !form.flashSaleShowTimer
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    Hidden
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('flashSaleShowTimer', true);
                      setValue('flashSaleSlides', slides.map((s) => ({ ...s, showTimer: true })));
                    }}
                    className={`flex-1 py-1 font-bold rounded-lg transition cursor-pointer text-center text-[11px] ${
                      form.flashSaleShowTimer
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    Visible
                  </button>
                </div>
              </div>

              {/* 4. Color Theme */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Color Theme</span>
                <select
                  value={form.flashSaleTheme || 'sunset'}
                  onChange={(e) => setValue('flashSaleTheme', e.target.value as any)}
                  className={`w-full py-1.5 px-2.5 border text-xs font-bold rounded-xl ${input}`}
                >
                  <option value="sunset">🌅 Sunset Rose</option>
                  <option value="emerald">🌲 Emerald Luxe</option>
                  <option value="cyber">⚡ Cyber Neon</option>
                  <option value="dark">🌑 Midnight Onyx</option>
                  <option value="crimson">💎 Ruby Crimson</option>
                  <option value="gold">👑 Royal Gold</option>
                  <option value="ocean">🌊 Deep Ocean</option>
                  <option value="aurora">🌌 Aurora</option>
                  <option value="cherry">🌸 Cherry Blossom</option>
                  <option value="solar">☀️ Solar Flare</option>
                </select>
              </div>
            </div>

            {/* Countdown Timer Config Bar (Appears when Timed is selected) */}
            {form.flashSaleDurationType === 'countdown' && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                    <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>টাইমার সময়কাল:</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={form.flashSaleHours || 6}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(168, Number(e.target.value) || 1));
                        setValue('flashSaleHours', val);
                      }}
                      className={`w-16 px-2 py-1 border text-center font-black text-xs rounded-xl ${input}`}
                    />
                    <span className="text-slate-600 dark:text-slate-400 font-bold">ঘণ্টা</span>

                    {/* Quick hour presets */}
                    <div className="inline-flex items-center gap-1 ml-1.5">
                      {[4, 6, 12, 24, 48].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => {
                            setValue('flashSaleHours', h);
                            setForm((prev) => ({
                              ...prev,
                              flashSaleHours: h,
                              flashSaleEndsAt: new Date(Date.now() + h * 60 * 60 * 1000).toISOString(),
                            }));
                            toast.info(`Timer set to ${h} hours.`);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                            (form.flashSaleHours || 6) === h
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-gray-700 hover:border-amber-400'
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {form.flashSaleEndsAt && (
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      {new Date(form.flashSaleEndsAt).getTime() > Date.now()
                        ? `⏱️ শেষ: ${new Date(form.flashSaleEndsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${new Date(form.flashSaleEndsAt).toLocaleDateString()}`
                        : '⚠️ সময় শেষ (Expired)'}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={resetFlashTimer}
                    className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>রিস্টার্ট টাইমার (Start from Now)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Slide Navigation & Live Mode Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mr-1">
                  Slides:
                </span>
                {slides.map((slide, index) => {
                  const thumb = slide.desktopImage || slide.bgImage || slide.mobileImage;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setSelectedSlideIndex(index)}
                      className={`h-9 px-2.5 rounded-xl text-xs font-bold border cursor-pointer transition flex items-center justify-center gap-2 ${
                        index === selectedSlideIndex
                          ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                          : isLight
                          ? 'bg-white border-slate-200 text-slate-700 hover:border-rose-300'
                          : 'bg-gray-900 border-gray-800 text-gray-300'
                      }`}
                    >
                      {thumb ? (
                        <img src={thumb} alt="" className="w-5 h-5 rounded object-cover border border-white/30" />
                      ) : (
                        <span className="w-5 h-5 rounded bg-slate-200 dark:bg-gray-800 text-[9px] flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                      )}
                      <span>Slide {index + 1}</span>
                      {slide.productIds && slide.productIds.length > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                            index === selectedSlideIndex ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {slide.productIds.length}
                        </span>
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={addSlide}
                  className="h-8 px-2.5 rounded-xl border border-dashed border-rose-300 text-rose-600 text-xs font-bold hover:bg-rose-50 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Slide</span>
                </button>
                {slides.length > 1 && (
                  <button
                    type="button"
                    onClick={removeSlide}
                    className="h-8 px-2.5 rounded-xl text-rose-600 text-xs font-bold hover:bg-rose-50 cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Status Pill */}
              <div className="shrink-0">
                {currentSlideProductIds.length === 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-gray-700">
                    🔗 Custom Link Mode
                  </span>
                ) : currentSlideProductIds.length === 1 ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    🎯 Single Product Mode (Direct: /product/:id)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    🛍️ Multi-Product Landing Page ({currentSlideProductIds.length} Products)
                  </span>
                )}
              </div>
            </div>

            {/* Compact 2-Column Slide Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pt-1">
              {/* Left Column: Manual Banner Images (5 cols) */}
              <div className="lg:col-span-5 space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-gray-800/40 border border-slate-200/90 dark:border-gray-700/70">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🖼️</span> ব্যানার ছবি (Manual Upload)
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500">ম্যানুয়াল সিলেক্ট</span>
                </div>

                {/* Desktop Banner Image */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Desktop Banner</span>
                    <span className="text-[10px] text-slate-400">1920×600 px</span>
                  </div>
                  <ImageUploader
                    label=""
                    value={currentSlide.desktopImage || currentSlide.bgImage || ''}
                    onChange={(value) => {
                      updateSlideFields({
                        desktopImage: value,
                        bgImage: value,
                      });
                    }}
                    helpText="Desktop / Laptop view image"
                  />
                </div>

                {/* Mobile Banner Image */}
                <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-gray-700/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Mobile Banner</span>
                    <span className="text-[10px] text-slate-400">800×400 px</span>
                  </div>
                  <ImageUploader
                    label=""
                    value={currentSlide.mobileImage || ''}
                    onChange={(value) => updateSlide('mobileImage', value)}
                    helpText="Mobile view image (Desktop image used if empty)"
                  />
                </div>

                {/* Pure Image Banner Switch */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-gray-700/60">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Pure Image (No Text)</span>
                    <span className="text-[10px] text-slate-400">ছবির ওপর টেক্সট ওভারলে দেখাবে না</span>
                  </div>
                  <Toggle
                    checked={Boolean(currentSlide.hideText)}
                    onChange={(val) => updateSlide('hideText', val)}
                    label={currentSlide.hideText ? 'No Text' : 'Text ON'}
                  />
                </div>
              </div>

              {/* Right Column: Products, Links & Content (7 cols) */}
              <div className="lg:col-span-7 space-y-3.5">
                {/* 1. Landing Page Title & Destination Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Landing Page Title" hint="যেমন: Flash Sale, Mega Deal">
                    <input
                      value={currentSlide.pageTitle || ''}
                      onChange={(e) => updateSlide('pageTitle', e.target.value)}
                      className={`w-full px-3 py-2 border text-xs font-bold ${input}`}
                      placeholder={currentSlide.title || 'যেমন: Mega Deal অথবা Flash Sale'}
                    />
                  </Field>

                  <Field
                    label="Click Destination Link"
                    hint={
                      currentSlideProductIds.length === 1
                        ? 'Direct Product'
                        : currentSlideProductIds.length > 1
                        ? 'Showcase Page'
                        : 'Custom URL'
                    }
                  >
                    <input
                      value={
                        currentSlideProductIds.length === 1
                          ? `/product/${currentSlideProductIds[0]}`
                          : currentSlideProductIds.length > 1
                          ? `/showcase/banner-${currentSlide.id}`
                          : currentSlide.link || ''
                      }
                      onChange={(e) => updateSlide('link', e.target.value)}
                      className={`w-full px-3 py-2 border text-xs ${input}`}
                      placeholder="e.g. /product/123 or /shop"
                    />
                  </Field>
                </div>

                {/* 2. Product Search & Link */}
                {(form.flashSaleBannerType || 'clickable') === 'clickable' && (
                  <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/60 dark:bg-gray-800/40 border border-slate-200/90 dark:border-gray-700/70">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-rose-600" />
                        প্রোডাক্ট লিংক করুন (Link Products)
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {currentSlideProductIds.length === 0
                          ? 'কোনো প্রোডাক্ট নেই'
                          : `${currentSlideProductIds.length} টি প্রোডাক্ট সিলেক্টেড`}
                      </span>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        value={flashSlideSearch}
                        onChange={(e) => setFlashSlideSearch(e.target.value)}
                        className={`w-full pl-10 pr-3 py-2 border text-xs ${input}`}
                        placeholder="Search product by name, brand, or SKU to link..."
                      />
                    </div>

                    {/* Search Results Dropdown */}
                    {matchedFlashSlideProducts.length > 0 && (
                      <div className="rounded-xl border border-slate-200 dark:border-gray-700 divide-y divide-slate-100 dark:divide-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-md max-h-48 overflow-y-auto">
                        {matchedFlashSlideProducts.map((product) => {
                          const isSelected = currentSlideProductIds.includes(product.id);
                          return (
                            <div
                              key={product.id}
                              className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-gray-800 transition"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {product.images?.[0] ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.title}
                                    className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-gray-700 shrink-0 bg-white"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-800 flex items-center justify-center shrink-0 text-[9px] text-slate-400">
                                    No img
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">
                                    {product.title}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    ৳{product.price} {product.sku ? `• SKU: ${product.sku}` : ''}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    removeProductFromSlide(product.id);
                                  } else {
                                    addProductToSlide(product);
                                  }
                                }}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition shrink-0 cursor-pointer ${
                                  isSelected
                                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                                }`}
                              >
                                {isSelected ? 'Added ✓' : '+ Add'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Compact Selected Products Chips */}
                    {selectedSlideProducts.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-gray-700/60">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          <span>সংযুক্ত প্রোডাক্ট ({selectedSlideProducts.length}):</span>
                          <button
                            type="button"
                            onClick={clearSlideProducts}
                            className="text-rose-600 hover:text-rose-700 text-[10px] cursor-pointer"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-0.5">
                          {selectedSlideProducts.map((prod) => (
                            <div
                              key={prod.id}
                              className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-2xs text-xs"
                            >
                              {prod.images?.[0] && (
                                <img src={prod.images[0]} alt="" className="w-5 h-5 rounded object-cover" />
                              )}
                              <span className="font-bold text-slate-800 dark:text-slate-200 max-w-[140px] truncate text-[11px]">
                                {prod.title}
                              </span>
                              <span className="text-[10px] text-slate-400">৳{prod.price}</span>
                              <button
                                type="button"
                                onClick={() => removeProductFromSlide(prod.id)}
                                className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                                title="Remove"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Optional Overlay Text Fields (Only if not pure image) */}
                {!currentSlide.hideText && (
                  <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/60 dark:bg-gray-800/40 border border-slate-200/90 dark:border-gray-700/70">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      📝 Overlay Text (Optional)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <Field label="Tag (Optional)" hint="e.g. ⚡ FLASH SALE">
                        <input
                          value={currentSlide.tag || ''}
                          onChange={(e) => updateSlide('tag', e.target.value)}
                          className={`w-full px-3 py-1.5 border text-xs ${input}`}
                          placeholder="Optional tag"
                        />
                      </Field>
                      <Field label="Title (Optional)" hint="e.g. 24-Hour Deals">
                        <input
                          value={currentSlide.title || ''}
                          onChange={(e) => updateSlide('title', e.target.value)}
                          className={`w-full px-3 py-1.5 border text-xs ${input}`}
                          placeholder="Optional title"
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Description (Optional)">
                          <input
                            value={currentSlide.subtitle || ''}
                            onChange={(e) => updateSlide('subtitle', e.target.value)}
                            className={`w-full px-3 py-1.5 border text-xs ${input}`}
                            placeholder="Optional brief description"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section: Multiple Homepage Showcases (Trending, Featured, New Arrival, Flash Sale) */}
          <section className={`rounded-2xl border p-5 sm:p-6 ${card} space-y-6`}>
            {/* Header with Title and Visible Switch */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-sm sm:text-base text-gray-900 dark:text-white">
                    Homepage Showcases
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manage promotional product collections on the homepage.
                  </p>
                </div>
              </div>

              <Toggle
                checked={Boolean(currentShowcase.enabled)}
                onChange={(value) => updateShowcaseField('enabled', value)}
                label={Boolean(currentShowcase.enabled) ? 'Visible' : 'Hidden'}
              />
            </div>

            {/* Showcase Selection Tabs (Trending, Featured, New Arrival, Flash Sale) */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Select Showcase Section to Configure:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {showcases.map((s) => {
                  const isCurrent = s.id === currentShowcase.id;
                  const count = s.productIds?.length || 0;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setActiveShowcaseId(s.id)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isCurrent
                          ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs font-bold'
                          : isLight
                          ? 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          : 'border-gray-800 bg-gray-950 hover:border-gray-700 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm">
                          {s.type === 'trending' ? '🔥' : s.type === 'featured' ? '🌟' : s.type === 'new_arrival' ? '🆕' : '⚡'}
                        </span>
                        <div className="truncate">
                          <span className="text-xs font-black block truncate">{s.title}</span>
                          <span className="text-[10px] text-slate-400">
                            {Boolean(s.enabled) ? '🟢 Visible' : '⚪ Hidden'}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        count > 0 ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable Title & Subtitle for Current Showcase */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Section Heading">
                <input
                  value={currentShowcase.title || ''}
                  onChange={(e) => updateShowcaseField('title', e.target.value)}
                  placeholder="e.g. Trending, Featured, New Arrival..."
                  className={`w-full px-3.5 py-2.5 border text-sm font-bold ${input}`}
                />
              </Field>
              <Field label="Section Description (Optional)">
                <input
                  value={currentShowcase.subtitle || ''}
                  onChange={(e) => updateShowcaseField('subtitle', e.target.value)}
                  placeholder="e.g. Popular choices flying off the shelves"
                  className={`w-full px-3.5 py-2.5 border text-sm ${input}`}
                />
              </Field>
            </div>

            {/* Add or Remove Products Search Box */}
            <div className="space-y-3">
              <Field label="Search & Add Multiple Products" hint={`${currentShowcase.productIds?.length || 0} products selected`}>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={showcaseSearch}
                    onChange={(e) => setShowcaseSearch(e.target.value)}
                    className={`w-full pl-10 pr-8 py-2.5 border text-sm ${input}`}
                    placeholder="Search catalog by title, SKU or brand to add..."
                  />
                  {showcaseSearch && (
                    <button
                      type="button"
                      onClick={() => setShowcaseSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Field>

              {/* Matched Search Results */}
              {matchedShowcaseProducts.length > 0 && (
                <div className="space-y-2 p-3 bg-slate-50/80 dark:bg-gray-950/80 border border-slate-200 dark:border-gray-800 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-500">Search Results (Click to Add / Remove):</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {matchedShowcaseProducts.map((product) => {
                      const isSelected = (currentShowcase.productIds || []).includes(product.id);
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => toggleShowcaseProduct(product.id)}
                          className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 text-left transition cursor-pointer ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30'
                              : isLight
                              ? 'border-slate-200 bg-white hover:border-rose-200'
                              : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={product.images?.[0] || '/logo.webp'}
                              alt={product.title}
                              className="w-9 h-9 rounded-lg object-contain bg-white border border-gray-200/80 shrink-0 p-0.5"
                            />
                            <div className="min-w-0">
                              <span className="block truncate text-xs font-bold text-gray-900 dark:text-white">
                                {product.title}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {formatPrice(product.price)} • {isSelected ? '✓ Added to showcase' : '+ Click to add'}
                              </span>
                            </div>
                          </div>

                          <div className={`p-1 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                            {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Currently Selected Products Preview */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>Selected Products in "{currentShowcase.title}"</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-[10px] font-black">
                      {selectedShowcaseProducts.length}
                    </span>
                  </span>
                  {selectedShowcaseProducts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => updateShowcaseField('productIds', [])}
                      className="text-[11px] text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {selectedShowcaseProducts.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-gray-800 text-center text-xs text-slate-400">
                    No products manually selected yet (featured items will be displayed automatically if empty). Search and add products above.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {selectedShowcaseProducts.map((p, idx) => (
                      <div
                        key={p.id}
                        className={`relative rounded-xl border p-2 flex flex-col items-center text-center group ${
                          isLight ? 'bg-white border-slate-200' : 'bg-gray-950 border-gray-800'
                        }`}
                      >
                        <span className="absolute top-1 left-1.5 text-[9px] font-black text-slate-400">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShowcaseProduct(p.id)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-500 hover:bg-rose-600 text-white transition shadow-xs cursor-pointer"
                          title="Remove product"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                        <img
                          src={p.images?.[0] || '/logo.webp'}
                          alt={p.title}
                          className="w-14 h-14 rounded-lg object-contain p-1 my-1"
                        />
                        <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 line-clamp-1 w-full">
                          {p.title}
                        </span>
                        <span className="text-[9px] text-rose-600 font-black">
                          {formatPrice(p.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className={`xl:sticky xl:top-20 rounded-2xl border p-5 ${card}`}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><Eye className="w-4 h-4" /></div><div><h2 className="font-black">Live overview</h2><p className="text-xs text-slate-500">What is currently enabled.</p></div></div>
          <div className="mt-4 space-y-3">
            {sections.map((section) => <div key={section.label} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"><span className="text-xs font-bold">{section.label}</span><span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${section.enabled ? 'text-rose-600' : 'text-slate-400'}`}><span className={`w-1.5 h-1.5 rounded-full ${section.enabled ? 'bg-rose-500' : 'bg-slate-300'}`} />{section.enabled ? 'Visible' : 'Hidden'}</span></div>)}
          </div>
          <div className="mt-5 rounded-xl bg-rose-50 border border-rose-100 p-3.5"><p className="text-xs font-bold text-rose-900">Publish checklist</p><ul className="mt-2 space-y-1.5 text-[11px] text-rose-800"><li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" />Use short, customer-facing messages.</li><li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" />Check product links before saving.</li><li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" />Upload wide images for flash sale slides.</li></ul></div>
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

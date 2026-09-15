import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface FlashSaleSlide {
  id: string;
  tag?: string;
  title: string;
  subtitle?: string;
  bgImage?: string;
  link?: string;
  productId?: string;
  bannerType?: 'normal' | 'clickable'; // 'normal' = full image display only, 'clickable' = clicking navigates to link/product
  layoutStyle?: 'full' | 'split'; // 'full' = full-bleed edge-to-edge image, 'split' = text on left, image on right
  showTimer?: boolean; // toggle countdown timer on this slide
}

export interface BannerSettings {
  // Top Announcement Bar
  showTopAnnouncement?: boolean;
  topAnnouncementText?: string;
  isCustomAnnouncement?: boolean;
  announcementText?: string;
  showAnnouncementBar?: boolean;
  enable7DayNewUserOffer?: boolean;

  // Hero Section
  showHeroSection: boolean;
  heroShowOnMobile?: boolean; // Controls whether Hero Section appears on mobile screens
  heroBadge: string;
  heroTitle: string;
  heroHighlightText: string;
  heroSubtitle: string;
  heroPrimaryBtnText: string;
  heroPrimaryBtnLink: string;
  heroSecondaryBtnText: string;
  heroSecondaryBtnLink: string;

  // Hero Spotlight Card
  spotlightBadge: string;
  spotlightTitle: string;
  spotlightBrand: string;
  spotlightImage: string;
  spotlightPrice: number;
  spotlightDiscountPrice: number;
  spotlightStockText: string;
  spotlightSavingsText: string;
  spotlightBtnLink: string;
  showSpotlight: boolean;
  spotlightShowOnMobile?: boolean; // Controls whether Spotlight card appears on mobile screens

  // Promotional Banner / Flash Sale Slider
  showFlashSale: boolean;
  flashSaleBannerType?: 'normal' | 'clickable';
  flashSaleLayoutStyle?: 'full' | 'split';
  flashSaleShowTimer?: boolean;
  flashSaleTag: string;
  flashSaleTitle: string;
  flashSaleSubtitle: string;
  flashSaleHours: number;
  flashSaleTheme:
    | 'sunset'
    | 'emerald'
    | 'cyber'
    | 'dark'
    | 'crimson'
    | 'gold'
    | 'ocean'
    | 'aurora'
    | 'cherry'
    | 'solar';
  flashSaleEndsAt?: string;
  flashSaleBgImage?: string;
  flashSaleLink?: string;
  flashSaleSlides?: FlashSaleSlide[];

  // Showcase Sections (Trending, Featured, New Arrival, Flash Sale)
  showcases?: ShowcaseSection[];

  // Legacy / Backward Compatibility fields
  showFeaturedProducts?: boolean;
  featuredProductsTitle?: string;
  featuredProductsSubtitle?: string;
}

export type ShowcaseType = 'trending' | 'featured' | 'new_arrival' | 'flash_sale';

export interface ShowcaseSection {
  id: string; // 'trending' | 'featured' | 'new_arrival' | 'flash_sale'
  type: ShowcaseType;
  title: string;
  subtitle?: string;
  enabled: boolean;
  productIds: string[];
}

export interface StoreSettings {
  storeName: string;
  helplinePhone: string;
  supportEmail: string;
  bkashNumber: string;
  bkashType: 'Merchant' | 'Personal';
  nagadNumber: string;
  nagadType: 'Merchant' | 'Personal';
  rocketNumber: string;
  rocketType: 'Merchant' | 'Personal';
  deliveryFeeInsideDhaka: number;
  deliveryFeeOutsideDhaka: number;
  freeShippingThreshold: number;
  authorizedAdmins: string[];
  banners: BannerSettings;
}

export const DEFAULT_SHOWCASES: ShowcaseSection[] = [
  {
    id: 'trending',
    type: 'trending',
    title: 'Trending',
    subtitle: 'Popular products trending right now',
    enabled: false,
    productIds: [],
  },
  {
    id: 'featured',
    type: 'featured',
    title: 'Featured',
    subtitle: 'Hand-picked selections for you',
    enabled: false,
    productIds: [],
  },
  {
    id: 'new_arrival',
    type: 'new_arrival',
    title: 'New Arrival',
    subtitle: 'Fresh new arrivals in our store',
    enabled: false,
    productIds: [],
  },
  {
    id: 'flash_sale',
    type: 'flash_sale',
    title: 'Flash Sale',
    subtitle: 'Limited-time special price offers',
    enabled: false,
    productIds: [],
  },
];

export const DEFAULT_BANNERS: BannerSettings = {
  showTopAnnouncement: false,
  topAnnouncementText: '⚡ Welcome to Kintesi! Use coupon KINTESI10 for 10% OFF',
  isCustomAnnouncement: false,

  showHeroSection: true,
  heroShowOnMobile: true,
  heroBadge: 'PREMIER LIFESTYLE & SHOPPING MARKETPLACE',
  heroTitle: 'Everything You Need for',
  heroHighlightText: 'Life, Fashion & Tech',
  heroSubtitle: 'From authentic designer apparel, sneakers & lifestyle essentials to flagship smartphones, home appliances & gadgets — delivered to your doorstep across Bangladesh.',
  heroPrimaryBtnText: 'Explore Kintesi Catalog',
  heroPrimaryBtnLink: '/shop',
  heroSecondaryBtnText: 'Browse Categories',
  heroSecondaryBtnLink: '/shop',

  spotlightBadge: '',
  spotlightTitle: '',
  spotlightBrand: '',
  spotlightImage: '',
  spotlightPrice: 0,
  spotlightDiscountPrice: 0,
  spotlightStockText: '',
  spotlightSavingsText: '',
  spotlightBtnLink: '/shop',
  showSpotlight: false,
  spotlightShowOnMobile: true,

  showFlashSale: false,
  flashSaleBannerType: 'clickable',
  flashSaleLayoutStyle: 'full',
  flashSaleShowTimer: true,
  flashSaleTag: '⚡ FLASH SALE',
  flashSaleTitle: 'Exclusive 24-Hour Super Deals',
  flashSaleSubtitle: 'Limited stock flash offers with up to 50% discount. Order before time runs out!',
  flashSaleHours: 6,
  flashSaleTheme: 'sunset',
  flashSaleEndsAt: '',
  flashSaleBgImage: '',
  flashSaleLink: '/products',
  flashSaleSlides: [
    {
      id: '1',
      tag: '⚡ FLASH SALE',
      title: 'Exclusive 24-Hour Super Deals',
      subtitle: 'Limited stock flash offers with up to 50% discount. Order before time runs out!',
      bgImage: '',
      link: '/products',
      bannerType: 'clickable',
      layoutStyle: 'full',
      showTimer: true,
    },
  ],

  showcases: DEFAULT_SHOWCASES,

  showFeaturedProducts: false,
  featuredProductsTitle: 'Featured Products',
  featuredProductsSubtitle: 'Top-rated selections for home, fashion, and tech',
};

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Kintesi',
  helplinePhone: '',
  supportEmail: '',
  bkashNumber: '',
  bkashType: 'Merchant',
  nagadNumber: '',
  nagadType: 'Merchant',
  rocketNumber: '',
  rocketType: 'Personal',
  deliveryFeeInsideDhaka: 60,
  deliveryFeeOutsideDhaka: 120,
  freeShippingThreshold: 5000,
  authorizedAdmins: ['manage.kintesi@gmail.com'],
  banners: DEFAULT_BANNERS,
};

interface SettingsContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  updateBanners: (newBanners: Partial<BannerSettings>) => Promise<void>;
  isAuthorizedAdminEmail: (email?: string | null) => boolean;
  isLoading: boolean;
  isSettingsLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const cleanAnnouncementText = (text?: string | null): string => {
  if (!text) return '';
  return text
    .replace(/\s*[\+\&]?\s*Free\s+Express\s+Delivery/gi, '')
    .replace(/\s*Free\s+Express\s+Delivery/gi, '')
    .replace(/\s*[\+\&]?\s*Express\s+Delivery/gi, '')
    .trim();
};

// Timeout wrapper so slow network queries failover gracefully without freezing UI
function withTimeout<T>(promise: PromiseLike<T>, ms: number = 3500): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Operation timed out')), ms);
    Promise.resolve(promise)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('kintesi_store_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const mergedBanners = { ...DEFAULT_BANNERS, ...(parsed.banners || {}) };
        if (mergedBanners.topAnnouncementText) {
          mergedBanners.topAnnouncementText = cleanAnnouncementText(mergedBanners.topAnnouncementText);
        }
        if (mergedBanners.heroBadge) {
          mergedBanners.heroBadge = mergedBanners.heroBadge.replace(/•?\s*kintesi\.com/gi, '').trim();
        }
        if (mergedBanners.spotlightTitle?.includes('Leather Biker Jacket') || mergedBanners.spotlightImage?.includes('unsplash')) {
          mergedBanners.showSpotlight = false;
          mergedBanners.spotlightTitle = '';
          mergedBanners.spotlightImage = '';
          mergedBanners.spotlightBrand = '';
        }
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          authorizedAdmins: parsed.authorizedAdmins || ['manage.kintesi@gmail.com'],
          banners: mergedBanners,
        };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  // Load from Supabase (Primary) with Firebase fallback on mount
  useEffect(() => {
    async function loadRemoteSettings() {
      try {
        // 1. Try Supabase first
        const supaRes = await withTimeout<any>(
          supabase.from('store_settings').select('*').eq('id', 'global_store_settings').maybeSingle(),
          3000
        ).catch(() => null);

        let remoteData = supaRes?.data;

        // 2. If no Supabase data, fallback to Firebase
        if (!remoteData) {
          const storeDoc = await withTimeout<any>(
            getDoc(doc(db, 'store_settings', 'default')),
            3000
          ).catch(() => null);
          if (storeDoc && storeDoc.exists()) {
            remoteData = storeDoc.data();
          }
        }

        if (remoteData) {
          const remoteBanners = remoteData.banners || (remoteData.settings_payload ? remoteData.settings_payload.banners : null);
          setSettings((prev) => {
            const rawText = remoteBanners?.topAnnouncementText ?? remoteBanners?.announcementText;
            const cleanText = rawText !== undefined ? cleanAnnouncementText(rawText) : undefined;
            const mergedBanners: BannerSettings = {
              ...DEFAULT_BANNERS,
              ...(remoteBanners || {}),
              topAnnouncementText: cleanText !== undefined ? cleanText : cleanAnnouncementText(prev.banners?.topAnnouncementText || '⚡ Welcome to Kintesi! Use coupon KINTESI10 for 10% OFF'),
              showTopAnnouncement: remoteBanners?.showTopAnnouncement !== undefined
                ? Boolean(remoteBanners.showTopAnnouncement)
                : (remoteBanners?.showAnnouncementBar !== undefined ? Boolean(remoteBanners.showAnnouncementBar) : Boolean(prev.banners?.showTopAnnouncement)),
              showFlashSale: remoteBanners?.showFlashSale !== undefined
                ? Boolean(remoteBanners.showFlashSale)
                : Boolean(prev.banners?.showFlashSale),
              showSpotlight: remoteBanners?.showSpotlight !== undefined
                ? Boolean(remoteBanners.showSpotlight)
                : Boolean(prev.banners?.showSpotlight),
              showFeaturedProducts: remoteBanners?.showFeaturedProducts !== undefined
                ? Boolean(remoteBanners.showFeaturedProducts)
                : Boolean(prev.banners?.showFeaturedProducts),
              heroShowOnMobile: remoteBanners?.heroShowOnMobile !== undefined
                ? Boolean(remoteBanners.heroShowOnMobile)
                : (prev.banners?.heroShowOnMobile !== undefined ? Boolean(prev.banners.heroShowOnMobile) : true),
              spotlightShowOnMobile: remoteBanners?.spotlightShowOnMobile !== undefined
                ? Boolean(remoteBanners.spotlightShowOnMobile)
                : (prev.banners?.spotlightShowOnMobile !== undefined ? Boolean(prev.banners.spotlightShowOnMobile) : true),
              isCustomAnnouncement: remoteBanners?.isCustomAnnouncement !== undefined
                ? remoteBanners.isCustomAnnouncement
                : Boolean(cleanText && cleanText !== '⚡ Welcome to Kintesi! Use coupon KINTESI10 for 10% OFF'),
            };

            const merged: StoreSettings = {
              storeName: remoteData.store_name || remoteData.storeName || prev.storeName,
              helplinePhone: remoteData.helpline_phone || remoteData.helplinePhone || prev.helplinePhone,
              supportEmail: remoteData.support_email || remoteData.supportEmail || prev.supportEmail,
              bkashNumber: remoteData.bkash_number || remoteData.bkashNumber || prev.bkashNumber,
              bkashType: (remoteData.bkash_type || remoteData.bkashType || prev.bkashType) as any,
              nagadNumber: remoteData.nagad_number || remoteData.nagadNumber || prev.nagadNumber,
              nagadType: (remoteData.nagad_type || remoteData.nagadType || prev.nagadType) as any,
              rocketNumber: remoteData.rocket_number || remoteData.rocketNumber || prev.rocketNumber,
              rocketType: (remoteData.rocket_type || remoteData.rocketType || prev.rocketType) as any,
              deliveryFeeInsideDhaka: Number(remoteData.delivery_fee_inside_dhaka ?? remoteData.deliveryFeeInsideDhaka ?? prev.deliveryFeeInsideDhaka),
              deliveryFeeOutsideDhaka: Number(remoteData.delivery_fee_outside_dhaka ?? remoteData.deliveryFeeOutsideDhaka ?? prev.deliveryFeeOutsideDhaka),
              freeShippingThreshold: Number(remoteData.free_shipping_threshold ?? remoteData.freeShippingThreshold ?? prev.freeShippingThreshold),
              authorizedAdmins: remoteData.authorized_admins || remoteData.authorizedAdmins || prev.authorizedAdmins || ['manage.kintesi@gmail.com'],
              banners: mergedBanners,
            };
            try {
              localStorage.setItem('kintesi_store_settings', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch (err) {
        console.warn('Store settings remote fetch notice:', err);
      } finally {
        setIsSettingsLoaded(true);
      }
    }
    loadRemoteSettings();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('kintesi_store_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Instant Settings update (0ms UI reactivity + non-blocking background cloud sync)
  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    const updated: StoreSettings = { ...settings, ...newSettings };
    
    // 1. Instant local reactivity (0ms)
    setSettings(updated);
    try {
      localStorage.setItem('kintesi_store_settings', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
    window.dispatchEvent(new CustomEvent('kintesi_store_settings_updated', { detail: updated }));
    toast.success('Settings updated!');

    // 2. Non-blocking cloud sync in background (Supabase + Firebase)
    (async () => {
      try {
        await withTimeout(
          supabase.from('store_settings').upsert(
            {
              id: 'global_store_settings',
              store_name: updated.storeName,
              helpline_phone: updated.helplinePhone,
              support_email: updated.supportEmail,
              bkash_number: updated.bkashNumber,
              bkash_type: updated.bkashType,
              nagad_number: updated.nagadNumber,
              nagad_type: updated.nagadType,
              rocket_number: updated.rocketNumber,
              rocket_type: updated.rocketType,
              delivery_fee_inside_dhaka: updated.deliveryFeeInsideDhaka,
              delivery_fee_outside_dhaka: updated.deliveryFeeOutsideDhaka,
              free_shipping_threshold: updated.freeShippingThreshold,
              authorized_admins: updated.authorizedAdmins,
              banners: updated.banners,
              settings_payload: updated,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          ),
          4000
        );
      } catch (err) {
        console.warn('Supabase settings sync note:', err);
      }

      try {
        await withTimeout(
          setDoc(doc(db, 'store_settings', 'default'), updated, { merge: true }),
          3500
        );
      } catch (err) {
        console.warn('Settings firestore sync notice:', err);
      }
    })();
  };

  // Instant Banner update (0ms UI reactivity + non-blocking background cloud sync)
  const updateBanners = async (newBanners: Partial<BannerSettings>) => {
    const cleanedBanners = { ...newBanners };
    if (cleanedBanners.topAnnouncementText !== undefined) {
      cleanedBanners.topAnnouncementText = cleanAnnouncementText(cleanedBanners.topAnnouncementText);
    }
    const updatedBanners: BannerSettings = { ...settings.banners, ...cleanedBanners };
    const updated: StoreSettings = { ...settings, banners: updatedBanners };

    // 1. Instant local reactivity (0ms)
    setSettings(updated);
    try {
      localStorage.setItem('kintesi_store_settings', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    // 2. Dispatch event so Navbar, Homepage & Storefront update immediately
    window.dispatchEvent(new CustomEvent('kintesi_banners_updated', { detail: updatedBanners }));
    toast.success('Banners & content updated successfully!');

    // 3. Non-blocking cloud sync in background (Supabase primary + Firebase backup)
    (async () => {
      try {
        await withTimeout(
          supabase.from('store_settings').upsert(
            {
              id: 'global_store_settings',
              banners: updatedBanners,
              settings_payload: updated,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          ),
          4000
        );
      } catch (supaErr) {
        console.warn('Supabase banner sync note:', supaErr);
      }

      try {
        await withTimeout(
          setDoc(doc(db, 'store_settings', 'default'), { banners: updatedBanners, ...updated }, { merge: true }),
          3500
        );
      } catch (fireErr) {
        console.warn('Firebase banner sync note:', fireErr);
      }
    })();
  };

  const isAuthorizedAdminEmail = (email?: string | null): boolean => {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    if (lower === 'manage.kintesi@gmail.com') return true;
    return (settings.authorizedAdmins || []).map((e) => e.toLowerCase().trim()).includes(lower);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateBanners,
        isAuthorizedAdminEmail,
        isLoading,
        isSettingsLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

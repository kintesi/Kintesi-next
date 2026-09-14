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

  // Flash Sale Banner
  showFlashSale: boolean;
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

  // Featured Products Section
  showFeaturedProducts?: boolean;
  featuredProductsTitle?: string;
  featuredProductsSubtitle?: string;
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

export const DEFAULT_BANNERS: BannerSettings = {
  showTopAnnouncement: true,
  topAnnouncementText: '⚡ Welcome to Kintesi! Use coupon KINTESI10 for 10% OFF',
  isCustomAnnouncement: false,

  showHeroSection: true,
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

  showFlashSale: true,
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
    },
  ],

  showFeaturedProducts: true,
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
        // Strict cleanup: eradicate any legacy fake products/images
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

  // Load from Firebase Firestore on mount
  useEffect(() => {
    async function loadRemoteSettings() {
      try {
        const storeDoc = await getDoc(doc(db, 'store_settings', 'default'));

        if (storeDoc.exists()) {
          const data = storeDoc.data() as any;
          const remoteBanners = data.banners;
          setSettings((prev) => {
            const rawText = remoteBanners?.topAnnouncementText ?? remoteBanners?.announcementText;
            const cleanText = rawText !== undefined ? cleanAnnouncementText(rawText) : undefined;
            const mergedBanners: BannerSettings = {
              ...DEFAULT_BANNERS,
              ...prev.banners,
              ...(remoteBanners || {}),
              topAnnouncementText: cleanText !== undefined ? cleanText : cleanAnnouncementText(prev.banners?.topAnnouncementText || '⚡ Welcome to Kintesi! Use coupon KINTESI10 for 10% OFF'),
              showTopAnnouncement: remoteBanners?.showTopAnnouncement !== undefined
                ? remoteBanners.showTopAnnouncement
                : (remoteBanners?.showAnnouncementBar !== undefined ? remoteBanners.showAnnouncementBar : prev.banners?.showTopAnnouncement !== false),
              isCustomAnnouncement: remoteBanners?.isCustomAnnouncement !== undefined
                ? remoteBanners.isCustomAnnouncement
                : Boolean(cleanText && cleanText !== '⚡ Welcome to Kintesi! Use coupon KINTESI10 for 10% OFF'),
            };

            const merged: StoreSettings = {
              storeName: data.storeName || prev.storeName,
              helplinePhone: data.helplinePhone || prev.helplinePhone,
              supportEmail: data.supportEmail || prev.supportEmail,
              bkashNumber: data.bkashNumber || prev.bkashNumber,
              bkashType: (data.bkashType || prev.bkashType) as any,
              nagadNumber: data.nagadNumber || prev.nagadNumber,
              nagadType: (data.nagadType || prev.nagadType) as any,
              rocketNumber: data.rocketNumber || prev.rocketNumber,
              rocketType: (data.rocketType || prev.rocketType) as any,
              deliveryFeeInsideDhaka: Number(data.deliveryFeeInsideDhaka ?? prev.deliveryFeeInsideDhaka),
              deliveryFeeOutsideDhaka: Number(data.deliveryFeeOutsideDhaka ?? prev.deliveryFeeOutsideDhaka),
              freeShippingThreshold: Number(data.freeShippingThreshold ?? prev.freeShippingThreshold),
              authorizedAdmins: data.authorizedAdmins || prev.authorizedAdmins || ['manage.kintesi@gmail.com'],
              banners: mergedBanners,
            };
            localStorage.setItem('kintesi_store_settings', JSON.stringify(merged));
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
    localStorage.setItem('kintesi_store_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    setIsLoading(true);
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('kintesi_store_settings', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'store_settings', 'default'), updated, { merge: true });
    } catch (err) {
      console.warn('Settings firestore sync notice:', err);
    } finally {
      setIsLoading(false);
      toast.success('Settings updated!');
    }
  };

  const updateBanners = async (newBanners: Partial<BannerSettings>) => {
    setIsLoading(true);
    const cleanedBanners = { ...newBanners };
    if (cleanedBanners.topAnnouncementText !== undefined) {
      cleanedBanners.topAnnouncementText = cleanAnnouncementText(cleanedBanners.topAnnouncementText);
    }
    const updatedBanners = { ...settings.banners, ...cleanedBanners };
    const updated = { ...settings, banners: updatedBanners };
    setSettings(updated);
    localStorage.setItem('kintesi_store_settings', JSON.stringify(updated));

    // Dispatch event so Navbar immediately updates
    window.dispatchEvent(new CustomEvent('kintesi_banners_updated', { detail: updatedBanners }));

    try {
      await setDoc(doc(db, 'store_settings', 'default'), { banners: updatedBanners }, { merge: true });
    } catch (err) {
      console.warn('Banner firestore sync notice:', err);
    } finally {
      setIsLoading(false);
      toast.success('Banners updated!');
    }
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

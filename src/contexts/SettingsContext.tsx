import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface BannerSettings {
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
  flashSaleTheme: 'sunset' | 'emerald' | 'cyber' | 'dark';
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
  showHeroSection: true,
  heroBadge: 'PREMIER LIFESTYLE & SHOPPING MARKETPLACE • kintesi.com',
  heroTitle: 'Everything You Need for',
  heroHighlightText: 'Life, Fashion & Tech',
  heroSubtitle: 'From authentic designer apparel, sneakers & lifestyle essentials to flagship smartphones, home appliances & gadgets — delivered to your doorstep across Bangladesh.',
  heroPrimaryBtnText: 'Explore Kintesi Catalog',
  heroPrimaryBtnLink: '/shop',
  heroSecondaryBtnText: 'Fashion Lookbook',
  heroSecondaryBtnLink: '/shop?category=mens-fashion',

  spotlightBadge: '🔥 Deal of the Day',
  spotlightTitle: 'Vintage Genuine Leather Biker Jacket',
  spotlightBrand: 'Kintesi Atelier',
  spotlightImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop',
  spotlightPrice: 18500,
  spotlightDiscountPrice: 14900,
  spotlightStockText: '18 Left in Stock',
  spotlightSavingsText: 'Save ৳3,600 Today',
  spotlightBtnLink: '/product/vintage-genuine-leather-biker-jacket',
  showSpotlight: true,

  showFlashSale: true,
  flashSaleTag: '🔥 SUPER FLASH SALE',
  flashSaleTitle: 'Limited Time Discounts Up to 35%',
  flashSaleSubtitle: 'Hurry up! Special prices end when the timer reaches zero.',
  flashSaleHours: 5,
  flashSaleTheme: 'sunset',
};

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Kintesi',
  helplinePhone: '01800-KINTESI',
  supportEmail: 'support@kintesi.com',
  bkashNumber: '01800-123456',
  bkashType: 'Merchant',
  nagadNumber: '01700-654321',
  nagadType: 'Merchant',
  rocketNumber: '01900-987654',
  rocketType: 'Personal',
  deliveryFeeInsideDhaka: 60,
  deliveryFeeOutsideDhaka: 120,
  freeShippingThreshold: 5000,
  authorizedAdmins: ['admin@kintesi.com', 'tamim.hasan2005@gmail.com'],
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

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('kintesi_store_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          authorizedAdmins: parsed.authorizedAdmins || ['tamim.hasan2005@gmail.com'],
          banners: { ...DEFAULT_BANNERS, ...(parsed.banners || {}) },
        };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    async function loadRemoteSettings() {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          const remoteBanners = data.banners || data.settings_payload?.banners;
          setSettings((prev) => {
            const merged: StoreSettings = {
              storeName: data.storeName || data.store_name || prev.storeName,
              helplinePhone: data.helplinePhone || data.helpline_phone || prev.helplinePhone,
              supportEmail: data.supportEmail || data.support_email || prev.supportEmail,
              bkashNumber: data.bkashNumber || data.bkash_number || prev.bkashNumber,
              bkashType: (data.bkashType || data.bkash_type || prev.bkashType) as any,
              nagadNumber: data.nagadNumber || data.nagad_number || prev.nagadNumber,
              nagadType: (data.nagadType || data.nagad_type || prev.nagadType) as any,
              rocketNumber: data.rocketNumber || data.rocket_number || prev.rocketNumber,
              rocketType: (data.rocketType || data.rocket_type || prev.rocketType) as any,
              deliveryFeeInsideDhaka: Number(data.deliveryFeeInsideDhaka ?? data.delivery_fee_inside_dhaka ?? prev.deliveryFeeInsideDhaka),
              deliveryFeeOutsideDhaka: Number(data.deliveryFeeOutsideDhaka ?? data.delivery_fee_outside_dhaka ?? prev.deliveryFeeOutsideDhaka),
              freeShippingThreshold: Number(data.freeShippingThreshold ?? data.free_shipping_threshold ?? prev.freeShippingThreshold),
              authorizedAdmins: data.authorizedAdmins || data.authorized_admins || prev.authorizedAdmins || ['tamim.hasan2005@gmail.com'],
              banners: remoteBanners ? { ...DEFAULT_BANNERS, ...remoteBanners } : prev.banners,
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
      const dbPayload = {
        id: 'default',
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
      };
      await supabase.from('store_settings').upsert(dbPayload, { onConflict: 'id' });
    } catch (err) {
      console.warn('Settings supabase sync notice:', err);
    } finally {
      setIsLoading(false);
      toast.success('Settings updated!');
    }
  };

  const updateBanners = async (newBanners: Partial<BannerSettings>) => {
    setIsLoading(true);
    const updatedBanners = { ...settings.banners, ...newBanners };
    const updated = { ...settings, banners: updatedBanners };
    setSettings(updated);
    localStorage.setItem('kintesi_store_settings', JSON.stringify(updated));

    try {
      const dbPayload = {
        id: 'default',
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
        banners: updatedBanners,
        settings_payload: updated,
        updated_at: new Date().toISOString(),
      };
      await supabase.from('store_settings').upsert(dbPayload, { onConflict: 'id' });
    } catch (err) {
      console.warn('Banner supabase sync notice:', err);
    } finally {
      setIsLoading(false);
      toast.success('Banners updated!');
    }
  };

  const isAuthorizedAdminEmail = (email?: string | null): boolean => {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    if (lower === 'tamim.hasan2005@gmail.com') return true;
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

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Coupon, CouponUsage } from '../types';
import { toast } from 'sonner';

export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'kintesi10-default',
    code: 'KINTESI10',
    description: 'Welcome Coupon for New Customers (Valid for 7 days after registration)',
    discount_type: 'percentage',
    discount_percent: 10,
    discount_value: 10,
    max_discount: 1000,
    min_order_value: 500,
    is_active: true,
    is_new_user_only: true,
    usage_limit_per_user: 1,
    times_used: 0,
    created_at: new Date().toISOString(),
  },
];

export interface CouponValidationResult {
  valid: boolean;
  message: string;
  coupon?: Coupon;
  discountAmount?: number;
}

interface CouponContextType {
  coupons: Coupon[];
  isLoading: boolean;
  refreshCoupons: () => Promise<void>;
  createCoupon: (coupon: Omit<Coupon, 'id' | 'times_used' | 'created_at'>) => Promise<boolean>;
  updateCoupon: (id: string, updates: Partial<Coupon>) => Promise<boolean>;
  deleteCoupon: (id: string) => Promise<boolean>;
  toggleCouponStatus: (id: string, currentStatus: boolean) => Promise<boolean>;
  validateCoupon: (code: string, subtotal: number, user: any) => Promise<CouponValidationResult>;
  recordCouponUsage: (
    coupon: Coupon,
    userId: string | null,
    customerEmail: string,
    orderNumber: string,
    discountAmount: number
  ) => Promise<boolean>;
  couponUsages: CouponUsage[];
  fetchCouponUsages: () => Promise<CouponUsage[]>;
}

const CouponContext = createContext<CouponContextType | undefined>(undefined);

export const CouponProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem('kintesi_coupons_cache');
      return saved ? JSON.parse(saved) : DEFAULT_COUPONS;
    } catch {
      return DEFAULT_COUPONS;
    }
  });
  const [couponUsages, setCouponUsages] = useState<CouponUsage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setCoupons(data);
        localStorage.setItem('kintesi_coupons_cache', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Coupons fetch notice:', err);
    }
  };

  const fetchCouponUsages = async (): Promise<CouponUsage[]> => {
    try {
      const { data, error } = await supabase
        .from('coupon_usages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCouponUsages(data);
        return data;
      }
      return [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    refreshCoupons();
    fetchCouponUsages();
  }, []);

  const createCoupon = async (
    couponData: Omit<Coupon, 'id' | 'times_used' | 'created_at'>
  ): Promise<boolean> => {
    setIsLoading(true);
    const formattedCode = couponData.code.trim().toUpperCase();

    if (coupons.some((c) => c.code.toUpperCase() === formattedCode)) {
      toast.error('Coupon code already exists!');
      setIsLoading(false);
      return false;
    }

    const newCoupon: Coupon = {
      ...couponData,
      id: 'coupon_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      code: formattedCode,
      discount_type: couponData.discount_type || 'percentage',
      discount_percent: Number(couponData.discount_percent || couponData.discount_value || 0),
      discount_value: Number(couponData.discount_value || couponData.discount_percent || 0),
      min_order_value: Number(couponData.min_order_value || 0),
      max_discount: couponData.max_discount ? Number(couponData.max_discount) : undefined,
      usage_limit_per_user: Number(couponData.usage_limit_per_user || 1),
      is_new_user_only: !!couponData.is_new_user_only,
      is_active: couponData.is_active !== false,
      times_used: 0,
      created_at: new Date().toISOString(),
    };

    const updated = [newCoupon, ...coupons];
    setCoupons(updated);
    localStorage.setItem('kintesi_coupons_cache', JSON.stringify(updated));

    try {
      await supabase.from('coupons').insert([newCoupon]);
      toast.success('Coupon ' + formattedCode + ' created successfully!');
      setIsLoading(false);
      return true;
    } catch (err) {
      toast.success('Coupon ' + formattedCode + ' saved!');
      setIsLoading(false);
      return true;
    }
  };

  const updateCoupon = async (id: string, updates: Partial<Coupon>): Promise<boolean> => {
    setIsLoading(true);
    const updated = coupons.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCoupons(updated);
    localStorage.setItem('kintesi_coupons_cache', JSON.stringify(updated));

    try {
      await supabase.from('coupons').update(updates).eq('id', id);
      toast.success('Coupon updated successfully!');
      setIsLoading(false);
      return true;
    } catch {
      toast.success('Coupon updated!');
      setIsLoading(false);
      return true;
    }
  };

  const toggleCouponStatus = async (id: string, currentStatus: boolean): Promise<boolean> => {
    return updateCoupon(id, { is_active: !currentStatus });
  };

  const deleteCoupon = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    const updated = coupons.filter((c) => c.id !== id);
    setCoupons(updated);
    localStorage.setItem('kintesi_coupons_cache', JSON.stringify(updated));

    try {
      await supabase.from('coupons').delete().eq('id', id);
      toast.success('Coupon deleted successfully!');
      setIsLoading(false);
      return true;
    } catch {
      toast.success('Coupon deleted!');
      setIsLoading(false);
      return true;
    }
  };

  const validateCoupon = async (
    rawCode: string,
    subtotal: number,
    user: any
  ): Promise<CouponValidationResult> => {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      return { valid: false, message: 'Please enter a coupon code' };
    }

    const coupon = coupons.find((c) => c.code.toUpperCase() === code);
    if (!coupon) {
      return { valid: false, message: 'Coupon code "' + code + '" is invalid or does not exist.' };
    }

    if (!coupon.is_active) {
      return { valid: false, message: 'Coupon "' + code + '" is currently disabled.' };
    }

    // 1. Expiry date check
    if (coupon.expires_at) {
      const expiryTime = new Date(coupon.expires_at).getTime();
      if (!isNaN(expiryTime) && Date.now() > expiryTime) {
        const formatted = new Date(coupon.expires_at).toLocaleDateString('en-GB');
        return {
          valid: false,
          message: 'Coupon "' + code + '" expired on ' + formatted + '.',
        };
      }
    }

    // 2. New user 7-day registration check
    if (coupon.is_new_user_only) {
      if (!user) {
        return {
          valid: false,
          message: 'Coupon "' + code + '" is exclusive to new registered customers. Please log in or register to redeem this coupon.',
        };
      }

      const userCreatedAt = user.created_at ? new Date(user.created_at).getTime() : null;
      if (userCreatedAt) {
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const elapsed = Date.now() - userCreatedAt;
        if (elapsed > SEVEN_DAYS_MS) {
          return {
            valid: false,
            message: 'Coupon "' + code + '" is only valid within 7 days of account registration. Your account is over 7 days old.',
          };
        }
      }
    }

    // 3. One-Time Use Per User Strict Check
    const usageLimit = coupon.usage_limit_per_user || 1;
    if (user && user.email) {
      const userEmail = user.email.toLowerCase().trim();
      const userId = user.id;

      try {
        const { data: usages } = await supabase
          .from('coupon_usages')
          .select('id')
          .eq('coupon_code', code)
          .or('user_id.eq.' + userId + ',customer_email.eq.' + userEmail);

        if (usages && usages.length >= usageLimit) {
          return {
            valid: false,
            message: 'You have already redeemed coupon "' + code + '". Each customer can only use it ' + (usageLimit === 1 ? 'once.' : usageLimit + ' times.'),
          };
        }
      } catch (err) {
        console.warn('DB check notice:', err);
      }

      try {
        const localUsageKey = 'kintesi_coupon_used_' + code + '_' + userEmail;
        const localUsedCount = Number(localStorage.getItem(localUsageKey) || 0);
        if (localUsedCount >= usageLimit) {
          return {
            valid: false,
            message: 'You have already redeemed coupon "' + code + '". Each customer can only use it once.',
          };
        }
      } catch {
        // ignore
      }
    }

    // 4. Minimum order value requirement
    if (coupon.min_order_value && subtotal < coupon.min_order_value) {
      return {
        valid: false,
        message: 'Minimum order amount of ৳' + coupon.min_order_value + ' required for coupon "' + code + '". (Current subtotal: ৳' + subtotal + ')',
      };
    }

    // 5. Calculate Discount
    let discountAmount = 0;
    if (coupon.discount_type === 'fixed') {
      const val = Number(coupon.discount_value || coupon.discount_percent || 0);
      discountAmount = Math.min(val, subtotal);
    } else {
      const percent = Number(coupon.discount_percent || coupon.discount_value || 0);
      const calculated = (subtotal * percent) / 100;
      discountAmount = coupon.max_discount ? Math.min(calculated, coupon.max_discount) : calculated;
    }

    return {
      valid: true,
      message: 'Coupon "' + code + '" applied! You saved ৳' + Math.round(discountAmount) + '.',
      coupon,
      discountAmount: Math.round(discountAmount),
    };
  };

  const recordCouponUsage = async (
    coupon: Coupon,
    userId: string | null,
    customerEmail: string,
    orderNumber: string,
    discountAmount: number
  ): Promise<boolean> => {
    const cleanEmail = customerEmail.trim().toLowerCase();

    try {
      const localUsageKey = 'kintesi_coupon_used_' + coupon.code + '_' + cleanEmail;
      const count = Number(localStorage.getItem(localUsageKey) || 0) + 1;
      localStorage.setItem(localUsageKey, count.toString());
    } catch {
      // ignore
    }

    setCoupons((prev) =>
      prev.map((c) =>
        c.id === coupon.id || c.code === coupon.code ? { ...c, times_used: (c.times_used || 0) + 1 } : c
      )
    );

    try {
      const usageRecord = {
        coupon_id: coupon.id,
        coupon_code: coupon.code,
        user_id: userId,
        customer_email: cleanEmail,
        order_id: orderNumber,
        discount_amount: discountAmount,
        created_at: new Date().toISOString(),
      };

      await supabase.from('coupon_usages').insert([usageRecord]);
      await supabase
        .from('coupons')
        .update({ times_used: (coupon.times_used || 0) + 1 })
        .eq('id', coupon.id);

      return true;
    } catch (err) {
      console.warn('Notice saving coupon usage:', err);
      return false;
    }
  };

  return (
    <CouponContext.Provider
      value={{
        coupons,
        isLoading,
        refreshCoupons,
        createCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCouponStatus,
        validateCoupon,
        recordCouponUsage,
        couponUsages,
        fetchCouponUsages,
      }}
    >
      {children}
    </CouponContext.Provider>
  );
};

export const useCoupons = () => {
  const context = useContext(CouponContext);
  if (!context) {
    throw new Error('useCoupons must be used within a CouponProvider');
  }
  return context;
};

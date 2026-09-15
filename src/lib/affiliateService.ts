import { supabase } from './supabase';
import { AffiliateUser, AffiliateWithdrawal, Product } from '../types';

const AFFILIATES_CACHE_KEY = 'kintesi_affiliates_cache';
const WITHDRAWALS_CACHE_KEY = 'kintesi_affiliate_withdrawals_cache';
const ACTIVE_REFERRAL_KEY = 'kintesi_active_affiliate_ref';
const REFERRAL_EXPIRY_DAYS = 30;

// No fake/demo users. Starts empty until real users register.
const DEFAULT_AFFILIATES: AffiliateUser[] = [];
const DEFAULT_WITHDRAWALS: AffiliateWithdrawal[] = [];

// Helper: Generate a unique affiliate code
export function generateAffiliateCode(): string {
  const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `KAF-${randomChars}`;
}

// 1. Get All Affiliates
export async function getAffiliatesFromDB(): Promise<AffiliateUser[]> {
  try {
    const { data, error } = await supabase
      .from('affiliate_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const clean = data.filter((a: any) => !a.id?.startsWith('aff_demo_'));

      // Check if there are local affiliates in localStorage that haven't been synced to Supabase yet
      try {
        const cached = localStorage.getItem(AFFILIATES_CACHE_KEY);
        if (cached) {
          const localList: AffiliateUser[] = JSON.parse(cached);
          const unsynced = localList.filter(
            (loc) =>
              loc.id &&
              !loc.id.startsWith('aff_demo_') &&
              !clean.some((db) => db.id === loc.id || db.affiliate_code === loc.affiliate_code)
          );
          if (unsynced.length > 0) {
            for (const item of unsynced) {
              await supabase.from('affiliate_users').upsert([item]);
              clean.unshift(item);
            }
          }
        }
      } catch (syncErr) {
        console.warn('Affiliate local sync notice:', syncErr);
      }

      localStorage.setItem(AFFILIATES_CACHE_KEY, JSON.stringify(clean));
      return clean as AffiliateUser[];
    } else if (error) {
      console.warn('Supabase fetch affiliates error:', error.message);
    }
  } catch (err) {
    console.warn('Supabase fetch affiliates notice, using local cache:', err);
  }

  // Local storage fallback
  try {
    const cached = localStorage.getItem(AFFILIATES_CACHE_KEY);
    if (cached) {
      const parsed: AffiliateUser[] = JSON.parse(cached);
      const clean = parsed.filter((a) => !a.id?.startsWith('aff_demo_'));
      if (clean.length !== parsed.length) {
        localStorage.setItem(AFFILIATES_CACHE_KEY, JSON.stringify(clean));
      }
      return clean;
    }
  } catch {}

  localStorage.setItem(AFFILIATES_CACHE_KEY, JSON.stringify([]));
  return [];
}

// 2. Get Single Affiliate by Code
export async function getAffiliateByCode(code: string): Promise<AffiliateUser | null> {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();
  const all = await getAffiliatesFromDB();
  return all.find((a) => a.affiliate_code.toUpperCase() === cleanCode) || null;
}

// 3. Register or Find Affiliate
export async function registerAffiliate(payload: {
  name: string;
  phone: string;
  address: string;
  email?: string;
  user_id?: string | null;
  payment_method?: 'bkash' | 'nagad' | 'rocket' | 'bank';
  account_number?: string;
}): Promise<AffiliateUser> {
  const all = await getAffiliatesFromDB();

  // Check if already registered by phone or user_id
  const existing = all.find(
    (a) =>
      (payload.phone && a.phone === payload.phone.trim()) ||
      (payload.user_id && a.user_id === payload.user_id)
  );

  if (existing) {
    return existing;
  }

  const newAffiliate: AffiliateUser = {
    id: `aff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: payload.user_id ? String(payload.user_id) : null,
    affiliate_code: generateAffiliateCode(),
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    address: payload.address.trim(),
    email: payload.email?.trim() || '',
    status: 'approved', // Instant access so they can start immediately
    total_clicks: 0,
    total_orders: 0,
    total_sales_amount: 0,
    total_commission_earned: 0,
    available_balance: 0,
    total_withdrawn: 0,
    payment_method: payload.payment_method || 'bkash',
    account_number: payload.account_number?.trim() || payload.phone.trim(),
    created_at: new Date().toISOString(),
  };

  // 1. Try Supabase
  try {
    const { error } = await supabase.from('affiliate_users').upsert([newAffiliate]);
    if (error) {
      console.error('Supabase upsert affiliate notice:', error.message);
    }
  } catch (err) {
    console.warn('Supabase insert affiliate notice:', err);
  }

  // 2. Save locally
  const updated = [newAffiliate, ...all];
  localStorage.setItem(AFFILIATES_CACHE_KEY, JSON.stringify(updated));
  localStorage.setItem('kintesi_my_affiliate_profile', JSON.stringify(newAffiliate));
  window.dispatchEvent(new Event('kintesi_affiliates_updated'));

  return newAffiliate;
}

// 4. Update Affiliate
export async function updateAffiliateInDB(
  id: string,
  updates: Partial<AffiliateUser>
): Promise<boolean> {
  const all = await getAffiliatesFromDB();
  const updatedList = all.map((a) => (a.id === id ? { ...a, ...updates } : a));
  localStorage.setItem(AFFILIATES_CACHE_KEY, JSON.stringify(updatedList));

  // Update current user cache if this is the active partner
  try {
    const current = localStorage.getItem('kintesi_my_affiliate_profile');
    if (current) {
      const parsed = JSON.parse(current);
      if (parsed.id === id) {
        localStorage.setItem('kintesi_my_affiliate_profile', JSON.stringify({ ...parsed, ...updates }));
      }
    }
  } catch {}

  try {
    const { error } = await supabase.from('affiliate_users').update(updates).eq('id', id);
    if (error) {
      console.error('Supabase update affiliate error:', error.message);
    }
  } catch (err) {
    console.warn('Supabase update affiliate notice:', err);
  }

  window.dispatchEvent(new Event('kintesi_affiliates_updated'));
  return true;
}

// 5. Delete / Remove Affiliate
export async function deleteAffiliateInDB(id: string): Promise<boolean> {
  const all = await getAffiliatesFromDB();
  const updatedList = all.filter((a) => a.id !== id);
  localStorage.setItem(AFFILIATES_CACHE_KEY, JSON.stringify(updatedList));

  // Clear if it was active user in current browser
  try {
    const current = localStorage.getItem('kintesi_my_affiliate_profile');
    if (current) {
      const parsed = JSON.parse(current);
      if (parsed.id === id) {
        localStorage.removeItem('kintesi_my_affiliate_profile');
      }
    }
  } catch {}

  try {
    const { error } = await supabase.from('affiliate_users').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete affiliate error:', error.message);
    }
  } catch (err) {
    console.warn('Supabase delete affiliate notice:', err);
  }

  window.dispatchEvent(new Event('kintesi_affiliates_updated'));
  return true;
}

// 6. Toggle Ban / Suspend Status
export async function toggleBanAffiliateInDB(id: string, currentStatus: string): Promise<boolean> {
  const newStatus = currentStatus === 'suspended' ? 'approved' : 'suspended';
  return updateAffiliateInDB(id, { status: newStatus as any });
}

// 5. Track Referral Click
export async function recordAffiliateClick(affiliateCode: string, productId?: string): Promise<void> {
  if (!affiliateCode) return;
  const clean = affiliateCode.trim().toUpperCase();
  const partner = await getAffiliateByCode(clean);
  if (!partner) return;

  // Update stats
  const nextClicks = (partner.total_clicks || 0) + 1;
  await updateAffiliateInDB(partner.id, { total_clicks: nextClicks });

  // Try saving click log
  try {
    await supabase.from('affiliate_clicks').insert([
      {
        affiliate_code: clean,
        product_id: productId || null,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch {}
}

// 6. Record Referral Sale & Credit Commission
export async function recordAffiliateSale(
  affiliateCode: string,
  orderNumber: string,
  orderTotal: number,
  commissionAmount: number
): Promise<boolean> {
  if (!affiliateCode || commissionAmount <= 0) return false;
  const clean = affiliateCode.trim().toUpperCase();
  const partner = await getAffiliateByCode(clean);
  if (!partner) return false;
  if (partner.status === 'suspended') {
    console.warn(`Partner ${clean} is suspended (banned). Commission not credited.`);
    return false;
  }

  const nextOrders = (partner.total_orders || 0) + 1;
  const nextSales = (partner.total_sales_amount || 0) + orderTotal;
  const nextEarned = (partner.total_commission_earned || 0) + commissionAmount;
  const nextBalance = (partner.available_balance || 0) + commissionAmount;

  await updateAffiliateInDB(partner.id, {
    total_orders: nextOrders,
    total_sales_amount: nextSales,
    total_commission_earned: nextEarned,
    available_balance: nextBalance,
  });

  return true;
}

// 7. Withdrawals Management
export async function getWithdrawalsFromDB(): Promise<AffiliateWithdrawal[]> {
  try {
    const { data, error } = await supabase
      .from('affiliate_withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const clean = data.filter((w: any) => !w.id?.startsWith('with_demo_'));
      localStorage.setItem(WITHDRAWALS_CACHE_KEY, JSON.stringify(clean));
      return clean as AffiliateWithdrawal[];
    }
  } catch (err) {
    console.warn('Supabase fetch withdrawals notice:', err);
  }

  try {
    const cached = localStorage.getItem(WITHDRAWALS_CACHE_KEY);
    if (cached) {
      const parsed: AffiliateWithdrawal[] = JSON.parse(cached);
      const clean = parsed.filter((w) => !w.id?.startsWith('with_demo_'));
      if (clean.length !== parsed.length) {
        localStorage.setItem(WITHDRAWALS_CACHE_KEY, JSON.stringify(clean));
      }
      return clean;
    }
  } catch {}

  localStorage.setItem(WITHDRAWALS_CACHE_KEY, JSON.stringify([]));
  return [];
}

// 8. Create Withdrawal Request
export async function createWithdrawalRequest(payload: {
  affiliate_id: string;
  affiliate_code: string;
  affiliate_name: string;
  affiliate_phone: string;
  amount: number;
  payment_method: 'bkash' | 'nagad' | 'rocket' | 'bank';
  account_number: string;
  notes?: string;
}): Promise<AffiliateWithdrawal> {
  const newReq: AffiliateWithdrawal = {
    id: `with_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    affiliate_id: payload.affiliate_id,
    affiliate_code: payload.affiliate_code,
    affiliate_name: payload.affiliate_name,
    affiliate_phone: payload.affiliate_phone,
    amount: payload.amount,
    payment_method: payload.payment_method,
    account_number: payload.account_number,
    notes: payload.notes || '',
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from('affiliate_withdrawals').insert([newReq]);
  } catch (err) {
    console.warn('Supabase insert withdrawal notice:', err);
  }

  const all = await getWithdrawalsFromDB();
  const updated = [newReq, ...all];
  localStorage.setItem(WITHDRAWALS_CACHE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('kintesi_withdrawals_updated'));

  return newReq;
}

// 9. Process Withdrawal Status (Admin Confirm/Reject)
export async function processWithdrawalInDB(
  id: string,
  status: 'approved' | 'rejected',
  adminTrxId?: string,
  adminNote?: string
): Promise<boolean> {
  const all = await getWithdrawalsFromDB();
  const target = all.find((w) => w.id === id);
  if (!target) return false;

  const now = new Date().toISOString();
  const updatedList = all.map((w) =>
    w.id === id
      ? {
          ...w,
          status,
          admin_trx_id: adminTrxId || w.admin_trx_id,
          admin_note: adminNote || w.admin_note,
          processed_at: now,
        }
      : w
  );
  localStorage.setItem(WITHDRAWALS_CACHE_KEY, JSON.stringify(updatedList));

  // If approved, deduct available balance and increase total_withdrawn for the partner
  const affiliates = await getAffiliatesFromDB();
  const partner = affiliates.find((a) => a.id === target.affiliate_id);
  if (partner) {
    if (status === 'approved') {
      const nextBal = Math.max(0, (partner.available_balance || 0) - target.amount);
      const nextWithdrawn = (partner.total_withdrawn || 0) + target.amount;
      await updateAffiliateInDB(partner.id, {
        available_balance: nextBal,
        total_withdrawn: nextWithdrawn,
      });
    }
  }

  try {
    await supabase
      .from('affiliate_withdrawals')
      .update({
        status,
        admin_trx_id: adminTrxId || null,
        admin_note: adminNote || null,
        processed_at: now,
      })
      .eq('id', id);
  } catch (err) {
    console.warn('Supabase update withdrawal notice:', err);
  }

  window.dispatchEvent(new Event('kintesi_withdrawals_updated'));
  return true;
}

// 10. Active Referral Cookie / LocalStorage Helpers
export function setActiveAffiliateReferral(code: string): void {
  if (!code) return;
  const payload = {
    code: code.trim().toUpperCase(),
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(ACTIVE_REFERRAL_KEY, JSON.stringify(payload));
  } catch {}
}

export function getActiveAffiliateReferral(): string | null {
  try {
    const raw = localStorage.getItem(ACTIVE_REFERRAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const maxAgeMs = REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > maxAgeMs) {
      localStorage.removeItem(ACTIVE_REFERRAL_KEY);
      return null;
    }
    return parsed.code || null;
  } catch {
    return null;
  }
}

// 11. Calculate Product Commission Info
export function getProductAffiliateInfo(product: Product): {
  isApplicable: boolean;
  rate: number;
  price: number;
  commissionAmount: number;
} {
  const price = product.discount_price || product.price || 0;
  // If product explicitly has is_affiliate_enabled === true
  const isApplicable = Boolean(product.is_affiliate_enabled);
  const rate = isApplicable ? (product.affiliate_commission_rate || 10) : 0;
  const commissionAmount = isApplicable ? Math.round((price * rate) / 100) : 0;

  return {
    isApplicable,
    rate,
    price,
    commissionAmount,
  };
}

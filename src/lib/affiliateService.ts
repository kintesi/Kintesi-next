import { supabase } from './supabase';
import { AffiliateUser, AffiliateWithdrawal, Product, GeneratedAffiliateProduct } from '../types';

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
  const codeMap = new Map<string, AffiliateUser>();
  let supabaseSuccess = false;

  // 1. Fetch from Supabase FIRST (Authoritative source of truth)
  try {
    const { data, error } = await supabase
      .from('affiliate_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      supabaseSuccess = true;
      data.forEach((a: AffiliateUser) => {
        if (a && a.affiliate_code && !a.id?.startsWith('aff_demo_')) {
          codeMap.set(a.affiliate_code.toUpperCase(), a);
        }
      });
    } else if (error) {
      console.warn('Supabase fetch affiliates notice:', error.message);
    }
  } catch (err) {
    console.warn('Supabase fetch affiliates notice:', err);
  }

  if (supabaseSuccess) {
    // Supabase is authoritative: synchronize local storage and prune deleted accounts
    try {
      const myProfileRaw = localStorage.getItem('kintesi_my_affiliate_profile');
      if (myProfileRaw) {
        const myProfile: AffiliateUser = JSON.parse(myProfileRaw);
        if (myProfile && myProfile.affiliate_code && !myProfile.id?.startsWith('aff_demo_')) {
          const code = myProfile.affiliate_code.toUpperCase();
          if (codeMap.has(code)) {
            localStorage.setItem('kintesi_my_affiliate_profile', JSON.stringify(codeMap.get(code)!));
          } else {
            // Profile was deleted from Supabase; prune from local storage
            localStorage.removeItem('kintesi_my_affiliate_profile');
          }
        }
      }
      localStorage.setItem(AFFILIATES_CACHE_KEY, JSON.stringify(Array.from(codeMap.values())));
    } catch {}
  } else {
    // Offline fallback only when Supabase is down
    try {
      const myProfileRaw = localStorage.getItem('kintesi_my_affiliate_profile');
      if (myProfileRaw) {
        const myProfile: AffiliateUser = JSON.parse(myProfileRaw);
        if (myProfile && myProfile.affiliate_code && !myProfile.id?.startsWith('aff_demo_')) {
          codeMap.set(myProfile.affiliate_code.toUpperCase(), myProfile);
        }
      }
    } catch {}

    try {
      const cached = localStorage.getItem(AFFILIATES_CACHE_KEY);
      if (cached) {
        const parsed: AffiliateUser[] = JSON.parse(cached);
        parsed.forEach((a) => {
          if (a && a.affiliate_code && !a.id?.startsWith('aff_demo_')) {
            const code = a.affiliate_code.toUpperCase();
            if (!codeMap.has(code)) {
              codeMap.set(code, a);
            }
          }
        });
      }
    } catch {}
  }

  const getTime = (d?: string) => {
    if (!d) return 0;
    try {
      const t = new Date(d).getTime();
      return isNaN(t) ? 0 : t;
    } catch {
      return 0;
    }
  };

  const result = Array.from(codeMap.values()).sort(
    (a, b) => getTime(b?.created_at) - getTime(a?.created_at)
  );

  localStorage.setItem(AFFILIATES_CACHE_KEY, JSON.stringify(result));
  return result;
}

// 2. Get Single Affiliate by Code (Direct Supabase query for real-time accuracy)
export async function getAffiliateByCode(code: string): Promise<AffiliateUser | null> {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();

  try {
    const { data, error } = await supabase
      .from('affiliate_users')
      .select('*')
      .eq('affiliate_code', cleanCode)
      .maybeSingle();

    if (!error && data) {
      return data as AffiliateUser;
    }
  } catch {}

  const all = await getAffiliatesFromDB();
  return all.find((a) => a.affiliate_code?.toUpperCase() === cleanCode) || null;
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

  // 1. Direct fetch and increment in Supabase
  try {
    const { data: dbUser } = await supabase
      .from('affiliate_users')
      .select('*')
      .eq('affiliate_code', clean)
      .maybeSingle();

    if (dbUser) {
      const nextClicks = (Number(dbUser.total_clicks) || 0) + 1;
      await supabase
        .from('affiliate_users')
        .update({ total_clicks: nextClicks })
        .eq('id', dbUser.id);
    }

    // 2. Insert click log
    await supabase.from('affiliate_clicks').insert([
      {
        affiliate_code: clean,
        product_id: productId || null,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.warn('Supabase record click notice:', err);
  }

  // 3. Update local caches immediately
  try {
    const current = localStorage.getItem('kintesi_my_affiliate_profile');
    if (current) {
      const parsed = JSON.parse(current);
      if (parsed.affiliate_code?.toUpperCase() === clean) {
        parsed.total_clicks = (Number(parsed.total_clicks) || 0) + 1;
        localStorage.setItem('kintesi_my_affiliate_profile', JSON.stringify(parsed));
      }
    }
  } catch {}

  window.dispatchEvent(new Event('kintesi_affiliates_updated'));
}

// 6. Record Referral Order Placement (Increments total_orders and total_sales_amount)
export async function recordAffiliateOrderPlaced(
  affiliateCode: string,
  orderNumber: string,
  orderTotal: number,
  commissionAmount: number = 0
): Promise<boolean> {
  if (!affiliateCode) return false;
  const clean = affiliateCode.trim().toUpperCase();

  try {
    const { data: dbUser } = await supabase
      .from('affiliate_users')
      .select('*')
      .eq('affiliate_code', clean)
      .maybeSingle();

    if (dbUser) {
      if (dbUser.status === 'suspended') {
        console.warn(`Partner ${clean} is suspended (banned). Referral order not recorded.`);
        return false;
      }

      const nextOrders = (Number(dbUser.total_orders) || 0) + 1;
      const nextSales = (Number(dbUser.total_sales_amount) || 0) + (Number(orderTotal) || 0);

      await supabase
        .from('affiliate_users')
        .update({
          total_orders: nextOrders,
          total_sales_amount: nextSales,
        })
        .eq('id', dbUser.id);
    }
  } catch (err) {
    console.warn('Supabase record order notice:', err);
  }

  // Update local caches
  try {
    const current = localStorage.getItem('kintesi_my_affiliate_profile');
    if (current) {
      const parsed = JSON.parse(current);
      if (parsed.affiliate_code?.toUpperCase() === clean) {
        parsed.total_orders = (Number(parsed.total_orders) || 0) + 1;
        parsed.total_sales_amount = (Number(parsed.total_sales_amount) || 0) + (Number(orderTotal) || 0);
        localStorage.setItem('kintesi_my_affiliate_profile', JSON.stringify(parsed));
      }
    }
  } catch {}

  window.dispatchEvent(new Event('kintesi_affiliates_updated'));
  return true;
}

// Alias for backward compatibility
export async function recordAffiliateSale(
  affiliateCode: string,
  orderNumber: string,
  orderTotal: number,
  commissionAmount: number
): Promise<boolean> {
  return recordAffiliateOrderPlaced(affiliateCode, orderNumber, orderTotal, commissionAmount);
}

// 7. Confirm & Credit Commission When Order is Delivered ("ar delevery sonfirm holew na")
export async function confirmAffiliateCommissionOnDelivery(
  order: {
    order_number: string;
    affiliate_code?: string | null;
    affiliate_commission?: number | null;
    affiliate_commission_amount?: number | null;
    affiliate_commission_credited?: boolean | null;
  }
): Promise<boolean> {
  const code = order.affiliate_code?.trim().toUpperCase();
  if (!code) return false;

  // Prevent double crediting for the same order
  const creditedOrdersKey = 'kintesi_affiliate_credited_orders';
  let creditedList: string[] = [];
  try {
    creditedList = JSON.parse(localStorage.getItem(creditedOrdersKey) || '[]');
  } catch {}

  if (creditedList.includes(order.order_number) || order.affiliate_commission_credited) {
    console.log(`Commission for order #${order.order_number} was already credited.`);
    return false;
  }

  const commission = Number(order.affiliate_commission || order.affiliate_commission_amount) || 0;
  if (commission <= 0) return false;

  try {
    // 1. Fetch partner in Supabase
    const { data: dbUser } = await supabase
      .from('affiliate_users')
      .select('*')
      .eq('affiliate_code', code)
      .maybeSingle();

    if (dbUser) {
      if (dbUser.status === 'suspended') {
        console.warn(`Partner ${code} is suspended. Commission not credited.`);
        return false;
      }

      const nextEarned = (Number(dbUser.total_commission_earned) || 0) + commission;
      const nextBalance = (Number(dbUser.available_balance) || 0) + commission;

      await supabase
        .from('affiliate_users')
        .update({
          total_commission_earned: nextEarned,
          available_balance: nextBalance,
        })
        .eq('id', dbUser.id);
    }

    // 2. Mark order as credited in Supabase
    try {
      await supabase
        .from('orders')
        .update({ affiliate_commission_credited: true })
        .eq('order_number', order.order_number);
    } catch {}

    // 3. Mark in local credited list
    creditedList.push(order.order_number);
    localStorage.setItem(creditedOrdersKey, JSON.stringify(creditedList));

    // 4. Update local cache
    const current = localStorage.getItem('kintesi_my_affiliate_profile');
    if (current) {
      const parsed = JSON.parse(current);
      if (parsed.affiliate_code?.toUpperCase() === code) {
        parsed.total_commission_earned = (Number(parsed.total_commission_earned) || 0) + commission;
        parsed.available_balance = (Number(parsed.available_balance) || 0) + commission;
        localStorage.setItem('kintesi_my_affiliate_profile', JSON.stringify(parsed));
      }
    }
  } catch (err) {
    console.warn('Error crediting delivery commission:', err);
    return false;
  }

  window.dispatchEvent(new Event('kintesi_affiliates_updated'));
  return true;
}

// 8. Revoke / Deduct Commission When Order is Cancelled or Returned ("kono product jodi cancle kora customar sei khetre affilaite partner kono taka pabe na")
export async function revokeAffiliateCommissionOnCancellation(
  order: {
    order_number: string;
    total_amount?: number | null;
    affiliate_code?: string | null;
    affiliate_commission?: number | null;
    affiliate_commission_amount?: number | null;
  }
): Promise<boolean> {
  const code = order.affiliate_code?.trim().toUpperCase();
  if (!code) return false;

  const commission = Number(order.affiliate_commission || order.affiliate_commission_amount) || 0;
  const orderTotal = Number(order.total_amount) || 0;

  // Track revoked orders to prevent multiple revocations
  const revokedOrdersKey = 'kintesi_affiliate_revoked_orders';
  let revokedList: string[] = [];
  try {
    revokedList = JSON.parse(localStorage.getItem(revokedOrdersKey) || '[]');
  } catch {}

  if (revokedList.includes(order.order_number)) {
    console.log(`Order #${order.order_number} commission was already revoked.`);
    return false;
  }

  // Check if commission was ever credited (delivered)
  const creditedOrdersKey = 'kintesi_affiliate_credited_orders';
  let creditedList: string[] = [];
  try {
    creditedList = JSON.parse(localStorage.getItem(creditedOrdersKey) || '[]');
  } catch {}

  const wasCredited = creditedList.includes(order.order_number);

  try {
    // 1. Fetch partner in Supabase
    const { data: dbUser } = await supabase
      .from('affiliate_users')
      .select('*')
      .eq('affiliate_code', code)
      .maybeSingle();

    if (dbUser) {
      const nextOrders = Math.max(0, (Number(dbUser.total_orders) || 0) - 1);
      const nextSales = Math.max(0, (Number(dbUser.total_sales_amount) || 0) - orderTotal);
      const nextEarned = wasCredited
        ? Math.max(0, (Number(dbUser.total_commission_earned) || 0) - commission)
        : (Number(dbUser.total_commission_earned) || 0);
      const nextBalance = wasCredited
        ? Math.max(0, (Number(dbUser.available_balance) || 0) - commission)
        : (Number(dbUser.available_balance) || 0);

      await supabase
        .from('affiliate_users')
        .update({
          total_orders: nextOrders,
          total_sales_amount: nextSales,
          total_commission_earned: nextEarned,
          available_balance: nextBalance,
        })
        .eq('id', dbUser.id);
    }

    // 2. Remove from credited list if it was credited
    if (wasCredited) {
      creditedList = creditedList.filter((num) => num !== order.order_number);
      localStorage.setItem(creditedOrdersKey, JSON.stringify(creditedList));
    }

    // 3. Mark in revoked list
    revokedList.push(order.order_number);
    localStorage.setItem(revokedOrdersKey, JSON.stringify(revokedList));

    // 4. Update local profile cache
    const current = localStorage.getItem('kintesi_my_affiliate_profile');
    if (current) {
      const parsed = JSON.parse(current);
      if (parsed.affiliate_code?.toUpperCase() === code) {
        parsed.total_orders = Math.max(0, (Number(parsed.total_orders) || 0) - 1);
        parsed.total_sales_amount = Math.max(0, (Number(parsed.total_sales_amount) || 0) - orderTotal);
        if (wasCredited) {
          parsed.total_commission_earned = Math.max(0, (Number(parsed.total_commission_earned) || 0) - commission);
          parsed.available_balance = Math.max(0, (Number(parsed.available_balance) || 0) - commission);
        }
        localStorage.setItem('kintesi_my_affiliate_profile', JSON.stringify(parsed));
      }
    }
  } catch (err) {
    console.warn('Error revoking cancelled affiliate commission:', err);
    return false;
  }

  window.dispatchEvent(new Event('kintesi_affiliates_updated'));
  return true;
}

// 7. Withdrawals Management
export async function getWithdrawalsFromDB(): Promise<AffiliateWithdrawal[]> {
  const map = new Map<string, AffiliateWithdrawal>();
  let supabaseSuccess = false;

  // 1. Fetch from Supabase (Authoritative source of truth)
  try {
    const { data, error } = await supabase
      .from('affiliate_withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      supabaseSuccess = true;
      data.forEach((w: AffiliateWithdrawal) => {
        if (w && w.id && !w.id.startsWith('with_demo_')) {
          map.set(w.id, w);
        }
      });
      // Synchronize local cache with clean DB state
      try {
        localStorage.setItem(WITHDRAWALS_CACHE_KEY, JSON.stringify(Array.from(map.values())));
      } catch {}
    } else if (error) {
      console.warn('Supabase fetch withdrawals notice:', error.message);
    }
  } catch (err) {
    console.warn('Supabase fetch withdrawals notice:', err);
  }

  // 2. Offline fallback ONLY if Supabase is unreachable
  if (!supabaseSuccess) {
    try {
      const cached = localStorage.getItem(WITHDRAWALS_CACHE_KEY);
      if (cached) {
        const parsed: AffiliateWithdrawal[] = JSON.parse(cached);
        parsed.forEach((w) => {
          if (w && w.id && !w.id.startsWith('with_demo_')) {
            map.set(w.id, w);
          }
        });
      }
    } catch {}
  }

  const getTime = (d?: string) => {
    if (!d) return 0;
    try {
      const t = new Date(d).getTime();
      return isNaN(t) ? 0 : t;
    } catch {
      return 0;
    }
  };

  const result = Array.from(map.values()).sort(
    (a, b) => getTime(b?.created_at) - getTime(a?.created_at)
  );

  localStorage.setItem(WITHDRAWALS_CACHE_KEY, JSON.stringify(result));
  return result;
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

// 10. Active Referral Cookie / LocalStorage Helpers (Strict tracking)
export function clearActiveAffiliateReferral(): void {
  try {
    localStorage.removeItem(ACTIVE_REFERRAL_KEY);
    sessionStorage.removeItem(ACTIVE_REFERRAL_KEY);
  } catch {}
}

export async function setActiveAffiliateReferral(code: string): Promise<boolean> {
  if (!code || !code.trim()) return false;
  const clean = code.trim().toUpperCase();

  // Strict Rule 1: Validate that the affiliate partner actually exists and is active (not suspended)
  try {
    const { data: dbUser } = await supabase
      .from('affiliate_users')
      .select('id, status, affiliate_code')
      .eq('affiliate_code', clean)
      .maybeSingle();

    if (!dbUser || dbUser.status === 'suspended') {
      console.warn(`Referral code ${clean} is invalid or suspended. Tracking ignored.`);
      clearActiveAffiliateReferral();
      return false;
    }
  } catch {}

  const payload = {
    code: clean,
    timestamp: Date.now(),
  };

  try {
    sessionStorage.setItem(ACTIVE_REFERRAL_KEY, JSON.stringify(payload));
    localStorage.setItem(ACTIVE_REFERRAL_KEY, JSON.stringify(payload));
  } catch {}

  return true;
}

export function getActiveAffiliateReferral(options?: {
  buyerPhone?: string;
  buyerUserId?: string;
  buyerEmail?: string;
}): string | null {
  try {
    // Check session first, then fallback to local
    let raw = sessionStorage.getItem(ACTIVE_REFERRAL_KEY);
    if (!raw) {
      raw = localStorage.getItem(ACTIVE_REFERRAL_KEY);
    }
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.code) return null;

    // Strict Rule 2: Expiration window check (24 hours max for explicit click attribution)
    const maxAgeMs = 24 * 60 * 60 * 1000;
    if (Date.now() - Number(parsed.timestamp) > maxAgeMs) {
      clearActiveAffiliateReferral();
      return null;
    }

    const code = String(parsed.code).trim().toUpperCase();

    // Strict Rule 3: Self-purchase prevention
    // If the buyer is the affiliate partner themselves, never credit commission!
    try {
      const myProfileRaw = localStorage.getItem('kintesi_my_affiliate_profile');
      if (myProfileRaw) {
        const myProfile = JSON.parse(myProfileRaw);
        if (myProfile?.affiliate_code && myProfile.affiliate_code.toUpperCase() === code) {
          console.warn('Self-referral detected. Disallowing affiliate attribution.');
          return null;
        }
        if (options?.buyerPhone && myProfile?.phone && options.buyerPhone === myProfile.phone) {
          console.warn('Self-referral detected via phone number. Disallowing affiliate attribution.');
          return null;
        }
      }
    } catch {}

    return code;
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

// 12. Partner Generated Affiliate Products
export function getPartnerGeneratedProducts(affiliateCode: string): GeneratedAffiliateProduct[] {
  if (!affiliateCode) return [];
  try {
    const raw = localStorage.getItem(`kintesi_affiliate_prods_${affiliateCode}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePartnerGeneratedProduct(affiliateCode: string, item: GeneratedAffiliateProduct): GeneratedAffiliateProduct[] {
  if (!affiliateCode) return [];
  try {
    const current = getPartnerGeneratedProducts(affiliateCode);
    const filtered = current.filter((p) => p.id !== item.id);
    const updated = [item, ...filtered];
    localStorage.setItem(`kintesi_affiliate_prods_${affiliateCode}`, JSON.stringify(updated));
    window.dispatchEvent(new Event('kintesi_partner_products_updated'));
    return updated;
  } catch {
    return [];
  }
}

export function removePartnerGeneratedProduct(affiliateCode: string, productId: string): GeneratedAffiliateProduct[] {
  if (!affiliateCode) return [];
  try {
    const current = getPartnerGeneratedProducts(affiliateCode);
    const updated = current.filter((p) => p.id !== productId);
    localStorage.setItem(`kintesi_affiliate_prods_${affiliateCode}`, JSON.stringify(updated));
    window.dispatchEvent(new Event('kintesi_partner_products_updated'));
    return updated;
  } catch {
    return [];
  }
}

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { supabase } from './supabase';
import { Product, Category, Order } from '../types';
import { INITIAL_CATEGORIES } from '../data/mockData';

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

// ==========================================
// 📦 PRODUCTS (Primary: Supabase | Hot Backup: Firebase)
// ==========================================

export async function getProductsFromDB(): Promise<Product[]> {
  const localSaved: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');

  // 1. Primary: Try fetching from Supabase (Relational PostgreSQL)
  try {
    const result = await withTimeout<any>(
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      4000
    );
    const supaProducts = result?.data;
    const error = result?.error;

    if (!error && supaProducts && supaProducts.length > 0) {
      const clean = supaProducts
        .filter((p: any) => p && p.id && !p.id.startsWith('prod-'))
        .map((p: any) => ({
          ...p,
          spec_mode: p.spec_mode || p.specifications?.spec_mode || 'auto',
          sub_category: p.sub_category || p.specifications?.sub_category || '',
        }));
      localStorage.setItem('kintesi_custom_products', JSON.stringify(clean));

      // Asynchronously mirror / shadow backup to Firebase
      Promise.resolve().then(async () => {
        try {
          for (const item of clean) {
            setDoc(doc(db, 'products', item.id), item, { merge: true }).catch(() => {});
          }
        } catch {}
      });

      return clean;
    }
  } catch (supaErr) {
    console.warn('Supabase products fetch failed or timed out, failing over to Firebase backup:', supaErr);
  }

  // 2. Secondary / Backup: Cloud Firestore Failover
  try {
    const colRef = collection(db, 'products');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Product));
      const clean = items.filter((p) => p && p.id && !p.id.startsWith('prod-'));
      localStorage.setItem('kintesi_custom_products', JSON.stringify(clean));
      return clean;
    }
  } catch (fireErr) {
    console.warn('Firebase products fetch notice (using cache):', fireErr);
  }

  // 3. Fallback: Local Storage cache
  return localSaved.filter((p) => p && p.id && !p.id.startsWith('prod-'));
}

export async function saveProductToDB(product: Product): Promise<void> {
  const isUUID = (str?: string) =>
    str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) : false;

  // Ensure product has a valid RFC4122 UUID
  if (!isUUID(product.id)) {
    product.id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');
  }

  // 1. Instant local reactivity (0ms) - Only replace if exact same ID matches!
  try {
    const localSaved: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
    const updated = [product, ...localSaved.filter((p) => p.id !== product.id)];
    localStorage.setItem('kintesi_custom_products', JSON.stringify(updated));
    window.dispatchEvent(new Event('kintesi_products_updated'));
  } catch (storageErr) {
    console.warn('Local storage cache update warning in saveProductToDB:', storageErr);
  }

  // 2. Primary: Save to Supabase (PostgreSQL)
  try {
    const cleanPayload: any = {};
    Object.entries(product).forEach(([key, val]) => {
      if (val !== undefined) cleanPayload[key] = val;
    });
    cleanPayload.id = product.id;

    // Safely embed extra metadata inside specifications jsonb to prevent schema mismatch
    cleanPayload.specifications = {
      ...(cleanPayload.specifications || {}),
      spec_mode: product.spec_mode || (cleanPayload.specifications?.spec_mode) || 'auto',
      sub_category: product.sub_category || (cleanPayload.specifications?.sub_category) || '',
    };
    delete cleanPayload.sub_category;
    delete cleanPayload.spec_mode;

    // Check if another product already uses this exact slug
    const { data: existingSlugRow } = await supabase
      .from('products')
      .select('id')
      .eq('slug', cleanPayload.slug)
      .neq('id', cleanPayload.id)
      .maybeSingle();

    if (existingSlugRow) {
      cleanPayload.slug = `${cleanPayload.slug}-${Date.now().toString(36).slice(-4)}`;
      product.slug = cleanPayload.slug;
    }

    const { data: supaData, error } = await supabase
      .from('products')
      .upsert(cleanPayload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('Supabase product upsert warning:', error.message);
      // Fallback with standard core columns if new columns not yet migrated
      const coreFields: any = {
        id: cleanPayload.id,
        title: product.title,
        slug: product.slug,
        description: product.description,
        price: product.price,
        discount_price: product.discount_price,
        category_id: product.category_id,
        stock: product.stock,
        images: product.images,
        brand: product.brand,
        sku: product.sku,
        is_featured: product.is_featured,
      };
      await supabase.from('products').upsert(coreFields, { onConflict: 'id' });
    } else if (supaData?.id && supaData.id !== product.id) {
      product.id = supaData.id;
    }
  } catch (err) {
    console.error('Supabase product save error:', err);
  }

  // 3. Real-time Secondary Backup: Save to Firebase Firestore (non-blocking with timeout)
  try {
    const cleanForFirebase: any = JSON.parse(JSON.stringify(product));
    const docRef = doc(db, 'products', product.id);
    await withTimeout(setDoc(docRef, cleanForFirebase, { merge: true }), 3000);
  } catch (err) {
    console.warn('Firebase product backup notice:', err);
  }
}

export async function deleteProductFromDB(productId: string): Promise<void> {
  // 1. Local update
  const localSaved: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
  const filtered = localSaved.filter((p) => p.id !== productId);
  localStorage.setItem('kintesi_custom_products', JSON.stringify(filtered));
  window.dispatchEvent(new Event('kintesi_products_updated'));

  // 2. Delete from Supabase Primary
  try {
    await supabase.from('products').delete().eq('id', productId);
  } catch (err) {
    console.warn('Supabase product delete warning:', err);
  }

  // 3. Delete from Firebase Backup
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    console.warn('Firebase product delete warning:', err);
  }
}

// ==========================================
// 🏷️ CATEGORIES (Primary: Supabase | Hot Backup: Firebase)
// ==========================================

const STANDARD_CATEGORY_SLUGS = new Set(INITIAL_CATEGORIES.map((c) => c.slug.toLowerCase()));
const STANDARD_CATEGORY_IDS = new Set(INITIAL_CATEGORIES.map((c) => c.id.toLowerCase()));

// Asynchronously purge obsolete bloated categories from the database in background
async function purgeOldCategoriesFromDB(cats: Category[]) {
  try {
    const oldCats = cats.filter((cat) => {
      if (!cat) return false;
      const slug = (cat.slug || '').toLowerCase();
      const id = (cat.id || '').toLowerCase();
      if (STANDARD_CATEGORY_SLUGS.has(slug) || STANDARD_CATEGORY_IDS.has(id)) {
        return false;
      }
      return (
        slug.includes('heating') ||
        slug.includes('posture') ||
        slug.includes('spine') ||
        slug.includes('therapy') ||
        slug.includes('snoring') ||
        slug.includes('postpartum') ||
        slug.includes('problem-solver') ||
        slug.includes('pedicure') ||
        slug.includes('grooming') ||
        slug.includes('sanitary') ||
        slug.includes('menstrual') ||
        slug.includes('physiotherapy') ||
        id.startsWith('cat-legacy') ||
        slug === 'beauty-skincare' ||
        slug === 'gadgets' ||
        slug === 'smartphones-tablets' ||
        slug === 'laptops-computers' ||
        slug === 'home-kitchen' ||
        slug === 'groceries-daily-essentials' ||
        slug === 'health-baby-care' ||
        slug === 'smart-watches' ||
        slug === 'sports-fitness'
      );
    });

    for (const old of oldCats) {
      const targetId = old.id || old.slug;
      if (targetId) {
        try {
          await supabase.from('categories').delete().eq('id', targetId);
        } catch {}
        deleteDoc(doc(db, 'categories', targetId)).catch(() => {});
      }
      if (old.slug) {
        try {
          await supabase.from('categories').delete().eq('slug', old.slug);
        } catch {}
        deleteDoc(doc(db, 'categories', old.slug)).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Purging legacy categories notice:', err);
  }
}

// Helper to ensure ONLY valid categories exist and all 14 standard categories have their rich subcategories
function enrichCategoriesWithDefaults(cats: Category[]): Category[] {
  // Purge any old legacy bloated categories from the old system
  const cleanCats = (cats || []).filter((cat) => {
    if (!cat) return false;
    const slug = (cat.slug || '').toLowerCase();
    const id = (cat.id || '').toLowerCase();
    if (STANDARD_CATEGORY_SLUGS.has(slug) || STANDARD_CATEGORY_IDS.has(id)) {
      return true;
    }
    // Discard any old bloated category slugs
    if (
      slug.includes('heating') ||
      slug.includes('posture') ||
      slug.includes('spine') ||
      slug.includes('therapy') ||
      slug.includes('snoring') ||
      slug.includes('postpartum') ||
      slug.includes('problem-solver') ||
      slug.includes('pedicure') ||
      slug.includes('grooming') ||
      slug.includes('sanitary') ||
      slug.includes('menstrual') ||
      slug.includes('physiotherapy') ||
      id.startsWith('cat-legacy') ||
      slug === 'beauty-skincare' ||
      slug === 'gadgets' ||
      slug === 'smartphones-tablets' ||
      slug === 'laptops-computers' ||
      slug === 'home-kitchen' ||
      slug === 'groceries-daily-essentials' ||
      slug === 'health-baby-care' ||
      slug === 'smart-watches' ||
      slug === 'sports-fitness'
    ) {
      return false;
    }
    // Only allow custom categories with valid names
    return Boolean(cat.name && cat.name.trim().length > 1);
  });

  // Kick off background DB cleanup for old categories if found
  purgeOldCategoriesFromDB(cats);

  const enriched = INITIAL_CATEGORIES.map((std) => {
    const existing = cleanCats.find(
      (c) => c.slug.toLowerCase() === std.slug.toLowerCase() || c.id.toLowerCase() === std.id.toLowerCase()
    );
    if (!existing) return std;
    return {
      ...std,
      ...existing,
      subcategories:
        Array.isArray(existing.subcategories) && existing.subcategories.length > 0
          ? existing.subcategories
          : std.subcategories,
    };
  });

  // Include any extra custom categories created by admin under the new system
  for (const c of cleanCats) {
    if (
      !STANDARD_CATEGORY_SLUGS.has((c.slug || '').toLowerCase()) &&
      !STANDARD_CATEGORY_IDS.has((c.id || '').toLowerCase())
    ) {
      enriched.push(c);
    }
  }

  return enriched;
}

export async function getCategoriesFromDB(): Promise<Category[]> {
  // 1. Primary: Try Supabase
  try {
    const result = await withTimeout<any>(
      supabase.from('categories').select('*').order('name'),
      3500
    );
    const supaCats = result?.data;
    const error = result?.error;

    if (!error && supaCats && supaCats.length > 0) {
      const enriched = enrichCategoriesWithDefaults(supaCats);
      localStorage.setItem('kintesi_custom_categories', JSON.stringify(enriched));
      for (const cat of enriched) {
        setDoc(doc(db, 'categories', cat.id || cat.slug), cat, { merge: true }).catch(() => {});
      }
      return enriched;
    }
  } catch (err) {
    console.warn('Supabase categories fetch failover to Firebase:', err);
  }

  // 2. Secondary: Try Firebase
  try {
    const colRef = collection(db, 'categories');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Category));
      const enriched = enrichCategoriesWithDefaults(items);
      localStorage.setItem('kintesi_custom_categories', JSON.stringify(enriched));
      return enriched;
    } else {
      // Seed initial categories to Firestore in background
      for (const cat of INITIAL_CATEGORIES) {
        setDoc(doc(db, 'categories', cat.id), cat).catch(() => {});
      }
      localStorage.setItem('kintesi_custom_categories', JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
  } catch (err) {
    console.warn('Firestore categories fetch notice:', err);
  }

  // 3. Local fallback
  try {
    const saved = localStorage.getItem('kintesi_custom_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return enrichCategoriesWithDefaults(parsed);
      }
    }
  } catch {}
  return INITIAL_CATEGORIES;
}

export async function resetCategoriesToDefault(): Promise<Category[]> {
  localStorage.setItem('kintesi_custom_categories', JSON.stringify(INITIAL_CATEGORIES));

  // Purge any old categories in Supabase & Firebase
  try {
    const { data: allSupabaseCats } = await supabase.from('categories').select('*');
    if (allSupabaseCats && allSupabaseCats.length > 0) {
      purgeOldCategoriesFromDB(allSupabaseCats);
    }
  } catch {}

  for (const cat of INITIAL_CATEGORIES) {
    // Save to Firebase
    setDoc(doc(db, 'categories', cat.id || cat.slug), cat, { merge: true }).catch(() => {});
    // Save to Supabase
    try {
      await supabase.from('categories').upsert([cat]);
    } catch {}
  }
  window.dispatchEvent(new CustomEvent('kintesi_categories_updated'));
  return INITIAL_CATEGORIES;
}

export async function saveCategoryToDB(category: Category): Promise<void> {
  const localSaved: Category[] = JSON.parse(localStorage.getItem('kintesi_custom_categories') || '[]');
  const updated = [category, ...localSaved.filter((c) => c.id !== category.id && c.slug !== category.slug)];
  localStorage.setItem('kintesi_custom_categories', JSON.stringify(updated));

  // 1. Primary: Supabase
  try {
    await supabase.from('categories').upsert([category]);
  } catch (err) {
    console.warn('Supabase category save warning:', err);
  }

  // 2. Real-time Backup: Firebase
  try {
    await setDoc(doc(db, 'categories', category.id || category.slug), category, { merge: true });
  } catch (err) {
    console.error('Firebase category backup error:', err);
  }

  window.dispatchEvent(new CustomEvent('kintesi_categories_updated'));
}

export async function deleteCategoryFromDB(idOrSlug: string): Promise<void> {
  // 1. Local
  try {
    const localSaved: Category[] = JSON.parse(localStorage.getItem('kintesi_custom_categories') || '[]');
    const updated = localSaved.filter((c) => c.id !== idOrSlug && c.slug !== idOrSlug);
    localStorage.setItem('kintesi_custom_categories', JSON.stringify(updated));
  } catch (err) {
    console.warn('Local category delete notice:', err);
  }

  // 2. Supabase
  try {
    await supabase.from('categories').delete().or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`);
  } catch (err) {
    console.warn('Supabase category delete warning:', err);
  }

  // 3. Firebase
  try {
    await deleteDoc(doc(db, 'categories', idOrSlug));
  } catch (err) {
    console.warn('Firebase category delete warning:', err);
  }

  window.dispatchEvent(new CustomEvent('kintesi_categories_updated'));
}

// ==========================================
// 📋 ORDERS (Primary: Supabase Relational Ledger | Hot Backup: Firebase)
// ==========================================

export function isUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

export function sanitizeOrderForSupabase(order: any): any {
  const clean: Record<string, any> = {
    order_number: order.order_number,
    user_id: isUUID(order.user_id) ? order.user_id : null,
    customer_name: order.customer_name || 'Guest Customer',
    customer_email: order.customer_email || '',
    customer_phone: order.customer_phone || '',
    shipping_address: order.shipping_address || '',
    city: order.city || '',
    postal_code: order.postal_code || null,
    customer_note: order.customer_note || null,
    items: Array.isArray(order.items) ? order.items : [],
    subtotal: Number(order.subtotal) || 0,
    shipping_cost: Number(order.shipping_cost) || 0,
    discount: Number(order.discount) || 0,
    total_amount: Number(order.total_amount) || 0,
    payment_method: order.payment_method || 'cod',
    payment_status: order.payment_status || 'pending',
    order_status: order.order_status || 'pending',
    transaction_id: order.transaction_id || null,
    coupon_code: order.coupon_code || null,
    affiliate_code: order.affiliate_code || null,
    affiliate_commission: Number(order.affiliate_commission || order.affiliate_commission_amount) || 0,
  };

  if (order.id && isUUID(order.id)) {
    clean.id = order.id;
  }

  return clean;
}

export async function getOrdersFromDB(
  userId?: string,
  userEmail?: string,
  userPhone?: string
): Promise<Order[]> {
  // 1. Primary: Try Supabase
  try {
    let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
    
    // Only apply user_id filter if it's a valid Postgres UUID
    if (userId && isUUID(userId)) {
      q = q.eq('user_id', userId);
    } else if (userEmail) {
      q = q.eq('customer_email', userEmail.trim().toLowerCase());
    } else if (userPhone) {
      q = q.eq('customer_phone', userPhone.trim());
    }

    const { data: supaOrders, error } = await q;

    if (!error && Array.isArray(supaOrders)) {
      return supaOrders;
    }
    if (error) {
      console.warn('Supabase orders fetch note, trying backup:', error.message);
    }
  } catch (err) {
    console.warn('Supabase orders fetch failover to Firebase:', err);
  }

  // 2. Secondary Backup: Try Firebase
  try {
    const colRef = collection(db, 'orders');
    let q;
    if (userId) {
      q = query(colRef, where('user_id', '==', userId), orderBy('created_at', 'desc'));
    } else {
      q = query(colRef, orderBy('created_at', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Order));
  } catch (err) {
    console.warn('Firestore orders fetch fallback query:', err);
    try {
      const colRef = collection(db, 'orders');
      const snap = await getDocs(colRef);
      const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Order));
      if (userId) {
        return all.filter((o) => o.user_id === userId || (userEmail && o.customer_email?.toLowerCase() === userEmail.toLowerCase()));
      }
      return all;
    } catch {
      return [];
    }
  }
}

export async function saveOrderToDB(order: any): Promise<void> {
  const cleanOrder = sanitizeOrderForSupabase(order);

  // 1. Primary: Save to Supabase (PostgreSQL Relational Ledger)
  try {
    const { error } = await supabase
      .from('orders')
      .upsert([cleanOrder], { onConflict: 'order_number' });
    if (error) {
      console.warn('Supabase order insert notice:', error.message);
    } else {
      console.log('Order successfully saved to Supabase:', cleanOrder.order_number);
    }
  } catch (err) {
    console.error('Supabase order save error:', err);
  }

  // 2. Real-time Backup: Save to Firebase Firestore
  try {
    const docId = cleanOrder.order_number || cleanOrder.id || `ord-${Date.now()}`;
    const docRef = doc(db, 'orders', docId);
    await setDoc(docRef, { ...order, ...cleanOrder });
  } catch (err) {
    console.error('Firestore save order backup error:', err);
  }

  // 3. Notify all listeners in the app
  try {
    window.dispatchEvent(new CustomEvent('kintesi_orders_updated', { detail: cleanOrder }));
  } catch {}
}

export async function updateOrderInDB(orderId: string, updates: Partial<Order>): Promise<void> {
  // Only pass known Supabase columns in updates
  const allowedCols = [
    'order_status',
    'payment_status',
    'payment_method',
    'customer_name',
    'customer_email',
    'customer_phone',
    'shipping_address',
    'city',
    'postal_code',
    'customer_note',
    'transaction_id',
    'total_amount',
    'subtotal',
    'discount',
    'shipping_cost',
    'items',
    'affiliate_code',
    'affiliate_commission',
    'coupon_code',
  ];

  const cleanUpdates: Record<string, any> = {};
  for (const [k, v] of Object.entries(updates)) {
    if (allowedCols.includes(k)) {
      cleanUpdates[k] = v;
    }
  }

  // 1. Primary: Update in Supabase by either id or order_number
  try {
    if (isUUID(orderId)) {
      await supabase.from('orders').update(cleanUpdates).eq('id', orderId);
    } else {
      await supabase.from('orders').update(cleanUpdates).eq('order_number', orderId);
    }
  } catch (err) {
    console.warn('Supabase update order warning:', err);
  }

  // 2. Real-time Backup: Update in Firebase
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, updates);
  } catch (err) {
    console.error('Firestore update order error:', err);
  }

  // 3. Notify listeners
  try {
    window.dispatchEvent(new CustomEvent('kintesi_orders_updated'));
  } catch {}
}

// ==========================================
// 🎨 PRESETS (Colors & Sizes Global Sync)
// ==========================================

export async function getPresetsFromDB(): Promise<{ colors?: any[]; sizes?: string[] }> {
  try {
    const docRef = doc(db, 'settings', 'presets');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        colors: Array.isArray(data?.colors) ? data.colors : undefined,
        sizes: Array.isArray(data?.sizes) ? data.sizes : undefined,
      };
    }
  } catch (err) {
    console.warn('Firestore fetch presets notice:', err);
  }
  return {};
}

export async function savePresetsToDB(presets: { colors?: any[]; sizes?: string[] }): Promise<void> {
  try {
    const docRef = doc(db, 'settings', 'presets');
    await setDoc(docRef, presets, { merge: true });
  } catch (err) {
    console.warn('Firestore save presets notice:', err);
  }
}


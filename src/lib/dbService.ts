import {
  collection,
  doc,
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
      const clean = supaProducts.filter((p: any) => p && p.id && !p.id.startsWith('prod-'));
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
  // 1. Instant local reactivity (0ms)
  const localSaved: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
  const updated = [product, ...localSaved.filter((p) => p.id !== product.id && p.slug !== product.slug)];
  localStorage.setItem('kintesi_custom_products', JSON.stringify(updated));
  window.dispatchEvent(new Event('kintesi_products_updated'));

  const isUUID = (str?: string) =>
    str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) : false;

  // 2. Primary: Save to Supabase (PostgreSQL)
  try {
    const cleanPayload: any = {};
    Object.entries(product).forEach(([key, val]) => {
      if (val !== undefined) cleanPayload[key] = val;
    });

    // If ID is not a valid UUID, strip it so Supabase generates a UUID on upsert
    if (!isUUID(cleanPayload.id)) {
      delete cleanPayload.id;
    }

    const { data: supaData, error } = await supabase
      .from('products')
      .upsert(cleanPayload, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      console.warn('Supabase product upsert warning:', error.message);
      // Fallback with standard core columns if new columns not yet migrated
      const coreFields: any = {
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
      await supabase.from('products').upsert(coreFields, { onConflict: 'slug' });
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
      localStorage.setItem('kintesi_custom_categories', JSON.stringify(supaCats));
      // Backup to Firebase
      for (const cat of supaCats) {
        setDoc(doc(db, 'categories', cat.id || cat.slug), cat, { merge: true }).catch(() => {});
      }
      return supaCats;
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
      localStorage.setItem('kintesi_custom_categories', JSON.stringify(items));
      return items;
    } else {
      // Seed initial categories to Firestore in background
      for (const cat of INITIAL_CATEGORIES) {
        setDoc(doc(db, 'categories', cat.id), cat).catch(() => {});
      }
      return INITIAL_CATEGORIES;
    }
  } catch (err) {
    console.warn('Firestore categories fetch notice:', err);
  }

  // 3. Local fallback
  try {
    const saved = localStorage.getItem('kintesi_custom_categories');
    if (saved) return JSON.parse(saved);
  } catch {}
  return INITIAL_CATEGORIES;
}

export async function saveCategoryToDB(category: Category): Promise<void> {
  const localSaved: Category[] = JSON.parse(localStorage.getItem('kintesi_custom_categories') || '[]');
  const updated = [category, ...localSaved.filter((c) => c.id !== category.id)];
  localStorage.setItem('kintesi_custom_categories', JSON.stringify(updated));

  // 1. Primary: Supabase
  try {
    await supabase.from('categories').upsert([category]);
  } catch (err) {
    console.warn('Supabase category save warning:', err);
  }

  // 2. Real-time Backup: Firebase
  try {
    await setDoc(doc(db, 'categories', category.id), category, { merge: true });
  } catch (err) {
    console.error('Firebase category backup error:', err);
  }
}

// ==========================================
// 📋 ORDERS (Primary: Supabase Relational Ledger | Hot Backup: Firebase)
// ==========================================

export async function getOrdersFromDB(userId?: string): Promise<Order[]> {
  // 1. Primary: Try Supabase
  try {
    let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (userId) {
      q = q.eq('user_id', userId);
    }
    const result = await withTimeout<any>(q, 3500);
    const supaOrders = result?.data;
    const error = result?.error;

    if (!error && supaOrders && supaOrders.length > 0) {
      return supaOrders;
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
        return all.filter((o) => o.user_id === userId);
      }
      return all;
    } catch {
      return [];
    }
  }
}

export async function saveOrderToDB(order: Order): Promise<void> {
  // 1. Primary: Save to Supabase (PostgreSQL Relational Ledger)
  try {
    const { error } = await supabase.from('orders').upsert([order]);
    if (error) {
      console.warn('Supabase order insert notice:', error.message);
    }
  } catch (err) {
    console.error('Supabase order save error:', err);
  }

  // 2. Real-time Backup: Save to Firebase Firestore
  try {
    const docRef = doc(db, 'orders', order.id);
    await setDoc(docRef, order);
  } catch (err) {
    console.error('Firestore save order backup error:', err);
  }
}

export async function updateOrderInDB(orderId: string, updates: Partial<Order>): Promise<void> {
  // 1. Primary: Update in Supabase
  try {
    await supabase.from('orders').update(updates).eq('id', orderId);
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
}

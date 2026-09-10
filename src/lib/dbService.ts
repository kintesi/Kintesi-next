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
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, Category, Order } from '../types';
import { INITIAL_CATEGORIES } from '../data/mockData';

// ==========================================
// 📦 PRODUCTS
// ==========================================

export async function getProductsFromDB(): Promise<Product[]> {
  const localSaved: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
  try {
    const colRef = collection(db, 'products');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Product));
      const clean = items.filter((p) => p && p.id && !p.id.startsWith('prod-'));
      localStorage.setItem('kintesi_custom_products', JSON.stringify(clean));
      return clean;
    }
  } catch (err) {
    console.warn('Firestore products fetch notice (using cache):', err);
  }
  return localSaved.filter((p) => p && p.id && !p.id.startsWith('prod-'));
}

export async function saveProductToDB(product: Product): Promise<void> {
  // 1. Update localStorage immediately for 0ms reactivity
  const localSaved: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
  const updated = [product, ...localSaved.filter((p) => p.id !== product.id && p.slug !== product.slug)];
  localStorage.setItem('kintesi_custom_products', JSON.stringify(updated));
  window.dispatchEvent(new Event('kintesi_products_updated'));

  // 2. Persist to Firestore
  try {
    const docRef = doc(db, 'products', product.id);
    await setDoc(docRef, product, { merge: true });
  } catch (err) {
    console.error('Firestore save product error:', err);
  }
}

export async function deleteProductFromDB(productId: string): Promise<void> {
  const localSaved: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
  const filtered = localSaved.filter((p) => p.id !== productId);
  localStorage.setItem('kintesi_custom_products', JSON.stringify(filtered));
  window.dispatchEvent(new Event('kintesi_products_updated'));

  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    console.error('Firestore delete product error:', err);
  }
}

// ==========================================
// 🏷️ CATEGORIES
// ==========================================

export async function getCategoriesFromDB(): Promise<Category[]> {
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
    try {
      const saved = localStorage.getItem('kintesi_custom_categories');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CATEGORIES;
  }
}

export async function saveCategoryToDB(category: Category): Promise<void> {
  const localSaved: Category[] = JSON.parse(localStorage.getItem('kintesi_custom_categories') || '[]');
  const updated = [category, ...localSaved.filter((c) => c.id !== category.id)];
  localStorage.setItem('kintesi_custom_categories', JSON.stringify(updated));

  try {
    await setDoc(doc(db, 'categories', category.id), category, { merge: true });
  } catch (err) {
    console.error('Firestore save category error:', err);
  }
}

// ==========================================
// 📋 ORDERS
// ==========================================

export async function getOrdersFromDB(userId?: string): Promise<Order[]> {
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
  try {
    const docRef = doc(db, 'orders', order.id);
    await setDoc(docRef, order);
  } catch (err) {
    console.error('Firestore save order error:', err);
  }
}

export async function updateOrderInDB(orderId: string, updates: Partial<Order>): Promise<void> {
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, updates);
  } catch (err) {
    console.error('Firestore update order error:', err);
  }
}

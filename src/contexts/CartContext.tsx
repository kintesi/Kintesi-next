import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { CartItem, Product, Coupon } from '../types';
import { useCoupons } from './CouponContext';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    color?: string,
    size?: string,
    customPrice?: number,
    variantImage?: string
  ) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, color?: string, size?: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  totalItemCount: number;
  isLoading: boolean;
}

export const sanitizeCartItems = (rawList: any): CartItem[] => {
  if (!Array.isArray(rawList)) return [];
  const cleaned: CartItem[] = [];

  for (const item of rawList) {
    if (!item) continue;
    const prod = item.product && item.product.id ? item.product : (item.id && item.title ? item : null);
    if (!prod || !prod.id) continue;

    const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
    const color = (item.selectedColor || '').trim();
    const size = (item.selectedSize || '').trim();

    // Check if this product is already in the list
    const existingIndex = cleaned.findIndex((c) => {
      if (c.product.id !== prod.id) return false;
      const cColor = (c.selectedColor || '').trim();
      const cSize = (c.selectedSize || '').trim();
      // If colors/sizes match, or if either item has no variant specified
      if (cColor === color && cSize === size) return true;
      if ((!cColor && !cSize) || (!color && !size)) return true;
      return false;
    });

    if (existingIndex > -1) {
      cleaned[existingIndex].quantity += qty;
      // Adopt color/size if the existing one didn't have it
      if (!cleaned[existingIndex].selectedColor && color) {
        cleaned[existingIndex].selectedColor = color;
      }
      if (!cleaned[existingIndex].selectedSize && size) {
        cleaned[existingIndex].selectedSize = size;
      }
      if (item.customPrice) {
        cleaned[existingIndex].customPrice = item.customPrice;
      }
      if (item.variantImage) {
        cleaned[existingIndex].variantImage = item.variantImage;
      }
    } else {
      cleaned.push({
        product: prod,
        quantity: qty,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        customPrice: item.customPrice,
        variantImage: item.variantImage,
      });
    }
  }
  return cleaned;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, openAuthModal } = useAuth();
  const { validateCoupon } = useCoupons();

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('kintesi_cart');
      if (!saved) return [];
      return sanitizeCartItems(JSON.parse(saved));
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem('kintesi_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Track initial merge per user login to avoid resurrecting deleted items
  const hasMergedInitialRef = useRef<string | null>(null);

  // Real-time bidirectional synchronization with Firestore database
  useEffect(() => {
    if (!user || !user.id) return;

    const userCartRef = doc(db, 'user_carts', user.id);
    const userProfileRef = doc(db, 'profiles', user.id);

    // Initial load: fetch once and merge any guest offline items only on first connect
    if (hasMergedInitialRef.current !== user.id) {
      hasMergedInitialRef.current = user.id;
      setIsLoading(true);

      getDoc(userCartRef).then((snap) => {
        setIsLoading(false);
        if (snap.exists()) {
          const remoteItems = sanitizeCartItems(snap.data()?.items);
          setCart((localCart) => {
            const cleanLocal = sanitizeCartItems(localCart);
            // Merge guest cart with remote cart once
            const merged = [...remoteItems];
            let hasNew = false;
            for (const item of cleanLocal) {
              const existing = merged.find(
                (m) =>
                  m.product?.id === item.product?.id &&
                  m.selectedColor === item.selectedColor &&
                  m.selectedSize === item.selectedSize
              );
              if (!existing) {
                merged.push(item);
                hasNew = true;
              }
            }
            try {
              localStorage.setItem('kintesi_cart', JSON.stringify(merged));
            } catch {}
            if (hasNew) {
              setDoc(userCartRef, { items: merged, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
            }
            return merged;
          });
        } else {
          // Check fallback profiles collection
          getDoc(userProfileRef).then((profSnap) => {
            if (profSnap.exists() && Array.isArray(profSnap.data()?.cart) && profSnap.data()?.cart.length > 0) {
              const profileCart = sanitizeCartItems(profSnap.data()?.cart);
              setCart(profileCart);
              try {
                localStorage.setItem('kintesi_cart', JSON.stringify(profileCart));
              } catch {}
              setDoc(userCartRef, { items: profileCart, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
            } else {
              setCart((localCart) => {
                const cleanLocal = sanitizeCartItems(localCart);
                if (cleanLocal.length > 0) {
                  setDoc(userCartRef, { items: cleanLocal, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
                }
                return cleanLocal;
              });
            }
          }).catch(() => {});
        }
      }).catch((err) => {
        console.warn('Initial cart fetch note:', err);
        setIsLoading(false);
      });
    }

    // Real-time listener: updates cart when modified from another device/browser
    const unsubscribe = onSnapshot(
      userCartRef,
      (snapshot) => {
        // If this snapshot was triggered by our own in-flight local write, skip to avoid echo/race conditions
        if (snapshot.metadata.hasPendingWrites) return;

        if (snapshot.exists()) {
          const remoteItems = sanitizeCartItems(snapshot.data()?.items);
          setCart(remoteItems);
          try {
            localStorage.setItem('kintesi_cart', JSON.stringify(remoteItems));
          } catch {}
        }
      },
      (err) => {
        console.warn('Firestore cart real-time listener notice:', err);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  // Persist cart to localStorage and Firestore database
  const persistCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem('kintesi_cart', JSON.stringify(newCart));
    } catch {}

    if (user && user.id) {
      const userCartRef = doc(db, 'user_carts', user.id);
      const userProfileRef = doc(db, 'profiles', user.id);

      setDoc(
        userCartRef,
        { items: newCart, updatedAt: new Date().toISOString() },
        { merge: true }
      ).catch((err) => console.warn('Failed saving cart to database:', err));

      setDoc(
        userProfileRef,
        { cart: newCart },
        { merge: true }
      ).catch(() => {});
    }
  };

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('kintesi_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('kintesi_coupon');
    }
  }, [appliedCoupon]);

  const addToCart = (
    product: Product,
    quantity = 1,
    color?: string,
    size?: string,
    customPrice?: number,
    variantImage?: string
  ) => {
    if (!user) {
      const lang = localStorage.getItem('kintesi_language') || 'en';
      toast.error(
        lang === 'bn' 
          ? 'কার্টে পণ্য যোগ করতে বা অর্ডার করতে প্রথমে অ্যাকাউন্টে লগইন করুন।' 
          : 'Please sign in to your account to add items to cart or order.'
      );
      openAuthModal('login');
      return;
    }

    const normalizedColor = (color || '').trim();
    const normalizedSize = (size || '').trim();

    const existingIndex = cart.findIndex((item) => {
      if (item?.product?.id !== product.id) return false;
      const itemColor = (item.selectedColor || '').trim();
      const itemSize = (item.selectedSize || '').trim();
      if (itemColor === normalizedColor && itemSize === normalizedSize) return true;
      if ((!itemColor && !itemSize) || (!normalizedColor && !normalizedSize)) return true;
      return false;
    });

    let updatedCart: CartItem[];

    if (existingIndex > -1) {
      const newCart = [...cart];
      const newQty = newCart[existingIndex].quantity + quantity;
      if (newQty > product.stock) {
        toast.error(`Only ${product.stock} items available in stock!`);
        return;
      }
      newCart[existingIndex].quantity = newQty;
      if (!newCart[existingIndex].selectedColor && color) {
        newCart[existingIndex].selectedColor = color;
      }
      if (!newCart[existingIndex].selectedSize && size) {
        newCart[existingIndex].selectedSize = size;
      }
      if (customPrice) {
        newCart[existingIndex].customPrice = customPrice;
      }
      if (variantImage) {
        newCart[existingIndex].variantImage = variantImage;
      }
      toast.success(`Updated ${product.title} quantity to ${newQty}`);
      updatedCart = newCart;
    } else {
      if (quantity > product.stock) {
        toast.error(`Only ${product.stock} items available in stock!`);
        return;
      }
      toast.success(`Added ${product.title} to cart`);
      updatedCart = [
        ...cart,
        {
          product,
          quantity,
          selectedColor: color,
          selectedSize: size,
          customPrice: customPrice,
          variantImage: variantImage,
        },
      ];
    }

    persistCart(sanitizeCartItems(updatedCart));
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter((item) => item?.product?.id !== productId);
    persistCart(sanitizeCartItems(updatedCart));
    toast.info('Item removed from cart');
  };

  const updateQuantity = (productId: string, quantity: number, color?: string, size?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const normColor = (color || '').trim();
    const normSize = (size || '').trim();

    const updatedCart = cart.map((item) => {
      if (item?.product?.id === productId) {
        const itemColor = (item.selectedColor || '').trim();
        const itemSize = (item.selectedSize || '').trim();
        const matchesVariant = !color && !size ? true : (itemColor === normColor && itemSize === normSize);
        if (matchesVariant) {
          if (quantity > (item.product.stock || 999)) {
            toast.error(`Only ${item.product.stock} items available in stock!`);
            return item;
          }
          return { ...item, quantity };
        }
      }
      return item;
    });

    persistCart(sanitizeCartItems(updatedCart));
  };

  const clearCart = () => {
    persistCart([]);
    setAppliedCoupon(null);
    try {
      localStorage.removeItem('kintesi_cart');
      localStorage.removeItem('kintesi_coupon');
    } catch {}
  };

  const subtotal = cart.reduce((acc, item) => {
    if (!item?.product) return acc;
    const itemPrice = (item as any).customPrice || item.product.discount_price || item.product.price || 0;
    const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
    return acc + itemPrice * qty;
  }, 0);

  // If cart subtotal drops below minimum order value of applied coupon, clear coupon
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.min_order_value && subtotal > 0 && subtotal < appliedCoupon.min_order_value) {
      toast.info(`Cart subtotal fell below the ৳${appliedCoupon.min_order_value} minimum required for coupon ${appliedCoupon.code}.`);
      setAppliedCoupon(null);
    }
  }, [subtotal, appliedCoupon]);

  const applyCoupon = async (code: string): Promise<boolean> => {
    const result = await validateCoupon(code, subtotal, user);
    if (!result.valid) {
      toast.error(result.message);
      return false;
    }
    setAppliedCoupon(result.coupon!);
    toast.success(result.message);
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast.info('Coupon removed');
  };

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'fixed') {
      const val = Number(appliedCoupon.discount_value || appliedCoupon.discount_percent || 0);
      discountAmount = Math.min(val, subtotal);
    } else {
      const percent = Number(appliedCoupon.discount_percent || appliedCoupon.discount_value || 0);
      const calculated = (subtotal * percent) / 100;
      discountAmount = appliedCoupon.max_discount ? Math.min(calculated, appliedCoupon.max_discount) : calculated;
    }
  }

  // Free shipping for orders above ৳5000, otherwise standard ৳60 Inside Dhaka / ৳120 Outside
  const shippingFee = subtotal === 0 ? 0 : subtotal >= 5000 ? 0 : 60;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);
  const totalItemCount = cart.reduce((sum, item) => sum + (typeof item?.quantity === 'number' ? item.quantity : 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        subtotal,
        discountAmount,
        shippingFee,
        total,
        totalItemCount,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

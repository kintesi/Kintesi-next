import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Product, Coupon } from '../types';
import { toast } from 'sonner';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  totalItemCount: number;
}

const AVAILABLE_COUPONS: Coupon[] = [
  { id: 'c1', code: 'KINTESI10', discount_percent: 10, max_discount: 1000, min_order_value: 1000, is_active: true },
  { id: 'c2', code: 'WELCOME20', discount_percent: 20, max_discount: 2000, min_order_value: 2000, is_active: true },
  { id: 'c3', code: 'EIDSPECIAL', discount_percent: 15, max_discount: 1500, min_order_value: 1500, is_active: true },
];

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('kintesi_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem('kintesi_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('kintesi_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('kintesi_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('kintesi_coupon');
    }
  }, [appliedCoupon]);

  const addToCart = (product: Product, quantity = 1, color?: string, size?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedColor === color && item.selectedSize === size
      );

      if (existingIndex > -1) {
        const newCart = [...prev];
        const newQty = newCart[existingIndex].quantity + quantity;
        if (newQty > product.stock) {
          toast.error(`Only ${product.stock} items available in stock!`);
          return prev;
        }
        newCart[existingIndex].quantity = newQty;
        toast.success(`Updated ${product.title} quantity to ${newQty}`);
        return newCart;
      } else {
        if (quantity > product.stock) {
          toast.error(`Only ${product.stock} items available in stock!`);
          return prev;
        }
        toast.success(`Added ${product.title} to cart`);
        return [...prev, { product, quantity, selectedColor: color, selectedSize: size }];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    toast.info('Item removed from cart');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          if (quantity > item.product.stock) {
            toast.error(`Only ${item.product.stock} items available in stock!`);
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    localStorage.removeItem('kintesi_cart');
    localStorage.removeItem('kintesi_coupon');
  };

  const subtotal = cart.reduce((acc, item) => {
    const itemPrice = item.product.discount_price || item.product.price;
    return acc + itemPrice * item.quantity;
  }, 0);

  const applyCoupon = (code: string): boolean => {
    const formattedCode = code.trim().toUpperCase();
    const coupon = AVAILABLE_COUPONS.find((c) => c.code === formattedCode && c.is_active);

    if (!coupon) {
      toast.error('Invalid coupon code');
      return false;
    }

    if (coupon.min_order_value && subtotal < coupon.min_order_value) {
      toast.error(`Minimum order amount of ৳${coupon.min_order_value} required for this coupon`);
      return false;
    }

    setAppliedCoupon(coupon);
    toast.success(`Coupon ${coupon.code} applied! ${coupon.discount_percent}% OFF`);
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast.info('Coupon removed');
  };

  let discountAmount = 0;
  if (appliedCoupon) {
    const calculated = (subtotal * appliedCoupon.discount_percent) / 100;
    discountAmount = appliedCoupon.max_discount ? Math.min(calculated, appliedCoupon.max_discount) : calculated;
  }

  // Free shipping for orders above ৳5000, otherwise standard ৳60 Inside Dhaka / ৳120 Outside
  const shippingFee = subtotal === 0 ? 0 : subtotal >= 5000 ? 0 : 60;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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

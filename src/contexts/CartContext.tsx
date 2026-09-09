import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Product, Coupon } from '../types';
import { useCoupons } from './CouponContext';
import { useAuth } from './AuthContext';
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
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  totalItemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { validateCoupon } = useCoupons();
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

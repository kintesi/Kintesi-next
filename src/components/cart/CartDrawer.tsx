import React, { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from '../auth/AuthModal';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const { user } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    discountAmount,
    shippingFee,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Automatically close cart drawer on any route change
  useEffect(() => {
    setIsCartOpen(false);
  }, [location.pathname]);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const success = await applyCoupon(couponCode);
    if (success) {
      setCouponCode('');
    }
  };

  const freeShippingThreshold = 5000;
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden animate-fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Your Cart</h3>
                <p className="text-xs text-gray-500">{cart.length} unique items</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:bg-gray-200 text-gray-400 hover:text-gray-700 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Tracker */}
          <div className="bg-emerald-50/80 px-5 py-3 border-b border-emerald-100 text-xs">
            {remainingForFreeShipping > 0 ? (
              <p className="text-emerald-900 font-medium mb-1.5">
                Add <span className="font-bold text-emerald-700">{formatPrice(remainingForFreeShipping)}</span> more for <span className="font-bold uppercase tracking-wider text-emerald-700">Free Delivery</span>!
              </p>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Congratulations! You qualify for Free Delivery.</span>
              </div>
            )}
            <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h4 className="font-bold text-gray-800 text-lg mb-1">Your cart is empty</h4>
                <p className="text-gray-500 text-sm mb-6">Explore our latest gadgets and electronics.</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition shadow-md"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const itemPrice = item.product.discount_price || item.product.price;
                return (
                  <div
                    key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                    className="flex gap-4 p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 hover:border-gray-200 transition"
                  >
                    <img
                      src={item.product.images[0] || '/logo.webp'}
                      alt={item.product.title}
                      className="w-20 h-20 object-cover rounded-xl bg-white border border-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                        {item.product.title}
                      </h4>
                      <p className="text-emerald-700 font-bold text-sm mt-0.5">
                        {formatPrice(itemPrice)}
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-gray-100 text-gray-600 transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-gray-100 text-gray-600 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-gray-100 bg-white space-y-4 shadow-lg">
              {/* Promo code */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <Tag className="w-4 h-4" />
                    <span>Coupon: <b>{appliedCoupon.code}</b> ({appliedCoupon.discount_percent}% OFF)</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-red-500 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase font-medium"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition shadow"
                  >
                    Apply
                  </button>
                </form>
              )}

              {/* Price Calculations */}
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Delivery</span>
                  <span className="font-semibold text-gray-900">
                    {shippingFee === 0 ? <span className="text-emerald-600 uppercase font-bold text-xs">Free</span> : formatPrice(shippingFee)}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-base font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-emerald-600 text-lg">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  if (!user) {
                    setIsAuthOpen(true);
                    return;
                  }
                  setIsCartOpen(false);
                  navigate('/checkout');
                }}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

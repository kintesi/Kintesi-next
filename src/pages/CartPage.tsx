import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AuthModal } from '../components/auth/AuthModal';
import { formatPrice } from '../lib/utils';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const { user } = useAuth();
  const {
    cart,
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
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const success = await applyCoupon(couponCode);
    if (success) {
      setCouponCode('');
    }
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    navigate('/checkout');
  };

  const freeShippingThreshold = 5000;
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const validCart = cart.filter((item) => item && item.product && item.product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Breadcrumb & Header */}
      <div className="space-y-2 pb-4 border-b border-gray-200">
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <Link to="/" className="hover:text-rose-600 transition">
            {t('nav.home')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-900 font-semibold">{t('cart.title')}</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{t('cart.title')}</h1>
            </div>
            <p className="text-xs text-gray-500 mt-1 pl-10">
              {validCart.length} {t('cart.items')}
            </p>
          </div>
          {validCart.length > 0 && (
            <Link
              to="/shop"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition"
            >
              <span>{t('cart.continue')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {validCart.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 sm:py-24 bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-xs max-w-xl mx-auto">
          <div className="w-20 h-20 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">{t('cart.empty')}</h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            {t('cart.emptyDesc')}
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-rose-600/20 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t('cart.exploreCatalog')}</span>
          </Link>
        </div>
      ) : (
        /* Cart Content Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Main Item List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Free Shipping Tracker */}
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-4 text-xs shadow-xs">
              {remainingForFreeShipping > 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <p className="text-emerald-950 font-medium">
                    {language === 'bn' ? (
                      <>
                        আর <span className="font-black text-emerald-700">{formatPrice(remainingForFreeShipping)}</span> {t('cart.freeDeliveryProgress')}
                      </>
                    ) : (
                      <>
                        Add <span className="font-black text-emerald-700">{formatPrice(remainingForFreeShipping)}</span> {t('cart.freeDeliveryProgress')}
                      </>
                    )}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full self-start sm:self-auto">
                    {Math.round(progressToFreeShipping)}%
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-800 font-bold mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('cart.freeDeliveryUnlocked')}</span>
                </div>
              )}
              <div className="w-full bg-emerald-200/70 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressToFreeShipping}%` }}
                />
              </div>
            </div>

            {/* Cart Items */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
              {validCart.map((item) => {
                const currentPrice = item.product?.discount_price || item.product?.price || 0;
                const originalPrice = item.product?.discount_price ? item.product?.price : null;
                const itemTotal = currentPrice * (item.quantity || 1);

                return (
                  <div
                    key={`${item.product.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition hover:bg-gray-50/50"
                  >
                    {/* Product Image */}
                    <Link
                      to={`/product/${item.product.id}`}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 block"
                    >
                      <img
                        src={item.product.images?.[0] || '/logo.webp'}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider truncate">
                          {item.product.brand || 'Kintesi'}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition sm:hidden cursor-pointer"
                          title={t('cart.remove')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <Link
                        to={`/product/${item.product.id}`}
                        className="text-xs sm:text-sm font-bold text-gray-900 hover:text-rose-600 transition line-clamp-2 leading-snug"
                      >
                        {item.product.title}
                      </Link>

                      {/* Variant Badges */}
                      {(item.selectedColor || item.selectedSize) && (
                        <div className="flex items-center gap-2 pt-0.5">
                          {item.selectedColor && (
                            <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                              {item.selectedColor}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                              {item.selectedSize}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Unit Price */}
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-xs sm:text-sm font-black text-rose-600">
                          {formatPrice(currentPrice)}
                        </span>
                        {originalPrice && (
                          <span className="text-[10px] text-gray-400 line-through">
                            {formatPrice(originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Selector & Item Subtotal */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      {/* Quantity Buttons */}
                      <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50/60 overflow-hidden shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1.5 sm:p-2 text-gray-600 hover:bg-white transition cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-bold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="p-1.5 sm:p-2 text-gray-600 hover:bg-white transition cursor-pointer disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total for this line */}
                      <div className="text-right min-w-[75px]">
                        <span className="text-xs sm:text-sm font-black text-gray-900">
                          {formatPrice(itemTotal)}
                        </span>
                      </div>

                      {/* Desktop Delete Button */}
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="hidden sm:inline-flex text-gray-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                        title={t('cart.remove')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Continue Shopping Button */}
            <div className="sm:hidden pt-2">
              <Link
                to="/shop"
                className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition"
              >
                <span>{t('cart.continue')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right: Order Summary Box (4 cols) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                {t('cart.orderSummary')}
              </h2>

              {/* Coupon Code Box */}
              <div>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={t('cart.couponPlaceholder')}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer active:scale-95 shrink-0"
                  >
                    {t('cart.apply')}
                  </button>
                </form>

                {appliedCoupon && (
                  <div className="mt-2.5 flex items-center justify-between bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-100 text-xs">
                    <span className="font-bold uppercase tracking-wider font-mono">
                      {appliedCoupon.code}
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-emerald-700 hover:text-rose-600 text-[10px] font-bold underline transition"
                    >
                      {t('cart.remove')}
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs border-t border-gray-100 pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>{t('cart.subtotal')}</span>
                  <span className="font-bold text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t('cart.deliveryFee')}</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold uppercase">{t('cart.freeShipping')}</span>
                    ) : (
                      <span className="font-bold text-gray-900">{formatPrice(shippingFee)}</span>
                    )}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>{t('cart.discount')}</span>
                    <span className="font-bold">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-100 pt-3">
                  <span>{t('cart.total')}</span>
                  <span className="text-base text-rose-600">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-2xl transition shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95 cursor-pointer"
              >
                <span>{t('cart.checkout')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Trust & Guarantee Badges */}
              <div className="pt-2 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('cart.secureCheckout')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{t('cart.codAvailable')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{t('cart.easyReturns')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../lib/utils';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  ChevronRight,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const { user, openAuthModal } = useAuth();
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
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');

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
      openAuthModal('login');
      return;
    }
    navigate('/checkout');
  };

  const validCart = cart.filter((item) => item && item.product && item.product.id);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 sm:pb-12 space-y-4 sm:space-y-6">
      {/* Top Navigation & Header */}
      <div className="space-y-2 pb-3 border-b border-gray-200">
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <Link to="/" className="hover:text-rose-600 transition">
            {t('nav.home')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-900 font-semibold">{t('cart.title')}</span>
        </nav>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 text-gray-600 hover:text-rose-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              title="Go Back"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                {t('cart.title')}
              </h1>
              <p className="text-xs text-gray-500">
                {validCart.length} {t('cart.items')}
              </p>
            </div>
          </div>
          {validCart.length > 0 && (
            <Link
              to="/shop"
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 transition"
            >
              <span>{t('cart.continue')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {validCart.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 sm:py-24 bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-xs max-w-md mx-auto">
          <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3.5">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 mb-1.5">{t('cart.empty')}</h2>
          <p className="text-xs text-gray-500 mb-5 max-w-xs mx-auto">
            {t('cart.emptyDesc')}
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-rose-600/20 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t('cart.exploreCatalog')}</span>
          </Link>
        </div>
      ) : (
        /* Cart Content Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          {/* Main Item List (8 cols) - Compact List Format */}
          <div className="lg:col-span-8 space-y-4">
            {/* List Container */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs divide-y divide-gray-100 overflow-hidden">
              {validCart.map((item) => {
                const currentPrice = item.product?.discount_price || item.product?.price || 0;
                const originalPrice = item.product?.discount_price ? item.product?.price : null;
                const itemTotal = currentPrice * (item.quantity || 1);

                return (
                  <div
                    key={`${item.product.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`}
                    className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition hover:bg-gray-50/60"
                  >
                    {/* Compact Image */}
                    <Link
                      to={`/product/${item.product.id}`}
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 block relative"
                    >
                      <img
                        src={item.product.images?.[0] || '/logo.webp'}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1 text-[10px] text-gray-400 font-medium">
                        <span className="truncate uppercase font-bold">{item.product.brand || 'Kintesi'}</span>
                        <span className="font-mono bg-gray-100 text-gray-600 px-1 py-0.2 rounded text-[9px]">
                          {item.product.sku || ('KT-' + item.product.id.slice(0, 5).toUpperCase())}
                        </span>
                      </div>

                      <Link
                        to={`/product/${item.product.id}`}
                        className="text-xs sm:text-sm font-bold text-gray-900 hover:text-rose-600 transition line-clamp-1 leading-tight"
                      >
                        {item.product.title}
                      </Link>

                      {/* Variant Tags */}
                      {(item.selectedColor || item.selectedSize) && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          {item.selectedColor && (
                            <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded font-medium">
                              {item.selectedColor}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded font-medium">
                              {item.selectedSize}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Unit Price & Total */}
                      <div className="flex items-baseline gap-1.5 pt-0.5">
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

                    {/* Quantity Selector, Total & Delete */}
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      {/* Compact Quantity Control */}
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/70 overflow-hidden shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 sm:p-1.5 text-gray-600 hover:bg-white transition cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 sm:px-2.5 text-xs font-bold text-gray-800 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="p-1 sm:p-1.5 text-gray-600 hover:bg-white transition cursor-pointer disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[65px] hidden sm:block">
                        <span className="text-xs sm:text-sm font-black text-gray-900">
                          {formatPrice(itemTotal)}
                        </span>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title={t('cart.remove')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Coupon Box & Breakdown (Compact) */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:hidden space-y-3">
              {/* Coupon Form */}
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
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                >
                  {t('cart.apply')}
                </button>
              </form>

              {appliedCoupon && (
                <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-100 text-xs">
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

              {/* Price Details */}
              <div className="space-y-1.5 text-xs pt-1 border-t border-gray-100">
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
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>{t('cart.discount')}</span>
                    <span className="font-bold">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Desktop Order Summary Box (4 cols - Sticky) */}
          <div className="hidden lg:block lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                {t('cart.orderSummary')}
              </h2>

              {/* Coupon Form */}
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
                    className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
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

              {/* Desktop Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-2xl transition shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95 cursor-pointer"
              >
                <span>{t('cart.checkout')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Trust Badges */}
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

      {/* Sticky Mobile Bottom Checkout Bar (Always Visible - No Scrolling Needed!) */}
      {validCart.length > 0 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-6px_25px_rgba(0,0,0,0.1)] px-4 py-2.5 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div>
            <span className="text-[10px] text-gray-500 font-semibold block uppercase tracking-wider">
              {t('cart.total')}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-rose-600">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          <button
            onClick={handleProceedToCheckout}
            className="flex-1 max-w-[200px] py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl transition shadow-md shadow-rose-600/25 flex items-center justify-center gap-1.5 text-xs active:scale-95 cursor-pointer"
          >
            <span>{t('cart.checkout')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

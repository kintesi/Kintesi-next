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
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
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
  const { language, t } = useLanguage();
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-6 sm:space-y-8">
      {/* Page Header (Identical design language to WishlistPage) */}
      <div className="pb-4 sm:pb-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4 fill-rose-500" />
            <span>{t('cart.title')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            {t('cart.title')}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {validCart.length} {language === 'bn' ? 'টি পণ্য কার্টে আছে' : 'items in your cart'}
          </p>
        </div>

        {validCart.length > 0 && (
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition self-start sm:self-auto"
          >
            <span>{t('cart.continue')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {validCart.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 sm:py-20 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{t('cart.empty')}</h3>
          <p className="text-xs text-gray-500 mb-6">{t('cart.emptyDesc')}</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-rose-600/20"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t('cart.exploreCatalog')}</span>
          </Link>
        </div>
      ) : (
        /* Cart Content Grid (2 Columns: Items on Left, Order Summary on Right) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Main Item List (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            {/* Mobile List View (List আকারে - Like WishlistPage) */}
            <div className="flex flex-col gap-3 sm:hidden">
              {validCart.map((item) => {
                const currentPrice = item.product?.discount_price || item.product?.price || 0;
                const originalPrice = item.product?.discount_price ? item.product?.price : null;
                const discountPercent = originalPrice
                  ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
                  : 0;
                const itemTotal = currentPrice * (item.quantity || 1);

                return (
                  <div
                    key={`${item.product.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`}
                    className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs flex gap-3 relative transition hover:border-rose-200"
                  >
                    {/* Left: Product Image */}
                    <Link
                      to={`/product/${item.product.id}`}
                      className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 relative block"
                    >
                      <img
                        src={item.product.images?.[0] || '/logo.webp'}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                      {discountPercent > 0 && (
                        <span className="absolute top-1 left-1 bg-rose-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow">
                          -{discountPercent}%
                        </span>
                      )}
                    </Link>

                    {/* Right: Product Info & Actions */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Brand and SKU */}
                        <div className="flex items-center justify-between gap-1 text-[10px] text-gray-400 font-medium">
                          <span className="truncate uppercase font-bold">{item.product.brand || 'Kintesi'}</span>
                          <span className="font-mono shrink-0 bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded text-[9px]">
                            {item.product.sku || ('KT-' + item.product.id.slice(0, 5).toUpperCase())}
                          </span>
                        </div>

                        {/* Title */}
                        <Link
                          to={`/product/${item.product.id}`}
                          className="text-xs font-bold text-gray-900 line-clamp-2 hover:text-rose-600 transition leading-snug mt-0.5"
                        >
                          {item.product.title}
                        </Link>

                        {/* Variant Badges */}
                        {(item.selectedColor || item.selectedSize) && (
                          <div className="flex items-center gap-1 pt-1">
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

                        {/* Pricing */}
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-sm font-black text-rose-600">
                            {formatPrice(currentPrice)}
                          </span>
                          {originalPrice && (
                            <span className="text-[11px] text-gray-400 line-through">
                              {formatPrice(originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Actions Row */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 mt-1.5">
                        {/* Quantity Selector */}
                        <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/80 overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 text-gray-600 hover:bg-white transition cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-gray-800 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="p-1 text-gray-600 hover:bg-white transition cursor-pointer disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Line Item Total */}
                        <span className="text-xs font-black text-gray-900">
                          {formatPrice(itemTotal)}
                        </span>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title={t('cart.remove')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop List View (Clean horizontal rows) */}
            <div className="hidden sm:flex sm:flex-col sm:gap-3.5">
              {validCart.map((item) => {
                const currentPrice = item.product?.discount_price || item.product?.price || 0;
                const originalPrice = item.product?.discount_price ? item.product?.price : null;
                const itemTotal = currentPrice * (item.quantity || 1);

                return (
                  <div
                    key={`${item.product.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`}
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex items-center gap-4 transition hover:border-rose-200"
                  >
                    {/* Product Image */}
                    <Link
                      to={`/product/${item.product.id}`}
                      className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 block"
                    >
                      <img
                        src={item.product.images?.[0] || '/logo.webp'}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                        <span className="uppercase font-bold">{item.product.brand || 'Kintesi'}</span>
                        <span className="font-mono bg-gray-100 text-gray-600 px-1 py-0.2 rounded text-[9px]">
                          {item.product.sku || ('KT-' + item.product.id.slice(0, 5).toUpperCase())}
                        </span>
                      </div>

                      <Link
                        to={`/product/${item.product.id}`}
                        className="text-sm font-bold text-gray-900 hover:text-rose-600 transition line-clamp-1 mt-0.5"
                      >
                        {item.product.title}
                      </Link>

                      {/* Variant Badges */}
                      {(item.selectedColor || item.selectedSize) && (
                        <div className="flex items-center gap-1.5 pt-1">
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

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-black text-rose-600">
                          {formatPrice(currentPrice)}
                        </span>
                        {originalPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50/80 overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1.5 text-gray-600 hover:bg-white transition cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-gray-800 min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="p-1.5 text-gray-600 hover:bg-white transition cursor-pointer disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right min-w-[80px]">
                      <span className="text-sm font-black text-gray-900">
                        {formatPrice(itemTotal)}
                      </span>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title={t('cart.remove')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (4 cols) - Order Summary Card */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-5">
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

              {/* Checkout Button */}
              <button
                type="button"
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
    </div>
  );
};

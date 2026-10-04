import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Heart, ShoppingCart } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice, calculateDiscount, getProductUrl, optimizeImageUrl } from '../../lib/utils';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

interface FlashSaleGridProps {
  products: Product[];
  hours?: number;
  endsAt?: string;
}

export const FlashSaleGrid: React.FC<FlashSaleGridProps> = ({ products, hours = 4, endsAt }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Countdown timer logic
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 35 });

  useEffect(() => {
    const calculateTime = () => {
      if (endsAt) {
        const diff = new Date(endsAt).getTime() - Date.now();
        if (diff > 0) {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          return { hours: h, minutes: m, seconds: s };
        }
      }
      // Fallback cyclic 4-hour countdown
      const now = new Date();
      const h = 3 - (now.getHours() % 4);
      const m = 59 - now.getMinutes();
      const s = 59 - now.getSeconds();
      return { hours: h, minutes: m, seconds: s };
    };

    setTimeLeft(calculateTime());
    const interval = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt]);

  const displayProducts = products.slice(0, 5);

  if (displayProducts.length === 0) return null;

  return (
    <section className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-3">
      <div className="rounded-3xl bg-gradient-to-br from-rose-50/50 via-white to-rose-50/30 border border-rose-100 p-4 sm:p-6 shadow-sm">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-rose-100/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <Zap className="w-3.5 h-3.5 fill-white" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-gray-950 tracking-tight">
                Flash Sale
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                Limited Time
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5">
              Stock-supported prices renewed twice every 24 hours
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer Pills */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <span className="text-[11px] text-gray-500 font-semibold mr-0.5">Ends in:</span>
              <span className="w-7 h-7 rounded-lg bg-gray-950 text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-gray-400 font-bold">:</span>
              <span className="w-7 h-7 rounded-lg bg-gray-950 text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-gray-400 font-bold">:</span>
              <span className="w-7 h-7 rounded-lg bg-gray-950 text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>

            <Link
              to="/showcase/flash_sale"
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 5-Column Responsive Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {displayProducts.map((p, index) => {
            const discountPercent = calculateDiscount(p.price, p.discount_price) || (15 + (index * 3) % 25);
            const isWishlisted = isInWishlist(p.id);
            const currentPrice = p.discount_price || p.price;
            
            // Dynamic mock stock percentage for realistic progress bar
            const soldCount = 35 + ((index * 13) % 45);
            const claimedPercent = Math.min(95, 65 + ((index * 9) % 30));

            return (
              <div
                key={p.id}
                className="group bg-white rounded-2xl border border-rose-100/80 p-3 shadow-xs hover:shadow-xl hover:border-rose-300 transition-all flex flex-col justify-between relative overflow-hidden"
              >
                {/* Floating Discount Tag */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-md uppercase tracking-wider shadow-xs">
                    {discountPercent}% OFF
                  </span>
                </div>

                {/* Wishlist Heart Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWishlist(p);
                  }}
                  className={`absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg transition ${
                    isWishlisted
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-white/80 hover:bg-white text-gray-400 hover:text-rose-600 shadow-2xs border border-gray-100'
                  }`}
                  title="Wishlist"
                >
                  <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                </button>

                {/* Product Image */}
                <Link
                  to={getProductUrl(p)}
                  className="block relative aspect-square bg-slate-50/60 rounded-xl overflow-hidden p-2.5 mb-2.5 flex items-center justify-center"
                >
                  <img
                    src={optimizeImageUrl(p.images?.[0], 350)}
                    alt={p.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/navbar-logo.webp';
                    }}
                  />
                </Link>

                {/* Details */}
                <div className="space-y-1.5">
                  <Link to={getProductUrl(p)} className="block">
                    <h3 className="font-bold text-gray-900 text-xs leading-snug line-clamp-1 group-hover:text-rose-600 transition">
                      {p.title}
                    </h3>
                  </Link>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-rose-600 font-black text-sm">
                      {formatPrice(currentPrice)}
                    </span>
                    {p.price && p.discount_price && Number(p.price) > Number(p.discount_price) && (
                      <span className="text-gray-400 line-through text-[10px] font-semibold">
                        {formatPrice(p.price)}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar (Urgency Driver) */}
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between text-[9px] text-gray-500 font-semibold">
                      <span>Sold: {soldCount}</span>
                      <span className="text-rose-600 font-bold">{claimedPercent}% Claimed</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full transition-all duration-500"
                        style={{ width: `${claimedPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Claim Deal CTA Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => addToCart(p, 1)}
                      className="w-full py-2 bg-gray-950 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Claim Deal</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Dices, Star, Heart, Plus, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice, calculateDiscount, getProductUrl, optimizeImageUrl } from '../../lib/utils';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

interface JustForYouSectionProps {
  products: Product[];
  onRefreshFeed?: () => void;
  isRefreshingFeed?: boolean;
}

type FilterTab = 'all' | 'top_rated' | 'new_arrivals' | 'favorites';

export const JustForYouSection: React.FC<JustForYouSectionProps> = ({
  products,
  onRefreshFeed,
  isRefreshingFeed,
}) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [visibleCount, setVisibleCount] = useState(12);

  // Filtered products based on active tab
  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (activeTab === 'top_rated') {
      list = list.sort((a, b) => (Number(b.rating) || 5) - (Number(a.rating) || 5));
    } else if (activeTab === 'new_arrivals') {
      list = list.reverse();
    } else if (activeTab === 'favorites') {
      list = list.filter((p) => p.is_featured || p.is_trending);
    }
    return list;
  }, [products, activeTab]);

  const displayedList = filteredProducts.slice(0, visibleCount);

  return (
    <section className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4 sm:space-y-6">
      
      {/* Header with Title & Filter Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-950 tracking-tight flex items-center gap-2">
              Just For You
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
              Explore hand-curated lifestyle essentials picked for your taste
            </p>
          </div>
        </div>

        {/* Filter Pills + Shuffle Button */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200/80 text-xs shrink-0">
            {[
              { id: 'all', label: 'All Recommendations' },
              { id: 'top_rated', label: 'Top Rated' },
              { id: 'new_arrivals', label: 'Newest Arrivals' },
              { id: 'favorites', label: 'Local Favorites' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as FilterTab);
                  setVisibleCount(12);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gray-950 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {onRefreshFeed && (
            <button
              type="button"
              onClick={onRefreshFeed}
              disabled={isRefreshingFeed}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-700 hover:text-rose-600 text-xs font-bold transition active:scale-95 cursor-pointer shrink-0 shadow-2xs"
              title="Shuffle recommendation mix"
            >
              <Dices className={`w-3.5 h-3.5 ${isRefreshingFeed ? 'animate-spin text-rose-600' : ''}`} />
              <span>Shuffle Feed</span>
            </button>
          )}
        </div>
      </div>

      {/* 4-Column Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
        {displayedList.map((product) => {
          const discountPercent = calculateDiscount(product.price, product.discount_price);
          const isWishlisted = isInWishlist(product.id);
          const currentPrice = product.discount_price || product.price;
          const ratingNum = product.rating ? Number(product.rating).toFixed(1) : '4.8';
          const reviewCount = product.review_count || 128;

          return (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-gray-100 hover:border-rose-300 p-3 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden"
            >
              {/* Floating Discount Tag */}
              <div className="absolute top-2.5 left-2.5 z-10">
                {discountPercent > 0 && (
                  <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-md uppercase tracking-wider shadow-xs">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Wishlist Heart Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleWishlist(product);
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

              {/* Product Image Stage */}
              <Link
                to={getProductUrl(product)}
                className="block relative aspect-square bg-slate-50/60 rounded-xl overflow-hidden p-3 mb-2.5 flex items-center justify-center"
              >
                <img
                  src={optimizeImageUrl(product.images?.[0], 400)}
                  alt={product.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '/navbar-logo.webp';
                  }}
                />
              </Link>

              {/* Card Meta & Info */}
              <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Rating + Color Swatches Row */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 gap-1 pb-1">
                    <div className="flex items-center gap-1 font-bold text-gray-800">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{ratingNum}</span>
                      <span className="text-gray-400 font-normal text-[10px]">({reviewCount})</span>
                    </div>

                    {/* Color Swatch Dots */}
                    {product.colors && product.colors.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <div className="flex items-center -space-x-1">
                          {product.colors.slice(0, 3).map((c, i) => (
                            <span
                              key={i}
                              className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs"
                              style={{ backgroundColor: c.hex || '#e11d48' }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {product.colors.length} Colors
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-bold">In Stock</span>
                    )}
                  </div>

                  {/* Title */}
                  <Link to={getProductUrl(product)} className="block">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-rose-600 transition">
                      {product.title}
                    </h3>
                  </Link>
                </div>

                {/* Price Row + "+ Add" Button */}
                <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-rose-600 font-black text-sm sm:text-base leading-tight">
                      {formatPrice(currentPrice)}
                    </div>
                    {product.price && product.discount_price && Number(product.price) > Number(product.discount_price) && (
                      <div className="text-gray-400 line-through text-[10px] font-semibold">
                        {formatPrice(product.price)}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart(product, 1)}
                    className="px-3 py-1.5 bg-gray-950 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

              </div>

            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {visibleCount < filteredProducts.length && (
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => Math.min(prev + 12, filteredProducts.length))}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-rose-50 text-gray-800 hover:text-rose-600 font-bold text-xs border border-gray-200 hover:border-rose-300 shadow-2xs hover:shadow-xs transition active:scale-95 cursor-pointer"
          >
            <ChevronDown className="w-4 h-4 text-gray-500" />
            <span>Load More Authentic Products</span>
          </button>
        </div>
      )}

    </section>
  );
};

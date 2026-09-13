import React from 'react';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { ProductCard } from '../components/common/ProductCard';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { formatPrice } from '../lib/utils';

export const WishlistPage: React.FC = () => {
  const { wishlist, clearWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-16 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Heart className="w-4 h-4 fill-rose-500" /> Saved Items
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">My Wishlist</h1>
          <p className="text-xs text-gray-500 mt-1">{wishlist.length} items saved for later</p>
        </div>

        {wishlist.length > 0 && (
          <button
            onClick={clearWishlist}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition self-start sm:self-auto cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Wishlist</span>
          </button>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-16 sm:py-20 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Your wishlist is empty</h3>
          <p className="text-xs text-gray-500 mb-6">Explore our catalog and click the heart icon to save products.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-rose-600/20"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Start Exploring</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile List View (List আকারে) */}
          <div className="flex flex-col gap-3 sm:hidden">
            {wishlist.map((product) => {
              const currentPrice = product.discount_price || product.price;
              const originalPrice = product.discount_price ? product.price : null;
              const discountPercent = originalPrice
                ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs flex gap-3 relative transition hover:border-rose-200"
                >
                  {/* Left: Product Image */}
                  <Link
                    to={`/product/${product.id}`}
                    className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 relative block"
                  >
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                      alt={product.title}
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
                        <span className="truncate">{product.brand || 'Kintesi'}</span>
                        <span className="font-mono shrink-0 bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded text-[9px]">
                          {product.sku || ('KT-' + product.id.slice(0, 5).toUpperCase())}
                        </span>
                      </div>

                      {/* Title */}
                      <Link
                        to={`/product/${product.id}`}
                        className="text-xs font-bold text-gray-900 line-clamp-2 hover:text-rose-600 transition leading-snug mt-0.5"
                      >
                        {product.title}
                      </Link>

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

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 mt-1.5">
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleWishlist(product)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition shrink-0 cursor-pointer"
                        title="Remove from Wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Grid View */}
          <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

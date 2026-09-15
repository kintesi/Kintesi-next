import React from 'react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { formatPrice, calculateDiscount } from '../../lib/utils';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onWishlistToggle?: (product: Product, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onWishlistToggle }) => {
  const { user, openAuthModal } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const discountPercent = calculateDiscount(product.price, product.discount_price);
  const isWishlisted = isInWishlist(product.id);
  const currentPrice = product.discount_price || product.price;

  return (
    <div className="group bg-white rounded-2xl border border-rose-100/80 hover:border-rose-300 shadow-[0_2px_8px_rgba(225,29,72,0.04)] hover:shadow-[0_8px_20px_rgba(225,29,72,0.08)] transition-all flex flex-col overflow-hidden relative">
      
      {/* Floating Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
        {discountPercent > 0 && (
          <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-md uppercase tracking-wider shadow-sm">
            {discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onWishlistToggle) {
            onWishlistToggle(product, e);
          } else {
            toggleWishlist(product);
          }
        }}
        className={`absolute top-2.5 right-2.5 z-10 p-2 rounded-xl transition shadow-xs ${
          isWishlisted
            ? 'bg-rose-50 text-rose-600 shadow-rose-600/20'
            : 'bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-500 border border-rose-100/60'
        }`}
        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
      </button>

      {/* Product Image */}
      <Link
        to={`/product/${product.id}`}
        className="block relative aspect-square bg-white border-b border-rose-50 overflow-hidden p-3"
      >
        <img
          src={product.images?.[0] || '/logo.webp'}
          alt={product.title}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          width="300"
          height="300"
        />
      </Link>

      {/* Card Body */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 bg-white justify-between">
        
        <div className="space-y-1">
          {/* Brand & Rating */}
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span className="uppercase font-bold text-rose-700 truncate max-w-[130px]">
              {product.brand || 'Kintesi'}
            </span>
            {Boolean(product.review_count && product.review_count > 0 && product.rating && product.rating > 0) ? (
              <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{Number(product.rating).toFixed(1)}</span>
                <span className="text-gray-400 font-normal text-[10px]">({product.review_count})</span>
              </div>
            ) : null}
          </div>

          {/* Title */}
          <Link to={`/product/${product.id}`} className="block">
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 hover:text-rose-600 transition">
              {product.title}
            </h3>
          </Link>

          {/* Color & Size Variant Hints */}
          {( (product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0) ) && (
            <div className="flex items-center justify-between pt-1 text-[10px] text-gray-400">
              {product.colors && product.colors.length > 0 && (
                <div className="flex items-center gap-1">
                  {product.colors.slice(0, 3).map((c, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-gray-300 shadow-xs"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                  {product.colors.length > 3 && (
                    <span className="text-[9px] text-gray-400 font-bold">+{product.colors.length - 3}</span>
                  )}
                </div>
              )}
              {product.sizes && product.sizes.length > 0 && (
                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-gray-600 truncate max-w-[80px]">
                  {product.sizes[0]}{product.sizes.length > 1 ? ` +${product.sizes.length - 1}` : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price & Add to Cart Footer */}
        <div className="mt-3 pt-2.5 border-t border-rose-50 flex items-center justify-between gap-1.5">
          <div>
            <div className="text-rose-700 font-black text-sm sm:text-base leading-tight">
              {formatPrice(currentPrice)}
            </div>
            {product.discount_price && (
              <div className="text-gray-400 line-through text-[10px] font-semibold">
                {formatPrice(product.price)}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (!user) {
                openAuthModal('login');
                return;
              }
              addToCart(product, 1);
            }}
            className="p-2 sm:px-3 sm:py-2 bg-gray-950 hover:bg-rose-600 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            title={user ? 'Add to Cart' : 'Account required to add to cart'}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from '../auth/AuthModal';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Home,
  LayoutGrid,
  ShoppingBag,
  Heart,
  User,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { totalItemCount, isCartOpen, setIsCartOpen } = useCart();
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // On product detail and checkout pages, hide standard bottom navigation so bottom action bar is unobstructed
  if (
    location.pathname.startsWith('/product/') ||
    location.pathname === '/checkout'
  ) {
    return null;
  }

  return (
    <>
      {/* Ultra-Premium Sleek Floating Mobile Navigation Dock */}
      <nav
        aria-label="Mobile Navigation Dock"
        className="md:hidden fixed bottom-2.5 left-4 right-4 max-w-[340px] mx-auto z-40 bg-white/95 backdrop-blur-xl border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] rounded-full px-1.5 py-1 text-gray-900 ring-1 ring-black/[0.04] transition-all duration-300"
      >
        <div className="grid grid-cols-5 items-center h-[44px] text-center">
          
          {/* 1. Home */}
          <Link
            to="/"
            onClick={() => setIsCartOpen(false)}
            className={`flex flex-col items-center justify-center h-full rounded-full transition-all duration-200 active:scale-90 ${
              isActive('/')
                ? 'text-rose-600 bg-rose-50/90 font-bold shadow-2xs scale-[1.03]'
                : 'text-gray-400 hover:text-gray-700 font-medium'
            }`}
          >
            <Home className={`w-[18px] h-[18px] ${isActive('/') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[9px] mt-0.5 tracking-tight">{t('nav.home')}</span>
          </Link>

          {/* 2. Category */}
          <Link
            to="/shop"
            onClick={() => setIsCartOpen(false)}
            className={`flex flex-col items-center justify-center h-full rounded-full transition-all duration-200 active:scale-90 ${
              isActive('/shop')
                ? 'text-rose-600 bg-rose-50/90 font-bold shadow-2xs scale-[1.03]'
                : 'text-gray-400 hover:text-gray-700 font-medium'
            }`}
          >
            <LayoutGrid className={`w-[18px] h-[18px] ${isActive('/shop') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[9px] mt-0.5 tracking-tight">{t('nav.category')}</span>
          </Link>

          {/* 3. Dedicated Cart Page Link */}
          <Link
            to="/cart"
            className={`flex flex-col items-center justify-center h-full rounded-full transition-all duration-200 relative cursor-pointer active:scale-90 ${
              isActive('/cart')
                ? 'text-rose-600 bg-rose-50/90 font-bold shadow-2xs scale-[1.03]'
                : 'text-gray-400 hover:text-gray-700 font-medium'
            }`}
            aria-label="Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className={`w-[18px] h-[18px] ${isActive('/cart') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-[8px] font-black rounded-full min-w-[15px] h-[15px] px-0.5 flex items-center justify-center shadow-xs ring-1.5 ring-white animate-scale-in">
                  {totalItemCount}
                </span>
              )}
            </div>
            <span className="text-[9px] mt-0.5 tracking-tight">{t('nav.cart')}</span>
          </Link>

          {/* 4. Wishlist */}
          <Link
            to="/wishlist"
            onClick={() => setIsCartOpen(false)}
            className={`flex flex-col items-center justify-center h-full rounded-full transition-all duration-200 active:scale-90 ${
              isActive('/wishlist')
                ? 'text-rose-600 bg-rose-50/90 font-bold shadow-2xs scale-[1.03]'
                : 'text-gray-400 hover:text-gray-700 font-medium'
            }`}
          >
            <Heart className={`w-[18px] h-[18px] ${isActive('/wishlist') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[9px] mt-0.5 tracking-tight">{t('nav.wishlist')}</span>
          </Link>

          {/* 5. Profile */}
          {user ? (
            <Link
              to="/profile"
              onClick={() => setIsCartOpen(false)}
              className={`flex flex-col items-center justify-center h-full rounded-full transition-all duration-200 active:scale-90 ${
                isActive('/profile')
                  ? 'text-rose-600 bg-rose-50/90 font-bold shadow-2xs scale-[1.03]'
                : 'text-gray-400 hover:text-gray-700 font-medium'
              }`}
            >
              <div className="relative">
                <User className={`w-[18px] h-[18px] ${isActive('/profile') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isAdmin && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-600 rounded-full border border-white" />
                )}
              </div>
              <span className="text-[9px] mt-0.5 tracking-tight">{t('nav.profile')}</span>
            </Link>
          ) : (
            <button
              onClick={() => {
                setIsCartOpen(false);
                setIsAuthOpen(true);
              }}
              className="flex flex-col items-center justify-center h-full rounded-full text-gray-400 hover:text-rose-600 transition-all duration-200 font-medium cursor-pointer active:scale-90"
            >
              <User className="w-[18px] h-[18px] stroke-[1.8]" />
              <span className="text-[9px] mt-0.5 tracking-tight">{t('nav.profile')}</span>
            </button>
          )}

        </div>
      </nav>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};

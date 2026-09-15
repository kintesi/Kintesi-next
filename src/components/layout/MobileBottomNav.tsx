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
      {/* Ultra-Premium Floating Dynamic Island Mobile Navigation Dock */}
      <nav
        aria-label="Mobile Navigation Dock"
        className="md:hidden fixed bottom-3.5 left-3.5 right-3.5 max-w-md mx-auto z-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-[0_12px_40px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.06)] rounded-full p-1.5 px-2 text-gray-900 dark:text-gray-100 ring-1 ring-black/[0.04] transition-all duration-300"
      >
        <div className="grid grid-cols-5 items-center h-[54px] text-center">
          
          {/* 1. Home */}
          <Link
            to="/"
            onClick={() => setIsCartOpen(false)}
            className={`flex flex-col items-center justify-center h-full rounded-full transition-all duration-200 active:scale-90 ${
              isActive('/')
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 font-bold shadow-xs scale-105'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium'
            }`}
          >
            <Home className={`w-5 h-5 ${isActive('/') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">{t('nav.home')}</span>
          </Link>

          {/* 2. Category */}
          <Link
            to="/shop"
            onClick={() => setIsCartOpen(false)}
            className={`flex flex-col items-center justify-center h-full rounded-full transition-all duration-200 active:scale-90 ${
              isActive('/shop')
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 font-bold shadow-xs scale-105'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium'
            }`}
          >
            <LayoutGrid className={`w-5 h-5 ${isActive('/shop') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">{t('nav.category')}</span>
          </Link>

          {/* 3. Dedicated Cart Page Link (Uniform with other pages) */}
          <Link
            to="/cart"
            className={`flex flex-col items-center justify-center h-full rounded-full transition-all duration-200 relative cursor-pointer active:scale-90 ${
              isActive('/cart')
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 font-bold shadow-xs scale-105'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium'
            }`}
            aria-label="Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className={`w-5 h-5 ${isActive('/cart') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-[9px] font-black rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-gray-900 animate-scale-in">
                  {totalItemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{t('nav.cart')}</span>
          </Link>

          {/* 4. Wishlist */}
          <Link
            to="/wishlist"
            onClick={() => setIsCartOpen(false)}
            className={`flex flex-col items-center justify-center h-full rounded-full transition-all duration-200 active:scale-90 ${
              isActive('/wishlist')
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 font-bold shadow-xs scale-105'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium'
            }`}
          >
            <Heart className={`w-5 h-5 ${isActive('/wishlist') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">{t('nav.wishlist')}</span>
          </Link>

          {/* 5. Profile */}
          {user ? (
            <Link
              to="/profile"
              onClick={() => setIsCartOpen(false)}
              className={`flex flex-col items-center justify-center h-full rounded-full transition-all duration-200 active:scale-90 ${
                isActive('/profile')
                  ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 font-bold shadow-xs scale-105'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium'
              }`}
            >
              <div className="relative">
                <User className={`w-5 h-5 ${isActive('/profile') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isAdmin && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-600 rounded-full border-2 border-white dark:border-gray-900" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{t('nav.profile')}</span>
            </Link>
          ) : (
            <button
              onClick={() => {
                setIsCartOpen(false);
                setIsAuthOpen(true);
              }}
              className="flex flex-col items-center justify-center h-full rounded-full text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 transition-all duration-200 font-medium cursor-pointer active:scale-90"
            >
              <User className="w-5 h-5 stroke-[1.8]" />
              <span className="text-[10px] mt-0.5 tracking-tight">{t('nav.profile')}</span>
            </button>
          )}

        </div>
      </nav>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};

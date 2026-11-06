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
      {/* Mobile Navigation Dock - Govaly Style Clean Rounded Pill */}
      <nav
        aria-label="Mobile Navigation Dock"
        className="md:hidden fixed bottom-3 left-3 right-3 max-w-md mx-auto z-40 bg-white border border-[#f43f5e]/30 shadow-[0_4px_20px_rgba(244,63,94,0.12)] rounded-full px-2 py-1 text-gray-900 transition-all duration-300"
      >
        <div className="grid grid-cols-5 items-center h-[54px] text-center">
          
          {/* 1. Home */}
          <Link
            to="/"
            onClick={() => setIsCartOpen(false)}
            className={`flex flex-col items-center justify-center h-full transition-colors duration-200 active:scale-95 ${
              isActive('/')
                ? 'text-[#e11d48] font-bold'
                : 'text-gray-500 hover:text-gray-800 font-medium'
            }`}
          >
            <Home className={`w-5 h-5 ${isActive('/') ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
            <span className="text-[11px] mt-0.5 tracking-tight">{t('nav.home')}</span>
          </Link>

          {/* 2. Category */}
          <Link
            to="/shop"
            onClick={() => setIsCartOpen(false)}
            className={`flex flex-col items-center justify-center h-full transition-colors duration-200 active:scale-95 ${
              isActive('/shop')
                ? 'text-[#e11d48] font-bold'
                : 'text-gray-500 hover:text-gray-800 font-medium'
            }`}
          >
            <LayoutGrid className={`w-5 h-5 ${isActive('/shop') ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
            <span className="text-[11px] mt-0.5 tracking-tight">{t('nav.category')}</span>
          </Link>

          {/* 3. Dedicated Cart Page Link */}
          <Link
            to="/cart"
            className={`flex flex-col items-center justify-center h-full transition-colors duration-200 relative cursor-pointer active:scale-95 ${
              isActive('/cart')
                ? 'text-[#e11d48] font-bold'
                : 'text-gray-500 hover:text-gray-800 font-medium'
            }`}
            aria-label="Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className={`w-5 h-5 ${isActive('/cart') ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#e11d48] text-white text-[9px] font-black rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center shadow-xs ring-2 ring-white animate-scale-in">
                  {totalItemCount}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">{t('nav.cart')}</span>
          </Link>

          {/* 4. Wishlist */}
          <Link
            to="/wishlist"
            onClick={() => setIsCartOpen(false)}
            className={`flex flex-col items-center justify-center h-full transition-colors duration-200 active:scale-95 ${
              isActive('/wishlist')
                ? 'text-[#e11d48] font-bold'
                : 'text-gray-500 hover:text-gray-800 font-medium'
            }`}
          >
            <Heart className={`w-5 h-5 ${isActive('/wishlist') ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
            <span className="text-[11px] mt-0.5 tracking-tight">{t('nav.wishlist')}</span>
          </Link>

          {/* 5. Profile / Account */}
          {user ? (
            <Link
              to="/profile"
              onClick={() => setIsCartOpen(false)}
              className={`flex flex-col items-center justify-center h-full transition-colors duration-200 active:scale-95 ${
                isActive('/profile')
                  ? 'text-[#e11d48] font-bold'
                  : 'text-gray-500 hover:text-gray-800 font-medium'
              }`}
            >
              <div className="relative">
                <User className={`w-5 h-5 ${isActive('/profile') ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
                {isAdmin && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#e11d48] rounded-full border-2 border-white" />
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{t('nav.profile')}</span>
            </Link>
          ) : (
            <button
              onClick={() => {
                setIsCartOpen(false);
                setIsAuthOpen(true);
              }}
              className="flex flex-col items-center justify-center h-full text-gray-500 hover:text-[#e11d48] transition-colors duration-200 font-medium cursor-pointer active:scale-95"
            >
              <User className="w-5 h-5 stroke-[1.8]" />
              <span className="text-[11px] mt-0.5 tracking-tight">{t('nav.profile')}</span>
            </button>
          )}

        </div>
      </nav>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};

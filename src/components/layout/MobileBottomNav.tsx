import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from '../auth/AuthModal';
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
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path && !isCartOpen;

  return (
    <>
      {/* Sleek, Symmetrical & Ultra-Clean Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-rose-100 shadow-[0_-4px_25px_rgba(225,29,72,0.04)]">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center h-[62px] px-1 text-center">
          
          {/* 1. Home */}
          <Link
            to="/"
            onClick={() => setIsCartOpen(false)}
            className={`flex flex-col items-center justify-center h-full py-1 transition ${
              isActive('/') ? 'text-rose-600 font-bold' : 'text-gray-400 hover:text-gray-700 font-medium'
            }`}
          >
            <Home className={`w-5.5 h-5.5 ${isActive('/') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-1 tracking-tight font-medium">Home</span>
          </Link>

          {/* 2. Category */}
          <Link
            to="/shop"
            onClick={() => setIsCartOpen(false)}
            className={`flex flex-col items-center justify-center h-full py-1 transition ${
              isActive('/shop') ? 'text-rose-600 font-bold' : 'text-gray-400 hover:text-gray-700 font-medium'
            }`}
          >
            <LayoutGrid className={`w-5.5 h-5.5 ${isActive('/shop') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-1 tracking-tight font-medium">Category</span>
          </Link>

          {/* 3. Clean Modern Cart Button with Live Counter Badge */}
          <button
            onClick={() => setIsCartOpen(!isCartOpen)}
            className={`flex flex-col items-center justify-center h-full py-1 transition relative cursor-pointer ${
              isCartOpen ? 'text-rose-600 font-bold' : 'text-gray-400 hover:text-gray-700 font-medium'
            }`}
            aria-label="Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className={`w-5.5 h-5.5 ${isCartOpen ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {totalItemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-black rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-xs animate-scale-in">
                  {totalItemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight font-medium">Cart</span>
          </button>

          {/* 4. Wishlist */}
          <Link
            to="/wishlist"
            onClick={() => setIsCartOpen(false)}
            className={`flex flex-col items-center justify-center h-full py-1 transition ${
              isActive('/wishlist') ? 'text-rose-600 font-bold' : 'text-gray-400 hover:text-gray-700 font-medium'
            }`}
          >
            <Heart className={`w-5.5 h-5.5 ${isActive('/wishlist') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-1 tracking-tight font-medium">Wishlist</span>
          </Link>

          {/* 5. Profile */}
          {user ? (
            <Link
              to="/profile"
              onClick={() => setIsCartOpen(false)}
              className={`flex flex-col items-center justify-center h-full py-1 transition ${
                isActive('/profile') ? 'text-rose-600 font-bold' : 'text-gray-400 hover:text-gray-700 font-medium'
              }`}
            >
              <div className="relative">
                <User className={`w-5.5 h-5.5 ${isActive('/profile') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isAdmin && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-600 rounded-full border border-white" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight font-medium">Profile</span>
            </Link>
          ) : (
            <button
              onClick={() => {
                setIsCartOpen(false);
                setIsAuthOpen(true);
              }}
              className="flex flex-col items-center justify-center h-full py-1 text-gray-400 hover:text-rose-600 transition font-medium cursor-pointer"
            >
              <User className="w-5.5 h-5.5 stroke-[1.8]" />
              <span className="text-[10px] mt-1 tracking-tight font-medium">Profile</span>
            </button>
          )}

        </div>
      </nav>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};

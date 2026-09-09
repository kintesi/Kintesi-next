import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { AuthModal } from '../auth/AuthModal';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  ShieldAlert,
  LogOut,
  Package,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Crown,
  MapPin,
  Grid,
} from 'lucide-react';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../../data/mockData';
import { formatPrice } from '../../lib/utils';
import { matchesProductSearch, getAllLiveProducts } from '../../lib/searchUtils';
import { Product } from '../../types';

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin, isSuperAdmin, signOut } = useAuth();
  const { totalItemCount, setIsCartOpen, subtotal } = useCart();
  const { wishlist } = useWishlist();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDepartmentMenuOpen, setIsDepartmentMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [liveProducts, setLiveProducts] = useState<Product[]>(() => getAllLiveProducts(INITIAL_PRODUCTS));

  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const deptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refreshProducts = () => {
      setLiveProducts(getAllLiveProducts(INITIAL_PRODUCTS));
    };
    refreshProducts();
    window.addEventListener('kintesi_products_updated', refreshProducts);
    return () => window.removeEventListener('kintesi_products_updated', refreshProducts);
  }, []);

  // Smart Search filter using multi-attribute and bilingual synonyms
  const searchFilteredProducts = searchQuery.trim() === ''
    ? []
    : liveProducts.filter((p) => matchesProductSearch(p, searchQuery)).slice(0, 6);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) {
        setIsDepartmentMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(false);
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* Slim Top Announcement Bar (Desktop only) */}
      <div className="hidden sm:flex bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-950 text-white text-[11px] font-semibold py-1 px-4 text-center items-center justify-center gap-2 shadow-xs">
        <Sparkles className="w-3 h-3 animate-pulse text-amber-300" />
        <span>⚡ Welcome to Kintesi! Use coupon <strong className="text-amber-300 uppercase font-black">KINTESI10</strong> for 10% OFF + Free Express Delivery • <span className="text-emerald-300">kintesi.com</span></span>
      </div>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Mobile Top Bar */}
          <div className="md:hidden py-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Link to="/" className="flex items-center gap-1.5 flex-shrink-0">
                <img src="/logo.png" alt="Kintesi" className="w-8 h-8 object-contain" />
                <span className="text-lg font-black tracking-tight text-gray-900">
                  Kin<span className="text-emerald-600">tesi</span>
                </span>
              </Link>

              <div className="flex items-center gap-2">
                <Link to="/wishlist" className="p-1.5 text-gray-600 relative">
                  <Heart className="w-5 h-5" />
                  {wishlist.length > 0 && (
                    <span className="absolute 0 top-0 right-0 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black uppercase">
                    Admin
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search products, brands, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-16 py-2 bg-gray-100/90 focus:bg-white border border-gray-200 focus:border-emerald-500 rounded-full text-xs transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-600 text-white rounded-full text-[11px] font-bold shadow-xs"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Desktop Navigation (Sleek h-16) */}
          <div className="hidden md:flex items-center justify-between h-16 gap-6">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gray-50 p-1 border border-gray-200 group-hover:scale-105 transition shadow-xs flex items-center justify-center">
                <img src="/logo.png" alt="Kintesi" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-gray-900 leading-none">
                  Kin<span className="text-emerald-600">tesi</span>
                </span>
                <span className="text-[9px] text-gray-400 font-bold tracking-wider uppercase mt-0.5">
                  kintesi.com
                </span>
              </div>
            </Link>

            {/* Search Bar - Sleek & Balanced */}
            <div ref={searchRef} className="flex-1 max-w-xl relative">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <input
                  type="text"
                  placeholder="Search products, brands, essentials, electronics, fashion..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  className="w-full pl-10 pr-20 py-2 bg-gray-100/80 hover:bg-gray-100 focus:bg-white border border-gray-200/80 focus:border-emerald-500 rounded-full text-xs transition focus:outline-none focus:ring-3 focus:ring-emerald-500/10"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition shadow-xs"
                >
                  Search
                </button>
              </form>

              {/* Live search dropdown */}
              {showSearchResults && searchQuery.trim() !== '' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-slide-up">
                  {searchFilteredProducts.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {searchFilteredProducts.map((prod) => (
                        <Link
                          key={prod.id}
                          to={`/product/${prod.slug || prod.id}`}
                          onClick={() => setShowSearchResults(false)}
                          className="flex items-center gap-3 p-2.5 hover:bg-gray-50 transition"
                        >
                          <img
                            src={prod.images[0] || '/logo.webp'}
                            alt={prod.title}
                            className="w-10 h-10 object-cover rounded-lg bg-gray-100"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 line-clamp-1">{prod.title}</p>
                            <p className="text-xs text-emerald-600 font-extrabold mt-0.5">
                              {formatPrice(prod.discount_price || prod.price)}
                            </p>
                          </div>
                        </Link>
                      ))}
                      <Link
                        to={`/shop?search=${encodeURIComponent(searchQuery)}`}
                        onClick={() => setShowSearchResults(false)}
                        className="block p-2.5 text-center text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition"
                      >
                        View all results for "{searchQuery}"
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No products found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Action Icons & Profile */}
            <div className="flex items-center gap-3">
              
              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative p-2 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                title="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative h-9 px-3.5 bg-gray-900 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs active:scale-95"
              >
                <div className="relative">
                  <ShoppingCart className="w-4 h-4" />
                  {totalItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-emerald-500 text-white rounded-full text-[8px] font-black flex items-center justify-center">
                      {totalItemCount}
                    </span>
                  )}
                </div>
                <span>{subtotal > 0 ? formatPrice(subtotal) : 'Cart'}</span>
              </button>

              {/* Direct Admin Link */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="h-9 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border border-emerald-200"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Admin</span>
                </Link>
              )}

              {/* User Account / Profile */}
              {user ? (
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="h-9 flex items-center gap-2 px-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition"
                  >
                    {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                      <img
                        src={profile?.avatar_url || user.user_metadata?.avatar_url}
                        alt="User"
                        className="w-6 h-6 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold text-gray-800 leading-none truncate max-w-[100px]">
                        {profile?.full_name || user.email?.split('@')[0]}
                      </span>
                      {isSuperAdmin ? (
                        <span className="text-[9px] font-extrabold text-amber-600 flex items-center gap-0.5 leading-none mt-0.5">
                          <Crown className="w-2.5 h-2.5 text-amber-500" /> Master Admin
                        </span>
                      ) : isAdmin ? (
                        <span className="text-[9px] font-extrabold text-emerald-600 flex items-center gap-0.5 leading-none mt-0.5">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" /> Admin
                        </span>
                      ) : null}
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-1.5 z-50 animate-slide-up">
                      <div className="px-3 py-2 border-b border-gray-100 mb-1">
                        <p className="text-xs font-bold text-gray-900">{profile?.full_name || 'User'}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                      </div>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition mb-1"
                        >
                          <ShieldAlert className="w-4 h-4 text-emerald-600" />
                          <span>Admin Control Panel</span>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                      >
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>Address Book & Profile</span>
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Package className="w-4 h-4 text-gray-400" />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        to="/wishlist"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Heart className="w-4 h-4 text-gray-400" />
                        <span>Wishlist</span>
                      </Link>

                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="h-9 flex items-center gap-1.5 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs transition active:scale-95"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>

          {/* Sleek Category Navigation Strip (Desktop only - Compact h-9) */}
          <nav className="hidden md:flex items-center justify-between border-t border-gray-100 py-1.5 text-xs text-gray-600 font-medium">
            <div className="flex items-center gap-5">
              <div ref={deptRef} className="relative">
                <button
                  onClick={() => setIsDepartmentMenuOpen(!isDepartmentMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <Grid className="w-3 h-3" />
                  <span>Departments</span>
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>

                {isDepartmentMenuOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-1.5 z-50 animate-slide-up space-y-0.5">
                    {INITIAL_CATEGORIES.map((cat) => (
                      <Link
                        key={cat.slug}
                        to={`/shop?category=${cat.slug}`}
                        onClick={() => setIsDepartmentMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
                      >
                        <span className="text-xs font-semibold">{cat.name}</span>
                        <ChevronDown className="w-3 h-3 -rotate-90 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/shop?category=groceries-daily-essentials" className="hover:text-emerald-600 transition font-semibold">
                Groceries
              </Link>
              <Link to="/shop?category=beauty-skincare" className="hover:text-emerald-600 transition font-semibold">
                Beauty & Skincare
              </Link>
              <Link to="/shop?category=home-kitchen" className="hover:text-emerald-600 transition font-semibold">
                Home & Kitchen
              </Link>
              <Link to="/shop?category=mens-fashion" className="hover:text-emerald-600 transition font-semibold">
                Men's Fashion
              </Link>
              <Link to="/shop?category=womens-fashion" className="hover:text-emerald-600 transition font-semibold">
                Women's Fashion
              </Link>
              <Link to="/shop?category=footwear-sneakers" className="hover:text-emerald-600 transition font-semibold">
                Footwear
              </Link>
              <Link to="/shop?category=smartphones-tablets" className="hover:text-emerald-600 transition font-semibold">
                Phones & Laptops
              </Link>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <Link to="/profile" className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>Address Book</span>
              </Link>
              <span className="text-gray-300">•</span>
              <Link to="/orders" className="text-gray-500 hover:text-gray-800">
                Track Order
              </Link>
            </div>
          </nav>

        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};

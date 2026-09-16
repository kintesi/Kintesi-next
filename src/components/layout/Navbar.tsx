import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../../data/mockData';
import { formatPrice } from '../../lib/utils';
import { matchesProductSearch, getAllLiveProducts } from '../../lib/searchUtils';
import { Product, Category } from '../../types';
import { getCategoriesFromDB } from '../../lib/dbService';
import { useSettings } from '../../contexts/SettingsContext';
import { trackSearchQuery } from '../../lib/recommendationEngine';
import { useLanguage } from '../../contexts/LanguageContext';

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin, isSuperAdmin, signOut } = useAuth();
  const { totalItemCount, setIsCartOpen, subtotal } = useCart();
  const { wishlist } = useWishlist();
  const { settings } = useSettings();
  const { language, t } = useLanguage();

  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDepartmentMenuOpen, setIsDepartmentMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [liveProducts, setLiveProducts] = useState<Product[]>(() => getAllLiveProducts(INITIAL_PRODUCTS));
  const [showAnnouncement, setShowAnnouncement] = useState(() => Boolean(settings?.banners?.showTopAnnouncement === true));
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y > 70) {
            setIsScrolled(true);
          } else if (y < 15) {
            setIsScrolled(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function loadNavbarCategories() {
      try {
        const data = await getCategoriesFromDB();
        if (data && data.length > 0) setCategories(data);
      } catch {}
    }
    loadNavbarCategories();
    window.addEventListener('kintesi_categories_updated', loadNavbarCategories);
    return () => window.removeEventListener('kintesi_categories_updated', loadNavbarCategories);
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const deptRef = useRef<HTMLDivElement>(null);

  // Top Announcement 7-Day New User Expiration vs Admin Global Broadcast
  useEffect(() => {
    const banners = settings?.banners;
    if (!banners) return;

    // Must be explicitly enabled by admin
    if (banners.showTopAnnouncement !== true) {
      setShowAnnouncement(false);
      return;
    }

    // Admin published custom offer/campaign -> Show to 100% of all users
    if (banners.isCustomAnnouncement) {
      setShowAnnouncement(true);
      return;
    }

    // Default welcome offer: show only for 7 days to new users/visitors
    try {
      const KEY = 'kintesi_visitor_first_visit';
      const stored = localStorage.getItem(KEY);
      const now = Date.now();
      if (!stored) {
        localStorage.setItem(KEY, now.toString());
        setShowAnnouncement(true);
      } else {
        const firstTime = parseInt(stored, 10);
        if (isNaN(firstTime)) {
          localStorage.setItem(KEY, now.toString());
          setShowAnnouncement(true);
        } else {
          const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
          setShowAnnouncement(now - firstTime <= SEVEN_DAYS_MS);
        }
      }
    } catch {
      setShowAnnouncement(true);
    }
  }, [settings?.banners?.showTopAnnouncement, settings?.banners?.isCustomAnnouncement]);

  const renderAnnouncementText = (text?: string) => {
    let raw = (text || '⚡ Welcome to Kintesi! Use coupon KINTESI10 for 10% OFF')
      .replace(/\s*[\+\&]?\s*Free\s+Express\s+Delivery/gi, '')
      .replace(/\s*Free\s+Express\s+Delivery/gi, '')
      .replace(/\s*[\+\&]?\s*Express\s+Delivery/gi, '')
      .trim();
    if (!raw) {
      raw = '⚡ Welcome to Kintesi! Use coupon KINTESI10 for 10% OFF';
    }
    if (raw.includes('**')) {
      const parts = raw.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="text-amber-300 uppercase font-black mx-0.5">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      });
    }
    if (raw.includes('KINTESI10')) {
      const parts = raw.split(/(KINTESI10)/g);
      return parts.map((part, index) => {
        if (part === 'KINTESI10') {
          return (
            <strong key={index} className="text-amber-300 uppercase font-black mx-0.5">
              KINTESI10
            </strong>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      });
    }
    return raw;
  };

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
      trackSearchQuery(searchQuery.trim());
      setShowSearchResults(false);
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <div className={`sticky top-0 z-40 w-full bg-white ${location.pathname === '/checkout' ? 'hidden md:block' : ''}`}>
        {/* Top Announcement Bar (Collapses smoothly on downward scroll) */}
        {showAnnouncement && (
          <div
            className={`bg-gradient-to-r from-gray-950 via-rose-950 to-gray-950 text-white text-[10px] sm:text-[11px] font-semibold text-center items-center justify-center gap-1.5 sm:gap-2 border-b border-rose-900/40 shadow-xs transition-all duration-300 overflow-hidden ${
              isScrolled ? 'max-h-0 py-0 opacity-0 border-none pointer-events-none' : 'max-h-12 py-1.5 px-3 sm:px-4 opacity-100'
            } flex`}
          >
            <Sparkles className="w-3 h-3 flex-shrink-0 animate-pulse text-amber-300" />
            <span className="truncate sm:overflow-visible">
              {renderAnnouncementText(settings?.banners?.topAnnouncementText)}
            </span>
          </div>
        )}

        <header className="bg-white border-b border-rose-100 shadow-[0_2px_12px_rgba(225,29,72,0.03)] w-full">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Mobile Top Bar */}
          {location.pathname === '/cart' ? (
            <div className="md:hidden py-3 flex items-center justify-between">
              <h1 className="text-base font-black text-gray-900 tracking-tight">
                {language === 'bn' ? 'শপিং কার্ট' : 'Shopping Cart'}
              </h1>
              {totalItemCount > 0 && (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                  {totalItemCount} {language === 'bn' ? 'টি পণ্য' : 'items'}
                </span>
              )}
            </div>
          ) : location.pathname.startsWith('/product/') ? (
            /* Compact Space-Saving Single-Row Product Page Header (No Logo, Search in Top Position) */
            <div className="md:hidden py-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/shop'))}
                className="p-1 -ml-1 text-gray-700 hover:text-rose-600 rounded-full active:bg-rose-50 transition shrink-0 cursor-pointer"
                title="Go Back"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* In place of logo: Search bar */}
              <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0 relative flex items-center">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-20 h-9 bg-gray-50/90 focus:bg-white border border-rose-200/80 focus:border-rose-500 rounded-full text-xs text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-xs"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rose-500/70 pointer-events-none" />
                  <button
                    type="submit"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-full text-[10px] font-bold tracking-wide leading-none shadow-xs hover:shadow-rose-500/25 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                  >
                    {language === 'bn' ? 'খুঁজুন' : 'Search'}
                  </button>
                </div>
              </form>

              {/* Wishlist */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Link to="/wishlist" className="p-1.5 text-gray-600 relative" title={t('nav.wishlist')}>
                  <Heart className="w-5 h-5" />
                  {wishlist.length > 0 && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          ) : (
            <div className="md:hidden py-2">
              {/* Mobile Search Input - Ultra-Premium Capsule Design */}
              <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...'}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchResults(true);
                    }}
                    onFocus={() => setShowSearchResults(true)}
                    className="w-full pl-10 pr-24 h-10 bg-gray-50/90 hover:bg-gray-50 focus:bg-white border border-rose-200/80 focus:border-rose-500 rounded-full text-xs text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-xs"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500/70 pointer-events-none" />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7.5 px-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-full text-[11px] font-bold tracking-wide leading-none shadow-xs hover:shadow-rose-500/25 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                  >
                    {language === 'bn' ? 'খুঁজুন' : 'Search'}
                  </button>
                </div>
              </form>

              {/* Mobile Live search dropdown */}
              {showSearchResults && searchQuery.trim() !== '' && (
                <div className="mt-1.5 bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden z-50 animate-slide-up">
                  {searchFilteredProducts.length > 0 ? (
                    <div className="divide-y divide-rose-50/60 max-h-[55vh] overflow-y-auto">
                      {searchFilteredProducts.slice(0, 5).map((prod) => (
                        <Link
                          key={prod.id}
                          to={`/product/${prod.id}`}
                          onClick={() => setShowSearchResults(false)}
                          className="flex items-center gap-3 p-2.5 hover:bg-rose-50/40 transition"
                        >
                          <img
                            src={prod.images[0] || '/logo.webp'}
                            alt={prod.title}
                            className="w-10 h-10 object-cover rounded-lg bg-gray-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{prod.title}</p>
                            <p className="text-xs text-rose-600 font-extrabold mt-0.5">
                              {formatPrice(prod.discount_price || prod.price)}
                            </p>
                          </div>
                        </Link>
                      ))}
                      <Link
                        to={`/shop?search=${encodeURIComponent(searchQuery)}`}
                        onClick={() => setShowSearchResults(false)}
                        className="block p-2 text-center text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                      >
                        {language === 'bn' ? `"${searchQuery}" এর সব ফলাফল দেখুন` : `View all results for "${searchQuery}"`}
                      </Link>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-gray-500">
                      {language === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Desktop Navigation (Sleek h-16) */}
          <div className="hidden md:flex items-center justify-between h-16 gap-6">
            
            {/* Logo Seamlessly Blended */}
            <Link to="/" className="flex items-center group flex-shrink-0 py-1">
              <img 
                src="/navbar-logo.webp" 
                alt="Kintesi" 
                className="h-9 w-auto max-w-[170px] object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-xs" 
              />
            </Link>

            {/* Search Bar - Sleek & Balanced */}
            <div ref={searchRef} className="flex-1 max-w-xl relative">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <input
                  type="text"
                  placeholder={t('nav.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  className="w-full pl-10 pr-22 py-2 bg-gray-50/80 hover:bg-gray-50 focus:bg-white border border-rose-100 focus:border-rose-500 rounded-full text-xs transition focus:outline-none focus:ring-3 focus:ring-rose-500/15"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-full text-[11px] font-bold tracking-wide leading-none transition-all shadow-xs hover:shadow-rose-500/25 active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  {language === 'bn' ? 'খুঁজুন' : 'Search'}
                </button>
              </form>

              {/* Live search dropdown */}
              {showSearchResults && searchQuery.trim() !== '' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-rose-100/80 overflow-hidden z-50 animate-slide-up">
                  {searchFilteredProducts.length > 0 ? (
                    <div className="divide-y divide-rose-50/60">
                      {searchFilteredProducts.map((prod) => (
                        <Link
                          key={prod.id}
                          to={`/product/${prod.id}`}
                          onClick={() => setShowSearchResults(false)}
                          className="flex items-center gap-3 p-2.5 hover:bg-rose-50/40 transition"
                        >
                          <img
                            src={prod.images[0] || '/logo.webp'}
                            alt={prod.title}
                            className="w-10 h-10 object-cover rounded-lg bg-gray-100"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 line-clamp-1">{prod.title}</p>
                            <p className="text-xs text-rose-600 font-extrabold mt-0.5">
                              {formatPrice(prod.discount_price || prod.price)}
                            </p>
                          </div>
                        </Link>
                      ))}
                      <Link
                        to={`/shop?search=${encodeURIComponent(searchQuery)}`}
                        onClick={() => setShowSearchResults(false)}
                        className="block p-2.5 text-center text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                      >
                        {language === 'bn' ? `"${searchQuery}" এর সব ফলাফল দেখুন` : `View all results for "${searchQuery}"`}
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-500">
                      {language === 'bn' ? `"${searchQuery}" এর জন্য কোনো পণ্য পাওয়া যায়নি` : `No products found matching "${searchQuery}"`}
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
                title={t('nav.wishlist')}
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart Button */}
              <Link
                to="/cart"
                className="relative h-9 px-3.5 bg-gray-950 hover:bg-rose-600 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs active:scale-95 cursor-pointer"
                title={t('cart.title')}
              >
                <div className="relative">
                  <ShoppingCart className="w-4 h-4" />
                  {totalItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-rose-600 text-white rounded-full text-[8px] font-black flex items-center justify-center">
                      {totalItemCount}
                    </span>
                  )}
                </div>
                <span>{subtotal > 0 ? formatPrice(subtotal) : t('nav.cart')}</span>
              </Link>

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
                      <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px]">
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
                        <span className="text-[9px] font-extrabold text-rose-600 flex items-center gap-0.5 leading-none mt-0.5">
                          <ShieldCheck className="w-2.5 h-2.5 text-rose-500" /> Admin
                        </span>
                      ) : null}
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-rose-100 p-1.5 z-50 animate-slide-up">
                      <div className="px-3 py-2 border-b border-rose-50 mb-1">
                        <p className="text-xs font-bold text-gray-900">{profile?.full_name || 'User'}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                      </div>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition mb-1 border border-rose-200/50"
                        >
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          <span>{language === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Control Panel'}</span>
                        </Link>
                      )}

                      <Link
                        to="/profile?tab=addresses"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-rose-50/60 hover:text-rose-700 transition"
                      >
                        <MapPin className="w-4 h-4 text-rose-600" />
                        <span>{language === 'bn' ? 'ঠিকানা ও প্রোফাইল' : 'Address Book & Profile'}</span>
                      </Link>

                      <Link
                        to="/profile?tab=settings"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-rose-50/60 hover:text-rose-700 transition"
                      >
                        <Settings className="w-4 h-4 text-gray-400" />
                        <span>{t('profile.settings')}</span>
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-rose-50/60 hover:text-rose-700 transition"
                      >
                        <Package className="w-4 h-4 text-gray-400" />
                        <span>{t('profile.orders')}</span>
                      </Link>

                      <Link
                        to="/wishlist"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-rose-50/60 hover:text-rose-700 transition"
                      >
                        <Heart className="w-4 h-4 text-gray-400" />
                        <span>{t('nav.wishlist')}</span>
                      </Link>

                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition mt-1 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('nav.signOut')}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="h-9 flex items-center gap-1.5 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs transition active:scale-95 border border-rose-200/60 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{t('nav.signIn')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Sleek Category Navigation Strip (Desktop only - Compact h-9) */}
          <nav className="hidden md:flex items-center justify-between border-t border-rose-100/70 py-1.5 text-xs text-gray-600 font-medium">
            <div className="flex items-center gap-5">
              <div ref={deptRef} className="relative">
                <button
                  onClick={() => setIsDepartmentMenuOpen(!isDepartmentMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Grid className="w-3 h-3" />
                  <span>{t('nav.departments')}</span>
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>

                {isDepartmentMenuOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border border-rose-100 p-1.5 z-50 animate-slide-up space-y-0.5 max-h-96 overflow-y-auto">
                    {categories.map((cat) => (
                      <Link
                        key={cat.slug || cat.id}
                        to={`/shop?category=${cat.slug}`}
                        onClick={() => setIsDepartmentMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-gray-700 hover:bg-rose-50 hover:text-rose-800 transition"
                      >
                        <span className="text-xs font-semibold truncate">{cat.name}</span>
                        <ChevronDown className="w-3 h-3 -rotate-90 text-gray-400 shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.slug || cat.id}
                  to={`/shop?category=${cat.slug}`}
                  className="hover:text-rose-600 transition font-semibold truncate max-w-[140px]"
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  if (user) {
                    navigate('/profile?tab=addresses');
                  } else {
                    setIsAuthOpen(true);
                  }
                }}
                className="text-rose-700 hover:text-rose-800 flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 text-xs font-semibold"
                title={user ? t('profile.addresses') : t('product.loginRequired')}
              >
                <MapPin className="w-3 h-3" />
                <span>{t('profile.addresses')}</span>
              </button>
              <span className="text-rose-200">•</span>
              <button
                type="button"
                onClick={() => {
                  if (user) {
                    navigate('/orders');
                  } else {
                    setIsAuthOpen(true);
                  }
                }}
                className="text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 text-xs font-semibold"
                title={user ? t('profile.orders') : t('product.loginRequired')}
              >
                <span>{language === 'bn' ? 'অর্ডার ট্র্যাক' : 'Track Order'}</span>
              </button>
            </div>
          </nav>

        </div>
      </header>
    </div>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};

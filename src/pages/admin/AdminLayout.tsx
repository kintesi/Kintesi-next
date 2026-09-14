import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isAdminUser } from '../../lib/supabase';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  CreditCard,
  Sliders,
  Users,
  Store,
  LogOut,
  ShieldCheck,
  MessageCircle,
  Tag,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Sun,
  Moon,
} from 'lucide-react';
import { AdminThemeProvider, useAdminTheme } from '../../contexts/AdminThemeContext';

const AdminLayoutInner: React.FC = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const { isLight, toggleTheme } = useAdminTheme();
  const location = useLocation();

  // Desktop sidebar collapse state with localStorage persistence
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kintesi_admin_sidebar_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Persist desktop sidebar state
  const toggleDesktopSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('kintesi_admin_sidebar_open', String(next));
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Admin Access Required</h2>
          <p className="text-xs text-gray-400">
            This management console is restricted to authorized administrators.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/"
              className="py-3 px-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs transition"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isMasterOwner = user?.email?.toLowerCase().trim() === 'manage.kintesi@gmail.com';

  const navSections = [
    {
      label: null,
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Catalog & Inventory',
      items: [
        { name: 'Manage Products', path: '/admin/products', icon: Package },
        { name: 'Categories', path: '/admin/categories', icon: Tags },
        { name: 'Preset Management', path: '/admin/presets', icon: Palette },
      ],
    },
    {
      label: 'Sales & Support',
      items: [
        { name: 'Manage Orders & Invoices', path: '/admin/orders', icon: ShoppingCart },
        { name: 'Live Customer Chat', path: '/admin/chat', icon: MessageCircle },
      ],
    },
    {
      label: 'Marketing & Promotions',
      items: [
        { name: 'Hero & Flash Banners', path: '/admin/banners', icon: Sliders },
        { name: 'Discount Coupons', path: '/admin/coupons', icon: Tag },
      ],
    },
    ...(isMasterOwner
      ? [
          {
            label: 'Settings & Administration',
            items: [
              { name: 'Merchant & Payment Settings', path: '/admin/payment-settings', icon: CreditCard },
              { name: 'Staff & Team Admins', path: '/admin/team', icon: Users },
            ],
          },
        ]
      : []),
  ];

  const allNavItems = navSections.flatMap((s) => s.items);

  const isChat = location.pathname === '/admin/chat';

  // Reusable navigation content for desktop & mobile
  const sidebarContent = (
    <div className={`flex flex-col h-full ${isLight ? 'bg-white text-gray-850' : 'bg-gray-950 text-gray-100'}`}>
      {/* Brand & Toggle Button */}
      <div className={`p-5 border-b flex items-center justify-between ${isLight ? 'border-rose-100/80 bg-white' : 'border-gray-800 bg-gray-950'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white p-1 flex items-center justify-center shadow-xs border border-rose-100/60">
            <img src="/logo.webp" alt="Kintesi" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className={`font-black text-sm leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>Kintesi Admin</h1>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isLight ? 'bg-rose-50 text-rose-700 border border-rose-200/80' : 'bg-rose-500/20 text-rose-400'}`}>
              {isMasterOwner ? 'Master Admin' : 'Admin'}
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className={`md:hidden p-1.5 rounded-xl transition ${isLight ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Grouped Nav List with Clear Category Headings */}
      <nav className="p-3 space-y-2.5 flex-1 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className={sIdx > 0 ? `pt-2.5 border-t space-y-1 ${isLight ? 'border-rose-100/70' : 'border-gray-800/80'}` : 'space-y-1'}>
            {section.label && (
              <div className={`px-3 pb-1 text-[10px] uppercase font-black tracking-wider select-none ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>
                {section.label}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                        : isLight
                        ? 'text-gray-600 hover:text-rose-600 hover:bg-rose-50/70'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer Theme Mode Info */}
      <div className={`p-3 border-t flex items-center justify-between text-xs ${isLight ? 'border-rose-100/80 bg-rose-50/40 text-gray-500' : 'border-gray-800/80 bg-gray-900/50 text-gray-400'}`}>
        <span className="text-[11px] font-bold">Theme: {isLight ? '☀️ White Mood' : '🌙 Dark Mood'}</span>
        <button
          type="button"
          onClick={toggleTheme}
          className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer border ${isLight ? 'bg-white hover:bg-rose-100 text-rose-700 border-rose-200' : 'bg-gray-800 hover:bg-gray-700 text-amber-300 border-gray-700'}`}
        >
          {isLight ? 'Switch to Dark' : 'Switch to White'}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`${isLight ? 'bg-[#f8fafc] text-gray-900' : 'bg-gray-900 text-gray-100'} flex flex-col md:flex-row ${isChat ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'} transition-colors duration-200`}>
      
      {/* Mobile Top Sticky Bar with Burger Button */}
      <header className={`md:hidden sticky top-0 z-30 border-b px-4 py-2.5 flex items-center justify-between ${isLight ? 'bg-white/95 border-rose-100 text-gray-900 shadow-xs' : 'bg-gray-950 border-gray-800 text-white'}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-xl border transition active:scale-95 ${isLight ? 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100' : 'bg-gray-900 border-gray-800 text-gray-300 hover:text-white'}`}
            aria-label="Toggle navigation menu"
            title="Open navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5 text-rose-500" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white p-0.5 flex items-center justify-center border border-rose-100">
              <img src="/logo.webp" alt="Kintesi" className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-sm">Kintesi Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* White / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition cursor-pointer ${isLight ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'bg-gray-900 text-amber-400 border-gray-800 hover:bg-gray-800'}`}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to White Mode'}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <Link
            to="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition ${isLight ? 'bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100' : 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700'}`}
          >
            <Store className="w-3.5 h-3.5 text-rose-500" />
            <span>Store</span>
          </Link>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer (Slide-in) */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 border-r shadow-2xl transform transition-transform duration-200 ease-in-out ${
          isLight ? 'bg-white border-rose-100' : 'bg-gray-950 border-gray-800'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar (Collapsible with width transition) */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 border-r transition-all duration-250 ease-in-out ${
          isLight ? 'bg-white border-rose-100/90 shadow-[2px_0_12px_rgba(225,29,72,0.02)]' : 'bg-gray-950 border-gray-800'
        } ${isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 border-r-0 overflow-hidden'} ${isChat ? 'h-screen max-h-screen' : ''}`}
      >
        <div className="w-64 h-full">
          {sidebarContent}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${isChat ? 'h-screen max-h-screen overflow-hidden' : ''}`}>
        
        {/* Desktop Top Header Bar with Burger Toggle & Theme Switcher */}
        <div className={`hidden md:flex items-center justify-between px-6 py-2.5 border-b backdrop-blur-md sticky top-0 z-20 transition-colors ${
          isLight ? 'bg-white/85 border-rose-100/90 shadow-xs' : 'bg-gray-950/70 border-gray-800'
        }`}>
          <div className="flex items-center gap-3">
            {/* Burger toggle button to hide / unhide sidebar */}
            <button
              onClick={toggleDesktopSidebar}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 shadow-xs cursor-pointer ${
                isLight
                  ? 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                  : 'bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border-gray-800'
              }`}
              title={isSidebarOpen ? 'Hide sidebar menu' : 'Unhide sidebar menu'}
              aria-label={isSidebarOpen ? 'Hide sidebar menu' : 'Unhide sidebar menu'}
            >
              {isSidebarOpen ? (
                <>
                  <PanelLeftClose className="w-4 h-4 text-rose-500" />
                  <span>Hide Sidebar</span>
                </>
              ) : (
                <>
                  <Menu className="w-4 h-4 text-rose-500" />
                  <span>Show Sidebar</span>
                </>
              )}
            </button>

            <span className={`text-xs font-bold ${isLight ? 'text-gray-700' : 'text-gray-400'}`}>
              {allNavItems.find((item) => item.path === location.pathname)?.name || 'Admin Console'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* White Mood / Dark Mood Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shadow-xs ${
                isLight
                  ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                  : 'bg-gray-900 hover:bg-gray-800 text-amber-300 border-gray-800'
              }`}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to White Mode'}
            >
              {isLight ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span>White Mood</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dark Mood</span>
                </>
              )}
            </button>

            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition font-bold ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100/80 border-rose-200 text-rose-700'
                  : 'bg-gray-900 hover:bg-gray-800 border-gray-800 text-gray-300 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-rose-500" />
              <span>View Storefront</span>
            </Link>

            <span className={isLight ? 'text-gray-300' : 'text-gray-700'}>|</span>
            <span className={`font-semibold ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>{user?.email}</span>
            <button
              onClick={signOut}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                isLight ? 'text-rose-600 hover:bg-rose-50' : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
              }`}
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Sign Out</span>
            </button>
          </div>
        </div>

        <main
          className={`flex-1 transition-colors duration-200 ${
            isLight ? 'bg-[#f8fafc]' : 'bg-gray-900'
          } ${
            isChat
              ? 'p-0 flex flex-col w-full h-full min-h-0 overflow-hidden'
              : 'overflow-y-auto p-4 sm:p-6 lg:p-8 w-full flex flex-col'
          }`}
        >
          <div className={isChat ? 'w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden' : 'w-full min-h-full flex flex-col flex-1'}>
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export const AdminLayout: React.FC = () => {
  return (
    <AdminThemeProvider>
      <AdminLayoutInner />
    </AdminThemeProvider>
  );
};

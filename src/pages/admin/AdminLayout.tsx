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
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
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
    <div className="flex flex-col h-full bg-gray-950">
      {/* Brand & Toggle Button */}
      <div className="p-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white p-1 flex items-center justify-center shadow">
            <img src="/logo.webp" alt="Kintesi" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-black text-white text-sm leading-tight">Kintesi Admin</h1>
            <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded-full">
              {isMasterOwner ? 'Master Admin' : 'Admin'}
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Grouped Nav List with Clear Category Headings */}
      <nav className="p-3 space-y-2.5 flex-1 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className={sIdx > 0 ? 'pt-2.5 border-t border-gray-800/80 space-y-1' : 'space-y-1'}>
            {section.label && (
              <div className="px-3 pb-1 text-[10px] uppercase font-black tracking-wider text-gray-500 select-none">
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
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
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
    </div>
  );

  return (
    <div className={`bg-gray-900 text-gray-100 flex flex-col md:flex-row ${isChat ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'}`}>
      
      {/* Mobile Top Sticky Bar with Burger Button */}
      <header className="md:hidden sticky top-0 z-30 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition active:scale-95"
            aria-label="Toggle navigation menu"
            title="Open navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5 text-rose-400" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white p-0.5 flex items-center justify-center">
              <img src="/logo.webp" alt="Kintesi" className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-white text-sm">Kintesi Admin</span>
          </div>
        </div>

        <Link
          to="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200 text-[11px] font-semibold hover:bg-gray-700 transition"
        >
          <Store className="w-3.5 h-3.5 text-rose-400" />
          <span>Store</span>
        </Link>
      </header>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer (Slide-in) */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-gray-950 border-r border-gray-800 shadow-2xl transform transition-transform duration-200 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar (Collapsible with width transition) */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 bg-gray-950 border-r border-gray-800 transition-all duration-250 ease-in-out ${
          isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 border-r-0 overflow-hidden'
        } ${isChat ? 'h-screen max-h-screen' : ''}`}
      >
        <div className="w-64 h-full">
          {sidebarContent}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${isChat ? 'h-screen max-h-screen overflow-hidden' : ''}`}>
        
        {/* Desktop Top Header Bar with Burger Toggle */}
        <div className="hidden md:flex items-center justify-between px-6 py-2.5 bg-gray-950/70 border-b border-gray-800 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Burger toggle button to hide / unhide sidebar */}
            <button
              onClick={toggleDesktopSidebar}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-bold border border-gray-800 hover:border-gray-700 transition active:scale-95 shadow-xs"
              title={isSidebarOpen ? 'Hide sidebar menu' : 'Unhide sidebar menu'}
              aria-label={isSidebarOpen ? 'Hide sidebar menu' : 'Unhide sidebar menu'}
            >
              {isSidebarOpen ? (
                <>
                  <PanelLeftClose className="w-4 h-4 text-rose-400" />
                  <span>Hide Sidebar</span>
                </>
              ) : (
                <>
                  <Menu className="w-4 h-4 text-rose-400" />
                  <span>Show Sidebar</span>
                </>
              )}
            </button>

            <span className="text-xs text-gray-400 font-medium">
              {allNavItems.find((item) => item.path === location.pathname)?.name || 'Admin Console'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white transition font-medium"
            >
              <Store className="w-3.5 h-3.5 text-rose-400" />
              <span>View Storefront</span>
            </Link>
            <span className="text-gray-700">|</span>
            <span className="font-semibold text-gray-300">{user?.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Sign Out</span>
            </button>
          </div>
        </div>

        <main
          className={`flex-1 bg-gray-900 ${
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

import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
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
    {
      label: 'System & Security',
      items: [
        { name: 'Admins & Staff', path: '/admin/team', icon: Users },
        { name: 'Payment Setup', path: '/admin/payment-settings', icon: CreditCard },
      ],
    },
  ];

  const allNavItems = navSections.flatMap((s) => s.items);
  const isChat = location.pathname === '/admin/chat';

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header without K logo image */}
      <div
        className={`px-5 py-4 border-b flex items-center justify-between flex-shrink-0 transition-colors ${
          isLight ? 'border-slate-200' : 'border-gray-800'
        }`}
      >
        <div className="flex flex-col">
          <span className="font-black text-base tracking-tight text-rose-600">
            Kintesi Admin
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
            style={isLight ? { color: '#475569' } : { color: '#9ca3af' }}
          >
            {isMasterOwner ? 'Super Admin' : 'Admin Console'}
          </span>
        </div>
      </div>

      {/* Navigation list - Cleanly scrollable if needed, without email/logout at bottom */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.label && (
              <div
                className="px-3 text-[10px] font-black uppercase tracking-wider pb-1"
                style={isLight ? { color: '#000000' } : { color: '#6b7280' }}
              >
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
                    className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-black transition ${
                      isActive
                        ? isLight
                          ? 'bg-white border border-rose-500 shadow-sm'
                          : 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                        : isLight
                        ? 'hover:bg-rose-50 hover:text-rose-700'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                    }`}
                    style={isActive ? { color: isLight ? '#0f172a' : '#ffffff' } : isLight ? { color: '#000000' } : {}}
                  >
                    <Icon
                      className="w-4 h-4 flex-shrink-0"
                      style={isActive ? { color: isLight ? '#0f172a' : '#ffffff' } : isLight ? { color: '#000000' } : { color: '#9ca3af' }}
                    />
                    <span
                      className="truncate"
                      style={isActive ? { color: isLight ? '#0f172a' : '#ffffff' } : isLight ? { color: '#000000' } : {}}
                    >
                      {item.name}
                    </span>
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
    <div
      className={`admin-root min-h-screen ${
        isLight ? 'admin-light bg-slate-50 text-slate-900' : 'admin-dark bg-gray-900 text-gray-100'
      } flex flex-col md:flex-row transition-colors duration-200 ${
        isChat ? 'h-screen max-h-screen overflow-hidden' : ''
      }`}
    >
      {/* Mobile Top Sticky Bar */}
      <header
        className={`md:hidden sticky top-0 z-30 border-b px-4 py-2.5 flex items-center justify-between shadow-xs flex-shrink-0 ${
          isLight ? 'bg-white border-slate-200' : 'bg-gray-950 border-gray-800'
        }`}
        style={isLight ? { color: '#000000' } : {}}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-xl border transition active:scale-95 ${
              isLight ? 'bg-white border-slate-300 hover:bg-slate-100' : 'bg-gray-900 border-gray-800 text-gray-300 hover:text-white'
            }`}
            style={isLight ? { color: '#000000' } : {}}
            aria-label="Toggle navigation menu"
            title="Open navigation menu"
          >
            {isMobileMenuOpen
              ? <X className="w-5 h-5" style={isLight ? { color: '#000000' } : {}} />
              : <Menu className="w-5 h-5" style={isLight ? { color: '#000000' } : {}} />}
          </button>
          <span className="font-black text-sm text-rose-600">Kintesi Admin</span>
        </div>

        <div className="flex items-center gap-2">
          {/* White / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`px-2.5 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-black ${
              isLight
                ? 'bg-white border-slate-300 hover:bg-slate-100'
                : 'bg-gray-900 text-amber-400 border-gray-800'
            }`}
            style={isLight ? { color: '#000000' } : {}}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to White Mode'}
          >
            {isLight ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-black" style={{ color: '#000000' }}>White</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-black">Dark</span>
              </>
            )}
          </button>

          <Link
            to="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black border transition ${
              isLight ? 'bg-white border-slate-300 hover:bg-slate-100' : 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700'
            }`}
            style={isLight ? { color: '#000000' } : {}}
          >
            <Store className="w-3.5 h-3.5" style={isLight ? { color: '#000000' } : { color: '#f43f5e' }} />
            <span style={isLight ? { color: '#000000' } : {}}>Store</span>
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
          isLight ? 'bg-white border-slate-200' : 'bg-gray-950 border-gray-800'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar: Permanently Sticky & Fixed on the Left */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 border-r h-screen max-h-screen sticky top-0 self-start z-20 transition-all duration-200 ease-in-out ${
          isLight ? 'bg-white border-slate-200' : 'bg-gray-950 border-gray-800'
        } ${isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 border-r-0 overflow-hidden'}`}
      >
        <div className="w-64 h-full flex flex-col overflow-hidden">
          {sidebarContent}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${isChat ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'}`}>
        
        {/* Desktop Top Header Bar with Burger Toggle & Theme Switcher */}
        <div
          className={`hidden md:flex items-center justify-between px-6 py-2.5 border-b sticky top-0 z-20 flex-shrink-0 transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-gray-950/80 border-gray-800 backdrop-blur-xs'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Burger toggle button */}
            <button
              onClick={toggleDesktopSidebar}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black border transition active:scale-95 shadow-xs cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300'
                  : 'bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border-gray-800'
              }`}
              style={isLight ? { color: '#000000' } : {}}
              title={isSidebarOpen ? 'Hide sidebar menu' : 'Unhide sidebar menu'}
              aria-label={isSidebarOpen ? 'Hide sidebar menu' : 'Unhide sidebar menu'}
            >
              <PanelLeftClose className="w-4 h-4" style={isLight ? { color: '#000000' } : { color: '#f43f5e' }} />
              <span style={isLight ? { color: '#000000' } : {}}>{isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}</span>
            </button>

            <span className="text-xs font-black" style={isLight ? { color: '#000000' } : { color: '#9ca3af' }}>
              {allNavItems.find((item) => item.path === location.pathname)?.name || 'Admin Console'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* White / Dark Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`w-10 h-10 inline-flex items-center justify-center rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 shadow-xs'
                  : 'bg-gray-800 hover:bg-gray-700 text-amber-300 border-gray-700'
              }`}
              style={isLight ? { color: '#000000' } : {}}
              title={isLight ? 'Current: White Mode. Click for Dark Mode' : 'Current: Dark Mode. Click for White Mode'}
              aria-label="Switch to Dark Mode"
            >
              {isLight ? <Sun className="w-5 h-5 text-amber-500 shrink-0" /> : <Moon className="w-5 h-5 text-indigo-400 shrink-0" />}
            </button>

            {/* View Storefront */}
            <Link
              to="/"
              className={`w-10 h-10 inline-flex items-center justify-center rounded-xl border transition ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 shadow-xs'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
              style={isLight ? { color: '#000000' } : {}}
              title="View Storefront"
              aria-label="View storefront"
            >
              <Store className="w-5 h-5 shrink-0" style={isLight ? { color: '#000000' } : { color: '#f43f5e' }} />
            </Link>

            {/* Sign Out */}
            <button
              onClick={signOut}
              className={`w-10 h-10 inline-flex items-center justify-center rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-rose-50 border-slate-300 hover:border-rose-300 shadow-xs'
                  : 'bg-gray-800 hover:bg-gray-700 text-rose-400 border-gray-700'
              }`}
              style={isLight ? { color: '#000000' } : {}}
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" style={isLight ? { color: '#000000' } : { color: '#f43f5e' }} />
            </button>
          </div>
        </div>

        {/* Main Page View - Expands to full height without cutting off */}
        <main
          className={`flex-1 transition-colors duration-200 ${
            isLight ? 'bg-slate-50' : 'bg-gray-900'
          } ${
            isChat
              ? 'p-0 flex flex-col w-full h-full min-h-0 overflow-hidden'
              : 'p-4 sm:p-5 lg:p-6 w-full flex flex-col min-h-0'
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

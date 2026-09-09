import React from 'react';
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
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const location = useLocation();

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

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Manage Products', path: '/admin/products', icon: Package },
    { name: 'Manage Orders & Invoices', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Live Customer Chat', path: '/admin/chat', icon: MessageCircle },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Hero & Flash Banners', path: '/admin/banners', icon: Sliders },
    ...(isMasterOwner ? [{ name: 'Merchant & Payment Settings', path: '/admin/payment-settings', icon: CreditCard }] : []),
    ...(isMasterOwner ? [{ name: 'Staff & Team Admins', path: '/admin/team', icon: Users }] : []),
  ];

  const isChat = location.pathname === '/admin/chat';

  return (
    <div className={`bg-gray-900 text-gray-100 flex flex-col md:flex-row ${isChat ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'}`}>
      
      {/* Sidebar */}
      <aside className={`w-full md:w-64 bg-gray-950 border-r border-gray-800 flex flex-col flex-shrink-0 ${isChat ? 'h-screen max-h-screen' : ''}`}>
        
        {/* Brand */}
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white p-1 flex items-center justify-center shadow">
            <img src="/logo.png" alt="Kintesi" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-black text-white text-base leading-tight">Kintesi Admin</h1>
            <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded-full">
              {isMasterOwner ? 'Master Admin' : 'Admin'}
            </span>
          </div>
        </div>

        {/* Nav list */}
        <nav className="p-4 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footer & Back to store */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition"
          >
            <Store className="w-4 h-4 text-rose-400" />
            <span>Back to Storefront</span>
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl hover:bg-rose-950/40 text-rose-400 text-xs font-semibold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className={`flex-1 bg-gray-900 ${
          location.pathname === '/admin/chat'
            ? 'p-0 h-screen overflow-hidden flex flex-col'
            : 'overflow-y-auto p-6 sm:p-10'
        }`}
      >
        <Outlet />
      </main>

    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { INITIAL_PRODUCTS } from '../../data/mockData';
import { Product, Order } from '../../types';
import { formatPrice } from '../../lib/utils';
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { user, profile, isSuperAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        // Load products
        const { data: prodData } = await supabase.from('products').select('*');
        if (prodData && prodData.length > 0) setProducts(prodData);

        // Load orders
        const { data: orderData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        let allOrders: Order[] = orderData || [];

        // Check local guest orders as well
        const local = JSON.parse(localStorage.getItem('kintesi_guest_orders') || '[]');
        if (local.length > 0) {
          allOrders = [...allOrders, ...local.filter((l: any) => !allOrders.some((o) => o.order_number === l.order_number))];
        }

        setOrders(allOrders);
      } catch (err) {
        console.warn('Dashboard stats error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const totalRevenue = orders.reduce((sum, ord) => sum + Number(ord.total_amount || 0), 0);
  const pendingOrders = orders.filter((o) => o.order_status === 'pending').length;

  return (
    <div className="w-full space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Admin Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1">Live overview of your Kintesi e-commerce store</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/products"
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow"
          >
            + Add New Product
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Sales */}
        <div className="bg-gray-800/80 p-6 rounded-3xl border border-gray-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Revenue</span>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{formatPrice(totalRevenue)}</p>
          <div className="flex items-center gap-1 text-[11px] text-rose-500 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Real-time calculation</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-gray-800/80 p-6 rounded-3xl border border-gray-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Orders</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{orders.length}</p>
          <p className="text-[11px] text-amber-400 font-semibold">{pendingOrders} pending confirmation</p>
        </div>

        {/* Active Products */}
        <div className="bg-gray-800/80 p-6 rounded-3xl border border-gray-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Products Catalog</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{products.length}</p>
          <p className="text-[11px] text-gray-400">All live on storefront</p>
        </div>

        {/* Logged-In Admin Account */}
        <div className="bg-gray-800/80 p-6 rounded-3xl border border-gray-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Admin Account</span>
            <div className={`p-2 rounded-xl ${isSuperAdmin ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm font-bold text-rose-500 truncate">
            {user?.email || profile?.full_name || 'Admin'}
          </p>
          <p className="text-[11px] text-gray-400">
            {isSuperAdmin ? 'Master Admin (Owner)' : 'Admin'}
          </p>
        </div>

      </div>

      {/* Recent Orders Table */}
      <div className="bg-gray-800/80 rounded-3xl border border-gray-700 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Customer Orders</h3>
            <p className="text-xs text-gray-400 mt-0.5">Manage and dispatch customer packages</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-rose-500 hover:text-rose-400 flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            No orders received yet. Place a test order from the storefront!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-700 text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/60 text-gray-200">
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id || ord.order_number} className="hover:bg-gray-700/30 transition">
                    <td className="py-3.5 font-mono font-bold text-white">#{ord.order_number}</td>
                    <td className="py-3.5">
                      <p className="font-semibold">{ord.customer_name}</p>
                      <p className="text-[10px] text-gray-400">{ord.customer_phone}</p>
                    </td>
                    <td className="py-3.5 text-gray-300">{ord.items?.length || 0} items</td>
                    <td className="py-3.5 font-bold text-rose-500">{formatPrice(ord.total_amount)}</td>
                    <td className="py-3.5 uppercase font-bold text-[10px] text-gray-300">{ord.payment_method}</td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        {ord.order_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

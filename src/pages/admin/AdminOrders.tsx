import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getOrdersFromDB, updateOrderInDB } from '../../lib/dbService';
import { Order } from '../../types';
import { formatPrice } from '../../lib/utils';
import { Package, Truck, CheckCircle2, Clock, XCircle, Search, Eye, Printer, Trash2, Copy, Check, CreditCard, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceModal } from '../../components/invoice/InvoiceModal';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    try {
      const all = await getOrdersFromDB();
      const local = JSON.parse(localStorage.getItem('kintesi_guest_orders') || '[]');
      const combined = [...all, ...local.filter((l: any) => !all.some((o) => o.order_number === l.order_number))];
      setOrders(combined);
    } catch (err) {
      console.warn('Orders load note:', err);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleDeleteOrder = async (orderNumber: string) => {
    if (!confirm(`Are you sure you want to permanently delete Order #${orderNumber}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('order_number', orderNumber);

      if (error) throw error;
    } catch (err: any) {
      console.warn('Supabase delete order fallback:', err.message);
    }

    // Delete from local cache
    try {
      const local = JSON.parse(localStorage.getItem('kintesi_guest_orders') || '[]');
      const updatedLocal = local.filter((o: any) => o.order_number !== orderNumber);
      localStorage.setItem('kintesi_guest_orders', JSON.stringify(updatedLocal));
    } catch {}

    setOrders((prev) => prev.filter((o) => o.order_number !== orderNumber));
    if (selectedOrder && selectedOrder.order_number === orderNumber) {
      setSelectedOrder(null);
    }
    toast.success(`Order #${orderNumber} deleted successfully`);
  };

  const handleUpdateStatus = async (orderNumber: string, newStatus: string) => {
    await updateOrderInDB(orderNumber, { order_status: newStatus as any });
    try {
      await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('order_number', orderNumber);
    } catch {}

    const local = JSON.parse(localStorage.getItem('kintesi_guest_orders') || '[]');
    const updatedLocal = local.map((o: any) =>
      o.order_number === orderNumber ? { ...o, order_status: newStatus } : o
    );
    localStorage.setItem('kintesi_guest_orders', JSON.stringify(updatedLocal));
    toast.success(`Order #${orderNumber} updated to ${newStatus}`);

    setOrders((prev) =>
      prev.map((o) => (o.order_number === orderNumber ? { ...o, order_status: newStatus as any } : o))
    );
    if (selectedOrder && selectedOrder.order_number === orderNumber) {
      setSelectedOrder({ ...selectedOrder, order_status: newStatus as any });
    }
  };

  const handleUpdatePaymentStatus = async (orderNumber: string, newPaymentStatus: string) => {
    await updateOrderInDB(orderNumber, { payment_status: newPaymentStatus as any });
    try {
      await supabase
        .from('orders')
        .update({ payment_status: newPaymentStatus })
        .eq('order_number', orderNumber);
    } catch {}

    const local = JSON.parse(localStorage.getItem('kintesi_guest_orders') || '[]');
    const updatedLocal = local.map((o: any) =>
      o.order_number === orderNumber ? { ...o, payment_status: newPaymentStatus } : o
    );
    localStorage.setItem('kintesi_guest_orders', JSON.stringify(updatedLocal));
    toast.success(`Payment for Order #${orderNumber} marked as ${newPaymentStatus}`);

    setOrders((prev) =>
      prev.map((o) => (o.order_number === orderNumber ? { ...o, payment_status: newPaymentStatus as any } : o))
    );
    if (selectedOrder && selectedOrder.order_number === orderNumber) {
      setSelectedOrder({ ...selectedOrder, payment_status: newPaymentStatus as any });
    }
  };

  const filteredOrders = orders.filter((ord) => {
    if (statusFilter !== 'all' && ord.order_status !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        ord.order_number.toLowerCase().includes(q) ||
        ord.customer_name.toLowerCase().includes(q) ||
        ord.customer_phone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Customer Orders & Fulfillment</h1>
          <p className="text-xs text-gray-400 mt-1">Track payments, change shipping progress and review customer packages</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-gray-800/80 rounded-3xl border border-gray-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/60 border-b border-gray-700 text-gray-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Order #</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Fulfillment Status</th>
                <th className="p-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/60 text-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id || ord.order_number} className="hover:bg-gray-700/40 transition">
                    <td className="p-4 font-mono font-bold text-white">#{ord.order_number}</td>
                    <td className="p-4 text-gray-400">
                      {new Date(ord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-white">{ord.customer_name}</p>
                      <p className="text-[10px] text-gray-400">{ord.customer_phone}</p>
                    </td>
                    <td className="p-4 font-black text-emerald-400">
                      {formatPrice(ord.total_amount)}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`uppercase text-[10px] font-black px-2 py-0.5 rounded-md border ${
                              ord.payment_method === 'bkash'
                                ? 'bg-pink-950/60 text-pink-400 border-pink-700/50'
                                : ord.payment_method === 'nagad'
                                ? 'bg-orange-950/60 text-orange-400 border-orange-700/50'
                                : ord.payment_method === 'rocket'
                                ? 'bg-purple-950/60 text-purple-400 border-purple-700/50'
                                : ord.payment_method === 'bank'
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700/50'
                                : 'bg-gray-800 text-gray-300 border-gray-700'
                            }`}
                          >
                            {ord.payment_method}
                          </span>
                          <select
                            value={ord.payment_status}
                            onChange={(e) => handleUpdatePaymentStatus(ord.order_number, e.target.value)}
                            className="bg-gray-900 border border-gray-700 text-[10px] font-bold rounded px-1.5 py-0.5 text-gray-200"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                          </select>
                        </div>

                        {ord.transaction_id ? (
                          <div className="flex items-center gap-1 bg-gray-950 border border-emerald-500/50 px-2 py-0.5 rounded-lg w-fit">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">TrxID:</span>
                            <span className="font-mono text-[11px] font-black text-emerald-400 select-all">
                              {ord.transaction_id}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(ord.transaction_id || '');
                                toast.success(`TrxID ${ord.transaction_id} copied!`);
                              }}
                              className="text-gray-400 hover:text-white p-0.5 transition cursor-pointer"
                              title="Copy TrxID"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : ord.payment_method === 'cod' ? (
                          <span className="text-[10px] text-gray-500 font-semibold block">Cash on Delivery</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        value={ord.order_status}
                        onChange={(e) => handleUpdateStatus(ord.order_number, e.target.value)}
                        className="bg-gray-900 border border-gray-700 text-xs font-bold rounded-xl px-3 py-1.5 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase tracking-wider"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoiceOrder(ord)}
                          className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition"
                          title="Print Invoice / Packing Slip"
                        >
                          <Printer className="w-4 h-4 text-emerald-400" />
                        </button>
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-2 hover:bg-gray-700 text-blue-400 hover:text-white rounded-lg transition"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(ord.order_number)}
                          className="p-2 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-lg transition"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">Order #{selectedOrder.order_number}</h3>
                <p className="text-xs text-gray-400">Customer Details & Invoice Breakdown</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-800 text-gray-400 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Customer</p>
                  <p className="font-bold text-white mt-0.5">{selectedOrder.customer_name}</p>
                  <p className="text-gray-300">{selectedOrder.customer_phone}</p>
                  <p className="text-gray-300">{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Shipping Address</p>
                  <p className="font-bold text-white mt-0.5">{selectedOrder.shipping_address}</p>
                  <p className="text-gray-300">{selectedOrder.city} {selectedOrder.postal_code}</p>
                </div>
              </div>
              {selectedOrder.customer_note && (
                <div className="pt-2 border-t border-gray-700">
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Customer / Payment Note</p>
                  <p className="text-amber-300 font-mono mt-0.5">{selectedOrder.customer_note}</p>
                </div>
              )}
            </div>

            {/* Payment & Transaction ID Verification Card */}
            <div className="bg-gray-800/90 p-4 rounded-2xl border border-gray-700 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Payment & Transaction Verification</span>
                </span>
                <span className="uppercase text-[10px] font-black text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-700">
                  {selectedOrder.payment_method}
                </span>
              </div>

              {selectedOrder.transaction_id ? (
                <div className="bg-gray-950 p-3.5 rounded-xl border border-emerald-500/50 flex items-center justify-between gap-3 shadow-inner">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">
                      Customer Submitted Transaction ID (TrxID)
                    </span>
                    <span className="font-mono text-base sm:text-lg font-black text-emerald-400 select-all tracking-wider">
                      {selectedOrder.transaction_id}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.transaction_id || '');
                      toast.success(`TrxID ${selectedOrder.transaction_id} copied!`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy TrxID</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-400 bg-gray-900/60 p-2.5 rounded-xl border border-gray-700/60">
                  ℹ️ No Transaction ID required (Cash on Delivery order).
                </p>
              )}

              {selectedOrder.seller_payment_snapshot && (
                <div className="p-3 bg-gray-900 rounded-xl border border-gray-700 text-[11px] text-gray-300 space-y-1.5">
                  <p className="font-bold text-gray-200 flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5 text-purple-400" />
                    <span>Seller Payment Gateway Snapshot:</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                    {selectedOrder.seller_payment_snapshot.seller_name && (
                      <p className="text-gray-400">Seller: <strong className="text-white">{selectedOrder.seller_payment_snapshot.seller_name}</strong></p>
                    )}
                    {selectedOrder.seller_payment_snapshot.bkash_number && (
                      <p className="text-gray-400">bKash: <strong className="text-pink-400 font-mono">{selectedOrder.seller_payment_snapshot.bkash_number}</strong> ({selectedOrder.seller_payment_snapshot.bkash_type})</p>
                    )}
                    {selectedOrder.seller_payment_snapshot.nagad_number && (
                      <p className="text-gray-400">Nagad: <strong className="text-orange-400 font-mono">{selectedOrder.seller_payment_snapshot.nagad_number}</strong> ({selectedOrder.seller_payment_snapshot.nagad_type})</p>
                    )}
                    {selectedOrder.seller_payment_snapshot.rocket_number && (
                      <p className="text-gray-400">Rocket: <strong className="text-purple-400 font-mono">{selectedOrder.seller_payment_snapshot.rocket_number}</strong> ({selectedOrder.seller_payment_snapshot.rocket_type})</p>
                    )}
                    {selectedOrder.seller_payment_snapshot.bank_name && (
                      <p className="text-gray-400 col-span-2">Bank: <strong className="text-emerald-400">{selectedOrder.seller_payment_snapshot.bank_name}</strong> - A/C: <span className="font-mono text-white">{selectedOrder.seller_payment_snapshot.bank_account_number}</span></p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Order Items</h4>
              <div className="divide-y divide-gray-800">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || '/logo.webp'}
                        alt={item.title}
                        className="w-10 h-10 object-cover rounded-lg bg-gray-800 border border-gray-700"
                      />
                      <div>
                        <p className="font-bold text-white">{item.title}</p>
                        <p className="text-gray-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-400">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-800 pt-4 flex justify-between items-center text-sm font-black">
              <span>Total Payable</span>
              <span className="text-emerald-400 text-lg">{formatPrice(selectedOrder.total_amount)}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-800">
              <button
                onClick={() => handleDeleteOrder(selectedOrder.order_number)}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Order</span>
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />
      )}

    </div>
  );
};

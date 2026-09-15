import React, { useState, useEffect } from 'react';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { AffiliateUser, AffiliateWithdrawal, Order } from '../../types';
import {
  getAffiliatesFromDB,
  getWithdrawalsFromDB,
  processWithdrawalInDB,
  updateAffiliateInDB,
  deleteAffiliateInDB,
  toggleBanAffiliateInDB,
} from '../../lib/affiliateService';
import { getOrdersFromDB } from '../../lib/dbService';
import { formatPrice } from '../../lib/utils';
import {
  Share2,
  Users,
  Wallet,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  Filter,
  Eye,
  Check,
  X,
  ExternalLink,
  Copy,
  AlertCircle,
  Send,
  CreditCard,
  Trash2,
  Ban,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminAffiliates: React.FC = () => {
  const { isLight } = useAdminTheme();
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<AffiliateWithdrawal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'partners' | 'withdrawals' | 'orders'>('partners');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filters
  const [partnerSearch, setPartnerSearch] = useState('');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Modal State for Approving / Rejecting Withdrawal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AffiliateWithdrawal | null>(null);
  const [adminTrxId, setAdminTrxId] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);

  const loadData = async () => {
    try {
      const [affs, withs, allOrders] = await Promise.all([
        getAffiliatesFromDB(),
        getWithdrawalsFromDB(),
        getOrdersFromDB(),
      ]);
      setAffiliates(affs);
      setWithdrawals(withs);

      // Local storage guest orders combined with DB orders
      const localGuestOrders = JSON.parse(localStorage.getItem('kintesi_guest_orders') || '[]');
      const combined = [...allOrders, ...localGuestOrders.filter((l: any) => !allOrders.some((o) => o.order_number === l.order_number))];
      setOrders(combined);
    } catch (err) {
      console.warn('Admin affiliates load notice:', err);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('kintesi_affiliates_updated', loadData);
    window.addEventListener('kintesi_withdrawals_updated', loadData);
    return () => {
      window.removeEventListener('kintesi_affiliates_updated', loadData);
      window.removeEventListener('kintesi_withdrawals_updated', loadData);
    };
  }, []);

  // Compute Overview Stats
  const totalAffiliates = affiliates.length;
  const totalSales = affiliates.reduce((sum, a) => sum + (a.total_sales_amount || 0), 0);
  const totalCommission = affiliates.reduce((sum, a) => sum + (a.total_commission_earned || 0), 0);
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
  const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  // Orders attributed to affiliates
  const affiliateOrders = orders.filter((o) => Boolean(o.affiliate_code));

  // Filtered Partners
  const filteredAffiliates = affiliates.filter((a) => {
    const q = partnerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q) ||
      a.affiliate_code.toLowerCase().includes(q) ||
      (a.email && a.email.toLowerCase().includes(q))
    );
  });

  // Filtered Withdrawals
  const filteredWithdrawals = withdrawals.filter((w) => {
    if (withdrawalFilter === 'all') return true;
    return w.status === withdrawalFilter;
  });

  // Handle Approve Withdrawal
  const handleConfirmApproval = async () => {
    if (!selectedWithdrawal) return;
    setIsProcessingWithdrawal(true);
    try {
      await processWithdrawalInDB(selectedWithdrawal.id, 'approved', adminTrxId.trim(), adminNote.trim());
      toast.success(`Payout #${selectedWithdrawal.id} successfully approved!`);
      setSelectedWithdrawal(null);
      setAdminTrxId('');
      setAdminNote('');
      loadData();
    } catch (err) {
      toast.error('Failed to process payout approval');
    } finally {
      setIsProcessingWithdrawal(false);
    }
  };

  // Handle Reject Withdrawal
  const handleConfirmRejection = async () => {
    if (!selectedWithdrawal) return;
    setIsProcessingWithdrawal(true);
    try {
      await processWithdrawalInDB(selectedWithdrawal.id, 'rejected', '', adminNote.trim() || 'Admin rejected request');
      toast.info(`Payout #${selectedWithdrawal.id} rejected`);
      setSelectedWithdrawal(null);
      setAdminTrxId('');
      setAdminNote('');
      loadData();
    } catch (err) {
      toast.error('Operation failed');
    } finally {
      setIsProcessingWithdrawal(false);
    }
  };

  // Manual Refresh Handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success('Affiliate data synced and updated.');
  };

  // Toggle Ban / Unban Partner
  const handleToggleBan = async (partner: AffiliateUser) => {
    const isBanning = partner.status !== 'suspended';
    const actionText = isBanning ? 'ban (suspend)' : 'unban (activate)';
    if (!window.confirm(`Are you sure you want to ${actionText} affiliate partner "${partner.name}" (${partner.affiliate_code})?`)) {
      return;
    }
    try {
      await toggleBanAffiliateInDB(partner.id, partner.status);
      toast.success(`Partner "${partner.name}" is now ${isBanning ? 'banned/suspended' : 'active'}!`);
      loadData();
    } catch (err) {
      toast.error('Failed to update partner status');
    }
  };

  // Delete Partner
  const handleDeletePartner = async (partner: AffiliateUser) => {
    if (!window.confirm(`Are you sure you want to completely remove partner "${partner.name}" (${partner.affiliate_code})? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteAffiliateInDB(partner.id);
      toast.success(`Partner "${partner.name}" removed successfully.`);
      loadData();
    } catch (err) {
      toast.error('Failed to delete partner');
    }
  };

  return (
    <div className={`p-4 sm:p-8 space-y-6 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-gray-950 text-gray-100'}`}>
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
              <Share2 className="w-6 h-6 text-rose-600" />
              <span>Affiliate Program Management</span>
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
              System Active
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Track partner earnings, referral sales, product commissions, and review payout requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                : 'bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800 shadow-2xs'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-500' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync & Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Affiliates */}
        <div className={`p-5 rounded-2xl border shadow-xs space-y-1.5 ${isLight ? 'bg-white border-slate-200' : 'bg-gray-900 border-gray-800'}`}>
          <div className="flex items-center justify-between text-xs font-bold text-gray-400">
            <span>Total Affiliate Partners</span>
            <Users className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black">{totalAffiliates}</p>
          <p className="text-[11px] text-gray-500">Registered & active partners</p>
        </div>

        {/* Total Sales Generated */}
        <div className={`p-5 rounded-2xl border shadow-xs space-y-1.5 ${isLight ? 'bg-white border-slate-200' : 'bg-gray-900 border-gray-800'}`}>
          <div className="flex items-center justify-between text-xs font-bold text-gray-400">
            <span>Total Referral Sales</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-500">{formatPrice(totalSales)}</p>
          <p className="text-[11px] text-gray-500">{affiliateOrders.length} referral orders</p>
        </div>

        {/* Total Commission Paid/Earned */}
        <div className={`p-5 rounded-2xl border shadow-xs space-y-1.5 ${isLight ? 'bg-white border-slate-200' : 'bg-gray-900 border-gray-800'}`}>
          <div className="flex items-center justify-between text-xs font-bold text-gray-400">
            <span>Total Commission Earned</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-500">{formatPrice(totalCommission)}</p>
          <p className="text-[11px] text-gray-500">Total commissions credited</p>
        </div>

        {/* Pending Withdrawals */}
        <div className={`p-5 rounded-2xl border shadow-xs space-y-1.5 ${isLight ? 'bg-white border-slate-200' : 'bg-gray-900 border-gray-800'}`}>
          <div className="flex items-center justify-between text-xs font-bold text-gray-400">
            <span>Pending Payout Requests</span>
            <Wallet className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500">
            {formatPrice(pendingWithdrawalAmount)}
          </p>
          <p className="text-[11px] text-amber-600 font-bold">{pendingWithdrawals.length} awaiting review</p>
        </div>

      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 pb-3">
        <button
          onClick={() => setActiveTab('partners')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'partners'
              ? 'bg-rose-600 text-white shadow-xs'
              : isLight ? 'bg-white text-gray-700 border border-slate-200 hover:bg-slate-100' : 'bg-gray-900 text-gray-300 border border-gray-800 hover:bg-gray-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Affiliate Partners ({affiliates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
            activeTab === 'withdrawals'
              ? 'bg-rose-600 text-white shadow-xs'
              : isLight ? 'bg-white text-gray-700 border border-slate-200 hover:bg-slate-100' : 'bg-gray-900 text-gray-300 border border-gray-800 hover:bg-gray-800'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Payout Requests ({withdrawals.length})</span>
          {pendingWithdrawals.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-rose-600 text-white shadow-xs'
              : isLight ? 'bg-white text-gray-700 border border-slate-200 hover:bg-slate-100' : 'bg-gray-900 text-gray-300 border border-gray-800 hover:bg-gray-800'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Referral Orders ({affiliateOrders.length})</span>
        </button>
      </div>

      {/* TAB 1: AFFILIATE PARTNERS TABLE */}
      {activeTab === 'partners' && (
        <div className={`rounded-2xl border shadow-xs overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-gray-900 border-gray-800'}`}>
          
          {/* Table Header / Search */}
          <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by partner name, phone or code..."
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-bold transition focus:outline-none ${
                  isLight ? 'bg-slate-100 border border-slate-200 text-gray-900 focus:bg-white' : 'bg-gray-950 border border-gray-800 text-gray-100 focus:border-rose-500'
                }`}
              />
            </div>
            <span className="text-xs text-gray-500">
              Showing: <b>{filteredAffiliates.length}</b> partners
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`uppercase text-[10px] tracking-wider border-b ${isLight ? 'bg-slate-100/70 border-slate-200 text-slate-600' : 'bg-gray-950 border-gray-800 text-gray-400'}`}>
                <tr>
                  <th className="p-4 font-bold">Partner Info</th>
                  <th className="p-4 font-bold">Affiliate Code</th>
                  <th className="p-4 font-bold text-center">Clicks</th>
                  <th className="p-4 font-bold text-center">Orders</th>
                  <th className="p-4 font-bold">Total Sales (৳)</th>
                  <th className="p-4 font-bold">Commission (৳)</th>
                  <th className="p-4 font-bold">Balance (৳)</th>
                  <th className="p-4 font-bold">Withdrawn</th>
                  <th className="p-4 font-bold text-center">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-gray-800'}`}>
                {filteredAffiliates.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-500">
                      No affiliate partners found.
                    </td>
                  </tr>
                ) : (
                  filteredAffiliates.map((partner) => (
                    <tr key={partner.id} className={`hover:bg-gray-500/5 transition`}>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-900 dark:text-white text-xs">{partner.name}</p>
                          <p className="text-[11px] text-gray-500">{partner.phone}</p>
                          <p className="text-[10px] text-gray-400 truncate max-w-[180px]">{partner.address}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 text-[11px]">
                            {partner.affiliate_code}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(partner.affiliate_code);
                              toast.success(`Code ${partner.affiliate_code} copied!`);
                            }}
                            className="text-gray-400 hover:text-white p-1 cursor-pointer transition"
                            title="Copy Code"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold text-gray-500">
                        {partner.total_clicks || 0}
                      </td>
                      <td className="p-4 text-center font-bold text-gray-900 dark:text-white">
                        {partner.total_orders || 0}
                      </td>
                      <td className="p-4 font-bold text-blue-500">
                        {formatPrice(partner.total_sales_amount || 0)}
                      </td>
                      <td className="p-4 font-bold text-emerald-500">
                        {formatPrice(partner.total_commission_earned || 0)}
                      </td>
                      <td className="p-4 font-black text-amber-500">
                        {formatPrice(partner.available_balance || 0)}
                      </td>
                      <td className="p-4 font-bold text-gray-500">
                        {formatPrice(partner.total_withdrawn || 0)}
                      </td>
                      <td className="p-4 text-center">
                        {partner.status === 'suspended' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-500/15 text-rose-500 border border-rose-500/30 inline-flex items-center gap-1">
                            <Ban className="w-3 h-3" /> Banned
                          </span>
                        ) : partner.status === 'approved' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {partner.status}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {partner.status === 'suspended' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleBan(partner)}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Unban partner"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Unban</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleBan(partner)}
                              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Ban / Suspend partner"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Ban</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeletePartner(partner)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-lg transition cursor-pointer"
                            title="Remove / Delete partner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* TAB 2: WITHDRAWAL REQUESTS TABLE */}
      {activeTab === 'withdrawals' && (
        <div className={`rounded-2xl border shadow-xs overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-gray-900 border-gray-800'}`}>
          
          {/* Filter Bar */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">Filter:</span>
              {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setWithdrawalFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                    withdrawalFilter === st
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-gray-800/60 text-gray-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-500">
              Total: <b>{filteredWithdrawals.length}</b> requests
            </span>
          </div>

          {/* Withdrawals Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`uppercase text-[10px] tracking-wider border-b ${isLight ? 'bg-slate-100/70 border-slate-200 text-slate-600' : 'bg-gray-950 border-gray-800 text-gray-400'}`}>
                <tr>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold">Partner</th>
                  <th className="p-4 font-bold">Amount</th>
                  <th className="p-4 font-bold">Payout Method & Account</th>
                  <th className="p-4 font-bold">Partner Note</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Admin TrxID / Note</th>
                  <th className="p-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-gray-800'}`}>
                {filteredWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      No payout requests found.
                    </td>
                  </tr>
                ) : (
                  filteredWithdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-500/5 transition">
                      <td className="p-4 text-gray-400 font-mono text-[11px]">
                        {new Date(w.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-900 dark:text-white">{w.affiliate_name}</p>
                        <p className="text-[11px] text-gray-500 font-mono">{w.affiliate_phone} • {w.affiliate_code}</p>
                      </td>
                      <td className="p-4 font-black text-emerald-500 text-sm">
                        {formatPrice(w.amount)}
                      </td>
                      <td className="p-4">
                        <span className="uppercase font-bold text-rose-500">{w.payment_method}:</span>{' '}
                        <span className="font-mono text-gray-900 dark:text-gray-200 select-all">{w.account_number}</span>
                      </td>
                      <td className="p-4 text-gray-400 max-w-xs truncate">
                        {w.notes || '-'}
                      </td>
                      <td className="p-4">
                        {w.status === 'approved' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            ✓ Paid / Approved
                          </span>
                        ) : w.status === 'rejected' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            ✕ Rejected
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            ⧖ Pending Approval
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400 font-mono text-[11px]">
                        {w.admin_trx_id ? (
                          <span className="text-emerald-400 font-bold block">Trx: {w.admin_trx_id}</span>
                        ) : null}
                        <span>{w.admin_note || '-'}</span>
                      </td>
                      <td className="p-4 text-right">
                        {w.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWithdrawal(w);
                              setAdminTrxId('');
                              setAdminNote('');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                          >
                            Review & Pay
                          </button>
                        ) : (
                          <span className="text-gray-500 text-[11px]">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 3: AFFILIATE SALES ORDERS */}
      {activeTab === 'orders' && (
        <div className={`rounded-2xl border shadow-xs overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-gray-900 border-gray-800'}`}>
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-sm">All Orders Attributed to Affiliates</h3>
            <span className="text-xs text-gray-500">Total: <b>{affiliateOrders.length}</b> orders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`uppercase text-[10px] tracking-wider border-b ${isLight ? 'bg-slate-100/70 border-slate-200 text-slate-600' : 'bg-gray-950 border-gray-800 text-gray-400'}`}>
                <tr>
                  <th className="p-4 font-bold">Order #</th>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold">Customer</th>
                  <th className="p-4 font-bold">Affiliate Code</th>
                  <th className="p-4 font-bold">Order Total</th>
                  <th className="p-4 font-bold">Commission (৳)</th>
                  <th className="p-4 font-bold">Payment Method</th>
                  <th className="p-4 font-bold text-right">Order Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-gray-800'}`}>
                {affiliateOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      No orders have been placed through affiliate links yet.
                    </td>
                  </tr>
                ) : (
                  affiliateOrders.map((ord) => (
                    <tr key={ord.id || ord.order_number} className="hover:bg-gray-500/5 transition">
                      <td className="p-4 font-mono font-bold text-rose-600">
                        #{ord.order_number}
                      </td>
                      <td className="p-4 text-gray-400 text-[11px]">
                        {new Date(ord.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-900 dark:text-white">{ord.customer_name}</p>
                        <p className="text-[11px] text-gray-500">{ord.customer_phone}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          {ord.affiliate_code}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-900 dark:text-white">
                        {formatPrice(ord.total_amount)}
                      </td>
                      <td className="p-4 font-black text-emerald-500">
                        {formatPrice(ord.affiliate_commission_amount || 0)}
                      </td>
                      <td className="p-4 uppercase font-bold text-gray-400">
                        {ord.payment_method}
                      </td>
                      <td className="p-4 text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-200">
                          {ord.order_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WITHDRAWAL APPROVAL MODAL */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-5 ${isLight ? 'bg-white border-slate-200' : 'bg-gray-900 border-gray-800 text-white'}`}>
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-600" />
                <span>Review Payout Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedWithdrawal(null)}
                className="p-1 text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Partner Name:</span>
                <span className="font-bold">{selectedWithdrawal.affiliate_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phone & Code:</span>
                <span className="font-mono">{selectedWithdrawal.affiliate_phone} ({selectedWithdrawal.affiliate_code})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payout Amount:</span>
                <span className="font-black text-emerald-400 text-sm">{formatPrice(selectedWithdrawal.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payment Method:</span>
                <span className="font-bold uppercase text-rose-400">{selectedWithdrawal.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Account Number:</span>
                <span className="font-mono font-bold select-all bg-gray-800 px-2 py-0.5 rounded">{selectedWithdrawal.account_number}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Payment TrxID (Transaction ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BK9823X7A (bKash / Nagad transaction ID)"
                  value={adminTrxId}
                  onChange={(e) => setAdminTrxId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold focus:outline-none ${
                    isLight ? 'bg-slate-100 border border-slate-200' : 'bg-gray-950 border border-gray-800 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Admin Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sent via bKash Personal..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium focus:outline-none ${
                    isLight ? 'bg-slate-100 border border-slate-200' : 'bg-gray-950 border border-gray-800 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isProcessingWithdrawal}
                onClick={handleConfirmApproval}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Approve & Mark Paid</span>
              </button>
              <button
                type="button"
                disabled={isProcessingWithdrawal}
                onClick={handleConfirmRejection}
                className="py-2.5 px-4 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Reject Request
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

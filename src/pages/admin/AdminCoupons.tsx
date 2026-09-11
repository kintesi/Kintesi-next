import React, { useState } from 'react';
import { useCoupons } from '../../contexts/CouponContext';
import { Coupon } from '../../types';
import {
  Tag,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  ShieldCheck,
  Percent,
  Clock,
  AlertCircle,
  Search,
  Check,
  X,
  History,
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminCoupons: React.FC = () => {
  const {
    coupons,
    isLoading,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
    couponUsages,
  } = useCoupons();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'coupons' | 'usages'>('coupons');

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxDiscount, setMaxDiscount] = useState<string>('');
  const [minOrderValue, setMinOrderValue] = useState<number>(500);
  const [isNewUserOnly, setIsNewUserOnly] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [usageLimitPerUser, setUsageLimitPerUser] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue(10);
    setMaxDiscount('');
    setMinOrderValue(500);
    setIsNewUserOnly(false);
    setExpiresAt('');
    setUsageLimitPerUser(1);
    setIsActive(true);
    setEditingCoupon(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDescription(coupon.description || '');
    setDiscountType(coupon.discount_type || 'percentage');
    setDiscountValue(Number(coupon.discount_value || coupon.discount_percent || 10));
    setMaxDiscount(coupon.max_discount ? coupon.max_discount.toString() : '');
    setMinOrderValue(coupon.min_order_value || 0);
    setIsNewUserOnly(!!coupon.is_new_user_only);
    setExpiresAt(coupon.expires_at ? coupon.expires_at.substring(0, 16) : '');
    setUsageLimitPerUser(coupon.usage_limit_per_user || 1);
    setIsActive(coupon.is_active !== false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    if (discountValue <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      description: description.trim(),
      discount_type: discountType,
      discount_percent: discountType === 'percentage' ? discountValue : 0,
      discount_value: discountValue,
      max_discount: maxDiscount ? Number(maxDiscount) : undefined,
      min_order_value: Number(minOrderValue) || 0,
      is_new_user_only: isNewUserOnly,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      usage_limit_per_user: Number(usageLimitPerUser) || 1,
      is_active: isActive,
    };

    let success = false;
    if (editingCoupon) {
      success = await updateCoupon(editingCoupon.id, payload);
    } else {
      success = await createCoupon(payload);
    }

    if (success) {
      setIsModalOpen(false);
      resetForm();
    }
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.times_used || 0), 0);
  const activeCount = coupons.filter((c) => c.is_active).length;

  return (
    <div className="w-full space-y-8 text-white pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <Tag className="w-8 h-8 text-rose-500" />
            <span>Discount Coupons & Promo Codes</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Create customized promo codes, enforce strict 1-use-per-user limits, and set expiration dates
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-rose-600/30 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/80 border border-gray-700/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase">Total Coupons</span>
            <Tag className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-white">{coupons.length}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">In store database</span>
        </div>

        <div className="bg-gray-800/80 border border-gray-700/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase">Active Coupons</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{activeCount}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Currently redeemable</span>
        </div>

        <div className="bg-gray-800/80 border border-gray-700/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase">Total Redemptions</span>
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-400">{totalRedemptions}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Times successfully used</span>
        </div>

        <div className="bg-gray-800/80 border border-gray-700/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase">Security Shield</span>
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">1 Per Customer</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Anti-abuse limit active</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'coupons'
              ? 'bg-rose-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>All Promo Coupons ({coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('usages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'usages'
              ? 'bg-rose-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Redemption Logs ({couponUsages.length})</span>
        </button>
      </div>

      {/* Tab 1: Coupons Table */}
      {activeTab === 'coupons' && (
        <div className="bg-gray-800/80 border border-gray-700/80 rounded-3xl overflow-hidden shadow-xl">
          {/* Search bar inside table */}
          <div className="p-4 sm:p-5 border-b border-gray-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search coupon code or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <span className="text-xs text-gray-400">
              Showing <strong className="text-white">{filteredCoupons.length}</strong> coupons
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-900/90 text-gray-400 uppercase font-black tracking-wider text-[10px] border-b border-gray-700">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Eligibility</th>
                  <th className="py-3.5 px-4">Min. Order</th>
                  <th className="py-3.5 px-4">Expires At</th>
                  <th className="py-3.5 px-4">Uses</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/60">
                {filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500 text-xs">
                      No coupons found. Click "+ Create New Coupon" to add your first promo code.
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon) => {
                    const isExpired =
                      coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now();

                    return (
                      <tr key={coupon.id} className="hover:bg-gray-700/40 transition">
                        <td className="py-4 px-4 sm:px-6 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg font-mono text-xs font-black tracking-wider">
                              {coupon.code}
                            </span>
                          </div>
                          {coupon.description && (
                            <p className="text-[11px] text-gray-400 mt-1 max-w-xs truncate">
                              {coupon.description}
                            </p>
                          )}
                        </td>

                        <td className="py-4 px-4 font-bold text-emerald-400">
                          {coupon.discount_type === 'fixed'
                            ? `৳${coupon.discount_value || coupon.discount_percent} FLAT`
                            : `${coupon.discount_percent}% OFF`}
                          {coupon.max_discount ? (
                            <span className="block text-[10px] text-gray-400 font-normal">
                              Max ৳{coupon.max_discount}
                            </span>
                          ) : null}
                        </td>

                        <td className="py-4 px-4">
                          {coupon.is_new_user_only ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Users className="w-3 h-3" />
                              New Users (7 Days)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              All Customers
                            </span>
                          )}
                          <span className="block text-[10px] text-gray-400 mt-0.5">
                            Max {coupon.usage_limit_per_user || 1} use/customer
                          </span>
                        </td>

                        <td className="py-4 px-4 font-medium text-gray-300">
                          {coupon.min_order_value ? `৳${coupon.min_order_value}` : 'No Min.'}
                        </td>

                        <td className="py-4 px-4">
                          {coupon.expires_at ? (
                            <div>
                              <span
                                className={`text-[11px] font-semibold ${
                                  isExpired ? 'text-rose-400 line-through' : 'text-gray-200'
                                }`}
                              >
                                {new Date(coupon.expires_at).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              {isExpired && (
                                <span className="block text-[9px] text-rose-400 font-bold uppercase">
                                  Expired
                                </span>
                              )}
                            </div>
                          ) : coupon.is_new_user_only ? (
                            <span className="text-[11px] text-amber-300 font-medium">
                              7 days after user signs up
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-medium">No Expiry</span>
                          )}
                        </td>

                        <td className="py-4 px-4 font-bold text-white">
                          <span className="px-2 py-0.5 bg-gray-900 rounded-md">
                            {coupon.times_used || 0}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <button
                            onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1.5 ${
                              coupon.is_active
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-gray-700/60 text-gray-400 border border-gray-600 hover:bg-gray-700'
                            }`}
                          >
                            {coupon.is_active ? (
                              <>
                                <Check className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3" />
                                Inactive
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(coupon)}
                              title="Edit Coupon"
                              className="p-1.5 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Are you sure you want to delete coupon "${coupon.code}"?`
                                  )
                                ) {
                                  deleteCoupon(coupon.id);
                                }
                              }}
                              title="Delete Coupon"
                              className="p-1.5 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Usages Log */}
      {activeTab === 'usages' && (
        <div className="bg-gray-800/80 border border-gray-700/80 rounded-3xl overflow-hidden shadow-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-rose-400" />
                <span>Customer Coupon Redemption Log</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Every redeemed coupon is permanently logged to ensure no customer can reuse coupons beyond their limit.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-900 text-gray-400 uppercase font-black text-[10px] border-b border-gray-700">
                <tr>
                  <th className="py-3 px-4">Coupon</th>
                  <th className="py-3 px-4">Customer Email</th>
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Discount Saved</th>
                  <th className="py-3 px-4">Redeemed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/60">
                {couponUsages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-500 text-xs">
                      No coupon redemptions recorded yet.
                    </td>
                  </tr>
                ) : (
                  couponUsages.map((usage) => (
                    <tr key={usage.id} className="hover:bg-gray-700/40">
                      <td className="py-3 px-4 font-mono font-bold text-rose-400">
                        {usage.coupon_code}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">{usage.customer_email}</td>
                      <td className="py-3 px-4 font-mono text-gray-300">
                        {usage.order_id || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        ৳{usage.discount_amount}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(usage.created_at).toLocaleString('en-GB')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-700 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-rose-500" />
                <span>{editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Code & Discount Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-1.5">
                    Coupon Promo Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EID25"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 focus:border-rose-500 rounded-xl text-white font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-1.5">
                    Discount Type *
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 focus:border-rose-500 rounded-xl text-white font-bold"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed">Fixed Cash Discount (৳)</option>
                  </select>
                </div>
              </div>

              {/* Discount Value & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-1.5">
                    Discount Amount ({discountType === 'percentage' ? '%' : '৳'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 focus:border-rose-500 rounded-xl text-white font-bold"
                  />
                </div>

                {discountType === 'percentage' && (
                  <div>
                    <label className="block font-bold text-gray-400 uppercase mb-1.5">
                      Max Discount Cap (৳) (Optional)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1000 (leave blank for no cap)"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 focus:border-rose-500 rounded-xl text-white font-bold"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-1.5">
                    Minimum Order Subtotal (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 focus:border-rose-500 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-1.5">
                    Usage Limit Per Customer
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimitPerUser}
                    onChange={(e) => setUsageLimitPerUser(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 focus:border-rose-500 rounded-xl text-white font-bold"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Default 1 = single use per customer to prevent abuse
                  </span>
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1.5">
                  Coupon Expiration Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 focus:border-rose-500 rounded-xl text-white font-bold"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Leave empty if this coupon should never expire automatically.
                </span>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1.5">
                  Description / Customer Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Exclusive Eid Festival 15% discount"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 focus:border-rose-500 rounded-xl text-white"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3 bg-gray-900/80 rounded-xl border border-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewUserOnly}
                    onChange={(e) => setIsNewUserOnly(e.target.checked)}
                    className="accent-amber-500 w-4 h-4 rounded"
                  />
                  <div>
                    <span className="font-bold text-white block">
                      New Customers Only (Valid 7 Days From Account Creation)
                    </span>
                    <span className="text-[10px] text-gray-400">
                      When checked, only new accounts under 7 days old can apply this coupon. Older accounts will be blocked.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-900/80 rounded-xl border border-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4 rounded"
                  />
                  <div>
                    <span className="font-bold text-white block">Active & Redeemable Now</span>
                    <span className="text-[10px] text-gray-400">
                      Uncheck to temporarily pause or disable this coupon.
                    </span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-600/30 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, Save, Smartphone, Truck, Phone, Mail, CheckCircle2, ShieldCheck, Sparkles, Lock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export const AdminPaymentSettings: React.FC = () => {
  const { settings, updateSettings, isLoading } = useSettings();
  const { user } = useAuth();
  const isMasterOwner = user?.email?.toLowerCase().trim() === 'manage.kintesi@gmail.com';
  const isSuperAdmin = isMasterOwner;

  const [formData, setFormData] = useState({
    bkashNumber: settings.bkashNumber,
    bkashType: settings.bkashType,
    nagadNumber: settings.nagadNumber,
    nagadType: settings.nagadType,
    rocketNumber: settings.rocketNumber,
    rocketType: settings.rocketType,
    deliveryFeeInsideDhaka: settings.deliveryFeeInsideDhaka,
    deliveryFeeOutsideDhaka: settings.deliveryFeeOutsideDhaka,
    freeShippingThreshold: settings.freeShippingThreshold,
    helplinePhone: settings.helplinePhone,
    supportEmail: settings.supportEmail,
  });

  useEffect(() => {
    setFormData({
      bkashNumber: settings.bkashNumber,
      bkashType: settings.bkashType,
      nagadNumber: settings.nagadNumber,
      nagadType: settings.nagadType,
      rocketNumber: settings.rocketNumber,
      rocketType: settings.rocketType,
      deliveryFeeInsideDhaka: settings.deliveryFeeInsideDhaka,
      deliveryFeeOutsideDhaka: settings.deliveryFeeOutsideDhaka,
      freeShippingThreshold: settings.freeShippingThreshold,
      helplinePhone: settings.helplinePhone,
      supportEmail: settings.supportEmail,
    });
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMasterOwner) {
      toast.error('Permission Denied: Only the Store Owner (manage.kintesi@gmail.com) has permission to modify payment accounts and store settings.');
      return;
    }
    await updateSettings(formData);
  };

  if (!isMasterOwner) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Owner Authorization Required</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Only the Store Owner (<b>manage.kintesi@gmail.com</b>) has permission to manage Payment Gateways & Merchant accounts. Staff admins cannot view or alter payment details.
          </p>
          <Link
            to="/admin"
            className="inline-block py-2.5 px-6 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 text-white">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-emerald-400" />
          <span>Payment & Store Settings</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Configure merchant account numbers (bKash, Nagad, Rocket), seller personal accounts, and shipping fees
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Mobile Banking Merchant Accounts (Store Owner Global) */}
        <div className="bg-gray-800/80 rounded-3xl border border-gray-700 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span>Global Store Merchant Accounts (মেইন স্টোর অ্যাকাউন্ট)</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                এই নম্বরগুলো পুরো ওয়েবসাইটের সাধারণ পেমেন্ট মেথড হিসেবে চেকআউট পেজে ব্যবহৃত হয়।
              </p>
            </div>
            
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 self-start sm:self-auto ${
              isSuperAdmin 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {isSuperAdmin ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isSuperAdmin ? 'Store Owner Access' : 'Owner Only (Locked for Staff)'}</span>
            </span>
          </div>

          {!isSuperAdmin && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-200">Store Owner Protected (স্টোর ওনার সিকিউরিটি)</h4>
                <p className="text-[11px] text-amber-300/80">
                  গ্লোবাল মার্চেন্ট অ্যাকাউন্ট নম্বর শুধুমাত্র স্টোর ওনার পরিবর্তন করতে পারবেন। সেলার বা অন্যান্য অ্যাডমিনরা নিচে তাঁদের নিজস্ব <b>Personal Seller Profile</b> সেট ও সেভ করতে পারবেন।
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* bKash */}
            <div className="bg-gray-900/90 p-5 rounded-2xl border border-pink-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-pink-400 text-sm">bKash Account</span>
                <span className="text-[10px] bg-pink-500/20 text-pink-300 font-bold px-2 py-0.5 rounded-full">
                  {isSuperAdmin ? 'Active' : 'Locked'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">bKash Number *</label>
                <input
                  type="text"
                  required
                  disabled={!isSuperAdmin}
                  value={formData.bkashNumber}
                  onChange={(e) => setFormData({ ...formData, bkashNumber: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs font-mono text-white focus:ring-2 focus:ring-pink-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Account Type</label>
                <select
                  disabled={!isSuperAdmin}
                  value={formData.bkashType}
                  onChange={(e) => setFormData({ ...formData, bkashType: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="Merchant">Merchant Account (Payment)</option>
                  <option value="Personal">Personal Account (Send Money)</option>
                </select>
              </div>
            </div>
            {/* Nagad */}
            <div className="bg-gray-900/90 p-5 rounded-2xl border border-orange-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-orange-400 text-sm">Nagad Account</span>
                <span className="text-[10px] bg-orange-500/20 text-orange-300 font-bold px-2 py-0.5 rounded-full">
                  {isSuperAdmin ? 'Active' : 'Locked'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Nagad Number *</label>
                <input
                  type="text"
                  required
                  disabled={!isSuperAdmin}
                  value={formData.nagadNumber}
                  onChange={(e) => setFormData({ ...formData, nagadNumber: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs font-mono text-white focus:ring-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Account Type</label>
                <select
                  disabled={!isSuperAdmin}
                  value={formData.nagadType}
                  onChange={(e) => setFormData({ ...formData, nagadType: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="Merchant">Merchant Account (Payment)</option>
                  <option value="Personal">Personal Account (Send Money)</option>
                </select>
              </div>
            </div>

            {/* Rocket */}
            <div className="bg-gray-900/90 p-5 rounded-2xl border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-purple-400 text-sm">Rocket Account</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full">
                  {isSuperAdmin ? 'Active' : 'Locked'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Rocket Number *</label>
                <input
                  type="text"
                  required
                  disabled={!isSuperAdmin}
                  value={formData.rocketNumber}
                  onChange={(e) => setFormData({ ...formData, rocketNumber: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs font-mono text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Account Type</label>
                <select
                  disabled={!isSuperAdmin}
                  value={formData.rocketType}
                  onChange={(e) => setFormData({ ...formData, rocketType: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="Personal">Personal Account</option>
                  <option value="Merchant">Merchant Account</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Shipping & Delivery Fees (Store Owner Global) */}
        <div className="bg-gray-800/80 rounded-3xl border border-gray-700 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-400" />
              <span>Shipping & Delivery Rules (স্টোর ডেলিভারি ফি)</span>
            </h2>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              isSuperAdmin ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-gray-700 text-gray-400 border-gray-600'
            }`}>
              {isSuperAdmin ? 'Editable by Owner' : 'Owner Locked'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Delivery Fee Inside Dhaka (৳)</label>
              <input
                type="number"
                disabled={!isSuperAdmin}
                value={formData.deliveryFeeInsideDhaka}
                onChange={(e) => setFormData({ ...formData, deliveryFeeInsideDhaka: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Delivery Fee Outside Dhaka (৳)</label>
              <input
                type="number"
                disabled={!isSuperAdmin}
                value={formData.deliveryFeeOutsideDhaka}
                onChange={(e) => setFormData({ ...formData, deliveryFeeOutsideDhaka: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Free Delivery Min Order (৳)</label>
              <input
                type="number"
                disabled={!isSuperAdmin}
                value={formData.freeShippingThreshold}
                onChange={(e) => setFormData({ ...formData, freeShippingThreshold: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Store Helpline & Support Contact (Store Owner Global) */}
        <div className="bg-gray-800/80 rounded-3xl border border-gray-700 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-400" />
              <span>Store Support Contacts (কাস্টমার সাপোর্ট যোগাযোগ)</span>
            </h2>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              isSuperAdmin ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-gray-700 text-gray-400 border-gray-600'
            }`}>
              {isSuperAdmin ? 'Editable by Owner' : 'Owner Locked'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Helpline Phone (ইন-বিল্ট সাপোর্ট নম্বর)</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={formData.helplinePhone}
                onChange={(e) => setFormData({ ...formData, helplinePhone: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 uppercase mb-1.5">Support Email</label>
              <input
                type="email"
                disabled={!isSuperAdmin}
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Save Global Settings Button */}
        <div className="flex justify-end pt-2">
          {isSuperAdmin ? (
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm transition shadow-xl shadow-emerald-600/30 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-5 h-5" />
              <span>{isLoading ? 'Saving Changes...' : 'Save Global Store & Payment Settings'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 px-6 py-3.5 bg-gray-800/90 border border-amber-500/30 text-amber-300 font-bold rounded-2xl text-xs shadow-lg">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Global Store Merchant & Shipping Rules are restricted to Store Owner</span>
            </div>
          )}
        </div>

      </form>
    </div>
  );
};

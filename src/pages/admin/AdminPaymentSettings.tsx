import React, { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, Save, Smartphone, Truck, Phone, Mail, CheckCircle2, Landmark, ShieldCheck, Sparkles, Building2, Lock } from 'lucide-react';
import { toast } from 'sonner';

export const AdminPaymentSettings: React.FC = () => {
  const { settings, updateSettings, isLoading } = useSettings();
  const { isSuperAdmin } = useAuth();

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

  // Seller / Vendor Saved Profile State
  const [sellerProfile, setSellerProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('kintesi_seller_saved_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      seller_name: '',
      seller_phone: '',
      seller_bkash_number: '',
      seller_bkash_type: 'Personal',
      seller_nagad_number: '',
      seller_nagad_type: 'Personal',
      seller_rocket_number: '',
      seller_rocket_type: 'Personal',
      seller_bank_name: '',
      seller_bank_account_name: '',
      seller_bank_account_number: '',
      seller_bank_branch: '',
      seller_bank_routing_number: '',
      seller_custom_payment_note: 'পেমেন্ট সম্পন্ন করে ওয়েবসাইটের ইন-বিল্ট লাইভ চ্যাটে (Live Chat with Seller) ট্রানজেকশন আইডি প্রদান করুন।',
    };
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
    if (!isSuperAdmin) {
      toast.error('Permission Denied: Only the Store Owner has permission to modify global store accounts and fees.');
      return;
    }
    await updateSettings(formData);
  };

  const handleSaveSellerProfile = () => {
    if (!sellerProfile.seller_name.trim() && !sellerProfile.seller_bkash_number.trim() && !sellerProfile.seller_bank_name.trim()) {
      toast.error('Please enter at least your seller name, bKash or bank details before saving.');
      return;
    }
    localStorage.setItem('kintesi_seller_saved_profile', JSON.stringify(sellerProfile));
    toast.success('Your Personal Seller Payment & Bank Profile has been saved! You can now use it across all your products.');
  };

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

        {/* ========================================================
            MY PERSONAL SELLER PAYMENT & BANK PROFILE (CENTRAL STORE)
            ======================================================== */}
        <div className="bg-gradient-to-br from-purple-950/40 via-gray-900 to-gray-950 rounded-3xl border-2 border-purple-500/40 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-purple-500/20">
            <div>
              <div className="flex items-center gap-2">
                <Landmark className="w-6 h-6 text-purple-400" />
                <h2 className="text-lg font-bold text-white">
                  My Personal Seller Payment & Bank Profile (সেলার / ভেন্ডর প্রোফাইল)
                </h2>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2.5 py-0.5 rounded-full border border-purple-500/30">
                  Reusable Across Products
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                এখানে আপনার নিজস্ব বিকাশ, নগদ ও ব্যাংক একাউন্ট একবার সেভ করে রাখুন— যেকোনো প্রোডাক্ট লিস্টিংয়ের সময় ১-ক্লিকেই ব্যবহার করতে পারবেন।
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveSellerProfile}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-purple-600/30 active:scale-95 self-start sm:self-auto"
            >
              <Save className="w-4 h-4" />
              <span>Save My Seller Profile</span>
            </button>
          </div>

          <div className="space-y-6 text-xs">
            {/* Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                  Seller / Shop / Representative Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Official Store / Verified Boutique"
                  value={sellerProfile.seller_name}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, seller_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                  Seller Contact Phone (In-Platform Reference)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 017XXXXXXXX"
                  value={sellerProfile.seller_phone}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, seller_phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Mobile Banking Accounts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* bKash */}
              <div className="p-4 bg-gray-800/90 border border-pink-500/30 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-400">Personal bKash</span>
                  <select
                    value={sellerProfile.seller_bkash_type}
                    onChange={(e) => setSellerProfile({ ...sellerProfile, seller_bkash_type: e.target.value as any })}
                    className="bg-gray-900 border border-gray-700 rounded-lg text-[10px] text-pink-300 px-2 py-0.5"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Merchant">Merchant</option>
                    <option value="Agent">Agent</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="01XXXXXXXXX"
                  value={sellerProfile.seller_bkash_number}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, seller_bkash_number: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              {/* Nagad */}
              <div className="p-4 bg-gray-800/90 border border-orange-500/30 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-400">Personal Nagad</span>
                  <select
                    value={sellerProfile.seller_nagad_type}
                    onChange={(e) => setSellerProfile({ ...sellerProfile, seller_nagad_type: e.target.value as any })}
                    className="bg-gray-900 border border-gray-700 rounded-lg text-[10px] text-orange-300 px-2 py-0.5"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Merchant">Merchant</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="01XXXXXXXXX"
                  value={sellerProfile.seller_nagad_number}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, seller_nagad_number: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              {/* Rocket */}
              <div className="p-4 bg-gray-800/90 border border-purple-500/30 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400">Personal Rocket</span>
                  <select
                    value={sellerProfile.seller_rocket_type}
                    onChange={(e) => setSellerProfile({ ...sellerProfile, seller_rocket_type: e.target.value as any })}
                    className="bg-gray-900 border border-gray-700 rounded-lg text-[10px] text-purple-300 px-2 py-0.5"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Merchant">Merchant</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="01XXXXXXXXX"
                  value={sellerProfile.seller_rocket_number}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, seller_rocket_number: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Official Bank Account Details */}
            <div className="p-5 bg-gray-800/90 border border-emerald-500/30 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">
                  Seller Official Bank Account Details (ব্যাংক ট্রান্সফার অ্যাকাউন্ট)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Bank Name (ব্যাংকের নাম)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dutch-Bangla Bank / Islami Bank"
                    value={sellerProfile.seller_bank_name}
                    onChange={(e) => setSellerProfile({ ...sellerProfile, seller_bank_name: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Account Holder Name (হিসাবধারীর নাম)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Account Holder Full Name"
                    value={sellerProfile.seller_bank_account_name}
                    onChange={(e) => setSellerProfile({ ...sellerProfile, seller_bank_account_name: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Account Number (অ্যাকাউন্ট নম্বর)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 151.101.XXXXXX"
                    value={sellerProfile.seller_bank_account_number}
                    onChange={(e) => setSellerProfile({ ...sellerProfile, seller_bank_account_number: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Branch Name (শাখা)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dhanmondi Branch / Uttara Branch"
                    value={sellerProfile.seller_bank_branch}
                    onChange={(e) => setSellerProfile({ ...sellerProfile, seller_bank_branch: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Routing Number (রাউটিং নম্বর)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 090271234"
                    value={sellerProfile.seller_bank_routing_number}
                    onChange={(e) => setSellerProfile({ ...sellerProfile, seller_bank_routing_number: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Custom Payment Instruction Note */}
            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                Buyer Payment Instruction Note (কাস্টমারের জন্য পেমেন্ট সংক্রান্ত বিশেষ নির্দেশনা)
              </label>
              <input
                type="text"
                placeholder="e.g. পেমেন্ট সম্পন্ন করে ওয়েবসাইটের লাইভ চ্যাটে (Live Chat with Seller) ট্রানজেকশন স্লিপ পাঠিয়ে কনফার্ম করুন।"
                value={sellerProfile.seller_custom_payment_note}
                onChange={(e) => setSellerProfile({ ...sellerProfile, seller_custom_payment_note: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500"
              />
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

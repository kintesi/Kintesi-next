import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Product, AffiliateUser, AffiliateWithdrawal } from '../types';
import { getProductsFromDB } from '../lib/dbService';
import {
  getAffiliatesFromDB,
  registerAffiliate,
  getWithdrawalsFromDB,
  createWithdrawalRequest,
  getProductAffiliateInfo,
} from '../lib/affiliateService';
import { formatPrice } from '../lib/utils';
import {
  Share2,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Wallet,
  Smartphone,
  Landmark,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export const AffiliateDashboardPage: React.FC = () => {
  const { user, profile, isLoading, openAuthModal } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([]);
  const [currentAffiliate, setCurrentAffiliate] = useState<AffiliateUser | null>(null);
  const [withdrawals, setWithdrawals] = useState<AffiliateWithdrawal[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Registration Form state
  const [regName, setRegName] = useState(profile?.full_name || user?.displayName || user?.user_metadata?.full_name || '');
  const [regPhone, setRegPhone] = useState(profile?.phone || '');
  const [regAddress, setRegAddress] = useState(profile?.address || '');
  const [regMethod, setRegMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash');
  const [regAccount, setRegAccount] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Auto-sync profile info into registration fields if available
  useEffect(() => {
    if (profile || user) {
      if (!regName) setRegName(profile?.full_name || user?.displayName || user?.user_metadata?.full_name || '');
      if (!regPhone && profile?.phone) setRegPhone(profile.phone);
      if (!regAddress && profile?.address) setRegAddress(profile.address);
    }
  }, [profile, user]);

  // SKU Link Generator State
  const [skuQuery, setSkuQuery] = useState('');
  const [searchedProduct, setSearchedProduct] = useState<Product | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [copiedProductLink, setCopiedProductLink] = useState(false);

  // Withdrawal Request Form State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'withdraw'>('overview');

  const loadData = async () => {
    try {
      const [prods, affs, withs] = await Promise.all([
        getProductsFromDB(),
        getAffiliatesFromDB(),
        getWithdrawalsFromDB(),
      ]);
      setProducts(prods);
      setAffiliates(affs);
      setWithdrawals(withs);

      // Identify if current user is an affiliate
      let matched: AffiliateUser | null = null;
      if (user?.id) {
        matched = affs.find((a) => a.user_id === user.id) || null;
      }
      if (!matched && (profile?.phone || regPhone)) {
        const ph = profile?.phone || regPhone;
        matched = affs.find((a) => a.phone === ph) || null;
      }
      if (!matched) {
        const cached = localStorage.getItem('kintesi_my_affiliate_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          matched = affs.find((a) => a.id === parsed.id) || parsed;
        }
      }

      if (matched) {
        setCurrentAffiliate(matched);
        if (!regAccount && matched.account_number) {
          setWithdrawAccount(matched.account_number);
        }
      }
    } catch (err) {
      console.warn('Affiliate page load notice:', err);
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
  }, [user, profile]);

  // Handle Affiliate Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      toast.error('আপনার পূর্ণ নাম লিখুন');
      return;
    }
    if (!regPhone.trim()) {
      toast.error('সঠিক মোবাইল নম্বর লিখুন');
      return;
    }
    if (!regAddress.trim()) {
      toast.error('আপনার ঠিকানা লিখুন');
      return;
    }

    setIsSubmittingReg(true);
    try {
      const newPartner = await registerAffiliate({
        name: regName.trim(),
        phone: regPhone.trim(),
        address: regAddress.trim(),
        email: user?.email || '',
        user_id: user?.id || null,
        payment_method: regMethod,
        account_number: regAccount.trim() || regPhone.trim(),
      });
      setCurrentAffiliate(newPartner);
      setWithdrawAccount(newPartner.account_number || newPartner.phone);
      toast.success('অভিনন্দন! আপনার অ্যাফিলিয়েট অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।');
    } catch (err: any) {
      toast.error('অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  // Handle SKU Search
  const handleSearchSku = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = skuQuery.trim().toLowerCase();
    if (!q) {
      setSearchedProduct(null);
      setSearchAttempted(false);
      return;
    }

    setSearchAttempted(true);
    const found = products.find(
      (p) =>
        (p.sku && p.sku.toLowerCase() === q) ||
        (p.slug && p.slug.toLowerCase() === q) ||
        (p.id && p.id.toLowerCase() === q) ||
        p.title.toLowerCase().includes(q)
    );
    setSearchedProduct(found || null);
  };

  // Handle Withdrawal Request Submission
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAffiliate) return;

    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('সঠিক উইথড্রয়াল অ্যামাউন্ট লিখুন');
      return;
    }
    if (amount < 50) {
      toast.error('সর্বনিম্ন উইথড্রয়াল পরিমাণ ৳ ৫০');
      return;
    }
    if (amount > (currentAffiliate.available_balance || 0)) {
      toast.error('আপনার বর্তমান ব্যালেন্সের চেয়ে বেশি উইথড্র করা সম্ভব নয়');
      return;
    }
    if (!withdrawAccount.trim()) {
      toast.error('পেমেন্ট গ্রহণ করার অ্যাকাউন্ট নম্বর লিখুন');
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      await createWithdrawalRequest({
        affiliate_id: currentAffiliate.id,
        affiliate_code: currentAffiliate.affiliate_code,
        affiliate_name: currentAffiliate.name,
        affiliate_phone: currentAffiliate.phone,
        amount,
        payment_method: withdrawMethod,
        account_number: withdrawAccount.trim(),
        notes: withdrawNotes.trim(),
      });
      setWithdrawAmount('');
      setWithdrawNotes('');
      toast.success('আপনার উইথড্রয়াল রিকোয়েস্ট জমা দেওয়া হয়েছে। এডমিন ভেরিফাই করে টাকা পাঠিয়ে দেবেন।');
      loadData();
    } catch (err) {
      toast.error('উইথড্রয়াল রিকোয়েস্ট ব্যর্থ হয়েছে, পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kintesi.com';
  const globalReferralUrl = currentAffiliate
    ? `${originUrl}/?aff=${currentAffiliate.affiliate_code}`
    : '';

  const myWithdrawals = withdrawals.filter(
    (w) => currentAffiliate && (w.affiliate_id === currentAffiliate.id || w.affiliate_code === currentAffiliate.affiliate_code)
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <Share2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">সাইন ইন প্রয়োজন</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              কিনতেসি অ্যাফিলিয়েট প্রোগ্রামে যুক্ত হতে বা আপনার ড্যাশবোর্ডে প্রবেশ করতে অনুগ্রহ করে প্রথমে আপনার অ্যাকাউন্টে সাইন ইন করুন।
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-sm active:scale-95 cursor-pointer"
            >
              লগইন / সাইন আপ করুন
            </button>
            <Link
              to="/shop"
              className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
            >
              কেনাকাটায় ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 pb-20">
      {/* Top Breadcrumb & Page Banner */}
      <div className="bg-white border-b border-gray-100 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Link to="/" className="hover:text-rose-600 transition">Home</Link>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                <span className="font-bold text-gray-900">Affiliate Program</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-950 flex items-center gap-2">
                <Share2 className="w-6 h-6 text-rose-600" />
                <span>কিনতেসি অ্যাফিলিয়েট প্রোগ্রাম (Kintesi Affiliate)</span>
              </h1>
            </div>

            {currentAffiliate && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Partner
                </span>
                <span className="text-xs font-mono font-black text-gray-900 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full">
                  {currentAffiliate.affiliate_code}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        
        {/* CASE 1: UNREGISTERED USER -> REGISTRATION FORM */}
        {!currentAffiliate ? (
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Promo Card */}
            <div 
              className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden bg-rose-600"
              style={{
                background: 'linear-gradient(135deg, #9f1239 0%, #e11d48 50%, #be123c 100%)',
              }}
            >
              {/* Decorative background glow */}
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-black/15 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-amber-200 border border-white/25">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Earn Up to 15% Commission
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug text-white drop-shadow-xs">
                  কিনতেসি প্রোডাক্ট শেয়ার করে প্রতিদিন টাকা ইনকাম করুন!
                </h2>
                <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed max-w-xl font-medium">
                  আমাদের প্রোডাক্টের অ্যাফিলিয়েট লিংক ফেসবুক, হোয়াটসঅ্যাপ বা ইউটিউবে শেয়ার করুন। আপনার লিংকের মাধ্যমে কেউ অর্ডার করলেই সাথে সাথে পেয়ে যাবেন আকর্ষণীয় ক্যাশ কমিশন!
                </p>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-white/15 backdrop-blur-md p-3.5 rounded-2xl border border-white/25 text-center text-white shadow-xs">
                    <p className="text-lg sm:text-xl font-black text-white">০ টাকা</p>
                    <p className="text-[11px] text-rose-100 font-medium">জয়েনিং ফি সম্পূর্ণ ফ্রি</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur-md p-3.5 rounded-2xl border border-white/25 text-center text-white shadow-xs">
                    <p className="text-lg sm:text-xl font-black text-white">লাইভ ট্র্যাকিং</p>
                    <p className="text-[11px] text-rose-100 font-medium">রিয়েল-টাইম সেল হিসাব</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur-md p-3.5 rounded-2xl border border-white/25 text-center text-white shadow-xs">
                    <p className="text-lg sm:text-xl font-black text-white">সহজ পেমেন্ট</p>
                    <p className="text-[11px] text-rose-100 font-medium">বিকাশ / নগদ পেআউট</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Card */}
            <div className="bg-white rounded-3xl border border-rose-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  অ্যাফিলিয়েট হিসেবে জয়েন করার ফরম
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  নিচের তথ্যগুলো পূরণ করে সাবমিট করলেই তাৎক্ষণিক আপনার ইউনিক অ্যাফিলিয়েট কোড তৈরি হয়ে যাবে।
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    আপনার পূর্ণ নাম (Full Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. মোহাম্মদ তানভীর"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      মোবাইল নম্বর (Phone Number) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 017XXXXXXXX"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-rose-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      পেমেন্ট মেথড (টাকা গ্রহণের মাধ্যম)
                    </label>
                    <select
                      value={regMethod}
                      onChange={(e) => setRegMethod(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:border-rose-500 transition cursor-pointer"
                    >
                      <option value="bkash">বিকাশ (bKash)</option>
                      <option value="nagad">নগদ (Nagad)</option>
                      <option value="rocket">রকেট (Rocket)</option>
                      <option value="bank">ব্যাংক একাউন্ট (Bank)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    আপনার পূর্ণাঙ্গ ঠিকানা (Address) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="রোড নম্বর, এলাকা, থানা, জেলা..."
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    উইথড্রয়াল অ্যাকাউন্ট নম্বর (bKash/Nagad No)
                  </label>
                  <input
                    type="text"
                    placeholder="যে নম্বরে উইথড্রয়াল টাকা নিতে চান (ঐচ্ছিক)"
                    value={regAccount}
                    onChange={(e) => setRegAccount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-xl transition shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingReg ? (
                    <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
                  ) : (
                    <>
                      <span>জয়েন করুন ও ইনকাম শুরু করুন</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        ) : (
          /* CASE 2: REGISTERED AFFILIATE DASHBOARD */
          <div className="space-y-6">

            {/* Partner Info & Global Referral Link Bar */}
            <div className="bg-white rounded-3xl border border-rose-100 p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-xl border border-rose-200 shadow-xs">
                    {currentAffiliate.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-gray-900 text-base">{currentAffiliate.name}</h2>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-md border border-emerald-200">
                        {currentAffiliate.affiliate_code}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {currentAffiliate.phone} • {currentAffiliate.address}
                    </p>
                  </div>
                </div>

                {/* Global Referral URL Box */}
                <div className="flex-1 max-w-xl">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    আপনার গ্লোবাল রেফারেল লিংক (যেকোনো প্রোডাক্টের জন্য):
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1.5 pl-3">
                    <input
                      type="text"
                      readOnly
                      value={globalReferralUrl}
                      className="w-full bg-transparent text-xs font-mono text-gray-700 select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(globalReferralUrl);
                        setCopiedLink(true);
                        toast.success('রেফারেল লিংক কপি করা হয়েছে!');
                        setTimeout(() => setCopiedLink(false), 2500);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Core Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              {/* 1. Available Balance */}
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>উত্তোলনযোগ্য ব্যালেন্স</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600">
                  {formatPrice(currentAffiliate.available_balance || 0)}
                </div>
                <button
                  onClick={() => setActiveTab('withdraw')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer pt-1"
                >
                  <span>টাকা তুলুন (Withdraw)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* 2. Total Commission Earned */}
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>মোট উপার্জিত কমিশন</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">
                  {formatPrice(currentAffiliate.total_commission_earned || 0)}
                </div>
                <p className="text-[11px] text-gray-400">
                  উইথড্র করেছেন: {formatPrice(currentAffiliate.total_withdrawn || 0)}
                </p>
              </div>

              {/* 3. Total Sales Value */}
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>মোট বিক্রয়কৃত অর্ডার</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">
                  {currentAffiliate.total_orders || 0} টি
                </div>
                <p className="text-[11px] text-gray-400">
                  মোট সেল: {formatPrice(currentAffiliate.total_sales_amount || 0)}
                </p>
              </div>

              {/* 4. Total Clicks */}
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>মোট লিংক ভিজিট</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">
                  {currentAffiliate.total_clicks || 0} বার
                </div>
                <p className="text-[11px] text-emerald-600 font-bold">
                  সক্রিয় ট্র্যাকিং চালু রয়েছে
                </p>
              </div>

            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>SKU লিংক জেনারেটর (Product Link Generator)</span>
              </button>

              <button
                onClick={() => setActiveTab('withdraw')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'withdraw'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>টাকা উত্তোলন ও ইতিহাস (Withdrawals)</span>
              </button>
            </div>

            {/* TAB CONTENT 1: SKU PRODUCT LINK GENERATOR */}
            {activeTab === 'overview' && (
              <div className="bg-white rounded-3xl border border-rose-100 p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <Search className="w-4 h-4 text-rose-600" />
                    <span>প্রোডাক্টের SKU দিয়ে অ্যাফিলিয়েট লিংক তৈরি করুন</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    যেকোনো প্রোডাক্টের SKU বা নাম লিখে সার্চ দিন। এডমিন যদি প্রোডাক্টটিতে অ্যাফিলিয়েট চালু রাখেন তবেই কমিশন ও রেফারেল লিংক দেখতে পাবেন।
                  </p>
                </div>

                {/* SKU Search Box */}
                <form onSubmit={handleSearchSku} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter Product SKU (e.g. KB885L, BOR-01) or Product Name..."
                      value={skuQuery}
                      onChange={(e) => setSkuQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-rose-500 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Product</span>
                  </button>
                </form>

                {/* Popular SKUs quick picker */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                  <span className="font-bold text-gray-400 text-[11px]">Quick SKUs:</span>
                  {products.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSkuQuery(p.sku || p.title);
                        setSearchedProduct(p);
                        setSearchAttempted(true);
                      }}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-[11px] font-mono transition cursor-pointer"
                    >
                      {p.sku || p.title.slice(0, 15)}
                    </button>
                  ))}
                </div>

                {/* SEARCH RESULTS DISPLAY */}
                {searchAttempted && (
                  <div className="pt-4 border-t border-gray-100">
                    {!searchedProduct ? (
                      <div className="p-6 rounded-2xl bg-gray-50 text-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                        <h4 className="text-sm font-bold text-gray-800">কোনো প্রোডাক্ট পাওয়া যায়নি</h4>
                        <p className="text-xs text-gray-500">
                          "{skuQuery}" এই SKU অথবা নামের কোনো প্রোডাক্ট স্টোরে নেই। সঠিক SKU দিন।
                        </p>
                      </div>
                    ) : (
                      /* PRODUCT FOUND */
                      <div className="rounded-2xl border border-gray-200 p-5 bg-white space-y-5">
                        
                        {/* Product Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <img
                            src={searchedProduct.images?.[0] || '/logo.webp'}
                            alt={searchedProduct.title}
                            className="w-18 h-18 sm:w-20 sm:h-20 object-contain rounded-xl border border-gray-100 bg-gray-50 shrink-0 p-1"
                          />
                          <div className="space-y-1 flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              SKU: <span className="font-mono text-gray-700">{searchedProduct.sku || 'N/A'}</span>
                            </span>
                            <h4 className="text-sm font-bold text-gray-900 truncate">
                              {searchedProduct.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="font-black text-rose-600">
                                {formatPrice(searchedProduct.discount_price || searchedProduct.price)}
                              </span>
                              <span className="text-gray-400">
                                স্টক: <b className="text-gray-700">{searchedProduct.stock} pcs</b>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* CASE A: ADMIN HAS DISABLED AFFILIATE FOR THIS PRODUCT */}
                        {!searchedProduct.is_affiliate_enabled ? (
                          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-xs text-rose-700">
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                              <span>নন-অ্যাফিলিয়েট প্রোডাক্ট (Non-Affiliate Product)</span>
                            </div>
                            <p className="text-xs text-rose-800 leading-relaxed">
                              এডমিন প্যানেল থেকে এই নির্দিষ্ট প্রোডাক্টটির জন্য অ্যাফিলিয়েট প্রোগ্রাম বর্তমানে বন্ধ রাখা হয়েছে। এই প্রোডাক্টে কোনো সেল কমিশন প্রযোজ্য নয়। অনুগ্রহ করে অন্য প্রোডাক্ট খুঁজুন।
                            </p>
                          </div>
                        ) : (
                          /* CASE B: AFFILIATE IS ENABLED FOR THIS PRODUCT! */
                          <div className="space-y-4 pt-2">
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>অ্যাফিলিয়েট প্রযোজ্য (Affiliate Eligible)</span>
                                </div>
                                <p className="text-xs text-emerald-700">
                                  কমিশন রেট: <b className="text-emerald-900 font-extrabold">{searchedProduct.affiliate_commission_rate || 10}%</b>
                                </p>
                              </div>
                              <div className="text-left sm:text-right bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                                <p className="text-[10px] text-gray-500 uppercase font-bold">প্রতি সেলে আপনার আয়:</p>
                                <p className="text-base font-black text-emerald-700">
                                  {formatPrice(
                                    Math.round(
                                      ((searchedProduct.discount_price || searchedProduct.price) *
                                        (searchedProduct.affiliate_commission_rate || 10)) /
                                        100
                                    )
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Product Affiliate Link */}
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-gray-700">
                                এই প্রোডাক্টের স্পেশাল অ্যাফিলিয়েট লিংক:
                              </label>
                              {(() => {
                                const prodLink = `${originUrl}/product/${searchedProduct.slug || searchedProduct.id}?aff=${currentAffiliate.affiliate_code}`;
                                return (
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-700 truncate select-all">
                                      {prodLink}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(prodLink);
                                          setCopiedProductLink(true);
                                          toast.success('প্রোডাক্ট অ্যাফিলিয়েট লিংক কপি হয়েছে!');
                                          setTimeout(() => setCopiedProductLink(false), 2500);
                                        }}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                                      >
                                        {copiedProductLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copiedProductLink ? 'কপি হয়েছে' : 'লিংক কপি করুন'}</span>
                                      </button>
                                      
                                      <a
                                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                          `Check this out on Kintesi: ${searchedProduct.title}\n${prodLink}`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                                        title="WhatsApp এ শেয়ার করুন"
                                      >
                                        WhatsApp
                                      </a>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT 2: WITHDRAW MONEY & HISTORY */}
            {activeTab === 'withdraw' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Withdrawal Form */}
                <div className="lg:col-span-1 bg-white rounded-3xl border border-rose-100 p-6 shadow-sm space-y-5">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <span>টাকা উত্তোলন (Withdraw)</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      বর্তমান ব্যালেন্স: <b className="text-emerald-600">{formatPrice(currentAffiliate.available_balance || 0)}</b>
                    </p>
                  </div>

                  <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        উইথড্রয়াল অ্যামাউন্ট (৳) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="50"
                        max={currentAffiliate.available_balance || 0}
                        required
                        placeholder="e.g. 500"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-rose-500 transition"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">সর্বনিম্ন ৫০ টাকা</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        পেমেন্ট মেথড <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={withdrawMethod}
                        onChange={(e) => setWithdrawMethod(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:border-rose-500 transition cursor-pointer"
                      >
                        <option value="bkash">বিকাশ (bKash Personal)</option>
                        <option value="nagad">নগদ (Nagad Personal)</option>
                        <option value="rocket">রকেট (Rocket)</option>
                        <option value="bank">ব্যাংক একাউন্ট (Bank Transfer)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        অ্যাকাউন্ট নম্বর <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="017XXXXXXXX"
                        value={withdrawAccount}
                        onChange={(e) => setWithdrawAccount(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-rose-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        নোট / রেফারেন্স (ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: ব্যাংক শাখা নাম বা বিশেষ অনুরোধ..."
                        value={withdrawNotes}
                        onChange={(e) => setWithdrawNotes(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-rose-500 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingWithdraw || (currentAffiliate.available_balance || 0) < 50}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer active:scale-95"
                    >
                      {isSubmittingWithdraw ? 'রিকোয়েস্ট পাঠানো হচ্ছে...' : 'উইথড্রয়াল আবেদন জমা দিন'}
                    </button>
                  </form>
                </div>

                {/* Withdrawal History Table */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-rose-100 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-600" />
                      <span>উইথড্রয়াল হিস্টোরি (Payout Requests)</span>
                    </h3>
                    <span className="text-xs text-gray-400 font-bold">{myWithdrawals.length} টি রেকর্ড</span>
                  </div>

                  {myWithdrawals.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl p-6">
                      <Wallet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 font-bold">এখনো কোনো উইথড্রয়াল আবেদন করা হয়নি</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">ব্যালেন্স ৫০ টাকার বেশি হলে উইথড্র করতে পারবেন।</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                            <th className="pb-3 font-bold">তারিখ</th>
                            <th className="pb-3 font-bold">পরিমাণ</th>
                            <th className="pb-3 font-bold">মেথড ও নম্বর</th>
                            <th className="pb-3 font-bold">স্ট্যাটাস</th>
                            <th className="pb-3 font-bold text-right">নোট / TrxID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {myWithdrawals.map((w) => (
                            <tr key={w.id} className="hover:bg-gray-50/50">
                              <td className="py-3 text-gray-600 font-medium">
                                {new Date(w.created_at).toLocaleDateString('bn-BD', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="py-3 font-black text-gray-900">
                                {formatPrice(w.amount)}
                              </td>
                              <td className="py-3">
                                <span className="uppercase font-bold text-gray-700">{w.payment_method}:</span>{' '}
                                <span className="font-mono text-gray-600">{w.account_number}</span>
                              </td>
                              <td className="py-3">
                                {w.status === 'approved' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    ✓ Paid / Approved
                                  </span>
                                ) : w.status === 'rejected' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    ✕ Rejected
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    ⧖ Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-right text-gray-500 font-mono text-[11px]">
                                {w.admin_trx_id || w.admin_note || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

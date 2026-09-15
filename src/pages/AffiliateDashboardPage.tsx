import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Product, AffiliateUser, AffiliateWithdrawal, GeneratedAffiliateProduct } from '../types';
import { getProductsFromDB } from '../lib/dbService';
import {
  getAffiliatesFromDB,
  registerAffiliate,
  getWithdrawalsFromDB,
  createWithdrawalRequest,
  getProductAffiliateInfo,
  getPartnerGeneratedProducts,
  savePartnerGeneratedProduct,
  removePartnerGeneratedProduct,
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
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export const AffiliateDashboardPage: React.FC = () => {
  const { user, profile, isLoading, openAuthModal } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([]);
  const [currentAffiliate, setCurrentAffiliate] = useState<AffiliateUser | null>(null);
  const [withdrawals, setWithdrawals] = useState<AffiliateWithdrawal[]>([]);
  const [generatedProducts, setGeneratedProducts] = useState<GeneratedAffiliateProduct[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
          matched = affs.find(
            (a) =>
              a.id === parsed.id ||
              (a.affiliate_code && parsed.affiliate_code && a.affiliate_code.toUpperCase() === parsed.affiliate_code.toUpperCase()) ||
              (a.phone && parsed.phone && a.phone === parsed.phone)
          ) || parsed;
        }
      }

      if (matched) {
        setCurrentAffiliate(matched);
        localStorage.setItem('kintesi_my_affiliate_profile', JSON.stringify(matched));
        if (!regAccount && matched.account_number) {
          setWithdrawAccount(matched.account_number);
        }
        if (matched.affiliate_code) {
          setGeneratedProducts(getPartnerGeneratedProducts(matched.affiliate_code));
        }
      }
    } catch (err) {
      console.warn('Affiliate page load notice:', err);
    }
  };

  useEffect(() => {
    loadData();
    const handleProductsUpdated = () => {
      if (currentAffiliate?.affiliate_code) {
        setGeneratedProducts(getPartnerGeneratedProducts(currentAffiliate.affiliate_code));
      }
    };
    window.addEventListener('kintesi_affiliates_updated', loadData);
    window.addEventListener('kintesi_withdrawals_updated', loadData);
    window.addEventListener('kintesi_partner_products_updated', handleProductsUpdated);
    return () => {
      window.removeEventListener('kintesi_affiliates_updated', loadData);
      window.removeEventListener('kintesi_withdrawals_updated', loadData);
      window.removeEventListener('kintesi_partner_products_updated', handleProductsUpdated);
    };
  }, [user, profile, currentAffiliate?.affiliate_code]);

  // Handle Affiliate Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!regPhone.trim()) {
      toast.error('Please enter a valid phone number');
      return;
    }
    if (!regAddress.trim()) {
      toast.error('Please enter your contact / delivery address');
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
      toast.success('Congratulations! Your affiliate account has been registered successfully.');
    } catch (err: any) {
      toast.error('Failed to create affiliate account. Please try again.');
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
        (p.id && String(p.id).toLowerCase() === q) ||
        (p.title && p.title.toLowerCase().includes(q))
    );
    setSearchedProduct(found || null);
  };

  // Handle Generate Affiliate Product Link
  const handleGenerateAffiliateLink = (prod: Product) => {
    if (!currentAffiliate) return;
    const price = prod.discount_price || prod.price || 0;
    const rate = prod.affiliate_commission_rate || 10;
    const commissionAmount = Math.round((price * rate) / 100);
    const prodLink = `${originUrl}/product/${prod.slug || prod.id}?aff=${currentAffiliate.affiliate_code}`;

    const newItem: GeneratedAffiliateProduct = {
      id: prod.id,
      title: prod.title,
      sku: prod.sku || 'N/A',
      slug: prod.slug,
      price: price,
      discount_price: prod.discount_price,
      image: prod.images?.[0] || '/logo.webp',
      commission_rate: rate,
      commission_amount: commissionAmount,
      affiliate_link: prodLink,
      created_at: new Date().toISOString(),
    };

    const updated = savePartnerGeneratedProduct(currentAffiliate.affiliate_code, newItem);
    setGeneratedProducts(updated);
    toast.success(`Affiliate link generated for "${prod.title}" and added to your dashboard!`);
  };

  // Handle Remove Saved Generated Product
  const handleRemoveGeneratedProduct = (prodId: string, title: string) => {
    if (!currentAffiliate) return;
    if (!window.confirm(`Remove "${title}" from your affiliate products list?`)) return;
    const updated = removePartnerGeneratedProduct(currentAffiliate.affiliate_code, prodId);
    setGeneratedProducts(updated);
    toast.info('Product removed from your dashboard list');
  };

  // Handle Withdrawal Request Submission
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAffiliate) return;

    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }
    if (amount < 50) {
      toast.error('Minimum withdrawal amount is ৳ 50');
      return;
    }
    if (amount > (currentAffiliate.available_balance || 0)) {
      toast.error('Withdrawal amount cannot exceed your available balance');
      return;
    }
    if (!withdrawAccount.trim()) {
      toast.error('Please enter your payout account number');
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
      toast.success('Your payout request has been submitted. Admin will process and disburse funds.');
      loadData();
    } catch (err) {
      toast.error('Failed to submit payout request, please try again.');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kintesi.com';

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
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Sign In Required</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              Please sign in to your Kintesi account to join the Affiliate Program and access your partner dashboard.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-sm active:scale-95 cursor-pointer"
            >
              Sign In / Register
            </button>
            <Link
              to="/shop"
              className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 pb-20">
      {/* Top Breadcrumb & Page Banner with Integrated Partner Profile */}
      <div className="bg-white border-b border-gray-100 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
                <Link to="/" className="hover:text-rose-600 transition">Home</Link>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                <span className="font-bold text-gray-900">Affiliate Program</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-950 flex items-center gap-2">
                <Share2 className="w-6 h-6 text-rose-600" />
                <span>Kintesi Affiliate Program</span>
              </h1>
            </div>

            {currentAffiliate && (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200/90 px-3.5 py-2 rounded-2xl shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 font-black text-sm flex items-center justify-center border border-rose-200 shrink-0">
                  {(currentAffiliate.name || 'P').charAt(0).toUpperCase()}
                </div>
                <div className="text-left leading-tight">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">{currentAffiliate.name || 'Affiliate Partner'}</span>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-mono font-black rounded-md">
                      {currentAffiliate.affiliate_code || 'KAF'}
                    </span>
                    {currentAffiliate.status === 'suspended' ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Account Suspended
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Partner
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-1">
                    <span>{currentAffiliate.phone || '-'}</span>
                    <span>•</span>
                    <span className="text-gray-700 font-medium">
                      Payout: <strong className="uppercase">{currentAffiliate.payment_method || 'bKash'}</strong> ({currentAffiliate.account_number || currentAffiliate.phone || '-'})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 space-y-5">
        
        {/* CASE 1: UNREGISTERED USER -> BALANCED 2-COLUMN REGISTRATION VIEW */}
        {!currentAffiliate ? (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Left Column: Promo & Key Benefits Card */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div 
                  className="h-full flex flex-col justify-between rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden bg-rose-600"
                  style={{
                    background: 'linear-gradient(135deg, #9f1239 0%, #e11d48 50%, #be123c 100%)',
                  }}
                >
                  {/* Decorative background glow */}
                  <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-black/15 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10 space-y-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-amber-200 border border-white/25">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Earn Up to 15% Commission
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug text-white drop-shadow-xs">
                      Share Products & Earn Daily Cash Commission!
                    </h2>
                    <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed font-medium">
                      Share product affiliate links on Facebook, WhatsApp, YouTube, or your blog. Whenever someone places an order using your referral link, receive instant cash commission directly into your account!
                    </p>
                  </div>

                  <div className="relative z-10 grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/15">
                    <div className="bg-white/15 backdrop-blur-md p-3.5 rounded-2xl border border-white/25 text-center text-white shadow-xs">
                      <p className="text-base sm:text-lg font-black text-white">0 BDT</p>
                      <p className="text-[11px] text-rose-100 font-medium mt-0.5">Free Registration</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-md p-3.5 rounded-2xl border border-white/25 text-center text-white shadow-xs">
                      <p className="text-base sm:text-lg font-black text-white">Live Tracking</p>
                      <p className="text-[11px] text-rose-100 font-medium mt-0.5">Real-time Sales</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-md p-3.5 rounded-2xl border border-white/25 text-center text-white shadow-xs">
                      <p className="text-base sm:text-lg font-black text-white">Fast Payouts</p>
                      <p className="text-[11px] text-rose-100 font-medium mt-0.5">bKash / Nagad</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Registration Card */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-rose-100 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Affiliate Partner Application
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Fill in your details below to instantly activate your partner account and generate your referral code.
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mohammad Tanvir"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-rose-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Phone Number <span className="text-rose-500">*</span>
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
                        Preferred Payout Method
                      </label>
                      <select
                        value={regMethod}
                        onChange={(e) => setRegMethod(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:border-rose-500 transition cursor-pointer"
                      >
                        <option value="bkash">bKash Personal</option>
                        <option value="nagad">Nagad Personal</option>
                        <option value="rocket">Rocket Personal</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Full Address <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Road number, Area, City, District..."
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-rose-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Payout Account Number (bKash / Nagad No)
                    </label>
                    <input
                      type="text"
                      placeholder="Number to receive withdrawal funds"
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
                      <span>Creating Account...</span>
                    ) : (
                      <>
                        <span>Join Now & Start Earning</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

            </div>
          </div>
        ) : (
          /* CASE 2: REGISTERED AFFILIATE DASHBOARD */
          <div className="space-y-5">

            {currentAffiliate.status === 'suspended' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-xs">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs sm:text-sm text-rose-950">Partner Account Suspended</h4>
                  <p className="text-xs text-rose-700 leading-relaxed font-medium">
                    Your affiliate partner account has been temporarily suspended by administration. Product referral link tracking and sales commissions are currently paused. Please contact customer support for further details.
                  </p>
                </div>
              </div>
            )}

            {/* 4 Core Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              {/* 1. Available Balance */}
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>Available Balance</span>
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
                  <span>Withdraw Funds</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* 2. Total Commission Earned */}
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>Total Commission</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">
                  {formatPrice(currentAffiliate.total_commission_earned || 0)}
                </div>
                <p className="text-[11px] text-gray-400">
                  Total Withdrawn: {formatPrice(currentAffiliate.total_withdrawn || 0)}
                </p>
              </div>

              {/* 3. Total Referral Orders */}
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>Referral Orders</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">
                  {currentAffiliate.total_orders || 0} Orders
                </div>
                <p className="text-[11px] text-gray-400">
                  Sales Volume: {formatPrice(currentAffiliate.total_sales_amount || 0)}
                </p>
              </div>

              {/* 4. Total Clicks */}
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>Total Link Clicks</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">
                  {currentAffiliate.total_clicks || 0} Clicks
                </div>
                <p className="text-[11px] text-emerald-600 font-bold">
                  Active Link Tracking
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
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>My Products & Links ({generatedProducts.length})</span>
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
                <span>Payouts & Withdrawals</span>
              </button>
            </div>

            {/* TAB CONTENT 1: SKU PRODUCT LINK GENERATOR & SAVED AFFILIATE PRODUCTS */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* 1. SEARCH BY SKU BOX */}
                <div className="bg-white rounded-3xl border border-rose-100 p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <Search className="w-4 h-4 text-rose-600" />
                      <span>Search Product by SKU & Generate Affiliate Link</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Enter a product SKU or name to check commission eligibility and generate your unique partner link.
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

                  {/* SEARCH RESULTS DISPLAY */}
                  {searchAttempted && (
                    <div className="pt-4 border-t border-gray-100">
                      {!searchedProduct ? (
                        <div className="p-6 rounded-2xl bg-gray-50 text-center space-y-2">
                          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                          <h4 className="text-sm font-bold text-gray-800">No Product Found</h4>
                          <p className="text-xs text-gray-500">
                            No product found matching "{skuQuery}". Please check the SKU or product name.
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
                                  Stock: <b className="text-gray-700">{searchedProduct.stock} pcs</b>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* CASE A: ADMIN HAS DISABLED AFFILIATE FOR THIS PRODUCT */}
                          {!searchedProduct.is_affiliate_enabled ? (
                            <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 space-y-2">
                              <div className="flex items-center gap-2 font-bold text-xs text-rose-700">
                                <AlertCircle className="w-4 h-4 text-rose-600" />
                                <span>Non-Affiliate Product</span>
                              </div>
                              <p className="text-xs text-rose-800 leading-relaxed">
                                Affiliate commission is currently disabled by admin for this specific product. Sales commission is not applicable for this item. Please search for an eligible product.
                              </p>
                            </div>
                          ) : (
                            /* CASE B: AFFILIATE IS ENABLED FOR THIS PRODUCT! */
                            <div className="space-y-4 pt-2">
                              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>Affiliate Eligible</span>
                                  </div>
                                  <p className="text-xs text-emerald-700">
                                    Commission Rate: <b className="text-emerald-900 font-extrabold">{searchedProduct.affiliate_commission_rate || 10}%</b>
                                  </p>
                                </div>
                                <div className="text-left sm:text-right bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                                  <p className="text-[10px] text-gray-500 uppercase font-bold">Your Earnings Per Sale:</p>
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

                              {/* GENERATE BUTTON OR GENERATED LINK DISPLAY */}
                              {(() => {
                                const isAlreadyGenerated = generatedProducts.some((p) => p.id === searchedProduct.id);
                                const prodLink = `${originUrl}/product/${searchedProduct.slug || searchedProduct.id}?aff=${currentAffiliate.affiliate_code}`;

                                return (
                                  <div className="space-y-3 pt-2">
                                    {!isAlreadyGenerated ? (
                                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-0.5">
                                          <p className="text-xs font-bold text-gray-800">Ready to promote this product?</p>
                                          <p className="text-[11px] text-gray-500">
                                            Click below to generate your referral link and add this product to your partner dashboard.
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleGenerateAffiliateLink(searchedProduct)}
                                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                                        >
                                          <Sparkles className="w-4 h-4 text-amber-300" />
                                          <span>Generate Affiliate Link</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                          <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Affiliate Link Generated & Active:</span>
                                          </label>
                                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                            Saved to Your Dashboard
                                          </span>
                                        </div>

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
                                                toast.success('Product affiliate link copied to clipboard!');
                                                setTimeout(() => setCopiedProductLink(false), 2500);
                                              }}
                                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                                            >
                                              {copiedProductLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                              <span>{copiedProductLink ? 'Copied' : 'Copy Link'}</span>
                                            </button>
                                            
                                            <a
                                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                                `Check this out on Kintesi: ${searchedProduct.title}\n${prodLink}`
                                              )}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                                              title="Share on WhatsApp"
                                            >
                                              WhatsApp
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* 2. DEDICATED SECTION: MY GENERATED AFFILIATE PRODUCTS */}
                <div className="bg-white rounded-3xl border border-rose-100 p-6 sm:p-8 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-rose-600" />
                        <span>My Affiliate Products</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        All products you have generated referral links for. Copy links anytime to promote and earn commission.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-rose-50 text-rose-700 rounded-full border border-rose-200 w-fit">
                      {generatedProducts.length} {generatedProducts.length === 1 ? 'Product' : 'Products'}
                    </span>
                  </div>

                  {generatedProducts.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl space-y-2">
                      <ShoppingBag className="w-9 h-9 text-gray-300 mx-auto" />
                      <h4 className="text-xs font-bold text-gray-700">No Affiliate Products Generated Yet</h4>
                      <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                        Search any product by SKU above and click <b>"Generate Affiliate Link"</b>. The product will be saved right here with your custom tracking link!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedProducts.map((p) => (
                        <div key={p.id} className="border border-gray-200/90 hover:border-rose-200 rounded-2xl p-4 bg-white hover:shadow-xs transition space-y-3 relative group">
                          <div className="flex items-start gap-3">
                            <img
                              src={p.image || '/logo.webp'}
                              alt={p.title}
                              className="w-16 h-16 object-contain rounded-xl border border-gray-100 bg-gray-50 shrink-0 p-1"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                  SKU: {p.sku}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGeneratedProduct(p.id, p.title)}
                                  className="text-gray-300 hover:text-rose-600 p-1 transition cursor-pointer"
                                  title="Remove from dashboard"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <h4 className="text-xs font-bold text-gray-900 truncate" title={p.title}>
                                {p.title}
                              </h4>
                              <div className="flex items-center gap-2 text-xs flex-wrap">
                                <span className="font-bold text-gray-900">{formatPrice(p.price)}</span>
                                <span className="text-gray-300">•</span>
                                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] border border-emerald-200">
                                  Earn {formatPrice(p.commission_amount)} ({p.commission_rate}%) / sale
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Referral Link Bar */}
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            <input
                              type="text"
                              readOnly
                              value={p.affiliate_link}
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-gray-700 select-all focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(p.affiliate_link);
                                setCopiedId(p.id);
                                toast.success('Referral link copied to clipboard!');
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 shrink-0"
                            >
                              {copiedId === p.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId === p.id ? 'Copied' : 'Copy'}</span>
                            </button>

                            <a
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                `Check this out on Kintesi: ${p.title}\n${p.affiliate_link}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center shadow-2xs shrink-0"
                              title="Share on WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </a>

                            <Link
                              to={p.slug ? `/product/${p.slug}` : `/product/${p.id}`}
                              target="_blank"
                              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition flex items-center justify-center shrink-0"
                              title="View Product Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
                      <span>Withdraw Funds</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Available Balance: <b className="text-emerald-600">{formatPrice(currentAffiliate.available_balance || 0)}</b>
                    </p>
                  </div>

                  <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Withdrawal Amount (৳) <span className="text-rose-500">*</span>
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
                      <span className="text-[10px] text-gray-400 mt-1 block">Minimum withdrawal: ৳ 50</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Payout Method <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={withdrawMethod}
                        onChange={(e) => setWithdrawMethod(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:border-rose-500 transition cursor-pointer"
                      >
                        <option value="bkash">bKash Personal</option>
                        <option value="nagad">Nagad Personal</option>
                        <option value="rocket">Rocket Personal</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Account / Wallet Number <span className="text-rose-500">*</span>
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
                        Notes / Reference (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bank branch name, account title or notes..."
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
                      {isSubmittingWithdraw ? 'Submitting Request...' : 'Submit Payout Request'}
                    </button>
                  </form>
                </div>

                {/* Withdrawal History Table */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-rose-100 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-600" />
                      <span>Payout History & Requests</span>
                    </h3>
                    <span className="text-xs text-gray-400 font-bold">{myWithdrawals.length} Records</span>
                  </div>

                  {myWithdrawals.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl p-6">
                      <Wallet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 font-bold">No payout requests submitted yet</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">You can submit a withdrawal request once your balance reaches ৳ 50.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                            <th className="pb-3 font-bold">Date</th>
                            <th className="pb-3 font-bold">Amount</th>
                            <th className="pb-3 font-bold">Method & Account</th>
                            <th className="pb-3 font-bold">Status</th>
                            <th className="pb-3 font-bold text-right">TrxID / Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {myWithdrawals.map((w) => (
                            <tr key={w.id} className="hover:bg-gray-50/50">
                              <td className="py-3 text-gray-600 font-medium">
                                {w.created_at ? (() => {
                                  try {
                                    const d = new Date(w.created_at);
                                    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-US', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    });
                                  } catch {
                                    return '-';
                                  }
                                })() : '-'}
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

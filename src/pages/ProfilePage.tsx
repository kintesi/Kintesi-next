import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAddress } from '../contexts/AddressContext';
import { useWishlist } from '../contexts/WishlistContext';
import { Address } from '../types';
import {
  User,
  MapPin,
  Plus,
  Home,
  Briefcase,
  Building2,
  Phone,
  Edit2,
  Trash2,
  CheckCircle2,
  Package,
  Heart,
  ShieldCheck,
  Crown,
  X,
  LogOut,
  ChevronRight,
  Settings,
  Globe,
  Check,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { BD_DISTRICTS, getThanasByDistrict } from '../data/bangladeshDistricts';
import { AuthModal } from '../components/auth/AuthModal';
import { useLanguage } from '../contexts/LanguageContext';

export const ProfilePage: React.FC = () => {
  const { user, profile, isAdmin, isSuperAdmin, signOut, updateUserProfile } = useAuth();
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddress();
  const { wishlist } = useWishlist();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSignOut = async () => {
    await signOut();
    toast.success(t('toast.logoutSuccess'));
    navigate('/');
  };

  const initialTab = (searchParams.get('tab') as 'addresses' | 'profile' | 'settings') || 'addresses';
  const [activeTab, setActiveTab] = useState<'addresses' | 'profile' | 'settings'>(
    ['addresses', 'profile', 'settings'].includes(initialTab) ? initialTab : 'addresses'
  );

  const handleTabChange = (tab: 'addresses' | 'profile' | 'settings') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Personal Info Form State
  const [personalName, setPersonalName] = useState(profile?.full_name || '');
  const [personalPhone, setPersonalPhone] = useState(profile?.phone || '');
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);

  React.useEffect(() => {
    if (profile) {
      if (profile.full_name) setPersonalName(profile.full_name);
      if (profile.phone) setPersonalPhone(profile.phone);
    }
  }, [profile]);

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalName.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    setIsSavingPersonal(true);
    try {
      await updateUserProfile({
        full_name: personalName.trim(),
        phone: personalPhone.trim(),
      });
      toast.success('Personal information updated successfully!');
    } catch {
      toast.error('Failed to update personal info.');
    } finally {
      setIsSavingPersonal(false);
    }
  };

  // Address form state
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    recipient_name: '',
    phone: '',
    street_address: '',
    city: 'Dhaka',
    thana: '',
    customThana: '',
    isCustomThana: false,
    postal_code: '',
    is_default: false,
  });

  const handleOpenAdd = () => {
    if (!user) {
      toast.error('An account is required to add or save addresses. Please sign in.');
      setIsAuthModalOpen(true);
      return;
    }

    setEditingAddress(null);
    setAddressForm({
      label: 'Home',
      recipient_name: '',
      phone: '',
      street_address: '',
      city: 'Dhaka',
      thana: '',
      customThana: '',
      isCustomThana: false,
      postal_code: '',
      is_default: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingAddress(addr);
    const rawCity = addr.city || 'Dhaka';
    const thanaMatch = rawCity.match(/\((.*?)\)/);
    const districtName = rawCity.replace(/\s*\(.*?\)/, '').trim() || 'Dhaka';
    const thanaName = thanaMatch ? thanaMatch[1].trim() : '';

    setAddressForm({
      label: addr.label,
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      street_address: addr.street_address,
      city: districtName,
      thana: thanaName,
      customThana: '',
      isCustomThana: false,
      postal_code: addr.postal_code || '',
      is_default: addr.is_default,
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('An account is required to save an address. Please log in.');
      setIsAuthModalOpen(true);
      return;
    }

    if (!addressForm.recipient_name.trim()) {
      toast.error('Recipient name is required');
      return;
    }
    if (!addressForm.phone.trim()) {
      toast.error('Contact phone number is required');
      return;
    }
    if (!addressForm.street_address.trim()) {
      toast.error('Street/delivery address is required');
      return;
    }

    const finalThana = addressForm.isCustomThana ? addressForm.customThana : addressForm.thana;
    const finalCity = finalThana
      ? `${addressForm.city} (${finalThana})`
      : addressForm.city;

    const payload = {
      label: addressForm.label,
      recipient_name: addressForm.recipient_name.trim(),
      phone: addressForm.phone.trim(),
      street_address: addressForm.street_address.trim(),
      city: finalCity,
      postal_code: addressForm.postal_code.trim(),
      is_default: addressForm.is_default,
    };

    if (editingAddress) {
      await updateAddress(editingAddress.id, payload);
    } else {
      await addAddress(payload);
    }
    setIsAddressModalOpen(false);
  };

  const getLabelIcon = (label: string) => {
    if (label.toLowerCase() === 'home') return <Home className="w-4 h-4 text-rose-600" />;
    if (label.toLowerCase() === 'office') return <Briefcase className="w-4 h-4 text-rose-600" />;
    return <Building2 className="w-4 h-4 text-rose-600" />;
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <MapPin className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t('profile.signInRequired')}</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            {t('profile.signInDesc')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-sm active:scale-95 cursor-pointer"
          >
            {t('profile.signInBtn')}
          </button>
          <Link
            to="/shop"
            className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
          >
            {t('cart.continue')}
          </Link>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      
      {/* Profile Header Card - Minimal & Radish Branded */}
      <div className="bg-white rounded-3xl border border-gray-100/90 shadow-[0_4px_24px_rgba(225,29,72,0.04)] p-5 sm:p-7 space-y-6">
        
        {/* Top Info Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                <img
                  src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                  alt="Avatar"
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover ring-4 ring-rose-50 border border-rose-200/80 shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-rose-600 text-white ring-4 ring-rose-50 flex items-center justify-center font-black text-2xl shadow-xs">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  {profile?.full_name || user?.email?.split('@')[0] || t('profile.title')}
                </h1>
                {isSuperAdmin ? (
                  <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
                    <Crown className="w-3 h-3 text-rose-600" /> Master Admin
                  </span>
                ) : isAdmin ? (
                  <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-rose-600" /> Staff Admin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-[10px] font-semibold uppercase tracking-wider">
                    Member
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium">
                <span>{user?.email}</span>
                {profile?.phone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <Phone className="w-3 h-3 text-rose-500" />
                      {profile.phone}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Single, Clear Sign Out Action */}
          <button
            onClick={handleSignOut}
            className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200/80 rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0 active:scale-95"
            title={t('profile.logout')}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('profile.logout')}</span>
          </button>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <Link
            to="/orders"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/70 hover:bg-rose-50/40 border border-gray-100 hover:border-rose-200 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200/80 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition shadow-xs">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-rose-600 transition">{t('profile.orders')}</h4>
                <p className="text-[11px] text-gray-400">
                  {language === 'bn' ? 'চলমান অর্ডার ও রশিদ চেক করুন' : 'Track current orders & past receipts'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition" />
          </Link>

          <Link
            to="/wishlist"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/70 hover:bg-rose-50/40 border border-gray-100 hover:border-rose-200 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200/80 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition shadow-xs">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-rose-600 transition">{t('nav.wishlist')}</h4>
                <p className="text-[11px] text-gray-400">
                  {wishlist.length} {language === 'bn' ? 'টি সংরক্ষিত পণ্য' : `saved item${wishlist.length === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

      </div>

      {/* Segmented Tab Navigation - Centered & Radish Active */}
      <div className="flex justify-center">
        <div className="grid grid-cols-3 p-1 bg-gray-100/90 rounded-2xl border border-gray-200/60 w-full max-w-md">
          <button
            onClick={() => handleTabChange('addresses')}
            className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'addresses'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{t('profile.addresses')}</span>
            <span
              className={`hidden sm:inline-block px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'addresses' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {addresses.length}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('profile')}
            className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="truncate">{t('profile.personalInfo')}</span>
          </button>
          <button
            onClick={() => handleTabChange('settings')}
            className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="truncate">{t('profile.settings')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'addresses' && (
        <div className="space-y-4">
          
          {/* If No Addresses Exist: Single Clean Empty State with ONE Button */}
          {addresses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <MapPin className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">{t('profile.noAddresses')}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {language === 'bn' 
                    ? 'দ্রুত ও সহজে অর্ডার সম্পন্ন করতে আপনার ডেলিভারি ঠিকানা যোগ করুন।'
                    : 'Add your shipping location to enable 1-click expedited checkout on your future orders.'}
                </p>
              </div>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('profile.addAddress')}</span>
              </button>
            </div>
          ) : (
            /* When Addresses Exist: Show Header with Single Button + Responsive Cards Grid */
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 px-1">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">{t('profile.addresses')}</h2>
                  <p className="text-xs text-gray-500">
                    {language === 'bn' 
                      ? 'দ্রুত চেকআউটের জন্য আপনার শিপিং ঠিকানাগুলো পরিচালনা করুন'
                      : 'Manage shipping addresses for swift checkout'}
                  </p>
                </div>
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('profile.addAddress')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-white rounded-2xl border p-5 space-y-3 relative flex flex-col justify-between transition-all ${
                      addr.is_default
                        ? 'border-rose-400 ring-2 ring-rose-500/10 shadow-xs'
                        : 'border-gray-200/90 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600 border border-rose-100">
                            {getLabelIcon(addr.label)}
                          </div>
                          <span className="font-bold text-gray-900 text-xs tracking-tight">{addr.label}</span>
                        </div>

                        {addr.is_default && (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3 text-rose-600" /> {t('profile.defaultBadge')}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-xs text-gray-600">
                        <p className="font-bold text-gray-900 text-sm">{addr.recipient_name}</p>
                        <p className="flex items-center gap-1.5 text-gray-500 font-medium">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{addr.phone}</span>
                        </p>
                        <p className="flex items-start gap-1.5 text-gray-600 pt-0.5 leading-relaxed">
                          <MapPin className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                          <span>{addr.street_address}, {addr.city} {addr.postal_code}</span>
                        </p>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      {!addr.is_default ? (
                        <button
                          onClick={() => setDefaultAddress(addr.id)}
                          className="text-xs text-rose-600 hover:text-rose-700 font-bold transition hover:underline cursor-pointer"
                        >
                          {t('profile.setDefault')}
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700">
                          {language === 'bn' ? 'প্রধান ঠিকানা' : 'Primary Delivery'}
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(addr)}
                          className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-lg transition cursor-pointer"
                          title={t('profile.edit')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteAddress(addr.id)}
                          className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                          title={t('profile.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Personal Details Tab - Clean & Minimal */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSavePersonalInfo}
          className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-6 sm:p-7 space-y-5 max-w-xl mx-auto"
        >
          <div>
            <h2 className="text-base font-bold text-gray-900">{t('profile.personalInfo')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {language === 'bn' 
                ? 'আপনার ব্যক্তিগত বিবরণ ও মোবাইল নম্বর পরিচালনা করুন'
                : 'Manage your personal details and contact number'}
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                {t('profile.fullName')} *
              </label>
              <input
                type="text"
                required
                value={personalName}
                onChange={(e) => setPersonalName(e.target.value)}
                placeholder={language === 'bn' ? 'আপনার পুরো নাম' : 'Your full name'}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                {t('profile.phone')}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={personalPhone}
                  onChange={(e) => setPersonalPhone(e.target.value)}
                  placeholder="e.g. 01700000000"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
                />
                <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {language === 'bn'
                  ? 'অর্ডার ট্র্যাকিং, কুরিয়ার ডেলিভারি ও SMS নোটিফিকেশনের জন্য ব্যবহৃত হবে।'
                  : 'Used for order tracking, courier delivery, and SMS alerts.'}
              </p>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                {t('profile.email')}
              </label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                readOnly
                disabled
                className="w-full px-3.5 py-2.5 bg-gray-100/80 border border-gray-200 rounded-xl font-medium text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingPersonal}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              {isSavingPersonal ? t('profile.saving') : t('profile.saveInfo')}
            </button>
          </div>
        </form>
      )}

      {/* Settings Tab - Dedicated Language & Preferences */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-6 sm:p-7 space-y-6 max-w-xl mx-auto">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-rose-600" />
              <span>{t('profile.languageSetting')}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('profile.languageDesc')}
            </p>
          </div>

          {/* Language Switcher Options */}
          <div className="space-y-3">
            <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px]">
              {t('profile.languageLabel')}
            </label>

            {/* Option 1: English (Main) */}
            <div
              onClick={() => {
                if (language !== 'en') {
                  setLanguage('en');
                  toast.success('Language set to English');
                }
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                language === 'en'
                  ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/10 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition ${
                    language === 'en'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  EN
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">English</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Browse the entire store in English
                  </p>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition shrink-0 ${
                  language === 'en'
                    ? 'border-rose-600 bg-rose-600 text-white shadow-xs'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {language === 'en' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Option 2: বাংলা */}
            <div
              onClick={() => {
                if (language !== 'bn') {
                  setLanguage('bn');
                  toast.success('ভাষা বাংলায় পরিবর্তিত হয়েছে');
                }
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                language === 'bn'
                  ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/10 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition ${
                    language === 'bn'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  বাং
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">বাংলা</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    সম্পূর্ণ ওয়েবসাইট বাংলায় ব্রাউজ করুন
                  </p>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition shrink-0 ${
                  language === 'bn'
                    ? 'border-rose-600 bg-rose-600 text-white shadow-xs'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {language === 'bn' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* Regional Currency Information */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px]">
              {t('profile.currencyLabel')}
            </label>
            <div className="p-3.5 bg-gray-50/90 border border-gray-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-rose-600 text-sm shadow-xs">
                  ৳
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">{t('profile.currencyDesc')}</p>
                  <p className="text-[11px] text-gray-400">
                    {language === 'bn'
                      ? 'বাংলাদেশের ৬৪ জেলায় হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি'
                      : 'Standardized pricing with nationwide express courier'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Address Modal - Radish Themed */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl border border-gray-100 animate-slide-up overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {editingAddress 
                      ? (language === 'bn' ? 'ঠিকানা সম্পাদনা করুন' : 'Edit Delivery Address')
                      : t('profile.addAddress')}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {language === 'bn' ? 'দ্রুত চেকআউটের জন্য সংরক্ষণ করুন' : 'Save for quick 1-click checkout'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form id="address-modal-form" onSubmit={handleSaveAddress} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              
              {/* Address Label Pills */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Address Label
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Home', icon: Home },
                    { id: 'Office', icon: Briefcase },
                    { id: 'Other', icon: Building2 },
                  ].map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, label: id })}
                      className={`py-2 px-3 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        addressForm.label === id
                          ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.recipient_name}
                    onChange={(e) => setAddressForm({ ...addressForm, recipient_name: e.target.value })}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="e.g. 01700000000"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Street Address (House, Road, Area) *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.street_address}
                  onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
                  placeholder="e.g. House 12, Road 4, Sector 7, Area name"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white transition"
                />
              </div>

              {/* District & Thana */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    District (64 Districts) *
                  </label>
                  <select
                    value={addressForm.city}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      const thanasList = getThanasByDistrict(newCity);
                      setAddressForm({
                        ...addressForm,
                        city: newCity,
                        thana: thanasList.length > 0 ? thanasList[0] : '',
                        isCustomThana: thanasList.length === 0,
                        customThana: '',
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white text-xs transition"
                  >
                    <option value="Dhaka">Dhaka (ঢাকা)</option>
                    {['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'].map((div) => {
                      const districtsInDiv = BD_DISTRICTS.filter((d) => d.division === div && d.name !== 'Dhaka');
                      return (
                        <optgroup key={div} label={`── ${div} Division ──`}>
                          {districtsInDiv.map((d) => (
                            <option key={d.name} value={d.name}>
                              {d.name} ({d.bnName})
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                {/* Thana / Upazila */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                      Thana / Upazila *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setAddressForm({ ...addressForm, isCustomThana: !addressForm.isCustomThana })
                      }
                      className="text-[10px] text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
                    >
                      {addressForm.isCustomThana ? 'From List' : '+ Type'}
                    </button>
                  </div>

                  {addressForm.isCustomThana ? (
                    <input
                      type="text"
                      required
                      value={addressForm.customThana}
                      onChange={(e) => setAddressForm({ ...addressForm, customThana: e.target.value })}
                      placeholder="Type Thana / Union..."
                      className="w-full px-3.5 py-2.5 bg-rose-50/50 border border-rose-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                  ) : (
                    <select
                      value={addressForm.thana}
                      onChange={(e) => {
                        if (e.target.value === '__OTHER__') {
                          setAddressForm({ ...addressForm, isCustomThana: true, customThana: '' });
                        } else {
                          setAddressForm({ ...addressForm, thana: e.target.value });
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white text-xs transition"
                    >
                      {getThanasByDistrict(addressForm.city).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                      <option value="__OTHER__">➕ Other / Missing Thana</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Postal Code & Default Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Postal Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={addressForm.postal_code}
                    onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                    placeholder="e.g. 1230"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white transition"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4 sm:pt-4">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={addressForm.is_default}
                    onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                    className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                  />
                  <label htmlFor="is_default" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Set as default address
                  </label>
                </div>
              </div>

            </form>

            {/* Modal Sticky Footer */}
            <div className="p-4 sm:p-5 bg-gray-50/90 border-t border-gray-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="px-4 py-2.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {t('wishlist.cancel')}
              </button>
              <button
                type="submit"
                form="address-modal-form"
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 active:scale-95 transition cursor-pointer"
              >
                {language === 'bn' ? 'ঠিকানা সংরক্ষণ করুন' : 'Save Address'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

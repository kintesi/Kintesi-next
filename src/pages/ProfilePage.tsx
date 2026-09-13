import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAddress } from '../contexts/AddressContext';
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
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BD_DISTRICTS, getThanasByDistrict } from '../data/bangladeshDistricts';
import { AuthModal } from '../components/auth/AuthModal';

export const ProfilePage: React.FC = () => {
  const { user, profile, isAdmin, isSuperAdmin, signOut } = useAuth();
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddress();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Successfully logged out.');
    navigate('/');
  };

  const [activeTab, setActiveTab] = useState<'addresses' | 'profile'>('addresses');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Address form state (starts completely clean)
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
    if (label.toLowerCase() === 'home') return <Home className="w-4 h-4 text-emerald-600" />;
    if (label.toLowerCase() === 'office') return <Briefcase className="w-4 h-4 text-blue-600" />;
    return <Building2 className="w-4 h-4 text-purple-600" />;
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <MapPin className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Sign In to View Address Book</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            Sign in to access and manage your saved delivery addresses, orders, and personal details.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs transition shadow-xs active:scale-95 cursor-pointer"
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
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Profile Summary Card - Minimal & Clean */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5 relative z-10">
          <div className="relative shrink-0">
            {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
              <img
                src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                alt="Avatar"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-gray-50 border border-gray-200/80 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-900 text-white ring-4 ring-gray-50 flex items-center justify-center font-black text-2xl shadow-xs">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {profile?.full_name || user?.email?.split('@')[0] || 'My Account'}
              </h1>
              {isSuperAdmin ? (
                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full text-[10px] font-black flex items-center gap-1 uppercase tracking-wider">
                  <Crown className="w-3 h-3 text-amber-600" /> Master Admin
                </span>
              ) : isAdmin ? (
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-[10px] font-black flex items-center gap-1 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Staff Admin
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Customer
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium">{user?.email || 'Logged in'}</p>
            
            <div className="flex items-center gap-2 pt-2">
              <Link
                to="/orders"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200/60 transition"
              >
                <Package className="w-3.5 h-3.5 text-gray-500" />
                <span>My Orders</span>
              </Link>
              <Link
                to="/wishlist"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200/60 transition"
              >
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Wishlist</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions & Logout */}
        <div className="flex items-center gap-2 self-start md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/60 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            title="Log Out of your account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Segmented Tab Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-4">
        <div className="flex items-center gap-1.5 bg-gray-100/80 p-1.5 rounded-2xl w-fit border border-gray-200/40">
          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'addresses'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Address Book</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'addresses' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {addresses.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal Info</span>
          </button>
        </div>

        {activeTab === 'addresses' && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer self-stretch sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Address</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      {activeTab === 'addresses' ? (
        <div className="space-y-6">
          {addresses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-10 sm:p-14 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <MapPin className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">No Saved Delivery Addresses</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Save your home or office address now to speed up checkout on your future purchases across Bangladesh.
                </p>
              </div>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Address</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 space-y-4 relative flex flex-col justify-between transition-all ${
                    addr.is_default
                      ? 'border-emerald-500/70 ring-1 ring-emerald-500/20 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-50 rounded-lg text-gray-700 border border-gray-100">
                          {getLabelIcon(addr.label)}
                        </div>
                        <span className="font-bold text-gray-900 text-xs tracking-tight">{addr.label}</span>
                      </div>

                      {addr.is_default && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Default
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600">
                      <p className="font-bold text-gray-900 text-sm">{addr.recipient_name}</p>
                      <p className="flex items-center gap-1.5 text-gray-500 font-medium">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{addr.phone}</span>
                      </p>
                      <p className="flex items-start gap-1.5 text-gray-600 pt-1 leading-relaxed">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{addr.street_address}, {addr.city} {addr.postal_code}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
                    {!addr.is_default ? (
                      <button
                        onClick={() => setDefaultAddress(addr.id)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition hover:underline cursor-pointer"
                      >
                        Set as Default
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700/80">Primary Address</span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(addr)}
                        className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-lg transition cursor-pointer"
                        title="Edit address"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteAddress(addr.id)}
                        className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        title="Delete address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Profile Details Tab */
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm max-w-2xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
            <p className="text-xs text-gray-500 mt-0.5">Your personal credentials synced with your profile</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider text-[11px] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                defaultValue={profile?.full_name || ''}
                readOnly
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider text-[11px] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                readOnly
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-500 leading-relaxed">
            Account verified via <strong className="text-gray-800">{user?.app_metadata?.provider || 'Google OAuth / Firebase'}</strong>. All saved addresses and orders are encrypted and bound to this identity.
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Account Session</h4>
              <p className="text-xs text-gray-400">Sign out of your account on this browser</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer border border-rose-200/50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Address Modal (Ultra Optimized) */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl border border-gray-100 animate-slide-up overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    {editingAddress ? 'Edit Delivery Address' : 'Add New Address'}
                  </h3>
                  <p className="text-[11px] text-gray-400">Save for quick 1-click checkout</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full transition"
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
                      className={`py-2 px-3 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition ${
                        addressForm.label === id
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-400 shadow-xs'
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
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
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
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
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
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
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
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs transition"
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
                      className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold underline"
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
                      className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-400 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
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
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs transition"
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
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4 sm:pt-4">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={addressForm.is_default}
                    onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
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
                className="px-4 py-2.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="address-modal-form"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 active:scale-95 transition"
              >
                Save Address
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

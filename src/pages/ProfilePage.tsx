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
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BD_DISTRICTS, getThanasByDistrict } from '../data/bangladeshDistricts';
import { AuthModal } from '../components/auth/AuthModal';

export const ProfilePage: React.FC = () => {
  const { user, profile, isAdmin, isSuperAdmin, signOut } = useAuth();
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddress();
  const { wishlist } = useWishlist();
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
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Sign In to Your Account</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            Please sign in to access your profile, track your orders, and manage saved delivery addresses.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsAuthModalOpen(true)}
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
                  {profile?.full_name || user?.email?.split('@')[0] || 'My Account'}
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
              <p className="text-xs text-gray-500 font-medium">{user?.email}</p>
            </div>
          </div>

          {/* Single, Clear Sign Out Action */}
          <button
            onClick={handleSignOut}
            className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200/80 rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0 active:scale-95"
            title="Log Out of your account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
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
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-rose-600 transition">My Orders</h4>
                <p className="text-[11px] text-gray-400">Track current orders & past receipts</p>
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
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-rose-600 transition">Wishlist</h4>
                <p className="text-[11px] text-gray-400">{wishlist.length} saved item{wishlist.length === 1 ? '' : 's'}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

      </div>

      {/* Segmented Tab Navigation - Centered & Radish Active */}
      <div className="flex justify-center">
        <div className="grid grid-cols-2 p-1 bg-gray-100/90 rounded-2xl border border-gray-200/60 w-full max-w-sm">
          <button
            onClick={() => setActiveTab('addresses')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'addresses'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Address Book</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'addresses' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {addresses.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal Info</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'addresses' ? (
        <div className="space-y-4">
          
          {/* If No Addresses Exist: Single Clean Empty State with ONE Button */}
          {addresses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <MapPin className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">No Saved Delivery Address</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Add your shipping location to enable 1-click expedited checkout on your future orders.
                </p>
              </div>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Delivery Address</span>
              </button>
            </div>
          ) : (
            /* When Addresses Exist: Show Header with Single Button + Responsive Cards Grid */
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 px-1">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Delivery Addresses</h2>
                  <p className="text-xs text-gray-500">Manage shipping addresses for swift checkout</p>
                </div>
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Address</span>
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
                            <CheckCircle2 className="w-3 h-3 text-rose-600" /> Default
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
                          Set as Default
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700">Primary Delivery</span>
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
            </div>
          )}
        </div>
      ) : (
        /* Personal Details Tab - Clean & Minimal */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-6 sm:p-7 space-y-5 max-w-xl mx-auto">
          <div>
            <h2 className="text-base font-bold text-gray-900">Personal Information</h2>
            <p className="text-xs text-gray-500 mt-0.5">Your credentials synced with your profile</p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                Full Name
              </label>
              <input
                type="text"
                defaultValue={profile?.full_name || ''}
                readOnly
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                Email Address
              </label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                readOnly
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 text-xs text-rose-900/80 leading-relaxed">
            Account verified via <strong>{user?.app_metadata?.provider || 'Google OAuth / Firebase'}</strong>. All orders and saved addresses are safely encrypted and synced.
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
                    {editingAddress ? 'Edit Delivery Address' : 'Add New Address'}
                  </h3>
                  <p className="text-[11px] text-gray-400">Save for quick 1-click checkout</p>
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
                Cancel
              </button>
              <button
                type="submit"
                form="address-modal-form"
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 active:scale-95 transition cursor-pointer"
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

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

    const validThanas = getThanasByDistrict(districtName);
    const isKnownThana = validThanas.includes(thanaName);

    setAddressForm({
      label: addr.label,
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      street_address: addr.street_address,
      city: districtName,
      thana: isKnownThana ? thanaName : (validThanas[0] || ''),
      customThana: !isKnownThana && thanaName ? thanaName : '',
      isCustomThana: !isKnownThana && !!thanaName,
      postal_code: addr.postal_code || '',
      is_default: addr.is_default,
    });
    setIsAddressModalOpen(true);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.recipient_name || !addressForm.phone || !addressForm.street_address) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedThana = addressForm.isCustomThana ? addressForm.customThana.trim() : addressForm.thana;
    const finalAddressPayload = {
      label: addressForm.label,
      recipient_name: addressForm.recipient_name,
      phone: addressForm.phone,
      street_address: addressForm.street_address,
      city: `${addressForm.city}${selectedThana ? ` (${selectedThana})` : ''}`,
      postal_code: addressForm.postal_code,
      is_default: addressForm.is_default,
    };

    if (editingAddress) {
      await updateAddress(editingAddress.id, finalAddressPayload);
    } else {
      await addAddress(finalAddressPayload);
    }
    setIsAddressModalOpen(false);
  };

  const getLabelIcon = (label: string) => {
    if (label.toLowerCase() === 'home') return <Home className="w-4 h-4 text-emerald-600" />;
    if (label.toLowerCase() === 'office') return <Briefcase className="w-4 h-4 text-blue-600" />;
    return <Building2 className="w-4 h-4 text-purple-600" />;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      
      {/* Profile Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5 relative z-10">
          {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
            <img
              src={profile?.avatar_url || user?.user_metadata?.avatar_url}
              alt="Avatar"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-black text-2xl">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">{profile?.full_name || user?.email?.split('@')[0] || 'User Profile'}</h1>
              {isSuperAdmin ? (
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-extrabold flex items-center gap-1 uppercase shadow-xs">
                  <Crown className="w-3 h-3 text-amber-300" /> Master Admin (Owner)
                </span>
              ) : isAdmin ? (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-extrabold flex items-center gap-1 uppercase">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              ) : null}
            </div>
            <p className="text-xs text-gray-400 mt-1">{user?.email || 'Guest User'}</p>
            <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-gray-300">
              <Link to="/orders" className="flex items-center gap-1.5 hover:text-emerald-400 transition">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>My Orders</span>
              </Link>
              <span>•</span>
              <Link to="/wishlist" className="flex items-center gap-1.5 hover:text-rose-400 transition">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Wishlist</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Toggle & Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center relative z-10">
          <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md text-xs font-bold">
            <button
              onClick={() => setActiveTab('addresses')}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === 'addresses'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Address Book ({addresses.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === 'profile'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Account Details
            </button>
          </div>

          <button
            onClick={handleSignOut}
            className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-rose-200 border border-rose-500/40 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Log Out of your account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'addresses' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Saved Delivery Addresses</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage your shipping addresses for 1-click expedited checkout
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-emerald-600/30 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>

          {/* Addresses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-white rounded-3xl border p-6 space-y-4 relative flex flex-col justify-between transition ${
                  addr.is_default
                    ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                    : 'border-gray-200/80 hover:border-gray-300 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-100 rounded-xl">
                        {getLabelIcon(addr.label)}
                      </div>
                      <span className="font-extrabold text-gray-900 text-sm">{addr.label}</span>
                    </div>

                    {addr.is_default && (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full flex items-center gap-1 uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-gray-600">
                    <p className="font-bold text-gray-900 text-sm">{addr.recipient_name}</p>
                    <p className="flex items-center gap-1.5 text-gray-500">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{addr.phone}</span>
                    </p>
                    <p className="flex items-start gap-1.5 text-gray-600 pt-1 leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{addr.street_address}, {addr.city} {addr.postal_code}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                  {!addr.is_default ? (
                    <button
                      onClick={() => setDefaultAddress(addr.id)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-bold"
                    >
                      Set as Default
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-gray-400">Primary Address</span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(addr)}
                      className="p-2 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-xl transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteAddress(addr.id)}
                      className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Profile Details Tab */
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm max-w-2xl space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                defaultValue={profile?.full_name || ''}
                readOnly
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">Email</label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                readOnly
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Account logged in via {user?.app_metadata?.provider || 'Google OAuth'}. All orders and saved addresses are safely synced to your account.
          </p>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Account Session</h4>
              <p className="text-xs text-gray-400">Sign out of your account on this device</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-2xl text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
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
            <form id="address-modal-form" onSubmit={handleAddressSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              
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

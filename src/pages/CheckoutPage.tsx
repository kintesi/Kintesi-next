import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useAddress } from '../contexts/AddressContext';
import { useSettings } from '../contexts/SettingsContext';
import { useCoupons } from '../contexts/CouponContext';
import { supabase } from '../lib/supabase';
import { saveOrderToDB } from '../lib/dbService';
import { formatPrice, generateOrderNumber } from '../lib/utils';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Phone,
  MapPin,
  User,
  Mail,
  Lock,
  Plus,
  Home,
  Briefcase,
  Building2,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  Sparkles,
  Landmark,
  Copy,
  Check,
} from 'lucide-react';
import { BkashLogo, NagadLogo, RocketLogo, VisaLogo, MastercardLogo } from '../components/common/PaymentLogos';
import { AuthModal } from '../components/auth/AuthModal';
import { toast } from 'sonner';
import { BD_DISTRICTS, getThanasByDistrict } from '../data/bangladeshDistricts';

export const CheckoutPage: React.FC = () => {
  const { cart, subtotal, discountAmount, shippingFee, total, appliedCoupon, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { addresses, defaultAddress, addAddress } = useAddress();
  const { settings } = useSettings();
  const { recordCouponUsage } = useCoupons();
  const navigate = useNavigate();

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Form State
  const [name, setName] = useState(defaultAddress?.recipient_name || '');
  const [phone, setPhone] = useState(defaultAddress?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(defaultAddress?.street_address || '');
  const [city, setCity] = useState(defaultAddress?.city || 'Dhaka');
  const [thana, setThana] = useState('');
  const [customThana, setCustomThana] = useState('');
  const [isCustomThana, setIsCustomThana] = useState(false);
  const [postalCode, setPostalCode] = useState(defaultAddress?.postal_code || '');
  const [customerNote, setCustomerNote] = useState('');
  const [saveToAddressBook, setSaveToAddressBook] = useState(true);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'rocket' | 'card' | 'bank'>('cod');
  const [trxId, setTrxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => {
      setCopiedField((prev) => (prev === label ? null : prev));
    }, 2500);
  };

  const applyAddressData = (addr: any) => {
    if (!addr) return;
    setName(addr.recipient_name || '');
    setPhone(addr.phone || '');
    setAddress(addr.street_address || '');

    const rawCity = addr.city || 'Dhaka';
    const thanaMatch = rawCity.match(/\((.*?)\)/);
    const districtName = rawCity.replace(/\s*\(.*?\)/, '').trim() || 'Dhaka';
    const thanaName = thanaMatch ? thanaMatch[1].trim() : '';

    setCity(districtName);
    const validThanas = getThanasByDistrict(districtName);
    if (thanaName && validThanas.includes(thanaName)) {
      setThana(thanaName);
      setIsCustomThana(false);
      setCustomThana('');
    } else if (thanaName) {
      setIsCustomThana(true);
      setCustomThana(thanaName);
    } else {
      setThana(validThanas[0] || '');
      setIsCustomThana(validThanas.length === 0);
      setCustomThana('');
    }

    setPostalCode(addr.postal_code || '');
  };

  useEffect(() => {
    if (defaultAddress && !selectedAddressId) {
      setSelectedAddressId(defaultAddress.id);
      applyAddressData(defaultAddress);
    }
  }, [defaultAddress]);

  const handleSelectSavedAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    setIsAddingNewAddress(false);
    const chosen = addresses.find((a) => a.id === addrId);
    if (chosen) {
      applyAddressData(chosen);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-md">
          <Lock className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900">Account Required for Checkout</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            অর্ডার নিশ্চিত করতে ও চেকআউট সম্পন্ন করতে অনুগ্রহ করে আপনার Kintesi অ্যাকাউন্টে লগইন করুন বা সাইন আপ করুন।
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsAuthOpen(true)}
            className="w-full sm:w-auto px-7 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition shadow-lg shadow-rose-600/25 active:scale-95 cursor-pointer"
          >
            লগইন / রেজিস্টার করুন (Sign In / Register)
          </button>
          <Link
            to="/shop"
            className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
          >
            Continue Shopping
          </Link>
        </div>
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-6">Add items to cart before proceeding to checkout.</p>
        <Link to="/shop" className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl">
          Go to Shop
        </Link>
      </div>
    );
  }

  // Dynamic Shipping Fee based on City (Inside Dhaka ৳60, Outside Dhaka ৳120)
  const isInsideDhaka = city.trim().toLowerCase() === 'dhaka';
  const dynamicShippingFee =
    subtotal === 0
      ? 0
      : subtotal >= (settings.freeShippingThreshold || 5000)
      ? 0
      : isInsideDhaka
      ? Number(settings.deliveryFeeInsideDhaka) || 60
      : Number(settings.deliveryFeeOutsideDhaka) || 120;

  const dynamicTotal = Math.max(0, subtotal - discountAmount + dynamicShippingFee);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthOpen(true);
      toast.error('Please sign in or create an account to place your order.');
      return;
    }
    if (!name || !email || !phone || !address || !city) {
      toast.error('Please fill in all required shipping fields');
      return;
    }

    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'rocket' || paymentMethod === 'bank' || paymentMethod === 'card') && !trxId.trim()) {
      toast.error(
        paymentMethod === 'bank'
          ? 'Please enter your Bank Deposit/Transfer Transaction Ref or Sender Account'
          : paymentMethod === 'card'
          ? 'Please enter your Online Card Payment Transaction ID / Ref'
          : `Please enter your ${paymentMethod.toUpperCase()} Transaction ID (TrxID)`
      );
      return;
    }

    setLoading(true);

    if (user && isAddingNewAddress && saveToAddressBook) {
      addAddress({
        label: 'Other',
        recipient_name: name,
        phone: phone,
        street_address: address,
        city: city,
        postal_code: postalCode,
        is_default: addresses.length === 0,
      });
    }

    const orderNumber = generateOrderNumber();
    const selectedThanaName = isCustomThana ? customThana.trim() : thana;
    const completeShippingAddress = selectedThanaName 
      ? `${address.trim()}, Thana: ${selectedThanaName}`
      : address.trim();

    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      title: item.product.title,
      price: item.product.discount_price || item.product.price,
      quantity: item.quantity,
      image: item.product.images[0] || '',
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
    }));

    const orderData: any = {
      order_number: orderNumber,
      user_id: user?.id || null,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      shipping_address: completeShippingAddress,
      city: `${city}${selectedThanaName ? ` (${selectedThanaName})` : ''}`,
      postal_code: postalCode,
      items: orderItems,
      subtotal: subtotal,
      shipping_cost: dynamicShippingFee,
      discount: discountAmount,
      total_amount: dynamicTotal,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
      order_status: 'pending',
      transaction_id: trxId.trim() || null,
      seller_payment_snapshot: {},
      customer_note: customerNote + (trxId ? ` | TrxID: ${trxId}` : ''),
    };

    try {
      const { data, error } = await supabase.from('orders').insert([orderData]).select().single();

      if (error) {
        console.warn('Supabase order insert notice, retrying core fields:', error.message);
        // Fallback retry
        const coreOrder = {
          order_number: orderNumber,
          user_id: user?.id || null,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          shipping_address: completeShippingAddress,
          city: `${city}${selectedThanaName ? ` (${selectedThanaName})` : ''}`,
          postal_code: postalCode,
          items: orderItems,
          subtotal: subtotal,
          shipping_cost: dynamicShippingFee,
          discount: discountAmount,
          total_amount: dynamicTotal,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
          order_status: 'pending',
          customer_note: orderData.customer_note,
        };
        const { error: retryErr } = await supabase.from('orders').insert([coreOrder]);
        if (retryErr) {
          console.error('Supabase retry insert notice:', retryErr.message);
        }
      }

      // Sync local cache and Firestore
      const existingOrders = JSON.parse(localStorage.getItem('kintesi_guest_orders') || '[]');
      const savedOrder = { ...orderData, id: orderNumber, created_at: new Date().toISOString() };
      localStorage.setItem('kintesi_guest_orders', JSON.stringify([savedOrder, ...existingOrders]));
      await saveOrderToDB(savedOrder);

      // Automatically reduce product stock count on sale
      for (const cartItem of cart) {
        try {
          const { data: prodRecord } = await supabase
            .from('products')
            .select('stock')
            .eq('id', cartItem.product.id)
            .single();

          const currentStock = prodRecord ? prodRecord.stock : cartItem.product.stock;
          const newStock = Math.max(0, currentStock - cartItem.quantity);

          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', cartItem.product.id);
        } catch (stockErr) {
          console.warn('Stock update notice:', stockErr);
        }
      }

      if (appliedCoupon) {
        await recordCouponUsage(
          appliedCoupon,
          user?.id || null,
          email.trim().toLowerCase(),
          orderNumber,
          discountAmount
        );
      }

      toast.success('Order placed successfully!');
      clearCart();
      navigate(`/order-success/${data?.order_number || orderNumber}`, {
        state: { order: data || { ...orderData, id: orderNumber, created_at: new Date().toISOString() } },
      });
    } catch (err: any) {
      console.error('Order error:', err);
      toast.error('Failed to submit order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLabelIcon = (label: string) => {
    if (label.toLowerCase() === 'home') return <Home className="w-4 h-4 text-emerald-600" />;
    if (label.toLowerCase() === 'office') return <Briefcase className="w-4 h-4 text-blue-600" />;
    return <Building2 className="w-4 h-4 text-purple-600" />;
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Express Checkout</h1>
        <p className="text-xs text-gray-500 mt-1">Select from your Address Book or enter new delivery details</p>
      </div>

      {!user && (
        <div className="mb-8 p-4 sm:p-5 bg-amber-50 border-2 border-amber-300 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-gray-900 text-sm">Account Required for Checkout</h4>
              <p className="text-xs text-gray-600">Please sign in or register to complete your order and track live shipping.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthOpen(true)}
            className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-extrabold rounded-2xl shadow transition shrink-0 cursor-pointer"
          >
            Sign In / Register Now
          </button>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Shipping & Payment Details */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Address Book Selection */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>1. Delivery Address</span>
              </h3>
              <Link to="/profile" className="text-xs text-emerald-600 font-bold hover:underline">
                Manage Address Book
              </Link>
            </div>

            {/* Saved Address Cards */}
            {addresses.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Choose Saved Address</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id && !isAddingNewAddress;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getLabelIcon(addr.label)}
                            <span className="font-bold text-xs text-gray-900">{addr.label}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <p className="font-bold text-gray-800">{addr.recipient_name}</p>
                          <p className="text-gray-500">{addr.phone}</p>
                          <p className="text-gray-600 line-clamp-1">{addr.street_address}, {addr.city}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewAddress(true);
                    setSelectedAddressId('');
                    setName('');
                    setPhone('');
                    setAddress('');
                    setPostalCode('');
                  }}
                  className={`w-full py-2.5 px-4 rounded-2xl border-2 border-dashed font-bold text-xs flex items-center justify-center gap-2 transition ${
                    isAddingNewAddress
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-300 hover:border-emerald-500 text-gray-600'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Deliver to a Different Address</span>
                </button>
              </div>
            )}

            {/* Address Form Inputs */}
            {(addresses.length === 0 || isAddingNewAddress) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Recipient Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 01700000000"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. customer@gmail.com"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Full Street Address (House, Road, Area) *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. House 12, Road 4, Sector 7, Area name"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    District / City (64 Districts) *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => {
                      const newDistrict = e.target.value;
                      setCity(newDistrict);
                      const newThanas = getThanasByDistrict(newDistrict);
                      if (newThanas.length > 0) {
                        setThana(newThanas[0]);
                        setIsCustomThana(false);
                        setCustomThana('');
                      } else {
                        setIsCustomThana(true);
                        setCustomThana('');
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Dhaka">Dhaka (ঢাকা) - Inside Dhaka ৳60</option>
                    {['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'].map((div) => {
                      const districtsInDiv = BD_DISTRICTS.filter((d) => d.division === div && d.name !== 'Dhaka');
                      return (
                        <optgroup key={div} label={`── ${div} Division (৳120) ──`}>
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

                {/* Thana / Upazila Selector with Manual Option */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Thana / Upazila *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomThana(!isCustomThana)}
                      className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold underline"
                    >
                      {isCustomThana ? 'Choose from list' : '+ Type Manually'}
                    </button>
                  </div>

                  {isCustomThana ? (
                    <input
                      type="text"
                      required
                      value={customThana}
                      onChange={(e) => setCustomThana(e.target.value)}
                      placeholder="Type your Thana / Area / Union name..."
                      className="w-full px-4 py-3 bg-gray-50 border border-emerald-400 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  ) : (
                    <select
                      value={thana}
                      onChange={(e) => {
                        if (e.target.value === '__OTHER__') {
                          setIsCustomThana(true);
                          setCustomThana('');
                        } else {
                          setThana(e.target.value);
                        }
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                    >
                      {getThanasByDistrict(city).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                      <option value="__OTHER__">➕ Other / Missing Thana (অন্যান্য / কাস্টম থানা)</option>
                    </select>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Postal / Zip Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 1230"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  {user ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="save_addr"
                        checked={saveToAddressBook}
                        onChange={(e) => setSaveToAddressBook(e.target.checked)}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                      <label htmlFor="save_addr" className="text-xs font-bold text-gray-700 cursor-pointer">
                        Save this address in my Address Book for future orders
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Want to save this address?{' '}
                        <button
                          type="button"
                          onClick={() => setIsAuthOpen(true)}
                          className="text-emerald-600 font-bold hover:underline"
                        >
                          Log in or create an account
                        </button>{' '}
                        to use the Address Book.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Special Delivery Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Call before arrival / Leave at security gate"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Payment Choice with Central Store Owner Gateway */}
          {(() => {
            const activeBkashNumber = settings.bkashNumber;
            const activeBkashType = settings.bkashType;
            const activeNagadNumber = settings.nagadNumber;
            const activeNagadType = settings.nagadType;
            const activeRocketNumber = settings.rocketNumber;
            const activeRocketType = settings.rocketType;

            const allowsCod = cart.every(
              (item) => !item.product.allowed_payment_methods || item.product.allowed_payment_methods.length === 0 || item.product.allowed_payment_methods.includes('cod')
            );
            const allowsBkash = cart.every(
              (item) => !item.product.allowed_payment_methods || item.product.allowed_payment_methods.length === 0 || item.product.allowed_payment_methods.includes('bkash')
            );
            const allowsNagad = cart.every(
              (item) => !item.product.allowed_payment_methods || item.product.allowed_payment_methods.length === 0 || item.product.allowed_payment_methods.includes('nagad')
            );
            const allowsRocket = cart.every(
              (item) => !item.product.allowed_payment_methods || item.product.allowed_payment_methods.length === 0 || item.product.allowed_payment_methods.includes('rocket') || item.product.allowed_payment_methods.includes('bkash')
            );
            const allowsBank = false;
            const allowsCard = cart.every(
              (item) => !item.product.allowed_payment_methods || item.product.allowed_payment_methods.includes('card')
            );

            return (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <span>2. Payment Choice</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* 1. Cash on Delivery */}
                  <label
                    className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between ${
                      !allowsCod
                        ? 'opacity-40 bg-gray-50 border-gray-200 cursor-not-allowed'
                        : paymentMethod === 'cod'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20 cursor-pointer'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Truck className="w-6 h-6 text-emerald-600" />
                      <input
                        type="radio"
                        name="payment"
                        disabled={!allowsCod}
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="accent-emerald-600"
                      />
                    </div>
                    <div className="mt-3">
                      <h4 className="font-bold text-xs text-gray-900">Cash on Delivery</h4>
                      <p className="text-[10px] text-gray-500">
                        {allowsCod ? 'Pay when you receive' : 'Prepaid Only for this item'}
                      </p>
                    </div>
                  </label>

                  {/* 2. bKash */}
                  <label
                    className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between ${
                      !allowsBkash
                        ? 'opacity-40 bg-gray-50 border-gray-200 cursor-not-allowed'
                        : paymentMethod === 'bkash'
                        ? 'border-pink-600 bg-pink-50/50 ring-2 ring-pink-600/20 cursor-pointer'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-6 bg-white px-2 py-0.5 rounded-lg shadow-xs border border-gray-100 flex items-center">
                        <BkashLogo className="h-4 w-auto" />
                      </div>
                      <input
                        type="radio"
                        name="payment"
                        disabled={!allowsBkash}
                        checked={paymentMethod === 'bkash'}
                        onChange={() => setPaymentMethod('bkash')}
                        className="accent-pink-600"
                      />
                    </div>
                    <div className="mt-3">
                      <h4 className="font-bold text-xs text-gray-900">bKash {activeBkashType}</h4>
                      <p className="text-[11px] text-gray-800 font-mono font-bold pt-0.5 select-all">{activeBkashNumber}</p>
                    </div>
                  </label>

                  {/* 3. Nagad */}
                  <label
                    className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between ${
                      !allowsNagad
                        ? 'opacity-40 bg-gray-50 border-gray-200 cursor-not-allowed'
                        : paymentMethod === 'nagad'
                        ? 'border-orange-600 bg-orange-50/50 ring-2 ring-orange-600/20 cursor-pointer'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-6 bg-white px-2 py-0.5 rounded-lg shadow-xs border border-gray-100 flex items-center">
                        <NagadLogo className="h-4 w-auto" />
                      </div>
                      <input
                        type="radio"
                        name="payment"
                        disabled={!allowsNagad}
                        checked={paymentMethod === 'nagad'}
                        onChange={() => setPaymentMethod('nagad')}
                        className="accent-orange-600"
                      />
                    </div>
                    <div className="mt-3">
                      <h4 className="font-bold text-xs text-gray-900">Nagad {activeNagadType}</h4>
                      <p className="text-[11px] text-gray-800 font-mono font-bold pt-0.5 select-all">{activeNagadNumber}</p>
                    </div>
                  </label>

                  {/* 4. Rocket */}
                  <label
                    className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between ${
                      !allowsRocket
                        ? 'opacity-40 bg-gray-50 border-gray-200 cursor-not-allowed'
                        : paymentMethod === 'rocket'
                        ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-600/20 cursor-pointer'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-6 bg-white px-2 py-0.5 rounded-lg shadow-xs border border-gray-100 flex items-center">
                        <RocketLogo className="h-4 w-auto" />
                      </div>
                      <input
                        type="radio"
                        name="payment"
                        disabled={!allowsRocket}
                        checked={paymentMethod === 'rocket'}
                        onChange={() => setPaymentMethod('rocket')}
                        className="accent-purple-600"
                      />
                    </div>
                    <div className="mt-3">
                      <h4 className="font-bold text-xs text-gray-900">Rocket {activeRocketType}</h4>
                      <p className="text-[11px] text-gray-800 font-mono font-bold pt-0.5 select-all">{activeRocketNumber}</p>
                    </div>
                  </label>

                  {/* 5. Direct Bank Transfer */}
                  <label
                    className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between ${
                      !allowsBank
                        ? 'opacity-40 bg-gray-50 border-gray-200 cursor-not-allowed'
                        : paymentMethod === 'bank'
                        ? 'border-emerald-700 bg-emerald-50/50 ring-2 ring-emerald-700/20 cursor-pointer'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Landmark className="w-6 h-6 text-emerald-700" />
                      <input
                        type="radio"
                        name="payment"
                        disabled={!allowsBank}
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                        className="accent-emerald-700"
                      />
                    </div>
                    <div className="mt-3">
                      <h4 className="font-bold text-xs text-gray-900">Direct Bank Transfer</h4>
                      <p className="text-[10px] text-gray-500 truncate">Official Bank Deposit</p>
                    </div>
                  </label>

                  {/* 6. Debit / Credit Card (Coming Soon) */}
                  <div
                    className="p-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 transition flex flex-col justify-between opacity-65 cursor-not-allowed select-none relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 grayscale opacity-75">
                        <VisaLogo className="h-3.5 w-auto" />
                        <MastercardLogo className="h-3.5 w-auto" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                        Coming Soon
                      </span>
                    </div>
                    <div className="mt-3">
                      <h4 className="font-bold text-xs text-gray-700">Visa, Mastercard, Amex</h4>
                      <p className="text-[10px] text-gray-400">Online Card Gateway (শীঘ্রই আসছে)</p>
                    </div>
                  </div>
                </div>

                {/* bKash / Nagad / Rocket High-Visibility Payment Details & 1-Click Copy Box */}
                {(paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'rocket') && (() => {
                  const currentMethodName = paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Rocket';
                  const currentNumber = paymentMethod === 'bkash' ? activeBkashNumber : paymentMethod === 'nagad' ? activeNagadNumber : activeRocketNumber;
                  const currentType = paymentMethod === 'bkash' ? activeBkashType : paymentMethod === 'nagad' ? activeNagadType : activeRocketType;
                  const themeBg = paymentMethod === 'bkash' ? 'bg-pink-50/70 border-pink-200' : paymentMethod === 'nagad' ? 'bg-orange-50/70 border-orange-200' : 'bg-purple-50/70 border-purple-200';
                  const themeTextColor = paymentMethod === 'bkash' ? 'text-pink-700' : paymentMethod === 'nagad' ? 'text-orange-700' : 'text-purple-700';

                  return (
                    <div className={`p-5 sm:p-6 rounded-3xl border-2 ${themeBg} space-y-4 animate-fadeIn shadow-xs`}>
                      {/* Header with Logo and Instructions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-200/70">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 bg-white px-2.5 py-1 rounded-xl shadow-xs border border-gray-100 flex items-center">
                            {paymentMethod === 'bkash' && <BkashLogo className="h-4 w-auto" />}
                            {paymentMethod === 'nagad' && <NagadLogo className="h-4 w-auto" />}
                            {paymentMethod === 'rocket' && <RocketLogo className="h-4 w-auto" />}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                              <span>{currentMethodName} Payment</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 ${themeTextColor}`}>
                                {currentType} {currentType.toLowerCase().includes('personal') ? '(Send Money)' : '(Payment)'}
                              </span>
                            </h4>
                          </div>
                        </div>
                      </div>

                      {/* Number Display & 1-Click Copy Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Number Box */}
                        <div className="bg-white p-4 rounded-2xl border-2 border-gray-200/90 flex items-center justify-between gap-3 shadow-xs">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-0.5">
                              {currentMethodName} Number (টাকা পাঠানোর নাম্বার):
                            </span>
                            <span className="font-mono text-lg sm:text-xl font-black text-gray-900 tracking-wider select-all">
                              {currentNumber}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopy(currentNumber, `${currentMethodName} Number`)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer shrink-0"
                          >
                            {copiedField === `${currentMethodName} Number` ? (
                              <>
                                <Check className="w-4 h-4 text-white" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 text-white" />
                                <span>Copy Number</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Amount Box */}
                        <div className="bg-white p-4 rounded-2xl border-2 border-gray-200/90 flex items-center justify-between gap-3 shadow-xs">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-0.5">
                              Total Amount (মোট প্রদেয় টাকা):
                            </span>
                            <span className="font-mono text-lg sm:text-xl font-black text-emerald-700">
                              {formatPrice(dynamicTotal)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopy(String(dynamicTotal), 'Total Amount')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition border border-gray-200 active:scale-95 cursor-pointer shrink-0"
                          >
                            {copiedField === 'Total Amount' ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 text-gray-600" />
                                <span>Copy ৳</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* TrxID Input */}
                      <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2">
                        <label className="block text-xs font-extrabold text-gray-900 uppercase">
                          {currentMethodName.toUpperCase()} Transaction ID (TrxID) *
                        </label>
                        <input
                          type="text"
                          required
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                          placeholder="e.g. BL9A4K98X"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono uppercase tracking-wider font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                        />
                        <p className="text-[10px] text-gray-500 flex items-center gap-1 pt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>টাকা পাঠিয়ে মেসেজে পাওয়া TrxID টি এখানে দিন এবং নিচে "Place Order" এ ক্লিক করুন।</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Bank Transfer Instructions and Reference Input with 1-Click Copy */}
                {paymentMethod === 'bank' && (
                  <div className="p-5 sm:p-6 bg-emerald-50/70 rounded-3xl border-2 border-emerald-200 space-y-4 animate-fadeIn shadow-xs">
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-emerald-200">
                      <div className="flex items-center gap-2 text-sm font-black text-emerald-950">
                        <Landmark className="w-5 h-5 text-emerald-700" />
                        <span>Direct Bank Transfer Details</span>
                      </div>
                      <span className="font-mono text-sm font-black text-emerald-800 bg-white px-2.5 py-1 rounded-xl border border-emerald-200">
                        Amount: {formatPrice(dynamicTotal)}
                      </span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200 text-xs text-gray-800">
                      <p className="font-semibold">Please contact store support or transfer to our official bank account.</p>
                    </div>

                    {/* Bank Reference Input */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2">
                      <label className="block text-xs font-extrabold text-gray-900 uppercase">
                        Bank Transfer Reference / Transaction ID / Sender Account *
                      </label>
                      <input
                        type="text"
                        required
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        placeholder="e.g. Deposit Slip No / IBFT Ref / Sender A/C"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                )}

                {/* Card Payment Online Gateway Reference Input */}
                {paymentMethod === 'card' && (
                  <div className="p-5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2 text-xs font-black text-blue-950">
                      <CreditCard className="w-4 h-4 text-blue-700" />
                      <span>Secure Online Card Payment ({formatPrice(dynamicTotal)}):</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-blue-200 text-xs text-gray-700 space-y-1">
                      <p>We accept all major credit and debit cards (Visa, Mastercard, American Express).</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                        Card Payment Transaction Reference / Auth Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                        placeholder="e.g. CARD-REF-99482"
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 sticky top-28">
            <h3 className="font-extrabold text-gray-900 text-lg">Order Summary</h3>

            {/* Item preview list */}
            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto space-y-3 pr-2">
              {cart.map((item) => {
                const itemPrice = item.product.discount_price || item.product.price;
                return (
                  <div key={item.product.id} className="pt-3 flex items-center gap-3">
                    <img
                      src={item.product.images[0] || '/logo.webp'}
                      alt={item.product.title}
                      className="w-14 h-14 object-cover rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-gray-800 line-clamp-1">{item.product.title}</h4>
                      <div className="text-[10px] text-gray-400 flex items-center gap-2">
                        <span>Qty: {item.quantity}</span>
                        {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                        {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{formatPrice(itemPrice * item.quantity)}</span>
                  </div>
                );
              })}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2 text-xs border-t border-gray-100 pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping ({isInsideDhaka ? 'Inside Dhaka ৳60' : 'Outside Dhaka ৳120'})</span>
                <span className="font-semibold text-gray-900">
                  {dynamicShippingFee === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase">Free Delivery</span>
                  ) : (
                    formatPrice(dynamicShippingFee)
                  )}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-black text-gray-900">
                <span>Total Due</span>
                <span className="text-emerald-700 text-xl">{formatPrice(dynamicTotal)}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl transition shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Confirm Order ({formatPrice(dynamicTotal)})</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe 256-bit encrypted checkout guarantee</span>
            </div>
          </div>
        </div>

      </form>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

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
  Minus,
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
  X,
  ArrowLeft,
} from 'lucide-react';
import { BkashLogo, NagadLogo, RocketLogo, VisaLogo, MastercardLogo } from '../components/common/PaymentLogos';
import { AuthModal } from '../components/auth/AuthModal';
import { toast } from 'sonner';
import { BD_DISTRICTS, getThanasByDistrict } from '../data/bangladeshDistricts';
import { useLanguage } from '../contexts/LanguageContext';

export const CheckoutPage: React.FC = () => {
  const { cart, discountAmount, appliedCoupon, removeFromCart, updateQuantity } = useCart();
  const { user, profile } = useAuth();
  const { addresses, defaultAddress, addAddress } = useAddress();
  const { settings } = useSettings();
  const { recordCouponUsage } = useCoupons();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    label: 'Home',
    recipient_name: '',
    phone: '',
    street_address: '',
    city: 'Dhaka',
    thana: '',
    customThana: '',
    isCustomThana: false,
    postal_code: '',
  });

  const handleOpenAddAddressModal = () => {
    const initialCity = 'Dhaka';
    const thanasList = getThanasByDistrict(initialCity);
    setModalForm({
      label: 'Home',
      recipient_name: profile?.full_name || '',
      phone: profile?.phone || '',
      street_address: '',
      city: initialCity,
      thana: thanasList[0] || '',
      customThana: '',
      isCustomThana: false,
      postal_code: '',
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveModalAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.recipient_name.trim()) {
      toast.error(language === 'bn' ? 'প্রাপকের নাম আবশ্যক' : 'Recipient name is required');
      return;
    }
    if (!modalForm.phone.trim()) {
      toast.error(language === 'bn' ? 'ফোন নম্বর আবশ্যক' : 'Phone number is required');
      return;
    }
    if (!modalForm.street_address.trim()) {
      toast.error(language === 'bn' ? 'ডেলিভারি ঠিকানা আবশ্যক' : 'Street address is required');
      return;
    }

    const finalThana = modalForm.isCustomThana ? modalForm.customThana.trim() : modalForm.thana.trim();
    const finalCity = finalThana ? `${modalForm.city} (${finalThana})` : modalForm.city;

    const isFirst = addresses.length === 0;
    const payload = {
      label: modalForm.label,
      recipient_name: modalForm.recipient_name.trim(),
      phone: modalForm.phone.trim(),
      street_address: modalForm.street_address.trim(),
      city: finalCity,
      postal_code: modalForm.postal_code.trim(),
      is_default: isFirst,
    };

    try {
      await addAddress(payload);
      setName(payload.recipient_name);
      setPhone(payload.phone);
      setAddress(payload.street_address);
      setCity(modalForm.city);
      setThana(finalThana);
      setPostalCode(payload.postal_code);
      setIsAddressModalOpen(false);
      toast.success(
        language === 'bn'
          ? 'অ্যাড্রেস বুকে নতুন ঠিকানা সংরক্ষিত হয়েছে'
          : 'Address saved to Address Book successfully'
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save address');
    }
  };

  // Read selected cart keys
  const getItemKey = (item: any) =>
    `${item?.product?.id || ''}_${item?.selectedColor || ''}_${item?.selectedSize || ''}`;

  const [selectedItemKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kintesi_selected_cart_keys');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const validCart = cart.filter((item) => item && item.product && item.product.id);
  const checkoutItems =
    selectedItemKeys.length > 0
      ? validCart.filter((item) => selectedItemKeys.includes(getItemKey(item)))
      : validCart;

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
    if (addresses.length > 0) {
      if (defaultAddress && !selectedAddressId) {
        setSelectedAddressId(defaultAddress.id);
        applyAddressData(defaultAddress);
      } else if (!selectedAddressId) {
        setSelectedAddressId(addresses[0].id);
        applyAddressData(addresses[0]);
      }
    }
  }, [addresses, defaultAddress]);

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
          <h2 className="text-2xl font-black text-gray-900">
            {language === 'bn' ? 'অর্ডার করতে সাইন ইন করুন' : 'Account Required for Checkout'}
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            {language === 'bn'
              ? 'অর্ডার নিশ্চিত করতে ও চেকআউট সম্পন্ন করতে অনুগ্রহ করে আপনার Kintesi অ্যাকাউন্টে লগইন করুন।'
              : 'Please sign in to your Kintesi account to proceed with checkout and confirm your order.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsAuthOpen(true)}
            className="w-full sm:w-auto px-7 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition shadow-lg shadow-rose-600/25 active:scale-95 cursor-pointer"
          >
            {t('profile.signInBtn')}
          </button>
          <Link
            to="/shop"
            className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
          >
            {t('cart.continue')}
          </Link>
        </div>
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {language === 'bn' ? 'কোনো পণ্য নির্বাচিত নেই' : 'No Items Selected for Checkout'}
        </h2>
        <p className="text-gray-500 mb-6">
          {language === 'bn'
            ? 'চেকআউট করতে কার্ট থেকে পণ্য নির্বাচন করুন।'
            : 'Please select items in your cart to proceed with checkout.'}
        </p>
        <Link to="/cart" className="px-6 py-3 bg-rose-600 text-white font-bold rounded-2xl text-xs shadow-md shadow-rose-600/20">
          {language === 'bn' ? 'কার্টে ফিরে যান' : 'Back to Cart'}
        </Link>
      </div>
    );
  }

  // Subtotal for selected items
  const checkoutSubtotal = checkoutItems.reduce((acc, item) => {
    const itemPrice = (item as any).customPrice || item.product?.discount_price || item.product?.price || 0;
    const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
    return acc + itemPrice * qty;
  }, 0);

  // Dynamic Shipping Fee based on City (Inside Dhaka ৳60, Outside Dhaka ৳120)
  const isInsideDhaka = city.trim().toLowerCase() === 'dhaka';
  const dynamicShippingFee =
    checkoutSubtotal === 0
      ? 0
      : checkoutSubtotal >= (settings.freeShippingThreshold || 5000)
      ? 0
      : isInsideDhaka
      ? Number(settings.deliveryFeeInsideDhaka) || 60
      : Number(settings.deliveryFeeOutsideDhaka) || 120;

  // Coupon discount recalculation on checkout items
  let checkoutDiscountAmount = 0;
  if (appliedCoupon && checkoutSubtotal > 0) {
    if (appliedCoupon.discount_type === 'fixed') {
      const val = Number(appliedCoupon.discount_value || appliedCoupon.discount_percent || 0);
      checkoutDiscountAmount = Math.min(val, checkoutSubtotal);
    } else {
      const percent = Number(appliedCoupon.discount_percent || appliedCoupon.discount_value || 0);
      const calculated = (checkoutSubtotal * percent) / 100;
      checkoutDiscountAmount = appliedCoupon.max_discount
        ? Math.min(calculated, appliedCoupon.max_discount)
        : calculated;
    }
  }

  const dynamicTotal = Math.max(0, checkoutSubtotal - checkoutDiscountAmount + dynamicShippingFee);

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

    const orderItems = checkoutItems.map((item) => ({
      productId: item.product.id,
      title: item.product.title,
      price: (item as any).customPrice || item.product.discount_price || item.product.price,
      quantity: item.quantity,
      image: (item as any).variantImage || item.product.images[0] || '',
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
      subtotal: checkoutSubtotal,
      shipping_cost: dynamicShippingFee,
      discount: checkoutDiscountAmount,
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
          subtotal: checkoutSubtotal,
          shipping_cost: dynamicShippingFee,
          discount: checkoutDiscountAmount,
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

      // Automatically reduce product stock count on sale for purchased items
      for (const cartItem of checkoutItems) {
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
          checkoutDiscountAmount
        );
      }

      toast.success(language === 'bn' ? 'অর্ডার সফলভাবে গ্রহণ করা হয়েছে!' : 'Order placed successfully!');
      // Remove only purchased items from cart
      checkoutItems.forEach((it) => removeFromCart(it.product.id));
      try {
        localStorage.removeItem('kintesi_selected_cart_keys');
        localStorage.removeItem('kintesi_selected_checkout_items');
      } catch {}

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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-16">
      
      <div className="mb-6 sm:mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/cart'))}
          className="p-2 -ml-1 text-gray-700 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition cursor-pointer flex items-center justify-center shrink-0 border border-gray-100 shadow-xs sm:border-0 sm:shadow-none"
          aria-label="Back to Cart"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {language === 'bn' ? 'এক্সপ্রেস চেকআউট' : 'Express Checkout'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'অ্যাড্রেস বুক থেকে ঠিকানা নির্বাচন করুন'
              : 'Select from your Address Book or enter new delivery details'}
          </p>
        </div>
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
          
          {/* Address Book Selection (100% from Address Book, No manual fields on page) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-600" />
                <span>{language === 'bn' ? '১. ডেলিভারি ঠিকানা' : '1. Delivery Address'}</span>
              </h3>
              <Link to="/profile" className="text-xs text-rose-600 font-bold hover:underline">
                {language === 'bn' ? 'অ্যাড্রেস বুক পরিচালনা' : 'Manage Address Book'}
              </Link>
            </div>

            {/* When user has no saved addresses: Clean prompt with button to add to Address Book */}
            {addresses.length === 0 ? (
              <div className="bg-rose-50/60 border-2 border-dashed border-rose-200 rounded-3xl p-6 sm:p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-sm">
                    {language === 'bn' ? 'অ্যাড্রেস বুকে কোনো সংরক্ষিত ঠিকানা নেই' : 'No Address in Address Book'}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    {language === 'bn'
                      ? 'অর্ডার করতে আপনার অ্যাড্রেস বুকে একটি ডেলিভারি ঠিকানা যুক্ত করুন।'
                      : 'Please add a delivery address to your Address Book to proceed with checkout.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddAddressModal}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'bn' ? 'অ্যাড্রেস বুকে ডেলিভারি ঠিকানা যোগ করুন' : 'Add Delivery Address to Address Book'}</span>
                </button>
              </div>
            ) : (
              /* When user has saved addresses: Select directly from cards. If multiple addresses, all are selectable! */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {language === 'bn' ? 'সংরক্ষিত ঠিকানা নির্বাচন করুন' : 'Choose Saved Address'}
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddAddressModal}
                    className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'নতুন ঠিকানা যোগ করুন' : 'Add New Address'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-rose-600 bg-rose-50/40 shadow-xs ring-2 ring-rose-600/20'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getLabelIcon(addr.label)}
                            <span className="font-bold text-xs text-gray-900">{addr.label}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                        </div>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <p className="font-bold text-gray-900">{addr.recipient_name}</p>
                          <p className="text-gray-500 font-mono text-[11px]">{addr.phone}</p>
                          <p className="text-gray-600 line-clamp-2 mt-0.5">{addr.street_address}, {addr.city}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Payment Choice with Central Store Owner Gateway */}
          {(() => {
            const activeBkashNumber = settings.bkashNumber;
            const activeBkashType = settings.bkashType;
            const activeNagadNumber = settings.nagadNumber;
            const activeNagadType = settings.nagadType;
            const activeRocketNumber = settings.rocketNumber;
            const activeRocketType = settings.rocketType;

            const allowsCod = checkoutItems.every(
              (item) => !item.product.allowed_payment_methods || item.product.allowed_payment_methods.length === 0 || item.product.allowed_payment_methods.includes('cod')
            );
            const allowsBkash = checkoutItems.every(
              (item) => !item.product.allowed_payment_methods || item.product.allowed_payment_methods.length === 0 || item.product.allowed_payment_methods.includes('bkash')
            );
            const allowsNagad = checkoutItems.every(
              (item) => !item.product.allowed_payment_methods || item.product.allowed_payment_methods.length === 0 || item.product.allowed_payment_methods.includes('nagad')
            );
            const allowsRocket = checkoutItems.every(
              (item) => !item.product.allowed_payment_methods || item.product.allowed_payment_methods.length === 0 || item.product.allowed_payment_methods.includes('rocket') || item.product.allowed_payment_methods.includes('bkash')
            );
            const allowsBank = false;
            const allowsCard = checkoutItems.every(
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
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-gray-900 text-lg">
                {t('checkout.orderSummary')}
              </h3>
              <span className="text-xs text-gray-500 font-medium">
                {checkoutItems.length} {language === 'bn' ? 'টি নির্বাচিত পণ্য' : 'selected items'}
              </span>
            </div>

            {/* Item preview list (Strictly selected items) */}
            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto space-y-3 pr-2">
              {checkoutItems.map((item) => {
                const itemPrice = (item as any).customPrice || item.product?.discount_price || item.product?.price || 0;
                return (
                  <div key={`${item.product?.id || 'item'}-${item.selectedColor || ''}-${item.selectedSize || ''}`} className="pt-3 flex items-center gap-3">
                    <img
                      src={(item as any).variantImage || item.product?.images?.[0] || '/logo.webp'}
                      alt={item.product?.title || 'Product'}
                      className="w-14 h-14 object-cover rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-gray-800 line-clamp-1">{item.product?.title || 'Product'}</h4>
                      <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                        {item.selectedSize && <span>{language === 'bn' ? `সাইজ: ${item.selectedSize}` : `Size: ${item.selectedSize}`}</span>}
                        {item.selectedColor && <span>{language === 'bn' ? `কালার: ${item.selectedColor}` : `Color: ${item.selectedColor}`}</span>}
                      </div>

                      {/* Product Counter directly on Checkout Page */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity > 1 && item.product?.id) {
                                updateQuantity(item.product.id, item.quantity - 1, item.selectedColor, item.selectedSize);
                              }
                            }}
                            disabled={item.quantity <= 1}
                            className="p-1 hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-gray-800 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity < (item.product?.stock || 99) && item.product?.id) {
                                updateQuantity(item.product.id, item.quantity + 1, item.selectedColor, item.selectedSize);
                              }
                            }}
                            disabled={item.quantity >= (item.product?.stock || 99)}
                            className="p-1 hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          ({formatPrice(itemPrice)} / {language === 'bn' ? 'পিস' : 'pc'})
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-rose-600 shrink-0">
                      {formatPrice(itemPrice * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2 text-xs border-t border-gray-100 pt-4">
              <div className="flex justify-between text-gray-600">
                <span>{t('cart.subtotal')}</span>
                <span className="font-semibold text-gray-900">{formatPrice(checkoutSubtotal)}</span>
              </div>
              {checkoutDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>{language === 'bn' ? `কুপন (${appliedCoupon?.code})` : `Coupon (${appliedCoupon?.code})`}</span>
                  <span>-{formatPrice(checkoutDiscountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>
                  {t('cart.deliveryFee')} ({isInsideDhaka ? (language === 'bn' ? 'ঢাকার ভেতরে ৳৬০' : 'Inside Dhaka ৳60') : (language === 'bn' ? 'ঢাকার বাইরে ৳১২০' : 'Outside Dhaka ৳120')})
                </span>
                <span className="font-semibold text-gray-900">
                  {dynamicShippingFee === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase">{t('cart.freeShipping')}</span>
                  ) : (
                    formatPrice(dynamicShippingFee)
                  )}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-black text-gray-900">
                <span>{t('cart.total')}</span>
                <span className="text-rose-600 text-xl font-black">{formatPrice(dynamicTotal)}</span>
              </div>
            </div>

            {/* Place Order Button with Dynamic Final Total */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl transition shadow-xl shadow-rose-600/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    {language === 'bn'
                      ? `অর্ডার কনফার্ম করুন (${formatPrice(dynamicTotal)})`
                      : `Confirm Order (${formatPrice(dynamicTotal)})`}
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {language === 'bn'
                  ? '১০০% নিরাপদ ও এনক্রিপ্টেড চেকআউট গ্যারান্টি'
                  : 'Safe 256-bit encrypted checkout guarantee'}
              </span>
            </div>
          </div>
        </div>

      </form>

      {/* Address Book Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {language === 'bn' ? 'অ্যাড্রেস বুকে নতুন ঠিকানা যোগ করুন' : 'Add New Address to Address Book'}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {language === 'bn' ? 'দ্রুত চেকআউট ও ডেলিভারির জন্য ঠিকানা সংরক্ষণ করুন' : 'Save address for 1-click checkout and delivery'}
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
            <form id="checkout-address-modal-form" onSubmit={handleSaveModalAddress} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              {/* Address Label Pills */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {language === 'bn' ? 'ঠিকানার ধরন' : 'Address Label'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Home', label: language === 'bn' ? 'বাসা' : 'Home', icon: Home },
                    { id: 'Office', label: language === 'bn' ? 'অফিস' : 'Office', icon: Briefcase },
                    { id: 'Other', label: language === 'bn' ? 'অন্যান্য' : 'Other', icon: Building2 },
                  ].map(({ id, label: lbl, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setModalForm({ ...modalForm, label: id })}
                      className={`py-2 px-3 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        modalForm.label === id
                          ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {language === 'bn' ? 'প্রাপকের নাম *' : 'Recipient Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={modalForm.recipient_name}
                    onChange={(e) => setModalForm({ ...modalForm, recipient_name: e.target.value })}
                    placeholder={language === 'bn' ? 'উদাঃ তানভীর আহমেদ' : 'e.g. Tanvir Ahmed'}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {language === 'bn' ? 'ফোন নম্বর *' : 'Phone Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={modalForm.phone}
                    onChange={(e) => setModalForm({ ...modalForm, phone: e.target.value })}
                    placeholder="e.g. 01700000000"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {language === 'bn' ? 'রাস্তা / বাসা / এলাকা *' : 'Street Address (House, Road, Area) *'}
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.street_address}
                  onChange={(e) => setModalForm({ ...modalForm, street_address: e.target.value })}
                  placeholder={language === 'bn' ? 'উদাঃ বাড়ি ১২, রোড ৪, সেক্টর ৭, উত্তরা' : 'e.g. House 12, Road 4, Sector 7, Uttara'}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white transition"
                />
              </div>

              {/* District & Thana */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {language === 'bn' ? 'জেলা (৬৪ জেলা) *' : 'District (64 Districts) *'}
                  </label>
                  <select
                    value={modalForm.city}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      const thanasList = getThanasByDistrict(newCity);
                      setModalForm({
                        ...modalForm,
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
                      {language === 'bn' ? 'থানা / উপজেলা *' : 'Thana / Upazila *'}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setModalForm({ ...modalForm, isCustomThana: !modalForm.isCustomThana })
                      }
                      className="text-[10px] text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
                    >
                      {modalForm.isCustomThana ? (language === 'bn' ? 'তালিকা থেকে' : 'From List') : (language === 'bn' ? '+ লিখুন' : '+ Type')}
                    </button>
                  </div>

                  {modalForm.isCustomThana ? (
                    <input
                      type="text"
                      required
                      value={modalForm.customThana}
                      onChange={(e) => setModalForm({ ...modalForm, customThana: e.target.value })}
                      placeholder={language === 'bn' ? 'থানা / ইউনিয়ন লিখুন...' : 'Type Thana / Union...'}
                      className="w-full px-3.5 py-2.5 bg-rose-50/50 border border-rose-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                  ) : (
                    <select
                      value={modalForm.thana}
                      onChange={(e) => {
                        if (e.target.value === '__OTHER__') {
                          setModalForm({ ...modalForm, isCustomThana: true, customThana: '' });
                        } else {
                          setModalForm({ ...modalForm, thana: e.target.value });
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white text-xs transition"
                    >
                      {getThanasByDistrict(modalForm.city).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                      <option value="__OTHER__">➕ {language === 'bn' ? 'অন্যান্য / নতুন থানা' : 'Other / Missing Thana'}</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Postal Code */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {language === 'bn' ? 'পোস্টাল কোড (ঐচ্ছিক)' : 'Postal Code (Optional)'}
                </label>
                <input
                  type="text"
                  value={modalForm.postal_code}
                  onChange={(e) => setModalForm({ ...modalForm, postal_code: e.target.value })}
                  placeholder="e.g. 1230"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white transition"
                />
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-5 sm:p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="px-5 py-2.5 text-gray-600 hover:text-gray-900 font-bold text-xs rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                form="checkout-address-modal-form"
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition cursor-pointer active:scale-95"
              >
                {language === 'bn' ? 'ঠিকানা সংরক্ষণ করুন' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

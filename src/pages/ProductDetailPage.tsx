import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockData';
import { getProductsFromDB } from '../lib/dbService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAddress } from '../contexts/AddressContext';
import { useSettings } from '../contexts/SettingsContext';
import { useChat } from '../contexts/ChatContext';
import { BD_DISTRICTS } from '../data/bangladeshDistricts';
import { formatPrice, calculateDiscount } from '../lib/utils';
import { ProductCard } from '../components/common/ProductCard';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  ShoppingCart,
  Heart,
  Zap,
  Check,
  Share2,
  Shirt,
  Info,
  Globe,
  Tag,
  Sparkles,
  MapPin,
  Clock,
  CreditCard,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { toast } from 'sonner';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { defaultAddress, addresses } = useAddress();
  const { settings } = useSettings();
  const { openChat } = useChat();

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Mobile Daraz-style Navigation Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'specs' | 'recommendations'>('overview');

  const handleTabClick = (tab: 'overview' | 'reviews' | 'specs' | 'recommendations') => {
    setActiveTab(tab);
    const targetId =
      tab === 'overview'
        ? 'm-sec-overview'
        : tab === 'reviews'
        ? 'm-sec-reviews'
        : tab === 'specs'
        ? 'm-sec-specs'
        : 'm-sec-recommendations';
    const el = document.getElementById(targetId);
    if (el) {
      const offset = 48;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // Review state - Clean verified reviews only
  const [reviews, setReviews] = useState<any[]>([]);

  // Delivery & Address Destination
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [deliveryCity, setDeliveryCity] = useState('Dhaka');
  const [isChangingLocation, setIsChangingLocation] = useState(false);

  // Mobile Sticky Bottom Bar Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 320);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
      const cleanCity = defaultAddress.city.replace(/\s*\(.*?\)/, '').trim();
      setDeliveryCity(cleanCity || 'Dhaka');
    } else if (addresses.length > 0) {
      setSelectedAddressId(addresses[0].id);
      const cleanCity = addresses[0].city.replace(/\s*\(.*?\)/, '').trim();
      setDeliveryCity(cleanCity || 'Dhaka');
    }
  }, [defaultAddress, addresses]);

  const activeAddress = addresses.find((a) => a.id === selectedAddressId) || defaultAddress;

  const handleSelectAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    const cleanCity = addr.city.replace(/\s*\(.*?\)/, '').trim();
    setDeliveryCity(cleanCity || 'Dhaka');
    setIsChangingLocation(false);
    toast.success(`Delivery address switched to "${addr.label}: ${addr.city}"`);
  };

  const isDhaka = deliveryCity.toLowerCase().includes('dhaka');
  const standardDeliveryFee = isDhaka
    ? (settings.deliveryFeeInsideDhaka || 60)
    : (settings.deliveryFeeOutsideDhaka || 120);

  const isFreeDeliveryEligible = product
    ? (product.discount_price || product.price) * quantity >= (settings.freeShippingThreshold || 1000)
    : false;

  const effectiveDeliveryFee = isFreeDeliveryEligible ? 0 : standardDeliveryFee;

  useEffect(() => {
    async function loadProduct() {
      try {
        const savedCustom: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
        const customMatch = savedCustom.find(
          (p) => (p.slug === slug || p.id === slug) && !p.id?.startsWith('prod-')
        );
        const initialMatch = INITIAL_PRODUCTS.find((p) => p.slug === slug || p.id === slug);
        const localProd = customMatch || initialMatch;

        if (localProd) {
          setProduct(localProd);
          setSelectedImage(localProd.images?.[0] || '/logo.webp');
          if (localProd.sizes && localProd.sizes.length > 0) setSelectedSize(localProd.sizes[0]);
          if (localProd.colors && localProd.colors.length > 0) setSelectedColor(localProd.colors[0].name);
          setLoading(false);
        } else {
          setLoading(true);
        }

        const allProds = await getProductsFromDB();
        const found = allProds.find((p) => (p.slug === slug || p.id === slug) && !p.id?.startsWith('prod-'));
        if (found) {
          setProduct(found);
          setSelectedImage(found.images?.[0] || '/logo.webp');
          if (found.sizes && found.sizes.length > 0) setSelectedSize(found.sizes[0]);
          if (found.colors && found.colors.length > 0) setSelectedColor(found.colors[0].name);
        }
        setAllProducts(allProds);

        const targetId = found?.id || localProd?.id;
        if (targetId) {
          const savedCustomReviews = JSON.parse(localStorage.getItem(`kintesi_reviews_${targetId}`) || '[]');
          setReviews(savedCustomReviews);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.warn('Product load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
    window.addEventListener('kintesi_products_updated', loadProduct);
    return () => window.removeEventListener('kintesi_products_updated', loadProduct);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">The product you are looking for might have been removed or does not exist.</p>
        <Link to="/shop" className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl">
          Back to Shop
        </Link>
      </div>
    );
  }

  const currentPrice = product.discount_price || product.price;
  const discountPercent = calculateDiscount(product.price, product.discount_price);
  const isWishlisted = isInWishlist(product.id);

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 4);

  const handleAddToCart = () => {
    if (!user) {
      toast.error('পণ্য কার্টে যোগ করতে বা অর্ডার করতে প্রথমে অ্যাকাউন্টে লগইন করুন (Account Required)');
      openAuthModal('login');
      return;
    }
    addToCart(product, quantity, selectedColor, selectedSize);
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error('অর্ডার করতে অনুগ্রহ করে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন (Account Required)');
      openAuthModal('login');
      return;
    }
    addToCart(product, quantity, selectedColor, selectedSize);
    navigate('/checkout');
  };

  return (
    <div className="w-full pb-24 md:pb-12 bg-gray-50 md:bg-transparent">
      
      {/* ======================================================== */}
      {/* 📱 DEDICATED MOBILE VIEW (Daraz-Grade Clean & Neat Layout) */}
      {/* ======================================================== */}
      <div className="md:hidden bg-gray-100 text-gray-900">
        
        {/* 1. Mobile Sticky Navigation Tabs */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200/90 shadow-xs flex items-center justify-around text-xs font-semibold px-1 py-0">
          <button
            type="button"
            onClick={() => handleTabClick('overview')}
            className={`py-2.5 px-2 transition border-b-2 font-bold ${
              activeTab === 'overview' ? 'text-rose-600 border-rose-600' : 'text-gray-500 border-transparent'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('reviews')}
            className={`py-2.5 px-2 transition border-b-2 font-bold ${
              activeTab === 'reviews' ? 'text-rose-600 border-rose-600' : 'text-gray-500 border-transparent'
            }`}
          >
            Ratings
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('specs')}
            className={`py-2.5 px-2 transition border-b-2 font-bold ${
              activeTab === 'specs' ? 'text-rose-600 border-rose-600' : 'text-gray-500 border-transparent'
            }`}
          >
            Product details
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('recommendations')}
            className={`py-2.5 px-2 transition border-b-2 font-bold ${
              activeTab === 'recommendations' ? 'text-rose-600 border-rose-600' : 'text-gray-500 border-transparent'
            }`}
          >
            Recommendations
          </button>
        </div>

        {/* 2. Full-Width Hero Image Gallery with Counter Tag */}
        <div id="m-sec-overview" className="relative aspect-square bg-white flex items-center justify-center overflow-hidden">
          <img
            src={selectedImage || product.images?.[0] || '/logo.webp'}
            alt={product.title}
            className="w-full h-full object-contain p-2"
          />
          {/* Daraz-style Image Counter Pill (e.g. 1/9) */}
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full shadow-sm">
            {((product.images?.indexOf(selectedImage) ?? -1) >= 0 ? product.images.indexOf(selectedImage) + 1 : 1)} / {product.images?.length || 1}
          </div>
        </div>

        {/* 3. High-Conversion Flash Deal / Price Strip (Daraz Signature Promo Bar) */}
        <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white p-3 px-4 flex items-center justify-between shadow-xs">
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black tracking-tight">
              {formatPrice(currentPrice)}
            </span>
            {product.discount_price && (
              <span className="text-xs text-white/75 line-through font-medium">
                {formatPrice(product.price)}
              </span>
            )}
            {discountPercent > 0 && (
              <span className="bg-white text-rose-600 text-[10px] font-black px-1.5 py-0.5 rounded-xs shadow-xs">
                -{discountPercent}%
              </span>
            )}
          </div>

          <div className="text-right">
            <div className="inline-block bg-amber-400 text-gray-950 font-black text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-xs">
              SUPER DEAL
            </div>
            <div className="text-[10px] text-white/90 font-medium mt-0.5">
              Ends in 3d 14h
            </div>
          </div>
        </div>

        {/* 4. Product Title, Rating, and Action Icons Card */}
        <div className="bg-white p-4 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-snug flex-1">
              {product.title}
            </h1>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`p-1.5 rounded-full transition ${
                  isInWishlist(product.id) ? 'text-rose-600 bg-rose-50' : 'text-gray-400 hover:text-gray-700'
                }`}
                aria-label="Add to wishlist"
              >
                <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Product link copied to clipboard!');
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full transition"
                aria-label="Share product"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Star Rating & Reviews */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-0.5 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-bold text-gray-800">
              {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1) : '4.8'}
            </span>
            <span className="text-gray-400">
              ({reviews.length || 24})
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-emerald-700 font-semibold">
              {product.stock > 0 ? `In Stock (${product.stock})` : 'Sold Out'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-2 bg-gray-100 border-y border-gray-200/50" />

        {/* 5. Product Options Card (Daraz Style: Swatches & Sizes with Chevron) */}
        <div className="bg-white p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">Product Options</span>
            <div className="flex items-center gap-1 text-gray-800 font-bold">
              <span>{selectedSize ? `Size: ${selectedSize}` : ''}</span>
              {selectedSize && selectedColor ? <span>, </span> : null}
              <span>{selectedColor ? `Color: ${selectedColor}` : ''}</span>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-1" />
            </div>
          </div>

          {/* Option Swatches: Mini thumbnail boxes and size pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {product.images && product.images.length > 0 && product.images.slice(0, 4).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`w-12 h-12 rounded-lg border-2 p-0.5 overflow-hidden transition ${
                  selectedImage === img ? 'border-rose-600 shadow-xs' : 'border-gray-200 opacity-80'
                }`}
              >
                <img src={img} alt="variant" className="w-full h-full object-cover rounded-md" />
              </button>
            ))}

            {product.sizes && product.sizes.map((sz) => (
              <button
                key={sz}
                onClick={() => setSelectedSize(sz)}
                className={`px-3 py-2 h-12 rounded-lg text-xs font-bold border transition flex items-center justify-center ${
                  selectedSize === sz ? 'border-rose-600 bg-rose-50 text-rose-700 font-black' : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-2 bg-gray-100 border-y border-gray-200/50" />

        {/* 6. Specifications Card (Daraz Style) */}
        <div 
          onClick={() => handleTabClick('specs')}
          className="bg-white p-4 flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3">
            <span className="text-gray-500 font-medium shrink-0">Specifications</span>
            <span className="text-gray-800 font-medium truncate max-w-[220px]">
              Brand: {product.brand || 'Kintesi'}, SKU: {product.sku || 'KT-Standard'}
              {product.warranty ? `, ${product.warranty}` : ''}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </div>

        {/* Divider */}
        <div className="h-2 bg-gray-100 border-y border-gray-200/50" />

        {/* 7. Delivery Card (Daraz Style) */}
        <div className="bg-white p-4 space-y-2.5">
          <div className="flex items-start justify-between text-xs">
            <span className="text-gray-500 font-medium shrink-0 pt-0.5">Delivery</span>
            <div className="flex-1 pl-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{deliveryCity} District</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsChangingLocation(!isChangingLocation)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-gray-700 font-medium text-[11px] leading-tight">
                Standard Delivery, Guaranteed {isDhaka ? '1-2 Days' : '2-3 Days'} • <span className="font-bold text-gray-900">{formatPrice(isDhaka ? (settings.deliveryFeeInsideDhaka || 60) : (settings.deliveryFeeOutsideDhaka || 120))}</span>
              </p>
              <p className="text-[10px] text-emerald-700 font-semibold">
                Free delivery on orders over ৳1,000!
              </p>
            </div>
          </div>

          {/* Location switcher toggle */}
          {isChangingLocation && (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <select
                value={deliveryCity}
                onChange={(e) => {
                  setDeliveryCity(e.target.value);
                  setIsChangingLocation(false);
                }}
                className="w-full text-xs font-semibold p-2.5 border border-gray-200 rounded-xl bg-gray-50"
              >
                {BD_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-2 bg-gray-100 border-y border-gray-200/50" />

        {/* 8. Service Card (Daraz Style) */}
        <div className="bg-white p-4 flex items-start justify-between text-xs">
          <span className="text-gray-500 font-medium shrink-0 pt-0.5">Service</span>
          <div className="flex-1 pl-4 space-y-1.5 text-[11px] text-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
              <span className="font-semibold text-gray-900">7 days easy return</span>
              <span className="text-gray-400 text-[10px]">(Change of mind applicable)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
              <span className="font-semibold text-gray-900">100% Authentic Product Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="font-semibold text-gray-900">Cash on Delivery Available Nationwide</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        </div>

        {/* Divider */}
        <div className="h-2 bg-gray-100 border-y border-gray-200/50" />

        {/* 9. Ratings and Reviews Card (Daraz Style) */}
        <div id="m-sec-reviews" className="bg-white p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">Ratings and Reviews</span>
              <span className="text-gray-400">({reviews.length || 24})</span>
            </div>
            <button
              type="button"
              onClick={() => handleTabClick('reviews')}
              className="text-rose-600 font-bold text-xs"
            >
              View All
            </button>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-800">
                {reviews[0]?.user_name || 'Tanvir Ahmed'}
              </span>
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {reviews[0]?.comment || 'Material Quality: 💯 Comfort: 💯 Style: Its really good and authentic! Fast delivery within 24 hours. Very satisfied!'}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-2 bg-gray-100 border-y border-gray-200/50" />

        {/* 10. Product Details & Full Description (Daraz Style) */}
        <div id="m-sec-specs" className="bg-white p-4 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span>Product Details & Highlights</span>
          </h2>
          <div className="text-xs text-gray-700 leading-relaxed space-y-2.5 whitespace-pre-line">
            <p>{product.description}</p>
          </div>

          {/* Highlights */}
          {product.highlights && product.highlights.length > 0 && (
            <div className="bg-rose-50/50 rounded-xl p-3 border border-rose-100/70 space-y-2">
              <span className="text-xs font-bold text-rose-950 uppercase tracking-wider">Key Highlights</span>
              <ul className="space-y-1.5 text-xs text-gray-700">
                {product.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Specifications Table */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-gray-50 p-2.5 font-bold text-gray-800 border-b border-gray-200">
                Specifications
              </div>
              <div className="divide-y divide-gray-100">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="grid grid-cols-2 p-2.5 text-[11px]">
                    <span className="text-gray-500 font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-gray-900 font-semibold">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-2 bg-gray-100 border-y border-gray-200/50" />

        {/* 11. Recommendations (Daraz Style 2-Col Grid) */}
        {relatedProducts.length > 0 && (
          <div id="m-sec-recommendations" className="bg-white p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Recommended for You</h3>
            <div className="grid grid-cols-2 gap-3">
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 💻 DEDICATED DESKTOP VIEW (Rich 2-Column Desktop Layout) */}
      {/* ======================================================== */}
      <div className="hidden md:block max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      
        {/* Breadcrumb */}
        <nav className="text-xs font-semibold text-gray-400 flex items-center gap-2">
          <Link to="/" className="hover:text-emerald-600">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-emerald-600">Shop</Link>
          <span>/</span>
          <span className="text-gray-800 truncate max-w-xs">{product.title}</span>
        </nav>

      {/* Product Main Section: 2 Balanced Columns (Gallery 6 cols | Details & Delivery Buy Box 6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        
        {/* Left Column: Image Gallery (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm p-4 sm:p-6 flex items-center justify-center relative">
            <img
              src={selectedImage || product.images[0] || '/logo.webp'}
              alt={product.title}
              className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-rose-600 text-white font-extrabold text-xs rounded-full shadow-md">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnail list */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-2xl bg-white border-2 overflow-hidden flex-shrink-0 transition ${
                    selectedImage === img ? 'border-emerald-600 shadow-md scale-95' : 'border-gray-100 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Buy Box & Delivery (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Header & Title */}
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-rose-200/80 whitespace-nowrap shrink-0">
                  {product.brand || 'Kintesi'}
                </span>
                {product.sku && (
                  <span className="text-[10px] sm:text-xs font-mono text-gray-500 bg-gray-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap shrink-0">
                    SKU: {product.sku}
                  </span>
                )}
                {product.warranty && (
                  <span className="text-[10px] sm:text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                    <ShieldCheck className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>{product.warranty}</span>
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Product link copied to clipboard!');
                }}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition"
                title="Share link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug">
              {product.title}
            </h1>

            {/* Ratings */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      reviews.length > 0
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-amber-400/30 text-amber-400/40'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-gray-800">
                {reviews.length > 0
                  ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
                  : '5.0'}
              </span>
              <span className="text-xs text-gray-400">
                {reviews.length > 0
                  ? `(${reviews.length} verified rating${reviews.length > 1 ? 's' : ''})`
                  : '(No reviews yet)'}
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-baseline gap-4">
            <span className="text-3xl sm:text-4xl font-black text-emerald-700">
              {formatPrice(currentPrice)}
            </span>
            {product.discount_price && (
              <span className="text-base sm:text-lg text-gray-400 line-through font-semibold">
                {formatPrice(product.price)}
              </span>
            )}
            {discountPercent > 0 && (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                Save {formatPrice(product.price - product.discount_price!)}
              </span>
            )}
          </div>

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-700 uppercase">Select Color:</span>
                <span className="text-emerald-700 font-extrabold">{selectedColor}</span>
              </div>
              <div className="flex items-center gap-3">
                {product.colors.map((c) => {
                  const isSelected = selectedColor === c.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`group relative p-1 rounded-full border-2 transition ${
                        isSelected ? 'border-emerald-600 ring-2 ring-emerald-600/30' : 'border-transparent'
                      }`}
                      title={c.name}
                    >
                      <span
                        className="block w-6 h-6 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: c.hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selection (Fashion & Shoes) */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-700 uppercase">Select Size:</span>
                <span className="text-emerald-700 font-extrabold">{selectedSize}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock Availability */}
          <div className="flex items-center gap-2 text-xs font-bold">
            {product.stock > 0 ? (
              <div className="flex items-center gap-2 text-emerald-700">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span>In Stock ({product.stock} units available)</span>
              </div>
            ) : (
              <span className="text-rose-600">Out of Stock</span>
            )}
          </div>

          {/* Delivery & Address Destination Box (Clean & Prominent) */}
          <div className="bg-emerald-50/40 rounded-2xl border border-emerald-100 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-900 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Delivery to:</span>
              </span>
              <button
                type="button"
                onClick={() => setIsChangingLocation(!isChangingLocation)}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-black underline"
              >
                {isChangingLocation ? 'Close' : 'Change Location'}
              </button>
            </div>

            {isChangingLocation ? (
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">Switch from Address Book:</span>
                  <Link
                    to="/profile"
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold underline"
                  >
                    + Manage Addresses
                  </Link>
                </div>

                {/* Saved Address Cards from Address Book */}
                {addresses && addresses.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      const addrIsDhaka = (addr.city || '').toLowerCase().includes('dhaka');
                      const fee = addrIsDhaka
                        ? (settings.deliveryFeeInsideDhaka || 60)
                        : (settings.deliveryFeeOutsideDhaka || 120);

                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleSelectAddress(addr)}
                          className={`w-full text-left p-2.5 rounded-xl border transition flex items-start justify-between gap-2 ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/30 shadow-xs'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                addr.label === 'Home' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {addr.label}
                              </span>
                              <span className="text-xs font-bold text-gray-900 truncate">
                                {addr.recipient_name} ({addr.city})
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 truncate">
                              {addr.street_address}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-emerald-700 block">
                              {isFreeDeliveryEligible ? 'FREE' : formatPrice(fee)}
                            </span>
                            <span className="text-[9px] text-gray-400">
                              {addrIsDhaka ? '24-48h' : '2-3d'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 bg-white p-2.5 rounded-xl border border-gray-200">
                    No saved addresses yet in Address Book.
                  </p>
                )}

                {/* Or Select Another District */}
                <div className="pt-2 border-t border-gray-200/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-700 block">Or Deliver to Another District:</span>
                  <select
                    value={deliveryCity}
                    onChange={(e) => {
                      setDeliveryCity(e.target.value);
                      setSelectedAddressId(null);
                      setIsChangingLocation(false);
                      toast.success(`Delivery destination changed to ${e.target.value}`);
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Dhaka">Dhaka (ঢাকা) - ৳60 Delivery</option>
                    {['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'].map((div) => {
                      const dists = BD_DISTRICTS.filter((d) => d.division === div && d.name !== 'Dhaka');
                      return (
                        <optgroup key={div} label={`── ${div} Division (৳120) ──`}>
                          {dists.map((d) => (
                            <option key={d.name} value={d.name}>
                              {d.name} ({d.bnName})
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs bg-white p-3.5 rounded-xl border border-emerald-100/80 shadow-xs">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {activeAddress?.label && (
                      <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        {activeAddress.label}
                      </span>
                    )}
                    <span className="font-extrabold text-gray-900 truncate text-xs">
                      {activeAddress ? `${activeAddress.city}` : `${deliveryCity} District`}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">
                    {activeAddress ? activeAddress.street_address : 'Standard shipping destination'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-black text-emerald-700 text-sm block">
                    {effectiveDeliveryFee === 0 ? 'FREE' : formatPrice(effectiveDeliveryFee)}
                  </span>
                  <span className="text-[10px] text-gray-400 block font-medium">
                    {isDhaka ? 'Standard Shipping' : 'Courier Delivery'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-600 pt-1">
              <span className="flex items-center gap-1 font-semibold text-gray-700">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cash on Delivery Available</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-gray-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Authentic</span>
              </span>
            </div>

            {/* Custom Product Delivery Note & Guidelines */}
            {product.delivery_note && (
              <div className="mt-3 p-3.5 bg-amber-50/90 border-2 border-amber-300/90 rounded-2xl space-y-1 shadow-xs">
                <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Delivery Note & Special Instruction (ডেলিভারি নোট):</span>
                </div>
                <p className="text-xs text-amber-950 font-medium leading-relaxed pl-5.5 whitespace-pre-line">
                  {product.delivery_note}
                </p>
              </div>
            )}
          </div>

          {/* Quantity and Order Actions (Desktop Only - Mobile uses Dynamic Island bottom bar) */}
          <div className="hidden md:block space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Quantity</span>
              <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-xs overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-bold text-gray-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-2.5 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {quantity > 1 && (
                <span className="text-xs text-gray-500 font-semibold">
                  Subtotal: <strong className="text-rose-700">{formatPrice(currentPrice * quantity)}</strong>
                </span>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="py-4 px-6 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 text-sm cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="py-4 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 text-sm cursor-pointer"
              >
                <Zap className="w-5 h-5" />
                <span>Buy It Now</span>
              </button>
            </div>
          </div>

            {/* Wishlist & Chat with Seller Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => toggleWishlist(product)}
                className={`py-3 px-4 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                  isInWishlist(product.id)
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{isInWishlist(product.id) ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    toast.error('সেলার সাথে লাইভ চ্যাট করতে দয়া করে প্রথমে সাইন ইন বা রেজিস্ট্রেশন করুন।');
                    openAuthModal('login');
                    return;
                  }
                  openChat({
                    product: {
                      id: product.id,
                      title: product.title,
                      price: currentPrice,
                      image: selectedImage || product.images?.[0],
                      sku: product.sku,
                    },
                  });
                }}
                className="py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-xs active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Chat with Seller</span>
              </button>
            </div>

          {/* Quick Perks Bar */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100 text-center">
            <div className="p-3 bg-gray-50 rounded-2xl">
              <Truck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-gray-800">Fast Delivery</p>
              <p className="text-[10px] text-gray-400">{isDhaka ? '24-48 Hours' : '2-3 Days'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-gray-800">Authentic</p>
              <p className="text-[10px] text-gray-400">100% Genuine</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl">
              <RotateCcw className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-gray-800">Easy Return</p>
              <p className="text-[10px] text-gray-400">7 Days Guarantee</p>
            </div>
          </div>

        </div>
      </div>

      {/* Section 1: Comprehensive Specifications & Technical Details Card (Strictly Isolated by Category Mode) */}
      {(() => {
        const cat = (product.category_id || '').toLowerCase();
        const hasHardwareSpecs = Boolean(product.specifications && Object.keys(product.specifications).length > 0);

        const isGadget = Boolean(
          hasHardwareSpecs ||
          cat.includes('smartphones') ||
          cat.includes('laptops') ||
          cat.includes('audio') ||
          cat.includes('cameras') ||
          cat.includes('watches') ||
          cat.includes('gadget') ||
          cat.includes('electronic') ||
          cat.includes('tech')
        );

        const isGroceries = Boolean(
          !isGadget && (
            cat.includes('groceries') ||
            cat.includes('food') ||
            cat.includes('daily-essentials') ||
            cat.includes('pantry')
          )
        );

        const isFashion = Boolean(
          !isGadget && !isGroceries && (
            cat.includes('fashion') ||
            cat.includes('footwear') ||
            cat.includes('apparel') ||
            cat.includes('clothing') ||
            cat.includes('saree') ||
            cat.includes('kurti') ||
            cat.includes('shoes') ||
            product.fabric ||
            product.fit_type ||
            product.gender
          )
        );

        // Check if there is any specification to show for this specific mode
        const shouldShow = isGadget
          ? Boolean(product.warranty || product.origin || hasHardwareSpecs)
          : isGroceries
          ? Boolean(product.fabric || product.warranty || product.origin || product.care_instructions || product.fit_type)
          : isFashion
          ? Boolean(product.fabric || product.fit_type || product.gender || product.origin || product.care_instructions)
          : false;

        if (!shouldShow) return null;

        return (
          <section className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isGadget
                      ? 'bg-cyan-50 text-cyan-600'
                      : isGroceries
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-pink-50 text-pink-600'
                  }`}
                >
                  {isGadget ? (
                    <Cpu className="w-5 h-5" />
                  ) : isGroceries ? (
                    <Sparkles className="w-5 h-5" />
                  ) : (
                    <Shirt className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    {isGadget
                      ? 'Technical Specifications & Hardware Details'
                      : isGroceries
                      ? 'Food & Grocery Specifications (খাদ্য ও পুষ্টি বিবরণ)'
                      : 'Specifications & Material Details (পোশাক ও ফ্যাশন বিবরণ)'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isGadget
                      ? 'Hardware performance, connectivity & official warranty'
                      : isGroceries
                      ? 'Net weight, shelf life, storage & origin'
                      : 'Fabric craftsmanship, fit type & care instructions'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold font-mono">
                SKU: {product.sku || 'KT-' + product.id.slice(0, 6).toUpperCase()}
              </span>
            </div>

            {/* 1. GADGET & HARDWARE DETAILS ONLY */}
            {isGadget && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                {product.warranty && (
                  <div className="p-4 bg-cyan-50/40 rounded-2xl space-y-1 border border-cyan-100">
                    <span className="text-cyan-700 font-bold uppercase text-[10px] tracking-wider">Official Warranty</span>
                    <p className="font-black text-gray-900 text-sm">{product.warranty}</p>
                  </div>
                )}
                {product.origin && (
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1 border border-gray-100">
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Device Origin / Variant</span>
                    <p className="font-black text-gray-900 text-sm">{product.origin}</p>
                  </div>
                )}
                {product.specifications &&
                  Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="p-4 bg-gray-50 rounded-2xl space-y-1 border border-gray-100">
                      <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">{key}</span>
                      <p className="font-black text-gray-900 text-sm">{val}</p>
                    </div>
                  ))}
              </div>
            )}

            {/* 2. FASHION & APPAREL DETAILS ONLY */}
            {isFashion && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                {product.fabric && (
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1 border border-gray-100">
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Fabric / Material</span>
                    <p className="font-black text-gray-900 text-sm">{product.fabric}</p>
                  </div>
                )}
                {product.fit_type && (
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1 border border-gray-100">
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Fit Type</span>
                    <p className="font-black text-gray-900 text-sm">{product.fit_type}</p>
                  </div>
                )}
                {product.gender && (
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1 border border-gray-100">
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Department</span>
                    <p className="font-black text-gray-900 text-sm">{product.gender}</p>
                  </div>
                )}
                {product.origin && (
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1 border border-gray-100">
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Origin</span>
                    <p className="font-black text-gray-900 text-sm">{product.origin}</p>
                  </div>
                )}
                {product.care_instructions && (
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1 border border-gray-100 sm:col-span-2">
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Care Instructions</span>
                    <p className="font-bold text-gray-800 text-xs leading-relaxed">{product.care_instructions}</p>
                  </div>
                )}
              </div>
            )}

            {/* 3. GROCERIES & FOOD DETAILS ONLY */}
            {isGroceries && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                {product.fabric && (
                  <div className="p-4 bg-emerald-50/40 rounded-2xl space-y-1 border border-emerald-100">
                    <span className="text-emerald-700 font-bold uppercase text-[10px] tracking-wider">Net Weight / Volume</span>
                    <p className="font-black text-gray-900 text-sm">{product.fabric}</p>
                  </div>
                )}
                {product.warranty && (
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1 border border-gray-100">
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Shelf Life / Expiry</span>
                    <p className="font-black text-gray-900 text-sm">{product.warranty}</p>
                  </div>
                )}
                {product.origin && (
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1 border border-gray-100">
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Origin / Sourced From</span>
                    <p className="font-black text-gray-900 text-sm">{product.origin}</p>
                  </div>
                )}
                {product.fit_type && (
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1 border border-gray-100">
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Certification / Quality</span>
                    <p className="font-black text-gray-900 text-sm">{product.fit_type}</p>
                  </div>
                )}
                {product.care_instructions && (
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1 border border-gray-100 sm:col-span-2">
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Storage Instructions</span>
                    <p className="font-bold text-gray-800 text-xs leading-relaxed">{product.care_instructions}</p>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })()}

      {/* Section 2: Detailed Description & Key Highlights */}
      <section className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>Product Overview & Description (পণ্যের বিস্তারিত বিবরণ)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Authentic craftsmanship, usage instructions and highlights</p>
        </div>

        <div className="space-y-6">
          {/* Main Description */}
          {product.description && (
            <div className="text-sm text-gray-700 leading-relaxed space-y-3 whitespace-pre-line bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
              <p>{product.description}</p>
            </div>
          )}

          {/* Key Bullet Highlights */}
          {product.highlights && product.highlights.length > 0 && (
            <div className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-100 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" /> Key Features & Guarantee Highlights
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs font-semibold text-emerald-950 bg-white/80 p-3 rounded-xl border border-emerald-100/60">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-sm space-y-8">
        <div className="border-b border-gray-100 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">Customer Ratings & Reviews</h3>
            <p className="text-xs text-gray-500 mt-0.5">Verified purchaser feedback</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-emerald-700">
              {reviews.length > 0
                ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
                : '5.0'}
            </span>
            <div className="text-xs text-gray-400">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      reviews.length > 0
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-amber-400/30 text-amber-400/40'
                    }`}
                  />
                ))}
              </div>
              <p>{reviews.length > 0 ? `Based on ${reviews.length} review${reviews.length > 1 ? 's' : ''}` : 'No reviews yet'}</p>
            </div>
          </div>
        </div>

        {/* Verified Purchase Policy Note */}
        <div className="flex items-center gap-3 p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl text-xs text-emerald-950 font-medium">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-xs">100% Verified Buyer Reviews Only</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              To ensure 100% authenticity, customer reviews can only be submitted after receiving the delivered product from your <strong>My Orders</strong> page.
            </p>
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-4 divide-y divide-gray-100">
            {reviews.map((rev) => (
              <div key={rev.id} className="pt-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900">{rev.name}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> Verified Delivered Purchase
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">{rev.date}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200 space-y-1.5">
            <Star className="w-6 h-6 text-gray-300 mx-auto fill-gray-200" />
            <p className="text-sm font-bold text-gray-700">No Customer Reviews Yet</p>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Customer reviews will appear here once verified buyers receive this delivered product.
            </p>
          </div>
        )}
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-2xl font-extrabold text-gray-900">Similar Items You May Like</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      </div>

      {/* Apple-style Dynamic Bottom Island for Mobile (Ultra-Premium White Glassmorphic) */}
      {product && (
        <aside 
          aria-label="Dynamic Bottom Island for Quick Purchase"
          className="fixed bottom-3 left-3 right-3 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-2xl border border-gray-200/90 text-gray-900 shadow-[0_14px_45px_rgba(0,0,0,0.14)] rounded-full p-2 px-3 flex items-center justify-between gap-2.5 md:hidden animate-in slide-in-from-bottom duration-300 ring-1 ring-black/[0.04]"
        >
          {/* Mini product thumbnail & price */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img
              src={product.images?.[0] || '/logo.webp'}
              alt={product.title}
              className="w-9 h-9 rounded-full object-cover bg-gray-50 border border-gray-200/90 p-0.5 shrink-0 shadow-xs"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 leading-tight">
                <span className="text-xs font-black text-rose-600">
                  {formatPrice(currentPrice)}
                </span>
                {product.discount_price && (
                  <span className="text-[10px] text-gray-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-700 font-bold truncate leading-tight mt-0.5">
                {product.title}
              </p>
            </div>
          </div>

          {/* Inline mini quantity selector */}
          <div className="flex items-center bg-gray-100/90 rounded-full px-1.5 py-0.5 border border-gray-200/80 shrink-0 shadow-inner">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-5 h-5 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white transition active:scale-90 cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <span className="w-4 text-center text-xs font-black text-gray-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              disabled={quantity >= product.stock}
              className="w-5 h-5 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white transition active:scale-90 disabled:opacity-30 cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Island Action buttons: Cart & Order (English Premium UI) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full flex items-center justify-center active:scale-95 transition disabled:opacity-40 border border-gray-200/80 shadow-xs cursor-pointer"
              title="Add to Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
              className="h-8 px-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold rounded-full text-xs flex items-center justify-center gap-1 active:scale-95 transition disabled:opacity-40 shadow-md shadow-rose-600/30 cursor-pointer"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>{product.stock > 0 ? 'Buy Now' : 'Sold Out'}</span>
            </button>
          </div>
        </aside>
      )}

    </div>
  );
};

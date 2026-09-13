import React, { useState, useEffect, useRef } from 'react';
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
import { formatPrice, calculateDiscount } from '../lib/utils';
import { ProductCard } from '../components/common/ProductCard';
import { trackProductView } from '../lib/recommendationEngine';
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
  ChevronLeft,
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

  // Review state - Clean verified reviews only
  const [reviews, setReviews] = useState<any[]>([]);

  // Delivery & Address Destination (Truthful - No guessed address)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isChangingLocation, setIsChangingLocation] = useState(false);

  // Ref for the on-page Buy Actions block (Quantity, Add to Cart, Buy Now)
  const buyActionsRef = useRef<HTMLDivElement | null>(null);

  // Touch Swipe Gesture State for Product Images
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const productImages = product?.images && product.images.length > 0 ? product.images : [selectedImage || '/logo.webp'];
  const currentImageIndex = productImages.indexOf(selectedImage) !== -1 ? productImages.indexOf(selectedImage) : 0;

  const handleNextImage = () => {
    if (productImages.length <= 1) return;
    const nextIdx = (currentImageIndex + 1) % productImages.length;
    setSelectedImage(productImages[nextIdx]);
  };

  const handlePrevImage = () => {
    if (productImages.length <= 1) return;
    const prevIdx = (currentImageIndex - 1 + productImages.length) % productImages.length;
    setSelectedImage(productImages[prevIdx]);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Check if horizontal swipe is dominant and exceeds 35px threshold
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) {
        // Swiped Left -> Next image
        handleNextImage();
      } else {
        // Swiped Right -> Previous image
        handlePrevImage();
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Dynamic Island is hidden as long as on-page Buy Actions block is visible on display.
  // It ONLY shows when this block has scrolled off the top of the screen (not on display).
  useEffect(() => {
    const handleScroll = () => {
      if (!buyActionsRef.current) {
        setShowStickyBar(window.scrollY > 400);
        return;
      }
      const rect = buyActionsRef.current.getBoundingClientRect();
      const isVisibleOnDisplay = rect.top < window.innerHeight && rect.bottom > 0;

      // When visible on display -> hide dynamic island.
      // When NOT visible and user has scrolled past it downwards (rect.bottom <= 0) -> show dynamic island!
      setShowStickyBar(!isVisibleOnDisplay && rect.bottom <= 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [product]);

  useEffect(() => {
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
    } else if (addresses.length > 0) {
      setSelectedAddressId(addresses[0].id);
    } else {
      setSelectedAddressId(null);
    }
  }, [defaultAddress, addresses]);

  const activeAddress = addresses.find((a) => a.id === selectedAddressId) || defaultAddress || null;
  const hasSavedAddress = Boolean(activeAddress);

  const deliveryCity = activeAddress?.city ? activeAddress.city.replace(/\s*\(.*?\)/, '').trim() : '';
  const isDhaka = deliveryCity ? deliveryCity.toLowerCase().includes('dhaka') : false;

  const handleSelectAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setIsChangingLocation(false);
    toast.success(`Delivery address switched to "${addr.label || addr.city}"`);
  };

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
          trackProductView(localProd);
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
          trackProductView(found);
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
    <div className="bg-[#f6f7f9] sm:bg-transparent min-h-screen py-3 sm:py-8 pb-28 md:pb-12">
      <div className="max-w-[1440px] mx-auto px-2.5 sm:px-6 lg:px-8 space-y-3 sm:space-y-8">
        
        {/* Product Main Section: 2 Balanced Columns (Gallery 6 cols | Details & Delivery Buy Box 6 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 lg:gap-10 items-start">
          
          {/* Left Column: Image Gallery with Touch Swipe Support (6 cols) */}
          <div className="lg:col-span-6 space-y-3">
            <div 
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="aspect-square bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden shadow-xs p-4 sm:p-6 flex items-center justify-center relative select-none touch-pan-y group"
            >
              <img
                src={selectedImage || product.images[0] || '/logo.webp'}
                alt={product.title}
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-300 pointer-events-none"
              />
              {discountPercent > 0 && (
                <span className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-rose-600 text-white font-extrabold text-[11px] sm:text-xs rounded-full shadow-xs z-10">
                  {discountPercent}% OFF
                </span>
              )}
              {productImages.length > 1 && (
                <>
                  {/* Subtle navigation chevrons */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition active:scale-90 cursor-pointer z-10 opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition active:scale-90 cursor-pointer z-10 opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Discrete swipe counter pill */}
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full shadow-xs z-10 select-none">
                    {currentImageIndex + 1} / {productImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail list */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 px-0.5">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white border-2 overflow-hidden flex-shrink-0 transition cursor-pointer ${
                      selectedImage === img ? 'border-emerald-600 shadow-sm scale-95' : 'border-gray-200/80 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Structured E-Commerce Cards (6 cols) */}
          <div className="lg:col-span-6 space-y-3 sm:space-y-4">
            
            {/* Card 1: Pricing, Title & Rating (Daraz-style clean header card) */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 shadow-xs space-y-3">
              
              {/* Price row: Big prominent price + original strikethrough + discount badge */}
              <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3">
                <span className="text-2xl sm:text-3xl font-black text-rose-600">
                  {formatPrice(currentPrice)}
                </span>
                {product.discount_price && (
                  <span className="text-sm sm:text-base text-gray-400 line-through font-semibold">
                    {formatPrice(product.price)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-xs font-extrabold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md">
                    -{discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Product Title */}
              <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 leading-snug">
                {product.title}
              </h1>

              {/* Badges & Rating Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-gray-900">
                      {reviews.length > 0
                        ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
                        : '5.0'}
                    </span>
                    <span className="text-gray-400 text-[11px]">
                      ({reviews.length})
                    </span>
                  </div>

                  <span className="text-gray-200">•</span>

                  <span className="font-medium text-gray-600">
                    Brand: <strong className="text-gray-900">{product.brand || 'Kintesi'}</strong>
                  </span>

                  {product.warranty && (
                    <>
                      <span className="text-gray-200 hidden sm:inline">•</span>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 hidden sm:inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-amber-600" />
                        <span>{product.warranty}</span>
                      </span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Product link copied to clipboard!');
                  }}
                  className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition inline-flex items-center gap-1 cursor-pointer"
                  title="Share link"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium hidden sm:inline">Share</span>
                </button>
              </div>
            </div>

            {/* Card 2: Variations (Color, Size), Quantity & Purchase Actions */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 shadow-xs space-y-4">
              
              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-500 uppercase tracking-wider text-[11px]">Color Family:</span>
                    <span className="text-gray-900 font-extrabold">{selectedColor}</span>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {product.colors.map((c) => {
                      const isSelected = selectedColor === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setSelectedColor(c.name)}
                          className={`group relative p-1 rounded-full border-2 transition cursor-pointer ${
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

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-500 uppercase tracking-wider text-[11px]">Size:</span>
                    <span className="text-gray-900 font-extrabold">{selectedSize}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((sz) => {
                      const isSelected = selectedSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
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

              {/* Buy Actions Block (Quantity, Stock & Purchase Buttons) */}
              <div ref={buyActionsRef} className="space-y-4">
                {/* Quantity Selector & Stock Availability */}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Quantity</span>
                    <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3.5 text-xs font-bold text-gray-800">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        disabled={quantity >= product.stock}
                        className="p-2 hover:bg-gray-100 text-gray-600 transition cursor-pointer disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Availability</span>
                    {product.stock > 0 ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 justify-end mt-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
                        <span>In Stock ({product.stock} units)</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-600 mt-1 block">Out of Stock</span>
                    )}
                  </div>
                </div>

                {/* Main Action Buttons (Desktop & Mobile - Always accessible) */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className="py-3 px-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 text-xs sm:text-sm cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={product.stock <= 0}
                    className="py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl transition shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 text-xs sm:text-sm cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Delivery & Service Protection (Truthful - No guessed address) */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-900 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Delivery Destination</span>
                </span>
                {hasSavedAddress && addresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIsChangingLocation(!isChangingLocation)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                  >
                    {isChangingLocation ? 'Done' : 'Switch Address'}
                  </button>
                )}
              </div>

              {hasSavedAddress && activeAddress ? (
                // User has a real saved address in Address Book
                isChangingLocation ? (
                  <div className="pt-1 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">Select from Address Book:</span>
                      <Link
                        to="/profile"
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold underline"
                      >
                        + Manage Addresses
                      </Link>
                    </div>
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
                            className={`w-full text-left p-2.5 rounded-xl border transition flex items-start justify-between gap-2 cursor-pointer ${
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
                                  {addr.label || 'Saved'}
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
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/70">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                          activeAddress.label === 'Home' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {activeAddress.label || 'Saved'}
                        </span>
                        <span className="font-extrabold text-gray-900 truncate text-xs">
                          {activeAddress.city}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">
                        {activeAddress.recipient_name} • {activeAddress.street_address}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-emerald-700 text-sm block">
                        {effectiveDeliveryFee === 0 ? 'FREE' : formatPrice(effectiveDeliveryFee)}
                      </span>
                      <span className="text-[10px] text-gray-400 block font-medium">
                        {isDhaka ? '24-48h Delivery' : '2-3 Days Courier'}
                      </span>
                    </div>
                  </div>
                )
              ) : (
                // Truthful fallback: No address set in Address Book. No guessing!
                <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/80 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-gray-900">
                        আপনার অ্যাড্রেস বুকে কোনো ঠিকানা সেট করা নেই
                      </p>
                      <p className="text-[11px] text-gray-500">
                        সঠিক ডেলিভারি চার্জ ও সময় দেখতে ঠিকানা যুক্ত করুন
                      </p>
                    </div>
                    {user ? (
                      <Link
                        to="/profile"
                        className="shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-xs inline-flex items-center gap-1"
                      >
                        <span>+ Set Address</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openAuthModal('login')}
                        className="shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Login to Set</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-200/70 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Inside Dhaka: <strong className="text-gray-800">৳{settings.deliveryFeeInsideDhaka || 60}</strong></span>
                    <span>•</span>
                    <span>Outside Dhaka: <strong className="text-gray-800">৳{settings.deliveryFeeOutsideDhaka || 120}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">Free on ৳{settings.freeShippingThreshold || 1000}+</span>
                  </div>
                </div>
              )}

              {/* Service Guarantees */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
                <div className="p-2 bg-gray-50 rounded-xl space-y-0.5">
                  <CreditCard className="w-4 h-4 text-emerald-600 mx-auto" />
                  <p className="text-[11px] font-bold text-gray-800">Cash on Delivery</p>
                  <p className="text-[9px] text-gray-400">Available</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-xl space-y-0.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto" />
                  <p className="text-[11px] font-bold text-gray-800">100% Authentic</p>
                  <p className="text-[9px] text-gray-400">Verified</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-xl space-y-0.5">
                  <RotateCcw className="w-4 h-4 text-emerald-600 mx-auto" />
                  <p className="text-[11px] font-bold text-gray-800">7 Days Return</p>
                  <p className="text-[9px] text-gray-400">Guarantee</p>
                </div>
              </div>

              {/* Custom Delivery Note */}
              {product.delivery_note && (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Delivery Note (ডেলিভারি নোট):</span>
                  </div>
                  <p className="text-xs text-amber-950 font-medium leading-relaxed pl-5 whitespace-pre-line">
                    {product.delivery_note}
                  </p>
                </div>
              )}
            </div>

            {/* Card 4: Quick Assistance & Seller Chat */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-3 sm:p-4 shadow-xs grid grid-cols-2 gap-2">
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
                className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Chat Seller</span>
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  isInWishlist(product.id)
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{isInWishlist(product.id) ? 'Saved' : 'Wishlist'}</span>
              </button>
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
      {product && showStickyBar && (
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

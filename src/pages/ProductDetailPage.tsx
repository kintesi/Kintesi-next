import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockData';
import { supabase } from '../lib/supabase';
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
  MessageCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
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

  // Review state - Clean verified reviews only
  const [reviews, setReviews] = useState<any[]>([]);

  // Delivery & Address Destination
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [deliveryCity, setDeliveryCity] = useState('Dhaka');
  const [isChangingLocation, setIsChangingLocation] = useState(false);

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
      setLoading(true);
      try {
        const savedCustom: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
        const customMatch = savedCustom.find(
          (p) => (p.slug === slug || p.id === slug) && !p.id?.startsWith('prod-')
        );
        const localProd = customMatch;

        if (localProd) {
          setProduct(localProd);
          setSelectedImage(localProd.images?.[0] || '/logo.webp');
          if (localProd.sizes && localProd.sizes.length > 0) setSelectedSize(localProd.sizes[0]);
          if (localProd.colors && localProd.colors.length > 0) setSelectedColor(localProd.colors[0].name);
        }

        const isUUID = (str?: string) =>
          str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) : false;

        let query = supabase.from('products').select('*');
        if (isUUID(slug)) {
          query = query.or(`slug.eq.${slug},id.eq.${slug}`);
        } else {
          query = query.eq('slug', slug);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          console.warn('Supabase product query fallback:', error.message);
        }

        if (data) {
          let parsedSizes: string[] = [];
          if (Array.isArray(data.sizes)) {
            parsedSizes = data.sizes;
          } else if (typeof data.sizes === 'string') {
            try { parsedSizes = JSON.parse(data.sizes); } catch { parsedSizes = data.sizes.split(',').map((s: string) => s.trim()); }
          }

          let parsedColors: { name: string; hex: string }[] = [];
          if (Array.isArray(data.colors)) {
            parsedColors = data.colors;
          } else if (typeof data.colors === 'string') {
            try { parsedColors = JSON.parse(data.colors); } catch {}
          }

          let parsedHighlights: string[] = [];
          if (Array.isArray(data.highlights)) {
            parsedHighlights = data.highlights;
          } else if (typeof data.highlights === 'string') {
            try { parsedHighlights = JSON.parse(data.highlights); } catch { parsedHighlights = [data.highlights]; }
          }

          // If edited in localStorage, respect admin's direct modifications
          if (customMatch) {
            parsedSizes = customMatch.sizes || parsedSizes;
            parsedColors = customMatch.colors || parsedColors;
            parsedHighlights = customMatch.highlights || parsedHighlights;
          } else {
            if (parsedSizes.length === 0 && localProd?.sizes) parsedSizes = localProd.sizes;
            if (parsedColors.length === 0 && localProd?.colors) parsedColors = localProd.colors;
            if (parsedHighlights.length === 0 && localProd?.highlights) parsedHighlights = localProd.highlights;
          }

          const mergedProduct: Product = {
            ...data,
            sizes: parsedSizes,
            colors: parsedColors,
            highlights: parsedHighlights.length > 0 ? parsedHighlights : [
              '100% Genuine Brand Product Guarantee with Invoice',
              'Fast 24-48h Dispatch with Live Tracking',
              '7 Days Hassle-Free Replacement Policy'
            ],
            sku: customMatch?.sku || data.sku || localProd?.sku || '',
            warranty: customMatch?.warranty ?? data.warranty ?? localProd?.warranty ?? '',
            delivery_note: customMatch?.delivery_note ?? data.delivery_note ?? localProd?.delivery_note ?? '',
            images: (customMatch?.images && customMatch.images.length > 0) ? customMatch.images : (data.images && data.images.length > 0 ? data.images : localProd?.images || ['/logo.webp']),
          };

          setProduct(mergedProduct);
          setSelectedImage(mergedProduct.images?.[0] || '/logo.webp');
          if (mergedProduct.sizes && mergedProduct.sizes.length > 0) setSelectedSize(mergedProduct.sizes[0]);
          if (mergedProduct.colors && mergedProduct.colors.length > 0) setSelectedColor(mergedProduct.colors[0].name);
        }

        // Fetch all products for related recommendation
        const { data: all } = await supabase.from('products').select('*');
        const mergedAll = [...savedCustom, ...(all || []), ...INITIAL_PRODUCTS];
        // Unique by id/slug
        const uniqueAll = Array.from(new Map(mergedAll.map((p) => [p.slug || p.id, p])).values());
        setAllProducts(uniqueAll);

        // Load only real customer submitted reviews from storage
        const targetId = data?.id || localProd?.id;
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
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
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
    addToCart(product, quantity, selectedColor, selectedSize);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedColor, selectedSize);
    navigate('/checkout');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {product.brand || 'Kintesi'}
                </span>
                {product.sku && (
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    SKU: {product.sku}
                  </span>
                )}
                {product.warranty && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    {product.warranty}
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
                    {isDhaka ? '24-48 Hours' : '2-3 Days'}
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

          {/* Quantity and Order Actions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Quantity</span>
              <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-xs overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 hover:bg-gray-100 text-gray-600 transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-bold text-gray-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-2.5 hover:bg-gray-100 text-gray-600 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {quantity > 1 && (
                <span className="text-xs text-gray-500 font-semibold">
                  Subtotal: <strong className="text-emerald-700">{formatPrice(currentPrice * quantity)}</strong>
                </span>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="py-4 px-6 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 text-sm"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 text-sm"
              >
                <Zap className="w-5 h-5" />
                <span>Buy It Now</span>
              </button>
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
                onClick={() =>
                  openChat({
                    product: {
                      id: product.id,
                      title: product.title,
                      price: currentPrice,
                      image: selectedImage || product.images?.[0],
                      sku: product.sku,
                    },
                  })
                }
                className="py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-xs active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Chat with Seller</span>
              </button>
            </div>
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

      {/* Section 1: Comprehensive Specifications & Material Details Card */}
      <section className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Specifications & Material Details</h3>
              <p className="text-xs text-gray-500">Fabric craftsmanship, dimensions & technical data</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold font-mono">
            SKU: {product.sku || 'CF-' + product.id.slice(0, 6).toUpperCase()}
          </span>
        </div>

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
              <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Country of Origin</span>
              <p className="font-black text-gray-900 text-sm">{product.origin}</p>
            </div>
          )}

          {product.warranty && (
            <div className="p-4 bg-gray-50 rounded-2xl space-y-1 border border-gray-100">
              <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Warranty Period</span>
              <p className="font-black text-gray-900 text-sm">{product.warranty}</p>
            </div>
          )}

          {product.care_instructions && (
            <div className="p-4 bg-gray-50 rounded-2xl space-y-1 border border-gray-100 sm:col-span-2">
              <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Care & Maintenance</span>
              <p className="font-bold text-gray-800 text-xs leading-relaxed">{product.care_instructions}</p>
            </div>
          )}

          {/* Dynamic Specifications */}
          {product.specifications &&
            Object.entries(product.specifications).map(([key, val]) => (
              <div key={key} className="p-4 bg-gray-50 rounded-2xl space-y-1 border border-gray-100">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">{key}</span>
                <p className="font-black text-gray-900 text-sm">{val}</p>
              </div>
            ))}
        </div>
      </section>

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
  );
};

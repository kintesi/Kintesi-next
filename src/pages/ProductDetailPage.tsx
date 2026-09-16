import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/mockData';
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
import { ShowcaseStrip } from '../components/home/ShowcaseStrip';
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
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { defaultAddress, addresses } = useAddress();
  const { settings } = useSettings();
  const { setActiveProductContext } = useChat();
  const { t, language } = useLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedCustomAttributes, setSelectedCustomAttributes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isAddedAnimation, setIsAddedAnimation] = useState(false);

  // Review state - Clean verified reviews only
  const [reviews, setReviews] = useState<any[]>([]);

  const phone = settings?.helplinePhone?.trim() || '01902593390';
  const cleanPhoneForWhatsApp = phone.replace(/\D/g, '').replace(/^0/, '880');

  // Delivery & Address Destination (Truthful - No guessed address)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isChangingLocation, setIsChangingLocation] = useState(false);

  // Ref for the on-page Buy Actions block (Quantity, Add to Cart, Buy Now)
  const buyActionsRef = useRef<HTMLDivElement | null>(null);

  // Touch Swipe Gesture State for Product Images
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const isRealColorList = Boolean(
    product?.colors &&
    product.colors.length > 0 &&
    !product.colors.every((c) => !c || !c.name || (typeof c.name === 'string' && c.name.toLowerCase() === 'default'))
  );

  const activeColorObj = isRealColorList ? product?.colors?.find((c) => c && c.name === selectedColor) : null;
  const colorSpecificImages = (activeColorObj?.images && activeColorObj.images.length > 0)
    ? activeColorObj.images
    : (activeColorObj?.image ? [activeColorObj.image] : null);
  const productImages = colorSpecificImages || (product?.images && product.images.length > 0 ? product.images : [selectedImage || '/logo.webp']);
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

  const isFreeDeliveryEligible = Boolean(
    settings.freeShippingThreshold &&
    settings.freeShippingThreshold > 0 &&
    product &&
    (product.discount_price || product.price) * quantity >= settings.freeShippingThreshold
  );

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
          const hasRealColorsLocal = Boolean(
            localProd.colors &&
            localProd.colors.length > 0 &&
            !localProd.colors.every((c) => !c || !c.name || (typeof c.name === 'string' && c.name.toLowerCase() === 'default'))
          );
          if (hasRealColorsLocal && localProd.colors && localProd.colors.length > 0) {
            setSelectedColor(localProd.colors[0]?.name || '');
            if (localProd.colors[0]?.image) setSelectedImage(localProd.colors[0].image);
          } else {
            setSelectedColor('');
          }
          const customAttrs: any[] = localProd.custom_attributes || (localProd.specifications as any)?.custom_attributes || [];
          if (customAttrs.length > 0) {
            const initialAttrs: Record<string, string> = {};
            customAttrs.forEach((a) => {
              if (a?.attributeName && !initialAttrs[a.attributeName]) {
                initialAttrs[a.attributeName] = a.name;
              }
            });
            setSelectedCustomAttributes(initialAttrs);
          }
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
          const hasRealColorsFound = Boolean(
            found.colors &&
            found.colors.length > 0 &&
            !found.colors.every((c) => !c || !c.name || (typeof c.name === 'string' && c.name.toLowerCase() === 'default'))
          );
          if (hasRealColorsFound && found.colors && found.colors.length > 0) {
            setSelectedColor(found.colors[0]?.name || '');
            const firstColorImg = (found.colors[0]?.images && found.colors[0].images.length > 0)
              ? found.colors[0].images[0]
              : found.colors[0]?.image;
            if (firstColorImg) setSelectedImage(firstColorImg);
          } else {
            setSelectedColor('');
          }
          const customAttrs: any[] = found.custom_attributes || (found.specifications as any)?.custom_attributes || [];
          if (customAttrs.length > 0) {
            const initialAttrs: Record<string, string> = {};
            customAttrs.forEach((a) => {
              if (a.attributeName && !initialAttrs[a.attributeName]) {
                initialAttrs[a.attributeName] = a.name;
              }
            });
            setSelectedCustomAttributes(initialAttrs);
          }
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

  // Compute active variant pricing based on selected color or custom attribute
  let activeVariantPrice: number | null = null;
  let activeVariantRegularPrice: number | null = null;
  let activeVariantDiscountPercent: number | null = null;

  if (activeColorObj) {
    if (typeof activeColorObj.price === 'number' && activeColorObj.price > 0) {
      activeVariantRegularPrice = activeColorObj.price;
      activeVariantPrice = (typeof activeColorObj.discount_price === 'number' && activeColorObj.discount_price > 0)
        ? activeColorObj.discount_price
        : activeColorObj.price;
      if (typeof activeColorObj.discount_percent === 'number' && activeColorObj.discount_percent > 0) {
        activeVariantDiscountPercent = activeColorObj.discount_percent;
      }
    }
  }

  const customAttrsList: any[] = product?.custom_attributes || (product?.specifications as any)?.custom_attributes || [];
  for (const [attrName, optName] of Object.entries(selectedCustomAttributes)) {
    const matched = customAttrsList.find((a) => a.attributeName === attrName && a.name === optName);
    if (matched && typeof matched.price === 'number' && matched.price > 0) {
      activeVariantPrice = matched.price;
      activeVariantRegularPrice = matched.price;
    }
  }

  const baseRegularPrice = activeVariantRegularPrice || (product ? product.price : 0);
  const currentPrice = activeVariantPrice !== null
    ? activeVariantPrice
    : (product ? (product.discount_price || product.price) : 0);

  const discountPercent = activeVariantDiscountPercent !== null
    ? activeVariantDiscountPercent
    : (baseRegularPrice > currentPrice
        ? Math.round(((baseRegularPrice - currentPrice) / baseRegularPrice) * 100)
        : calculateDiscount(product?.price || 0, product?.discount_price));

  const customAttrGroups = useMemo(() => {
    const attrs: any[] = product?.custom_attributes || (product?.specifications as any)?.custom_attributes || [];
    const groups: Record<string, any[]> = {};
    if (Array.isArray(attrs)) {
      attrs.forEach((a) => {
        if (!a || !a.attributeName || !String(a.attributeName).trim()) return;
        if (!a.name || !String(a.name).trim()) return;
        const attrName = String(a.attributeName).trim();
        if (!groups[attrName]) groups[attrName] = [];
        groups[attrName].push(a);
      });
    }
    return groups;
  }, [product]);

  const activeVariantImage = activeColorObj?.image || product?.images?.[0] || '/logo.webp';

  const handleSelectColor = (c: any) => {
    setSelectedColor(c.name);
    const firstImg = (c.images && c.images.length > 0) ? c.images[0] : c.image;
    if (firstImg) {
      setSelectedImage(firstImg);
    }
  };

  const handleSelectCustomAttr = (attrName: string, opt: any) => {
    setSelectedCustomAttributes((prev) => ({
      ...prev,
      [attrName]: opt.name,
    }));
    if (opt.image) {
      setSelectedImage(opt.image);
    }
  };

  // Automatically attach product context for Live Chat (Called at top-level before early returns)
  useEffect(() => {
    if (product) {
      setActiveProductContext({
        id: product.id,
        title: product.title,
        price: currentPrice,
        image: selectedImage || activeVariantImage,
        sku: product.sku,
      });
    }
  }, [product?.id, currentPrice, selectedImage, activeVariantImage]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          {language === 'bn' ? 'পণ্যটি খুঁজে পাওয়া যায়নি' : 'Product Not Found'}
        </h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm">
          {language === 'bn'
            ? 'আপনি যে পণ্যটি খুঁজছেন তা বর্তমানে উপলব্ধ নেই অথবা লিঙ্কটি মেয়াদোত্তীর্ণ।'
            : 'The product you are looking for might have been removed, sold out, or the link is outdated.'}
        </p>
        <div className="flex justify-center gap-3 mb-12">
          <Link
            to="/shop"
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-sm"
          >
            {language === 'bn' ? 'সব পণ্য দেখুন' : 'Browse All Products'}
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition"
          >
            {language === 'bn' ? 'হোমপেজ' : 'Go to Homepage'}
          </Link>
        </div>

        {allProducts && allProducts.length > 0 && (
          <div className="text-left border-t border-gray-100 pt-10">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {language === 'bn' ? 'অন্যান্য জনপ্রিয় পণ্যসমূহ' : 'Popular Trending Products'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {allProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);

  const relatedProducts = (() => {
    if (!product || !allProducts || allProducts.length === 0) return [];
    
    // Strictly find genuinely similar products from the SAME category
    const sameCat = allProducts.filter(
      (p) => p.id !== product.id && p.category_id && p.category_id === product.category_id
    );

    if (sameCat.length === 0) return [];

    // Sort by title & tag similarity so the most relevant matching items appear first
    const currentTags = (product.tags || []).map((t: string) => t.toLowerCase().trim());
    const currentTitleWords = product.title.toLowerCase().split(/[\s–—,-]+/).filter((w: string) => w.length > 3);

    return [...sameCat].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      const tagsA = (a.tags || []).map((t: string) => t.toLowerCase().trim());
      const tagsB = (b.tags || []).map((t: string) => t.toLowerCase().trim());
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();

      tagsA.forEach((t) => { if (currentTags.includes(t)) scoreA += 2; });
      tagsB.forEach((t) => { if (currentTags.includes(t)) scoreB += 2; });

      currentTitleWords.forEach((word) => {
        if (titleA.includes(word)) scoreA += 3;
        if (titleB.includes(word)) scoreB += 3;
      });

      return scoreB - scoreA;
    }).slice(0, 16);
  })();

  const customAttrLabels = Object.entries(selectedCustomAttributes)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  const combinedSizeOrAttrs = [selectedSize, customAttrLabels].filter(Boolean).join(' | ');

  const handleAddToCart = () => {
    if (!user) {
      toast.error(t('product.loginRequired'));
      openAuthModal('login');
      return;
    }
    addToCart(
      product,
      quantity,
      isRealColorList ? selectedColor : undefined,
      combinedSizeOrAttrs || selectedSize,
      activeVariantPrice || undefined,
      selectedImage || activeVariantImage
    );

    // Trigger delightful animated checkmark feedback
    setIsAddedAnimation(true);
    setTimeout(() => {
      setIsAddedAnimation(false);
    }, 2200);
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error(t('product.loginRequired'));
      openAuthModal('login');
      return;
    }
    // Add product to cart with chosen variant and quantity
    addToCart(
      product,
      quantity,
      isRealColorList ? selectedColor : undefined,
      combinedSizeOrAttrs || selectedSize,
      activeVariantPrice || undefined,
      selectedImage || activeVariantImage
    );

    // Save strictly this product's key to kintesi_selected_cart_keys for direct checkout
    const itemKey = `${product.id}_${selectedColor || ''}_${combinedSizeOrAttrs || selectedSize || ''}`;
    try {
      localStorage.setItem('kintesi_selected_cart_keys', JSON.stringify([itemKey]));
    } catch {}

    navigate('/checkout');
  };

  return (
    <div className="bg-[#f6f7f9] sm:bg-transparent min-h-screen py-3 sm:py-8 pb-28 md:pb-12">
      <div className="max-w-[1440px] mx-auto px-2.5 sm:px-6 lg:px-8 space-y-3 sm:space-y-8">
        
        {/* Category & Subcategory Breadcrumb: Category > Sub-category */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 overflow-x-auto whitespace-nowrap pb-1">
          <Link to="/" className="hover:text-rose-600 transition">Home</Link>
          <span className="text-gray-400">/</span>
          <Link to="/shop" className="hover:text-rose-600 transition">Shop</Link>
          {product.category_id && (() => {
            const catObj = INITIAL_CATEGORIES.find(
              (c) => c.slug.toLowerCase() === product.category_id.toLowerCase() || c.id.toLowerCase() === product.category_id.toLowerCase()
            );
            const catDisplayName = catObj?.name || product.category_id.replace(/[-_]/g, ' ');
            return (
              <>
                <span className="text-gray-400">/</span>
                <Link
                  to={`/shop?category=${encodeURIComponent(catObj?.slug || product.category_id)}`}
                  className="hover:text-rose-600 font-bold text-gray-800 transition"
                >
                  {catDisplayName}
                </Link>
                {product.sub_category && (
                  <>
                    <span className="text-gray-400 font-bold">&gt;</span>
                    <Link
                      to={`/shop?category=${encodeURIComponent(catObj?.slug || product.category_id)}&sub_category=${encodeURIComponent(product.sub_category)}`}
                      className="text-rose-600 font-extrabold hover:underline"
                    >
                      {product.sub_category}
                    </Link>
                  </>
                )}
              </>
            );
          })()}
        </nav>

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
            {productImages && productImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 px-0.5">
                {productImages.map((img, idx) => (
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
              
              {/* Price row: Big prominent price + original strikethrough + discount badge on left, SKU on right */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-baseline gap-2 sm:gap-2.5 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-black text-rose-600 leading-none">
                      {formatPrice(currentPrice)}
                    </span>
                    {baseRegularPrice > currentPrice && (
                      <span className="text-sm sm:text-base text-gray-400 line-through font-semibold leading-none">
                        {formatPrice(baseRegularPrice)}
                      </span>
                    )}
                    {discountPercent > 0 && (
                      <span className="hidden sm:inline-flex text-xs font-extrabold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md leading-tight">
                        -{discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center">
                    <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200/80 rounded-lg text-xs font-bold font-mono tracking-wide">
                      SKU: {product.sku || 'KT-' + product.id.slice(0, 6).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Mobile Discount Badge (sits cleanly below price so SKU stays level with ৳ Price) */}
                {discountPercent > 0 && (
                  <div className="sm:hidden flex items-center gap-2 pt-0.5">
                    <span className="text-xs font-extrabold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md">
                      -{discountPercent}% OFF
                    </span>
                  </div>
                )}
              </div>

              {/* Category & Subcategory Hierarchy: Women's Fashion > Sharee */}
              {product.category_id && (() => {
                const catObj = INITIAL_CATEGORIES.find(
                  (c) => c.slug.toLowerCase() === product.category_id.toLowerCase() || c.id.toLowerCase() === product.category_id.toLowerCase()
                );
                const catDisplayName = catObj?.name || product.category_id.replace(/[-_]/g, ' ');
                return (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50/80 px-2.5 py-1 rounded-lg border border-rose-200/70 w-fit">
                    <Link
                      to={`/shop?category=${encodeURIComponent(catObj?.slug || product.category_id)}`}
                      className="hover:underline text-rose-700"
                    >
                      {catDisplayName}
                    </Link>
                    {product.sub_category && (
                      <>
                        <span className="text-gray-400 font-black">&gt;</span>
                        <Link
                          to={`/shop?category=${encodeURIComponent(catObj?.slug || product.category_id)}&sub_category=${encodeURIComponent(product.sub_category)}`}
                          className="text-gray-800 hover:text-rose-600 font-extrabold"
                        >
                          {product.sub_category}
                        </Link>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Product Title */}
              <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 leading-snug">
                {product.title}
              </h1>

              {/* Badges & Rating Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {reviews.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-gray-900">
                        {(reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)}
                      </span>
                      <span className="text-gray-400 text-[11px]">
                        ({reviews.length})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-400 text-[11px]">
                      <Star className="w-3.5 h-3.5 text-gray-300" />
                      <span>{language === 'bn' ? 'এখনো কোনো রিভিউ নেই' : 'No reviews yet'}</span>
                    </div>
                  )}

                  <span className="text-gray-200">•</span>

                  <span className="font-medium text-gray-600">
                    Brand: <strong className="text-gray-900">{product.brand && product.brand.trim() ? product.brand : 'No Brand'}</strong>
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

                  {product.gender && product.gender.trim() && (
                    <>
                      <span className="text-gray-200 hidden sm:inline">•</span>
                      <span className="text-[11px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-200/60 hidden sm:inline-flex items-center gap-1">
                        <span>{product.gender}</span>
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product)}
                    className={`p-1.5 rounded-lg transition inline-flex items-center gap-1 cursor-pointer ${
                      isInWishlist(product.id)
                        ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                        : 'text-gray-400 hover:text-rose-600 hover:bg-gray-100'
                    }`}
                    title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span className="text-[11px] font-medium hidden sm:inline">
                      {isInWishlist(product.id) ? (language === 'bn' ? 'সংরক্ষিত' : 'Saved') : (language === 'bn' ? 'উইশলিস্ট' : 'Wishlist')}
                    </span>
                  </button>

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
            </div>

            {/* Card 2: Variations (Color, Size, Custom Attributes), Quantity & Purchase Actions */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 shadow-xs space-y-4">
              
              {/* Color Selection */}
              {isRealColorList && product.colors && product.colors.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-500 uppercase tracking-wider text-[11px]">Color:</span>
                    <span className="text-gray-900 font-extrabold">{selectedColor}</span>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                    {product.colors.map((c) => {
                      const isSelected = selectedColor === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => handleSelectColor(c)}
                          className={`relative w-6 h-6 rounded-full border-[1.5px] border-dashed border-slate-400/80 transition-all duration-150 cursor-pointer shrink-0 ${
                            isSelected
                              ? 'ring-2 ring-offset-2 ring-rose-600 scale-110 shadow-xs'
                              : 'hover:scale-105 opacity-90 hover:opacity-100 ring-1 ring-black/10'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                          aria-label={c.name}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Non-Color Attributes (e.g. Size, Material, Type) */}
              {Object.keys(customAttrGroups).length > 0 &&
                Object.entries(customAttrGroups).map(([attrName, rawOptions]) => {
                  const options = rawOptions as any[];
                  const selectedOptName = selectedCustomAttributes[attrName] || (options[0]?.name ?? '');
                  const activeOption = options.find((o) => o.name === selectedOptName);

                  return (
                    <div key={attrName} className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-gray-500 uppercase tracking-wider text-[11px]">{attrName}:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-extrabold">{selectedOptName}</span>
                          {activeOption && typeof activeOption.price === 'number' && activeOption.price > 0 && (
                            <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              {formatPrice(activeOption.price)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {options.map((opt: any) => {
                          const isSelected = selectedOptName === opt.name;
                          return (
                            <button
                              key={opt.id || opt.name}
                              type="button"
                              onClick={() => handleSelectCustomAttr(attrName, opt)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <span>{opt.name}</span>
                              {typeof opt.price === 'number' && opt.price > 0 && (
                                <span className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-rose-600 font-extrabold'}`}>
                                  ({formatPrice(opt.price)})
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {/* Size Selection (From standard sizes array if present and not already in custom attributes) */}
              {product.sizes && product.sizes.length > 0 && !customAttrGroups['Size'] && (
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
                <div className="grid grid-cols-2 gap-2.5 pt-2 relative">
                  {/* Floating animated success badge */}
                  {isAddedAnimation && (
                    <div className="absolute -top-7 left-1/4 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300 z-30 pointer-events-none">
                      <span className="flex items-center justify-center w-3.5 h-3.5 bg-white text-emerald-600 rounded-full">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>{language === 'bn' ? 'কার্টে যোগ হয়েছে!' : 'Added to Cart!'}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className={`py-3 px-4 font-bold rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 text-xs sm:text-sm cursor-pointer ${
                      isAddedAnimation
                        ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-500 scale-[1.02]'
                        : 'bg-gray-900 hover:bg-black text-white'
                    }`}
                  >
                    {isAddedAnimation ? (
                      <>
                        <span className="flex items-center justify-center w-5 h-5 bg-white text-emerald-600 rounded-full animate-bounce shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                        <span className="animate-pulse">
                          {language === 'bn' ? 'কার্টে যোগ হয়েছে ✓' : 'Added to Cart ✓'}
                        </span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>{language === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={product.stock <= 0}
                    className="py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl transition shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 text-xs sm:text-sm cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>{language === 'bn' ? 'এখনই কিনুন' : 'Buy Now'}</span>
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
                    {settings.freeShippingThreshold && settings.freeShippingThreshold > 0 ? (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">Free on ৳{settings.freeShippingThreshold}+</span>
                      </>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Service Guarantees - Compact 4-column layout on mobile */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-2 border-t border-gray-100 text-center">
                <div className="py-1.5 px-1 sm:p-2 bg-gray-50/90 rounded-lg sm:rounded-xl flex flex-col items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 mx-auto mb-0.5" />
                  <p className="text-[9px] sm:text-[11px] font-bold text-gray-800 leading-tight">Cash on Delivery</p>
                  <p className="text-[8px] sm:text-[9px] text-gray-400 leading-tight">Available</p>
                </div>
                <div className="py-1.5 px-1 sm:p-2 bg-gray-50/90 rounded-lg sm:rounded-xl flex flex-col items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 mx-auto mb-0.5" />
                  <p className="text-[9px] sm:text-[11px] font-bold text-gray-800 leading-tight">100% Authentic</p>
                  <p className="text-[8px] sm:text-[9px] text-gray-400 leading-tight">Verified</p>
                </div>
                <div className="py-1.5 px-1 sm:p-2 bg-gray-50/90 rounded-lg sm:rounded-xl flex flex-col items-center justify-center">
                  <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 mx-auto mb-0.5" />
                  <p className="text-[9px] sm:text-[11px] font-bold text-gray-800 leading-tight">Fast Delivery</p>
                  <p className="text-[8px] sm:text-[9px] text-gray-400 leading-tight">Nationwide</p>
                </div>
                <div className="py-1.5 px-1 sm:p-2 bg-gray-50/90 rounded-lg sm:rounded-xl flex flex-col items-center justify-center">
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 mx-auto mb-0.5" />
                  <p className="text-[9px] sm:text-[11px] font-bold text-gray-800 leading-tight">7 Days Return</p>
                  <p className="text-[8px] sm:text-[9px] text-gray-400 leading-tight">Guarantee</p>
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

          </div>
        </div>

      {/* Related Products Showcase Strip (Similar Items You May Like - Placed Above Description) */}
      {relatedProducts.length > 0 && (
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-3.5 sm:p-7 shadow-sm">
          <ShowcaseStrip
            showcase={{
              id: 'similar',
              type: 'trending',
              title: language === 'bn' ? 'অনুরূপ পণ্যসমূহ (Similar Items)' : 'Similar Items You May Like',
              subtitle: language === 'bn' ? 'একই কালেকশনের অন্যান্য পণ্য' : 'Related items from this collection',
              enabled: true,
              productIds: [],
            }}
            products={relatedProducts}
            viewAllLink={product.category_id ? `/shop?category=${encodeURIComponent(product.category_id)}` : '/shop'}
            icon={<Sparkles className="w-4 h-4 text-rose-600" />}
          />
        </section>
      )}

      {/* Section 1: Comprehensive Specifications & Technical Details Card (Strictly Isolated by Category Mode) */}
      {(() => {
        const cat = (product.category_id || '').toLowerCase();
        const isKeyValid = (key: string) => {
          if (!key) return false;
          const k = key.toLowerCase().trim();
          return k !== 'custom_attributes' && k !== 'customattributes' && k !== 'custom_attribute';
        };

        const isValueNonEmpty = (val: any) => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'object') {
            if (Array.isArray(val)) return val.length > 0;
            return Object.keys(val).length > 0;
          }
          const s = String(val).trim();
          return s !== '' && s !== 'null' && s !== 'undefined' && s !== '[]' && s !== '{}' && s !== '-';
        };

        const effectiveSpecMode = product.spec_mode || (product.specifications as any)?.spec_mode || 'auto';
        if (effectiveSpecMode === 'none' || effectiveSpecMode === 'skip') {
          return null;
        }

        const validSpecs = Object.entries(product.specifications || {}).filter(
          ([key, val]) => isKeyValid(key) && isValueNonEmpty(val) && key !== 'spec_mode' && key !== 'sub_category'
        );
        const hasHardwareSpecs = validSpecs.length > 0;

        const isGadget = effectiveSpecMode === 'gadgets' || (effectiveSpecMode === 'auto' && Boolean(
          hasHardwareSpecs ||
          cat.includes('smartphones') ||
          cat.includes('laptops') ||
          cat.includes('audio') ||
          cat.includes('cameras') ||
          cat.includes('watches') ||
          cat.includes('gadget') ||
          cat.includes('electronic') ||
          cat.includes('tech')
        ));

        const isGroceries = !isGadget && (effectiveSpecMode === 'groceries' || (effectiveSpecMode === 'auto' && Boolean(
          cat.includes('groceries') ||
          cat.includes('food') ||
          cat.includes('daily-essentials') ||
          cat.includes('pantry')
        )));

        const isFashion = !isGadget && !isGroceries && (effectiveSpecMode === 'fashion' || (effectiveSpecMode === 'auto' && Boolean(
          cat.includes('fashion') ||
          cat.includes('footwear') ||
          cat.includes('apparel') ||
          cat.includes('clothing') ||
          cat.includes('saree') ||
          cat.includes('kurti') ||
          cat.includes('shoes') ||
          isValueNonEmpty(product.fabric) ||
          isValueNonEmpty(product.fit_type)
        )));

        // Check if there is any genuine specification to show for this specific mode
        const shouldShow = isGadget
          ? Boolean(isValueNonEmpty(product.warranty) || isValueNonEmpty(product.origin) || hasHardwareSpecs)
          : isGroceries
          ? Boolean(
              isValueNonEmpty(product.fabric) ||
              isValueNonEmpty(product.warranty) ||
              isValueNonEmpty(product.origin) ||
              isValueNonEmpty(product.care_instructions) ||
              isValueNonEmpty(product.fit_type) ||
              hasHardwareSpecs
            )
          : isFashion
          ? Boolean(
              isValueNonEmpty(product.fabric) ||
              isValueNonEmpty(product.fit_type) ||
              (isValueNonEmpty(product.gender) && product.gender !== 'Unisex') ||
              isValueNonEmpty(product.origin) ||
              isValueNonEmpty(product.care_instructions) ||
              hasHardwareSpecs
            )
          : false;

        if (!shouldShow) return null;

        return (
          <section className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-3 sm:p-7 shadow-sm space-y-3 sm:space-y-5">
            <div className="border-b border-gray-100 pb-2.5 sm:pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div
                  className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                    isGadget
                      ? 'bg-cyan-50 text-cyan-600'
                      : isGroceries
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-pink-50 text-pink-600'
                  }`}
                >
                  {isGadget ? (
                    <Cpu className="w-4 h-4" />
                  ) : isGroceries ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <Shirt className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs sm:text-base font-black text-gray-900 leading-tight">
                    {isGadget
                      ? 'Technical Specifications & Hardware Details'
                      : isGroceries
                      ? 'Food & Grocery Specifications (খাদ্য ও পুষ্টি বিবরণ)'
                      : 'Specifications & Material Details (পোশাক ও ফ্যাশন বিবরণ)'}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                    {isGadget
                      ? 'Hardware performance, connectivity & official warranty'
                      : isGroceries
                      ? 'Net weight, shelf life, storage & origin'
                      : 'Fabric craftsmanship, fit type & care instructions'}
                  </p>
                </div>
              </div>
            </div>

            {/* 1. GADGET & HARDWARE DETAILS ONLY */}
            {isGadget && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2.5 text-xs">
                {isValueNonEmpty(product.warranty) && (
                  <div className="p-2 sm:p-2.5 bg-cyan-50/40 rounded-lg sm:rounded-xl space-y-0.5 border border-cyan-100/70">
                    <span className="text-cyan-700 font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider block">Official Warranty</span>
                    <p className="font-bold text-gray-900 text-[11px] sm:text-xs truncate">{String(product.warranty)}</p>
                  </div>
                )}
                {isValueNonEmpty(product.origin) && (
                  <div className="p-2 sm:p-2.5 bg-gray-50/80 rounded-lg sm:rounded-xl space-y-0.5 border border-gray-100/80">
                    <span className="text-gray-400 font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider block">Device Origin</span>
                    <p className="font-bold text-gray-900 text-[11px] sm:text-xs truncate">{String(product.origin)}</p>
                  </div>
                )}
                {validSpecs.map(([key, val]) => (
                  <div key={key} className="p-2 sm:p-2.5 bg-gray-50/80 rounded-lg sm:rounded-xl space-y-0.5 border border-gray-100/80">
                    <span className="text-gray-400 font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider block">{key.replace(/_/g, ' ')}</span>
                    <p className="font-bold text-gray-900 text-[11px] sm:text-xs truncate">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 2. FASHION & APPAREL DETAILS ONLY */}
            {isFashion && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2.5 text-xs">
                {isValueNonEmpty(product.fabric) && (
                  <div className="p-2 sm:p-2.5 bg-gray-50/80 rounded-lg sm:rounded-xl space-y-0.5 border border-gray-100/80">
                    <span className="text-gray-400 font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider block">Fabric / Material</span>
                    <p className="font-bold text-gray-900 text-[11px] sm:text-xs truncate">{String(product.fabric)}</p>
                  </div>
                )}
                {isValueNonEmpty(product.fit_type) && (
                  <div className="p-2 sm:p-2.5 bg-gray-50/80 rounded-lg sm:rounded-xl space-y-0.5 border border-gray-100/80">
                    <span className="text-gray-400 font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider block">Fit Type</span>
                    <p className="font-bold text-gray-900 text-[11px] sm:text-xs truncate">{String(product.fit_type)}</p>
                  </div>
                )}
                {isValueNonEmpty(product.gender) && (
                  <div className="p-2 sm:p-2.5 bg-gray-50/80 rounded-lg sm:rounded-xl space-y-0.5 border border-gray-100/80">
                    <span className="text-gray-400 font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider block">Department</span>
                    <p className="font-bold text-gray-900 text-[11px] sm:text-xs truncate">{String(product.gender)}</p>
                  </div>
                )}
                {isValueNonEmpty(product.origin) && (
                  <div className="p-2 sm:p-2.5 bg-gray-50/80 rounded-lg sm:rounded-xl space-y-0.5 border border-gray-100/80">
                    <span className="text-gray-400 font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider block">Origin</span>
                    <p className="font-bold text-gray-900 text-[11px] sm:text-xs truncate">{String(product.origin)}</p>
                  </div>
                )}
                {isValueNonEmpty(product.care_instructions) && (
                  <div className="p-2 sm:p-2.5 bg-gray-50/80 rounded-lg sm:rounded-xl space-y-0.5 border border-gray-100/80 col-span-2">
                    <span className="text-gray-400 font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider block">Care Instructions</span>
                    <p className="font-semibold text-gray-800 text-[11px] sm:text-xs leading-relaxed">{String(product.care_instructions)}</p>
                  </div>
                )}
                {validSpecs.map(([key, val]) => (
                  <div key={key} className="p-2 sm:p-2.5 bg-gray-50/80 rounded-lg sm:rounded-xl space-y-0.5 border border-gray-100/80">
                    <span className="text-gray-400 font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider block">{key.replace(/_/g, ' ')}</span>
                    <p className="font-bold text-gray-900 text-[11px] sm:text-xs truncate">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 3. GROCERIES & FOOD DETAILS ONLY */}
            {isGroceries && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2.5 text-xs">
                {isValueNonEmpty(product.fabric) && (
                  <div className="p-2 sm:p-2.5 bg-emerald-50/40 rounded-lg sm:rounded-xl space-y-0.5 border border-emerald-100/70">
                    <span className="text-emerald-700 font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider block">Net Weight / Vol</span>
                    <p className="font-bold text-gray-900 text-[11px] sm:text-xs truncate">{String(product.fabric)}</p>
                  </div>
                )}
                {isValueNonEmpty(product.warranty) && (
                  <div className="p-2 sm:p-2.5 bg-gray-50/80 rounded-lg sm:rounded-xl space-y-0.5 border border-gray-100/80">
                    <span className="text-gray-400 font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider block">Shelf Life / Expiry</span>
                    <p className="font-bold text-gray-900 text-[11px] sm:text-xs truncate">{String(product.warranty)}</p>
                  </div>
                )}
                {isValueNonEmpty(product.origin) && (
                  <div className="p-2 sm:p-2.5 bg-gray-50/80 rounded-lg sm:rounded-xl space-y-0.5 border border-gray-100/80">
                    <span className="text-gray-400 font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider block">Origin</span>
                    <p className="font-bold text-gray-900 text-[11px] sm:text-xs truncate">{String(product.origin)}</p>
                  </div>
                )}
                {isValueNonEmpty(product.fit_type) && (
                  <div className="p-2 sm:p-2.5 bg-gray-50/80 rounded-lg sm:rounded-xl space-y-0.5 border border-gray-100/80">
                    <span className="text-gray-400 font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider block">Quality / Cert</span>
                    <p className="font-bold text-gray-900 text-[11px] sm:text-xs truncate">{String(product.fit_type)}</p>
                  </div>
                )}
                {isValueNonEmpty(product.care_instructions) && (
                  <div className="p-2 sm:p-2.5 bg-gray-50/80 rounded-lg sm:rounded-xl space-y-0.5 border border-gray-100/80 col-span-2">
                    <span className="text-gray-400 font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider block">Storage Instructions</span>
                    <p className="font-semibold text-gray-800 text-[11px] sm:text-xs leading-relaxed">{String(product.care_instructions)}</p>
                  </div>
                )}
                {validSpecs.map(([key, val]) => (
                  <div key={key} className="p-2 sm:p-2.5 bg-gray-50/80 rounded-lg sm:rounded-xl space-y-0.5 border border-gray-100/80">
                    <span className="text-gray-400 font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider block">{key.replace(/_/g, ' ')}</span>
                    <p className="font-bold text-gray-900 text-[11px] sm:text-xs truncate">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</p>
                  </div>
                ))}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            {reviews.length > 0 ? (
              <>
                <span className="text-3xl font-black text-emerald-700">
                  {(reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)}
                </span>
                <div className="text-xs text-gray-400">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p>{`Based on ${reviews.length} review${reviews.length > 1 ? 's' : ''}`}</p>
                </div>
              </>
            ) : (
              <>
                <span className="text-3xl font-bold text-gray-300">
                  0.0
                </span>
                <div className="text-xs text-gray-400">
                  <div className="flex items-center gap-0.5 text-gray-300">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5 text-gray-300"
                      />
                    ))}
                  </div>
                  <p>{language === 'bn' ? 'এখনো কোনো রিভিউ নেই' : 'No reviews yet'}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Verified Purchase Policy Note */}
        <div className="flex items-center gap-2.5 p-2.5 sm:p-3.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl sm:rounded-2xl text-xs text-emerald-950 font-medium">
          <div className="p-1.5 sm:p-2 bg-emerald-600 text-white rounded-lg sm:rounded-xl shadow-xs shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-[11px] sm:text-xs">100% Verified Buyer Reviews Only</p>
            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-tight">
              To ensure 100% authenticity, customer reviews can only be submitted after receiving the delivered product from your <strong>My Orders</strong> page.
            </p>
          </div>
        </div>

        {/* Reputation & Support Resolution Promise */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 p-2.5 sm:p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl sm:rounded-2xl text-xs text-amber-950 font-medium">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="text-sm sm:text-base shrink-0">🛡️</span>
            <div>
              <p className="font-bold text-gray-900 text-[11px] sm:text-xs">100% Satisfaction & Reputation Commitment</p>
              <p className="text-[10px] sm:text-[11px] text-gray-600 mt-0.5 leading-tight">
                Received a damaged, delayed, or mismatched item? Contact our Care Desk on WhatsApp before leaving a review — we promise 100% replacement or refund.
              </p>
            </div>
          </div>
          <a
            href={`https://wa.me/${cleanPhoneForWhatsApp}?text=${encodeURIComponent(
              `Hello Kintesi Support, I have an issue with product "${product.title}". Please assist with immediate replacement or refund.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] sm:text-xs rounded-lg sm:rounded-xl transition shadow-xs active:scale-95 flex items-center gap-1 shrink-0 ml-auto sm:ml-0"
          >
            <span>💬 WhatsApp Care</span>
          </a>
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

      </div>

      {/* Apple-style Dynamic Bottom Island for Mobile (Ultra-Premium White Glassmorphic) */}
      {product && showStickyBar && (
        <aside 
          aria-label="Dynamic Bottom Island for Quick Purchase"
          className="fixed bottom-3 left-3 right-3 max-w-md mx-auto z-40 bg-white border border-gray-200/90 text-gray-900 shadow-[0_12px_35px_rgba(0,0,0,0.14)] rounded-full p-2 px-3 flex items-center justify-between gap-2.5 md:hidden animate-in slide-in-from-bottom duration-300 ring-1 ring-black/[0.04]"
        >
          {/* Mini product thumbnail & price */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img
              src={selectedImage || activeVariantImage || product.images?.[0] || '/logo.webp'}
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

          {/* Island Action buttons: Cart & Order */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition disabled:opacity-40 border shadow-xs cursor-pointer ${
                isAddedAnimation
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/30'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200/80'
              }`}
              title="Add to Cart"
            >
              {isAddedAnimation ? (
                <Check className="w-3.5 h-3.5 stroke-[3] animate-bounce" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
              className="h-8 px-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold rounded-full text-xs flex items-center justify-center gap-1 active:scale-95 transition disabled:opacity-40 shadow-md shadow-rose-600/30 cursor-pointer"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>{product.stock > 0 ? (language === 'bn' ? 'কিনুন' : 'Buy Now') : (language === 'bn' ? 'স্টক আউট' : 'Sold Out')}</span>
            </button>
          </div>
        </aside>
      )}

    </div>
  );
};

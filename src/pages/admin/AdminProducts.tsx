import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { getProductsFromDB, saveProductToDB, deleteProductFromDB, getCategoriesFromDB } from '../../lib/dbService';
import { useAuth } from '../../contexts/AuthContext';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../../data/mockData';
import { Product, Category, ProductColorOption, ProductCustomAttributeOption } from '../../types';
import { formatPrice, calculateDiscount } from '../../lib/utils';
import { uploadToCloudinary } from '../../lib/cloudinary';
import {
  Plus,
  Edit2,
  Copy,
  Trash2,
  Search,
  X,
  Check,
  Package,
  Percent,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Tag,
  ShieldCheck,
  ListPlus,
  Palette,
  Shirt,
  Info,
  Globe,
  CreditCard,
  Lock,
  Landmark,
  Smartphone,
  Cpu,
  Zap,
  Ban,
  ExternalLink,
  DollarSign,
  UploadCloud,
  Loader2,
  Sliders,
  Share2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ImageUploader } from '../../components/common/ImageUploader';
import { CategoryTagExplorer } from '../../components/admin/CategoryTagExplorer';
import { DEFAULT_COLOR_PRESETS, DEFAULT_SIZE_PRESETS, ColorPresetItem } from './AdminPresets';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

export interface ColorVariantSection {
  id: string;
  colorName: string;
  colorHex: string;
  price: string;
  discount_percent?: string;
  stock?: string;
  imageUrl1: string;
  imageUrl2: string;
  imageUrl3: string;
  imageUrl4: string;
}

export const AdminProducts: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const { isLight } = useAdminTheme();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [specMode, setSpecMode] = useState<'auto' | 'gadgets' | 'fashion' | 'groceries' | 'none'>('auto');
  const [activeModalTab, setActiveModalTab] = useState<'general' | 'variants' | 'specs' | 'delivery' | 'tags'>('general');
  const [isColorImageUploading, setIsColorImageUploading] = useState(false);
  const [showColorUrlInput, setShowColorUrlInput] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false);
  const colorFileInputRef = useRef<HTMLInputElement>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  const filteredTemplateProducts = useMemo(() => {
    const q = templateSearchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.title, p.sku, p.brand, p.category_id].some((val) =>
        val?.toLowerCase().includes(q)
      )
    );
  }, [products, templateSearchQuery]);

  const getCategorySpecMode = (catId: string): 'gadgets' | 'fashion' | 'groceries' => {
    const c = (catId || '').toLowerCase();
    if (
      c.includes('smartphones') ||
      c.includes('laptops') ||
      c.includes('audio') ||
      c.includes('cameras') ||
      c.includes('watches') ||
      c.includes('gadget') ||
      c.includes('electronic') ||
      c.includes('tech')
    ) {
      return 'gadgets';
    }
    if (c.includes('groceries') || c.includes('food') || c.includes('daily-essentials') || c.includes('pantry')) {
      return 'groceries';
    }
    if (
      c.includes('fashion') ||
      c.includes('footwear') ||
      c.includes('apparel') ||
      c.includes('clothing') ||
      c.includes('saree') ||
      c.includes('kurti') ||
      c.includes('shoes')
    ) {
      return 'fashion';
    }
    return 'gadgets';
  };

  // Form State (Zero pre-selected or hardcoded values - completely clean for new products)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    price: '',
    discount_percent: '',
    category_id: 'mens-fashion',
    sub_category: '',
    stock: '',
    sku: '',
    brand: '',
    warranty: '',
    delivery_note: '',
    dropshipping_url: '',
    allowed_payment_methods: ['cod', 'bkash', 'nagad', 'rocket', 'bank'] as string[],
    payment_instruction: '',
    use_custom_seller_payment: false,
    seller_name: '',
    seller_phone: '',
    seller_bkash_number: '',
    seller_bkash_type: 'Personal' as 'Merchant' | 'Personal' | 'Agent',
    seller_nagad_number: '',
    seller_nagad_type: 'Personal' as 'Merchant' | 'Personal',
    seller_rocket_number: '',
    seller_rocket_type: 'Personal' as 'Merchant' | 'Personal',
    seller_bank_name: '',
    seller_bank_account_name: '',
    seller_bank_account_number: '',
    seller_bank_branch: '',
    seller_bank_routing_number: '',
    seller_custom_payment_note: '',
    is_featured: false,
    is_trending: false,
    is_affiliate_enabled: false,
    affiliate_commission_rate: '10',
    hasColorVariants: false,
    // Multiple Images & Color Photos
    imageUrl1: '',
    imageUrl2: '',
    imageUrl3: '',
    imageUrl4: '',
    colorVariants: [
      {
        id: 'cv_1',
        colorName: '',
        colorHex: '#EC4899',
        price: '',
        discount_percent: '',
        stock: '',
        imageUrl1: '',
        imageUrl2: '',
        imageUrl3: '',
        imageUrl4: '',
      },
    ] as ColorVariantSection[],
    // Sizes
    selectedSizes: [] as string[],
    customSizeInput: '',
    // Colors & Options
    colors: [] as ProductColorOption[],
    newColorName: '',
    newColorHex: '#EC4899',
    newColorPrice: '',
    newColorImage: '',
    newColorStock: '',
    // Custom Attributes / Options (Size, Material, Type, etc.)
    customAttributes: [] as ProductCustomAttributeOption[],
    newAttrType: 'Size',
    newAttrName: '',
    newAttrPrice: '',
    newAttrStock: '',
    // Bullet Highlights
    highlight1: '',
    highlight2: '',
    highlight3: '',
    // Fabric, Fashion & Technical Specs
    fabric: '',
    fit_type: '',
    care_instructions: '',
    origin: '',
    gender: '',
    specKey1: '',
    specVal1: '',
    specKey2: '',
    specVal2: '',
    specKey3: '',
    specVal3: '',
    tags: '',
  });
  // Dynamic Color Presets (Selection only in product modal, managed in /admin/presets)
  const [colorPresets, setColorPresets] = useState<ColorPresetItem[]>(() => {
    try {
      const saved = localStorage.getItem('kintesi_color_presets');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_COLOR_PRESETS;
  });

  // Dynamic Size Presets (Selection only in product modal, managed in /admin/presets)
  const [sizePresets, setSizePresets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kintesi_size_presets');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SIZE_PRESETS;
  });

  const [modalSizeCategory, setModalSizeCategory] = useState<'all' | 'apparel' | 'storage' | 'volume' | 'weight' | 'footwear'>('all');
  const [colorPresetSearch, setColorPresetSearch] = useState('');
  const [sizePresetSearch, setSizePresetSearch] = useState('');

  const refreshPresetsFromStorage = () => {
    try {
      const c = localStorage.getItem('kintesi_color_presets');
      if (c) setColorPresets(JSON.parse(c));
      else setColorPresets(DEFAULT_COLOR_PRESETS);

      const s = localStorage.getItem('kintesi_size_presets');
      if (s) setSizePresets(JSON.parse(s));
      else setSizePresets(DEFAULT_SIZE_PRESETS);
    } catch (e) {}
  };

  useEffect(() => {
    refreshPresetsFromStorage();
    const syncPresets = () => {
      refreshPresetsFromStorage();
    };
    window.addEventListener('kintesi_presets_updated', syncPresets);
    return () => window.removeEventListener('kintesi_presets_updated', syncPresets);
  }, []);
  const currentSpecMode = specMode === 'auto' ? getCategorySpecMode(formData.category_id) : specMode;

  const loadProducts = async () => {
    try {
      const [prods, cats] = await Promise.all([
        getProductsFromDB(),
        getCategoriesFromDB()
      ]);
      setProducts(prods);
      if (cats && cats.length > 0) setCategories(cats);
    } catch (err) {
      console.warn('Load products note:', err);
    }
  };

  const handleClearDemoCache = async () => {
    if (window.confirm('Are you sure you want to clear all mock/demo products from local cache?')) {
      const savedCustom: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
      const cleanCustom = savedCustom.filter((p) => p && p.id && !p.id.startsWith('prod-'));
      localStorage.setItem('kintesi_custom_products', JSON.stringify(cleanCustom));

      try {
        await supabase.from('products').delete().like('id', 'prod-%');
      } catch (e) {}

      window.dispatchEvent(new Event('kintesi_products_updated'));
      loadProducts();
      toast.success('Demo cache cleared! Store is ready for real products.');
    }
  };

  useEffect(() => {
    // Auto-clean any mock products on initial load
    const savedCustom: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
    if (savedCustom.some((p) => p && p.id && p.id.startsWith('prod-'))) {
      const cleanCustom = savedCustom.filter((p) => p && p.id && !p.id.startsWith('prod-'));
      localStorage.setItem('kintesi_custom_products', JSON.stringify(cleanCustom));
      window.dispatchEvent(new Event('kintesi_products_updated'));
    }
    loadProducts();
    window.addEventListener('kintesi_categories_updated', loadProducts);
    return () => window.removeEventListener('kintesi_categories_updated', loadProducts);
  }, []);

  const handleOpenAddModal = () => {
    refreshPresetsFromStorage();
    setColorPresetSearch('');
    setSizePresetSearch('');
    setEditingProduct(null);
    setIsCustomSubCategory(false);
    setFormData({
      title: '',
      slug: '',
      description: '',
      price: '',
      discount_percent: '',
      category_id: categories[0]?.slug || 'mens-fashion',
      sub_category: '',
      stock: '',
      sku: '',
      brand: '',
      warranty: '',
      delivery_note: '',
      dropshipping_url: '',
      allowed_payment_methods: ['cod', 'bkash', 'nagad', 'rocket', 'bank'],
      payment_instruction: '',
      use_custom_seller_payment: false,
      seller_name: '',
      seller_phone: '',
      seller_bkash_number: '',
      seller_bkash_type: 'Personal',
      seller_nagad_number: '',
      seller_nagad_type: 'Personal',
      seller_rocket_number: '',
      seller_rocket_type: 'Personal',
      seller_bank_name: '',
      seller_bank_account_name: '',
      seller_bank_account_number: '',
      seller_bank_branch: '',
      seller_bank_routing_number: '',
      seller_custom_payment_note: '',
      is_featured: false,
      is_trending: false,
      is_affiliate_enabled: false,
      affiliate_commission_rate: '10',
      hasColorVariants: false,
      imageUrl1: '',
      imageUrl2: '',
      imageUrl3: '',
      imageUrl4: '',
      colorVariants: [
        {
          id: 'cv_1',
          colorName: '',
          colorHex: '#EC4899',
          price: '',
          discount_percent: '',
          stock: '',
          imageUrl1: '',
          imageUrl2: '',
          imageUrl3: '',
          imageUrl4: '',
        },
      ],
      selectedSizes: [],
      customSizeInput: '',
      colors: [],
      newColorName: '',
      newColorHex: '#EC4899',
      newColorPrice: '',
      newColorImage: '',
      newColorStock: '',
      customAttributes: [],
      newAttrType: 'Size',
      newAttrName: '',
      newAttrPrice: '',
      newAttrStock: '',
      highlight1: '',
      highlight2: '',
      highlight3: '',
      fabric: '',
      fit_type: '',
      care_instructions: '',
      origin: '',
      gender: '',
      specKey1: '',
      specVal1: '',
      specKey2: '',
      specVal2: '',
      specKey3: '',
      specVal3: '',
      tags: '',
    });
    setActiveModalTab('general');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    refreshPresetsFromStorage();
    setColorPresetSearch('');
    setSizePresetSearch('');
    setEditingProduct(prod);
    const existingPercent = calculateDiscount(prod.price, prod.discount_price);
    const specEntries = Object.entries(prod.specifications || {}).filter(
      ([key, val]) =>
        key !== 'custom_attributes' &&
        typeof key === 'string' &&
        val !== null &&
        val !== undefined &&
        typeof val !== 'object'
    );

    const cat = (prod.category_id || '').toLowerCase();
    const hasHardwareSpecs = Boolean(prod.specifications && Object.keys(prod.specifications).length > 0);
    let detectedMode: 'gadgets' | 'fashion' | 'groceries' | 'none' = 'gadgets';
    if (prod.spec_mode) {
      detectedMode = prod.spec_mode as any;
    } else if (hasHardwareSpecs || cat.includes('gadget') || cat.includes('smartphones') || cat.includes('tech') || cat.includes('electronic')) {
      detectedMode = 'gadgets';
    } else if (cat.includes('groceries') || cat.includes('food') || cat.includes('pantry') || cat.includes('daily-essentials')) {
      detectedMode = 'groceries';
    } else if (cat.includes('fashion') || cat.includes('apparel') || cat.includes('footwear') || cat.includes('shoes')) {
      detectedMode = 'fashion';
    } else {
      detectedMode = getCategorySpecMode(cat);
    }
    setSpecMode(detectedMode);

    const mappedVariants: ColorVariantSection[] = [];
    if (prod.colors && prod.colors.length > 0) {
      prod.colors.forEach((c: any, i: number) => {
        const cImages = (c.images && c.images.length > 0)
          ? c.images
          : (c.image ? [c.image] : []);
        const cPercent = (c.discount_percent !== undefined && c.discount_percent !== null)
          ? String(c.discount_percent)
          : (c.discount_price && c.price ? String(calculateDiscount(c.price, c.discount_price)) : (existingPercent > 0 ? String(existingPercent) : ''));
        mappedVariants.push({
          id: 'cv_' + i + '_' + Date.now(),
          colorName: c.name || '',
          colorHex: c.hex || '#EC4899',
          price: c.price !== undefined && c.price !== null ? String(c.price) : (prod.price ? String(prod.price) : ''),
          discount_percent: cPercent,
          stock: c.stock !== undefined && c.stock !== null ? String(c.stock) : (prod.stock ? String(prod.stock) : ''),
          imageUrl1: cImages[0] || (i === 0 ? prod.images?.[0] || '' : ''),
          imageUrl2: cImages[1] || (i === 0 ? prod.images?.[1] || '' : ''),
          imageUrl3: cImages[2] || (i === 0 ? prod.images?.[2] || '' : ''),
          imageUrl4: cImages[3] || (i === 0 ? prod.images?.[3] || '' : ''),
        });
      });
    }
    if (mappedVariants.length === 0) {
      mappedVariants.push({
        id: 'cv_1',
        colorName: '',
        colorHex: '#EC4899',
        price: prod.price ? String(prod.price) : '',
        discount_percent: existingPercent > 0 ? String(existingPercent) : '',
        stock: prod.stock ? String(prod.stock) : '',
        imageUrl1: prod.images?.[0] || '',
        imageUrl2: prod.images?.[1] || '',
        imageUrl3: prod.images?.[2] || '',
        imageUrl4: prod.images?.[3] || '',
      });
    }

    const hasRealColors = Boolean(
      prod.colors &&
      prod.colors.length > 0 &&
      !prod.colors.every((c: any) => !c.name || c.name.toLowerCase() === 'default')
    );
    const currentCatObj = categories.find(
      (c) =>
        c.slug.toLowerCase() === (prod.category_id || '').toLowerCase() ||
        c.id.toLowerCase() === (prod.category_id || '').toLowerCase()
    );
    const availableSubs = currentCatObj?.subcategories || [];
    const isCustomSub = Boolean(
      prod.sub_category &&
      !availableSubs.some((s) => s.toLowerCase() === (prod.sub_category || '').toLowerCase())
    );
    setIsCustomSubCategory(isCustomSub);

    setFormData({
      title: prod.title || '',
      slug: prod.slug || '',
      description: prod.description || '',
      price: prod.price ? prod.price.toString() : '',
      discount_percent: existingPercent > 0 ? existingPercent.toString() : '',
      category_id: prod.category_id || categories[0]?.slug || 'mens-fashion',
      sub_category: prod.sub_category || '',
      stock: prod.stock ? prod.stock.toString() : '0',
      sku: prod.sku || 'KT-' + prod.id.slice(0, 6).toUpperCase(),
      brand: prod.brand || '',
      warranty: prod.warranty || '',
      delivery_note: prod.delivery_note || '',
      dropshipping_url: prod.dropshipping_url || '',
      allowed_payment_methods: prod.allowed_payment_methods && prod.allowed_payment_methods.length > 0
        ? prod.allowed_payment_methods
        : ['cod', 'bkash', 'nagad', 'card'],
      payment_instruction: prod.payment_instruction || '',
      use_custom_seller_payment: !!prod.seller_payment?.use_custom_payment,
      seller_name: prod.seller_payment?.seller_name || '',
      seller_phone: prod.seller_payment?.seller_phone || '',
      seller_bkash_number: prod.seller_payment?.bkash_number || '',
      seller_bkash_type: prod.seller_payment?.bkash_type || 'Personal',
      seller_nagad_number: prod.seller_payment?.nagad_number || '',
      seller_nagad_type: prod.seller_payment?.nagad_type || 'Personal',
      seller_rocket_number: prod.seller_payment?.rocket_number || '',
      seller_rocket_type: prod.seller_payment?.rocket_type || 'Personal',
      seller_bank_name: prod.seller_payment?.bank_name || '',
      seller_bank_account_name: prod.seller_payment?.bank_account_name || '',
      seller_bank_account_number: prod.seller_payment?.bank_account_number || '',
      seller_bank_branch: prod.seller_payment?.bank_branch || '',
      seller_bank_routing_number: prod.seller_payment?.bank_routing_number || '',
      seller_custom_payment_note: prod.seller_payment?.custom_payment_note || '',
      is_featured: !!prod.is_featured,
      is_trending: !!prod.is_trending,
      is_affiliate_enabled: !!prod.is_affiliate_enabled,
      affiliate_commission_rate: prod.affiliate_commission_rate ? String(prod.affiliate_commission_rate) : '10',
      hasColorVariants: hasRealColors,
      imageUrl1: prod.images?.[0] || mappedVariants[0]?.imageUrl1 || '',
      imageUrl2: prod.images?.[1] || mappedVariants[0]?.imageUrl2 || '',
      imageUrl3: prod.images?.[2] || mappedVariants[0]?.imageUrl3 || '',
      imageUrl4: prod.images?.[3] || mappedVariants[0]?.imageUrl4 || '',
      colorVariants: mappedVariants,
      selectedSizes: prod.sizes || [],
      customSizeInput: '',
      colors: prod.colors
        ? prod.colors.map((c: any) => ({
            name: c.name || '',
            hex: c.hex || '#EC4899',
            price: c.price ?? null,
            image: c.image || null,
            stock: c.stock ?? null,
          }))
        : [],
      newColorName: '',
      newColorHex: '#EC4899',
      newColorPrice: '',
      newColorImage: '',
      newColorStock: '',
      customAttributes: prod.custom_attributes || (prod.specifications?.custom_attributes as any) || [],
      newAttrType: 'Size',
      newAttrName: '',
      newAttrPrice: '',
      newAttrStock: '',
      highlight1: prod.highlights?.[0] || '',
      highlight2: prod.highlights?.[1] || '',
      highlight3: prod.highlights?.[2] || '',
      fabric: prod.fabric || '',
      fit_type: prod.fit_type || '',
      care_instructions: prod.care_instructions || '',
      origin: prod.origin || '',
      gender: prod.gender || '',
      specKey1: specEntries[0]?.[0] ? String(specEntries[0][0]) : '',
      specVal1: specEntries[0]?.[1] !== undefined ? String(specEntries[0][1]) : '',
      specKey2: specEntries[1]?.[0] ? String(specEntries[1][0]) : '',
      specVal2: specEntries[1]?.[1] !== undefined ? String(specEntries[1][1]) : '',
      specKey3: specEntries[2]?.[0] ? String(specEntries[2][0]) : '',
      specVal3: specEntries[2]?.[1] !== undefined ? String(specEntries[2][1]) : '',
      tags: Array.isArray(prod.tags) ? prod.tags.join(', ') : (typeof prod.tags === 'string' ? prod.tags : ''),
    });
    setActiveModalTab('general');
    setIsModalOpen(true);
  };

  const handleDuplicateProduct = (prod: Product) => {
    refreshPresetsFromStorage();
    setColorPresetSearch('');
    setSizePresetSearch('');
    setEditingProduct(null); // CRUCIAL: null so saving creates a NEW product!

    const existingPercent = calculateDiscount(prod.price, prod.discount_price);
    const specEntries = Object.entries(prod.specifications || {}).filter(
      ([key, val]) =>
        key !== 'custom_attributes' &&
        typeof key === 'string' &&
        val !== null &&
        val !== undefined &&
        typeof val !== 'object'
    );

    if (prod.spec_mode) {
      setSpecMode(prod.spec_mode as any);
    } else {
      const cat = (prod.category_id || '').toLowerCase();
      const hasHardwareSpecs = Boolean(prod.specifications && Object.keys(prod.specifications).length > 0);
      let detectedMode: 'gadgets' | 'fashion' | 'groceries' | 'none' = 'gadgets';
      if (hasHardwareSpecs || cat.includes('gadget') || cat.includes('smartphones') || cat.includes('tech') || cat.includes('electronic')) {
        detectedMode = 'gadgets';
      } else if (cat.includes('groceries') || cat.includes('food') || cat.includes('pantry') || cat.includes('daily-essentials')) {
        detectedMode = 'groceries';
      } else if (cat.includes('fashion') || cat.includes('apparel') || cat.includes('footwear') || cat.includes('shoes')) {
        detectedMode = 'fashion';
      } else {
        detectedMode = getCategorySpecMode(cat);
      }
      setSpecMode(detectedMode);
    }

    const mappedVariants: ColorVariantSection[] = [];
    if (prod.colors && prod.colors.length > 0) {
      prod.colors.forEach((c: any, i: number) => {
        const cImages = (c.images && c.images.length > 0)
          ? c.images
          : (c.image ? [c.image] : []);
        const cPercent = (c.discount_percent !== undefined && c.discount_percent !== null)
          ? String(c.discount_percent)
          : (c.discount_price && c.price ? String(calculateDiscount(c.price, c.discount_price)) : (existingPercent > 0 ? String(existingPercent) : ''));
        mappedVariants.push({
          id: 'cv_' + i + '_' + Date.now(),
          colorName: c.name || '',
          colorHex: c.hex || '#EC4899',
          price: c.price !== undefined && c.price !== null ? String(c.price) : (prod.price ? String(prod.price) : ''),
          discount_percent: cPercent,
          stock: c.stock !== undefined && c.stock !== null ? String(c.stock) : (prod.stock ? String(prod.stock) : ''),
          imageUrl1: cImages[0] || (i === 0 ? prod.images?.[0] || '' : ''),
          imageUrl2: cImages[1] || (i === 0 ? prod.images?.[1] || '' : ''),
          imageUrl3: cImages[2] || (i === 0 ? prod.images?.[2] || '' : ''),
          imageUrl4: cImages[3] || (i === 0 ? prod.images?.[3] || '' : ''),
        });
      });
    }
    if (mappedVariants.length === 0) {
      mappedVariants.push({
        id: 'cv_1',
        colorName: '',
        colorHex: '#EC4899',
        price: prod.price ? String(prod.price) : '',
        discount_percent: existingPercent > 0 ? String(existingPercent) : '',
        stock: prod.stock ? String(prod.stock) : '',
        imageUrl1: prod.images?.[0] || '',
        imageUrl2: prod.images?.[1] || '',
        imageUrl3: prod.images?.[2] || '',
        imageUrl4: prod.images?.[3] || '',
      });
    }

    const hasRealColors = Boolean(
      prod.colors &&
      prod.colors.length > 0 &&
      !prod.colors.every((c: any) => !c.name || c.name.toLowerCase() === 'default')
    );

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newSku = 'KT-' + randomSuffix;
    const baseSlug = (prod.slug || prod.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/-copy-[a-z0-9]+/g, '');
    const newSlug = baseSlug + '-copy-' + randomSuffix.toLowerCase();

    const currentCatObj = categories.find(
      (c) =>
        c.slug.toLowerCase() === (prod.category_id || '').toLowerCase() ||
        c.id.toLowerCase() === (prod.category_id || '').toLowerCase()
    );
    const availableSubs = currentCatObj?.subcategories || [];
    const isCustomSub = Boolean(
      prod.sub_category &&
      !availableSubs.some((s) => s.toLowerCase() === (prod.sub_category || '').toLowerCase())
    );
    setIsCustomSubCategory(isCustomSub);

    setFormData({
      title: `${prod.title} (Copy)`,
      slug: newSlug,
      description: prod.description || '',
      price: prod.price ? prod.price.toString() : '',
      discount_percent: existingPercent > 0 ? existingPercent.toString() : '',
      category_id: prod.category_id || categories[0]?.slug || 'mens-fashion',
      sub_category: prod.sub_category || '',
      stock: prod.stock ? prod.stock.toString() : '0',
      sku: newSku,
      brand: prod.brand || '',
      warranty: prod.warranty || '',
      delivery_note: prod.delivery_note || '',
      dropshipping_url: prod.dropshipping_url || '',
      allowed_payment_methods: prod.allowed_payment_methods && prod.allowed_payment_methods.length > 0
        ? prod.allowed_payment_methods
        : ['cod', 'bkash', 'nagad', 'card'],
      payment_instruction: prod.payment_instruction || '',
      use_custom_seller_payment: !!prod.seller_payment?.use_custom_payment,
      seller_name: prod.seller_payment?.seller_name || '',
      seller_phone: prod.seller_payment?.seller_phone || '',
      seller_bkash_number: prod.seller_payment?.bkash_number || '',
      seller_bkash_type: prod.seller_payment?.bkash_type || 'Personal',
      seller_nagad_number: prod.seller_payment?.nagad_number || '',
      seller_nagad_type: prod.seller_payment?.nagad_type || 'Personal',
      seller_rocket_number: prod.seller_payment?.rocket_number || '',
      seller_rocket_type: prod.seller_payment?.rocket_type || 'Personal',
      seller_bank_name: prod.seller_payment?.bank_name || '',
      seller_bank_account_name: prod.seller_payment?.bank_account_name || '',
      seller_bank_account_number: prod.seller_payment?.bank_account_number || '',
      seller_bank_branch: prod.seller_payment?.bank_branch || '',
      seller_bank_routing_number: prod.seller_payment?.bank_routing_number || '',
      seller_custom_payment_note: prod.seller_payment?.custom_payment_note || '',
      is_featured: false,
      is_trending: false,
      is_affiliate_enabled: !!prod.is_affiliate_enabled,
      affiliate_commission_rate: prod.affiliate_commission_rate ? String(prod.affiliate_commission_rate) : '10',
      hasColorVariants: hasRealColors,
      imageUrl1: prod.images?.[0] || mappedVariants[0]?.imageUrl1 || '',
      imageUrl2: prod.images?.[1] || mappedVariants[0]?.imageUrl2 || '',
      imageUrl3: prod.images?.[2] || mappedVariants[0]?.imageUrl3 || '',
      imageUrl4: prod.images?.[3] || mappedVariants[0]?.imageUrl4 || '',
      colorVariants: mappedVariants,
      selectedSizes: prod.sizes || [],
      customSizeInput: '',
      colors: prod.colors
        ? prod.colors.map((c: any) => ({
            name: c.name || '',
            hex: c.hex || '#EC4899',
            price: c.price ?? null,
            image: c.image || null,
            stock: c.stock ?? null,
          }))
        : [],
      newColorName: '',
      newColorHex: '#EC4899',
      newColorPrice: '',
      newColorImage: '',
      newColorStock: '',
      customAttributes: prod.custom_attributes || (prod.specifications?.custom_attributes as any) || [],
      newAttrType: 'Size',
      newAttrName: '',
      newAttrPrice: '',
      newAttrStock: '',
      highlight1: prod.highlights?.[0] || '',
      highlight2: prod.highlights?.[1] || '',
      highlight3: prod.highlights?.[2] || '',
      fabric: prod.fabric || '',
      fit_type: prod.fit_type || '',
      care_instructions: prod.care_instructions || '',
      origin: prod.origin || '',
      gender: prod.gender || '',
      specKey1: specEntries[0]?.[0] ? String(specEntries[0][0]) : '',
      specVal1: specEntries[0]?.[1] !== undefined ? String(specEntries[0][1]) : '',
      specKey2: specEntries[1]?.[0] ? String(specEntries[1][0]) : '',
      specVal2: specEntries[1]?.[1] !== undefined ? String(specEntries[1][1]) : '',
      specKey3: specEntries[2]?.[0] ? String(specEntries[2][0]) : '',
      specVal3: specEntries[2]?.[1] !== undefined ? String(specEntries[2][1]) : '',
      tags: Array.isArray(prod.tags) ? prod.tags.join(', ') : (typeof prod.tags === 'string' ? prod.tags : ''),
    });
    setActiveModalTab('general');
    setIsModalOpen(true);
    toast.success(`"${prod.title}" ডুপ্লিকেট করা হয়েছে! পরিবর্তন করে 'Create Product' এ ক্লিক করুন।`);
  };

  const handleToggleSize = (size: string) => {
    setFormData((prev) => {
      const exists = prev.selectedSizes.includes(size);
      return {
        ...prev,
        selectedSizes: exists
          ? prev.selectedSizes.filter((s) => s !== size)
          : [...prev.selectedSizes, size],
      };
    });
  };

  const handleAddCustomSize = () => {
    const raw = formData.customSizeInput.trim();
    if (!raw) return;
    if (formData.selectedSizes.includes(raw)) {
      toast.info(`Size "${raw}" is already in the list`);
      setFormData((prev) => ({ ...prev, customSizeInput: '' }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      selectedSizes: [...prev.selectedSizes, raw],
      customSizeInput: '',
    }));
    toast.success(`Size "${raw}" added!`);
  };

  const handleSelectPresetColor = (preset: { name: string; hex: string }) => {
    setFormData((prev) => ({
      ...prev,
      newColorName: preset.name,
      newColorHex: preset.hex,
    }));
  };

  const handleAddColor = () => {
    if (!formData.newColorName.trim()) {
      toast.error('Please enter a color name (e.g. Pink, Red, Yellow)');
      return;
    }
    const colorItem: ProductColorOption = {
      name: formData.newColorName.trim(),
      hex: formData.newColorHex || '#EC4899',
    };
    if (formData.newColorPrice && !isNaN(Number(formData.newColorPrice))) {
      colorItem.price = Number(formData.newColorPrice);
    }
    if (formData.newColorImage?.trim()) {
      colorItem.image = formData.newColorImage.trim();
    }
    if (formData.newColorStock && !isNaN(Number(formData.newColorStock))) {
      colorItem.stock = Number(formData.newColorStock);
    }

    setFormData((prev) => ({
      ...prev,
      colors: [...prev.colors, colorItem],
      newColorName: '',
      newColorHex: '#EC4899',
      newColorPrice: '',
      newColorImage: '',
      newColorStock: '',
    }));
    toast.success(`Color option "${colorItem.name}" added`);
  };

  const handleRemoveColor = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateColorPrice = (index: number, val: string) => {
    setFormData((prev) => {
      const copy = [...prev.colors];
      const parsed = Number(val);
      if (!val.trim() || isNaN(parsed)) {
        copy[index] = { ...copy[index], price: null };
      } else {
        copy[index] = { ...copy[index], price: parsed };
      }
      return { ...prev, colors: copy };
    });
  };

  const handleColorFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsColorImageUploading(true);
    const toastId = toast.loading('Device থেকে ছবি আপলোড হচ্ছে...');

    try {
      const url = await uploadToCloudinary(file);
      setFormData((prev) => ({ ...prev, newColorImage: url }));
      toast.success('কালারের ছবি সফলভাবে আপলোড হয়েছে!', { id: toastId });
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Upload failed', { id: toastId });
    } finally {
      setIsColorImageUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleUpdateCardColorImage = async (index: number, file: File) => {
    if (!file) return;
    const toastId = toast.loading('ছবি আপলোড হচ্ছে...');
    try {
      const url = await uploadToCloudinary(file);
      setFormData((prev) => {
        const copy = [...prev.colors];
        copy[index] = { ...copy[index], image: url };
        return { ...prev, colors: copy };
      });
      toast.success('কালারের ছবি আপডেট হয়েছে!', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Upload failed', { id: toastId });
    }
  };

  const handleAssignGalleryPhoto = (index: number, url: string) => {
    setFormData((prev) => {
      const copy = [...prev.colors];
      copy[index] = { ...copy[index], image: url };
      return { ...prev, colors: copy };
    });
    toast.success('গ্যালারির ছবি কালারে যুক্ত হয়েছে!');
  };

  const handleRemoveCardColorImage = (index: number) => {
    setFormData((prev) => {
      const copy = [...prev.colors];
      copy[index] = { ...copy[index], image: null };
      return { ...prev, colors: copy };
    });
  };

  const handleAddCustomAttribute = () => {
    if (!formData.newAttrName.trim()) {
      toast.error('Please enter an option name (e.g. Free Size, XL, 500ml)');
      return;
    }
    const newOption: ProductCustomAttributeOption = {
      id: 'attr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      attributeName: formData.newAttrType.trim() || 'Custom',
      name: formData.newAttrName.trim(),
    };
    if (formData.newAttrPrice && !isNaN(Number(formData.newAttrPrice))) {
      newOption.price = Number(formData.newAttrPrice);
    }
    if (formData.newAttrStock && !isNaN(Number(formData.newAttrStock))) {
      newOption.stock = Number(formData.newAttrStock);
    }

    setFormData((prev) => ({
      ...prev,
      customAttributes: [...prev.customAttributes, newOption],
      newAttrName: '',
      newAttrPrice: '',
      newAttrStock: '',
    }));
    toast.success(`Option "${newOption.name}" added under ${newOption.attributeName}`);
  };

  const handleRemoveCustomAttribute = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      customAttributes: prev.customAttributes.filter((a) => a.id !== id),
    }));
  };

  const handleApplyMasterToAllVariants = () => {
    if (!formData.price && !formData.stock) {
      toast.error('অনুগ্রহ করে প্রথমে মাস্টার মূল্য বা স্টক লিখুন!');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      colorVariants: (prev.colorVariants || []).map((cv) => ({
        ...cv,
        price: prev.price || cv.price,
        discount_percent: prev.discount_percent !== undefined && prev.discount_percent !== '' ? prev.discount_percent : cv.discount_percent,
        stock: prev.stock || cv.stock,
      })),
    }));
    toast.success(`সব কয়টি (${(formData.colorVariants || []).length}টি) কালার ভ্যারিয়েন্টে মাস্টার মূল্য, ডিসকাউন্ট ও স্টক সেট করা হয়েছে!`);
  };

  const handleUpdateVariantField = (id: string, field: keyof ColorVariantSection, value: string) => {
    setFormData((prev) => ({
      ...prev,
      colorVariants: (prev.colorVariants || []).map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAddColorVariant = (colorName: string = '', colorHex: string = '#EC4899') => {
    const newVariant: ColorVariantSection = {
      id: 'cv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      colorName,
      colorHex,
      price: formData.price || '',
      discount_percent: formData.discount_percent || '',
      stock: formData.stock || '',
      imageUrl1: '',
      imageUrl2: '',
      imageUrl3: '',
      imageUrl4: '',
    };
    setFormData((prev) => ({
      ...prev,
      colorVariants: [...(prev.colorVariants || []), newVariant],
    }));
    toast.success(colorName ? `"${colorName}" কালার ভ্যারিয়েন্ট যোগ করা হয়েছে!` : 'নতুন কালার ভ্যারিয়েন্ট যোগ করা হয়েছে!');
  };

  const handleRemoveColorVariant = (id: string) => {
    setFormData((prev) => {
      if ((prev.colorVariants || []).length <= 1) {
        toast.error('কমপক্ষে ১টি কালার ভ্যারিয়েন্ট থাকতে হবে!');
        return prev;
      }
      return {
        ...prev,
        colorVariants: prev.colorVariants.filter((item) => item.id !== id),
      };
    });
    toast.info('কালার ভ্যারিয়েন্ট ডিলিট করা হয়েছে');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSavingProduct) return;

    // 1. Validate Title
    const cleanTitle = (formData.title || '').trim();
    if (!cleanTitle) {
      toast.error('Product Title is required');
      setActiveModalTab('general');
      return;
    }

    // 2. Validate Price (allow master price or variant price)
    const effectivePrice = formData.price || formData.colorVariants?.[0]?.price || '';
    if (!effectivePrice || Number(effectivePrice) <= 0) {
      toast.error('Product Regular Price is required');
      setActiveModalTab('variants');
      return;
    }

    setIsSavingProduct(true);
    const toastId = toast.loading(editingProduct ? 'Saving changes...' : 'Creating product...');

    try {
      const priceNum = Number(effectivePrice);
      const percentNum = Number(formData.discount_percent || 0);
      let calculatedDiscountPrice: number | null = null;
      if (percentNum > 0 && percentNum < 100) {
        calculatedDiscountPrice = Math.round(priceNum - (priceNum * percentNum) / 100);
      }

      const rawSlug = formData.slug?.trim() || cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let slug = rawSlug.replace(/^-+|-+$/g, '') || ('product-' + Date.now());

      // If creating a NEW product (not editing an existing one), ensure slug is unique so it never overwrites another product
      if (!editingProduct) {
        const baseSlug = slug;
        let counter = 2;
        const allExistingSlugs = new Set([
          ...products.map((p) => p.slug),
          ...(JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]') as Product[]).map((p) => p.slug),
        ]);

        while (allExistingSlugs.has(slug)) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      // Collect image URLs and compiled colors
      const allImages: string[] = [];
      const compiledColors: ProductColorOption[] = [];

      if (!formData.hasColorVariants) {
        // Direct product photos without color variations
        [formData.imageUrl1, formData.imageUrl2, formData.imageUrl3, formData.imageUrl4].forEach((url) => {
          const trimmed = (url || '').trim();
          if (trimmed && !allImages.includes(trimmed)) {
            allImages.push(trimmed);
          }
        });
        // Fallback if user previously had images in colorVariants[0]
        if (allImages.length === 0 && formData.colorVariants && formData.colorVariants.length > 0) {
          [formData.colorVariants[0].imageUrl1, formData.colorVariants[0].imageUrl2, formData.colorVariants[0].imageUrl3, formData.colorVariants[0].imageUrl4].forEach((url) => {
            const trimmed = (url || '').trim();
            if (trimmed && !allImages.includes(trimmed)) {
              allImages.push(trimmed);
            }
          });
        }
      } else {
        // Collect all valid image URLs across all color variants
        (formData.colorVariants || []).forEach((cv) => {
          [cv.imageUrl1, cv.imageUrl2, cv.imageUrl3, cv.imageUrl4].forEach((url) => {
            const trimmed = (url || '').trim();
            if (trimmed && !allImages.includes(trimmed)) {
              allImages.push(trimmed);
            }
          });
        });

        // Extract color variants with individual 4 photos, custom price, discount & stock
        (formData.colorVariants || []).forEach((cv) => {
          const name = (cv.colorName || '').trim();
          const colorImages = [cv.imageUrl1, cv.imageUrl2, cv.imageUrl3, cv.imageUrl4]
            .map((u) => (u || '').trim())
            .filter(Boolean);

          const colorPriceNum = cv.price && !isNaN(Number(cv.price)) ? Number(cv.price) : priceNum;
          const colorDiscountNum = cv.discount_percent && !isNaN(Number(cv.discount_percent)) ? Number(cv.discount_percent) : percentNum;
          let calculatedColorDiscountPrice: number | null = null;
          if (colorPriceNum && colorDiscountNum > 0 && colorDiscountNum < 100) {
            calculatedColorDiscountPrice = Math.round(colorPriceNum - (colorPriceNum * colorDiscountNum) / 100);
          }
          const colorStockNum = cv.stock && !isNaN(Number(cv.stock)) ? Number(cv.stock) : (formData.stock ? Number(formData.stock) : 10);

          if (name || colorImages.length > 0) {
            compiledColors.push({
              name: name || 'Default',
              hex: cv.colorHex || '#EC4899',
              price: colorPriceNum,
              discount_price: calculatedColorDiscountPrice,
              discount_percent: colorDiscountNum > 0 ? colorDiscountNum : null,
              stock: colorStockNum,
              image: colorImages[0] || null,
              images: colorImages,
            });
          }
        });
      }

      const highlightsList = [formData.highlight1, formData.highlight2, formData.highlight3]
        .map((h) => String(h || '').trim())
        .filter((h) => h.length > 0);

      const specsObj: Record<string, string> = {};
      const sKey1 = String(formData.specKey1 || '').trim();
      const sVal1 = typeof formData.specVal1 === 'object' ? '' : String(formData.specVal1 ?? '').trim();
      if (sKey1 && sVal1) specsObj[sKey1] = sVal1;

      const sKey2 = String(formData.specKey2 || '').trim();
      const sVal2 = typeof formData.specVal2 === 'object' ? '' : String(formData.specVal2 ?? '').trim();
      if (sKey2 && sVal2) specsObj[sKey2] = sVal2;

      const sKey3 = String(formData.specKey3 || '').trim();
      const sVal3 = typeof formData.specVal3 === 'object' ? '' : String(formData.specVal3 ?? '').trim();
      if (sKey3 && sVal3) specsObj[sKey3] = sVal3;

      const userTags = Array.isArray(formData.tags)
        ? (formData.tags as any[]).map((t) => String(t || '').trim()).filter(Boolean)
        : (typeof formData.tags === 'string' && formData.tags
            ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
            : []);

      const autoKeywords = [
        ...userTags,
        cleanTitle.toLowerCase(),
        currentSpecMode === 'fashion' ? (formData.fabric || '').toLowerCase() : '',
        currentSpecMode === 'fashion' ? (formData.gender || '').toLowerCase() : '',
      ];
      const uniqueTags = Array.from(new Set(autoKeywords.filter(Boolean)));

      let cleanedFabric = String(formData.fabric || '').trim();
      let cleanedFitType = String(formData.fit_type || '').trim();
      let cleanedCare = String(formData.care_instructions || '').trim();
      let cleanedGender = String(formData.gender || '').trim() || null;
      let cleanedWarranty = String(formData.warranty || '').trim();
      let cleanedSpecs: Record<string, string> = { ...specsObj };

      const effectiveStock = Number(formData.stock) || (compiledColors.reduce((sum, c) => sum + (c.stock || 0), 0) || 10);

      const productPayload: any = {
        title: cleanTitle,
        slug: slug,
        description: String(formData.description || '').trim(),
        price: priceNum,
        discount_price: calculatedDiscountPrice,
        category_id: formData.category_id || categories[0]?.slug || 'mens-fashion',
        stock: effectiveStock,
        images: allImages.length > 0 ? allImages : ['/logo.webp'],
        brand: String(formData.brand || '').trim() || 'No Brand',
        sku: String(formData.sku || '').trim() || ('KT-' + (editingProduct?.id || Date.now().toString()).slice(0, 6).toUpperCase()),
        warranty: cleanedWarranty,
        delivery_note: String(formData.delivery_note || '').trim(),
        dropshipping_url: String(formData.dropshipping_url || '').trim() || null,
        allowed_payment_methods: formData.allowed_payment_methods && formData.allowed_payment_methods.length > 0
          ? formData.allowed_payment_methods
          : ['cod', 'bkash', 'nagad', 'card'],
        payment_instruction: String(formData.payment_instruction || '').trim(),
        highlights: highlightsList,
        fabric: cleanedFabric,
        fit_type: cleanedFitType,
        care_instructions: cleanedCare,
        origin: (formData.origin || '').trim() || 'Made in Bangladesh',
        gender: cleanedGender,
        specifications: {
          ...(editingProduct?.specifications || {}),
          ...cleanedSpecs,
          sub_category: String(formData.sub_category || '').trim(),
          spec_mode: currentSpecMode,
          custom_attributes: formData.customAttributes || [],
        },
        sub_category: String(formData.sub_category || '').trim(),
        spec_mode: currentSpecMode,
        tags: uniqueTags,
        sizes: formData.selectedSizes || [],
        colors: compiledColors,
        custom_attributes: formData.customAttributes || [],
        is_featured: !!formData.is_featured,
        is_trending: !!formData.is_trending,
        is_affiliate_enabled: !!formData.is_affiliate_enabled,
        affiliate_commission_rate: formData.is_affiliate_enabled ? Number(formData.affiliate_commission_rate) || 10 : 0,
        rating: editingProduct?.rating || 0,
        review_count: editingProduct?.review_count || 0,
      };

      const targetId = editingProduct?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : ('00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0')));
      const completeProduct: Product = {
        id: targetId,
        ...productPayload,
      } as Product;

      // 1. INSTANT LOCAL REACTIVITY (0ms - Closes modal immediately so user is never stuck!)
      try {
        const savedCustom: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
        const existingIdx = editingProduct
          ? savedCustom.findIndex((p) => p.id === editingProduct.id)
          : -1;

        let updatedCustom: Product[];
        if (existingIdx >= 0) {
          updatedCustom = [...savedCustom];
          updatedCustom[existingIdx] = completeProduct;
        } else {
          updatedCustom = [completeProduct, ...savedCustom];
        }

        localStorage.setItem('kintesi_custom_products', JSON.stringify(updatedCustom));
        window.dispatchEvent(new Event('kintesi_products_updated'));
      } catch (locErr) {
        console.warn('localStorage update notice in handleSubmit:', locErr);
      }

      setProducts((prev) => {
        if (editingProduct) {
          const idx = prev.findIndex((p) => p.id === editingProduct.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = completeProduct;
            return next;
          }
        }
        return [completeProduct, ...prev];
      });

      setIsModalOpen(false);
      toast.success(editingProduct ? 'Changes saved successfully!' : 'Product created successfully!', { id: toastId });

      // 2. BACKGROUND CLOUD SYNC (Non-blocking: saves to Supabase and Firestore in background)
      Promise.resolve().then(async () => {
        try {
          await saveProductToDB(completeProduct);
          loadProducts();
        } catch (cloudErr) {
          console.warn('Background cloud product save notice:', cloudErr);
        }
      });
    } catch (err: any) {
      console.error('Save product error:', err);
      toast.error(err?.message || 'Failed to save product. Please check form inputs.', { id: toastId });
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDelete = async (prod: Product) => {
    if (!isSuperAdmin) {
      toast.error('Permission Denied: Only Master Admin (Owner) can delete products.');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete "${prod.title}"?`)) return;

    try {
      // 1. Delete from Supabase Database by ID and Slug
      const isUUID = (str?: string) =>
        str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) : false;

      if (isUUID(prod.id)) {
        const { error } = await supabase.from('products').delete().eq('id', prod.id);
        if (error) console.warn('Supabase delete by id notice:', error.message);
      }
      if (prod.slug) {
        const { error } = await supabase.from('products').delete().eq('slug', prod.slug);
        if (error) console.warn('Supabase delete by slug notice:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase delete warning:', err?.message || err);
    }

    // 2. Remove permanently from local storage cache and Firestore
    await deleteProductFromDB(prod.id);
    const savedCustom: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
    const cleanCustom = savedCustom.filter((p) => p.id !== prod.id && p.slug !== prod.slug);
    localStorage.setItem('kintesi_custom_products', JSON.stringify(cleanCustom));

    // 3. Update React state immediately
    setProducts((prev) => prev.filter((p) => p.id !== prod.id && p.slug !== prod.slug));

    // 4. Notify entire app
    window.dispatchEvent(new Event('kintesi_products_updated'));

    toast.success(`Product "${prod.title}" permanently deleted!`);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredColorPresets = colorPresets.filter((c) =>
    c.name.toLowerCase().includes(colorPresetSearch.toLowerCase().trim()) ||
    c.hex.toLowerCase().includes(colorPresetSearch.toLowerCase().trim())
  );

  const filteredModalSizes = sizePresets.filter((s) => {
    const matchesSearch = s.toLowerCase().includes(sizePresetSearch.toLowerCase().trim());
    if (!matchesSearch) return false;

    if (modalSizeCategory === 'all') return true;
    if (modalSizeCategory === 'apparel') return ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', 'Free Size', 'Semi-Stitched', 'Unstitched'].includes(s);
    if (modalSizeCategory === 'storage') return s.endsWith('GB') || s.endsWith('TB');
    if (modalSizeCategory === 'volume') return s.endsWith('ml') || s.endsWith('L');
    if (modalSizeCategory === 'weight') return s.endsWith('g') || s.endsWith('kg');
    if (modalSizeCategory === 'footwear') return ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'].includes(s);
    return true;
  });

  return (
    <div className="w-full space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Product Catalog & Inventory</h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage comprehensive product specifications, variants, multi-image galleries & percentage discounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClearDemoCache}
            className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold rounded-2xl transition flex items-center gap-1.5 text-xs"
            title="Clean mock demo cache"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Demo Cache</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition flex items-center gap-2 text-xs shadow-lg shadow-rose-600/30 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by title, brand, or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-white text-xs w-full focus:outline-none placeholder:text-gray-500"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Product Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/50 text-[11px] font-black uppercase tracking-wider text-gray-400">
                <th className="p-4">Product Info</th>
                <th className="p-4">Category & Brand</th>
                <th className="p-4">Price & Savings</th>
                <th className="p-4">Variants</th>
                <th className="p-4">Stock</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-800 border border-gray-700 text-rose-500 flex items-center justify-center mx-auto">
                        <Package className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-white">No Products in Store Catalog</p>
                      <p className="text-xs text-gray-400">
                        {searchQuery ? 'No products match your search query.' : 'All mock products have been cleared. Click below to add your first real product.'}
                      </p>
                      <button
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30 transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Product</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const discountPercent = calculateDiscount(prod.price, prod.discount_price);
                  return (
                    <tr key={prod.id} className="hover:bg-gray-800/40 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images?.[0] || '/logo.webp'}
                            alt={prod.title}
                            className="w-12 h-12 object-cover rounded-xl bg-gray-800 border border-gray-700 flex-shrink-0"
                          />
                          <div className="max-w-xs">
                            <p className="font-bold text-white line-clamp-1">{prod.title}</p>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[10px] text-gray-400 font-mono">
                                SKU: {prod.sku || 'N/A'} • {prod.images?.length || 1} Images
                              </span>
                              {prod.dropshipping_url && (
                                <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                                  🔗 Dropship
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        {(() => {
                          const catObj = categories.find(
                            (c) => c.slug === prod.category_id || c.id === prod.category_id
                          );
                          const catName = catObj?.name || prod.category_id.replace(/[-_]/g, ' ');
                          return (
                            <div className="space-y-0.5">
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-400 font-bold rounded-lg text-[10px] max-w-[220px] truncate"
                                title={`${catName} > ${prod.sub_category || 'General'}`}
                              >
                                <span className="truncate">{catName}</span>
                                {prod.sub_category && (
                                  <>
                                    <span className="text-gray-500 font-black">&gt;</span>
                                    <span className="text-amber-300 truncate font-semibold">{prod.sub_category}</span>
                                  </>
                                )}
                              </span>
                              <span className="text-[11px] text-gray-400 mt-1 block">{prod.brand || 'No Brand'}</span>
                            </div>
                          );
                        })()}
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-black text-white text-sm">
                            {formatPrice(prod.discount_price || prod.price)}
                          </p>
                          {prod.discount_price && (
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="line-through text-gray-500">{formatPrice(prod.price)}</span>
                              <span className="bg-rose-500/20 text-rose-400 font-black px-1.5 py-0.2 rounded">
                                -{discountPercent}%
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          {prod.sizes && prod.sizes.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {prod.sizes.slice(0, 3).map((s, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded text-[9px] font-bold">
                                  {s}
                                </span>
                              ))}
                              {prod.sizes.length > 3 && (
                                <span className="text-[9px] text-gray-500 font-bold">+{prod.sizes.length - 3}</span>
                              )}
                            </div>
                          )}
                          {prod.colors && prod.colors.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {prod.colors.map((c, i) => (
                                <span
                                  key={i}
                                  className="w-3.5 h-3.5 rounded-full border-[1.5px] border-dashed border-slate-500/80 shadow-2xs inline-block shrink-0"
                                  style={{ backgroundColor: c.hex }}
                                  title={c.name}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`font-black text-xs px-2.5 py-1 rounded-lg ${
                            prod.stock > 5
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : prod.stock > 0
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {prod.stock} in stock
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {prod.dropshipping_url && (
                            <a
                              href={prod.dropshipping_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-xl transition flex items-center gap-1 text-[11px] font-bold shadow-xs"
                              title={`সাপ্লায়ার লিংক ওপেন করুন:\n${prod.dropshipping_url}`}
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="hidden xl:inline">সাপ্লায়ার লিংক</span>
                            </a>
                          )}
                          <button
                            onClick={() => handleDuplicateProduct(prod)}
                            className="p-2 hover:bg-gray-800 text-indigo-400 rounded-xl transition cursor-pointer"
                            title="Duplicate Product (ডুপ্লিকেট করে নতুন বানান)"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-2 hover:bg-gray-800 text-emerald-400 rounded-xl transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isSuperAdmin ? (
                            <button
                              onClick={() => handleDelete(prod)}
                              className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer"
                              title="Delete Product (Master Admin)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-2 text-gray-600 opacity-30 cursor-not-allowed rounded-xl"
                              title="Delete restricted to Master Admin / Owner"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          FULL-PAGE RICH ADD / EDIT PRODUCT STUDIO
         ======================================================== */}
      {isModalOpen && createPortal(
        <div className={`fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999] w-screen h-screen m-0 p-0 ${isLight ? 'bg-white admin-light text-gray-900' : 'bg-gray-950 text-white'} flex flex-col overflow-hidden`}>
          
          {/* Studio Top Fixed Header */}
          <div className={`px-6 py-4 border-b ${isLight ? 'bg-white/95 border-gray-200 shadow-xs' : 'bg-gray-900/95 border-gray-800 shadow-md'} backdrop-blur-md flex items-center justify-between shrink-0`}>
            <div>
              <h3 className={`text-xl font-black ${isLight ? 'text-gray-900' : 'text-white'} flex items-center gap-2.5`}>
                <Package className="w-6 h-6 text-emerald-500" />
                <span>{editingProduct ? 'Edit Product Details' : 'Add New Product'}</span>
                {formData.title && (
                  <span className={`text-sm font-bold ${isLight ? 'text-gray-500' : 'text-gray-400'} truncate max-w-md hidden sm:inline`}>
                    — {formData.title}
                  </span>
                )}
              </h3>
              
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {editingProduct ? (
                <button
                  type="button"
                  onClick={() => handleDuplicateProduct(editingProduct)}
                  className={`px-3.5 py-2 ${isLight ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'} font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer`}
                  title="Make a copy of this product to create a new one"
                >
                  <Copy className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Duplicate as New</span>
                </button>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                    className={`px-3.5 py-2 ${isLight ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'} font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer`}
                    title="Copy details from an existing product"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Copy from Existing</span>
                  </button>
                  {showTemplatePicker && (
                    <div className={`absolute right-0 mt-2 w-80 sm:w-96 ${isLight ? 'bg-white border-slate-200 shadow-2xl' : 'bg-gray-900 border-gray-700 shadow-2xl'} border rounded-2xl p-3 z-50 animate-fadeIn`}>
                      <div className="flex items-center justify-between pb-2 border-b border-gray-700/50">
                        <span className={`text-xs font-black ${isLight ? 'text-slate-800' : 'text-white'}`}>Select Product to Copy</span>
                        <button
                          type="button"
                          onClick={() => setShowTemplatePicker(false)}
                          className="text-gray-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-2 relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={templateSearchQuery}
                          onChange={(e) => setTemplateSearchQuery(e.target.value)}
                          placeholder="Search product name, SKU, brand..."
                          className={`w-full ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-gray-950 border-gray-800 text-white'} border rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500`}
                        />
                      </div>
                      <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
                        {filteredTemplateProducts.length === 0 ? (
                          <p className="text-center py-4 text-xs text-gray-500">No products found</p>
                        ) : (
                          filteredTemplateProducts.slice(0, 15).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                handleDuplicateProduct(p);
                                setShowTemplatePicker(false);
                              }}
                              className={`w-full text-left p-2 ${isLight ? 'hover:bg-slate-100' : 'hover:bg-gray-800'} rounded-xl flex items-center gap-2.5 transition cursor-pointer`}
                            >
                              <img
                                src={p.images?.[0] || '/logo.webp'}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover bg-gray-950 border border-gray-700 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'} truncate`}>{p.title}</p>
                                <p className="text-[10px] text-gray-400">
                                  ৳{p.price} {p.sku ? `• ${p.sku}` : ''} • {p.category_id}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-400 shrink-0">Copy</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'} font-bold rounded-xl text-xs transition cursor-pointer`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingProduct}
                onClick={() => handleSubmit()}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition shadow-lg shadow-rose-600/30 flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSavingProduct ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isSavingProduct ? 'Saving...' : (editingProduct ? 'Save Changes' : 'Create Product')}</span>
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-2 ${isLight ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900' : 'hover:bg-gray-800 text-gray-400 hover:text-white'} rounded-full transition ml-2 cursor-pointer`}
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Minimal Studio Segmented Tabs */}
          <div className={`flex items-center gap-1 border-b ${isLight ? 'border-gray-200 bg-slate-50/80' : 'border-gray-800 bg-gray-900/60'} px-4 sm:px-8 py-2 overflow-x-auto no-scrollbar shrink-0`}>
            {[
              { id: 'general', label: '📦 General & Pricing', desc: 'Title, Price & Stock' },
              { id: 'variants', label: formData.hasColorVariants ? '🎨 Colors, Photos & Pricing' : '📷 Photos, Sizes & Pricing', count: (formData.hasColorVariants ? (formData.colorVariants?.length || 0) : ([formData.imageUrl1, formData.imageUrl2, formData.imageUrl3, formData.imageUrl4].filter(Boolean).length)) + formData.selectedSizes.length },
              { id: 'specs', label: '📋 Description & Specs', desc: 'Details & Specs' },
              { id: 'delivery', label: '🚚 Delivery & Payment', desc: 'Shipping & Payment' },
              { id: 'tags', label: '🏷️ Search Tags & Taxonomy', desc: 'Keywords' },
            ].map((tab) => {
              const isActive = activeModalTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveModalTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                    isActive
                      ? isLight
                        ? 'bg-white text-emerald-700 border border-emerald-300 shadow-2xs font-black'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                      : isLight
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-white border border-transparent'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border border-transparent'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Studio Scrollable Full-Page Body */}
          <div className={`flex-1 overflow-y-auto p-4 sm:p-8 ${isLight ? 'bg-slate-50/60' : 'bg-gray-950'}`}>
            <form id="admin-product-studio-form" noValidate onSubmit={handleSubmit} className="w-full max-w-7xl mx-auto space-y-6 pb-12">
              {/* Tab 1: General & Pricing */}
              {activeModalTab === 'general' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Quick Copy / Template Banner */}
                  <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${isLight ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950' : 'bg-indigo-950/30 border-indigo-800/50 text-indigo-200'}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <Copy className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black block">
                          {editingProduct ? 'Duplicate this product to create a new one' : 'Create similar product from an existing one'}
                        </span>
                        <span className="text-[11px] opacity-80 block truncate">
                          অন্য কোনো প্রোডাক্টের অনুরূপ তৈরি করতে এক ক্লিকেই সম্পূর্ণ তথ্য কপি করে নিন (ক্যাটাগরি, স্পেক্স, ছবি ইত্যাদি)
                        </span>
                      </div>
                    </div>
                    {editingProduct ? (
                      <button
                        type="button"
                        onClick={() => handleDuplicateProduct(editingProduct)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>ডুপ্লিকেট করে নতুন বানান</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowTemplatePicker(true)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>অন্য প্রোডাক্ট থেকে কপি করুন</span>
                      </button>
                    )}
                  </div>

                  {/* Section 1: Basic Identifiers */}
              <div className={`space-y-4 p-5 rounded-2xl border ${isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-gray-950/60 border-gray-800/80'}`}>
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <Tag className="w-4 h-4" /> Basic Identifiers & Brand
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-bold ${isLight ? 'text-gray-700' : 'text-gray-300'} mb-1`}>Product Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sony WH-1000XM5 Wireless Noise Cancelling Headphones"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold ${isLight ? 'text-gray-700' : 'text-gray-300'} mb-1`}>Brand Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Apple, Nike, CeraVe, Sony"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold ${isLight ? 'text-gray-700' : 'text-gray-300'} mb-1`}>Category *</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        const catObj = categories.find(
                          (c) => c.slug.toLowerCase() === newCat.toLowerCase() || c.id.toLowerCase() === newCat.toLowerCase()
                        );
                        const availableSubs = catObj?.subcategories || [];
                        const isStillValid = availableSubs.some(
                          (s) => s.toLowerCase() === (formData.sub_category || '').toLowerCase()
                        );
                        setFormData({
                          ...formData,
                          category_id: newCat,
                          sub_category: isStillValid ? formData.sub_category : '',
                        });
                        if (!isStillValid) {
                          setIsCustomSubCategory(false);
                        }
                      }}
                      className={`w-full ${isLight ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'} border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-rose-500 cursor-pointer`}
                    >
                      {formData.category_id && !categories.some((c) => (c.slug === formData.category_id || c.id === formData.category_id)) && (
                        <option value={formData.category_id}>
                          {formData.category_id.replace(/[-_]/g, ' ').toUpperCase()} (Current Selected)
                        </option>
                      )}
                      {categories.map((cat) => (
                        <option key={cat.slug || cat.id} value={cat.slug || cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Professional Clean Sub-Category Dropdown */}
                  {(() => {
                    const currentCatObj = categories.find(
                      (c) =>
                        c.slug.toLowerCase() === (formData.category_id || '').toLowerCase() ||
                        c.id.toLowerCase() === (formData.category_id || '').toLowerCase()
                    );
                    const availableSubs = (currentCatObj?.subcategories && currentCatObj.subcategories.length > 0)
                      ? currentCatObj.subcategories
                      : [];

                    const isPredefined = availableSubs.some(
                      (s) => s.toLowerCase() === (formData.sub_category || '').toLowerCase()
                    );

                    return (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={`block text-xs font-bold ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                            Sub-Category (সাব-ক্যাটাগরি)
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsCustomSubCategory(!isCustomSubCategory)}
                            className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                          >
                            {isCustomSubCategory ? '← ড্রপডাউন লিস্টে ফিরুন' : '+ নতুন কাস্টম লিখুন'}
                          </button>
                        </div>

                        {isCustomSubCategory ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="নতুন সাব-ক্যাটাগরির নাম লিখুন (e.g. Silk Sharee)..."
                              value={formData.sub_category || ''}
                              onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                              className={`w-full ${isLight ? 'bg-gray-50 border-rose-300 text-gray-900' : 'bg-gray-900 border-rose-500 text-white'} border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500`}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomSubCategory(false);
                                if (!isPredefined) {
                                  setFormData({ ...formData, sub_category: availableSubs[0] || '' });
                                }
                              }}
                              className={`px-3.5 py-2.5 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'} rounded-xl text-xs font-bold transition cursor-pointer shrink-0`}
                            >
                              লিস্ট
                            </button>
                          </div>
                        ) : (
                          <select
                            value={formData.sub_category || ''}
                            onChange={(e) => {
                              if (e.target.value === '__add_custom__') {
                                setIsCustomSubCategory(true);
                              } else {
                                setFormData({ ...formData, sub_category: e.target.value });
                              }
                            }}
                            className={`w-full ${isLight ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'} border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-rose-500 cursor-pointer`}
                          >
                            <option value="">-- সাব-ক্যাটাগরি সিলেক্ট করুন (Select Sub-Category) --</option>
                            {availableSubs.map((sub) => (
                              <option key={sub} value={sub}>
                                {sub}
                              </option>
                            ))}
                            {formData.sub_category && !isPredefined && (
                              <option value={formData.sub_category}>
                                {formData.sub_category} (Custom)
                              </option>
                            )}
                            <option value="__add_custom__" className="text-rose-600 font-bold">
                              ✍️ + অন্য কাস্টম সাব-ক্যাটাগরি লিখুন...
                            </option>
                          </select>
                        )}

                        {/* Live Category > Subcategory Breadcrumb Preview */}
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs mt-2 border ${
                          isLight ? 'bg-rose-50/70 border-rose-200 text-rose-950' : 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                        }`}>
                          <span className="text-gray-400 font-bold text-[11px]">Hierarchy Preview:</span>
                          <span className="font-black text-rose-600 dark:text-rose-400">
                            {currentCatObj?.name || 'Category'}
                          </span>
                          <span className="text-gray-400 font-black">&gt;</span>
                          <span className={`font-black ${formData.sub_category ? 'text-amber-500 dark:text-amber-300' : 'text-gray-400 italic'}`}>
                            {formData.sub_category || 'No sub-category selected'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <label className={`block text-xs font-bold ${isLight ? 'text-gray-700' : 'text-gray-300'} mb-1`}>SKU / Model Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CF-SONY-XM5-BLK"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={`block text-xs font-bold ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                        Warranty Policy / Period (Optional)
                      </label>
                      {formData.warranty && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, warranty: '' })}
                          className="text-[10px] text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
                        >
                          ✕ Turn Off / No Warranty
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 1 Year Official Brand Warranty (or leave blank for No Warranty)"
                      value={formData.warranty}
                      onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 mb-2"
                    />
                    
                    {/* Quick Warranty Presets */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'No Warranty', val: '' },
                        { label: '7 Days Replacement', val: '7 Days Replacement Warranty' },
                        { label: '6 Months Warranty', val: '6 Months Brand Warranty' },
                        { label: '1 Year Warranty', val: '1 Year Official Brand Warranty' },
                        { label: '2 Years Warranty', val: '2 Years Official Warranty' },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.label}
                          onClick={() => setFormData({ ...formData, warranty: item.val })}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                            formData.warranty === item.val
                              ? 'bg-rose-600 text-white border-rose-500 font-bold shadow-xs'
                              : isLight
                              ? 'bg-slate-50 hover:bg-slate-100 text-gray-700 border-gray-200'
                              : 'bg-gray-900 hover:bg-gray-800 text-gray-400 border-gray-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dropshipping & Supplier Source Link (Admin Only) */}
                <div className={`pt-2 border-t ${isLight ? 'border-gray-200' : 'border-gray-800/80'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Dropshipping / Supplier Source Link (ড্রপশিপিং ও সাপ্লায়ার লিংক)</span>
                    </label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'}`}>
                      🔒 শুধুমাত্র অ্যাডমিনের জন্য
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="e.g. https://aliexpress.com/item/... অথবা Daraz, 1688, Amazon সাপ্লায়ার প্রোডাক্ট লিংক"
                      value={formData.dropshipping_url}
                      onChange={(e) => setFormData({ ...formData, dropshipping_url: e.target.value })}
                      className="w-full bg-gray-900 border border-indigo-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono pl-9"
                    />
                    <Globe className="w-4 h-4 text-indigo-500 absolute left-3 top-3 pointer-events-none" />
                    {formData.dropshipping_url && (
                      <a
                        href={formData.dropshipping_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2 top-2 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-xs"
                      >
                        <ExternalLink className="w-3 h-3" /> টেস্ট ওপেন
                      </a>
                    )}
                  </div>
                  
                </div>
              </div>
                  {/* Section 2: Pricing & Color Variants Quick Link & Badges */}
              <div className={`space-y-4 p-5 rounded-2xl border ${isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-gray-950/60 border-gray-800/80'}`}>
                {/* Feature & Trending Toggles */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Visibility & Promotion Badges
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex items-center gap-2 cursor-pointer text-xs font-bold p-2.5 rounded-xl border transition ${isLight ? 'bg-slate-50/80 border-gray-200 text-gray-800 hover:border-gray-300' : 'bg-gray-900/60 border-gray-800 text-gray-300'}`}>
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span>🌟 Feature on Homepage Spotlight</span>
                    </label>

                    <label className={`flex items-center gap-2 cursor-pointer text-xs font-bold p-2.5 rounded-xl border transition ${isLight ? 'bg-slate-50/80 border-gray-200 text-gray-800 hover:border-gray-300' : 'bg-gray-900/60 border-gray-800 text-gray-300'}`}>
                      <input
                        type="checkbox"
                        checked={formData.is_trending}
                        onChange={(e) => setFormData({ ...formData, is_trending: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                      />
                      <span>🔥 Mark as Trending Best-Seller</span>
                    </label>
                  </div>
                </div>

                {/* Affiliate Program Configuration */}
                <div className={`space-y-4 p-5 rounded-2xl border ${isLight ? 'bg-white border-emerald-200 shadow-xs' : 'bg-gray-950/60 border-emerald-500/20'}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                      <Share2 className="w-4 h-4" /> Affiliate Program (অ্যাফিলিয়েট প্রোগ্রাম কমিশন)
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${formData.is_affiliate_enabled ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                      {formData.is_affiliate_enabled ? '✓ Enabled for this product' : 'Disabled'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <label className={`flex items-center gap-3 cursor-pointer text-xs font-bold p-3 rounded-xl border transition ${isLight ? 'bg-emerald-50/50 border-emerald-200 text-gray-800 hover:border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'}`}>
                      <input
                        type="checkbox"
                        checked={formData.is_affiliate_enabled}
                        onChange={(e) => setFormData({ ...formData, is_affiliate_enabled: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span>এই প্রোডাক্টের জন্য অ্যাফিলিয়েট প্রোগ্রাম চালু করুন (Enable Affiliate Program)</span>
                        <p className="text-[11px] font-normal text-gray-400 mt-0.5">
                          অন থাকলে পার্টনাররা এই প্রোডাক্টের SKU দিয়ে লিংক তৈরি করতে পারবে এবং সেল হলে কমিশন পাবে। অফ থাকলে Non-Affiliate দেখাবে।
                        </p>
                      </div>
                    </label>

                    {formData.is_affiliate_enabled && (
                      <div className={`p-4 rounded-xl border space-y-2 ${isLight ? 'bg-slate-50 border-emerald-200' : 'bg-gray-900 border-emerald-500/20'}`}>
                        <label className={`block text-xs font-bold ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                          অ্যাফিলিয়েট কমিশন শতকরা হার (%) *
                        </label>
                        <div className="relative max-w-xs">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="e.g. 10"
                            value={formData.affiliate_commission_rate}
                            onChange={(e) => setFormData({ ...formData, affiliate_commission_rate: e.target.value })}
                            className={`w-full rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-500 focus:outline-none focus:border-emerald-500 pr-8 ${isLight ? 'bg-white border border-gray-300' : 'bg-gray-950 border border-gray-700'}`}
                          />
                          <span className="absolute right-3 top-2 text-xs font-bold text-gray-400">%</span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          টিপস: প্রোডাক্টের সেল মূল্যের এই শতাংশ পরিমাণ টাকা পার্টনারের ওয়ালেটে যোগ হবে।
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Link to Tab 2 for Pricing & Colors */}
                <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isLight ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-amber-500/10 border-amber-500/30 text-white'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'}`}>
                      <Percent className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isLight ? 'text-amber-950' : 'text-white'}`}>
                        Pricing, Discounts & Inventory are managed in Colors & Photos
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('variants')}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shrink-0 cursor-pointer shadow-xs"
                  >
                    Go to Pricing & Colors →
                  </button>
                </div>
              </div>
            </div>
          )}

              {/* Tab 2: Sizes & Colors */}
              {activeModalTab === 'variants' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Section 1: Master Pricing, Discount & Stock Controller */}
                  <div className={`space-y-4 p-5 rounded-2xl border shadow-xs ${isLight ? 'bg-white border-amber-300' : 'bg-gray-950/80 border-amber-500/30'}`}>
                    <div className={`flex items-center justify-between gap-2 pb-2 border-b ${isLight ? 'border-gray-200' : 'border-gray-800'}`}>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Percent className="w-4 h-4" /> Master Pricing & Inventory
                      </h4>
                      <span className="text-[10px] bg-amber-500/10 text-amber-300 font-bold px-2.5 py-1 rounded-full border border-amber-500/20 shrink-0">
                        ⚡ Master Controller
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">Master Regular Price (৳) *</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 25000"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">Master Discount (%) (Optional)</label>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          placeholder="e.g. 15 for 15% OFF"
                          value={formData.discount_percent}
                          onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">Master Available Stock *</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 50"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                        />
                      </div>
                    </div>

                    {/* Live Calculated Sale Price Preview & Apply to All Button */}
                    <div className="p-3.5 bg-gray-900/90 border border-gray-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 font-medium">Customer Master Sale Price:</span>
                        <span className="text-emerald-400 font-black text-sm">
                          {formatPrice(
                            Number(formData.price || 0) > 0 && Number(formData.discount_percent || 0) > 0
                              ? Math.round(Number(formData.price) * (1 - Number(formData.discount_percent) / 100))
                              : Number(formData.price || 0)
                          )}
                        </span>
                        
                      </div>

                      {/* The Apply to All Button requested by user */}
                      <button
                        type="button"
                        onClick={handleApplyMasterToAllVariants}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer shrink-0"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>⚡ Apply to All Color Variants</span>
                      </button>
                    </div>
                  </div>

                  {/* Section 2: Product Photos & Color Variation Mode */}
                  <div className="space-y-6">
                    {/* Mode Switcher: Standard (No Color) vs Color Variants */}
                    <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-gray-900/70 border-gray-800'}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-rose-500" />
                          <h4 className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Image Upload & Color Variation Mode
                          </h4>
                        </div>
                        <p className={`text-xs mt-0.5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                          যেসব প্রোডাক্টে কালার অপশন দেওয়ার দরকার নেই, সেগুলোতে "Standard (No Color)" সিলেক্ট করে সরাসরি ছবি আপলোড করুন
                        </p>
                      </div>

                      <div className={`inline-flex p-1 rounded-xl border shrink-0 ${isLight ? 'bg-slate-100 border-gray-200' : 'bg-gray-950 border-gray-800'}`}>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, hasColorVariants: false }))}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            !formData.hasColorVariants
                              ? 'bg-rose-600 text-white shadow-xs'
                              : isLight ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Standard (No Color / কোনো কালার ছাড়া)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, hasColorVariants: true }))}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            formData.hasColorVariants
                              ? 'bg-rose-600 text-white shadow-xs'
                              : isLight ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <Palette className="w-3.5 h-3.5" />
                          <span>With Colors (কালার ভ্যারিয়েন্ট সহ)</span>
                        </button>
                      </div>
                    </div>

                    {!formData.hasColorVariants ? (
                      /* Mode A: Direct 4-Photo Uploader (No Color Selection Required) */
                      <div className={`space-y-4 p-5 rounded-2xl border ${isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-gray-950/80 border-gray-800 shadow-md'}`}>
                        <div className={`flex items-center justify-between gap-2 pb-2 border-b ${isLight ? 'border-gray-200' : 'border-gray-800'}`}>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                              <ImageIcon className="w-4 h-4" /> Product Photos (Direct Upload / কোনো কালার ছাড়া)
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              কাস্টমার প্রোডাক্ট পেইজে সরাসরি এই ছবিগুলো দেখতে পাবে, কোনো কালার অপশন সিলেক্ট করতে হবে না
                            </p>
                          </div>
                          <span className="text-[10px] bg-rose-500/10 text-rose-400 font-bold px-2.5 py-1 rounded-full border border-rose-500/20 shrink-0">
                            4 Photo Slots
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                          <ImageUploader
                            label="Photo 1 (Main Cover) *"
                            value={formData.imageUrl1}
                            onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl1: url }))}
                            required
                          />
                          <ImageUploader
                            label="Photo 2 (Side / Angle)"
                            value={formData.imageUrl2}
                            onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl2: url }))}
                          />
                          <ImageUploader
                            label="Photo 3 (Detail / Lifestyle)"
                            value={formData.imageUrl3}
                            onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl3: url }))}
                          />
                          <ImageUploader
                            label="Photo 4 (Close-up / Extra)"
                            value={formData.imageUrl4}
                            onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl4: url }))}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Mode B: Color Variants with Individual Pricing & 4 Photos Each */
                      <div className="space-y-6">
                        <div className={`flex items-center justify-between gap-2 pb-2 border-b ${isLight ? 'border-gray-200' : 'border-gray-800'}`}>
                          <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                            <Palette className="w-4 h-4" /> Color Variants & 4 Photos Per Color
                          </h4>
                          <span className="text-[10px] bg-rose-500/10 text-rose-300 font-bold px-2.5 py-1 rounded-full border border-rose-500/20 shrink-0">
                            4 Photos Per Variant
                          </span>
                        </div>

                    {/* Color Variant Cards */}
                    <div className="space-y-6">
                      {(formData.colorVariants || []).map((variant, vIdx) => {
                        const vPrice = Number(variant.price || formData.price || 0);
                        const vDiscount = Number(variant.discount_percent !== undefined && variant.discount_percent !== '' ? variant.discount_percent : (formData.discount_percent || 0));
                        const vSalePrice = vPrice > 0 && vDiscount > 0 ? Math.round(vPrice * (1 - vDiscount / 100)) : vPrice;
                        const vStock = variant.stock !== undefined && variant.stock !== '' ? variant.stock : (formData.stock || '0');

                        return (
                          <div
                            key={variant.id}
                            className="space-y-4 bg-gray-950/80 p-5 rounded-2xl border border-gray-800 shadow-md transition hover:border-gray-700"
                          >
                            {/* Color Header: Swatch + Name + Price & Stock Row + Delete */}
                            <div className="flex flex-col gap-3 pb-3 border-b border-gray-800/80">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className="px-2.5 py-1 bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-black rounded-xl flex items-center gap-1.5">
                                    <Palette className="w-3.5 h-3.5" />
                                    <span>Color {vIdx + 1}{vIdx === 0 ? ' (Default)' : ''}</span>
                                  </span>

                                  {/* Color Picker Swatch */}
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={variant.colorHex}
                                      onChange={(e) => handleUpdateVariantField(variant.id, 'colorHex', e.target.value)}
                                      className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0 p-0 shrink-0"
                                      title="Select color"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Color name (e.g. Pink, White, Black)"
                                      value={variant.colorName}
                                      onChange={(e) => handleUpdateVariantField(variant.id, 'colorName', e.target.value)}
                                      className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 font-bold w-48"
                                    />
                                  </div>
                                </div>

                                {/* Delete button (if more than 1 variant) */}
                                {(formData.colorVariants || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveColorVariant(variant.id)}
                                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>

                              {/* Manual Price, Discount % & Stock Controls for THIS specific color */}
                              <div className="p-3 bg-gray-900/70 rounded-xl border border-gray-800/80 flex flex-wrap items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-gray-400">Regular (৳):</span>
                                  <input
                                    type="number"
                                    placeholder={`৳${formData.price || '0'}`}
                                    value={variant.price}
                                    onChange={(e) => handleUpdateVariantField(variant.id, 'price', e.target.value)}
                                    className="w-24 bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                                    title="Custom Regular Price for this color"
                                  />
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-gray-400">Discount (%):</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="99"
                                    placeholder={`${formData.discount_percent || '0'}%`}
                                    value={variant.discount_percent || ''}
                                    onChange={(e) => handleUpdateVariantField(variant.id, 'discount_percent', e.target.value)}
                                    className="w-18 bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                                    title="Custom Discount % for this color"
                                  />
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-gray-400">Stock:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder={`${formData.stock || '0'}`}
                                    value={variant.stock || ''}
                                    onChange={(e) => handleUpdateVariantField(variant.id, 'stock', e.target.value)}
                                    className="w-20 bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500"
                                    title="Available Stock for this color"
                                  />
                                </div>

                                {/* Live badge for this specific color */}
                                <div className="ml-auto flex items-center gap-2">
                                  <span className="text-[10px] text-gray-400 font-semibold">Sale Price:</span>
                                  <span className="text-emerald-400 font-black text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    {formatPrice(vSalePrice)}
                                  </span>
                                  {vDiscount > 0 && (
                                    <span className="text-rose-400 text-[10px] font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                                      -{vDiscount}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 4 Image Uploaders for THIS color - Exact layout from user's screenshot! */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                              <ImageUploader
                                label="Photo 1 (Main Cover)"
                                value={variant.imageUrl1}
                                onChange={(url) => handleUpdateVariantField(variant.id, 'imageUrl1', url)}
                                required={vIdx === 0}
                                
                              />

                              <ImageUploader
                                label="Photo 2 (Side / Angle)"
                                value={variant.imageUrl2}
                                onChange={(url) => handleUpdateVariantField(variant.id, 'imageUrl2', url)}
                                
                              />

                              <ImageUploader
                                label="Photo 3 (Detail / Lifestyle)"
                                value={variant.imageUrl3}
                                onChange={(url) => handleUpdateVariantField(variant.id, 'imageUrl3', url)}
                                
                              />

                              <ImageUploader
                                label="Photo 4 (Close-up / Extra)"
                                value={variant.imageUrl4}
                                onChange={(url) => handleUpdateVariantField(variant.id, 'imageUrl4', url)}
                                
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick 1-Click Color Adders & Add Button */}
                    <div className="p-4 bg-gray-900/60 rounded-2xl border border-gray-800 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-emerald-400" /> Add Color Variant:
                          </h5>
                          
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddColorVariant('', '#EC4899')}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Custom Color</span>
                        </button>
                      </div>

                      {/* Quick Color Preset Chips (Selection Only) with Search */}
                      <div className="pt-2 border-t border-gray-800/80 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-bold text-gray-400">
                              Quick Reusable Color Presets ({colorPresets.length} Colors):
                            </span>
                            {colorPresetSearch && (
                              <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                {filteredColorPresets.length} matched
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Color Search Bar */}
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                placeholder="Search color name or hex..."
                                value={colorPresetSearch}
                                onChange={(e) => setColorPresetSearch(e.target.value)}
                                className="w-40 sm:w-48 bg-gray-950 border border-gray-700 rounded-xl pl-7 pr-6 py-1 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-rose-500"
                              />
                              {colorPresetSearch && (
                                <button
                                  type="button"
                                  onClick={() => setColorPresetSearch('')}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                  title="Clear search"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            <Link
                              to="/admin/presets"
                              target="_blank"
                              className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline flex items-center gap-1 shrink-0"
                              title="Open Preset Management in new tab"
                            >
                              <Sliders className="w-3 h-3" /> Manage Presets ↗
                            </Link>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {filteredColorPresets.length === 0 ? (
                            <div className="text-xs text-gray-500 py-1 flex items-center gap-2 flex-wrap">
                              <span>No color presets matching "{colorPresetSearch}"</span>
                              <button
                                type="button"
                                onClick={() => {
                                  handleAddColorVariant(colorPresetSearch, '#EC4899');
                                  setColorPresetSearch('');
                                }}
                                className="text-rose-400 hover:text-rose-300 underline font-bold cursor-pointer"
                              >
                                + Add "{colorPresetSearch}" as new custom color
                              </button>
                            </div>
                          ) : (
                            filteredColorPresets.map((preset) => (
                              <button
                                type="button"
                                key={preset.name}
                                onClick={() => handleAddColorVariant(preset.name, preset.hex)}
                                className="px-2.5 py-1.5 flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 hover:border-rose-500/60 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
                                title={`Add ${preset.name} (${preset.hex}) variant`}
                              >
                                <span className="w-3 h-3 rounded-full border border-black/40 shrink-0 shadow-xs" style={{ backgroundColor: preset.hex }} />
                                <span>+ {preset.name}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

                  {/* Section 3: Sizes & Capacities */}
                  <div className="space-y-4 bg-gray-950/60 p-5 rounded-2xl border border-purple-500/30 shadow-xs">
                    <h4 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" /> Available Sizes & Capacities
                    </h4>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">
                        Selected Sizes ({formData.selectedSizes.length}):
                      </label>

                      {/* Active Selected Sizes with Remove (X) */}
                      {formData.selectedSizes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 bg-gray-900/90 rounded-xl border border-rose-500/30">
                          {formData.selectedSizes.map((size) => (
                            <span
                              key={size}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-sm"
                            >
                              <span>{size}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleSize(size)}
                                className="hover:text-rose-200 transition cursor-pointer"
                                title="Remove size"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Quick Popular Size Chips with Category Filter and Search */}
                      <div className="space-y-2 mb-3 bg-gray-900/50 p-3 rounded-2xl border border-gray-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-bold text-gray-400">
                              Preset Variations ({sizePresets.length} items):
                            </span>
                            {sizePresetSearch && (
                              <span className="text-[10px] text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                {filteredModalSizes.length} matched
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Size Search Bar */}
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                placeholder="Search size / capacity..."
                                value={sizePresetSearch}
                                onChange={(e) => setSizePresetSearch(e.target.value)}
                                className="w-40 sm:w-48 bg-gray-950 border border-gray-700 rounded-xl pl-7 pr-6 py-1 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                              />
                              {sizePresetSearch && (
                                <button
                                  type="button"
                                  onClick={() => setSizePresetSearch('')}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                  title="Clear search"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            <Link
                              to="/admin/presets"
                              target="_blank"
                              className="text-[10px] text-purple-400 hover:text-purple-300 font-bold underline flex items-center gap-1 shrink-0"
                              title="Open Preset Management in new tab"
                            >
                              <Sliders className="w-3 h-3" /> Manage All Presets ↗
                            </Link>
                          </div>
                        </div>

                        {/* Category filter tabs */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { id: 'all', label: `All (${sizePresets.length})` },
                            { id: 'apparel', label: '👕 Apparel' },
                            { id: 'storage', label: '💾 Storage / RAM' },
                            { id: 'volume', label: '🧴 Volume / Liquid' },
                            { id: 'weight', label: '⚖️ Weight' },
                            { id: 'footwear', label: '👟 Footwear' },
                          ].map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setModalSizeCategory(cat.id as any)}
                              className={`text-[11px] px-2.5 py-1 rounded-xl font-bold transition cursor-pointer ${
                                modalSizeCategory === cat.id
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1 max-h-40 overflow-y-auto pr-1">
                          {filteredModalSizes.length === 0 ? (
                            <div className="text-xs text-gray-500 py-1 flex items-center gap-2 flex-wrap">
                              <span>No size preset matching "{sizePresetSearch}"</span>
                              <button
                                type="button"
                                onClick={() => {
                                  handleToggleSize(sizePresetSearch);
                                  setSizePresetSearch('');
                                }}
                                className="text-purple-400 hover:text-purple-300 underline font-bold cursor-pointer"
                              >
                                + Select "{sizePresetSearch}" directly
                              </button>
                            </div>
                          ) : (
                            filteredModalSizes.map((size) => {
                              const isSelected = formData.selectedSizes.includes(size);
                              return (
                                <button
                                  type="button"
                                  key={size}
                                  onClick={() => handleToggleSize(size)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-gray-950 text-gray-400 border border-gray-800 hover:text-white hover:border-gray-600'
                                  }`}
                                  title={isSelected ? `Remove ${size} from product` : `Select ${size}`}
                                >
                                  {isSelected ? `✓ ${size}` : `+ ${size}`}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Custom Size Input with Enter key support */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type custom size (e.g. 2TB, 250ml, 42, XXL, 10kg)..."
                          value={formData.customSizeInput}
                          onChange={(e) => setFormData({ ...formData, customSizeInput: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomSize();
                            }
                          }}
                          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSize}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Size</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Section: Custom Non-Color Attributes (Size, Material, Edition) */}
                  <div className="pt-4 border-t border-gray-800 space-y-3">
                    <label className="block text-xs font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" /> Custom Attribute Options
                    </label>

                    {/* Add Custom Attribute Row */}
                    <div className="p-3 bg-gray-900 rounded-xl border border-gray-700/80 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Type (e.g. Size, Material)"
                            value={formData.newAttrType}
                            onChange={(e) => setFormData({ ...formData, newAttrType: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            placeholder="Option (e.g. Free Size, 100% Cotton)"
                            value={formData.newAttrName}
                            onChange={(e) => setFormData({ ...formData, newAttrName: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">৳</span>
                            <input
                              type="number"
                              placeholder={`Price (Default: ৳${formData.price || '0'})`}
                              value={formData.newAttrPrice}
                              onChange={(e) => setFormData({ ...formData, newAttrPrice: e.target.value })}
                              className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            type="button"
                            onClick={handleAddCustomAttribute}
                            className="w-full py-1.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* List of Added Custom Attributes */}
                    {formData.customAttributes.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {formData.customAttributes.map((attr) => (
                          <div
                            key={attr.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-xl text-xs"
                          >
                            <span className="text-[10px] text-teal-400 font-bold uppercase">{attr.attributeName}:</span>
                            <span className="text-white font-bold">{attr.name}</span>
                            {attr.price ? (
                              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                ৳{attr.price}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomAttribute(attr.id)}
                              className="text-gray-400 hover:text-rose-400 ml-1 cursor-pointer"
                              title="Remove option"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Description & Specs */}
              {activeModalTab === 'specs' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Section 6: Key Highlights & Description */}
              <div className="space-y-4 bg-gray-950/60 p-4 rounded-2xl border border-gray-800/80">
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <ListPlus className="w-4 h-4" /> Key Bullet Highlights & Description
                </h4>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Highlight 1: e.g. 100% Genuine Certified Quality"
                    value={formData.highlight1}
                    onChange={(e) => setFormData({ ...formData, highlight1: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Highlight 2: e.g. High Performance Battery Life"
                    value={formData.highlight2}
                    onChange={(e) => setFormData({ ...formData, highlight2: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Highlight 3: e.g. 7-Day Free Replacement Policy"
                    value={formData.highlight3}
                    onChange={(e) => setFormData({ ...formData, highlight3: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Detailed Description</label>
                  <textarea
                    rows={4}
                    placeholder="Provide full storytelling, craftsmanship, ingredients/specs, and usage instructions..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                  />
                </div>
              </div>
                  {/* Section 5: Dynamic Category-Aware Specifications */}
              <div className="space-y-4 bg-gray-950/60 p-4 rounded-2xl border border-gray-800/80">
                {/* Section Top Header & Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    {currentSpecMode === 'gadgets' && <Cpu className="w-4 h-4 text-cyan-400" />}
                    {currentSpecMode === 'fashion' && <Shirt className="w-4 h-4 text-pink-400" />}
                    {currentSpecMode === 'groceries' && <Sparkles className="w-4 h-4 text-emerald-400" />}
                    {currentSpecMode === 'none' && <Ban className="w-4 h-4 text-gray-400" />}
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      {currentSpecMode === 'gadgets' && '⚡ Device, Hardware & Tech Specs'}
                      {currentSpecMode === 'fashion' && '👕 Fabric, Materials & Technical Specs'}
                      {currentSpecMode === 'groceries' && '🌿 Food, Nutrition & Storage Specs'}
                      {currentSpecMode === 'none' && '🚫 Specifications Disabled'}
                    </h4>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="flex flex-wrap items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
                    <button
                      type="button"
                      onClick={() => setSpecMode('gadgets')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                        currentSpecMode === 'gadgets'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Zap className="w-3 h-3" /> Gadget & Tech
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecMode('fashion')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                        currentSpecMode === 'fashion'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-xs'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Shirt className="w-3 h-3" /> Fashion
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecMode('groceries')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                        currentSpecMode === 'groceries'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" /> Groceries
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecMode('none')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                        currentSpecMode === 'none'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                      title="Skip specifications"
                    >
                      <Ban className="w-3 h-3" /> Skip
                    </button>
                  </div>
                </div>

                {/* 1. GADGETS & ELECTRONICS SPECIFICATIONS */}
                {currentSpecMode === 'gadgets' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Official Warranty */}
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          Official Warranty
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1 Year Official Brand Warranty / 7 Days Replacement"
                          value={formData.warranty}
                          onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {['1 Year Brand Warranty', '6 Months Warranty', '7 Days Replacement', 'No Warranty'].map((w) => (
                            <button
                              type="button"
                              key={w}
                              onClick={() => setFormData({ ...formData, warranty: w })}
                              className="text-[9px] bg-gray-900 hover:bg-gray-800 text-cyan-400 px-1.5 py-0.5 rounded border border-gray-700 hover:border-cyan-500"
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Origin / Variant */}
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          Edition / Origin
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Official BD / Global Version / Made in China"
                          value={formData.origin}
                          onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {['Official BD', 'Global Version', 'Imported', 'Made in China', 'Made in Bangladesh'].map((o) => (
                            <button
                              type="button"
                              key={o}
                              onClick={() => setFormData({ ...formData, origin: o })}
                              className="text-[9px] bg-gray-900 hover:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700 hover:text-white"
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Build / Body Material */}
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          Build & Protection
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Transparent Acrylic, Aluminum Frame, IP68"
                          value={formData.fabric}
                          onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {['Transparent Body', 'Ergonomic Shell', 'Aluminum Frame', 'IP68 Water Resistant', 'Gorilla Glass'].map((b) => (
                            <button
                              type="button"
                              key={b}
                              onClick={() => setFormData({ ...formData, fabric: b })}
                              className="text-[9px] bg-gray-900 hover:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700 hover:text-white"
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Hardware Key-Value Specs */}
                    <div className="pt-3 border-t border-gray-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                        <label className="block text-xs font-bold text-gray-300">
                          Hardware Key Specs (কানেক্টিভিটি, ব্যাটারি, সেন্সর, ডিপিআই ইত্যাদি):
                        </label>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] text-gray-500 font-bold mr-1">Quick Add:</span>
                          {[
                            { key: 'Connectivity', defaultVal: 'Bluetooth 5.3 & 2.4G Wireless' },
                            { key: 'Battery', defaultVal: 'Rechargeable Type-C' },
                            { key: 'DPI / Sensitivity', defaultVal: '800 / 1200 / 1600 DPI' },
                            { key: 'Sensor', defaultVal: 'Optical Gaming Sensor' },
                            { key: 'Lighting', defaultVal: 'RGB Breathing Light' },
                            { key: 'RAM / Memory', defaultVal: '8 GB' },
                            { key: 'Storage', defaultVal: '256 GB' },
                            { key: 'Display', defaultVal: '6.7" AMOLED 120Hz' },
                          ].map((item) => (
                            <button
                              type="button"
                              key={item.key}
                              onClick={() => {
                                if (!formData.specKey1 || formData.specKey1 === item.key) {
                                  setFormData({ ...formData, specKey1: item.key, specVal1: formData.specVal1 || item.defaultVal });
                                } else if (!formData.specKey2 || formData.specKey2 === item.key) {
                                  setFormData({ ...formData, specKey2: item.key, specVal2: formData.specVal2 || item.defaultVal });
                                } else {
                                  setFormData({ ...formData, specKey3: item.key, specVal3: formData.specVal3 || item.defaultVal });
                                }
                              }}
                              className="text-[9px] bg-gray-900 hover:bg-cyan-950 text-cyan-400 hover:text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/50 transition"
                            >
                              + {item.key}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Spec 1 (e.g. Connectivity)"
                            value={formData.specKey1}
                            onChange={(e) => setFormData({ ...formData, specKey1: e.target.value })}
                            className="w-1/2 bg-gray-900 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g. BT 5.3 + 2.4G)"
                            value={formData.specVal1}
                            onChange={(e) => setFormData({ ...formData, specVal1: e.target.value })}
                            className="w-1/2 bg-gray-900 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Spec 2 (e.g. Battery)"
                            value={formData.specKey2}
                            onChange={(e) => setFormData({ ...formData, specKey2: e.target.value })}
                            className="w-1/2 bg-gray-900 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g. Type-C Charge)"
                            value={formData.specVal2}
                            onChange={(e) => setFormData({ ...formData, specVal2: e.target.value })}
                            className="w-1/2 bg-gray-900 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Spec 3 (e.g. DPI / Sensor)"
                            value={formData.specKey3}
                            onChange={(e) => setFormData({ ...formData, specKey3: e.target.value })}
                            className="w-1/2 bg-gray-900 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g. 1600 DPI Optical)"
                            value={formData.specVal3}
                            onChange={(e) => setFormData({ ...formData, specVal3: e.target.value })}
                            className="w-1/2 bg-gray-900 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. FASHION & APPAREL SPECIFICATIONS */}
                {currentSpecMode === 'fashion' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Fabric / Material */}
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">Fabric / Material</label>
                        <input
                          type="text"
                          placeholder="e.g. 100% Combed Cotton / Silk / Leather"
                          value={formData.fabric}
                          onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                        />
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {['100% Cotton', 'Linen', 'Denim', 'Silk', 'Leather', 'Georgette', 'Polyester'].map((f) => (
                            <button
                              type="button"
                              key={f}
                              onClick={() => setFormData({ ...formData, fabric: f })}
                              className="text-[9px] bg-gray-900 hover:bg-gray-800 text-pink-400 px-1.5 py-0.5 rounded border border-gray-700 hover:border-pink-500"
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fit Type */}
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">Fit / Cut Type</label>
                        <input
                          type="text"
                          placeholder="e.g. Regular Fit, Slim Fit, Oversized"
                          value={formData.fit_type}
                          onChange={(e) => setFormData({ ...formData, fit_type: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                        />
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {['Regular Fit', 'Slim Fit', 'Oversized', 'Relaxed Fit', 'Comfort Fit'].map((fit) => (
                            <button
                              type="button"
                              key={fit}
                              onClick={() => setFormData({ ...formData, fit_type: fit })}
                              className="text-[9px] bg-gray-900 hover:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700 hover:text-white"
                            >
                              {fit}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Gender / Department */}
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">Target Gender / Dept</label>
                        <select
                          value={formData.gender || ''}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                        >
                          <option value="">Not Specified (কোনো জেন্ডার শো করবে না)</option>
                          <option value="Unisex">Unisex (সবার জন্য)</option>
                          <option value="Men">Men (পুরুষ)</option>
                          <option value="Women">Women (মহিলা)</option>
                          <option value="Kids / Boys">Kids / Boys (ছেলে শিশু)</option>
                          <option value="Kids / Girls">Kids / Girls (মেয়ে শিশু)</option>
                          <option value="Baby">Baby (নবজাতক)</option>
                        </select>
                      </div>

                      {/* Wash & Care Instructions */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          Wash & Care Instructions (ধোয়া ও রক্ষণাবেক্ষণ)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Machine wash cold with like colors, do not bleach, warm iron"
                          value={formData.care_instructions}
                          onChange={(e) => setFormData({ ...formData, care_instructions: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      {/* Country of Origin / Made In */}
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">Made In / Origin</label>
                        <input
                          type="text"
                          placeholder="e.g. Made in Bangladesh / Imported"
                          value={formData.origin}
                          onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>

                    {/* Additional Fashion Specs */}
                    <div className="pt-3 border-t border-gray-800">
                      <label className="block text-xs font-bold text-gray-300 mb-2">
                        Custom Specs (GSM / Sleeve / Collar / Pattern):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Spec 1 (e.g. GSM)"
                            value={formData.specKey1}
                            onChange={(e) => setFormData({ ...formData, specKey1: e.target.value })}
                            className="w-1/2 bg-gray-900 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-pink-300 font-bold focus:border-pink-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g. 200 GSM)"
                            value={formData.specVal1}
                            onChange={(e) => setFormData({ ...formData, specVal1: e.target.value })}
                            className="w-1/2 bg-gray-900 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-pink-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Spec 2 (e.g. Sleeve)"
                            value={formData.specKey2}
                            onChange={(e) => setFormData({ ...formData, specKey2: e.target.value })}
                            className="w-1/2 bg-gray-900 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-pink-300 font-bold focus:border-pink-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g. Half Sleeve)"
                            value={formData.specVal2}
                            onChange={(e) => setFormData({ ...formData, specVal2: e.target.value })}
                            className="w-1/2 bg-gray-900 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-pink-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Spec 3 (e.g. Collar)"
                            value={formData.specKey3}
                            onChange={(e) => setFormData({ ...formData, specKey3: e.target.value })}
                            className="w-1/2 bg-gray-900 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-pink-300 font-bold focus:border-pink-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g. Polo / Mandarin)"
                            value={formData.specVal3}
                            onChange={(e) => setFormData({ ...formData, specVal3: e.target.value })}
                            className="w-1/2 bg-gray-900 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-pink-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. GROCERIES & FOOD SPECIFICATIONS */}
                {currentSpecMode === 'groceries' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Net Weight / Volume */}
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          Net Weight / Volume
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1 Kg / 500 ml / 5 Liter"
                          value={formData.fabric}
                          onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {['250 g', '500 g', '1 Kg', '2 Kg', '5 Kg', '500 ml', '1 Liter', '5 Liter'].map((w) => (
                            <button
                              type="button"
                              key={w}
                              onClick={() => setFormData({ ...formData, fabric: w })}
                              className="text-[9px] bg-gray-900 hover:bg-gray-800 text-emerald-400 px-1.5 py-0.5 rounded border border-gray-700 hover:border-emerald-500"
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Shelf Life / Expiry */}
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          Shelf Life (মেয়াদকাল)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 12 Months from MFG / Best before 6 months"
                          value={formData.warranty}
                          onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Origin / Source */}
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          Origin / Source (উৎপাদনস্থল)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Organic Farm, Dinajpur / 100% Pure"
                          value={formData.origin}
                          onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Storage Instructions */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          Storage Instructions (সংরক্ষণ পদ্ধতি)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Store in a cool, dry place away from direct sunlight"
                          value={formData.care_instructions}
                          onChange={(e) => setFormData({ ...formData, care_instructions: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Food Grade / Quality */}
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          Certification / Quality
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. BSTI Certified / 100% Organic"
                          value={formData.fit_type}
                          onChange={(e) => setFormData({ ...formData, fit_type: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. DISABLED / SKIPPED SPECIFICATIONS */}
                {currentSpecMode === 'none' && (
                  <div className="p-4 rounded-xl bg-gray-900/60 border border-dashed border-gray-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs text-gray-400">
                        🚫 হার্ডওয়্যার বা কাপড়ের সাইজ স্পেসিফিকেশন স্কিপ করা হয়েছে।
                      </p>
                      <span className="text-[10px] text-gray-500">ঐচ্ছিক সেটিং</span>
                    </div>

                    {/* Optional Target Gender / Dept (e.g. for Jewelry, Necklace, Cosmetics) */}
                    <div className="max-w-xs pt-1">
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        Target Gender / Department (ঐচ্ছিক জেন্ডার অপশন)
                      </label>
                      <select
                        value={formData.gender || ''}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="">Not Specified (কোনো জেন্ডার শো করবে না)</option>
                        <option value="Women">Women / Female (মহিলাদের জন্য)</option>
                        <option value="Men">Men / Male (পুরুষদের জন্য)</option>
                        <option value="Unisex">Unisex (সবার জন্য)</option>
                        <option value="Kids / Girls">Kids / Girls (মেয়ে শিশু)</option>
                        <option value="Kids / Boys">Kids / Boys (ছেলে শিশু)</option>
                        <option value="Baby">Baby (নবজাতক)</option>
                      </select>
                      <p className="text-[10px] text-gray-500 mt-1">
                        মহিলাদের জুয়েলারি বা নেকলেস হলে এখানে "Women" সিলেক্ট করে দিতে পারেন।
                      </p>
                    </div>
                  </div>
                )}
              </div>
                </div>
              )}

              {/* Tab 4: Delivery & Payment */}
              {activeModalTab === 'delivery' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Section 6: Special Delivery Note & Instructions (ডেলিভারি নোট ও বিশেষ সতর্কতা) */}
              <div className="space-y-3 bg-gray-950/60 p-4 rounded-2xl border border-gray-800/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Delivery Note & Customer Instruction
                  </h4>
                  {formData.delivery_note && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, delivery_note: '' })}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                    >
                      ✕ Clear Note
                    </button>
                  )}
                </div>
                
                <textarea
                  rows={3}
                  placeholder="e.g. অনুগ্রহ করে ডেলিভারি পাওয়ার পর ডেলিভারি ম্যান এর সামনে প্রোডাক্ট খুলে চেক করে টাকা দিবেন। ডেলিভারি ম্যান চলে যাওয়ার পরে আর কোনো অভিযোগ গ্রহণযোগ্য হবে না।"
                  value={formData.delivery_note}
                  onChange={(e) => setFormData({ ...formData, delivery_note: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />

                {/* Quick Delivery Note Presets */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Quick One-Click Presets:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        label: '📌 ডেলিভারি ম্যানের সামনে চেক করে টাকা দিন',
                        text: 'অনুগ্রহ করে ডেলিভারি পাওয়ার পর ডেলিভারি ম্যান এর সামনে প্রোডাক্ট খুলে চেক করে টাকা দিবেন। ডেলিভারি ম্যান চলে যাওয়ার পরে আর কোনো অভিযোগ গ্রহণযোগ্য হবে না।',
                      },
                      {
                        label: '📹 আনবক্সিং ভিডিও ও ৭ দিনের এক্সচেঞ্জ পলিসি',
                        text: 'প্রোডাক্টে কোনো ত্রুটি থাকলে ডেলিভারির ৭ দিনের মধ্যে রিসিট ও আনবক্সিং ভিডিও সহ এক্সচেঞ্জ ক্লেইম করুন।',
                      },
                      {
                        label: '🏷️ ট্যাগ ও সিল অক্ষত রাখুন',
                        text: 'রিটার্ন বা এক্সচেঞ্জের ক্ষেত্রে প্রোডাক্টের মূল সিল, ট্যাগ ও বক্স অক্ষত রাখা আবশ্যক।',
                      },
                    ].map((preset) => (
                      <button
                        type="button"
                        key={preset.label}
                        onClick={() => setFormData({ ...formData, delivery_note: preset.text })}
                        className={`text-[10px] px-2.5 py-1 rounded-xl border transition text-left ${
                          formData.delivery_note === preset.text
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                            : 'bg-gray-900 hover:bg-gray-800 text-gray-400 border-gray-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
                  {/* Section 7: Allowed Payment Gateways & Custom Methods (পেমেন্ট গেটওয়ে ও মেথড) */}
              <div className="space-y-4 bg-gray-950/60 p-4 rounded-2xl border border-gray-800/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" /> Allowed Payment Methods (পণ্যটির জন্য প্রযোজ্য পেমেন্ট মেথড)
                  </h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allowed_payment_methods: ['cod', 'bkash', 'nagad', 'rocket', 'bank'] })}
                      className="text-[10px] text-emerald-400 hover:underline font-bold"
                    >
                      Select All
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allowed_payment_methods: ['bkash', 'nagad', 'rocket', 'bank'] })}
                      className="text-[10px] text-amber-400 hover:underline font-bold"
                    >
                      Prepaid Only
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { id: 'cod', label: '💵 Cash on Delivery', desc: 'ক্যাশ অন ডেলিভারি' },
                    { id: 'bkash', label: '📱 bKash Account', desc: 'বিকাশ পেমেন্ট' },
                    { id: 'nagad', label: '📱 Nagad Account', desc: 'নগদ পেমেন্ট' },
                    { id: 'rocket', label: '🟣 Rocket Account', desc: 'রকেট পেমেন্ট' },
                    { id: 'bank', label: '🏛️ Bank Transfer', desc: 'ব্যাংক ডিপোজিট' },
                  ].map((m) => {
                    const isChecked = formData.allowed_payment_methods.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className={`p-3 rounded-xl cursor-pointer transition flex flex-col justify-between bg-white ${
                          isChecked
                            ? 'border-2 border-rose-600 shadow-xs text-gray-900'
                            : 'border border-gray-200 text-gray-500 hover:border-gray-300 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${isChecked ? 'font-black text-gray-900' : 'font-bold text-gray-600'}`}>{m.label}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  allowed_payment_methods: [...formData.allowed_payment_methods, m.id],
                                });
                              } else {
                                if (formData.allowed_payment_methods.length === 1) {
                                  toast.error('At least one payment method must be allowed.');
                                  return;
                                }
                                setFormData({
                                  ...formData,
                                  allowed_payment_methods: formData.allowed_payment_methods.filter((id) => id !== m.id),
                                });
                              }
                            }}
                            className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                          />
                        </div>
                        <span className={`text-[10px] mt-1 font-medium ${isChecked ? 'text-rose-600 font-semibold' : 'text-gray-400'}`}>{m.desc}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Custom Payment Instruction (Optional) */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Custom Payment / Advance Policy Note (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ক্যাশ অন ডেলিভারিতে ঢাকার বাইরে ২০০ টাকা অগ্রিম ডেলিভারি চার্জ প্রযোজ্য"
                    value={formData.payment_instruction}
                    onChange={(e) => setFormData({ ...formData, payment_instruction: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
                </div>
              )}

              {/* Tab 5: Search Tags & Taxonomy */}
              {activeModalTab === 'tags' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Section 8: Search Keywords, Tags & 20,000 Category Explorer */}
              <CategoryTagExplorer
                selectedTags={
                  Array.isArray(formData.tags)
                    ? (formData.tags as any[]).map((t) => String(t || '').trim()).filter(Boolean)
                    : typeof formData.tags === 'string' && formData.tags
                    ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
                    : []
                }
                onChangeTags={(newTags) => setFormData({ ...formData, tags: newTags.join(', ') })}
                currentCategoryId={formData.category_id}
                productTitle={formData.title}
                productDescription={formData.description}
                onSelectCategory={(catId) => {
                  setFormData({ ...formData, category_id: catId });
                  toast.success(`Product category updated to: ${catId}`);
                }}
              />
                </div>
              )}

              {/* Submit / Action Buttons with Tab Navigation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-800 mt-6">
                <div>
                  {editingProduct && isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        handleDelete(editingProduct);
                      }}
                      className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Product</span>
                    </button>
                  )}
                </div>

                {/* Tab Next / Prev Stepper */}
                <div className="flex items-center gap-2">
                  {activeModalTab !== 'general' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabOrder = ['general', 'variants', 'specs', 'delivery', 'tags'];
                        const idx = tabOrder.indexOf(activeModalTab);
                        if (idx > 0) setActiveModalTab(tabOrder[idx - 1] as any);
                      }}
                      className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700 font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>← Previous</span>
                    </button>
                  )}

                  {activeModalTab !== 'tags' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabOrder = ['general', 'variants', 'specs', 'delivery', 'tags'];
                        const idx = tabOrder.indexOf(activeModalTab);
                        if (idx < tabOrder.length - 1) setActiveModalTab(tabOrder[idx + 1] as any);
                      }}
                      className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Next Tab →</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingProduct}
                    onClick={() => handleSubmit()}
                    className="px-8 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition shadow-lg shadow-rose-600/30 flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProduct ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{isSavingProduct ? 'Saving...' : (editingProduct ? 'Save Changes' : 'Create Product')}</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../../data/mockData';
import { Product, Category } from '../../types';
import { formatPrice, calculateDiscount } from '../../lib/utils';
import {
  Plus,
  Edit2,
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
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploader } from '../../components/common/ImageUploader';
import { CategoryTagExplorer } from '../../components/admin/CategoryTagExplorer';

const POPULAR_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '64GB', '128GB', '256GB', '512GB', '1TB', '500g', '1kg', '5L'];

export const AdminProducts: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [specMode, setSpecMode] = useState<'auto' | 'gadgets' | 'fashion' | 'groceries' | 'none'>('auto');

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
    stock: '',
    sku: '',
    brand: '',
    warranty: '',
    delivery_note: '',
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
    // Multiple Images
    imageUrl1: '',
    imageUrl2: '',
    imageUrl3: '',
    imageUrl4: '',
    // Sizes
    selectedSizes: [] as string[],
    customSizeInput: '',
    // Colors
    colors: [] as { name: string; hex: string }[],
    newColorName: '',
    newColorHex: '#000000',
    // Bullet Highlights
    highlight1: '',
    highlight2: '',
    highlight3: '',
    // Fabric, Fashion & Technical Specs
    fabric: '',
    fit_type: '',
    care_instructions: '',
    origin: '',
    gender: 'Unisex',
    specKey1: '',
    specVal1: '',
    specKey2: '',
    specVal2: '',
    specKey3: '',
    specVal3: '',
    tags: '',
  });
  const currentSpecMode = specMode === 'auto' ? getCategorySpecMode(formData.category_id) : specMode;

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      const cloudProducts: Product[] = (data || []).filter((p) => p && p.id && !p.id.startsWith('prod-'));

      const savedCustom: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
      const cloudIdSet = new Set(cloudProducts.map((p) => p.id));
      const cloudSlugSet = new Set(cloudProducts.map((p) => p.slug));

      const offlineOnlyProducts = savedCustom.filter(
        (p) => p && p.id && !p.id.startsWith('prod-') && !cloudIdSet.has(p.id) && !cloudSlugSet.has(p.slug)
      );

      // Cloud database products are primary source of truth
      const merged = [...cloudProducts, ...offlineOnlyProducts];
      setProducts(merged);
      localStorage.setItem('kintesi_custom_products', JSON.stringify(merged));

      const { data: cats } = await supabase.from('categories').select('*');
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
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      price: '',
      discount_percent: '',
      category_id: categories[0]?.slug || 'mens-fashion',
      stock: '',
      sku: '',
      brand: '',
      warranty: '',
      delivery_note: '',
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
      imageUrl1: '',
      imageUrl2: '',
      imageUrl3: '',
      imageUrl4: '',
      selectedSizes: [],
      customSizeInput: '',
      colors: [],
      newColorName: '',
      newColorHex: '#000000',
      highlight1: '',
      highlight2: '',
      highlight3: '',
      fabric: '',
      fit_type: '',
      care_instructions: '',
      origin: '',
      gender: 'Unisex',
      specKey1: '',
      specVal1: '',
      specKey2: '',
      specVal2: '',
      specKey3: '',
      specVal3: '',
      tags: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    const existingPercent = calculateDiscount(prod.price, prod.discount_price);
    const specEntries = Object.entries(prod.specifications || {});

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

    setFormData({
      title: prod.title || '',
      slug: prod.slug || '',
      description: prod.description || '',
      price: prod.price ? prod.price.toString() : '',
      discount_percent: existingPercent > 0 ? existingPercent.toString() : '',
      category_id: prod.category_id || categories[0]?.slug || 'mens-fashion',
      stock: prod.stock ? prod.stock.toString() : '0',
      sku: prod.sku || 'KT-' + prod.id.slice(0, 6).toUpperCase(),
      brand: prod.brand || 'Kintesi',
      warranty: prod.warranty || '',
      delivery_note: prod.delivery_note || '',
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
      imageUrl1: prod.images?.[0] || '',
      imageUrl2: prod.images?.[1] || '',
      imageUrl3: prod.images?.[2] || '',
      imageUrl4: prod.images?.[3] || '',
      selectedSizes: prod.sizes || [],
      customSizeInput: '',
      colors: prod.colors || [],
      newColorName: '',
      newColorHex: '#059669',
      highlight1: prod.highlights?.[0] || '',
      highlight2: prod.highlights?.[1] || '',
      highlight3: prod.highlights?.[2] || '',
      fabric: prod.fabric || '',
      fit_type: prod.fit_type || '',
      care_instructions: prod.care_instructions || '',
      origin: prod.origin || '',
      gender: prod.gender || '',
      specKey1: specEntries[0]?.[0] || '',
      specVal1: specEntries[0]?.[1] || '',
      specKey2: specEntries[1]?.[0] || '',
      specVal2: specEntries[1]?.[1] || '',
      specKey3: specEntries[2]?.[0] || '',
      specVal3: specEntries[2]?.[1] || '',
      tags: (prod.tags || []).join(', '),
    });
    setIsModalOpen(true);
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

  const handleAddColor = () => {
    if (!formData.newColorName.trim()) {
      toast.error('Please enter a color name (e.g. Navy Blue)');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: prev.newColorName.trim(), hex: prev.newColorHex }],
      newColorName: '',
      newColorHex: '#059669',
    }));
  };

  const handleRemoveColor = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      toast.error('Product Title and Price are required');
      return;
    }

    const priceNum = Number(formData.price);
    const percentNum = Number(formData.discount_percent);
    let calculatedDiscountPrice: number | null = null;

    if (percentNum > 0 && percentNum < 100) {
      calculatedDiscountPrice = Math.round(priceNum - (priceNum * percentNum) / 100);
    }

    const slug = formData.slug.trim() || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Collect all valid image URLs
    const imageList = [formData.imageUrl1, formData.imageUrl2, formData.imageUrl3, formData.imageUrl4]
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    const highlightsList = [formData.highlight1, formData.highlight2, formData.highlight3]
      .map((h) => h.trim())
      .filter((h) => h.length > 0);

    const specsObj: Record<string, string> = {};
    if (formData.specKey1.trim() && formData.specVal1.trim()) {
      specsObj[formData.specKey1.trim()] = formData.specVal1.trim();
    }
    if (formData.specKey2.trim() && formData.specVal2.trim()) {
      specsObj[formData.specKey2.trim()] = formData.specVal2.trim();
    }
    if (formData.specKey3.trim() && formData.specVal3.trim()) {
      specsObj[formData.specKey3.trim()] = formData.specVal3.trim();
    }

    const userTags = formData.tags
      ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    const autoKeywords = [
      ...userTags,
      formData.title.toLowerCase(),
      currentSpecMode === 'fashion' ? formData.fabric.toLowerCase() : '',
      currentSpecMode === 'fashion' ? formData.gender.toLowerCase() : '',
    ];
    const uniqueTags = Array.from(new Set(autoKeywords.filter(Boolean)));

    // Strict niche specification isolation: When a mode is active, completely clear/disable all other niche fields
    let cleanedFabric = '';
    let cleanedFitType = '';
    let cleanedCare = '';
    let cleanedGender = '';
    let cleanedWarranty = formData.warranty.trim();
    let cleanedSpecs: Record<string, string> = {};

    if (currentSpecMode === 'gadgets') {
      cleanedSpecs = specsObj;
      cleanedFabric = '';
      cleanedFitType = '';
      cleanedCare = '';
      cleanedGender = '';
      // Warranty and origin stay as gadget warranty & origin
    } else if (currentSpecMode === 'fashion') {
      cleanedSpecs = {};
      cleanedFabric = formData.fabric.trim();
      cleanedFitType = formData.fit_type.trim();
      cleanedCare = formData.care_instructions.trim();
      cleanedGender = formData.gender.trim();
      cleanedWarranty = ''; // No gadget warranty for fashion
    } else if (currentSpecMode === 'groceries') {
      cleanedSpecs = {};
      cleanedFabric = formData.fabric.trim(); // Net Weight/Volume
      cleanedFitType = formData.fit_type.trim(); // Certification
      cleanedCare = formData.care_instructions.trim(); // Storage
      cleanedWarranty = formData.warranty.trim(); // Shelf Life
      cleanedGender = '';
    } else {
      // 'none'
      cleanedSpecs = {};
      cleanedFabric = '';
      cleanedFitType = '';
      cleanedCare = '';
      cleanedGender = '';
      cleanedWarranty = '';
    }

    const productPayload: any = {
      title: formData.title.trim(),
      slug: slug,
      description: formData.description.trim(),
      price: priceNum,
      discount_price: calculatedDiscountPrice,
      category_id: formData.category_id,
      stock: Number(formData.stock),
      images: imageList.length > 0 ? imageList : ['/logo.webp'],
      brand: formData.brand.trim() || 'Kintesi',
      sku: formData.sku.trim(),
      warranty: cleanedWarranty,
      delivery_note: formData.delivery_note.trim(),
      allowed_payment_methods: formData.allowed_payment_methods.length > 0
        ? formData.allowed_payment_methods
        : ['cod', 'bkash', 'nagad', 'rocket', 'bank'],
      payment_instruction: formData.payment_instruction.trim(),
      highlights: highlightsList,
      fabric: cleanedFabric,
      fit_type: cleanedFitType,
      care_instructions: cleanedCare,
      origin: currentSpecMode === 'none' ? '' : formData.origin.trim(),
      gender: cleanedGender,
      specifications: cleanedSpecs,
      tags: uniqueTags,
      sizes: currentSpecMode === 'none' ? [] : formData.selectedSizes,
      colors: formData.colors,
      is_featured: formData.is_featured,
      is_trending: formData.is_trending,
      rating: editingProduct?.rating || 5.0,
      review_count: editingProduct?.review_count || 0,
    };

    const isUUID = (str?: string) =>
      str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) : false;

    let savedCloudProduct: any = null;

    try {
      if (editingProduct && isUUID(editingProduct.id)) {
        const { data, error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProduct.id)
          .select()
          .single();

        if (error) {
          console.warn('Supabase update retry with core fields:', error.message);
          // Fallback retaining all valid schema columns including delivery_note
          const corePayload = {
            title: productPayload.title,
            slug: productPayload.slug,
            description: productPayload.description,
            price: productPayload.price,
            discount_price: productPayload.discount_price,
            category_id: productPayload.category_id,
            stock: productPayload.stock,
            images: productPayload.images,
            brand: productPayload.brand,
            sku: productPayload.sku,
            warranty: productPayload.warranty,
            delivery_note: productPayload.delivery_note,
            highlights: productPayload.highlights,
            fabric: productPayload.fabric,
            fit_type: productPayload.fit_type,
            care_instructions: productPayload.care_instructions,
            origin: productPayload.origin,
            gender: productPayload.gender,
            specifications: productPayload.specifications,
            tags: productPayload.tags,
            sizes: productPayload.sizes,
            colors: productPayload.colors,
            allowed_payment_methods: productPayload.allowed_payment_methods,
            payment_instruction: productPayload.payment_instruction,
            is_featured: productPayload.is_featured,
            is_trending: productPayload.is_trending,
          };
          const { data: retryData } = await supabase
            .from('products')
            .update(corePayload)
            .eq('id', editingProduct.id)
            .select()
            .single();
          if (retryData) savedCloudProduct = retryData;
        } else {
          savedCloudProduct = data;
        }
      } else {
        // Upsert by slug for new or mock products
        const { data, error } = await supabase
          .from('products')
          .upsert({ slug: slug, ...productPayload }, { onConflict: 'slug' })
          .select()
          .single();

        if (error) {
          console.warn('Supabase upsert retry with core fields:', error.message);
          const corePayload = {
            title: productPayload.title,
            slug: productPayload.slug,
            description: productPayload.description,
            price: productPayload.price,
            discount_price: productPayload.discount_price,
            category_id: productPayload.category_id,
            stock: productPayload.stock,
            images: productPayload.images,
            brand: productPayload.brand,
            sku: productPayload.sku,
            warranty: productPayload.warranty,
            delivery_note: productPayload.delivery_note,
            highlights: productPayload.highlights,
            fabric: productPayload.fabric,
            fit_type: productPayload.fit_type,
            care_instructions: productPayload.care_instructions,
            origin: productPayload.origin,
            gender: productPayload.gender,
            specifications: productPayload.specifications,
            tags: productPayload.tags,
            sizes: productPayload.sizes,
            colors: productPayload.colors,
            allowed_payment_methods: productPayload.allowed_payment_methods,
            payment_instruction: productPayload.payment_instruction,
            is_featured: productPayload.is_featured,
            is_trending: productPayload.is_trending,
          };
          const { data: retryData } = await supabase
            .from('products')
            .upsert({ slug: slug, ...corePayload }, { onConflict: 'slug' })
            .select()
            .single();
          if (retryData) savedCloudProduct = retryData;
        } else {
          savedCloudProduct = data;
        }
      }

      toast.success('Product saved to Cloud Database & Store successfully!');
    } catch (err: any) {
      console.warn('Supabase product sync note:', err?.message || err);
    }

    // Always update local & persistent storage with Cloud ID if available
    const savedCustom: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
    const targetId = savedCloudProduct?.id || editingProduct?.id || ('local-' + Date.now());
    const completeProduct: Product = {
      id: targetId,
      ...productPayload,
    } as Product;

    const existingIdx = savedCustom.findIndex(
      (p) => (editingProduct && p.id === editingProduct.id) || p.slug === slug
    );

    let updatedCustom: Product[];
    if (existingIdx >= 0) {
      updatedCustom = [...savedCustom];
      updatedCustom[existingIdx] = completeProduct;
    } else {
      updatedCustom = [completeProduct, ...savedCustom];
    }

    localStorage.setItem('kintesi_custom_products', JSON.stringify(updatedCustom));
    window.dispatchEvent(new Event('kintesi_products_updated'));

    setProducts((prev) => {
      const idx = prev.findIndex((p) => (editingProduct && p.id === editingProduct.id) || p.slug === slug);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = completeProduct;
        return next;
      }
      return [completeProduct, ...prev];
    });

    setIsModalOpen(false);
    loadProducts();
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

    // 2. Remove permanently from local storage cache
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

  return (
    <div className="space-y-6">
      
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
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition flex items-center gap-2 text-xs shadow-lg shadow-emerald-600/20 active:scale-95"
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
                      <div className="w-12 h-12 rounded-2xl bg-gray-800 border border-gray-700 text-emerald-400 flex items-center justify-center mx-auto">
                        <Package className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-white">No Products in Store Catalog</p>
                      <p className="text-xs text-gray-400">
                        {searchQuery ? 'No products match your search query.' : 'All mock products have been cleared. Click below to add your first real product.'}
                      </p>
                      <button
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition"
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
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                              SKU: {prod.sku || 'N/A'} • {prod.images?.length || 1} Images
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-bold rounded-lg text-[10px] uppercase block w-max">
                          {prod.category_id.replace('-', ' ')}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1 block">{prod.brand || 'Kintesi'}</span>
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
                            <div className="flex items-center gap-1">
                              {prod.colors.map((c, i) => (
                                <span
                                  key={i}
                                  className="w-3 h-3 rounded-full border border-white/20"
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
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999] w-screen h-screen m-0 p-0 bg-gray-950 flex flex-col overflow-hidden">
          
          {/* Studio Top Fixed Header */}
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur-md flex items-center justify-between shrink-0 shadow-md">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2.5">
                <Package className="w-6 h-6 text-emerald-400" />
                <span>{editingProduct ? 'Edit Product Details' : 'Add New Product'}</span>
                {formData.title && (
                  <span className="text-sm font-bold text-gray-400 truncate max-w-md hidden sm:inline">
                    — {formData.title}
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Manage comprehensive product information, images, pricing, specifications & variants
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  const formEl = document.getElementById('admin-product-studio-form') as HTMLFormElement;
                  if (formEl) formEl.requestSubmit();
                }}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-full transition ml-2"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Studio Scrollable Full-Page Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-950">
            <form id="admin-product-studio-form" onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6 pb-12">
              
              {/* Section 1: Basic Identifiers */}
              <div className="space-y-4 bg-gray-950/60 p-4 rounded-2xl border border-gray-800/80">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Tag className="w-4 h-4" /> Basic Identifiers & Brand
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-300 mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sony WH-1000XM5 Wireless Noise Cancelling Headphones"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">Brand Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Apple, Nike, CeraVe, Sony"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">Category *</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.slug || cat.id} value={cat.slug}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">SKU / Model Code</label>
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
                      <label className="block text-xs font-bold text-gray-300">
                        Warranty Policy / Period (Optional)
                      </label>
                      {formData.warranty && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, warranty: '' })}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
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
                          className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                            formData.warranty === item.val
                              ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-xs'
                              : 'bg-gray-900 hover:bg-gray-800 text-gray-400 border-gray-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing, Discount % & Stock */}
              <div className="space-y-4 bg-gray-950/60 p-4 rounded-2xl border border-gray-800/80">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Percent className="w-4 h-4" /> Pricing, Percentage Discount & Inventory
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">Regular Price (৳) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 25000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">Discount (%) (Optional)</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="e.g. 15 for 15% OFF"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">Available Stock Count *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 25"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                </div>

                {/* Live Calculated Sale Price Preview */}
                {formData.price && Number(formData.discount_percent) > 0 && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium">Customer Final Sale Price:</span>
                    <div className="text-right">
                      <span className="text-emerald-400 font-black text-sm">
                        {formatPrice(Math.round(Number(formData.price) * (1 - Number(formData.discount_percent) / 100)))}
                      </span>
                      <span className="text-rose-300 text-[10px] block font-bold">
                        (Customer saves {formatPrice(Math.round(Number(formData.price) * (Number(formData.discount_percent) / 100)))})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: High-Res Multi-Image Uploads */}
              <div className="space-y-4 bg-gray-950/60 p-4 rounded-2xl border border-gray-800/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" /> Product Media Gallery (Up to 4 High-Res Photos)
                  </h4>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    High-Res Cloud Storage
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUploader
                    label="Main Cover Photo (Required)"
                    value={formData.imageUrl1}
                    onChange={(url) => setFormData({ ...formData, imageUrl1: url })}
                    required
                    helpText="Primary photo shown across catalog and search"
                  />

                  <ImageUploader
                    label="Gallery Angle 2"
                    value={formData.imageUrl2}
                    onChange={(url) => setFormData({ ...formData, imageUrl2: url })}
                    helpText="Back view, packaging, or texture angle"
                  />

                  <ImageUploader
                    label="Gallery Angle 3"
                    value={formData.imageUrl3}
                    onChange={(url) => setFormData({ ...formData, imageUrl3: url })}
                    helpText="Side angle or lifestyle shot"
                  />

                  <ImageUploader
                    label="Gallery Angle 4"
                    value={formData.imageUrl4}
                    onChange={(url) => setFormData({ ...formData, imageUrl4: url })}
                    helpText="Close-up detail or accessories view"
                  />
                </div>
              </div>

              {/* Section 4: Sizes & Colors Variants */}
              <div className="space-y-4 bg-gray-950/60 p-4 rounded-2xl border border-gray-800/80">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> Sizes & Color Variants
                </h4>

                {/* Sizes */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Available Sizes / Capacities ({formData.selectedSizes.length} Selected):
                  </label>

                  {/* Active Selected Sizes with Remove (X) */}
                  {formData.selectedSizes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 bg-gray-900/90 rounded-xl border border-emerald-500/30">
                      {formData.selectedSizes.map((size) => (
                        <span
                          key={size}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm"
                        >
                          <span>{size}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleSize(size)}
                            className="hover:text-rose-200 transition"
                            title="Remove size"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick Popular Size Chips */}
                  <div className="space-y-1.5 mb-3">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Quick Popular Presets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SIZES.map((size) => {
                        const isSelected = formData.selectedSizes.includes(size);
                        return (
                          <button
                            type="button"
                            key={size}
                            onClick={() => handleToggleSize(size)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                              isSelected
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-gray-900 text-gray-400 border border-gray-700 hover:text-white hover:border-gray-500'
                            }`}
                          >
                            {isSelected ? `✓ ${size}` : `+ ${size}`}
                          </button>
                        );
                      })}
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
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSize}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Size</span>
                    </button>
                  </div>
                </div>

                {/* Colors */}
                <div className="pt-3 border-t border-gray-800">
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">Color Options:</label>
                  
                  {/* Current color badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.colors.map((c, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-900 border border-gray-700 rounded-xl text-xs"
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-white/30" style={{ backgroundColor: c.hex }} />
                        <span className="text-white font-bold">{c.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(idx)}
                          className="text-gray-400 hover:text-rose-400 ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Color inputs */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Color Name (e.g. Titanium Gray)"
                      value={formData.newColorName}
                      onChange={(e) => setFormData({ ...formData, newColorName: e.target.value })}
                      className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-48"
                    />
                    <input
                      type="color"
                      value={formData.newColorHex}
                      onChange={(e) => setFormData({ ...formData, newColorHex: e.target.value })}
                      className="w-9 h-8 bg-transparent border-0 rounded cursor-pointer"
                      title="Choose Color Code"
                    />
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                    >
                      + Add Color
                    </button>
                  </div>
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
                      {currentSpecMode === 'gadgets' && '⚡ Device, Hardware & Tech Specs (গ্যাজেট ও টেকনিক্যাল বিবরণ)'}
                      {currentSpecMode === 'fashion' && '👕 Fabric, Materials & Technical Specs (কাপড় ও ম্যাটেরিয়াল বিবরণ)'}
                      {currentSpecMode === 'groceries' && '🌿 Food, Nutrition & Storage Specs (খাদ্য ও উপাদান বিবরণ)'}
                      {currentSpecMode === 'none' && '🚫 Specifications Disabled (স্পেসিফিকেশন বন্ধ)'}
                    </h4>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="flex flex-wrap items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSpecMode('gadgets');
                        setFormData((prev) => ({
                          ...prev,
                          fabric: '',
                          fit_type: '',
                          care_instructions: '',
                          gender: 'Unisex',
                        }));
                      }}
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
                      onClick={() => {
                        setSpecMode('fashion');
                        setFormData((prev) => ({
                          ...prev,
                          specKey1: '',
                          specVal1: '',
                          specKey2: '',
                          specVal2: '',
                          specKey3: '',
                          specVal3: '',
                          warranty: '',
                        }));
                      }}
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
                      onClick={() => {
                        setSpecMode('groceries');
                        setFormData((prev) => ({
                          ...prev,
                          specKey1: '',
                          specVal1: '',
                          specKey2: '',
                          specVal2: '',
                          specKey3: '',
                          specVal3: '',
                          gender: '',
                        }));
                      }}
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
                      onClick={() => {
                        setSpecMode('none');
                        setFormData((prev) => ({
                          ...prev,
                          specKey1: '',
                          specVal1: '',
                          specKey2: '',
                          specVal2: '',
                          specKey3: '',
                          specVal3: '',
                          fabric: '',
                          fit_type: '',
                          care_instructions: '',
                          gender: '',
                          warranty: '',
                          origin: '',
                        }));
                      }}
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
                          Official Warranty (ওয়ারেন্টি সময়সীমা)
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
                          Edition / Origin (ভার্সন / উৎপাদন)
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
                          Build & Protection (বডি ও স্থায়িত্ব)
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
                        <label className="block text-xs font-bold text-gray-300 mb-1">Fabric / Material (কাপড়/উপাদান)</label>
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
                        <label className="block text-xs font-bold text-gray-300 mb-1">Fit / Cut Type (ফিটিং টাইপ)</label>
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
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                        >
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
                          Net Weight / Volume (ওজন / পরিমাণ)
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
                  <div className="p-4 rounded-xl bg-gray-900/60 border border-dashed border-gray-800 text-center space-y-2">
                    <p className="text-xs text-gray-400">
                      🚫 এই প্রোডাক্টের জন্য কোনো বিশেষ স্পেসিফিকেশন বন্ধ রাখা হয়েছে।
                    </p>
                    <p className="text-[11px] text-gray-500">
                      প্রয়োজন হলে ওপরের <strong>"⚡ Gadget & Tech"</strong> বা <strong>"👕 Fashion"</strong> ট্যাবে ক্লিক করে যেকোনো সময় স্পেসিফিকেশন চালু করতে পারবেন।
                    </p>
                  </div>
                )}
              </div>

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

              {/* Section 6: Special Delivery Note & Instructions (ডেলিভারি নোট ও বিশেষ সতর্কতা) */}
              <div className="space-y-3 bg-gray-950/60 p-4 rounded-2xl border border-gray-800/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Delivery Note & Customer Instruction (ডেলিভারি নোট ও নির্দেশনা)
                  </h4>
                  {formData.delivery_note && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, delivery_note: '' })}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                    >
                      ✕ Clear Note (ডেলিভারি নোট বন্ধ করুন)
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-400">
                  গ্রাহক প্রোডাক্ট দেখার সময় ডেলিভারি সেকশনের নিচে এই সতর্কবার্তাটি স্পষ্টভাবে দেখতে পাবে।
                </p>
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
                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                          isChecked
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                            : 'bg-gray-900 border-gray-800 text-gray-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{m.label}</span>
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
                            className="w-4 h-4 accent-emerald-500 rounded"
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1">{m.desc}</span>
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



              {/* Section 9: Badges & Toggles */}
              <div className="flex items-center gap-6 bg-gray-950/60 p-4 rounded-2xl border border-gray-800/80">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>🌟 Feature on Homepage Spotlight</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.is_trending}
                    onChange={(e) => setFormData({ ...formData, is_trending: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>🔥 Mark as Trending Best-Seller</span>
                </label>
              </div>

              {/* Section 8: Search Keywords, Tags & 20,000 Category Explorer */}
              <CategoryTagExplorer
                selectedTags={formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : []}
                onChangeTags={(newTags) => setFormData({ ...formData, tags: newTags.join(', ') })}
                currentCategoryId={formData.category_id}
                onSelectCategory={(catId) => {
                  setFormData({ ...formData, category_id: catId });
                  toast.success(`Product category updated to: ${catId}`);
                }}
              />

              {/* Submit / Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-800">
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

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
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

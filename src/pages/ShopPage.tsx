import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Product, Category } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/mockData';
import { ProductCard } from '../components/common/ProductCard';
import { Filter, SlidersHorizontal, ArrowUpDown, X, Check, RotateCcw } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { matchesProductSearch } from '../lib/searchUtils';
import {
  trackSearchQuery,
  trackCategoryView,
  calculateProductRelevanceScore,
  getSavedSearchIntent,
  getUserInterestProfile,
} from '../lib/recommendationEngine';

import { getCategoriesFromDB, getProductsFromDB } from '../lib/dbService';
import { CategoriesShowcase } from '../components/common/CategoriesShowcase';

const PRICE_PRESETS = [
  { label: 'All', min: '', max: '' },
  { label: 'Under ৳1,000', min: '', max: '1000' },
  { label: '৳1,000 - ৳2,500', min: '1000', max: '2500' },
  { label: '৳2,500 - ৳5,000', min: '2500', max: '5000' },
  { label: 'Above ৳5,000', min: '5000', max: '' },
];

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  const subCategoryParam = searchParams.get('sub_category') || 'all';
  const searchParam = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(subCategoryParam);
  const [searchQuery, setSearchQuery] = useState<string>(searchParam);
  const [sortBy, setSortBy] = useState<string>('featured');

  // Price Filters
  const [minPriceInput, setMinPriceInput] = useState<string>('');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | null>(null);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | null>(null);

  // In Stock Filter
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  // Drawer & Sidebar Visibility
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState<boolean>(true);
  const [intentVersion, setIntentVersion] = useState<number>(0);

  // Draft state inside the Mobile Filter Drawer
  const [draftSortBy, setDraftSortBy] = useState<string>('featured');
  const [draftCategory, setDraftCategory] = useState<string>('all');
  const [draftSubCategory, setDraftSubCategory] = useState<string>('all');
  const [draftMinPrice, setDraftMinPrice] = useState<string>('');
  const [draftMaxPrice, setDraftMaxPrice] = useState<string>('');
  const [draftOnlyInStock, setDraftOnlyInStock] = useState<boolean>(false);

  useEffect(() => {
    const handleIntentUpdate = () => setIntentVersion((v) => v + 1);
    window.addEventListener('kintesi_intent_updated', handleIntentUpdate);
    return () => window.removeEventListener('kintesi_intent_updated', handleIntentUpdate);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, prods] = await Promise.all([
          getCategoriesFromDB(),
          getProductsFromDB(),
        ]);
        if (cats && cats.length > 0) setCategories(cats);
        setProducts(prods);
      } catch (err) {
        console.warn('Shop page data notice:', err);
      }
    }
    loadData();
    window.addEventListener('kintesi_products_updated', loadData);
    window.addEventListener('kintesi_categories_updated', loadData);
    return () => {
      window.removeEventListener('kintesi_products_updated', loadData);
      window.removeEventListener('kintesi_categories_updated', loadData);
    };
  }, []);

  const isCategoryMatch = (prodCatId?: string, targetCat?: string) => {
    if (!targetCat || targetCat === 'all') return true;
    if (!prodCatId) return false;
    const pId = prodCatId.toLowerCase().trim();
    const tCat = targetCat.toLowerCase().trim();
    if (pId === tCat) return true;

    const found = categories.find(
      (c) => c.slug.toLowerCase() === tCat || c.id.toLowerCase() === tCat || c.name.toLowerCase() === tCat
    );
    if (found) {
      if (
        pId === found.slug.toLowerCase() ||
        pId === found.id.toLowerCase() ||
        pId === found.name.toLowerCase() ||
        pId.replace(/\s+/g, '-') === found.slug.toLowerCase()
      ) return true;
    }

    const aliases: Record<string, string[]> = {
      'womens-fashion': ['womens-fashion', 'women', 'womens', 'womens-clothing', 'womens-fashion-luxury', 'cat-womens-fashion', 'fashion_women', "women's fashion"],
      'mens-fashion': ['mens-fashion', 'men', 'mens', 'mens-clothing', 'mens-fashion-apparel', 'cat-mens-fashion', 'fashion_men', "men's fashion"],
      'computer-gaming': ['computer-gaming', 'laptops-computers', 'laptop', 'gaming', 'cat-laptops', 'computer', 'computer & gaming'],
      'home-living': ['home-living', 'home-kitchen', 'home', 'living', 'cat-home-kitchen', 'home & living'],
      'groceries-pet-supplies': ['groceries-pet-supplies', 'groceries-daily-essentials', 'groceries', 'food', 'cat-groceries', 'groceries & pet supplies'],
      'health-beauty': ['health-beauty', 'beauty-skincare', 'beauty', 'skincare', 'cat-beauty', 'menstrual-heating-period-care', 'orthopedic-posture-spine-care', 'beauty-skincare-therapy-gadgets', 'health & beauty'],
      'tv-home-appliances': ['tv-home-appliances', 'appliances', 'tv', 'electronics', 'tv & home appliances'],
      'electronic-accessories': ['electronic-accessories', 'audio-headphones', 'gadgets', 'cat-audio', 'accessories', 'electronic accessories'],
      'watches-bags': ['watches-bags', 'smart-watches', 'watches', 'bags', 'cat-watches', 'jewelry_watches', 'watches & bags'],
      'sports-outdoors': ['sports-outdoors', 'sports-fitness', 'sports', 'fitness', 'cat-sports', 'sports & outdoors'],
      'mother-baby': ['mother-baby', 'health-baby-care', 'baby', 'kids', 'cat-health-baby', 'mother & baby'],
      'automotives-motorbikes': ['automotives-motorbikes', 'automotive', 'motorbikes', 'bike', 'automotives & motorbikes'],
      'phones-accessories': ['phones-accessories', 'smartphones-tablets', 'phones', 'smartphones', 'cat-smartphones', 'phones & accessories'],
    };

    for (const [canonical, altList] of Object.entries(aliases)) {
      const allTokens = [canonical, ...altList];
      const targetMatches = allTokens.some((t) => t.toLowerCase() === tCat);
      const productMatches = allTokens.some((t) => t.toLowerCase() === pId);
      if (targetMatches && productMatches) {
        return true;
      }
    }

    return false;
  };

  // Sync state with URL params
  useEffect(() => {
    const cat = searchParams.get('category') || 'all';
    const sub = searchParams.get('sub_category') || 'all';
    const q = searchParams.get('search') || '';
    setSelectedCategory(cat);
    setSelectedSubCategory(sub);
    setSearchQuery(q);
    if (q) trackSearchQuery(q);
    if (cat && cat !== 'all') trackCategoryView(cat);
  }, [searchParams]);

  // Filtered Products computation
  const filteredProducts = useMemo(() => {
    const isFeatured = searchParams.get('featured') === 'true';

    return products
      .filter((product) => {
        // Featured only filter
        if (isFeatured && !product.is_featured) {
          return false;
        }
        // Category filter
        if (selectedCategory !== 'all' && !isCategoryMatch(product.category_id, selectedCategory)) {
          return false;
        }
        // Subcategory filter
        if (selectedSubCategory !== 'all') {
          const productSub = (product.sub_category || '').trim().toLowerCase();
          const targetSub = selectedSubCategory.trim().toLowerCase();
          if (productSub !== targetSub && !productSub.includes(targetSub) && !targetSub.includes(productSub)) {
            return false;
          }
        }
        // Search query filter
        if (searchQuery.trim() !== '') {
          if (!matchesProductSearch(product, searchQuery)) return false;
        }
        // Min & Max Price filter
        const price = product.discount_price || product.price;
        if (appliedMinPrice !== null && price < appliedMinPrice) return false;
        if (appliedMaxPrice !== null && price > appliedMaxPrice) return false;

        // Stock filter
        if (onlyInStock && product.stock <= 0) return false;

        return true;
      })
      .sort((a, b) => {
        const priceA = a.discount_price || a.price;
        const priceB = b.discount_price || b.price;

        if (sortBy === 'price-low') return priceA - priceB;
        if (sortBy === 'price-high') return priceB - priceA;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'newest') return (b.created_at || '').localeCompare(a.created_at || '');
        if (sortBy === 'featured') {
          const intentTerms = getSavedSearchIntent();
          const profile = getUserInterestProfile();
          const scoreA = calculateProductRelevanceScore(a, intentTerms, profile);
          const scoreB = calculateProductRelevanceScore(b, intentTerms, profile);
          if (scoreB !== scoreA) {
            return scoreB - scoreA;
          }
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
        }
        return 0;
      });
  }, [products, selectedCategory, selectedSubCategory, searchQuery, appliedMinPrice, appliedMaxPrice, onlyInStock, sortBy, searchParams, intentVersion]);

  const currentCategoryObj = categories.find(
    (c) => c.slug === selectedCategory || c.id === selectedCategory || c.name.toLowerCase() === selectedCategory.toLowerCase()
  );
  const currentSubcategories = currentCategoryObj?.subcategories || [];

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    setSelectedSubCategory('all');
    const newParams = new URLSearchParams(searchParams);
    if (slug === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', slug);
    }
    newParams.delete('sub_category');
    setSearchParams(newParams);
  };

  const handleSubCategorySelect = (subName: string) => {
    setSelectedSubCategory(subName);
    const newParams = new URLSearchParams(searchParams);
    if (subName === 'all') {
      newParams.delete('sub_category');
    } else {
      newParams.set('sub_category', subName);
    }
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedSubCategory('all');
    setSearchQuery('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setAppliedMinPrice(null);
    setAppliedMaxPrice(null);
    setOnlyInStock(false);
    setSortBy('featured');
    setSearchParams({});
  };

  // Active filters count for notification badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedSubCategory !== 'all') count++;
    if (appliedMinPrice !== null || appliedMaxPrice !== null) count++;
    if (onlyInStock) count++;
    if (searchQuery) count++;
    if (sortBy !== 'featured') count++;
    return count;
  }, [selectedCategory, selectedSubCategory, appliedMinPrice, appliedMaxPrice, onlyInStock, searchQuery, sortBy]);

  // Open mobile modal and initialize draft states
  const openMobileFilterModal = () => {
    setDraftSortBy(sortBy);
    setDraftCategory(selectedCategory);
    setDraftSubCategory(selectedSubCategory);
    setDraftMinPrice(appliedMinPrice !== null ? String(appliedMinPrice) : '');
    setDraftMaxPrice(appliedMaxPrice !== null ? String(appliedMaxPrice) : '');
    setDraftOnlyInStock(onlyInStock);
    setIsMobileFilterOpen(true);
  };

  // Live draft product match count inside modal
  const draftMatchCount = useMemo(() => {
    return products.filter((product) => {
      if (draftCategory !== 'all' && !isCategoryMatch(product.category_id, draftCategory)) {
        return false;
      }
      if (draftSubCategory !== 'all') {
        const productSub = (product.sub_category || '').trim().toLowerCase();
        const targetSub = draftSubCategory.trim().toLowerCase();
        if (productSub !== targetSub && !productSub.includes(targetSub) && !targetSub.includes(productSub)) {
          return false;
        }
      }
      const price = product.discount_price || product.price;
      const minN = draftMinPrice.trim() ? Number(draftMinPrice) : null;
      const maxN = draftMaxPrice.trim() ? Number(draftMaxPrice) : null;
      if (minN !== null && !isNaN(minN) && price < minN) return false;
      if (maxN !== null && !isNaN(maxN) && price > maxN) return false;
      if (draftOnlyInStock && product.stock <= 0) return false;
      return true;
    }).length;
  }, [products, draftCategory, draftSubCategory, draftMinPrice, draftMaxPrice, draftOnlyInStock]);

  const applyDraftFilters = () => {
    setSortBy(draftSortBy);
    setSelectedCategory(draftCategory);
    setSelectedSubCategory(draftSubCategory);

    const minNum = draftMinPrice.trim() ? Math.max(0, Number(draftMinPrice)) : null;
    const maxNum = draftMaxPrice.trim() ? Math.max(0, Number(draftMaxPrice)) : null;
    setAppliedMinPrice(!isNaN(minNum as number) ? minNum : null);
    setAppliedMaxPrice(!isNaN(maxNum as number) ? maxNum : null);
    setMinPriceInput(draftMinPrice);
    setMaxPriceInput(draftMaxPrice);

    setOnlyInStock(draftOnlyInStock);

    const newParams = new URLSearchParams(searchParams);
    if (draftCategory === 'all') newParams.delete('category');
    else newParams.set('category', draftCategory);

    if (draftSubCategory === 'all') newParams.delete('sub_category');
    else newParams.set('sub_category', draftSubCategory);

    setSearchParams(newParams);
    setIsMobileFilterOpen(false);
  };

  const resetDraftFilters = () => {
    setDraftSortBy('featured');
    setDraftCategory('all');
    setDraftSubCategory('all');
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftOnlyInStock(false);
  };

  // Quick Price selection handler
  const handlePricePreset = (min: string, max: string, isDraft: boolean = false) => {
    if (isDraft) {
      setDraftMinPrice(min);
      setDraftMaxPrice(max);
    } else {
      setMinPriceInput(min);
      setMaxPriceInput(max);
      setAppliedMinPrice(min ? Number(min) : null);
      setAppliedMaxPrice(max ? Number(max) : null);
    }
  };

  const handleDesktopApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const minNum = minPriceInput.trim() ? Math.max(0, Number(minPriceInput)) : null;
    const maxNum = maxPriceInput.trim() ? Math.max(0, Number(maxPriceInput)) : null;
    setAppliedMinPrice(!isNaN(minNum as number) ? minNum : null);
    setAppliedMaxPrice(!isNaN(maxNum as number) ? maxNum : null);
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto px-2.5 sm:px-6 lg:px-8 py-2 sm:py-6 pb-28 sm:pb-8">
      
      {/* 
        1. MOBILE TOP ACTION BAR: 
        Zero wasted space, no bulky breadcrumbs or 'Explore Catalog' headers eating screen height
      */}
      <div className="flex md:hidden items-center justify-between gap-2 pb-2.5 mb-2 border-b border-gray-100">
        <div className="flex items-center gap-1.5 min-w-0">
          <h1 className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
            {selectedCategory !== 'all' ? (currentCategoryObj?.name || selectedCategory) : 'All Products'}
          </h1>
          <span className="text-[11px] font-semibold text-gray-400 shrink-0">
            ({filteredProducts.length})
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Filter Button */}
          <button
            onClick={openMobileFilterModal}
            className="flex items-center gap-1.5 h-8 px-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 rounded-full text-xs font-bold transition active:scale-95 shadow-2xs cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-rose-600" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-2xs">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Quick Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-8 px-2.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-800 focus:outline-none shadow-2xs cursor-pointer"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low</option>
            <option value="price-high">Price: High</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* 
        2. DESKTOP HEADER (Clean & Minimal)
      */}
      <div className="hidden md:flex items-center justify-between gap-4 pb-4 mb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <Link to="/" className="hover:text-rose-600 transition">Home</Link>
            <span className="text-gray-300">/</span>
            <Link to="/shop" onClick={resetFilters} className="hover:text-rose-600 transition">Shop</Link>
            {selectedCategory !== 'all' && (
              <>
                <span className="text-gray-300">/</span>
                <span className="font-bold text-gray-800">{currentCategoryObj?.name || selectedCategory}</span>
              </>
            )}
            {selectedSubCategory !== 'all' && (
              <>
                <span className="text-rose-400 font-bold">&gt;</span>
                <span className="font-extrabold text-rose-600">{selectedSubCategory}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>{selectedCategory !== 'all' ? (currentCategoryObj?.name || 'All Products') : 'All Products'}</span>
            <span className="text-sm font-semibold text-gray-400">({filteredProducts.length} items)</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDesktopFilterOpen(!isDesktopFilterOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-rose-600" />
            <span>{isDesktopFilterOpen ? 'Hide Filters' : 'Show Filters'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent focus:outline-none font-bold text-gray-900 cursor-pointer text-xs"
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      {/* 
        3. SLEEK 1-LINE CATEGORY ROW
        Directly positioned under the top action bar without big borders or bulky header text
      */}
      <CategoriesShowcase
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
        className="mb-2 sm:mb-4"
      />

      <div className="flex flex-col md:flex-row gap-6 pt-1 sm:pt-2">
        
        {/* 
          4. DESKTOP SIDEBAR FILTERS (Professional & Comprehensive)
        */}
        {isDesktopFilterOpen && (
          <aside className="hidden md:block w-64 shrink-0 space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-5 sticky top-24">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4 text-rose-600" />
                  <span>Filters</span>
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Reset All
                  </button>
                )}
              </div>

              {/* Price Range Filter */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Price Range (৳)</h4>
                
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_PRESETS.map((preset) => {
                    const isActive = minPriceInput === preset.min && maxPriceInput === preset.max;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handlePricePreset(preset.min, preset.max, false)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          isActive
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/80'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Min / Max Form */}
                <form onSubmit={handleDesktopApplyPrice} className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min ৳"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:border-rose-500"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Max ৳"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-2xs cursor-pointer active:scale-95"
                  >
                    Go
                  </button>
                </form>
              </div>

              {/* In Stock Toggle */}
              <div className="pt-3 border-t border-gray-100">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>

              {/* Categories */}
              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Categories</h4>
                <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                  <button
                    onClick={() => handleCategorySelect('all')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between ${
                      selectedCategory === 'all'
                        ? 'bg-rose-50 text-rose-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>All Categories</span>
                    <span>{products.length}</span>
                  </button>
                  {categories.map((cat) => {
                    const count = products.filter((p) => isCategoryMatch(p.category_id, cat.slug)).length;
                    return (
                      <button
                        key={cat.slug || cat.id}
                        onClick={() => handleCategorySelect(cat.slug)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between ${
                          selectedCategory === cat.slug
                            ? 'bg-rose-50 text-rose-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate pr-2">{cat.name}</span>
                        <span className="text-gray-400 font-normal shrink-0">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </aside>
        )}

        {/* 
          5. MAIN PRODUCT CATALOG
        */}
        <main className="flex-1 min-w-0">
          {/* Subcategory Pills Bar (if a category is active) */}
          {selectedCategory !== 'all' && currentSubcategories.length > 0 && (
            <div className="mb-3.5 overflow-x-auto scrollbar-none flex items-center gap-1.5 py-1">
              <button
                onClick={() => handleSubCategorySelect('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 ${
                  selectedSubCategory === 'all'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-white text-gray-700 hover:text-rose-600 border border-gray-200'
                }`}
              >
                All {currentCategoryObj?.name || ''}
              </button>
              {currentSubcategories.map((sub) => {
                const isSelected = selectedSubCategory.toLowerCase() === sub.toLowerCase();
                return (
                  <button
                    key={sub}
                    onClick={() => handleSubCategorySelect(sub)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white text-gray-700 hover:text-rose-600 border border-gray-200'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Filter Chips (Instant dismiss buttons) */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-3.5 pb-2 border-b border-gray-100">
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <span>{currentCategoryObj?.name || selectedCategory}</span>
                  <button onClick={() => handleCategorySelect('all')} className="hover:text-rose-900 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedSubCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <span>{selectedSubCategory}</span>
                  <button onClick={() => handleSubCategorySelect('all')} className="hover:text-rose-900 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {(appliedMinPrice !== null || appliedMaxPrice !== null) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span>
                    {appliedMinPrice !== null && appliedMaxPrice !== null
                      ? `৳${appliedMinPrice} - ৳${appliedMaxPrice}`
                      : appliedMinPrice !== null
                      ? `From ৳${appliedMinPrice}`
                      : `Up to ৳${appliedMaxPrice}`}
                  </span>
                  <button
                    onClick={() => {
                      setMinPriceInput('');
                      setMaxPriceInput('');
                      setAppliedMinPrice(null);
                      setAppliedMaxPrice(null);
                    }}
                    className="hover:text-emerald-900 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {onlyInStock && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <span>In Stock</span>
                  <button onClick={() => setOnlyInStock(false)} className="hover:text-blue-900 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <span>"{searchQuery}"</span>
                  <button onClick={() => setSearchQuery('')} className="hover:text-amber-950 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={resetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline px-1.5 py-0.5 cursor-pointer ml-auto"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 shadow-2xs">
              <p className="text-gray-500 text-base font-semibold mb-2">No matching products found</p>
              <p className="text-xs text-gray-400 mb-5">Try changing or clearing your active filters.</p>
              <button
                onClick={resetFilters}
                className="px-5 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition shadow-xs cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className={`grid gap-2.5 sm:gap-3.5 lg:gap-4 ${
              isDesktopFilterOpen
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
            }`}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>

      </div>

      {/* 
        6. MOBILE PROFESSIONAL FILTER DRAWER (MODAL)
        - Draft state staging so selecting a category DOES NOT slam the drawer shut
        - Live matching count on 'Apply Filters' button
        - Complete control over Sort, Price, Stock, Category & Subcategories
      */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Slide-over sheet */}
          <div className="relative ml-auto w-[85%] max-w-sm bg-white h-full flex flex-col shadow-2xl z-10 animate-slide-in-right">
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-rose-600" />
                <h3 className="font-extrabold text-gray-900 text-sm">Filter Products</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetDraftFilters}
                  className="text-xs font-bold text-gray-500 hover:text-rose-600 cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Filter Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              
              {/* 1. Sort By */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Sort By</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'featured', label: 'Featured' },
                    { id: 'price-low', label: 'Price: Low' },
                    { id: 'price-high', label: 'Price: High' },
                    { id: 'rating', label: 'Top Rated' },
                    { id: 'newest', label: 'New Arrivals' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setDraftSortBy(s.id)}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold text-center transition cursor-pointer ${
                        draftSortBy === s.id
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/80'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Price Range */}
              <div className="space-y-2.5 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Price Range (৳)</h4>
                
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_PRESETS.map((preset) => {
                    const isActive = draftMinPrice === preset.min && draftMaxPrice === preset.max;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handlePricePreset(preset.min, preset.max, true)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          isActive
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/80'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Min / Max Inputs */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min ৳"
                    value={draftMinPrice}
                    onChange={(e) => setDraftMinPrice(e.target.value)}
                    className="w-1/2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-gray-400 font-bold">-</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max ৳"
                    value={draftMaxPrice}
                    onChange={(e) => setDraftMaxPrice(e.target.value)}
                    className="w-1/2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* 3. In Stock Only Toggle */}
              <div className="pt-3 border-t border-gray-100">
                <label className="flex items-center justify-between cursor-pointer py-1 select-none">
                  <span className="text-xs font-bold text-gray-800">In Stock Items Only</span>
                  <input
                    type="checkbox"
                    checked={draftOnlyInStock}
                    onChange={(e) => setDraftOnlyInStock(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* 4. Category Selection */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Category</h4>
                <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftCategory('all');
                      setDraftSubCategory('all');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      draftCategory === 'all'
                        ? 'bg-rose-50 text-rose-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>All Categories</span>
                    <span>{products.length}</span>
                  </button>
                  {categories.map((cat) => {
                    const count = products.filter((p) => isCategoryMatch(p.category_id, cat.slug)).length;
                    return (
                      <button
                        key={cat.slug || cat.id}
                        type="button"
                        onClick={() => {
                          setDraftCategory(cat.slug);
                          setDraftSubCategory('all');
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          draftCategory === cat.slug
                            ? 'bg-rose-50 text-rose-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate pr-2">{cat.name}</span>
                        <span className="text-gray-400 font-normal shrink-0">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Subcategory Selection (dynamically shown if category selected) */}
              {draftCategory !== 'all' && (
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600">Sub-Categories</h4>
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => setDraftSubCategory('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                        draftSubCategory === 'all'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {(categories.find((c) => c.slug === draftCategory)?.subcategories || []).map((sub) => {
                      const isSel = draftSubCategory.toLowerCase() === sub.toLowerCase();
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setDraftSubCategory(sub)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                            isSel
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex items-center gap-2.5">
              <button
                type="button"
                onClick={resetDraftFilters}
                className="w-1/3 py-2.5 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50 transition cursor-pointer active:scale-95 text-center"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={applyDraftFilters}
                className="w-2/3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Apply Filters ({draftMatchCount})</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

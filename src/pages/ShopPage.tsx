import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, Category } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { ProductCard } from '../components/common/ProductCard';
import { Filter, SlidersHorizontal, ArrowUpDown, X, Check } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { matchesProductSearch } from '../lib/searchUtils';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  const searchParam = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [searchQuery, setSearchQuery] = useState<string>(searchParam);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | null>(null);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        const savedCustom: Product[] = JSON.parse(localStorage.getItem('kintesi_custom_products') || '[]');
        const { data: catData } = await supabase.from('categories').select('*');
        if (catData && catData.length > 0) setCategories(catData);

        const { data: prodData } = await supabase.from('products').select('*');
        const merged = [...savedCustom, ...(prodData || [])].filter(
          (p) => p && p.id && !p.id.startsWith('prod-')
        );
        const unique = Array.from(new Map(merged.map((p) => [p.slug || p.id, p])).values());
        setProducts(unique);
      } catch (err) {
        console.warn('Using local dataset:', err);
      }
    }
    loadData();
    window.addEventListener('kintesi_products_updated', loadData);
    return () => window.removeEventListener('kintesi_products_updated', loadData);
  }, []);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleApplyMaxPrice = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = maxPriceInput.trim();
    if (!val) {
      setAppliedMaxPrice(null);
      return;
    }
    const num = Math.max(0, Number(val));
    if (!isNaN(num)) {
      setAppliedMaxPrice(num);
    }
  };

  const handleClearMaxPrice = () => {
    setMaxPriceInput('');
    setAppliedMaxPrice(null);
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category filter
        if (selectedCategory !== 'all' && product.category_id !== selectedCategory) {
          return false;
        }
        // Search query filter using smart synonyms and multi-attribute matching
        if (searchQuery.trim() !== '') {
          if (!matchesProductSearch(product, searchQuery)) return false;
        }
        // Price filter (0 to appliedMaxPrice)
        const price = product.discount_price || product.price;
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
        return 0; // featured default
      });
  }, [products, selectedCategory, searchQuery, appliedMaxPrice, onlyInStock, sortBy]);

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    const newParams = new URLSearchParams(searchParams);
    if (slug === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', slug);
    }
    setSearchParams(newParams);
    setIsMobileFilterOpen(false);
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setMaxPriceInput('');
    setAppliedMaxPrice(null);
    setOnlyInStock(false);
    setSortBy('featured');
    setSearchParams({});
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Explore Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredProducts.length} premium tech items
            {searchQuery && <span> for "<b>{searchQuery}</b>"</span>}
          </p>
        </div>

        {/* Sort & Mobile filter trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400 hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent focus:outline-none font-bold text-gray-900 cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-8">
        
        {/* Desktop Sidebar Filters */}
        <div className="hidden md:block space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-[0_2px_12px_rgba(225,29,72,0.03)] space-y-6">
            
            {/* Filter Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-rose-600" />
                <span>Filters</span>
              </h3>
              {(selectedCategory !== 'all' || searchQuery || appliedMaxPrice !== null || onlyInStock) && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-rose-600 font-bold hover:underline"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Categories</h4>
              <div className="space-y-1">
                <button
                  onClick={() => handleCategorySelect('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    selectedCategory === 'all'
                      ? 'bg-rose-50 text-rose-700'
                      : 'text-gray-600 hover:bg-rose-50/40'
                  }`}
                >
                  <span>All Categories</span>
                  <span>{products.length}</span>
                </button>
                {categories.map((cat) => {
                  const count = products.filter((p) => p.category_id === cat.slug).length;
                  return (
                    <button
                      key={cat.slug || cat.id}
                      onClick={() => handleCategorySelect(cat.slug)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        selectedCategory === cat.slug
                          ? 'bg-rose-50 text-rose-700'
                          : 'text-gray-600 hover:bg-rose-50/40'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-gray-400 font-normal">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Max Price Custom Input (0 to Any Amount, No Upper Bound Specified) */}
            <div className="pt-4 border-t border-rose-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Max Price (৳)</h4>
                {appliedMaxPrice !== null && (
                  <button
                    type="button"
                    onClick={handleClearMaxPrice}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <form onSubmit={handleApplyMaxPrice} className="space-y-2">
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-gray-400 select-none">৳</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 থেকে যেকোনো টাকা..."
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>Apply Price Filter</span>
                </button>
              </form>
              {appliedMaxPrice !== null && (
                <p className="text-[11px] text-emerald-600 font-bold mt-2">
                  ✓ Up to {formatPrice(appliedMaxPrice)}
                </p>
              )}
            </div>

            {/* In Stock only toggle */}
            <div className="pt-4 border-t border-rose-100">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded"
                />
                <span>In Stock Items Only</span>
              </label>
            </div>

          </div>
        </div>

        {/* Product Grid */}
        <div className="md:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-rose-100 p-8 shadow-xs">
              <p className="text-gray-400 text-lg font-medium mb-2">No matching products found</p>
              <p className="text-xs text-gray-500 mb-6">Try changing your filters, search term, or price range.</p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="relative ml-auto w-4/5 max-w-sm bg-white h-full p-6 shadow-2xl overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Filters</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Categories */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Categories</h4>
              <div className="space-y-1">
                <button
                  onClick={() => handleCategorySelect('all')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold ${
                    selectedCategory === 'all' ? 'bg-rose-50 text-rose-700' : 'text-gray-600'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.slug || cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full text-left p-2 rounded-lg text-xs font-bold ${
                      selectedCategory === cat.slug ? 'bg-rose-50 text-rose-700' : 'text-gray-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Max Price Input */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Max Price (৳)</h4>
                {appliedMaxPrice !== null && (
                  <button
                    type="button"
                    onClick={handleClearMaxPrice}
                    className="text-[11px] text-rose-600 font-bold underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <form onSubmit={handleApplyMaxPrice} className="space-y-2">
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-gray-400">৳</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 থেকে যেকোনো টাকা..."
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full py-2 bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  Apply Price
                </button>
              </form>
            </div>

            {/* Mobile In Stock */}
            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded"
                />
                <span>In Stock Items Only</span>
              </label>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

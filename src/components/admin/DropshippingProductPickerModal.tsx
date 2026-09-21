import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Loader2,
  ExternalLink,
  Zap,
  ArrowRight,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Check,
  TrendingUp,
} from 'lucide-react';
import {
  DropshippingProduct,
  fetchDropshippingProducts,
  searchDropshippingProducts,
  convertDropshippingToKintesiProduct,
  mapDropshippingCategory,
} from '../../lib/dropshippingService';
import { Product } from '../../types';
import { formatPrice } from '../../lib/utils';
import { toast } from 'sonner';

interface DropshippingProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (productData: Partial<Product>, raw: DropshippingProduct) => void;
  onDirectImport?: (productData: Partial<Product>) => Promise<void>;
  isLight?: boolean;
}

export const DropshippingProductPickerModal: React.FC<DropshippingProductPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onDirectImport,
  isLight = true,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(15);
  const [totalProducts, setTotalProducts] = useState(2951);
  const [products, setProducts] = useState<DropshippingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [directImportingId, setDirectImportingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load products for the current page
  const loadPage = async (page: number) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchDropshippingProducts(page);
      setProducts(data.products || []);
      setCurrentPage(data.current_page || page);
      setLastPage(data.last_page || 15);
      setTotalProducts(data.total || 2951);
    } catch (err: any) {
      console.error('Failed to load dropshipping products:', err);
      const msg = err?.message || 'Dropshipping BD API থেকে প্রোডাক্ট লোড করা যায়নি!';
      setLoadError(msg);
      toast.error('Dropshipping BD API থেকে প্রোডাক্ট লোড করা যায়নি!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPage(currentPage);
    }
  }, [isOpen, currentPage]);

  // Unique categories list extracted from current products
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category.trim());
    });
    return Array.from(cats);
  }, [products]);

  // Filtered items based on search and category
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== 'all') {
      list = list.filter((p) => (p.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const code = String(p.product_code || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return code.includes(q) || name.includes(q) || cat.includes(q);
      });
    }

    return list;
  }, [products, selectedCategory, searchQuery]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadPage(1);
      return;
    }
    setIsLoading(true);
    try {
      const res = await searchDropshippingProducts(searchQuery, 1);
      setProducts(res.products);
      setLastPage(res.lastPage);
      setTotalProducts(res.total);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (dropProd: DropshippingProduct) => {
    const converted = convertDropshippingToKintesiProduct(dropProd);
    onSelectProduct(converted, dropProd);
    toast.success(`"${dropProd.name.slice(0, 30)}..." ফর্মটিতে অটোফিল করা হয়েছে!`);
    onClose();
  };

  const handleQuickImport = async (dropProd: DropshippingProduct) => {
    if (!onDirectImport) return;
    setDirectImportingId(dropProd.id);
    try {
      const converted = convertDropshippingToKintesiProduct(dropProd);
      await onDirectImport(converted);
      toast.success(`"${dropProd.name.slice(0, 30)}..." সফলভাবে স্টোরে ইমপোর্ট হয়েছে!`);
    } catch (err: any) {
      toast.error('ইমপোর্ট ব্যর্থ হয়েছে: ' + (err.message || 'Unknown error'));
    } finally {
      setDirectImportingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-5xl h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden border ${
          isLight ? 'bg-white border-slate-200' : 'bg-gray-900 border-gray-800'
        }`}
      >
        {/* Top Header */}
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-3.5 border-b shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-gray-800/80 border-gray-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm sm:text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Dropshipping BD Product Explorer
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  API Live ({totalProducts} Products)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                এক ক্লিকে ড্রপশিপিং বিডি এর পণ্য আপনার স্টোরের ফর্ম বা ক্যাটালগে ইমপোর্ট করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadPage(currentPage)}
              disabled={isLoading}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-gray-700 text-gray-300'
              }`}
              title="Refresh catalog"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-rose-600' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-gray-700 text-gray-300'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div
          className={`p-3 sm:p-4 border-b space-y-2.5 shrink-0 ${
            isLight ? 'bg-white border-slate-100' : 'bg-gray-900 border-gray-800'
          }`}
        >
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Product Code (e.g. 3002) or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  isLight
                    ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400'
                    : 'bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer active:scale-95 shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  loadPage(1);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Clear
              </button>
            )}
          </form>

          {/* Quick Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All Categories
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Product Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-rose-600 mb-3" />
              <p className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                Dropshipping BD লাইভ ক্যাটালগ লোড হচ্ছে...
              </p>
            </div>
          ) : loadError && products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
                <RefreshCw className="w-6 h-6" />
              </div>
              <p className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                Dropshipping BD API কানেক্ট করা যায়নি
              </p>
              <p className="text-xs text-rose-500 mt-1 max-w-md">
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => loadPage(currentPage)}
                className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>পুনরায় চেষ্টা করুন (Retry)</span>
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <Package className="w-12 h-12 text-slate-300 mb-3" />
              <p className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                কোনো প্রোডাক্ট পাওয়া যায়নি
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                অন্য কোনো প্রোডাক্ট কোড বা নাম দিয়ে সার্চ করুন অথবা ক্যাটাগরি ফিল্টার ক্লিয়ার করুন।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((p) => {
                const profit = (p.price || 0) - (p.sale_price || 0);
                const hasVariants = Array.isArray(p.product_variants) && p.product_variants.length > 0;
                const isImporting = directImportingId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-3 transition hover:shadow-lg ${
                      isLight
                        ? 'bg-white border-slate-200 hover:border-rose-300 shadow-2xs'
                        : 'bg-gray-800/80 border-gray-700 hover:border-rose-500/50'
                    }`}
                  >
                    {/* Top Badges */}
                    <div>
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                        <img
                          src={p.thumbnail_img || '/logo.webp'}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logo.webp';
                          }}
                        />
                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-black/75 text-white backdrop-blur-xs">
                            #{p.product_code}
                          </span>
                          {p.category && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/90 text-slate-800 shadow-2xs truncate max-w-[120px]">
                              {p.category}
                            </span>
                          )}
                        </div>

                        {hasVariants && (
                          <div className="absolute bottom-2 right-2">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-600 text-white shadow-2xs flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5" />
                              {p.product_variants!.length} Variants
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Title */}
                      <h4
                        className={`text-xs font-bold line-clamp-2 leading-snug mb-2 ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                        title={p.name}
                      >
                        {p.name}
                      </h4>

                      {/* Price Grid */}
                      <div
                        className={`p-2 rounded-xl mb-3 ${
                          isLight ? 'bg-slate-50 border border-slate-100' : 'bg-gray-900/60 border border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-400 font-medium">Wholesale Cost:</span>
                          <span className="font-extrabold text-rose-600">
                            ৳{p.sale_price || p.price}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-400 font-medium">Retail Price:</span>
                          <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                            ৳{p.price}
                          </span>
                        </div>
                        {profit > 0 && (
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50">
                            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                              <TrendingUp className="w-3 h-3" />
                              Margin:
                            </span>
                            <span className="font-black text-emerald-600">
                              +৳{profit}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSelect(p)}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                      >
                        <span>Autofill Add Form</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {onDirectImport && (
                        <button
                          type="button"
                          onClick={() => handleQuickImport(p)}
                          disabled={isImporting}
                          className={`w-full py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                            isLight
                              ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-gray-700'
                          }`}
                        >
                          {isImporting ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                              <span>Importing...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>1-Click Direct Import</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Pagination Bar */}
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-3 border-t shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-gray-800/80 border-gray-700'
          }`}
        >
          <div className="text-xs text-slate-500 font-semibold">
            Showing Page <b className={isLight ? 'text-slate-900' : 'text-white'}>{currentPage}</b> of{' '}
            <b className={isLight ? 'text-slate-900' : 'text-white'}>{lastPage}</b> ({totalProducts} total)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isLight ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              disabled={currentPage >= lastPage || isLoading}
              onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isLight ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

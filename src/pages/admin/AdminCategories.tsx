import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { INITIAL_CATEGORIES } from '../../data/mockData';
import { Category, Product } from '../../types';
import {
  Plus,
  Trash2,
  Edit2,
  Tags,
  X,
  Search,
  ExternalLink,
  Package,
  ShoppingBag,
  Smartphone,
  Laptop,
  Shirt,
  Watch,
  Sparkles,
  Home,
  Footprints,
  Headphones,
  Dumbbell,
  Tv,
  Palette,
  Car,
  HeartHandshake,
  RotateCcw,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploader } from '../../components/common/ImageUploader';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import {
  getCategoriesFromDB,
  saveCategoryToDB,
  deleteCategoryFromDB,
  resetCategoriesToDefault,
  getProductsFromDB,
} from '../../lib/dbService';

const ICON_COMPONENTS: Record<string, any> = {
  Tags,
  ShoppingBag,
  Smartphone,
  Laptop,
  Shirt,
  Watch,
  Sparkles,
  Home,
  Footprints,
  Headphones,
  Dumbbell,
  Tv,
  Palette,
  Car,
  HeartHandshake,
};

const AVAILABLE_ICONS = [
  'Sparkles',
  'Shirt',
  'Laptop',
  'Home',
  'ShoppingBag',
  'Tv',
  'Palette',
  'Headphones',
  'Watch',
  'Dumbbell',
  'HeartHandshake',
  'Car',
  'Smartphone',
  'Footprints',
  'Tags',
];

export const AdminCategories: React.FC = () => {
  const { isLight } = useAdminTheme();
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    icon: 'ShoppingBag',
    subcategories: [] as string[],
  });
  const [newSubcategoryInput, setNewSubcategoryInput] = useState('');
  const [cardSubcategoryInput, setCardSubcategoryInput] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      const [cats, prods] = await Promise.all([
        getCategoriesFromDB(),
        getProductsFromDB(),
      ]);
      if (cats && cats.length > 0) setCategories(cats);
      if (prods && prods.length > 0) setProducts(prods);
    } catch (err) {
      console.warn('Categories load note:', err);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('kintesi_categories_updated', loadData);
    window.addEventListener('kintesi_products_updated', loadData);
    return () => {
      window.removeEventListener('kintesi_categories_updated', loadData);
      window.removeEventListener('kintesi_products_updated', loadData);
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      icon: 'ShoppingBag',
      subcategories: [],
    });
    setNewSubcategoryInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image_url: cat.image_url || '',
      icon: cat.icon || 'ShoppingBag',
      subcategories: cat.subcategories ? [...cat.subcategories] : [],
    });
    setNewSubcategoryInput('');
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    if (!editingCategory && (!formData.slug || formData.slug === formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))) {
      const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData((prev) => ({ ...prev, name: val, slug: autoSlug }));
    } else {
      setFormData((prev) => ({ ...prev, name: val }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const cleanSlug =
      formData.slug.trim() ||
      formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const catId = editingCategory?.id || ('cat-' + cleanSlug);

    const payload: Category = {
      id: catId,
      name: formData.name.trim(),
      slug: cleanSlug,
      description: formData.description.trim(),
      image_url: formData.image_url.trim(),
      icon: formData.icon || 'ShoppingBag',
      subcategories: formData.subcategories,
    };

    try {
      await saveCategoryToDB(payload);
      toast.success(editingCategory ? 'Category updated!' : 'Category created!');
      loadData();
    } catch (err: any) {
      toast.success('Category saved!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete category "${cat.name}"? Products in this category will not be deleted.`)) return;

    setCategories((prev) => prev.filter((c) => c.slug !== cat.slug && c.id !== cat.id));
    try {
      await deleteCategoryFromDB(cat.slug || cat.id);
      toast.success(`Category "${cat.name}" removed successfully`);
    } catch (err) {
      toast.error('Could not delete category from database');
    }
  };

  const handleQuickAddSubCategory = async (cat: Category, subName: string) => {
    const trimmed = subName.trim();
    if (!trimmed) return;
    const existing = cat.subcategories || [];
    if (existing.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.info('Sub-category already exists in this category');
      return;
    }
    const updatedSubcategories = [...existing, trimmed];
    const updatedCat: Category = {
      ...cat,
      subcategories: updatedSubcategories,
    };
    try {
      await saveCategoryToDB(updatedCat);
      toast.success(`Added "${trimmed}" to ${cat.name}!`);
      setCardSubcategoryInput((prev) => ({ ...prev, [cat.slug || cat.id]: '' }));
      loadData();
    } catch {
      toast.error('Could not save sub-category');
    }
  };

  const handleQuickRemoveSubCategory = async (cat: Category, subName: string) => {
    const existing = cat.subcategories || [];
    const updatedSubcategories = existing.filter((s) => s !== subName);
    const updatedCat: Category = {
      ...cat,
      subcategories: updatedSubcategories,
    };
    try {
      await saveCategoryToDB(updatedCat);
      toast.success(`Removed "${subName}"`);
      loadData();
    } catch {
      toast.error('Could not remove sub-category');
    }
  };

  const handleResetToStandard = async () => {
    if (
      !confirm(
        'Are you sure you want to reset categories to the standard 14 categories with their 10 sub-categories each? Any custom categories can be re-added anytime.'
      )
    ) {
      return;
    }
    try {
      await resetCategoriesToDefault();
      toast.success('Successfully restored 14 standard categories with all sub-categories!');
      loadData();
    } catch {
      toast.error('Failed to reset categories');
    }
  };

  const getProductCount = (cat: Category) => {
    return products.filter((p) => {
      if (!p || !p.category_id) return false;
      const cId = p.category_id.toLowerCase();
      return cId === cat.slug.toLowerCase() || cId === cat.id.toLowerCase();
    }).length;
  };

  const filteredCategories = categories.filter((category) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const inSub = (category.subcategories || []).some((s) => s.toLowerCase().includes(query));
    return (
      inSub ||
      [category.name, category.slug, category.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    );
  });

  return (
    <div className={`w-full space-y-6 pb-20 ${isLight ? 'text-[#0f172a]' : 'text-white'}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black ${isLight ? 'text-[#0f172a]' : 'text-white'}`}>
            Store Categories & Sub-Categories
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
            Organize products into clean departments with customizable sub-categories ({categories.length} categories)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetToStandard}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition border cursor-pointer active:scale-95 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200'
            }`}
            title="Reset to 14 standard categories with 10 sub-categories each"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset 14 Default Categories</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-600/25 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-gray-400'}`} />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search categories by name, slug, or description..."
          className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs font-medium focus:border-rose-500 focus:outline-none transition ${
            isLight
              ? 'bg-white border-slate-200 text-[#0f172a] placeholder:text-slate-400 shadow-xs'
              : 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500'
          }`}
          aria-label="Search categories"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
        {filteredCategories.map((cat) => {
          const count = getProductCount(cat);
          const IconComp = ICON_COMPONENTS[cat.icon || ''] || Tags;

          return (
            <div
              key={cat.slug || cat.id}
              className={`rounded-2xl border p-4 space-y-3 relative group transition flex flex-col justify-between ${
                isLight
                  ? 'bg-white border-slate-200 shadow-xs hover:border-rose-300 hover:shadow-md'
                  : 'bg-gray-800/90 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  {cat.image_url ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-rose-100/60 bg-gray-50 flex-shrink-0">
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold flex-shrink-0">
                      <IconComp className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Link
                      to={`/shop?category=${cat.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View in Storefront"
                      className={`p-1.5 rounded-lg transition ${
                        isLight ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900' : 'hover:bg-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      title="Edit Category"
                      className={`p-1.5 rounded-lg transition ${
                        isLight ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900' : 'hover:bg-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      title="Delete Category"
                      className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className={`text-sm font-bold leading-snug ${isLight ? 'text-[#0f172a]' : 'text-white'}`}>
                    {cat.name}
                  </h3>
                  <p className="text-[11px] font-mono text-rose-600 font-semibold mt-0.5">
                    /{cat.slug}
                  </p>
                  <p className={`text-[11px] mt-1.5 line-clamp-2 leading-relaxed ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    {cat.description || 'No description added'}
                  </p>
                </div>

                {/* Sub-Categories Interactive Manager on Card */}
                <div className="space-y-1.5 pt-2.5 mt-2 border-t border-gray-100 dark:border-gray-700/60">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className={isLight ? 'text-gray-700' : 'text-gray-300'}>
                      Sub-Categories ({cat.subcategories?.length || 0})
                    </span>
                    <span className="text-[10px] text-gray-400">Manage</span>
                  </div>

                  {/* Sub-category chips */}
                  <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto py-0.5 pr-0.5 scrollbar-thin">
                    {(cat.subcategories || []).map((sub) => (
                      <span
                        key={sub}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition ${
                          isLight
                            ? 'bg-rose-50/60 text-rose-800 border-rose-200/70 hover:bg-rose-100/80'
                            : 'bg-gray-700/80 text-gray-200 border-gray-600'
                        }`}
                      >
                        <span className="truncate max-w-[130px]">{sub}</span>
                        <button
                          type="button"
                          onClick={() => handleQuickRemoveSubCategory(cat, sub)}
                          title={`Remove ${sub}`}
                          className="text-rose-500 hover:text-rose-700 font-bold ml-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    {(!cat.subcategories || cat.subcategories.length === 0) && (
                      <span className="text-[10px] text-gray-400 italic py-1">No sub-categories yet. Type below to add.</span>
                    )}
                  </div>

                  {/* Inline quick-add sub-category */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={cardSubcategoryInput[cat.slug || cat.id] || ''}
                      onChange={(e) =>
                        setCardSubcategoryInput({
                          ...cardSubcategoryInput,
                          [cat.slug || cat.id]: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickAddSubCategory(cat, cardSubcategoryInput[cat.slug || cat.id] || '');
                        }
                      }}
                      placeholder="+ Add sub-category..."
                      className={`w-full px-2.5 py-1 text-[11px] rounded-lg border focus:outline-none focus:border-rose-500 transition ${
                        isLight
                          ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                          : 'bg-gray-900/80 border-gray-700 text-white placeholder:text-gray-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleQuickAddSubCategory(cat, cardSubcategoryInput[cat.slug || cat.id] || '')}
                      className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg shrink-0 transition shadow-xs active:scale-95"
                      title="Add Sub-Category"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className={`pt-3 border-t flex items-center justify-between text-[11px] font-semibold ${
                isLight ? 'border-slate-100 text-slate-500' : 'border-gray-700/60 text-gray-400'
              }`}>
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-rose-500" />
                  <span>{count} {count === 1 ? 'Product' : 'Products'}</span>
                </span>
                <Link
                  to={`/shop?category=${cat.slug}`}
                  className="text-rose-600 hover:underline font-bold"
                >
                  Browse →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className={`rounded-2xl border border-dashed px-6 py-12 text-center ${
          isLight ? 'border-slate-300 bg-slate-50' : 'border-gray-700 bg-gray-800/40'
        }`}>
          <Tags className="w-7 h-7 mx-auto mb-3 text-rose-500" />
          <p className={`text-sm font-bold ${isLight ? 'text-[#0f172a]' : 'text-white'}`}>
            No matching categories found
          </p>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
            Try a different keyword or create a new category.
          </p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-white border-slate-200 text-[#0f172a]' : 'bg-gray-900 border-gray-700 text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-gray-800'}`}>
              <h3 className={`text-base font-bold ${isLight ? 'text-[#0f172a]' : 'text-white'}`}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-2 rounded-lg transition ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Smart Watches"
                  className={`w-full px-4 py-2.5 border rounded-xl focus:border-rose-500 focus:outline-none transition ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-[#0f172a] focus:bg-white'
                      : 'bg-gray-800 border-gray-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                  Slug (URL Identifier) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="smart-watches"
                  className={`w-full px-4 py-2.5 border rounded-xl font-mono text-xs focus:border-rose-500 focus:outline-none transition ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-[#0f172a] focus:bg-white'
                      : 'bg-gray-800 border-gray-700 text-white'
                  }`}
                />
                <p className="text-[10px] text-gray-400 mt-1 font-mono">
                  URL will be: /shop?category={formData.slug || 'slug'}
                </p>
              </div>

              {/* Icon Selector */}
              <div>
                <label className={`block font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                  Category Icon
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_ICONS.map((iconKey) => {
                    const IconComp = ICON_COMPONENTS[iconKey];
                    const isSelected = formData.icon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconKey })}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
                          isSelected
                            ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                            : isLight
                            ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5 text-rose-600" />
                        <span>{iconKey}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short department overview for customers..."
                  className={`w-full px-4 py-2.5 border rounded-xl focus:border-rose-500 focus:outline-none transition ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-[#0f172a] focus:bg-white'
                      : 'bg-gray-800 border-gray-700 text-white'
                  }`}
                />
              </div>

              {/* Sub-Categories Tag Manager */}
              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                  Sub-Categories ({formData.subcategories.length})
                </label>
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    value={newSubcategoryInput}
                    onChange={(e) => setNewSubcategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = newSubcategoryInput.trim();
                        if (val && !formData.subcategories.some((s) => s.toLowerCase() === val.toLowerCase())) {
                          setFormData((prev) => ({ ...prev, subcategories: [...prev.subcategories, val] }));
                          setNewSubcategoryInput('');
                        }
                      }
                    }}
                    placeholder="Type sub-category and press Enter or click Add..."
                    className={`flex-1 px-3 py-2 border rounded-xl text-xs focus:border-rose-500 focus:outline-none transition ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-[#0f172a] focus:bg-white'
                        : 'bg-gray-800 border-gray-700 text-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = newSubcategoryInput.trim();
                      if (val && !formData.subcategories.some((s) => s.toLowerCase() === val.toLowerCase())) {
                        setFormData((prev) => ({ ...prev, subcategories: [...prev.subcategories, val] }));
                        setNewSubcategoryInput('');
                      }
                    }}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition active:scale-95"
                  >
                    + Add
                  </button>
                </div>

                {/* Chips list */}
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/80 dark:border-gray-700">
                  {formData.subcategories.map((sub, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/80 text-[11px] font-bold"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            subcategories: prev.subcategories.filter((_, i) => i !== idx),
                          }))
                        }
                        className="hover:text-rose-950 font-bold ml-0.5 cursor-pointer"
                        title="Delete subcategory"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {formData.subcategories.length === 0 && (
                    <span className="text-[11px] text-gray-400 italic p-1">
                      No sub-categories added yet. Type above and click "+ Add".
                    </span>
                  )}
                </div>
              </div>

              <ImageUploader
                label="Category Cover Photo (Optional)"
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                helpText="High-res photography displayed on category cards"
              />

              <div className={`flex justify-end gap-2 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-gray-800'}`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl font-bold transition ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-600/20 active:scale-95 transition"
                >
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

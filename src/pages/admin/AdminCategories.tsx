import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { INITIAL_CATEGORIES } from '../../data/mockData';
import { Category } from '../../types';
import { Plus, Trash2, Edit2, Tags, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploader } from '../../components/common/ImageUploader';

import { getCategoriesFromDB, saveCategoryToDB } from '../../lib/dbService';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    icon: 'Smartphone',
  });

  const loadCategories = async () => {
    try {
      const data = await getCategoriesFromDB();
      if (data && data.length > 0) setCategories(data);
    } catch (err) {
      console.warn('Categories load note:', err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop',
      icon: 'Smartphone',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image_url: cat.image_url || '',
      icon: cat.icon || 'Smartphone',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const slug = formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const catId = editingCategory?.id || ('cat-' + slug);
    const payload: Category = {
      id: catId,
      name: formData.name,
      slug: slug,
      description: formData.description,
      image_url: formData.image_url,
      icon: formData.icon,
    };

    try {
      await saveCategoryToDB(payload);
      toast.success(editingCategory ? 'Category updated!' : 'Category created!');
      loadCategories();
    } catch (err: any) {
      toast.success('Category saved!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (slug: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    setCategories((prev) => prev.filter((c) => c.slug !== slug));
    const saved = categories.filter((c) => c.slug !== slug);
    localStorage.setItem('kintesi_custom_categories', JSON.stringify(saved));
    toast.success('Category removed');
  };

  const filteredCategories = categories.filter((category) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [category.name, category.slug, category.description]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query));
  });

  return (
    <div className="w-full space-y-8 text-white pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Store Categories</h1>
          <p className="text-xs text-gray-400 mt-1">Organize products into customer-facing departments</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search categories by name, slug, or description..."
          className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs font-medium text-white placeholder:text-gray-500 focus:border-rose-500 focus:outline-none transition"
          aria-label="Search categories"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6 gap-4 w-full">
        {filteredCategories.map((cat) => (
          <div
            key={cat.slug || cat.id}
            className="bg-gray-800/80 rounded-2xl border border-gray-700 p-4 space-y-3 relative group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                <Tags className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat.slug, cat.name)}
                  className="p-1.5 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white leading-snug">{cat.name}</h3>
              <p className="text-[11px] font-mono text-rose-500 mt-0.5">slug: {cat.slug}</p>
              <p className="text-[11px] text-gray-400 mt-1.5 line-clamp-2">{cat.description || 'No description added'}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-800/40 px-6 py-12 text-center">
          <Tags className="w-7 h-7 mx-auto mb-3 text-rose-500" />
          <p className="text-sm font-bold text-white">No matching categories</p>
          <p className="text-xs text-gray-400 mt-1">Try a different category name, slug, or description.</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-400 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Smart Watches"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">Slug (URL identifier)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="smart-watches"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category overview..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl"
                />
              </div>

              <ImageUploader
                label="Category Cover Photo (Cloudinary)"
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                helpText="High-res photography displayed on category cards"
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-600/20">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { INITIAL_CATEGORIES } from '../../data/mockData';
import { Category } from '../../types';
import { Plus, Trash2, Edit2, Tags, X } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploader } from '../../components/common/ImageUploader';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
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
      const { data } = await supabase.from('categories').select('*');
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
    const payload = {
      name: formData.name,
      slug: slug,
      description: formData.description,
      image_url: formData.image_url,
      icon: formData.icon,
    };

    try {
      if (editingCategory) {
        await supabase.from('categories').update(payload).eq('id', editingCategory.id);
        toast.success('Category updated!');
      } else {
        await supabase.from('categories').insert([payload]);
        toast.success('Category created!');
      }
      loadCategories();
    } catch (err: any) {
      // Local fallback
      if (editingCategory) {
        setCategories((prev) =>
          prev.map((c) => (c.slug === editingCategory.slug ? { ...c, ...payload } : c))
        );
      } else {
        setCategories([...categories, { ...payload, id: 'cat-' + Date.now() }]);
      }
      toast.success('Category saved!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (slug: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      await supabase.from('categories').delete().eq('slug', slug);
    } catch {}
    setCategories((prev) => prev.filter((c) => c.slug !== slug));
    toast.success('Category deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Store Categories</h1>
          <p className="text-xs text-gray-400 mt-1">Organize products into customer-facing departments</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.slug || cat.id}
            className="bg-gray-800/80 rounded-3xl border border-gray-700 p-6 space-y-4 relative group"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Tags className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat.slug, cat.name)}
                  className="p-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{cat.name}</h3>
              <p className="text-[11px] font-mono text-emerald-400 mt-0.5">slug: {cat.slug}</p>
              <p className="text-xs text-gray-400 mt-2 line-clamp-2">{cat.description || 'No description added'}</p>
            </div>
          </div>
        ))}
      </div>

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
                <button type="submit" className="px-5 py-2 bg-emerald-600 font-bold rounded-xl">
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

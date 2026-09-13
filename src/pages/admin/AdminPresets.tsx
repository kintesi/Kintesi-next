import React, { useState, useEffect } from 'react';
import {
  Palette,
  Layers,
  Plus,
  Trash2,
  RotateCcw,
  Search,
  Sliders,
  ArrowRight,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export interface ColorPresetItem {
  name: string;
  hex: string;
}

export const DEFAULT_COLOR_PRESETS: ColorPresetItem[] = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Grey', hex: '#6B7280' },
  { name: 'Navy Blue', hex: '#1E3A8A' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Sky Blue', hex: '#0EA5E9' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Maroon', hex: '#881337' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Rose Gold', hex: '#B76E79' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Lavender', hex: '#C084FC' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Olive Green', hex: '#65A30D' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Mint Green', hex: '#86EFAC' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Mustard', hex: '#CA8A04' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Coral', hex: '#FB7185' },
  { name: 'Beige', hex: '#D4B996' },
  { name: 'Brown', hex: '#78350F' },
  { name: 'Chocolate', hex: '#451A03' },
  { name: 'Gold', hex: '#EAB308' },
  { name: 'Silver', hex: '#94A3B8' },
];

export const DEFAULT_SIZE_PRESETS: string[] = [
  // Apparel
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', 'Free Size', 'Semi-Stitched', 'Unstitched',
  // Digital Storage / RAM
  '16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB',
  // Liquid / Volume
  '30ml', '50ml', '100ml', '150ml', '200ml', '250ml', '500ml', '750ml', '1L', '1.5L', '2L', '5L',
  // Weight
  '50g', '100g', '200g', '250g', '500g', '1kg', '2kg', '5kg', '10kg',
  // Footwear
  '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46',
];

export const AdminPresets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'colors' | 'sizes'>('colors');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Color Presets State
  const [colorPresets, setColorPresets] = useState<ColorPresetItem[]>(() => {
    try {
      const saved = localStorage.getItem('kintesi_color_presets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_COLOR_PRESETS;
  });

  // Color Add Form State
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#EC4899');

  // 2. Size Presets State
  const [sizePresets, setSizePresets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kintesi_size_presets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SIZE_PRESETS;
  });

  // Size Add Form State
  const [newSizeInput, setNewSizeInput] = useState('');
  const [selectedSizeCategory, setSelectedSizeCategory] = useState<'all' | 'apparel' | 'storage' | 'volume' | 'weight' | 'footwear'>('all');

  // Sync state with custom event
  const broadcastPresetUpdate = () => {
    window.dispatchEvent(new Event('kintesi_presets_updated'));
  };

  useEffect(() => {
    const handleStorage = () => {
      try {
        const c = localStorage.getItem('kintesi_color_presets');
        if (c) setColorPresets(JSON.parse(c));
        const s = localStorage.getItem('kintesi_size_presets');
        if (s) setSizePresets(JSON.parse(s));
      } catch {}
    };
    window.addEventListener('kintesi_presets_updated', handleStorage);
    return () => window.removeEventListener('kintesi_presets_updated', handleStorage);
  }, []);

  // Save color preset
  const handleAddColor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newColorName.trim();
    if (!name) {
      toast.error('Please enter a color name');
      return;
    }
    if (colorPresets.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error(`Color preset "${name}" already exists`);
      return;
    }
    const updated = [...colorPresets, { name, hex: newColorHex }];
    setColorPresets(updated);
    localStorage.setItem('kintesi_color_presets', JSON.stringify(updated));
    setNewColorName('');
    broadcastPresetUpdate();
    toast.success(`Color preset "${name}" successfully added!`);
  };

  // Delete color preset
  const handleDeleteColor = (name: string) => {
    const updated = colorPresets.filter((c) => c.name !== name);
    setColorPresets(updated);
    localStorage.setItem('kintesi_color_presets', JSON.stringify(updated));
    broadcastPresetUpdate();
    toast.success(`Color "${name}" removed from presets`);
  };

  // Save size preset
  const handleAddSize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const size = newSizeInput.trim();
    if (!size) {
      toast.error('Please enter a size or capacity name');
      return;
    }
    if (sizePresets.some((s) => s.toLowerCase() === size.toLowerCase())) {
      toast.error(`Size preset "${size}" already exists`);
      return;
    }
    const updated = [...sizePresets, size];
    setSizePresets(updated);
    localStorage.setItem('kintesi_size_presets', JSON.stringify(updated));
    setNewSizeInput('');
    broadcastPresetUpdate();
    toast.success(`Size preset "${size}" successfully added!`);
  };

  // Delete size preset
  const handleDeleteSize = (size: string) => {
    const updated = sizePresets.filter((s) => s !== size);
    setSizePresets(updated);
    localStorage.setItem('kintesi_size_presets', JSON.stringify(updated));
    broadcastPresetUpdate();
    toast.success(`Size "${size}" removed from presets`);
  };

  // Reset to standard defaults
  const handleResetDefaults = () => {
    if (window.confirm('Reset all color and size presets to default factory values?')) {
      setColorPresets(DEFAULT_COLOR_PRESETS);
      setSizePresets(DEFAULT_SIZE_PRESETS);
      localStorage.setItem('kintesi_color_presets', JSON.stringify(DEFAULT_COLOR_PRESETS));
      localStorage.setItem('kintesi_size_presets', JSON.stringify(DEFAULT_SIZE_PRESETS));
      broadcastPresetUpdate();
      toast.success('Presets reset to default successfully!');
    }
  };

  // Filtered color presets
  const filteredColors = colorPresets.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.hex.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered size presets
  const filteredSizes = sizePresets.filter((s) => {
    const matchesSearch = s.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedSizeCategory === 'all') return true;
    if (selectedSizeCategory === 'apparel') return ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'].includes(s);
    if (selectedSizeCategory === 'storage') return s.endsWith('GB') || s.endsWith('TB');
    if (selectedSizeCategory === 'volume') return s.endsWith('ml') || s.endsWith('L');
    if (selectedSizeCategory === 'weight') return s.endsWith('g') || s.endsWith('kg');
    if (selectedSizeCategory === 'footwear') return ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'].includes(s);
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Preset Management</h1>
              <p className="text-xs text-gray-400">
                Manage global reusable color swatches, dimensions & product attribute chips
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            title="Restore standard preset library"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <Link
            to="/admin/products"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <span>Product Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Stats and Navigation Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('colors')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
            activeTab === 'colors'
              ? 'bg-rose-500/10 border-rose-500/40 text-white shadow-lg shadow-rose-500/5'
              : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'colors' ? 'bg-rose-500/20 text-rose-300' : 'bg-gray-800 text-gray-400'}`}>
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black">Color Variant Presets</div>
              <div className="text-xs text-gray-500">Hex codes, swatches & variant names</div>
            </div>
          </div>
          <span className="px-3 py-1 bg-rose-500/20 text-rose-300 font-black rounded-full text-xs border border-rose-500/30">
            {colorPresets.length} Colors
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sizes')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
            activeTab === 'sizes'
              ? 'bg-purple-500/10 border-purple-500/40 text-white shadow-lg shadow-purple-500/5'
              : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'sizes' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-800 text-gray-400'}`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black">Size & Dimension Presets</div>
              <div className="text-xs text-gray-500">Apparel, storage, volume & weight</div>
            </div>
          </div>
          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 font-black rounded-full text-xs border border-purple-500/30">
            {sizePresets.length} Sizes
          </span>
        </button>
      </div>

      {/* Search & Info Banner */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'colors' ? 'colors by name or hex code...' : 'sizes and dimensions...'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 px-2 shrink-0">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Presets auto-sync with the Product Edit Studio</span>
        </div>
      </div>

      {/* TAB 1: COLOR PRESETS */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          {/* Add New Color Preset Card */}
          <div className="bg-gray-950/80 border border-rose-500/30 p-5 rounded-3xl shadow-lg">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4" /> Add New Reusable Color Preset
            </h3>

            <form onSubmit={handleAddColor} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Color Swatch Picker */}
              <div className="sm:col-span-4 flex items-center gap-2.5 bg-gray-900 p-2 rounded-xl border border-gray-800">
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0 shrink-0"
                  title="Pick a color"
                />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Color Hex</span>
                  <input
                    type="text"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="bg-transparent text-xs text-white font-mono font-bold focus:outline-none uppercase w-20"
                  />
                </div>
              </div>

              {/* Color Name Input */}
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="Color Name (e.g. Lavender, Rose Gold, Midnight Black)"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-rose-500 font-bold"
                />
              </div>

              {/* Submit Button */}
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Color Preset</span>
                </button>
              </div>
            </form>

            {/* Quick Inspiration Swatches */}
            <div className="mt-3 pt-3 border-t border-gray-800/80 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Quick Palettes:</span>
              {[
                { name: 'Lilac', hex: '#C084FC' },
                { name: 'Teal', hex: '#14B8A6' },
                { name: 'Coral', hex: '#FB7185' },
                { name: 'Amber', hex: '#F59E0B' },
                { name: 'Slate', hex: '#64748B' },
                { name: 'Champagne', hex: '#F7E7CE' },
                { name: 'Burgundy', hex: '#800020' },
              ].map((pal) => (
                <button
                  key={pal.name}
                  type="button"
                  onClick={() => {
                    setNewColorName(pal.name);
                    setNewColorHex(pal.hex);
                  }}
                  className="text-[10px] bg-gray-900 hover:bg-gray-850 text-gray-300 px-2 py-1 rounded-lg border border-gray-800 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.hex }} />
                  <span>{pal.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Presets Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {filteredColors.map((preset) => (
              <div
                key={preset.name}
                className="group relative bg-gray-900/90 border border-gray-800 hover:border-rose-500/50 rounded-2xl p-3.5 transition flex flex-col justify-between shadow-md"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl border border-black/30 shadow-inner shrink-0"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-white truncate" title={preset.name}>
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      {preset.hex.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-800/80">
                  <span className="text-[9px] text-gray-500 uppercase font-bold">Reusable Preset</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteColor(preset.name)}
                    className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                    title={`Delete "${preset.name}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SIZE & DIMENSION PRESETS */}
      {activeTab === 'sizes' && (
        <div className="space-y-6">
          {/* Add New Size Preset Card */}
          <div className="bg-gray-950/80 border border-purple-500/30 p-5 rounded-3xl shadow-lg">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4" /> Add New Reusable Size or Dimension Preset
            </h3>

            <form onSubmit={handleAddSize} className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="Size or Capacity (e.g. 4XL, 2TB, 250ml, 500g, 42, 10kg, Free Size)"
                  value={newSizeInput}
                  onChange={(e) => setNewSizeInput(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Save Size Preset</span>
              </button>
            </form>

            {/* Category Filter Chips */}
            <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-gray-500 font-bold uppercase mr-1">Filter by Type:</span>
              {[
                { id: 'all', label: 'All Presets' },
                { id: 'apparel', label: '👕 Apparel' },
                { id: 'storage', label: '💾 Digital Storage' },
                { id: 'volume', label: '🧴 Volume & Liquids' },
                { id: 'weight', label: '⚖️ Weight' },
                { id: 'footwear', label: '👟 Footwear' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedSizeCategory(cat.id as any)}
                  className={`text-xs px-2.5 py-1 rounded-xl font-bold transition cursor-pointer ${
                    selectedSizeCategory === cat.id
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sizes Chips Grid */}
          <div className="flex flex-wrap gap-2.5">
            {filteredSizes.map((size) => (
              <div
                key={size}
                className="group inline-flex items-center bg-gray-900/90 hover:bg-gray-850 text-gray-200 border border-gray-800 hover:border-purple-500/60 rounded-xl text-xs font-bold transition overflow-hidden shadow-xs"
              >
                <span className="px-3.5 py-2">{size}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteSize(size)}
                  className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 border-l border-gray-800 transition cursor-pointer"
                  title={`Delete "${size}"`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

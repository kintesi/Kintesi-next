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
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { getPresetsFromDB, savePresetsToDB } from '../../lib/dbService';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

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
  const { isLight } = useAdminTheme();
  const [activeTab, setActiveTab] = useState<'colors' | 'sizes'>('colors');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

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
  const [newColorHex, setNewColorHex] = useState('#E11D48');

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    toast.success(`Copied ${hex} to clipboard!`);
    setTimeout(() => setCopiedHex(null), 2000);
  };

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
    // Initial fetch from cloud database
    getPresetsFromDB().then((cloudPresets) => {
      if (cloudPresets.colors && Array.isArray(cloudPresets.colors) && cloudPresets.colors.length > 0) {
        setColorPresets(cloudPresets.colors);
        try {
          localStorage.setItem('kintesi_color_presets', JSON.stringify(cloudPresets.colors));
        } catch {}
      }
      if (cloudPresets.sizes && Array.isArray(cloudPresets.sizes) && cloudPresets.sizes.length > 0) {
        setSizePresets(cloudPresets.sizes);
        try {
          localStorage.setItem('kintesi_size_presets', JSON.stringify(cloudPresets.sizes));
        } catch {}
      }
    });

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
    savePresetsToDB({ colors: updated });
    setNewColorName('');
    broadcastPresetUpdate();
    toast.success(`Color preset "${name}" successfully added!`);
  };

  // Delete color preset
  const handleDeleteColor = (name: string) => {
    const updated = colorPresets.filter((c) => c.name !== name);
    setColorPresets(updated);
    localStorage.setItem('kintesi_color_presets', JSON.stringify(updated));
    savePresetsToDB({ colors: updated });
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
    savePresetsToDB({ sizes: updated });
    setNewSizeInput('');
    broadcastPresetUpdate();
    toast.success(`Size preset "${size}" successfully added!`);
  };

  // Delete size preset
  const handleDeleteSize = (size: string) => {
    const updated = sizePresets.filter((s) => s !== size);
    setSizePresets(updated);
    localStorage.setItem('kintesi_size_presets', JSON.stringify(updated));
    savePresetsToDB({ sizes: updated });
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
      savePresetsToDB({ colors: DEFAULT_COLOR_PRESETS, sizes: DEFAULT_SIZE_PRESETS });
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
      <div className={`p-6 rounded-3xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isLight
          ? 'bg-white border-rose-100 shadow-sm'
          : 'bg-gray-950/80 border-gray-800 shadow-lg'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
            isLight
              ? 'bg-rose-50 border border-rose-200 text-rose-600'
              : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
          }`}>
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl font-black tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Preset Management
              </h1>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isLight ? 'bg-rose-100 text-rose-700' : 'bg-rose-500/20 text-rose-400'
              }`}>
                Global Library
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
              Manage reusable color swatches, dimensions & product attribute chips for 1-click product catalog editing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
              isLight
                ? 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 shadow-xs'
                : 'bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border-gray-800'
            }`}
            title="Restore standard preset library"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <Link
            to="/admin/products"
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95"
          >
            <span>Product Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Stats and Tab Selector Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('colors')}
          className={`p-5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
            activeTab === 'colors'
              ? isLight
                ? 'bg-white border-rose-500 shadow-md ring-2 ring-rose-500/15'
                : 'bg-rose-500/10 border-rose-500/50 text-white shadow-lg shadow-rose-500/5'
              : isLight
              ? 'bg-white/80 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 shadow-xs'
              : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
              activeTab === 'colors'
                ? isLight ? 'bg-rose-100 text-rose-600' : 'bg-rose-500/20 text-rose-300'
                : isLight ? 'bg-gray-100 text-gray-500' : 'bg-gray-800 text-gray-400'
            }`}>
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-sm font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Color Variant Presets
              </div>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                Hex codes, swatches & variant names
              </div>
            </div>
          </div>
          <span className={`px-3 py-1 font-black rounded-full text-xs border ${
            isLight
              ? activeTab === 'colors'
                ? 'bg-rose-100 text-rose-700 border-rose-300'
                : 'bg-gray-100 text-gray-600 border-gray-200'
              : activeTab === 'colors'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : 'bg-gray-800 text-gray-400 border-gray-700'
          }`}>
            {colorPresets.length} Colors
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sizes')}
          className={`p-5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
            activeTab === 'sizes'
              ? isLight
                ? 'bg-white border-purple-500 shadow-md ring-2 ring-purple-500/15'
                : 'bg-purple-500/10 border-purple-500/50 text-white shadow-lg shadow-purple-500/5'
              : isLight
              ? 'bg-white/80 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 shadow-xs'
              : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
              activeTab === 'sizes'
                ? isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/20 text-purple-300'
                : isLight ? 'bg-gray-100 text-gray-500' : 'bg-gray-800 text-gray-400'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-sm font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Size & Dimension Presets
              </div>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                Apparel, storage, volume & weight
              </div>
            </div>
          </div>
          <span className={`px-3 py-1 font-black rounded-full text-xs border ${
            isLight
              ? activeTab === 'sizes'
                ? 'bg-purple-100 text-purple-700 border-purple-300'
                : 'bg-gray-100 text-gray-600 border-gray-200'
              : activeTab === 'sizes'
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
              : 'bg-gray-800 text-gray-400 border-gray-700'
          }`}>
            {sizePresets.length} Sizes
          </span>
        </button>
      </div>

      {/* Search & Sync Status Banner */}
      <div className={`border rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isLight
          ? 'bg-white border-gray-200/90 shadow-xs'
          : 'bg-gray-900/80 border-gray-800'
      }`}>
        <div className="relative flex-1">
          <Search className={`w-4 h-4 absolute left-3.5 top-3 pointer-events-none ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'colors' ? 'colors by name or hex code (#...)' : 'sizes and dimensions...'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none transition ${
              isLight
                ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-rose-500'
                : 'bg-gray-950 border-gray-800 text-white placeholder:text-gray-500 focus:border-rose-500'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 text-xs px-2 shrink-0">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span className={`font-semibold ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
            Auto-synced with product editor
          </span>
        </div>
      </div>

      {/* TAB 1: COLOR PRESETS */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          {/* Add New Color Preset Card */}
          <div className={`p-6 rounded-3xl border transition shadow-sm ${
            isLight
              ? 'bg-white border-rose-100 ring-1 ring-rose-100/50'
              : 'bg-gray-950/80 border-rose-500/30 shadow-lg'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                isLight ? 'text-rose-600' : 'text-rose-400'
              }`}>
                <Plus className="w-4 h-4" /> Add New Reusable Color Preset
              </h3>
              <span className={`text-[11px] font-bold ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>
                Custom Hex & Name
              </span>
            </div>

            <form onSubmit={handleAddColor} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Color Swatch Picker */}
              <div className={`sm:col-span-4 flex items-center gap-3 p-2 rounded-xl border ${
                isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-900 border-gray-800'
              }`}>
                <div className="relative">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0 shrink-0"
                    title="Pick a color"
                  />
                </div>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                    HEX CODE
                  </span>
                  <input
                    type="text"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className={`bg-transparent text-xs font-mono font-bold focus:outline-none uppercase w-24 ${
                      isLight ? 'text-gray-900' : 'text-white'
                    }`}
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
                  className={`w-full border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none transition ${
                    isLight
                      ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-rose-500'
                      : 'bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-rose-500'
                  }`}
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
            <div className={`mt-4 pt-4 border-t flex items-center gap-2 flex-wrap ${
              isLight ? 'border-gray-100' : 'border-gray-800/80'
            }`}>
              <span className={`text-[10px] font-black uppercase tracking-wider ${
                isLight ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Quick Palettes:
              </span>
              {[
                { name: 'Lilac', hex: '#C084FC' },
                { name: 'Teal', hex: '#14B8A6' },
                { name: 'Coral', hex: '#FB7185' },
                { name: 'Amber', hex: '#F59E0B' },
                { name: 'Rose Gold', hex: '#B76E79' },
                { name: 'Champagne', hex: '#F7E7CE' },
                { name: 'Burgundy', hex: '#800020' },
                { name: 'Royal Blue', hex: '#2563EB' },
                { name: 'Mint Green', hex: '#86EFAC' },
              ].map((pal) => (
                <button
                  key={pal.name}
                  type="button"
                  onClick={() => {
                    setNewColorName(pal.name);
                    setNewColorHex(pal.hex);
                  }}
                  className={`text-[10.5px] px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition cursor-pointer font-bold ${
                    isLight
                      ? 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200/80'
                      : 'bg-gray-900 hover:bg-gray-850 text-gray-300 border-gray-800'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: pal.hex }}
                  />
                  <span>{pal.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Presets Grid */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className={`text-xs font-black uppercase tracking-wider ${
                isLight ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Active Color Swatches ({filteredColors.length})
              </span>
              <span className={`text-[11px] ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>
                Click hex to copy
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredColors.map((preset) => {
                const isCopied = copiedHex === preset.hex;
                return (
                  <div
                    key={preset.name}
                    className={`group relative rounded-2xl p-3.5 transition flex flex-col justify-between border ${
                      isLight
                        ? 'bg-white border-gray-200/90 hover:border-rose-300 hover:shadow-md shadow-xs'
                        : 'bg-gray-900/90 border-gray-800 hover:border-rose-500/50 shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl border border-black/10 shadow-xs shrink-0"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-black truncate ${isLight ? 'text-gray-900' : 'text-white'}`} title={preset.name}>
                          {preset.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyHex(preset.hex)}
                          className={`mt-0.5 inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition cursor-pointer ${
                            isLight
                              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              : 'bg-gray-800 hover:bg-gray-750 text-gray-300'
                          }`}
                          title="Click to copy hex code"
                        >
                          <span>{preset.hex.toUpperCase()}</span>
                          {isCopied ? (
                            <Check className="w-2.5 h-2.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 opacity-60" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between pt-2.5 border-t ${
                      isLight ? 'border-gray-100' : 'border-gray-800/80'
                    }`}>
                      <span className={`text-[9px] uppercase font-black ${
                        isLight ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Preset
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteColor(preset.name)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isLight
                            ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-gray-500 hover:text-rose-400 hover:bg-rose-500/10'
                        }`}
                        title={`Delete "${preset.name}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SIZE & DIMENSION PRESETS */}
      {activeTab === 'sizes' && (
        <div className="space-y-6">
          {/* Add New Size Preset Card */}
          <div className={`p-6 rounded-3xl border transition shadow-sm ${
            isLight
              ? 'bg-white border-purple-100 ring-1 ring-purple-100/50'
              : 'bg-gray-950/80 border-purple-500/30 shadow-lg'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                isLight ? 'text-purple-600' : 'text-purple-400'
              }`}>
                <Plus className="w-4 h-4" /> Add New Reusable Size or Dimension Preset
              </h3>
              <span className={`text-[11px] font-bold ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>
                Apparel, Storage, Volume, Weight & Shoes
              </span>
            </div>

            <form onSubmit={handleAddSize} className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="Size or Capacity (e.g. 4XL, 2TB, 250ml, 500g, 42, 10kg, Free Size)"
                  value={newSizeInput}
                  onChange={(e) => setNewSizeInput(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none transition ${
                    isLight
                      ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-purple-500'
                      : 'bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-purple-500'
                  }`}
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
            <div className={`mt-4 pt-4 border-t flex items-center gap-1.5 flex-wrap ${
              isLight ? 'border-gray-100' : 'border-gray-800/80'
            }`}>
              <span className={`text-[10px] font-black uppercase mr-1 ${
                isLight ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Filter by Type:
              </span>
              {[
                { id: 'all', label: 'All Presets' },
                { id: 'apparel', label: '👕 Apparel' },
                { id: 'storage', label: '💾 Digital Storage' },
                { id: 'volume', label: '🧴 Volume & Liquids' },
                { id: 'weight', label: '⚖️ Weight' },
                { id: 'footwear', label: '👟 Footwear' },
              ].map((cat) => {
                const isActive = selectedSizeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedSizeCategory(cat.id as any)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                      isActive
                        ? isLight
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : isLight
                        ? 'bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-200'
                        : 'bg-gray-900 text-gray-400 hover:text-white border-gray-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sizes Chips Grid */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className={`text-xs font-black uppercase tracking-wider ${
                isLight ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Available Sizes & Options ({filteredSizes.length})
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {filteredSizes.map((size) => (
                <div
                  key={size}
                  className={`group inline-flex items-center border rounded-xl text-xs font-bold transition overflow-hidden shadow-xs ${
                    isLight
                      ? 'bg-white hover:bg-purple-50/40 text-gray-800 border-gray-200 hover:border-purple-300'
                      : 'bg-gray-900/90 hover:bg-gray-850 text-gray-200 border-gray-800 hover:border-purple-500/60'
                  }`}
                >
                  <span className="px-3.5 py-2">{size}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSize(size)}
                    className={`p-2 transition cursor-pointer border-l ${
                      isLight
                        ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50 border-gray-100'
                        : 'text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 border-gray-800'
                    }`}
                    title={`Delete "${size}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

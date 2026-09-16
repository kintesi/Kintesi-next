import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Tag, Check, X, FolderTree, Sparkles, Plus, Layers, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { SECTOR_TABS, TaxonomyCategory } from '../../data/sectorTabs';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

interface CategoryTagExplorerProps {
  selectedTags: string[];
  onChangeTags: (tags: string[]) => void;
  currentCategoryId: string;
  onSelectCategory?: (categoryId: string) => void;
  productTitle?: string;
  productDescription?: string;
}

export const CategoryTagExplorer: React.FC<CategoryTagExplorerProps> = ({
  selectedTags,
  onChangeTags,
  currentCategoryId,
  onSelectCategory,
  productTitle,
  productDescription,
}) => {
  const { isLight } = useAdminTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSector, setActiveSector] = useState<string>('all');
  const [customTagInput, setCustomTagInput] = useState('');
  const [aiPasteText, setAiPasteText] = useState('');
  const [showAiPaste, setShowAiPaste] = useState(false);

  // On-demand lazy loaded taxonomy dataset
  const [taxonomyList, setTaxonomyList] = useState<TaxonomyCategory[]>([]);
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(true);

  // Progressive rendering / chunking so the DOM never loads all categories at once
  const [visibleCount, setVisibleCount] = useState(15);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Dynamic Lazy Load of massive taxonomy dataset on mount
  useEffect(() => {
    let isMounted = true;
    import('../../data/taxonomyData')
      .then((mod) => {
        if (isMounted) {
          setTaxonomyList(mod.TAXONOMY_DATA);
          setIsLoadingTaxonomy(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load taxonomy data:', err);
        if (isMounted) setIsLoadingTaxonomy(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Reset visible count when search query or active sector tab changes
  useEffect(() => {
    setVisibleCount(15);
  }, [searchQuery, activeSector]);

  // Handle adding/toggling a tag
  const handleToggleTag = (tag: string) => {
    const clean = tag.trim().toLowerCase();
    if (!clean) return;

    const exists = selectedTags.some((t) => t.toLowerCase() === clean);
    if (exists) {
      onChangeTags(selectedTags.filter((t) => t.toLowerCase() !== clean));
    } else {
      onChangeTags([...selectedTags, tag.trim()]);
    }
  };

  // Add custom manual tag
  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = customTagInput.trim();
    if (!raw) return;

    // Support comma-separated tags
    const items = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newTags = [...selectedTags];
    items.forEach((item) => {
      if (!newTags.some((t) => t.toLowerCase() === item.toLowerCase())) {
        newTags.push(item);
      }
    });

    onChangeTags(newTags);
    setCustomTagInput('');
  };

  // Import bulk keywords from ChatGPT / AI
  const handleImportAiKeywords = () => {
    if (!aiPasteText.trim()) return;
    const rawList = aiPasteText
      .split(/[\n,;•\r]+/)
      .map((k) => k.replace(/^\d+[\.\)]\s*/, '').replace(/^[#\*\-]\s*/, '').trim())
      .filter((k) => k.length > 1 && !k.startsWith('http'));

    const newTags = [...selectedTags];
    rawList.forEach((item) => {
      if (!newTags.some((t) => t.toLowerCase() === item.toLowerCase())) {
        newTags.push(item);
      }
    });

    onChangeTags(newTags);
    setAiPasteText('');
    setShowAiPaste(false);
  };

  // Auto-extract keywords from Product Title and Description
  const handleAutoExtractFromTitle = () => {
    const text = `${productTitle || ''} ${productDescription || ''}`;
    if (!text.trim()) return;
    const stopWords = new Set(['and', 'for', 'with', 'the', 'this', 'that', 'from', 'best', 'new', 'item', 'product', 'free', 'all', 'etc']);
    const words = text
      .toLowerCase()
      .replace(/[^\w\s\u0980-\u09FF-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopWords.has(w));

    const uniqueWords = Array.from(new Set(words)).slice(0, 15);
    const newTags = [...selectedTags];
    uniqueWords.forEach((item) => {
      if (!newTags.some((t) => t.toLowerCase() === item.toLowerCase())) {
        newTags.push(item);
      }
    });
    onChangeTags(newTags);
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    onChangeTags(selectedTags.filter((t) => t !== tagToRemove));
  };

  // Toggle tag expansion for individual category
  const toggleCategoryExpand = (id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter categories and tags based on activeSector and searchQuery
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return taxonomyList.filter((item) => {
      const matchesSector = activeSector === 'all' || item.sector === activeSector;
      if (!matchesSector) return false;

      if (!q) return true;

      const inName = item.name.toLowerCase().includes(q);
      const inBn = item.bnName.toLowerCase().includes(q);
      const inTags = item.tags.some((t) => t.toLowerCase().includes(q));

      return inName || inBn || inTags;
    });
  }, [taxonomyList, searchQuery, activeSector]);

  // Sliced categories for progressive lazy rendering
  const visibleCategories = useMemo(() => {
    return filteredCategories.slice(0, visibleCount);
  }, [filteredCategories, visibleCount]);

  const hasMore = visibleCount < filteredCategories.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 15, filteredCategories.length));
  };

  return (
    <div className={`space-y-3 p-4 rounded-2xl border shadow-xs ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-950/70 border-gray-800/90 text-white'}`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b ${isLight ? 'border-gray-200' : 'border-gray-800'}`}>
        <div>
          <div className="flex items-center gap-2">
            <Tag className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            <h4 className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Search Keywords, Tags & Category Taxonomy Explorer
            </h4>
          </div>
        </div>

        {/* Selected count badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
            🏷️ {selectedTags.length} Tags Selected
          </span>
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => onChangeTags([])}
              className="text-[10px] text-rose-500 hover:text-rose-600 font-bold underline cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Active Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className={`p-3 rounded-xl border space-y-1.5 ${isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-gray-900/90 border-amber-500/20'}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-amber-900' : 'text-amber-400'}`}>
            Active Tags Attached to Product ({selectedTags.length}):
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${
                  isLight
                    ? 'bg-white text-amber-900 border-amber-300 shadow-2xs'
                    : 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                }`}
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-rose-500 transition p-0.5 cursor-pointer"
                  title="Remove tag"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Keywords Bulk Paste & Smart Tools */}
      <div className={`p-3.5 rounded-2xl border transition-all ${
        isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/20 border-amber-500/20'
      }`}>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className={`text-xs font-bold ${isLight ? 'text-gray-900' : 'text-gray-200'}`}>
              AI Chat Keywords & Bulk Import (ChatGPT / Claude / Gemini)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {productTitle && (
              <button
                type="button"
                onClick={handleAutoExtractFromTitle}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Extract from Title</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAiPaste(!showAiPaste)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3 h-3" />
              <span>{showAiPaste ? 'Close Bulk Box' : 'Paste AI Keywords'}</span>
            </button>
          </div>
        </div>

        {showAiPaste && (
          <div className="space-y-2 pt-2 border-t border-amber-200/60 dark:border-amber-500/20">
            <textarea
              rows={3}
              placeholder="Paste ChatGPT / AI keyword list here (separated by comma, line by line, or numbers)... e.g.:&#10;men panjabi, cotton kurta, eid fashion, পাঞ্জাবি, ছেলেদের পোশাক"
              value={aiPasteText}
              onChange={(e) => setAiPasteText(e.target.value)}
              className={`w-full rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500 ${
                isLight
                  ? 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400'
                  : 'bg-gray-900 border border-gray-700 text-white placeholder-gray-500'
              }`}
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                AI চ্যাট থেকে কিওয়ার্ড কপি করে এখানে পেস্ট করলেই অটোমেটিক ক্লিন ট্যাগ তৈরি হবে।
              </span>
              <button
                type="button"
                onClick={handleImportAiKeywords}
                disabled={!aiPasteText.trim()}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Import to Tags
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Tag Input Bar */}
      <form onSubmit={handleAddCustomTag} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Type any custom keyword or tag (press Enter or click + Add)..."
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            className={`w-full rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-amber-500 ${
              isLight
                ? 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-amber-500'
                : 'bg-gray-900 border border-gray-700 text-white placeholder-gray-500'
            }`}
          />
        </div>
        <button
          type="button"
          onClick={() => handleAddCustomTag()}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Tag</span>
        </button>
      </form>

      {/* Instant Search Bar for 100,000 Taxonomy & Categories */}
      <div className="relative">
        <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-400' : 'text-gray-400'}`} />
        <input
          type="text"
          placeholder="🔎 Search 100,000+ keywords & tags (e.g. shaving, pad, condom, boxer, panjabi, smartwatch, শাড়ি, টুথব্রাশ, ট্রিমার)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full rounded-xl pl-10 pr-10 py-2.5 text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 ${
            isLight
              ? 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400'
              : 'bg-gray-900/90 border border-gray-700 text-white placeholder-gray-500'
          }`}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-white'}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sector Quick Filter Pills */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {SECTOR_TABS.map((tab) => {
          const isActive = activeSector === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveSector(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-white font-black shadow-xs'
                  : isLight
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                  : 'bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Category Results with Tag Chips (Progressive / Chunked Rendering) */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 pt-2">
        {isLoadingTaxonomy ? (
          <div className="p-8 text-center bg-gray-900/40 rounded-xl border border-dashed border-gray-800 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
            <span className="text-xs text-gray-300 font-semibold">
              Loading categories & keywords...
            </span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-6 text-center bg-gray-900/40 rounded-xl border border-dashed border-gray-800">
            <p className="text-xs text-gray-400">
              No categories or tags found matching "{searchQuery}"
            </p>
          </div>
        ) : (
          <>
            {visibleCategories.map((cat) => {
              const isCurrentCategory = currentCategoryId === cat.suggestedCategoryId;
              const isExpanded = Boolean(expandedCategories[cat.id]);
              const displayedTags = isExpanded ? cat.tags : cat.tags.slice(0, 10);

              return (
                <div
                  key={cat.id}
                  className={`p-3 rounded-xl border transition space-y-2 ${
                    isLight
                      ? 'bg-slate-50/70 hover:bg-white border-gray-200'
                      : 'bg-gray-900/70 hover:bg-gray-900 border-gray-800'
                  }`}
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FolderTree className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'} shrink-0`} />
                      <div>
                        <span className={`text-xs font-bold ${isLight ? 'text-gray-900' : 'text-gray-200'}`}>{cat.name}</span>
                        <span className={`text-[11px] ml-1.5 font-medium ${isLight ? 'text-amber-700' : 'text-amber-400/90'}`}>({cat.bnName})</span>
                      </div>
                    </div>

                    {/* Option to set as Product Category */}
                    {onSelectCategory && (
                      <button
                        type="button"
                        onClick={() => onSelectCategory(cat.suggestedCategoryId)}
                        className={`text-[9px] px-2 py-0.5 rounded-lg border font-bold transition flex items-center gap-1 cursor-pointer ${
                          isCurrentCategory
                            ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/40'
                            : isLight
                            ? 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border-gray-700'
                        }`}
                        title="Set as product's primary category"
                      >
                        {isCurrentCategory ? (
                          <>
                            <Check className="w-2.5 h-2.5" />
                            <span>Current Category</span>
                          </>
                        ) : (
                          <>
                            <Layers className="w-2.5 h-2.5" />
                            <span>Set Category</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Subcategory & Tag Chips */}
                  <div className="flex flex-wrap gap-1.5 pl-5">
                    {displayedTags.map((tag) => {
                      const isSelected = selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase());

                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => handleToggleTag(tag)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-xs'
                              : isLight
                              ? 'bg-white hover:bg-amber-50 text-gray-700 hover:text-gray-900 border-gray-200 hover:border-amber-300'
                              : 'bg-gray-950 hover:bg-gray-800 text-gray-300 hover:text-white border-gray-800'
                          }`}
                        >
                          {isSelected ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5 text-gray-400" />}
                          <span>{tag}</span>
                        </button>
                      );
                    })}

                    {cat.tags.length > 10 && (
                      <button
                        type="button"
                        onClick={() => toggleCategoryExpand(cat.id)}
                        className="text-[10px] px-2 py-0.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-bold transition flex items-center gap-0.5 cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            <span>Show Less</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            <span>+{cat.tags.length - 10} More Tags</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Progressive Load More Controls */}
            {hasMore && (
              <div className="pt-2 pb-1 text-center space-y-1">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/60 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                >
                  <span>আরও ১৫টি ক্যাটাগরি লোড করুন (অবশিষ্ট {filteredCategories.length - visibleCount}টি)</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <p className="text-[10px] text-gray-500">
                  Showing {visibleCategories.length} of {filteredCategories.length} categories (ধাপে ধাপে লোড হচ্ছে যাতে ব্রাউজার মেমোরি হালকা থাকে)
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

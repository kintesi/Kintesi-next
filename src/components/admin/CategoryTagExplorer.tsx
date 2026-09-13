import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Tag, Check, X, FolderTree, Sparkles, Plus, Layers, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { SECTOR_TABS, TaxonomyCategory } from '../../data/sectorTabs';

interface CategoryTagExplorerProps {
  selectedTags: string[];
  onChangeTags: (tags: string[]) => void;
  currentCategoryId: string;
  onSelectCategory?: (categoryId: string) => void;
}

export const CategoryTagExplorer: React.FC<CategoryTagExplorerProps> = ({
  selectedTags,
  onChangeTags,
  currentCategoryId,
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSector, setActiveSector] = useState<string>('all');
  const [customTagInput, setCustomTagInput] = useState('');

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
    <div className="space-y-3 bg-gray-950/70 p-4 rounded-2xl border border-gray-800/90 shadow-inner">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Search Keywords, Tags & Category Taxonomy Explorer
            </h4>
          </div>
        </div>

        {/* Selected count badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold">
            🏷️ {selectedTags.length} Tags Selected
          </span>
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => onChangeTags([])}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Active Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="p-3 bg-gray-900/90 rounded-xl border border-amber-500/20 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            Active Tags Attached to Product ({selectedTags.length}):
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 text-amber-200 border border-amber-500/40 rounded-lg text-xs font-semibold"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-rose-300 transition p-0.5"
                  title="Remove tag"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Manual Tag Input Bar */}
      <form onSubmit={handleAddCustomTag} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Type any custom keyword or tag (press Enter or click + Add)..."
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>
        <button
          type="button"
          onClick={() => handleAddCustomTag()}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Tag</span>
        </button>
      </form>

      {/* Instant Search Bar for 100,000 Taxonomy & Categories */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="🔎 Search 100,000+ keywords & tags (e.g. shaving, pad, condom, boxer, panjabi, smartwatch, শাড়ি, টুথব্রাশ, ট্রিমার)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-900/90 border border-gray-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
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
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                isActive
                  ? 'bg-amber-500 text-gray-950 font-black shadow-xs'
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
                  className="p-3 bg-gray-900/70 hover:bg-gray-900 rounded-xl border border-gray-800 transition space-y-2"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FolderTree className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-gray-200">{cat.name}</span>
                        <span className="text-[11px] text-amber-400/90 ml-1.5 font-medium">({cat.bnName})</span>
                      </div>
                    </div>

                    {/* Option to set as Product Category */}
                    {onSelectCategory && (
                      <button
                        type="button"
                        onClick={() => onSelectCategory(cat.suggestedCategoryId)}
                        className={`text-[9px] px-2 py-0.5 rounded-lg border font-bold transition flex items-center gap-1 ${
                          isCurrentCategory
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
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
                              : 'bg-gray-950 hover:bg-gray-800 text-gray-300 hover:text-white border-gray-800'
                          }`}
                        >
                          {isSelected ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5 text-gray-500" />}
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

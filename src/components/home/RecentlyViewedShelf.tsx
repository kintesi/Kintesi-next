import React, { useState, useEffect, useMemo } from 'react';
import { History, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { ProductCard } from '../common/ProductCard';
import { getRecentlyViewedProducts, getUserInterestProfile, saveUserInterestProfile } from '../../lib/recommendationEngine';

interface RecentlyViewedShelfProps {
  products: Product[];
  title?: string;
  subtitle?: string;
}

export const RecentlyViewedShelf: React.FC<RecentlyViewedShelfProps> = ({
  products,
  title = 'সম্প্রতি দেখেছেন',
  subtitle = 'আপনার পূর্বে দেখা পণ্যগুলো সহজে আবার খুঁজে নিন',
}) => {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setVersion((v) => v + 1);
    window.addEventListener('kintesi_intent_updated', handleUpdate);
    return () => window.removeEventListener('kintesi_intent_updated', handleUpdate);
  }, []);

  const recentlyViewed = useMemo(() => {
    return getRecentlyViewedProducts(products, 10);
  }, [products, version]);

  const handleClearHistory = () => {
    const profile = getUserInterestProfile();
    profile.viewedProductIds = [];
    saveUserInterestProfile(profile);
    setVersion((v) => v + 1);
  };

  if (recentlyViewed.length === 0) return null;

  return (
    <section className="my-6 md:my-10">
      <div className="bg-white border border-gray-200/80 rounded-2xl md:rounded-3xl p-4 sm:p-6 shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 flex-shrink-0">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg md:text-xl font-black text-gray-900 tracking-tight truncate">
                {title}
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleClearHistory}
              title="ইতিহাস মুছুন"
              className="text-[11px] font-semibold text-gray-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">ইতিহাস মুছুন</span>
            </button>
            <Link
              to="/shop"
              className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            >
              <span>দোকান</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Horizontal scrollable row */}
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {recentlyViewed.map((prod) => (
            <div
              key={`recent-${prod.id}`}
              className="w-[155px] sm:w-[190px] md:w-[210px] flex-shrink-0 snap-start"
            >
              <ProductCard product={prod} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

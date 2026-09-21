import React, { useMemo } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { ProductCard } from '../common/ProductCard';
import { getRelatedProducts } from '../../lib/recommendationEngine';

interface RelatedProductsShelfProps {
  currentProduct: Product;
  allProducts: Product[];
  title?: string;
  subtitle?: string;
}

export const RelatedProductsShelf: React.FC<RelatedProductsShelfProps> = ({
  currentProduct,
  allProducts,
  title = 'সম্পর্কিত অন্যান্য পণ্য',
  subtitle = 'এই পণ্যের সাথে মিলিয়ে ক্রেতারা আরও যা দেখছেন',
}) => {
  const relatedItems = useMemo(() => {
    return getRelatedProducts(currentProduct, allProducts, 10);
  }, [currentProduct, allProducts]);

  if (relatedItems.length === 0) return null;

  return (
    <section className="my-8 md:my-14 border-t border-gray-100 pt-8">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-black text-gray-950 tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <Link
          to={`/shop?category=${currentProduct.category_id || 'all'}`}
          className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 px-3 py-1.5 rounded-xl transition"
        >
          <span>আরও দেখুন</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible pb-3 sm:pb-0 scrollbar-none snap-x snap-mandatory">
        {relatedItems.map((prod) => (
          <div
            key={`rel-${prod.id}`}
            className="w-[160px] sm:w-auto flex-shrink-0 snap-start"
          >
            <ProductCard product={prod} />
          </div>
        ))}
      </div>
    </section>
  );
};

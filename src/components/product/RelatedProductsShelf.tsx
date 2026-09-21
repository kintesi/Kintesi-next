import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
  title = 'Similar Products',
  subtitle = 'More items frequently explored in this category',
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const relatedItems = useMemo(() => {
    return getRelatedProducts(currentProduct, allProducts, 12);
  }, [currentProduct, allProducts]);

  const scrollLeft = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScroll - 15) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: 220, behavior: 'smooth' });
      }
    }
  }, []);

  // Auto-scroll loop for mobile/carousel
  useEffect(() => {
    if (isPaused || relatedItems.length <= 1) return;

    const timer = setInterval(() => {
      const container = scrollRef.current;
      if (!container) return;

      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) return;

      if (container.scrollLeft >= maxScroll - 15) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const step = container.clientWidth > 640 ? 220 : 170;
        container.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 3200);

    return () => clearInterval(timer);
  }, [isPaused, relatedItems.length]);

  if (relatedItems.length === 0) return null;

  return (
    <section 
      className="my-8 md:my-14 border-t border-gray-100 pt-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
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

        <div className="flex items-center gap-2">
          {relatedItems.length > 2 && (
            <div className="flex sm:hidden items-center gap-1">
              <button
                type="button"
                onClick={scrollLeft}
                aria-label="Scroll left"
                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                aria-label="Scroll right"
                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <Link
            to={`/shop?category=${currentProduct.category_id || 'all'}`}
            className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 px-3 py-1.5 rounded-xl transition"
          >
            <span>View More</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div 
        ref={scrollRef}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory scroll-smooth"
      >
        {relatedItems.map((prod) => (
          <div
            key={`rel-${prod.id}`}
            className="w-[155px] sm:w-[190px] md:w-[210px] flex-shrink-0 snap-start"
          >
            <ProductCard product={prod} />
          </div>
        ))}
      </div>
    </section>
  );
};

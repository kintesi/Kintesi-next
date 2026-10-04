import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Smartphone,
  Shirt,
  Sparkles,
  Watch,
  Headphones,
  Home,
  HeartPulse,
  UtensilsCrossed,
  LayoutGrid,
} from 'lucide-react';
import { Category } from '../../types';

interface ExploreCategoryRowProps {
  categories?: Category[];
}

interface VisualCategoryItem {
  id: string;
  name: string;
  itemCount: string;
  slug: string;
  icon: React.ComponentType<{ className?: string }>;
  bgGradient: string;
  iconColor: string;
}

const DEFAULT_VISUAL_CATEGORIES: VisualCategoryItem[] = [
  {
    id: 'gadgets',
    name: 'Gadgets',
    itemCount: '1,420 items',
    slug: 'electronics-gadgets',
    icon: Smartphone,
    bgGradient: 'from-blue-50 to-indigo-50 border-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'women-fashion',
    name: 'Women Fashion',
    itemCount: '850 items',
    slug: 'womens-fashion',
    icon: Sparkles,
    bgGradient: 'from-pink-50 to-rose-50 border-pink-100',
    iconColor: 'text-pink-600',
  },
  {
    id: 'men-apparel',
    name: 'Men Apparel',
    itemCount: '610 items',
    slug: 'mens-fashion',
    icon: Shirt,
    bgGradient: 'from-sky-50 to-cyan-50 border-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    id: 'timepieces',
    name: 'Timepieces',
    itemCount: '410 items',
    slug: 'watches',
    icon: Watch,
    bgGradient: 'from-amber-50 to-yellow-50 border-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    id: 'audio-gear',
    name: 'Audio Gear',
    itemCount: '410 items',
    slug: 'audio-headphones',
    icon: Headphones,
    bgGradient: 'from-purple-50 to-violet-50 border-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'home-living',
    name: 'Home Living',
    itemCount: '980 items',
    slug: 'home-kitchen',
    icon: Home,
    bgGradient: 'from-orange-50 to-amber-50 border-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    id: 'health-care',
    name: 'Health & Care',
    itemCount: '720 items',
    slug: 'health-beauty',
    icon: HeartPulse,
    bgGradient: 'from-emerald-50 to-teal-50 border-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'kitchenware',
    name: 'Kitchenware',
    itemCount: '540 items',
    slug: 'cookware-tableware',
    icon: UtensilsCrossed,
    bgGradient: 'from-rose-50 to-red-50 border-rose-100',
    iconColor: 'text-rose-600',
  },
];

export const ExploreCategoryRow: React.FC<ExploreCategoryRowProps> = () => {
  return (
    <section className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-2">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <LayoutGrid className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-gray-950 tracking-tight">
            Explore By Category
          </h2>
        </div>

        <Link
          to="/shop"
          className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition group"
        >
          <span>All Categories</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Circular Grid / Carousel */}
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-4">
        {DEFAULT_VISUAL_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-gray-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-lg hover:border-rose-200 transition-all duration-300"
            >
              {/* Circular Icon Container */}
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${cat.bgGradient} border flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 shadow-2xs`}
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${cat.iconColor}`} />
              </div>

              {/* Title & Count */}
              <span className="text-xs font-bold text-gray-900 group-hover:text-rose-600 transition truncate max-w-full">
                {cat.name}
              </span>
              <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                {cat.itemCount}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

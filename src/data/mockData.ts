import { Category, Product } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-groceries',
    name: 'Groceries & Daily Essentials',
    slug: 'groceries-daily-essentials',
    description: 'Rice, organic oils, spices, breakfast cereals, snacks & daily pantry',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop',
    icon: 'ShoppingBag',
  },
  {
    id: 'cat-beauty',
    name: 'Beauty, Skincare & Personal Care',
    slug: 'beauty-skincare',
    description: 'Dermatologist cleansers, serums, sunscreens, hair care & fragrances',
    image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop',
    icon: 'Sparkles',
  },
  {
    id: 'cat-home-kitchen',
    name: 'Home, Kitchen & Appliances',
    slug: 'home-kitchen',
    description: 'Air fryers, blenders, cookware, smart vacuums & home decor',
    image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800&auto=format&fit=crop',
    icon: 'Home',
  },
  {
    id: 'cat-mens-fashion',
    name: "Men's Fashion & Apparel",
    slug: 'mens-fashion',
    description: 'Leather jackets, cotton hoodies, polo shirts, suits & streetwear',
    image_url: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?q=80&w=800&auto=format&fit=crop',
    icon: 'Shirt',
  },
  {
    id: 'cat-womens-fashion',
    name: "Women's Fashion & Luxury",
    slug: 'womens-fashion',
    description: 'Designer dresses, luxury handbags, premium tops & jewelry',
    image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop',
    icon: 'Sparkles',
  },
  {
    id: 'cat-footwear',
    name: 'Footwear & Sneakers',
    slug: 'footwear-sneakers',
    description: 'Running shoes, Nike Jordans, leather boots & casual loafers',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop',
    icon: 'Footprints',
  },
  {
    id: 'cat-smartphones',
    name: 'Smartphones & Tablets',
    slug: 'smartphones-tablets',
    description: 'Flagship iPhones, Samsung Galaxy, iPads & accessories',
    image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop',
    icon: 'Smartphone',
  },
  {
    id: 'cat-laptops',
    name: 'Laptops & Computers',
    slug: 'laptops-computers',
    description: 'MacBooks, gaming rigs, monitors & workstation gear',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop',
    icon: 'Laptop',
  },
  {
    id: 'cat-audio',
    name: 'Audio & Headphones',
    slug: 'audio-headphones',
    description: 'Noise cancelling headphones, wireless earbuds & soundbars',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
    icon: 'Headphones',
  },
  {
    id: 'cat-watches',
    name: 'Smart Watches & Fitness',
    slug: 'smart-watches',
    description: 'Apple Watch, Garmin fitness trackers & luxury straps',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
    icon: 'Watch',
  },
  {
    id: 'cat-health-baby',
    name: 'Health & Baby Care',
    slug: 'health-baby-care',
    description: 'Baby diapers, organic baby foods, vitamins & wellness',
    image_url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=800&auto=format&fit=crop',
    icon: 'HeartPulse',
  },
  {
    id: 'cat-sports',
    name: 'Sports & Fitness Equipment',
    slug: 'sports-fitness',
    description: 'Gym dumbbells, yoga mats, resistance bands & active gear',
    image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop',
    icon: 'Dumbbell',
  }
];

// All fake / mock products cleared - Only live products added via Admin Panel will be shown
export const INITIAL_PRODUCTS: Product[] = [];

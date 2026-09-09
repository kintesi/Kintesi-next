import { Category, Product } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-groceries',
    name: 'Groceries & Daily Essentials',
    slug: 'groceries-daily-essentials',
    description: 'Rice, organic oils, spices, breakfast cereals, snacks & daily pantry',
    image_url: '',
    icon: 'ShoppingBag',
  },
  {
    id: 'cat-beauty',
    name: 'Beauty, Skincare & Personal Care',
    slug: 'beauty-skincare',
    description: 'Dermatologist cleansers, serums, sunscreens, hair care & fragrances',
    image_url: '',
    icon: 'Sparkles',
  },
  {
    id: 'cat-home-kitchen',
    name: 'Home, Kitchen & Appliances',
    slug: 'home-kitchen',
    description: 'Air fryers, blenders, cookware, smart vacuums & home decor',
    image_url: '',
    icon: 'Home',
  },
  {
    id: 'cat-mens-fashion',
    name: "Men's Fashion & Apparel",
    slug: 'mens-fashion',
    description: 'Leather jackets, cotton hoodies, polo shirts, suits & streetwear',
    image_url: '',
    icon: 'Shirt',
  },
  {
    id: 'cat-womens-fashion',
    name: "Women's Fashion & Luxury",
    slug: 'womens-fashion',
    description: 'Designer dresses, luxury handbags, premium tops & jewelry',
    image_url: '',
    icon: 'Sparkles',
  },
  {
    id: 'cat-footwear',
    name: 'Footwear & Sneakers',
    slug: 'footwear-sneakers',
    description: 'Running shoes, Nike Jordans, leather boots & casual loafers',
    image_url: '',
    icon: 'Footprints',
  },
  {
    id: 'cat-smartphones',
    name: 'Smartphones & Tablets',
    slug: 'smartphones-tablets',
    description: 'Flagship iPhones, Samsung Galaxy, iPads & accessories',
    image_url: '',
    icon: 'Smartphone',
  },
  {
    id: 'cat-laptops',
    name: 'Laptops & Computers',
    slug: 'laptops-computers',
    description: 'MacBooks, gaming rigs, monitors & workstation gear',
    image_url: '',
    icon: 'Laptop',
  },
  {
    id: 'cat-audio',
    name: 'Audio & Headphones',
    slug: 'audio-headphones',
    description: 'Noise cancelling headphones, wireless earbuds & soundbars',
    image_url: '',
    icon: 'Headphones',
  },
  {
    id: 'cat-watches',
    name: 'Smart Watches & Fitness',
    slug: 'smart-watches',
    description: 'Apple Watch, Garmin fitness trackers & luxury straps',
    image_url: '',
    icon: 'Watch',
  },
  {
    id: 'cat-health-baby',
    name: 'Health & Baby Care',
    slug: 'health-baby-care',
    description: 'Baby diapers, organic baby foods, vitamins & wellness',
    image_url: '',
    icon: 'HeartPulse',
  },
  {
    id: 'cat-sports',
    name: 'Sports & Fitness Equipment',
    slug: 'sports-fitness',
    description: 'Gym dumbbells, yoga mats, resistance bands & active gear',
    image_url: '',
    icon: 'Dumbbell',
  }
];

// All fake / mock products cleared - Only live products added via Admin Panel will be shown
export const INITIAL_PRODUCTS: Product[] = [];

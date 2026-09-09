import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gcoxccaaayevlrpshykx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjb3hjY2FhYXlldmxycHNoeWt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzc2NDc5OSwiZXhwIjoyMTAzMzQwNzk5fQ.sDMDPbXZ1waxNe5gJwS7KA9SCtXoAtFcUDwPnNR8ln0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CATEGORIES = [
  {
    name: 'Smartphones & Tablets',
    slug: 'smartphones-tablets',
    description: 'Latest flagship smartphones, tablets and accessories',
    image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop',
    icon: 'Smartphone',
  },
  {
    name: 'Laptops & Computers',
    slug: 'laptops-computers',
    description: 'High performance gaming & workstation laptops',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop',
    icon: 'Laptop',
  },
  {
    name: 'Audio & Headphones',
    slug: 'audio-headphones',
    description: 'Noise cancelling wireless headphones & earbuds',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
    icon: 'Headphones',
  },
  {
    name: 'Smart Watches',
    slug: 'smart-watches',
    description: 'Fitness trackers, AMOLED smartwatches & luxury straps',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
    icon: 'Watch',
  },
  {
    name: 'Gaming & Accessories',
    slug: 'gaming-accessories',
    description: 'Mechanical keyboards, RGB mice & gaming headsets',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
    icon: 'Gamepad2',
  },
  {
    name: 'Cameras & Drones',
    slug: 'cameras-drones',
    description: '4K cinema cameras, action cams and aerial quadcopters',
    image_url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=800&auto=format&fit=crop',
    icon: 'Camera',
  },
];

const PRODUCTS = [
  {
    title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    slug: 'sony-wh-1000xm5-wireless-headphones',
    description: 'Industry-leading noise cancellation with two processors and 8 microphones. Ultra-comfortable lightweight design with soft fit leather. Up to 30-hour battery life with quick charging (3 min charge for 3 hours of playback). Crystal clear hands-free calling with 4 beamforming microphones.',
    price: 42000,
    discount_price: 36500,
    category_id: 'audio-headphones',
    stock: 15,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1000&auto=format&fit=crop',
    ],
    rating: 4.9,
    review_count: 128,
    is_featured: true,
    is_trending: true,
    brand: 'Sony',
    tags: ['wireless', 'anc', 'bluetooth', 'premium audio'],
  },
  {
    title: 'Apple iPhone 15 Pro Max 256GB - Natural Titanium',
    slug: 'apple-iphone-15-pro-max-256gb',
    description: 'Forged in titanium with industry-leading A17 Pro chip. 6.7-inch Super Retina XDR display with ProMotion 120Hz. Powerful 48MP main camera system with 5x optical zoom telephoto lens. USB-C with USB 3 speeds.',
    price: 175000,
    discount_price: 162000,
    category_id: 'smartphones-tablets',
    stock: 8,
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=1000&auto=format&fit=crop',
    ],
    rating: 5.0,
    review_count: 84,
    is_featured: true,
    is_trending: true,
    brand: 'Apple',
    tags: ['flagship', 'smartphone', 'ios', 'titanium'],
  },
  {
    title: 'MacBook Pro 16" M3 Max (36GB Unified Memory, 1TB SSD)',
    slug: 'macbook-pro-16-m3-max',
    description: 'Extreme workstation performance with the 16-core CPU and 40-core GPU M3 Max chip. Liquid Retina XDR display with 1600 nits peak brightness. Up to 22 hours of battery life and studio-quality 6-speaker sound system.',
    price: 385000,
    discount_price: 360000,
    category_id: 'laptops-computers',
    stock: 5,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=1000&auto=format&fit=crop',
    ],
    rating: 4.9,
    review_count: 42,
    is_featured: true,
    is_trending: false,
    brand: 'Apple',
    tags: ['laptop', 'macbook', 'm3 max', 'pro work'],
  },
  {
    title: 'Apple Watch Ultra 2 Titanium Case with Ocean Band',
    slug: 'apple-watch-ultra-2-titanium',
    description: 'The most rugged and capable Apple Watch. 49mm aerospace-grade titanium case, precision dual-frequency GPS, up to 36 hours battery life, and 3000 nits brightest display.',
    price: 98000,
    discount_price: 89900,
    category_id: 'smart-watches',
    stock: 12,
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop',
    ],
    rating: 4.8,
    review_count: 59,
    is_featured: true,
    is_trending: true,
    brand: 'Apple',
    tags: ['smartwatch', 'fitness', 'gps', 'waterproof'],
  },
  {
    title: 'Keychron Q1 Pro Wireless Custom Mechanical Keyboard',
    slug: 'keychron-q1-pro-wireless-keyboard',
    description: 'Full aluminum CNC machined 75% layout custom keyboard with hot-swappable switches, double-gasket mount design, QMK/VIA programmable, and south-facing RGB backlight.',
    price: 24500,
    discount_price: 21000,
    category_id: 'gaming-accessories',
    stock: 20,
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=1000&auto=format&fit=crop',
    ],
    rating: 4.9,
    review_count: 94,
    is_featured: false,
    is_trending: true,
    brand: 'Keychron',
    tags: ['mechanical keyboard', 'rgb', 'custom', 'wireless'],
  },
  {
    title: 'DJI Mini 4 Pro 4K Drone Fly More Combo Plus',
    slug: 'dji-mini-4-pro-drone-combo',
    description: 'Under 249g lightweight folding drone with omnidirectional obstacle sensing, 4K/60fps HDR True Vertical shooting, 20km FHD video transmission, and up to 45 mins flight time with Plus batteries.',
    price: 135000,
    discount_price: 124000,
    category_id: 'cameras-drones',
    stock: 7,
    images: [
      'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?q=80&w=1000&auto=format&fit=crop',
    ],
    rating: 4.9,
    review_count: 38,
    is_featured: true,
    is_trending: true,
    brand: 'DJI',
    tags: ['drone', '4k', 'aerial photography', 'gimbal'],
  },
  {
    title: 'Logitech MX Master 3S Wireless Performance Mouse',
    slug: 'logitech-mx-master-3s',
    description: 'Quiet clicks and 8K DPI any-surface tracking, MagSpeed electromagnetic scrolling, ergonomic sculpted shape with thumb controls and multi-device Flow cross-computer control.',
    price: 12500,
    discount_price: 10800,
    category_id: 'gaming-accessories',
    stock: 25,
    images: [
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=1000&auto=format&fit=crop',
    ],
    rating: 4.8,
    review_count: 215,
    is_featured: false,
    is_trending: true,
    brand: 'Logitech',
    tags: ['productivity', 'mouse', 'bluetooth', 'ergonomic'],
  },
  {
    title: 'Samsung Galaxy S24 Ultra 5G (12GB RAM, 512GB Storage)',
    slug: 'samsung-galaxy-s24-ultra-5g',
    description: 'Galaxy AI is here. Titanium frame with flat 6.8-inch Dynamic AMOLED 2X 2600 nits display. 200MP camera with Quad Telephoto system and built-in S Pen.',
    price: 165000,
    discount_price: 154000,
    category_id: 'smartphones-tablets',
    stock: 10,
    images: [
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=1000&auto=format&fit=crop',
    ],
    rating: 4.9,
    review_count: 67,
    is_featured: true,
    is_trending: true,
    brand: 'Samsung',
    tags: ['samsung', 'galaxy ai', '5g', 'spen'],
  }
];

async function seed() {
  console.log('🚀 Checking Supabase database tables...');

  // Test categories table
  const { data: catTest, error: catError } = await supabase.from('categories').select('*').limit(1);
  if (catError) {
    console.log('⚠️ Categories table not found or error:', catError.message);
    console.log('💡 Note: Please run `supabase_schema.sql` in your Supabase SQL Editor if tables are not yet created.');
    return;
  }

  console.log('✅ Categories table accessible. Seeding categories...');
  for (const cat of CATEGORIES) {
    const { error } = await supabase.from('categories').upsert(cat, { onConflict: 'slug' });
    if (error) console.error('Error inserting category:', cat.slug, error.message);
  }

  console.log('✅ Seeding products...');
  for (const prod of PRODUCTS) {
    const { error } = await supabase.from('products').upsert(prod, { onConflict: 'slug' });
    if (error) console.error('Error inserting product:', prod.slug, error.message);
  }

  console.log('🎉 Database seeding complete!');
}

seed().catch(console.error);

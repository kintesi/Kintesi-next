export interface TaxonomyCategory {
  id: string;
  name: string;
  bnName: string;
  sector: 'gadgets' | 'fashion_men' | 'fashion_women' | 'groceries' | 'beauty' | 'home' | 'kids' | 'sports' | 'general';
  suggestedCategoryId: string;
  tags: string[];
}

export const SECTOR_TABS = [
  { id: 'all', label: '🌐 All Categories (সকল ক্যাটাগরি)' },
  { id: 'gadgets', label: '⚡ Gadgets & Tech (গ্যাজেট)' },
  { id: 'fashion_men', label: "👔 Men's Fashion (পুরুষদের পোশাক)" },
  { id: 'fashion_women', label: "👗 Women's Fashion (নারীদের ফ্যাশন)" },
  { id: 'groceries', label: '🍃 Groceries & Food (খাবার ও মুদি)' },
  { id: 'beauty', label: '✨ Beauty & Cosmetics (প্রসাধন)' },
  { id: 'home', label: '🏠 Home & Kitchen (গৃহস্থালি)' },
  { id: 'kids', label: '👶 Baby & Kids (বাচ্চাদের পণ্য)' },
  { id: 'sports', label: '⚽ Sports & Fitness (খেলাধুলা)' },
] as const;

export const TAXONOMY_DATA: TaxonomyCategory[] = [
  // ==========================================
  // GADGETS & ELECTRONICS
  // ==========================================
  {
    id: 'tws-earbuds',
    name: 'TWS & Wireless Earbuds',
    bnName: 'ওয়্যারলেস ইয়ারবাডস ও হেডফোন',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['tws', 'earbuds', 'wireless earbuds', 'bluetooth earbuds', 'anc earbuds', 'gaming earbuds', 'ইয়ারবাড', 'হেডফোন', 'bass', 'noise cancelling']
  },
  {
    id: 'smartwatches',
    name: 'Smartwatches & Fitness Bands',
    bnName: 'স্মার্টওয়াচ ও ফিটনেস ট্র্যাকার',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['smartwatch', 'fitness tracker', 'calling watch', 'amoled smartwatch', 'smart band', 'স্মার্টওয়াচ', 'ঘড়ি', 'bluetooth calling', 'heart rate', 'waterproof watch']
  },
  {
    id: 'smartphones',
    name: 'Smartphones & Mobile Phones',
    bnName: 'স্মার্টফোন ও মোবাইল',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['smartphone', 'mobile', 'android phone', 'iphone', '5g phone', 'gaming phone', 'স্মার্টফোন', 'মোবাইল', 'dual sim', 'camera phone', 'flagship']
  },
  {
    id: 'powerbanks',
    name: 'Power Banks & Fast Chargers',
    bnName: 'পাওয়ার ব্যাংক ও চার্জার',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['power bank', 'fast charger', 'gan charger', 'type-c charger', '20000mah', 'quick charge', 'পাওয়ার ব্যাংক', 'চার্জার', 'wireless charger', 'cable', 'fast charging']
  },
  {
    id: 'charging-cables',
    name: 'Cables & Converters',
    bnName: 'ক্যাবল ও কনভার্টার',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['type-c cable', 'lightning cable', 'usb cable', 'hdmi cable', 'otg', 'braided cable', 'চার্জিং ক্যাবল', 'কনভার্টার', 'fast cable', '65w cable']
  },
  {
    id: 'bluetooth-speakers',
    name: 'Bluetooth Speakers & Soundbars',
    bnName: 'ব্লুটুথ স্পিকার ও সাউন্ডবার',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['bluetooth speaker', 'soundbar', 'portable speaker', 'bass speaker', 'waterproof speaker', 'স্পিকার', 'সাউন্ডবক্স', 'party speaker', 'wireless speaker']
  },
  {
    id: 'gaming-accessories',
    name: 'Gaming Gear & Accessories',
    bnName: 'গেমিং গিয়ার ও এক্সেসরিজ',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['gaming mouse', 'mechanical keyboard', 'rgb keyboard', 'gaming headset', 'mousepad', 'গেমিং মাউস', 'কিবোর্ড', 'controller', 'gamepad']
  },
  {
    id: 'computer-laptops',
    name: 'Laptops & Ultrabooks',
    bnName: 'ল্যাপটপ ও আল্ট্রাবুক',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['laptop', 'ultrabook', 'gaming laptop', 'macbook', 'ssd laptop', 'ল্যাপটপ', 'notebook', 'workstation', 'core i5', 'core i7', 'ryzen']
  },
  {
    id: 'phone-covers',
    name: 'Phone Cases & Screen Protectors',
    bnName: 'মোবাইল ব্যাককভার ও গ্লাস',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['phone case', 'back cover', 'tempered glass', 'screen protector', 'silicone case', 'ব্যাককভার', 'মোবাইল কভার', 'camera protector', 'matte glass']
  },
  {
    id: 'cameras-gimbals',
    name: 'Cameras, Drones & Gimbals',
    bnName: 'ক্যামেরা, ড্রোন ও গিম্বল',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['action camera', 'gimbal', 'vlogging camera', 'drone', 'tripod', 'ring light', 'ক্যামেরা', 'গিম্বল', 'vlog setup', 'microphone', 'wireless mic']
  },

  // ==========================================
  // MEN'S FASHION & APPAREL
  // ==========================================
  {
    id: 'panjabi-pajama',
    name: "Men's Panjabi & Pajama Sets",
    bnName: 'পাঞ্জাবি ও পায়জামা',
    sector: 'fashion_men',
    suggestedCategoryId: 'mens-fashion',
    tags: ['panjabi', 'punjabi', 'পাঞ্জাবি', 'eid panjabi', 'cotton panjabi', 'semiformal panjabi', 'kabli set', 'পায়জামা', 'pajama', 'embroidered panjabi', 'designer panjabi']
  },
  {
    id: 'polo-tshirts',
    name: 'Polo Shirts & Collared T-Shirts',
    bnName: 'পোলো শার্ট ও টি-শার্ট',
    sector: 'fashion_men',
    suggestedCategoryId: 'mens-fashion',
    tags: ['polo shirt', 'polo', 'পোলো শার্ট', 'cotton polo', 'solid polo', 'premium polo', 'slim fit polo', 'casual polo', 'collar t-shirt']
  },
  {
    id: 'casual-tshirts',
    name: 'Crewneck & Graphic T-Shirts',
    bnName: 'ক্যাজুয়াল টি-শার্ট',
    sector: 'fashion_men',
    suggestedCategoryId: 'mens-fashion',
    tags: ['t-shirt', 'tshirt', 'টি-শার্ট', 'graphic tee', 'oversized tshirt', 'cotton tshirt', 'drop shoulder', 'printed tshirt', 'basic tee', 'streetwear']
  },
  {
    id: 'formal-casual-shirts',
    name: 'Casual & Formal Shirts',
    bnName: 'ক্যাজুয়াল ও ফরমাল শার্ট',
    sector: 'fashion_men',
    suggestedCategoryId: 'mens-fashion',
    tags: ['shirt', 'formal shirt', 'casual shirt', 'শার্ট', 'linen shirt', 'denim shirt', 'cotton shirt', 'check shirt', 'oxford shirt', 'full sleeve shirt']
  },
  {
    id: 'denim-jeans',
    name: 'Denim Jeans & Chino Pants',
    bnName: 'জিন্স প্যান্ট ও চিনো',
    sector: 'fashion_men',
    suggestedCategoryId: 'mens-fashion',
    tags: ['jeans', 'denim jeans', 'জিন্স', 'chino pants', 'slim fit jeans', 'stretchable jeans', 'formal pant', 'trouser', 'cargo pants', 'প্যান্ট']
  },
  {
    id: 'jackets-hoodies',
    name: 'Hoodies, Jackets & Winter Wear',
    bnName: 'হুডি, জ্যাকেট ও শীতের পোশাক',
    sector: 'fashion_men',
    suggestedCategoryId: 'mens-fashion',
    tags: ['hoodie', 'jacket', 'হুডি', 'জ্যাকেট', 'bomber jacket', 'denim jacket', 'windbreaker', 'sweatshirt', 'winter collection', 'fleece hoodie']
  },
  {
    id: 'mens-footwear',
    name: "Men's Loafers, Sneakers & Sandals",
    bnName: 'জুতা, স্নিকার্স ও স্যান্ডেল',
    sector: 'fashion_men',
    suggestedCategoryId: 'footwear-sneakers',
    tags: ['sneakers', 'loafers', 'জুতা', 'leather shoes', 'casual shoes', 'স্যান্ডেল', 'sandals', 'running shoes', 'slippers', 'formal shoes']
  },
  {
    id: 'mens-accessories',
    name: 'Wallets, Belts & Sunglasses',
    bnName: 'মানিব্যাগ, বেল্ট ও সানগ্লাস',
    sector: 'fashion_men',
    suggestedCategoryId: 'mens-fashion',
    tags: ['leather wallet', 'belt', 'মানিব্যাগ', 'বেল্ট', 'sunglasses', 'card holder', 'leather belt', 'polarized sunglasses', 'cufflinks']
  },

  // ==========================================
  // WOMEN'S FASHION & LUXURY
  // ==========================================
  {
    id: 'sarees-traditional',
    name: 'Exclusive Sarees & Jamdani',
    bnName: 'শাড়ি, জামদানি ও সিল্ক',
    sector: 'fashion_women',
    suggestedCategoryId: 'womens-fashion',
    tags: ['saree', 'sharee', 'শাড়ি', 'jamdani', 'silk saree', 'cotton saree', 'georgette saree', 'party saree', 'kota cotton', 'tangail saree', 'traditional saree']
  },
  {
    id: 'salwar-kameez-three-piece',
    name: 'Three Piece & Salwar Kameez',
    bnName: 'থ্রি-পিস ও সালোয়ার কামিজ',
    sector: 'fashion_women',
    suggestedCategoryId: 'womens-fashion',
    tags: ['three piece', 'salwar kameez', 'থ্রি পিস', 'unstitched three piece', 'lawn three piece', 'cotton three piece', 'boutique three piece', 'designer dress']
  },
  {
    id: 'kurtis-tunics',
    name: 'Kurtis, Tunics & Tops',
    bnName: 'কুর্তি ও টিউনিক',
    sector: 'fashion_women',
    suggestedCategoryId: 'womens-fashion',
    tags: ['kurti', 'kurtis', 'কুর্তি', 'tunic', 'ladies tops', 'cotton kurti', 'short kurti', 'long kurti', 'fusion wear', 'casual kurti']
  },
  {
    id: 'abayas-hijabs',
    name: 'Abayas, Borka & Hijabs',
    bnName: 'আবায়া, বোরকা ও হিজাব',
    sector: 'fashion_women',
    suggestedCategoryId: 'womens-fashion',
    tags: ['abaya', 'borka', 'বোরকা', 'hijab', 'হিজাব', 'modest fashion', 'dubai abaya', 'georgette hijab', 'instant hijab', 'khimar', 'namaz chador']
  },
  {
    id: 'womens-handbags',
    name: 'Handbags, Totes & Clutches',
    bnName: 'হ্যান্ডব্যাগ ও পার্স',
    sector: 'fashion_women',
    suggestedCategoryId: 'womens-fashion',
    tags: ['handbag', 'tote bag', 'হ্যান্ডব্যাগ', 'purse', 'shoulder bag', 'crossbody bag', 'ladies wallet', 'clutch', 'leather handbag', 'পার্স']
  },
  {
    id: 'womens-jewelry',
    name: 'Jewelry, Earrings & Necklaces',
    bnName: 'গহনা, কানের দুল ও নেকলেস',
    sector: 'fashion_women',
    suggestedCategoryId: 'womens-fashion',
    tags: ['jewelry', 'earrings', 'গহনা', 'necklace', 'choker', 'bangles', 'bracelet', 'ring', 'kundan jewelry', 'silver jewelry', 'দুলের সেট']
  },
  {
    id: 'womens-footwear',
    name: 'Heels, Flats & Party Sandals',
    bnName: 'হিল, ফ্ল্যাট ও পার্টি জুতা',
    sector: 'fashion_women',
    suggestedCategoryId: 'footwear-sneakers',
    tags: ['heels', 'flats', 'মহিলাদের জুতা', 'party sandals', 'wedge heels', 'block heels', 'kolhapuri', 'ladies slippers']
  },

  // ==========================================
  // GROCERIES & PANTRY
  // ==========================================
  {
    id: 'organic-oils-ghee',
    name: 'Pure Oils, Mustard Oil & Premium Ghee',
    bnName: 'খাঁটি তেল, সরিষার তেল ও গাওয়া ঘি',
    sector: 'groceries',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['mustard oil', 'ঘি', 'সরিষার তেল', 'pure ghee', 'coconut oil', 'olive oil', 'soybean oil', 'organic oil', 'cold pressed oil', 'kachi ghani']
  },
  {
    id: 'organic-honey',
    name: 'Sundarban & Pure Natural Honey',
    bnName: 'খাঁটি মধু ও সুন্দরবনের মধু',
    sector: 'groceries',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['honey', 'মধু', 'pure honey', 'sundarban honey', 'natural honey', 'khalisha honey', 'raw honey', 'black seed honey', 'কালোজিরা মধু']
  },
  {
    id: 'premium-rice',
    name: 'Aromatic & Miniket Premium Rice',
    bnName: 'পোলাও চাল, বাসমতী ও মিনিকেট চাল',
    sector: 'groceries',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['rice', 'চাল', 'miniket rice', 'basmati rice', 'chinigura rice', 'polao rice', 'nazirshail', 'brown rice', 'পোলাও চাল', 'বাসমতী চাল']
  },
  {
    id: 'dry-fruits-nuts',
    name: 'Dry Fruits, Dates & Premium Nuts',
    bnName: 'ড্রাই ফ্রুটস, খেজুর ও বাদাম',
    sector: 'groceries',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['dry fruits', 'dates', 'বাদাম', 'খেজুর', 'almonds', 'cashew nuts', 'kaju badam', 'walnuts', 'chia seed', 'কাঠবাদাম', 'কাজুবাদাম', 'চিয়া সিড']
  },
  {
    id: 'spices-masala',
    name: 'Natural Spices & Pure Masala',
    bnName: 'প্রাকৃতিক মশলা ও গুঁড়া মশলা',
    sector: 'groceries',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['spices', 'মশলা', 'turmeric powder', 'chili powder', 'haldi', 'cumin', 'coriander', 'garam masala', 'black pepper', 'দারুচিনি', 'এলাচ', 'হলুদ গুঁড়া']
  },
  {
    id: 'tea-coffee',
    name: 'Premium Tea Leaves & Coffee',
    bnName: 'চা পাতা ও কফি',
    sector: 'groceries',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['tea', 'coffee', 'চা পাতা', 'green tea', 'black tea', 'sylhet tea', 'instant coffee', 'roasted coffee', 'গ্রিন টি', 'কফি']
  },
  {
    id: 'breakfast-cereals',
    name: 'Oats, Atta, Cereals & Snacks',
    bnName: 'ওটস, আটা, ময়দা ও নুডলস',
    sector: 'groceries',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['oats', 'atta', 'আটা', 'ময়দা', 'noodles', 'biscuits', 'cornflakes', 'breakfast cereals', 'pasta', 'নুডলস']
  },

  // ==========================================
  // BEAUTY, SKINCARE & PERSONAL CARE
  // ==========================================
  {
    id: 'facial-cleansers',
    name: 'Face Wash & Cleansers',
    bnName: 'ফেসওয়াশ ও ক্লিনজার',
    sector: 'beauty',
    suggestedCategoryId: 'beauty-skincare',
    tags: ['face wash', 'cleanser', 'ফেসওয়াশ', 'salicylic acid', 'foam cleanser', 'gentle cleanser', 'brightening face wash', 'acne face wash']
  },
  {
    id: 'serums-moisturizers',
    name: 'Serums, Creams & Moisturizers',
    bnName: 'সিরাম, ময়েশ্চারাইজার ও ক্রিম',
    sector: 'beauty',
    suggestedCategoryId: 'beauty-skincare',
    tags: ['serum', 'moisturizer', 'সিরাম', 'niacinamide', 'vitamin c serum', 'hyaluronic acid', 'night cream', 'day cream', 'ত্বকের যত্ন', 'গ্লোয়িং স্কিন']
  },
  {
    id: 'sunscreens',
    name: 'Sunscreen & UV Protection',
    bnName: 'সানস্ক্রিন ও সানব্লক',
    sector: 'beauty',
    suggestedCategoryId: 'beauty-skincare',
    tags: ['sunscreen', 'sunblock', 'সানস্ক্রিন', 'spf 50', 'matte sunscreen', 'aqua sunscreen', 'no white cast', 'sun protection']
  },
  {
    id: 'hair-care',
    name: 'Shampoo, Conditioner & Hair Oils',
    bnName: 'শ্যাম্পু, কন্ডিশনার ও চুলের তেল',
    sector: 'beauty',
    suggestedCategoryId: 'beauty-skincare',
    tags: ['shampoo', 'conditioner', 'শ্যাম্পু', 'hair oil', 'anti-dandruff', 'hair fall control', 'onion hair oil', 'keratin', 'চুলের যত্ন']
  },
  {
    id: 'fragrances-perfumes',
    name: 'Perfumes, Attar & Body Sprays',
    bnName: 'পারফিউম, আতর ও বডি স্প্রে',
    sector: 'beauty',
    suggestedCategoryId: 'beauty-skincare',
    tags: ['perfume', 'attar', 'আতর', 'পারফিউম', 'body spray', 'deodorant', 'oudh', 'long lasting perfume', 'french perfume']
  },

  // ==========================================
  // HOME, KITCHEN & APPLIANCES
  // ==========================================
  {
    id: 'kitchen-appliances',
    name: 'Blenders, Air Fryers & Cookers',
    bnName: 'ব্লেন্ডার, এয়ার ফ্রায়ার ও কুকার',
    sector: 'home',
    suggestedCategoryId: 'home-kitchen',
    tags: ['blender', 'air fryer', 'ব্লেন্ডার', 'electric kettle', 'rice cooker', 'induction cooker', 'grinder', 'kitchen appliance', 'কেতলি']
  },
  {
    id: 'cookware-kitchenware',
    name: 'Pans, Pots & Kitchen Accessories',
    bnName: 'কড়াই, ফ্রাইপ্যান ও ক্রোকারিজ',
    sector: 'home',
    suggestedCategoryId: 'home-kitchen',
    tags: ['cookware', 'frying pan', 'non-stick pan', 'knife set', 'pressure cooker', 'dinner set', 'water bottle', 'lunch box', 'কড়াই']
  },
  {
    id: 'home-bedding-decor',
    name: 'Bedsheets, Curtains & Home Decor',
    bnName: 'বেডশিট, পর্দা ও হোম ডেকর',
    sector: 'home',
    suggestedCategoryId: 'home-kitchen',
    tags: ['bedsheet', 'curtains', 'বেডশিট', 'pillow cover', 'blanket', 'comforter', 'wall art', 'home decor', 'towel', 'বাথ টাওয়েল']
  },

  // ==========================================
  // BABY & KIDS
  // ==========================================
  {
    id: 'baby-care-diapers',
    name: 'Baby Diapers & Skincare',
    bnName: 'ডায়াপার ও বেবি কেয়ার',
    sector: 'kids',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['diaper', 'baby wipes', 'ডায়াপার', 'baby lotion', 'baby shampoo', 'baby oil', 'feeder', 'baby care']
  },
  {
    id: 'baby-toys-clothing',
    name: 'Kids Toys, Frocks & Panjabi',
    bnName: 'বাচ্চাদের খেলনা ও পোশাক',
    sector: 'kids',
    suggestedCategoryId: 'mens-fashion',
    tags: ['toys', 'educational toys', 'kids dress', 'baby clothes', 'খেলনা', 'baby frock', 'kids panjabi', 'stroller', 'tricycle']
  },

  // ==========================================
  // SPORTS & FITNESS
  // ==========================================
  {
    id: 'gym-fitness',
    name: 'Gym Equipment, Yoga Mats & Dumbbells',
    bnName: 'জিম ইকুইপমেন্ট ও ডাম্বেল',
    sector: 'sports',
    suggestedCategoryId: 'footwear-sneakers',
    tags: ['dumbbell', 'gym equipment', 'yoga mat', 'resistance band', 'fitness', 'workout', 'push up bar', 'jump rope', 'ডাম্বেল']
  },
  {
    id: 'sports-gear',
    name: 'Cricket, Football & Badminton Gear',
    bnName: 'ক্রিকেট, ফুটবল ও ব্যাডমিন্টন সরঞ্জাম',
    sector: 'sports',
    suggestedCategoryId: 'footwear-sneakers',
    tags: ['cricket bat', 'football', 'badminton racket', 'shuttlecock', 'sports jersey', 'jersey', 'ক্রিকেট ব্যাট', 'ফুটবল', 'বুট জুতা']
  }
];

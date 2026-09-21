const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const catalogPath = 'src/data/dropshippingCatalog.json';
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
console.log(`Loaded ${catalog.length} products from catalog.`);

// Supabase setup
const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MjAyMDYsImV4cCI6MjEwNDQ5NjIwNn0.kDSjx7F7tYhDwbL-LbYANEEuDiQuclKnFp5mwJc6Y0A';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ALLOWED_COLS = [
  'id', 'title', 'slug', 'description', 'price', 'discount_price', 'category_id',
  'stock', 'images', 'rating', 'review_count', 'is_featured', 'is_trending', 'brand',
  'sku', 'warranty', 'highlights', 'fabric', 'material', 'fit_type', 'care_instructions',
  'origin', 'gender', 'specifications', 'tags', 'sizes', 'colors', 'delivery_note',
  'allowed_payment_methods', 'payment_instruction', 'dropshipping_url', 'custom_attributes'
];

// Color Palette Definitions
const COLOR_PALETTE = {
  'black': { name: 'Black', hex: '#111827', bn: 'কালো' },
  'white': { name: 'White', hex: '#F8FAFC', bn: 'সাদা' },
  'silver': { name: 'Silver', hex: '#CBD5E1', bn: 'সিলভার' },
  'ash': { name: 'Ash', hex: '#94A3B8', bn: 'অ্যাশ' },
  'grey': { name: 'Grey', hex: '#64748B', bn: 'ধূসর' },
  'gray': { name: 'Grey', hex: '#64748B', bn: 'ধূসর' },
  'charcoal': { name: 'Charcoal', hex: '#334155', bn: 'ডার্ক গ্রে' },
  'navy': { name: 'Navy Blue', hex: '#1E3A8A', bn: 'নেভি ব্লু' },
  'navy blue': { name: 'Navy Blue', hex: '#1E3A8A', bn: 'নেভি ব্লু' },
  'blue': { name: 'Blue', hex: '#2563EB', bn: 'নীল' },
  'royal blue': { name: 'Royal Blue', hex: '#1D4ED8', bn: 'রয়্যাল ব্লু' },
  'sky blue': { name: 'Sky Blue', hex: '#38BDF8', bn: 'আকাশি' },
  'cyan': { name: 'Cyan', hex: '#06B6D4', bn: 'সায়ান' },
  'teal': { name: 'Teal', hex: '#0D9488', bn: 'টিল' },
  'red': { name: 'Red', hex: '#DC2626', bn: 'লাল' },
  'maroon': { name: 'Maroon', hex: '#7F1D1D', bn: 'মেরুন' },
  'burgundy': { name: 'Burgundy', hex: '#881337', bn: 'বার্গান্ডি' },
  'wine': { name: 'Wine Red', hex: '#881337', bn: 'ওয়াইন রেড' },
  'wine red': { name: 'Wine Red', hex: '#881337', bn: 'ওয়াইন রেড' },
  'green': { name: 'Green', hex: '#16A34A', bn: 'সবুজ' },
  'olive': { name: 'Olive Green', hex: '#4D7C0F', bn: 'অলিভ গ্রিন' },
  'olive green': { name: 'Olive Green', hex: '#4D7C0F', bn: 'অলিভ গ্রিন' },
  'bottle green': { name: 'Bottle Green', hex: '#14532D', bn: 'বোটল গ্রিন' },
  'mint': { name: 'Mint Green', hex: '#6EE7B7', bn: 'মিন্ট গ্রিন' },
  'yellow': { name: 'Yellow', hex: '#EAB308', bn: 'হলুদ' },
  'mustard': { name: 'Mustard', hex: '#CA8A04', bn: 'সরিষা হলুদ' },
  'orange': { name: 'Orange', hex: '#F97316', bn: 'কমলা' },
  'peach': { name: 'Peach', hex: '#FDBA74', bn: 'পিচ' },
  'pink': { name: 'Pink', hex: '#EC4899', bn: 'গোলাপি' },
  'baby pink': { name: 'Baby Pink', hex: '#F472B6', bn: 'হালকা গোলাপি' },
  'deep pink': { name: 'Deep Pink', hex: '#BE185D', bn: 'গাঢ় গোলাপি' },
  'magenta': { name: 'Magenta', hex: '#BE185D', bn: 'ম্যাজেন্টা' },
  'purple': { name: 'Purple', hex: '#7E22CE', bn: 'বেগুনি' },
  'violet': { name: 'Violet', hex: '#6B21A8', bn: 'ভায়োলেট' },
  'lavender': { name: 'Lavender', hex: '#A855F7', bn: 'ল্যাভেন্ডার' },
  'gold': { name: 'Golden', hex: '#D97706', bn: 'সোনালী' },
  'golden': { name: 'Golden', hex: '#D97706', bn: 'সোনালী' },
  'rose gold': { name: 'Rose Gold', hex: '#FB7185', bn: 'রোজ গোল্ড' },
  'bronze': { name: 'Bronze', hex: '#B45309', bn: 'ব্রোঞ্জ' },
  'copper': { name: 'Copper', hex: '#B45309', bn: 'কপার' },
  'brown': { name: 'Brown', hex: '#78350F', bn: 'বাদামি' },
  'tan': { name: 'Tan Brown', hex: '#9A3412', bn: 'ট্যান ব্রাউন' },
  'coffee': { name: 'Coffee Brown', hex: '#451A03', bn: 'কফি' },
  'chocolate': { name: 'Chocolate', hex: '#451A03', bn: 'চকলেট' },
  'beige': { name: 'Beige', hex: '#D4D4D8', bn: 'বেইজ' },
  'cream': { name: 'Cream', hex: '#FEF08A', bn: 'ক্রিম' },
  'khaki': { name: 'Khaki', hex: '#A1A1AA', bn: 'খাকি' },
  'biscuit': { name: 'Biscuit', hex: '#E2E8F0', bn: 'বিস্কুট' },
  'biskite': { name: 'Biscuit', hex: '#E2E8F0', bn: 'বিস্কুট' },
  'multicolor': { name: 'Multicolor', hex: '#6366F1', bn: 'মাল্টিকালার' }
};

function extractColorFromText(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  
  const multiWords = [
    'rose gold', 'navy blue', 'sky blue', 'royal blue', 'olive green', 
    'bottle green', 'baby pink', 'deep pink', 'wine red', 'tan brown', 'coffee brown'
  ];
  for (const mw of multiWords) {
    if (lower.includes(mw)) return COLOR_PALETTE[mw];
  }
  
  for (const [key, val] of Object.entries(COLOR_PALETTE)) {
    if (key === 'blue' && (lower.includes('bluetooth') || lower.includes('blue-tooth'))) continue;
    if (key === 'coffee' && (lower.includes('coffee maker') || lower.includes('coffee mug') || lower.includes('coffee cup') || lower.includes('milk, coffee'))) continue;
    if (key === 'orange' && (lower.includes('orange juice') || lower.includes('orange fruit'))) continue;
    if (key === 'wine' && lower.includes('wine glass')) continue;
    
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(lower)) {
      return val;
    }
  }
  return null;
}

// Taxonomy Matching Rules
const TAXONOMY_RULES = [
  {
    type: 'watch',
    match: /\b(watch|watches|wristwatch|smartwatch|chronograph|casio|curren|naviforce|olevs|skmei|poedagar|hoco watch)\b/i,
    tags: ['watch', 'watches', 'wristwatch', 'smartwatch', 'ঘড়ি', 'ঘড়ি', 'ghori', 'gori', 'হাতের ঘড়ি', 'হাত ঘড়ি', 'স্মার্টওয়াচ', 'vintage watch', 'wrist watch']
  },
  {
    type: 'wall-clock',
    match: /\b(wall clock|clock|diy clock|alarm clock)\b/i,
    tags: ['wall clock', 'clock', 'ঘড়ি', 'ঘড়ি', 'ghori', 'দেয়াল ঘড়ি', 'দেয়াল ঘড়ি ডিজাইন', 'অ্যালার্ম ঘড়ি']
  },
  {
    type: 't-shirt',
    match: /\b(t-shirt|tshirt|tee|tees|polo|polos|drop-shoulder|drop shoulder|t shirt)\b/i,
    tags: ['t-shirt', 'tshirt', 'tee', 'টি শার্ট', 'টি-শার্ট', 'tishart', 'polo', 'পোলো', 'ছেলেদের টি শার্ট', 'ড্রপ শোল্ডার']
  },
  {
    type: 'shirt',
    match: /\b(shirt|shirts|formal shirt|casual shirt|cotton shirt)\b/i,
    tags: ['shirt', 'shirts', 'শার্ট', 'formal shirt', 'casual shirt', 'ছেলেদের শার্ট', 'ফর্মাল শার্ট', 'ক্যাজুয়াল শার্ট']
  },
  {
    type: 'panjabi',
    match: /\b(panjabi|punjabi|kurta|pajama|payjama|kabli)\b/i,
    tags: ['panjabi', 'punjabi', 'পাঞ্জাবি', 'পাঞ্জাবী', 'kurta', 'পায়জামা', 'ঈদ পাঞ্জাবি', 'কাবলি সেট', 'সেমি লং পাঞ্জাবি']
  },
  {
    type: 'pants',
    match: /\b(pant|pants|trouser|trousers|jeans|gabardine|jogger|joggers|sweatpant|sweatpants|chino|chinos)\b/i,
    tags: ['pants', 'pant', 'প্যান্ট', 'jeans', 'জিন্স', 'gabardine', 'গ্যাবার্ডিন', 'trouser', 'ট্রাউজার', 'joggers', 'জগার্স']
  },
  {
    type: 'hoodie',
    match: /\b(hoodie|hoodies|sweatshirt|jacket|winterwear|windbreaker|blazer|coat|sweater)\b/i,
    tags: ['hoodie', 'hoodies', 'হুডি', 'jacket', 'জ্যাকেট', 'sweatshirt', 'শীতের পোশাক', 'winter wear', 'ব্লেজার', 'সোয়েটার']
  },
  {
    type: 'jersey',
    match: /\b(jersey|jerseys|football edition|argentina|brazil|messi|ronaldo)\b/i,
    tags: ['jersey', 'জার্সি', 'football jersey', 'ফুটবল জার্সি', 'sports jersey', 'খেলাধুলার জার্সি']
  },
  {
    type: 'saree',
    match: /\b(saree|sharee|sari|katan|georgette|jamdani|silk saree)\b/i,
    tags: ['saree', 'sharee', 'sari', 'শাড়ি', 'শাড়ি', 'shari', 'কাতান', 'সিল্ক শাড়ি', 'মেয়েদের শাড়ি', 'জর্জেট শাড়ি']
  },
  {
    type: 'three-piece',
    match: /\b(three piece|3 piece|3-piece|two piece|2 piece|salwar kameez|kurti|kurtis|kamiz|koti|palazzo|plazo)\b/i,
    tags: ['three piece', 'থ্রি পিস', 'two piece', 'টু পিস', 'kurti', 'কুর্তি', 'কামিজ', 'salwar kameez', 'কটি সেট', 'মেয়েদের পোশাক', 'প্লাজো']
  },
  {
    type: 'borka',
    match: /\b(borka|borkha|burqa|abaya|hijab|khimar|niqab|chador)\b/i,
    tags: ['borka', 'বোরকা', 'বোরখা', 'abaya', 'আবায়া', 'hijab', 'হিজাব', 'khimar', 'খিমার', 'হিজাব কালেকশন', 'ইসলামিক পোশাক']
  },
  {
    type: 'shoes',
    match: /\b(shoe|shoes|sneaker|sneakers|loafer|loafers|sandal|sandals|boot|boots|slippers|slides)\b/i,
    tags: ['shoes', 'shoe', 'জুতা', 'জুতো', 'juta', 'juto', 'sneakers', 'স্নিকার্স', 'loafer', 'লোফার', 'sandal', 'স্যান্ডেল', 'জুতো কালেকশন']
  },
  {
    type: 'bag',
    match: /\b(bag|bags|backpack|backpacks|handbag|handbags|clutch|wallet|wallets|purse|side bag)\b/i,
    tags: ['bag', 'ব্যাগ', 'backpack', 'ব্যাকপ্যাক', 'handbag', 'হ্যান্ডব্যাগ', 'লেডিস ব্যাগ', 'wallet', 'মানিব্যাগ', 'ট্রাভেল ব্যাগ']
  },
  {
    type: 'belt',
    match: /\b(leather belt|waist belt|buckle belt)\b/i,
    tags: ['belt', 'বেল্ট', 'leather belt', 'লেদার বেল্ট', 'men belt', 'ছেলেদের বেল্ট']
  },
  {
    type: 'jewellery',
    match: /\b(ring|rings|necklace|necklaces|earring|earrings|nose pin|nosepin|pendant|bracelet|bangle|jewel|jewelry|jewellery)\b/i,
    tags: ['jewellery', 'jewelry', 'গহনা', 'জুয়েলারি', 'ring', 'আংটি', 'necklace', 'নেকলেস', 'হার', 'গলার হার', 'nose pin', 'নাকফুল', 'earrings', 'দুল']
  },
  {
    type: 'sunglasses',
    match: /\b(sunglasses|sunglass|eyewear|goggles|specs)\b/i,
    tags: ['sunglasses', 'সানগ্লাস', 'choshma', 'চশমা', 'eyewear', 'fashion sunglasses', 'ইউভি প্রটেকশন']
  },
  {
    type: 'headphone',
    match: /\b(headphone|headphones|earphone|earphones|earbud|earbuds|airpods|tws|headset|neckband)\b/i,
    tags: ['headphone', 'হেডফোন', 'earphone', 'ইয়ারফোন', 'hedfon', 'earbuds', 'এয়ারবাডস', 'tws', 'airpods', 'নেকব্যান্ড', 'wireless earbuds', 'ব্লুটুথ হেডফোন']
  },
  {
    type: 'speaker',
    match: /\b(speaker|speakers|soundbar|soundbox|woofer)\b/i,
    tags: ['speaker', 'স্পিকার', 'bluetooth speaker', 'ব্লুটুথ স্পিকার', 'sound box', 'সাউন্ড বক্স', 'portable speaker']
  },
  {
    type: 'fan',
    match: /\b(fan|fans|turbo fan|handheld fan|neck fan|mini fan|cooler fan)\b/i,
    tags: ['fan', 'ফ্যান', 'fyan', 'hand fan', 'হাত ফ্যান', 'rechargeable fan', 'চার্জার ফ্যান', 'mini fan', 'মিনি ফ্যান']
  },
  {
    type: 'mouse',
    match: /\b(mouse|mice)\b/i,
    tags: ['mouse', 'মাউস', 'wireless mouse', 'ওয়্যারলেস মাউস', 'gaming mouse', 'কম্পিউটার মাউস']
  },
  {
    type: 'keyboard',
    match: /\b(keyboard|keyboards|keypad)\b/i,
    tags: ['keyboard', 'কীবোর্ড', 'mechanical keyboard', 'মেকানিক্যাল কীবোর্ড', 'gaming keyboard', 'কম্পিউটার কীবোর্ড']
  },
  {
    type: 'router',
    match: /\b(router|routers|access point|mesh|wifi|wi-fi|repeater)\b/i,
    tags: ['router', 'রাউটার', 'wifi router', 'ওয়াইফাই রাউটার', 'wireless router', 'ওয়াইফাই', 'ব্রডব্যান্ড']
  },
  {
    type: 'charger',
    match: /\b(charger|chargers|adapter|fast charger|power bank|powerbank|charging adapter)\b/i,
    tags: ['charger', 'চার্জার', 'charjar', 'fast charger', 'ফাস্ট চার্জার', 'mobile charger', 'মোবাইল চার্জার', 'power bank', 'পাওয়ার ব্যাংক']
  },
  {
    type: 'cable',
    match: /\b(cable|cables|cord|cords|type-c|lightning|usb-c|micro-usb)\b/i,
    tags: ['cable', 'কেবিল', 'usb cable', 'type-c', 'charging cable', 'চার্জিং ক্যাবল', 'ডাটা ক্যাবল']
  },
  {
    type: 'projector',
    match: /\b(projector|projectors|mini projector)\b/i,
    tags: ['projector', 'প্রজেক্টর', 'mini projector', 'মিনি প্রজেক্টর', 'home theater', 'সিনেমা প্রজেক্টর']
  },
  {
    type: 'mobile-phone',
    match: /\b(mobile|phone|smartphone|feature phone|magic phone)\b/i,
    tags: ['phone', 'mobile', 'ফোন', 'মোবাইল', 'smartphone', 'স্মার্টফোন', 'ফিচার ফোন']
  },
  {
    type: 'mobile-accessories',
    match: /\b(phone cooler|mobile cooler|radiator|phone stand|holder|tripod|selfie stick|gimbal)\b/i,
    tags: ['phone accessories', 'মোবাইল এক্সেসরিজ', 'phone stand', 'স্ট্যান্ড', 'phone cooler', 'মোবাইল কুলার', 'tripod', 'ট্রাইপড']
  },
  {
    type: 'lights',
    match: /\b(strip light|ring light|lamp|night light|torch|bulb|lantern|spotlight|led light)\b/i,
    tags: ['light', 'লাইট', 'led light', 'এলইডি লাইট', 'strip light', 'রিং লাইট', 'lamp', 'বাতি', 'নাইট লাইট']
  },
  {
    type: 'tablet',
    match: /\b(writing tablet|drawing pad|lcd tablet|graphics tablet)\b/i,
    tags: ['writing tablet', 'ড্রয়িং প্যাড', 'lcd tablet', 'ট্যাবলেট', 'বাচ্চাদের ড্রয়িং প্যাড']
  },
  {
    type: 'trimmer',
    match: /\b(trimmer|trimmers|shaver|shavers|clipper|clippers|hair remover|epilator)\b/i,
    tags: ['trimmer', 'ট্রিমার', 'shaver', 'শেভার', 'hair trimmer', 'চুল কাটার মেশিন', 'দাড়ি কাটার মেশিন', 'grooming']
  },
  {
    type: 'hair-dryer',
    match: /\b(hair dryer|hair straightener|hair styler|curler|curling iron)\b/i,
    tags: ['hair dryer', 'হেয়ার ড্রায়ার', 'hair straightener', 'চুল সোজা করার মেশিন', 'হেয়ার স্টাইলার']
  },
  {
    type: 'skincare',
    match: /\b(derma roller|skincare|serum|cream|facewash|facial|blackhead|cleanser|mask|hair color|dye shampoo)\b/i,
    tags: ['skincare', 'স্কিন কেয়ার', 'beauty', 'রূপচর্চা', 'facial', 'ত্বকের যত্ন', 'ফেস কেয়ার', 'হেয়ার ডাই']
  },
  {
    type: 'heating-belt',
    match: /\b(heating belt|period belt|cramp massager|heating pad|period pain|uterus)\b/i,
    tags: ['heating belt', 'পিরিয়ড বেল্ট', 'হিটিং বেল্ট', 'কোমর বেল্ট', 'পিরিয়ড পেইন রিলিফ', 'massager', 'ম্যাসাজার']
  },
  {
    type: 'massager',
    match: /\b(massager|massage gun|foot massager|neck massager|body massager|blood pressure)\b/i,
    tags: ['massager', 'ম্যাসাজার', 'massage gun', 'বডি ম্যাসাজার', 'পেইন রিলিফ', 'ব্যথা উপশম', 'ব্লাড প্রেসার মেশিন']
  },
  {
    type: 'fitness',
    match: /\b(gripper|exercise|fitness|gym|yoga|skipping rope|resistance band)\b/i,
    tags: ['fitness', 'ফিটনেস', 'gym', 'ব্যায়াম', 'exercise', 'শরীরচর্চা', 'workout']
  },
  {
    type: 'water-dispenser',
    match: /\b(water dispenser|water pump|dispenser pump|drinking water pump|bottle pump)\b/i,
    tags: ['water dispenser', 'water pump', 'পানির পাম্প', 'পানি তোলার পাম্প', 'ডিসপেনসার', 'water bottle pump', 'স্মার্ট পাম্প']
  },
  {
    type: 'water-purifier',
    match: /\b(water purifier|water filter|purifier|filtration)\b/i,
    tags: ['water purifier', 'ওয়াটার পিউরিফায়ার', 'water filter', 'পানি ফিল্টার', 'ফিল্টার']
  },
  {
    type: 'bottle-cup',
    match: /\b(water cup|water bottle|flask|thermos|mug|tumbler)\b/i,
    tags: ['water bottle', 'পানির বোতল', 'flask', 'ফ্লাস্ক', 'mug', 'মগ', 'thermos', 'থার্মাস']
  },
  {
    type: 'kitchen-tools',
    match: /\b(knife|cleaver|blender|grinder|chopper|cooker|sealing machine|pan|pot|frypan|whisk|foam maker|cutter|soap dispenser)\b/i,
    tags: ['kitchen tools', 'রান্নাঘরের জিনিসপত্র', 'blender', 'ব্লেন্ডার', 'knife', 'ছুরি', 'chopper', 'চপার', 'kitchen accessories']
  },
  {
    type: 'bedsheet',
    match: /\b(bedsheet|bedsheets|bed sheet|bed cover|pillow|cushion|blanket|chador|comforter)\b/i,
    tags: ['bedsheet', 'বেডশিট', 'চাদর', 'bed cover', 'বিছানার চাদর', 'pillow', 'বালিশ', 'কুশন', 'blanket', 'কম্বল']
  },
  {
    type: 'home-appliance',
    match: /\b(iron|steamer|vacuum|mosquito|sewing machine|scale|weighing scale|cleaner)\b/i,
    tags: ['home appliance', 'গৃহস্থালী জিনিসপত্র', 'iron', 'ইস্ত্রি', 'steamer', 'স্টিশার', 'scale', 'ওজন মাপার মেশিন']
  },
  {
    type: 'toys',
    match: /\b(toy|toys|duck|car|doll|dolls|bubble gun|drone|puzzle|robot|play set|camera for kids|children digital camera)\b/i,
    tags: ['toys', 'খেলনা', 'বাচ্চাদের খেলনা', 'kids toys', 'baby toys', 'remote car', 'ড্রোন']
  },
  {
    type: 'umbrella',
    match: /\b(umbrella|raincoat)\b/i,
    tags: ['umbrella', 'ছাতা', 'raincoat', 'রেইনকোট', 'বৃষ্টির ছাতা']
  },
  {
    type: 'islamic',
    match: /\b(tasbih|prayer mat|attar|quran|islami|islamic)\b/i,
    tags: ['tasbih', 'তসবিহ', 'ডিজিটাল তসবিহ', 'islamic', 'ইসলামিক', 'আতর', 'জায়নমাজ']
  },
  {
    type: 'perfume',
    match: /\b(perfume|attar|body spray|fragrance|deodorant|scent)\b/i,
    tags: ['perfume', 'পারফিউম', 'আতর', 'body spray', 'সুগন্ধি', 'বডি স্প্রে']
  },
  {
    type: 'decor',
    match: /\b(globe|statue|showpiece|eiffel tower|decor|painting)\b/i,
    tags: ['showpiece', 'শো-পিস', 'home decor', 'ঘর সাজানোর জিনিস', 'গ্লোব', 'শোপিস']
  }
];

function cleanString(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

let prunedBogusVariantsTotal = 0;
let colorsFixedTotal = 0;
let slugsFixedTotal = 0;
let subcategoriesFixedTotal = 0;

catalog.forEach((p, idx) => {
  const baseTitle = p.title || '';
  const cleanTitle = cleanString(baseTitle);
  const cleanSlug = cleanString(p.slug);
  const baseWords = new Set((cleanTitle + ' ' + cleanSlug).split(' ').filter(w => w.length > 3));

  // --- Step 1: Prune Bogus Variants ---
  if (p.colors && p.colors.length > 1) {
    const validColors = [];
    const validVariantsMap = {};

    p.colors.forEach(c => {
      const vSlug = cleanString(c.dropshipping_url || '');
      const vWords = vSlug.split(' ').filter(w => w.length > 3);
      const overlaps = vWords.filter(w => baseWords.has(w));
      const isRelated = overlaps.length >= 2 ||
                        (baseWords.size <= 2 && overlaps.length >= 1) ||
                        vSlug.includes(cleanString(p.sku || '')) ||
                        cleanSlug.includes(vSlug) ||
                        vSlug.includes(cleanSlug);

      if (isRelated) {
        validColors.push(c);
      } else {
        prunedBogusVariantsTotal++;
      }
    });

    if (validColors.length > 0) {
      p.colors = validColors;
    } else {
      p.colors = [p.colors[0]];
    }
  }

  // --- Step 2: Fix Color Names and Hex Codes ---
  if (p.colors && p.colors.length > 0) {
    const updatedVariantsMap = {};
    p.colors.forEach((c, cIdx) => {
      let matchedColor = extractColorFromText(c.dropshipping_url) || extractColorFromText(c.name);

      if (!matchedColor && p.colors.length === 1) {
        matchedColor = extractColorFromText(baseTitle);
      }

      if (matchedColor) {
        c.name = matchedColor.name;
        c.hex = matchedColor.hex;
        colorsFixedTotal++;
      } else if (c.name.includes('Design') || c.name.includes('Color') || /^\d+$/.test(c.name)) {
        c.name = `Style ${cIdx + 1}`;
        colorsFixedTotal++;
      }

      updatedVariantsMap[c.name] = {
        sku: c.sku || p.sku,
        dropshipping_url: c.dropshipping_url || p.dropshipping_url,
        wholesale_cost: p.specifications?.color_variants?.[c.name]?.wholesale_cost || p.specifications?.wholesale_cost || 0,
        profit_margin: p.specifications?.color_variants?.[c.name]?.profit_margin || p.specifications?.profit_margin || 0
      };
    });

    if (!p.specifications) p.specifications = {};
    p.specifications.color_variants = updatedVariantsMap;
  } else {
    const titleColor = extractColorFromText(baseTitle);
    if (titleColor && p.images && p.images.length > 0) {
      p.colors = [{
        name: titleColor.name,
        hex: titleColor.hex,
        price: p.price,
        discount_price: p.discount_price,
        image: p.images[0],
        images: p.images,
        stock: p.stock || 50,
        sku: p.sku
      }];
      colorsFixedTotal++;
    }
  }

  // --- Step 3: Fix Mismatched Slugs ---
  const isHoodieSlug = p.slug && p.slug.includes('mens-winter-hoodie');
  const isFashionSlugOnTech = isHoodieSlug && !cleanTitle.includes('hoodie') && !cleanTitle.includes('sweatshirt');
  if (isFashionSlugOnTech || (p.slug && p.slug.includes('test-product'))) {
    const newSlug = cleanTitle.split(' ').slice(0, 6).join('-') + '-' + (p.sku?.toLowerCase() || idx);
    p.slug = newSlug;
    slugsFixedTotal++;
  }

  // --- Step 4: Fix Subcategory Anomalies ---
  if (cleanTitle.includes('water pump') || cleanTitle.includes('water dispenser')) {
    if (p.sub_category === 'Fast Chargers & Adapters') {
      p.sub_category = 'Smart Home Gadgets';
      subcategoriesFixedTotal++;
    }
  }
  if (!p.specifications) p.specifications = {};
  p.specifications.sub_category = p.sub_category;

  // --- Step 5: Rich Bilingual Tags and Keywords Generation ---
  const tagsSet = new Set();

  const titleTokens = baseTitle
    .replace(/[,\-_/\\|.;:!?'"()[\]{}]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !/^(with|for|and|the|set|pcs|from|inch|level|levels|support)$/i.test(w));
  titleTokens.slice(0, 8).forEach(t => tagsSet.add(t.toLowerCase()));

  if (p.brand && p.brand.trim()) {
    tagsSet.add(p.brand.toLowerCase());
  }

  if (p.sub_category) {
    tagsSet.add(p.sub_category.toLowerCase());
  }

  const fullCorpus = `${baseTitle} ${p.sub_category || ''} ${p.category_id || ''}`.toLowerCase();
  TAXONOMY_RULES.forEach(rule => {
    if (rule.match.test(fullCorpus)) {
      rule.tags.forEach(t => tagsSet.add(t.toLowerCase()));
    }
  });

  if (p.colors && p.colors.length > 0) {
    p.colors.forEach(c => {
      tagsSet.add(c.name.toLowerCase());
      const pal = COLOR_PALETTE[c.name.toLowerCase()];
      if (pal && pal.bn) tagsSet.add(pal.bn);
    });
  }

  tagsSet.add('অনলাইন শপিং');
  tagsSet.add('ক্যাশ অন ডেলিভারি');
  tagsSet.add('Kintesi');

  p.tags = Array.from(tagsSet);
});

console.log('--- ENHANCEMENT SUMMARY ---');
console.log('Total Bogus Variants Pruned:', prunedBogusVariantsTotal);
console.log('Total Colors Fixed / Assigned:', colorsFixedTotal);
console.log('Total Slugs Corrected:', slugsFixedTotal);
console.log('Total Subcategories Fixed:', subcategoriesFixedTotal);

// Save updated local JSON catalog
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log('Saved updated dropshippingCatalog.json!');

// --- Sync to Supabase in Batches ---
async function syncToSupabase() {
  console.log('\n--- Syncing to Supabase via full-row upsert ---');
  const batchSize = 50;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < catalog.length; i += batchSize) {
    const chunk = catalog.slice(i, i + batchSize);
    const updates = chunk.map(p => {
      const row = {};
      ALLOWED_COLS.forEach(col => {
        if (p[col] !== undefined) row[col] = p[col];
      });
      row.updated_at = new Date().toISOString();
      return row;
    });

    const { data, error } = await supabase
      .from('products')
      .upsert(updates, { onConflict: 'id' })
      .select('id');

    if (error) {
      console.error(`\nBatch ${i} - ${i + chunk.length} failed:`, error.message);
      failCount += chunk.length;
    } else {
      successCount += (data ? data.length : chunk.length);
      process.stdout.write(`Synced ${successCount}/${catalog.length} products...\r`);
    }
  }

  console.log(`\nSupabase Sync Finished: ${successCount} updated successfully, ${failCount} failed.`);
}

syncToSupabase();

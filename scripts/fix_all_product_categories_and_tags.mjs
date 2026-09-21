import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMDIwNiwiZXhwIjoyMTA0NDk2MjA2fQ.7M3tSiIGGj2E0aG1JFm0bvHgWQ8024J5Pvuz2P58k8s';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const catalogPath = 'd:/kintesi/src/data/dropshippingCatalog.json';
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

export function classifyItem(title, existingCat = '', brand = '') {
  const t = (title || '').toLowerCase();

  // ==========================================
  // 1. TV & HOME APPLIANCES (Grinders, Juicers, Blenders, Cookers, Kettles, Fans, etc.)
  // ==========================================
  if (
    /grinder|blender|juicer|food processor|mixer|spice grinder|meat grinder/i.test(t) ||
    /air fryer|deep fryer|electric cooker|rice cooker|pressure cooker|slow cooker|induction cooker|electric kettle|kettle/i.test(t) ||
    /vacuum cleaner|robot vacuum|garment steamer|steam iron|electric iron|sewing machine/i.test(t) ||
    /refrigerator|freezer|air conditioner|inverter ac|washing machine|microwave oven|electric oven/i.test(t) ||
    /water purifier|water dispenser|water filter|ro purifier/i.test(t) ||
    /turbo fan|rechargeable fan|standing fan|ceiling fan|table fan|mini fan|neck fan|handheld fan|portable fan|cooling fan|exhaust fan|cooler/i.test(t)
  ) {
    let sub = 'Home & Kitchen Appliances';
    if (/grinder|blender|juicer|food processor|mixer/i.test(t)) {
      sub = 'Blenders, Grinders & Juicers';
    } else if (/air fryer|cooker|kettle|fryer|oven/i.test(t)) {
      sub = 'Air Fryers & Electric Cookers';
    } else if (/fan|cooler/i.test(t)) {
      sub = 'Ceiling & Standing Fans';
    } else if (/purifier|dispenser|filter/i.test(t)) {
      sub = 'Water Purifiers & Filters';
    } else if (/iron|steamer/i.test(t)) {
      sub = 'Irons & Garment Steamers';
    }
    return { category_id: 'tv-home-appliances', sub_category: sub, gender: 'Unisex' };
  }

  // ==========================================
  // 2. AUTOMOTIVES & MOTORBIKES
  // ==========================================
  if (
    /car hammer|window breaker|seat belt cutter|glass breaker/i.test(t) ||
    /helmet|riding gear|bike light|led indicator|motorcycle|motorbike/i.test(t) ||
    /car polish|car wash|car shampoo|car perfume|air freshener|seat cover|car mat|car cleaner|car tire|tyre puncture|car security/i.test(t) ||
    /car mount|bike mount|mobile holder.*(bike|car)|(bike|car).*mobile holder/i.test(t)
  ) {
    let sub = 'Car & Bike Accessories';
    if (/helmet|riding/i.test(t)) sub = 'Helmets & Riding Gear';
    else if (/light|led/i.test(t)) sub = 'Bike Lights & LED Indicators';
    else if (/mount|holder/i.test(t)) sub = 'Mobile Holders for Bikes/Cars';
    else if (/perfume|freshener/i.test(t)) sub = 'Car Perfumes & Air Fresheners';
    else if (/clean|wash|polish/i.test(t)) sub = 'Car & Bike Cleaning Wash / Polish';
    return { category_id: 'automotives-motorbikes', sub_category: sub, gender: 'Unisex' };
  }

  // ==========================================
  // 3. HOME & LIVING (Kitchenware, Tableware, Storage, Decor, Lighting, Hardware Tools)
  // ==========================================
  if (
    /mop|bucket|spin mop|cloth hanger|telescopic clothesline|hanger stand|drying rack/i.test(t) ||
    /shoe rack|shoe cabinet|entrance shelf|storage rack|spice rack|dish rack|dish drainer|pot rack|wall shelf|hanger|hook\b|organizer|shelf/i.test(t) ||
    /chopper|slicer|mandoline|grater|cutter|peeler|strainer|basin with grater/i.test(t) ||
    /cookware|pan\b|pans\b|pot\b|pots\b|wok|frying pan|saucepan|oil strainer|oil dispenser|gas stove lighter|lighter|stove/i.test(t) ||
    /dinnerware|cutlery|spoon|fork|knife|cleaver|cutting board|kitchen utensil|spatula/i.test(t) ||
    /storage box|food container|spice box|condiment|seasoning container|vacuum flask|thermos|water bottle|cup\b|mug\b|stirring cup/i.test(t) ||
    /table cloth|table cover|bedsheet|bed sheet|chador|blanket|pillow|cushion|curtain|carpet|rug|mat\b|floor mat|bathroom mat/i.test(t) ||
    /led bulb|light bulb|bulb|table lamp|desk lamp|night light|led strip|wall lamp|ceiling light|emergency light/i.test(t) ||
    /screwdriver|wire stripper|pliers|wrench|drill|hardware|toolkit|tool kit|multitool|safety stick|tactical baton|shoe cleaner/i.test(t) ||
    /towel|bath towel|toothbrush holder|bathroom accessory|soap dispenser|faucet|shower/i.test(t) ||
    /wall clock|room decor|flower vase|showpiece|candle/i.test(t)
  ) {
    let sub = 'Home & Kitchen Essentials';
    if (/mop|bucket|hanger|cleaner|clothesline|organizer|hook/i.test(t)) {
      sub = 'Cleaning Tools & Organizers';
    } else if (/shoe rack|rack|shelf|storage|box|container|condiment/i.test(t)) {
      sub = 'Kitchen Storage & Containers';
    } else if (/pan|pot|cookware|wok|strainer|lighter|stove|chopper|slicer|cutter|grater|knife|cleaver/i.test(t)) {
      sub = 'Cookware & Non-Stick Pans';
    } else if (/table cloth|cover|bedsheet|blanket|pillow|curtain|carpet|mat/i.test(t)) {
      sub = 'Bedding, Sheets & Blankets';
    } else if (/bulb|light|lamp/i.test(t)) {
      sub = 'Home Decor, Lights & Lamps';
    } else if (/screwdriver|wire stripper|tool|hardware|baton|wrench|drill/i.test(t)) {
      sub = 'Tools, DIY & Hardware';
    } else if (/spoon|fork|dinnerware|cutlery|mug|cup|bottle|flask/i.test(t)) {
      sub = 'Dinnerware & Cutlery';
    } else if (/bath|towel|shower|faucet/i.test(t)) {
      sub = 'Bathroom Accessories & Towels';
    }
    return { category_id: 'home-living', sub_category: sub, gender: 'Unisex' };
  }

  // ==========================================
  // 4. HEALTH & BEAUTY (Skincare, Haircare, Wellness, Heating Belts & Grooming)
  // ==========================================
  if (
    /heating pad|period belt|pain relief.*belt|waist belt heating|posture corrector|back support|body shaper|slimming belt|sweat slim|toning belt|abdominal/i.test(t) ||
    /serum|cream|lotion|sunscreen|spf|face wash|facewash|facial|cleanser|scrub|soap|moisturizer|aloe vera/i.test(t) ||
    /shampoo|conditioner|hair oil|hair care|hair mask|hair serum|hair removal|wax/i.test(t) ||
    /perfume|attar|body spray|fragrance|deodorant|bodyspray/i.test(t) ||
    /makeup|lipstick|mascara|eyeliner|foundation|compact powder|concealer|blush/i.test(t) ||
    /derma roller|blackhead|black head|acne|pore|scar|ointment|gel|patch|massager|massage/i.test(t) ||
    /shaver|trimmer|hair clipper|hair dryer|straightener|nail clipper|manicure|pedicure|foot care/i.test(t) ||
    /oral care|toothbrush|toothpaste|teeth|weight gain|supplement|protein shake|vitamins/i.test(t)
  ) {
    let sub = 'Serums, Creams & Moisturizers';
    if (/hair|shampoo|conditioner|oil/i.test(t)) {
      sub = 'Hair Care, Shampoos & Oils';
    } else if (/perfume|attar|spray|fragrance/i.test(t)) {
      sub = 'Perfumes, Attars & Body Sprays';
    } else if (/makeup|lipstick|mascara|cosmetics/i.test(t)) {
      sub = 'Makeup & Cosmetics';
    } else if (/belt|pad|posture|support|shaper|massager|derma|blackhead|manicure|trimmer|shaver|dryer/i.test(t)) {
      sub = 'Personal Care & Hygiene';
    } else if (/face wash|facewash|cleanser/i.test(t)) {
      sub = 'Face Cleansers & Face Wash';
    } else if (/sunscreen|spf/i.test(t)) {
      sub = 'Sunscreen & SPF Care';
    } else if (/supplement|weight gain|protein|vitamin/i.test(t)) {
      sub = 'Vitamins, Supplements & Nutrition';
    }
    return { category_id: 'health-beauty', sub_category: sub, gender: 'Unisex' };
  }

  // ==========================================
  // 5. WATCHES, BAGS & EYEWEAR
  // ==========================================
  if (
    /watch|smartwatch|chronograph|ঘড়ি|ঘড়ি/i.test(t) ||
    /sunglasses|sunglass|eyewear|anti-glare|polarized|clear glass|sun glass|choshma|সানগ্লাস/i.test(t) ||
    /backpack|laptop bag|school bag|travel bag|luggage|trolley|duffel bag|duffle/i.test(t) ||
    /wallet|cardholder|card holder|purse|handbag|clutch|crossbody|sling bag|মানিব্যাগ/i.test(t) ||
    /leather belt/i.test(t)
  ) {
    let sub = "Men's Analog & Luxury Watches";
    let gender = 'Unisex';
    if (/smartwatch|fitness band/i.test(t)) {
      sub = 'Smartwatches & Fitness Bands';
    } else if (/watch/i.test(t)) {
      if (/women|ladies|girl|female/i.test(t)) {
        sub = "Women's Designer Watches";
        gender = 'Women';
      } else {
        sub = "Men's Analog & Luxury Watches";
        gender = 'Men';
      }
    } else if (/sunglass|eyewear|glasses|glass/i.test(t)) {
      sub = 'Watch Straps & Accessories';
    } else if (/wallet|cardholder|card holder|মানিব্যাগ|leather belt/i.test(t)) {
      sub = 'Leather Wallets & Cardholders';
      gender = 'Men';
    } else if (/luggage|trolley|travel/i.test(t)) {
      sub = 'Travel Luggage & Trolley Bags';
    } else if (/handbag|purse|clutch|ladies bag/i.test(t)) {
      sub = "Women's Handbags & Purses";
      gender = 'Women';
    } else {
      sub = 'Backpacks & Laptop Bags';
    }
    return { category_id: 'watches-bags', sub_category: sub, gender };
  }

  // ==========================================
  // 6. COMPUTER & GAMING
  // ==========================================
  if (
    /keyboard|mouse|gaming mouse|wireless mouse|keycap/i.test(t) ||
    /laptop|desktop|notebook|pc\b|computer|monitor|display/i.test(t) ||
    /router|wifi|wi-fi|broadband|repeater|access point/i.test(t) ||
    /graphic card|graphics card|gpu|motherboard|ram\b|ssd|hard drive|internal hdd|pen drive|flash drive/i.test(t) ||
    /gamepad|controller|gaming console|joystick/i.test(t)
  ) {
    let sub = 'PC Components & Graphics Cards';
    if (/router|wifi|wi-fi/i.test(t)) sub = 'Routers & Networking Gear';
    else if (/keyboard|mouse/i.test(t)) sub = 'Mechanical Keyboards & Mice';
    else if (/laptop/i.test(t)) sub = 'Laptops & Ultrabooks';
    else if (/monitor/i.test(t)) sub = 'Gaming Monitors';
    else if (/controller|gamepad|console/i.test(t)) sub = 'Gaming Consoles & Controllers';
    return { category_id: 'computer-gaming', sub_category: sub, gender: 'Unisex' };
  }

  // ==========================================
  // 7. ELECTRONIC ACCESSORIES / GADGETS
  // ==========================================
  if (
    /earbuds|tws|headphone|earphone|airpods|headset|earbud/i.test(t) ||
    /speaker|bluetooth speaker|soundbar/i.test(t) ||
    /fast charger|charger|adapter|wall charger|wireless charger/i.test(t) ||
    /power bank|powerbank|portable battery/i.test(t) ||
    /cable|charging cable|usb cable|type-c|type c|hdmi|otg|converter|hub/i.test(t) ||
    /mobile cooler|radiator|phone trigger|selfie stick|tripod|ring light|microphone|mic\b/i.test(t) ||
    /projector|smart gadget/i.test(t)
  ) {
    let sub = 'Smart Gadgets & Accessories';
    if (/earbud|tws|headphone|earphone|headset/i.test(t)) sub = 'Wireless Earbuds & TWS';
    else if (/speaker/i.test(t)) sub = 'Bluetooth Speakers';
    else if (/charger|adapter/i.test(t)) sub = 'Fast Chargers & Adapters';
    else if (/power bank|powerbank/i.test(t)) sub = 'Power Banks & Portable Batteries';
    else if (/cable|type-c|converter|hub/i.test(t)) sub = 'Cables, Converters & Hubs';
    return { category_id: 'electronic-accessories', sub_category: sub, gender: 'Unisex' };
  }

  // ==========================================
  // 8. BABY & KIDS / MOTHER & BABY
  // ==========================================
  if (
    /baby|kid\b|kids\b|child|infant|toddler|newborn/i.test(t) ||
    /toy|doll|talking tom|teddy bear|action figure|puzzle|remote control car|rc car|খেলনা/i.test(t) ||
    /diaper|pampers|wipes|feeding bottle|teether|stroller|pram/i.test(t)
  ) {
    let sub = 'Toys, Walkers & Learning';
    if (/diaper|wipes/i.test(t)) sub = 'Baby Diapers & Wipes';
    else if (/bottle|feeding/i.test(t)) sub = 'Feeding Bottles & Teethers';
    else if (/cloth|romper|dress/i.test(t)) sub = 'Baby Clothing & Rompers';
    return { category_id: 'mother-baby', sub_category: sub, gender: 'Kids' };
  }

  // ==========================================
  // 9. WOMEN'S FASHION
  // ==========================================
  if (
    /saree|sharee|শাড়ি|শাড়ি|শাড়ী|kota|জামদানি|কাতান/i.test(t) ||
    /kurti|kurtis|kameez|salwar|three piece|থ্রি পিস|কামিজ|কুর্তি|কটি/i.test(t) ||
    /borka|abaya|hijab|khimar|বোরকা|বোরখা|আবায়া|হিজাব|burqa/i.test(t) ||
    /lehenga|party wear|gown|western dress|crop top|palazzo|nightwear|nighty/i.test(t) ||
    /bra\b|bra-|lingerie|panty|panties|ladies undergarment/i.test(t) ||
    /necklace|earring|pendant|bracelet|bangle|payel|shita haar|নাকফুল|দুল|হার|গহনা|জুয়েলারি|জুয়েলারি/i.test(t) ||
    /ladies heel|women heel|ladies shoe|ladies sandal|ladies footwear/i.test(t) ||
    /women.*dress|ladies.*dress|girl.*dress/i.test(t) ||
    ((/women|ladies|girl|female|মহিলা|মেয়ে/i.test(t)) && /hoodie|jacket|t-shirt|tshirt|shirt|pant|trouser/i.test(t))
  ) {
    let sub = 'Western Wear & Tops';
    if (/saree|sharee|শাড়ি|শাড়ি/i.test(t)) sub = 'Sharee';
    else if (/kurti|kameez|salwar|three piece/i.test(t)) sub = 'Salwar Kameez & Kurtis';
    else if (/borka|abaya|hijab|khimar|বোরকা/i.test(t)) sub = 'Borka, Abaya & Hijab';
    else if (/lehenga|party wear/i.test(t)) sub = 'Lehenga & Party Wear';
    else if (/gown|dress/i.test(t)) sub = 'Dresses & Gowns';
    else if (/nightwear|nighty/i.test(t)) sub = 'Nightwear & Loungewear';
    else if (/heel|sandal|shoe|footwear/i.test(t)) sub = "Women's Footwear & Heels";
    else if (/necklace|earring|pendant|bangle|bracelet|payel|haar|নাকফুল|দুল|হার|গহনা/i.test(t)) sub = 'Fashion Jewelry & Ornaments';
    return { category_id: 'womens-fashion', sub_category: sub, gender: 'Women' };
  }

  // ==========================================
  // 10. MEN'S FASHION (Strict clothing and footwear only)
  // ==========================================
  // Reject any non-apparel items immediately
  if (!/hanger|hook|rack|cleaner|organizer|shelf|shoe cleaner|drill|knife|pan|pot|bulb|grinder|blender/i.test(t)) {
    if (
      /panjabi|punjabi|পাঞ্জাবি|পাঞ্জাবী|kurta|katua|fatua/i.test(t) ||
      /t-shirt|tshirt|polo\b|polo shirt|টি-শার্ট|টি শার্ট|drop shoulder|drop-shoulder|half sleeve|round neck/i.test(t) ||
      /casual shirt|formal shirt|\bshirt\b|\bshirts\b|ডেনিম শার্ট/i.test(t) ||
      /jeans|chino|chinos|gabardine|pant\b|pants\b|trouser|trousers|sweatpant|jogger|joggers|shorts|প্যান্ট/i.test(t) ||
      /hoodie|hoodies|jacket|jackets|winterwear|sweater|sweatshirt|windbreaker|blazer|suit|কোম্পাস|হুডি|জ্যাকেট/i.test(t) ||
      /sneaker|sneakers|loafer|loafers|\bshoes\b|\bshoe\b|sandal|sandals|জুতা|জুতো|স্যান্ডেল/i.test(t) ||
      /boxer|boxers|lungi|лунги|লুঙ্গি|men.*undergarment|briefs/i.test(t) ||
      /tracksuit|track suit|activewear|jersey|\bman\b|\bmen\b|\bmens\b/i.test(t)
    ) {
      let sub = 'Activewear & Sportswear';
      if (/panjabi|punjabi|kurta|katua|fatua|পাঞ্জাবি/i.test(t)) {
        sub = 'Panjabi & Payjama';
      } else if (/t-shirt|tshirt|polo|টি-শার্ট|drop shoulder|drop-shoulder/i.test(t)) {
        sub = 'T-Shirts & Polos';
      } else if (/\bshirt\b|\bshirts\b|formal shirt|casual shirt/i.test(t)) {
        sub = 'Casual & Formal Shirts';
      } else if (/jeans|chino|gabardine|pant|trouser|sweatpant|jogger|shorts|প্যান্ট/i.test(t)) {
        sub = 'Jeans, Chinos & Trousers';
      } else if (/hoodie|jacket|sweater|sweatshirt|windbreaker|winter/i.test(t)) {
        sub = 'Jackets, Hoodies & Winterwear';
      } else if (/sneaker|loafer|shoe|sandal|জুতা|জুতো/i.test(t)) {
        sub = "Men's Footwear & Sneakers";
      } else if (/blazer|suit/i.test(t)) {
        sub = 'Formal Suits & Blazers';
      } else if (/boxer|lungi|undergarment|brief/i.test(t)) {
        sub = 'Underwear & Loungewear';
      }
      return { category_id: 'mens-fashion', sub_category: sub, gender: 'Men' };
    }
  }

  // Fallback: Home & Living
  return { category_id: 'home-living', sub_category: 'Home & Kitchen Essentials', gender: 'Unisex' };
}

export function generateAccurateTags(title, categoryId, subCategory, brand) {
  const tagSet = new Set();
  const t = (title || '').toLowerCase();

  const stopWords = new Set([
    'with', 'from', 'this', 'that', 'your', 'and', 'for', 'the', 'pcs', 'pack', 'set',
    'free', 'best', 'high', 'quality', 'new', 'style', 'edition', 'premium', 'ultra',
    'super', 'pro', 'max', 'plus', 'mini', 'size', 'color', 'colour', 'design', 'original'
  ]);

  const words = t
    .replace(/[^\w\s\u0980-\u09FF-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !stopWords.has(w) && !/^\d+$/.test(w));

  words.slice(0, 10).forEach((w) => tagSet.add(w));

  if (brand && brand !== 'Kintesi' && brand !== 'No Brand') {
    tagSet.add(brand.toLowerCase());
  }

  tagSet.add(categoryId.replace(/-/g, ' '));
  tagSet.add(subCategory.toLowerCase());

  // Specific high-intent Bengali & English synonyms
  if (/grinder/i.test(t)) {
    ['electric grinder', 'grinder', 'গ্রাইন্ডার', 'মসলা গুড়া করার মেশিন', 'blender', 'ব্লেন্ডার', 'spice grinder'].forEach((s) => tagSet.add(s));
  }
  if (/juicer/i.test(t)) {
    ['juicer', 'জুসার', 'ফল জুস করার মেশিন', 'fruit juicer', 'blender', 'ব্লেন্ডার'].forEach((s) => tagSet.add(s));
  }
  if (/blender/i.test(t)) {
    ['blender', 'ব্লেন্ডার', 'juicer', 'জুসার', 'grinder', 'গ্রাইন্ডার'].forEach((s) => tagSet.add(s));
  }
  if (/cooker|fryer|kettle/i.test(t)) {
    ['air fryer', 'cooker', 'kettle', 'রাইস কুকার', 'কেতলি', 'এয়ার ফ্রায়ার'].forEach((s) => tagSet.add(s));
  }
  if (/fan/i.test(t)) {
    ['fan', 'fans', 'ফ্যান', 'হাত ফ্যান', 'চার্জার ফ্যান', 'রিচার্জেবল ফ্যান', 'turbo fan'].forEach((s) => tagSet.add(s));
  }
  if (/mop/i.test(t)) {
    ['mop', 'spin mop', 'মপ', 'মপ বাকেট', 'cleaning'].forEach((s) => tagSet.add(s));
  }
  if (/panjabi|punjabi/i.test(t)) {
    ['panjabi', 'punjabi', 'পাঞ্জাবি', 'পাঞ্জাবী', 'kurta', 'কাতুয়া', 'men'].forEach((s) => tagSet.add(s));
  }
  if (/t-shirt|tshirt|polo/i.test(t)) {
    ['t-shirt', 'tshirt', 'tee', 'টি-শার্ট', 'টি শার্ট', 'polo'].forEach((s) => tagSet.add(s));
  }
  if (/hoodie|jacket/i.test(t)) {
    ['hoodie', 'hoodies', 'winterwear', 'jacket', 'হুডি', 'জ্যাকেট', 'সুইটার'].forEach((s) => tagSet.add(s));
  }
  if (/watch|ঘড়ি|ঘড়ি/i.test(t)) {
    ['watch', 'watches', 'smartwatch', 'ঘড়ি', 'ঘড়ি', 'হাত ঘড়ি'].forEach((s) => tagSet.add(s));
  }
  if (/mouse/i.test(t)) {
    ['mouse', 'mice', 'wireless mouse', 'gaming mouse', 'মাউস'].forEach((s) => tagSet.add(s));
  }
  if (/charger|charjar/i.test(t)) {
    ['charger', 'chargers', 'fast charger', 'চার্জার', 'charjar'].forEach((s) => tagSet.add(s));
  }
  if (/cable/i.test(t)) {
    ['cable', 'cables', 'charging cable', 'ক্যাবল', 'ডাটা ক্যাবল'].forEach((s) => tagSet.add(s));
  }
  if (/table cloth|tablecloth/i.test(t)) {
    ['table cloth', 'tablecloth', 'table cover', 'টেবিল ক্লথ', 'টেবিল কভার'].forEach((s) => tagSet.add(s));
  }
  if (/belt/i.test(t)) {
    ['heating belt', 'period belt', 'হিটিং বেল্ট', 'কোমর বেল্ট'].forEach((s) => tagSet.add(s));
  }
  if (/water.*pump|dispenser/i.test(t)) {
    ['water dispenser', 'water pump', 'পানির পাম্প', 'ডিসপেনসার'].forEach((s) => tagSet.add(s));
  }

  tagSet.add('অনলাইন শপিং');
  tagSet.add('ক্যাশ অন ডেলিভারি');
  tagSet.add('Kintesi');

  return Array.from(tagSet);
}

async function run() {
  console.log('Classifying all', catalog.length, 'products in catalog...');

  const updatedCatalog = catalog.map((prod) => {
    const classification = classifyItem(prod.title, prod.category_id, prod.brand);
    const tags = generateAccurateTags(prod.title, classification.category_id, classification.sub_category, prod.brand);

    const tagsStr = tags.join(' ');
    const searchKey = `${prod.title || ''} ${classification.sub_category} ${classification.category_id} ${prod.brand || ''} ${prod.sku || ''} ${tagsStr}`.toLowerCase();

    return {
      ...prod,
      category_id: classification.category_id,
      sub_category: classification.sub_category,
      gender: classification.gender || prod.gender,
      tags: tags,
      _searchKey: searchKey,
    };
  });

  // Save updated local dropshippingCatalog.json
  fs.writeFileSync(catalogPath, JSON.stringify(updatedCatalog, null, 2), 'utf8');
  console.log('Saved updated dropshippingCatalog.json successfully!');

  // Sync with Supabase in batches of 100
  console.log('Syncing all 2,823 products to Supabase...');
  const BATCH_SIZE = 100;
  let successCount = 0;

  for (let i = 0; i < updatedCatalog.length; i += BATCH_SIZE) {
    const chunk = updatedCatalog.slice(i, i + BATCH_SIZE).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      discount_price: p.discount_price,
      category_id: p.category_id,
      stock: p.stock || 50,
      images: p.images || ['/logo.webp'],
      brand: p.brand || 'Generic',
      sku: p.sku || '',
      gender: p.gender || 'Unisex',
      tags: p.tags || [],
      specifications: {
        ...(p.specifications || {}),
        sub_category: p.sub_category,
      },
      dropshipping_url: p.dropshipping_url || '',
    }));

    const { error } = await supabase.from('products').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`Error syncing batch ${i} - ${i + chunk.length}:`, error.message);
    } else {
      successCount += chunk.length;
      process.stdout.write(`\rSynced ${successCount} / ${updatedCatalog.length} products to Supabase...`);
    }
  }

  console.log('\nAll products successfully reclassified and synced to Supabase!');
}

run();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Helper to determine accurate category and subcategory
function determineCategoryAndSub(title, currentCat, brand) {
  const t = (title || '').toLowerCase();

  // 1. Watches
  if (t.includes('watch') || t.includes('ঘড়ি') || t.includes('smartwatch') || t.includes('chronograph')) {
    const isWomen = t.includes('women') || t.includes('lady') || t.includes('ladies') || t.includes('girl');
    const isSmart = t.includes('smart') || t.includes('fitness') || t.includes('bluetooth call');
    return {
      category_id: 'watches-bags',
      sub_category: isSmart
        ? 'Smartwatches & Fitness Bands'
        : isWomen
        ? "Women's Designer Watches"
        : "Men's Analog & Luxury Watches",
      gender: isWomen ? 'Women' : 'Men',
    };
  }

  // 2. Bags, Backpacks, Wallets
  if (
    t.includes('backpack') ||
    t.includes('wallet') ||
    t.includes('purse') ||
    t.includes('handbag') ||
    t.includes('crossbody') ||
    t.includes('sling bag') ||
    t.includes('luggage') ||
    t.includes('trolley') ||
    t.includes('মানিব্যাগ') ||
    (t.includes('bag') && !t.includes('punching bag') && !t.includes('sleeping bag'))
  ) {
    const isLadies = t.includes('women') || t.includes('ladies') || t.includes('handbag') || t.includes('purse') || t.includes('clutch');
    const isWallet = t.includes('wallet') || t.includes('cardholder') || t.includes('মানিব্যাগ');
    const isLuggage = t.includes('luggage') || t.includes('trolley') || t.includes('travel bag');
    return {
      category_id: 'watches-bags',
      sub_category: isWallet
        ? 'Leather Wallets & Cardholders'
        : isLuggage
        ? 'Travel Luggage & Trolley Bags'
        : isLadies
        ? "Women's Handbags & Purses"
        : 'Backpacks & Laptop Bags',
      gender: isLadies ? 'Women' : 'Men',
    };
  }

  // 3. Women's Fashion & Jewelry
  if (
    t.includes('saree') ||
    t.includes('sharee') ||
    t.includes('kurti') ||
    t.includes('kameez') ||
    t.includes('borka') ||
    t.includes('abaya') ||
    t.includes('hijab') ||
    t.includes('lehenga') ||
    t.includes('bra ') ||
    t.includes('bra-') ||
    t.includes('lingerie') ||
    t.includes('gown') ||
    t.includes('nose pin') ||
    t.includes('earring') ||
    t.includes('necklace') ||
    t.includes('pendant') ||
    t.includes('bracelet') ||
    t.includes('ring') && (t.includes('women') || t.includes('gemstone') || t.includes('crystal') || t.includes('stone'))
  ) {
    const isJewelry = t.includes('pin') || t.includes('earring') || t.includes('necklace') || t.includes('pendant') || t.includes('bracelet') || t.includes('ring');
    const isSharee = t.includes('saree') || t.includes('sharee');
    const isBorka = t.includes('borka') || t.includes('abaya') || t.includes('hijab');
    const isKurti = t.includes('kurti') || t.includes('kameez') || t.includes('three piece') || t.includes('থ্রি পিস');

    return {
      category_id: 'womens-fashion',
      sub_category: isJewelry
        ? 'Fashion Jewelry & Ornaments'
        : isSharee
        ? 'Sharee'
        : isBorka
        ? 'Borka, Abaya & Hijab'
        : isKurti
        ? 'Salwar Kameez & Kurtis'
        : 'Western Wear & Tops',
      gender: 'Women',
    };
  }

  // 4. Baby & Kids
  if (t.includes('baby') || t.includes('kid') || t.includes('toy') || t.includes('doll') || t.includes('বাচ্চা') || t.includes('খেলনা')) {
    return {
      category_id: 'baby-kids',
      sub_category: t.includes('toy') || t.includes('doll') || t.includes('game')
        ? 'Baby Toys & Games'
        : 'Baby Clothing & Essentials',
      gender: 'Kids',
    };
  }

  // 5. Health & Beauty
  if (
    t.includes('serum') ||
    t.includes('shampoo') ||
    t.includes('conditioner') ||
    t.includes('cream') ||
    t.includes('lotion') ||
    t.includes('perfume') ||
    t.includes('attar') ||
    t.includes('body spray') ||
    t.includes('hair oil') ||
    t.includes('hair care') ||
    t.includes('sunscreen') ||
    t.includes('face wash') ||
    t.includes('facial') ||
    t.includes('makeup') ||
    t.includes('lipstick')
  ) {
    return {
      category_id: 'health-beauty',
      sub_category: t.includes('hair') || t.includes('shampoo')
        ? 'Hair Care, Shampoos & Oils'
        : t.includes('perfume') || t.includes('attar') || t.includes('spray')
        ? 'Perfumes, Attars & Body Sprays'
        : 'Serums, Creams & Moisturizers',
      gender: 'Unisex',
    };
  }

  // 6. Computer & Gaming
  if (
    t.includes('router') ||
    t.includes('wi-fi') ||
    t.includes('wifi') ||
    t.includes('projector') ||
    t.includes('keyboard') ||
    t.includes('mouse') ||
    t.includes('laptop') ||
    t.includes('pc') ||
    t.includes('ssd') ||
    t.includes('hard drive') ||
    t.includes('gamepad') ||
    t.includes('controller')
  ) {
    return {
      category_id: 'computer-gaming',
      sub_category: t.includes('router') || t.includes('wi-fi') || t.includes('wifi')
        ? 'Routers & Networking Gear'
        : t.includes('keyboard') || t.includes('mouse')
        ? 'Mechanical Keyboards & Mice'
        : t.includes('projector')
        ? 'Gaming Monitors & Displays'
        : 'PC Components & Accessories',
      gender: 'Unisex',
    };
  }

  // 7. Gadgets & Electronics (Cables, Chargers, Earbuds, Speakers, Power Banks, Small electronics)
  if (
    t.includes('cable') ||
    t.includes('charger') ||
    t.includes('charging') ||
    t.includes('adapter') ||
    t.includes('earbuds') ||
    t.includes('headphone') ||
    t.includes('earphone') ||
    t.includes('speaker') ||
    t.includes('power bank') ||
    t.includes('bluetooth') ||
    t.includes('tws') ||
    t.includes('usb') ||
    t.includes('trimmer') ||
    t.includes('shaver') ||
    t.includes('hair dryer') ||
    t.includes('battery') ||
    t.includes('sensor') ||
    t.includes('remote')
  ) {
    return {
      category_id: 'gadgets-electronics',
      sub_category: t.includes('earbud') || t.includes('tws') || t.includes('headphone') || t.includes('earphone')
        ? 'Wireless Earbuds & TWS'
        : t.includes('speaker')
        ? 'Bluetooth Speakers'
        : t.includes('charger') || t.includes('charging') || t.includes('adapter')
        ? 'Fast Chargers & Adapters'
        : t.includes('cable') || t.includes('usb')
        ? 'Cables, Converters & Hubs'
        : t.includes('power bank')
        ? 'Power Banks & Portable Batteries'
        : 'Smart Gadgets & Accessories',
      gender: 'Unisex',
    };
  }

  // 8. Men's Fashion
  if (
    t.includes('hoodie') ||
    t.includes('jacket') ||
    t.includes('panjabi') ||
    t.includes('punjabi') ||
    t.includes('t-shirt') ||
    t.includes('tshirt') ||
    t.includes('tee') ||
    t.includes('polo') ||
    t.includes('shirt') ||
    t.includes('pant') ||
    t.includes('trouser') ||
    t.includes('jeans') ||
    t.includes('chino') ||
    t.includes('sweatpant') ||
    t.includes('boxer') ||
    t.includes('undergarment') ||
    t.includes('sneaker') ||
    t.includes('shoe') ||
    t.includes('jersey') ||
    t.includes('men')
  ) {
    return {
      category_id: 'mens-fashion',
      sub_category: t.includes('hoodie') || t.includes('jacket') || t.includes('winter')
        ? 'Jackets, Hoodies & Winterwear'
        : t.includes('panjabi') || t.includes('punjabi')
        ? 'Panjabi & Payjama'
        : t.includes('t-shirt') || t.includes('tshirt') || t.includes('polo') || t.includes('tee')
        ? 'T-Shirts & Polos'
        : t.includes('shirt')
        ? 'Casual & Formal Shirts'
        : t.includes('pant') || t.includes('trouser') || t.includes('jeans') || t.includes('chino') || t.includes('sweatpant')
        ? 'Jeans, Chinos & Trousers'
        : t.includes('shoe') || t.includes('sneaker')
        ? "Men's Footwear & Sneakers"
        : 'Activewear & Sportswear',
      gender: 'Men',
    };
  }

  // 9. Home & Living (Default fallback)
  return {
    category_id: 'home-living',
    sub_category: 'Home & Kitchen Essentials',
    gender: 'Unisex',
  };
}

// Generate rich, accurate keyword tags for maximum search ranking
function generateRichTags(title, categoryId, subCategory, brand, colors, specifications) {
  const tagSet = new Set();
  const t = (title || '').toLowerCase();

  // Clean title words (filter out filler words)
  const stopWords = new Set([
    'with', 'from', 'this', 'that', 'your', 'and', 'for', 'the', 'pcs', 'pack', 'set',
    'free', 'best', 'high', 'quality', 'new', 'style', 'edition', 'premium', 'ultra',
    'super', 'pro', 'max', 'plus', 'mini', 'size', 'color', 'colour', 'design'
  ]);

  const cleanWords = t
    .replace(/[^\w\s\u0980-\u09FF-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.has(w) && !/^\d+$/.test(w));

  cleanWords.slice(0, 10).forEach(w => tagSet.add(w));

  // Brand tag
  if (brand && brand !== 'Kintesi' && brand !== 'No Brand') {
    tagSet.add(brand.toLowerCase());
  }

  // Bengali & English Category / Domain Specific Keywords
  // Watches
  if (categoryId === 'watches-bags') {
    if (t.includes('watch') || t.includes('ঘড়ি') || t.includes('smartwatch')) {
      ['ঘড়ি', 'হাত ঘড়ি', 'রিস্ট ওয়াচ', 'watch', 'wrist watch', 'wristwatch'].forEach(k => tagSet.add(k));
      if (t.includes('smart') || t.includes('fitness')) {
        ['স্মার্ট ওয়াচ', 'স্মার্টওয়াচ', 'ফিটনেস ট্র্যাকার', 'smart watch', 'smartwatch', 'fitness band'].forEach(k => tagSet.add(k));
      } else {
        ['অ্যানালগ ঘড়ি', 'কোয়ার্টজ ঘড়ি', 'analog watch', 'quartz watch', 'sports watch'].forEach(k => tagSet.add(k));
      }
      if (t.includes('wheel') || t.includes('rim')) {
        ['কার হুইল ঘড়ি', 'হুইল ওয়াচ', 'wheel watch', 'rotating watch'].forEach(k => tagSet.add(k));
      }
      if (t.includes('men')) {
        ['ছেলেদের ঘড়ি', 'men watch', 'mens watch'].forEach(k => tagSet.add(k));
      }
      if (t.includes('women') || t.includes('lady') || t.includes('ladies')) {
        ['মেয়েদের ঘড়ি', 'লেডিস ঘড়ি', 'women watch', 'ladies watch'].forEach(k => tagSet.add(k));
      }
    }
    if (t.includes('wallet') || t.includes('মানিব্যাগ')) {
      ['মানিব্যাগ', 'লেদার ওয়ালেট', 'চামড়ার মানিব্যাগ', 'কার্ডহোল্ডার', 'wallet', 'leather wallet', 'men wallet', 'money bag', 'card holder'].forEach(k => tagSet.add(k));
    }
    if (t.includes('backpack') || t.includes('bag') || t.includes('ব্যাগ')) {
      ['ব্যাগ', 'ব্যাকপ্যাক', 'ল্যাপটপ ব্যাগ', 'লেডিস ব্যাগ', 'backpack', 'laptop bag', 'travel bag', 'school bag'].forEach(k => tagSet.add(k));
    }
  }

  // Gadgets & Electronics
  if (categoryId === 'gadgets-electronics') {
    ['গ্যাজেট', 'ইলেকট্রনিক্স', 'gadget', 'electronics'].forEach(k => tagSet.add(k));
    if (t.includes('charger') || t.includes('charging') || t.includes('adapter')) {
      ['চার্জার', 'ফাস্ট চার্জার', 'মোবাইল চার্জার', 'এডাপ্টার', 'charger', 'fast charger', 'mobile charger', 'power adapter', 'fast charging'].forEach(k => tagSet.add(k));
    }
    if (t.includes('cable') || t.includes('usb') || t.includes('type-c') || t.includes('type c')) {
      ['চার্জিং কেবল', 'ইউএসবি কেবল', 'টাইপ সি কেবল', 'cable', 'usb cable', 'type c cable', 'charging cable', 'fast charging cable'].forEach(k => tagSet.add(k));
    }
    if (t.includes('earbud') || t.includes('tws') || t.includes('headphone') || t.includes('earphone')) {
      ['ইয়ারফোন', 'হেডফোন', 'ব্লুটুথ হেডফোন', 'এয়ারবাডস', 'টিডব্লিউএস', 'earbuds', 'wireless earbuds', 'tws', 'bluetooth headphone', 'earphone'].forEach(k => tagSet.add(k));
    }
    if (t.includes('speaker')) {
      ['স্পিকার', 'ব্লুটুথ স্পিকার', 'সাউন্ড বক্স', 'wireless speaker', 'bluetooth speaker', 'sound box', 'portable speaker'].forEach(k => tagSet.add(k));
    }
    if (t.includes('power bank')) {
      ['পাওয়ার ব্যাংক', 'পোর্টেবল চার্জার', 'power bank', 'portable charger'].forEach(k => tagSet.add(k));
    }
  }

  // Computer & Gaming
  if (categoryId === 'computer-gaming') {
    ['কম্পিউটার গ্যাজেট', 'কম্পিউটার এক্সেসরিজ', 'computer accessories', 'gaming'].forEach(k => tagSet.add(k));
    if (t.includes('router') || t.includes('wi-fi') || t.includes('wifi')) {
      ['রাউটার', 'ওয়াইফাই রাউটার', 'গিগাবিট রাউটার', 'router', 'wifi router', 'wireless router', 'tp link router'].forEach(k => tagSet.add(k));
    }
    if (t.includes('projector')) {
      ['প্রজেক্টর', 'মিনি প্রজেক্টর', 'স্মার্ট প্রজেক্টর', 'projector', 'mini projector', 'smart projector', 'home cinema'].forEach(k => tagSet.add(k));
    }
    if (t.includes('keyboard') || t.includes('mouse')) {
      ['কীবোর্ড', 'মাউস', 'গেমিং মাউস', 'keyboard', 'gaming mouse', 'wireless mouse'].forEach(k => tagSet.add(k));
    }
  }

  // Men's Fashion
  if (categoryId === 'mens-fashion') {
    ['ছেলেদের ফ্যাশন', 'ছেলেদের পোশাক', "men's fashion", 'mens wear'].forEach(k => tagSet.add(k));
    if (t.includes('hoodie') || t.includes('winter') || t.includes('jacket')) {
      ['হুডি', 'শীতের পোশাক', 'উইন্টার কালেকশন', 'হুডি জ্যাকেট', 'জ্যাকেট', 'winter hoodie', 'hoodie bd', 'jacket'].forEach(k => tagSet.add(k));
    }
    if (t.includes('t-shirt') || t.includes('tshirt') || t.includes('polo') || t.includes('tee')) {
      ['টি শার্ট', 'পোলো শার্ট', 'ছেলেদের টি শার্ট', 'ড্রপ শোল্ডার', 't shirt', 'polo shirt', 'drop shoulder', 'cotton t shirt'].forEach(k => tagSet.add(k));
    }
    if (t.includes('pant') || t.includes('trouser') || t.includes('jeans') || t.includes('chino') || t.includes('sweatpant') || t.includes('gabardine')) {
      ['প্যান্ট', 'গ্যাবার্ডিন প্যান্ট', 'ছেলেদের প্যান্ট', 'ট্রাউজার', 'জিন্স প্যান্ট', 'men pant', 'gabardine pant', 'mens trouser', 'jeans pant'].forEach(k => tagSet.add(k));
    }
    if (t.includes('panjabi') || t.includes('punjabi')) {
      ['পাঞ্জাবি', 'পাঞ্জাবী কালেকশন', 'ছেলেদের পাঞ্জাবি', 'ঈদ কালেকশন', 'panjabi', 'punjabi', 'men panjabi', 'eid panjabi'].forEach(k => tagSet.add(k));
    }
    if (t.includes('shirt') && !t.includes('t-shirt') && !t.includes('tshirt')) {
      ['শার্ট', 'ফর্মাল শার্ট', 'ক্যাজুয়াল শার্ট', 'shirt', 'formal shirt', 'casual shirt'].forEach(k => tagSet.add(k));
    }
    if (t.includes('shoe') || t.includes('sneaker')) {
      ['জুতা', 'স্নিকার্স', 'ছেলেদের জুতা', 'জুতো', 'shoes', 'sneakers', 'casual shoes', 'running shoes'].forEach(k => tagSet.add(k));
    }
    if (t.includes('jersey')) {
      ['জার্সি', 'ফুটবল জার্সি', 'jersey', 'football jersey'].forEach(k => tagSet.add(k));
    }
  }

  // Women's Fashion
  if (categoryId === 'womens-fashion') {
    ['মেয়েদের ফ্যাশন', 'লেডিস কালেকশন', "women's fashion", 'ladies wear'].forEach(k => tagSet.add(k));
    if (t.includes('saree') || t.includes('sharee')) {
      ['শাড়ি', 'সিল্ক শাড়ি', 'জর্জেট শাড়ি', 'কাতান শাড়ি', 'saree', 'sharee', 'silk saree', 'party saree', 'eid saree'].forEach(k => tagSet.add(k));
    }
    if (t.includes('kurti') || t.includes('kameez') || t.includes('three piece')) {
      ['কুর্তি', 'থ্রি পিস', 'লেডিস কুর্তি', 'সালোয়ার কামিজ', 'kurti', 'three piece', 'salwar kameez'].forEach(k => tagSet.add(k));
    }
    if (t.includes('borka') || t.includes('abaya') || t.includes('hijab')) {
      ['বোরকা', 'আবায়া', 'হিজাব', 'লেডিস বোরকা', 'borka', 'abaya', 'hijab'].forEach(k => tagSet.add(k));
    }
    if (t.includes('pin') || t.includes('ring') || t.includes('earring') || t.includes('necklace')) {
      ['গহনা', 'নাকফুল', 'আংটি', 'কানের দুল', 'জুয়েলারি', 'nose pin', 'ring', 'earrings', 'jewelry'].forEach(k => tagSet.add(k));
    }
  }

  // Home & Living
  if (categoryId === 'home-living') {
    ['হোম ডেকর', 'ঘর সাজানো', 'হোম অ্যাপ্লায়েন্স', 'home decor', 'kitchen essentials'].forEach(k => tagSet.add(k));
    if (t.includes('pump') || t.includes('dispenser') || t.includes('water')) {
      ['ওয়াটার ডিসপেন্সার', 'পানির পাম্প', 'ইলেকট্রিক পাম্প', 'water pump', 'water dispenser'].forEach(k => tagSet.add(k));
    }
  }

  // Baby & Kids
  if (categoryId === 'baby-kids') {
    ['বাচ্চাদের জিনিস', 'শিশুদের খেলনা', 'বাচ্চাদের পোশাক', 'baby care', 'kids toy', 'baby clothes'].forEach(k => tagSet.add(k));
  }

  // Health & Beauty
  if (categoryId === 'health-beauty') {
    ['স্কিন কেয়ার', 'রূপচর্চা', 'সৌন্দর্য পণ্য', 'skincare', 'beauty product', 'face care'].forEach(k => tagSet.add(k));
  }

  // Color keywords
  if (Array.isArray(colors)) {
    colors.slice(0, 3).forEach(c => {
      if (c && c.name && !c.name.includes('Option') && !c.name.includes('Design')) {
        tagSet.add(c.name.toLowerCase());
      }
    });
  }

  // Add standard trust tags for Kintesi search
  tagSet.add('অনলাইন শপিং');
  tagSet.add('ক্যাশ অন ডেলিভারি');
  tagSet.add('Kintesi');

  // Strictly filter out any dropshipping leftover patterns
  const finalTags = Array.from(tagSet).filter(tag => {
    const s = String(tag).trim().toLowerCase();
    if (!s || s.length < 2) return false;
    if (/^ds-\d+/i.test(s)) return false;
    if (/^\d{3,6}$/.test(s)) return false;
    if (/^code\s*\d+/i.test(s)) return false;
    if (/^option\s*\d+/i.test(s)) return false;
    if (s.includes('mohasagor')) return false;
    return true;
  });

  return finalTags.slice(0, 18);
}

// Test sample on first 20 products
console.log('Testing category and keyword tagging on 20 products...\n');
for (let i = 0; i < 20; i++) {
  const p = catalog[i];
  const { category_id, sub_category, gender } = determineCategoryAndSub(p.title, p.category_id, p.brand);
  const newTags = generateRichTags(p.title, category_id, sub_category, p.brand, p.colors, p.specifications);
  console.log(`[${i + 1}] ${p.title.slice(0, 60)}...`);
  console.log(`    Original Cat: ${p.category_id} -> Fixed Cat: ${category_id} | Sub: ${sub_category}`);
  console.log(`    Tags (${newTags.length}): ${newTags.join(', ')}`);
  console.log('');
}

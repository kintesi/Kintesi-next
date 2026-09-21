import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMDIwNiwiZXhwIjoyMTA0NDk2MjA2fQ.7M3tSiIGGj2E0aG1JFm0bvHgWQ8024J5Pvuz2P58k8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function classifyProduct(title, currentCat, brand) {
  const t = (title || '').toLowerCase();

  // 1. Watches (Exclude wall clocks)
  if (
    (!t.includes('wall clock') && !t.includes('দেয়াল ঘড়ি')) &&
    (t.includes('watch') || t.includes('ঘড়ি') || t.includes('smartwatch') || t.includes('chronograph'))
  ) {
    const isWomen = t.includes('women') || t.includes('lady') || t.includes('ladies') || t.includes('girl') || t.includes('মহিলা') || t.includes('মেয়ে');
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

  // 2. Bags, Backpacks, Wallets, Luggage
  if (
    t.includes('backpack') ||
    t.includes('wallet') ||
    t.includes('purse') ||
    t.includes('handbag') ||
    t.includes('crossbody') ||
    t.includes('sling bag') ||
    t.includes('luggage') ||
    t.includes('trolley') ||
    t.includes('cardholder') ||
    t.includes('card holder') ||
    t.includes('clutch') ||
    t.includes('মানিব্যাগ') ||
    (t.includes('ব্যাগ') && !t.includes('স্লিপিং ব্যাগ')) ||
    (t.includes('bag') && !t.includes('punching bag') && !t.includes('sleeping bag') && !t.includes('bean bag'))
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
    t.includes('khimar') ||
    t.includes('palazzo') ||
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
    t.includes('bangle') ||
    t.includes('payel') ||
    t.includes('shita haar') ||
    t.includes('কটি') ||
    t.includes('শাড়ি') ||
    t.includes('কুর্তি') ||
    t.includes('কামিজ') ||
    t.includes('বোরকা') ||
    t.includes('হিজাব') ||
    t.includes('নাকফুল') ||
    t.includes('দুল') ||
    t.includes('হার') ||
    (t.includes('ring') && (t.includes('women') || t.includes('stone') || t.includes('gemstone') || t.includes('diamond') || t.includes('crystal') || t.includes('zircon') || t.includes('আংটি')))
  ) {
    const isJewelry = t.includes('pin') || t.includes('earring') || t.includes('necklace') || t.includes('pendant') || t.includes('bracelet') || t.includes('bangle') || t.includes('ring') || t.includes('haar') || t.includes('নাকফুল') || t.includes('দুল') || t.includes('হার') || t.includes('আংটি');
    const isSharee = t.includes('saree') || t.includes('sharee') || t.includes('শাড়ি');
    const isBorka = t.includes('borka') || t.includes('abaya') || t.includes('hijab') || t.includes('khimar') || t.includes('বোরকা') || t.includes('হিজাব');
    const isKurti = t.includes('kurti') || t.includes('kameez') || t.includes('three piece') || t.includes('থ্রি পিস') || t.includes('কটি') || t.includes('কুর্তি') || t.includes('কামিজ');

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
  if (
    t.includes('baby') ||
    t.includes('kid') ||
    t.includes('child') ||
    t.includes('toy') ||
    t.includes('doll') ||
    t.includes('talking tom') ||
    t.includes('বাচ্চা') ||
    t.includes('খেলনা') ||
    t.includes('diaper')
  ) {
    return {
      category_id: 'baby-kids',
      sub_category: t.includes('toy') || t.includes('doll') || t.includes('talking tom') || t.includes('game') || t.includes('খেলনা')
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
    t.includes('derma roller') ||
    t.includes('makeup') ||
    t.includes('lipstick') ||
    t.includes('wax') ||
    t.includes('soap') ||
    t.includes('scrub')
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
    t.includes('graphic card') ||
    t.includes('monitor') ||
    t.includes('gamepad') ||
    t.includes('controller') ||
    t.includes('drawing pad') ||
    t.includes('writing tablet')
  ) {
    return {
      category_id: 'computer-gaming',
      sub_category: t.includes('router') || t.includes('wi-fi') || t.includes('wifi')
        ? 'Routers & Networking Gear'
        : t.includes('keyboard') || t.includes('mouse')
        ? 'Mechanical Keyboards & Mice'
        : t.includes('projector') || t.includes('monitor')
        ? 'Gaming Monitors & Displays'
        : 'PC Components & Accessories',
      gender: 'Unisex',
    };
  }

  // 7. Gadgets & Electronics (Mobile, Cables, Chargers, Earbuds, Speakers, Trimmers)
  if (
    t.includes('cable') ||
    t.includes('charger') ||
    t.includes('charging') ||
    t.includes('adapter') ||
    t.includes('separator') ||
    t.includes('earbuds') ||
    t.includes('headphone') ||
    t.includes('earphone') ||
    t.includes('speaker') ||
    t.includes('power bank') ||
    t.includes('bluetooth') ||
    t.includes('tws') ||
    t.includes('usb') ||
    t.includes('type-c') ||
    t.includes('type c') ||
    t.includes('trimmer') ||
    t.includes('shaver') ||
    t.includes('hair dryer') ||
    t.includes('straightener') ||
    t.includes('mobile') ||
    t.includes('phone') ||
    t.includes('cooler') ||
    t.includes('radiator') ||
    t.includes('microphone') ||
    t.includes('mic') ||
    t.includes('battery') ||
    t.includes('torch') ||
    t.includes('strip light') ||
    t.includes('ring light')
  ) {
    return {
      category_id: 'gadgets-electronics',
      sub_category: t.includes('earbud') || t.includes('tws') || t.includes('headphone') || t.includes('earphone')
        ? 'Wireless Earbuds & TWS'
        : t.includes('speaker')
        ? 'Bluetooth Speakers'
        : t.includes('charger') || t.includes('charging') || t.includes('adapter') || t.includes('separator')
        ? 'Fast Chargers & Adapters'
        : t.includes('cable') || t.includes('usb') || t.includes('type-c')
        ? 'Cables, Converters & Hubs'
        : t.includes('power bank')
        ? 'Power Banks & Portable Batteries'
        : t.includes('mobile') || t.includes('phone')
        ? 'Smartphones & Feature Phones'
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
    t.includes('gabardine') ||
    t.includes('boxer') ||
    t.includes('undergarment') ||
    t.includes('sneaker') ||
    t.includes('shoe') ||
    t.includes('loafer') ||
    t.includes('sandal') ||
    t.includes('jersey') ||
    t.includes('katua') ||
    t.includes('fatua') ||
    t.includes('lungi') ||
    t.includes('kurta') ||
    t.includes('blazer') ||
    t.includes('belt') ||
    t.includes('gripper') ||
    t.includes('drop-shoulder') ||
    t.includes('drop shoulder') ||
    t.includes('men')
  ) {
    return {
      category_id: 'mens-fashion',
      sub_category: t.includes('hoodie') || t.includes('jacket') || t.includes('winter')
        ? 'Jackets, Hoodies & Winterwear'
        : t.includes('panjabi') || t.includes('punjabi') || t.includes('kurta') || t.includes('katua')
        ? 'Panjabi & Payjama'
        : t.includes('t-shirt') || t.includes('tshirt') || t.includes('polo') || t.includes('drop-shoulder') || t.includes('drop shoulder')
        ? 'T-Shirts & Polos'
        : t.includes('shirt')
        ? 'Casual & Formal Shirts'
        : t.includes('pant') || t.includes('trouser') || t.includes('jeans') || t.includes('chino') || t.includes('sweatpant') || t.includes('gabardine')
        ? 'Jeans, Chinos & Trousers'
        : t.includes('shoe') || t.includes('sneaker') || t.includes('loafer') || t.includes('sandal')
        ? "Men's Footwear & Sneakers"
        : 'Activewear & Sportswear',
      gender: 'Men',
    };
  }

  // 9. Home & Living (Cookware, Storage, Purifiers, Clocks, Decor, Tools)
  return {
    category_id: 'home-living',
    sub_category: t.includes('knife') || t.includes('cleaver') || t.includes('cookware') || t.includes('pan') || t.includes('cutter') || t.includes('chopper') || t.includes('scale')
      ? 'Cookware & Kitchen Tools'
      : t.includes('purifier') || t.includes('dispenser') || t.includes('pump')
      ? 'Water Purifiers & Dispensers'
      : t.includes('clock')
      ? 'Home Decor, Lights & Clocks'
      : 'Home & Kitchen Essentials',
    gender: 'Unisex',
  };
}

function generateCleanTags(title, categoryId, subCategory, brand, colors) {
  const tagSet = new Set();
  const t = (title || '').toLowerCase();

  // 1. Clean Title Words (Extract descriptive keywords)
  const stopWords = new Set([
    'with', 'from', 'this', 'that', 'your', 'and', 'for', 'the', 'pcs', 'pack', 'set',
    'free', 'best', 'high', 'quality', 'new', 'style', 'edition', 'premium', 'ultra',
    'super', 'pro', 'max', 'plus', 'mini', 'size', 'color', 'colour', 'design', 'original'
  ]);

  const words = t
    .replace(/[^\w\s\u0980-\u09FF-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !stopWords.has(w) && !/^\d+$/.test(w));

  words.slice(0, 8).forEach((w) => tagSet.add(w));

  // 2. Brand Keyword
  if (brand && brand !== 'Kintesi' && brand !== 'No Brand') {
    tagSet.add(brand.toLowerCase());
  }

  // 3. Category & Subcategory Specific Bilingual Semantic Keywords
  if (categoryId === 'watches-bags') {
    if (t.includes('watch') || t.includes('ঘড়ি') || t.includes('smartwatch') || t.includes('chronograph')) {
      ['ঘড়ি', 'হাত ঘড়ি', 'রিস্ট ওয়াচ', 'watch', 'wrist watch'].forEach((k) => tagSet.add(k));
      if (t.includes('smart') || t.includes('fitness')) {
        ['স্মার্ট ওয়াচ', 'স্মার্টওয়াচ', 'ফিটনেস ট্র্যাকার', 'smart watch', 'fitness tracker'].forEach((k) => tagSet.add(k));
      } else {
        ['অ্যানালগ ঘড়ি', 'কোয়ার্টজ ঘড়ি', 'analog watch', 'quartz watch', 'sports watch'].forEach((k) => tagSet.add(k));
      }
      if (t.includes('wheel') || t.includes('rim')) {
        ['কার হুইল ঘড়ি', 'হুইল ওয়াচ', 'wheel watch', 'car rim watch'].forEach((k) => tagSet.add(k));
      }
      if (t.includes('men')) ['ছেলেদের ঘড়ি', 'men watch', 'mens watch'].forEach((k) => tagSet.add(k));
      if (t.includes('women') || t.includes('lady') || t.includes('ladies')) ['মেয়েদের ঘড়ি', 'লেডিস ঘড়ি', 'women watch', 'ladies watch'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('wallet') || t.includes('মানিব্যাগ') || t.includes('cardholder')) {
      ['মানিব্যাগ', 'লেদার ওয়ালেট', 'চামড়ার মানিব্যাগ', 'কার্ডহোল্ডার', 'wallet', 'leather wallet', 'men wallet', 'card holder'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('backpack') || t.includes('bag') || t.includes('ব্যাগ') || t.includes('purse')) {
      ['ব্যাগ', 'ব্যাকপ্যাক', 'ল্যাপটপ ব্যাগ', 'লেডিস ব্যাগ', 'backpack', 'laptop bag', 'travel bag'].forEach((k) => tagSet.add(k));
    }
  }

  if (categoryId === 'gadgets-electronics') {
    ['গ্যাজেট', 'ইলেকট্রনিক্স', 'gadget', 'electronics'].forEach((k) => tagSet.add(k));
    if (t.includes('charger') || t.includes('charging') || t.includes('adapter') || t.includes('separator')) {
      ['চার্জার', 'ফাস্ট চার্জার', 'মোবাইল চার্জার', 'charger', 'fast charger', 'fast charging'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('cable') || t.includes('usb') || t.includes('type-c') || t.includes('type c')) {
      ['চার্জিং কেবল', 'ইউএসবি কেবল', 'টাইপ সি কেবল', 'usb cable', 'type c cable', 'charging cable'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('earbud') || t.includes('tws') || t.includes('headphone') || t.includes('earphone')) {
      ['ইয়ারফোন', 'হেডফোন', 'ব্লুটুথ হেডফোন', 'এয়ারবাডস', 'earbuds', 'wireless earbuds', 'tws', 'bluetooth headphone'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('speaker')) {
      ['স্পিকার', 'ব্লুটুথ স্পিকার', 'সাউন্ড বক্স', 'bluetooth speaker', 'wireless speaker', 'sound box'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('power bank')) {
      ['পাওয়ার ব্যাংক', 'পোর্টেবল চার্জার', 'power bank', 'portable charger'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('trimmer') || t.includes('shaver')) {
      ['ট্রিমার', 'দাড়ি কাটার মেশিন', 'শেভার', 'trimmer', 'shaver', 'hair trimmer'].forEach((k) => tagSet.add(k));
    }
  }

  if (categoryId === 'computer-gaming') {
    ['কম্পিউটার এক্সেসরিজ', 'computer accessories', 'gaming'].forEach((k) => tagSet.add(k));
    if (t.includes('router') || t.includes('wi-fi') || t.includes('wifi')) {
      ['রাউটার', 'ওয়াইফাই রাউটার', 'router', 'wifi router', 'wireless router'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('projector')) {
      ['প্রজেক্টর', 'স্মার্ট প্রজেক্টর', 'মিনি প্রজেক্টর', 'projector', 'smart projector', 'mini projector'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('keyboard') || t.includes('mouse')) {
      ['কীবোর্ড', 'মাউস', 'keyboard', 'mouse', 'gaming mouse'].forEach((k) => tagSet.add(k));
    }
  }

  if (categoryId === 'mens-fashion') {
    ['ছেলেদের ফ্যাশন', 'ছেলেদের পোশাক', "men's fashion", 'mens wear'].forEach((k) => tagSet.add(k));
    if (t.includes('hoodie') || t.includes('winter') || t.includes('jacket')) {
      ['হুডি', 'শীতের পোশাক', 'উইন্টার কালেকশন', 'জ্যাকেট', 'winter hoodie', 'hoodie bd', 'jacket'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('t-shirt') || t.includes('tshirt') || t.includes('polo') || t.includes('drop-shoulder') || t.includes('drop shoulder')) {
      ['টি শার্ট', 'পোলো শার্ট', 'ছেলেদের টি শার্ট', 'ড্রপ শোল্ডার', 't shirt', 'polo shirt', 'drop shoulder'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('pant') || t.includes('trouser') || t.includes('jeans') || t.includes('chino') || t.includes('gabardine')) {
      ['প্যান্ট', 'গ্যাবার্ডিন প্যান্ট', 'ছেলেদের প্যান্ট', 'ট্রাউজার', 'men pant', 'gabardine pant', 'mens trouser'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('panjabi') || t.includes('punjabi') || t.includes('katua')) {
      ['পাঞ্জাবি', 'পাঞ্জাবী কালেকশন', 'ছেলেদের পাঞ্জাবি', 'ঈদ কালেকশন', 'panjabi', 'men panjabi'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('shirt') && !t.includes('t-shirt') && !t.includes('tshirt')) {
      ['শার্ট', 'ফর্মাল শার্ট', 'ক্যাজুয়াল শার্ট', 'shirt', 'formal shirt', 'casual shirt'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('shoe') || t.includes('sneaker') || t.includes('loafer')) {
      ['জুতা', 'স্নিকার্স', 'ছেলেদের জুতা', 'shoes', 'sneakers', 'mens shoes'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('jersey')) {
      ['জার্সি', 'ফুটবল জার্সি', 'jersey', 'football jersey'].forEach((k) => tagSet.add(k));
    }
  }

  if (categoryId === 'womens-fashion') {
    ['মেয়েদের ফ্যাশন', 'লেডিস কালেকশন', "women's fashion", 'ladies wear'].forEach((k) => tagSet.add(k));
    if (t.includes('saree') || t.includes('sharee') || t.includes('শাড়ি')) {
      ['শাড়ি', 'সিল্ক শাড়ি', 'জর্জেট শাড়ি', 'saree', 'sharee', 'silk saree', 'party saree'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('kurti') || t.includes('kameez') || t.includes('three piece') || t.includes('কুর্তি') || t.includes('কামিজ')) {
      ['কুর্তি', 'থ্রি পিস', 'লেডিস কুর্তি', 'kurti', 'three piece', 'salwar kameez'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('borka') || t.includes('abaya') || t.includes('hijab') || t.includes('khimar') || t.includes('বোরকা') || t.includes('হিজাব')) {
      ['বোরকা', 'আবায়া', 'হিজাব', 'খিমার', 'borka', 'abaya', 'hijab', 'khimar'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('pin') || t.includes('ring') || t.includes('earring') || t.includes('necklace') || t.includes('নাকফুল') || t.includes('দুল') || t.includes('হার') || t.includes('আংটি')) {
      ['গহনা', 'নাকফুল', 'আংটি', 'কানের দুল', 'জুয়েলারি', 'nose pin', 'ring', 'earrings', 'jewelry'].forEach((k) => tagSet.add(k));
    }
  }

  if (categoryId === 'home-living') {
    ['হোম ডেকর', 'ঘর সাজানো', 'হোম অ্যাপ্লায়েন্স', 'home decor', 'kitchen essentials'].forEach((k) => tagSet.add(k));
    if (t.includes('knife') || t.includes('cleaver') || t.includes('cutter')) {
      ['ছুরি', 'কিচেন নাইফ', 'kitchen knife', 'chef knife'].forEach((k) => tagSet.add(k));
    }
    if (t.includes('clock')) {
      ['দেয়াল ঘড়ি', 'ওয়াল ক্লক', 'wall clock', '3d wall clock'].forEach((k) => tagSet.add(k));
    }
  }

  if (categoryId === 'baby-kids') {
    ['বাচ্চাদের জিনিস', 'শিশুদের খেলনা', 'baby care', 'kids toy', 'baby clothes'].forEach((k) => tagSet.add(k));
  }

  if (categoryId === 'health-beauty') {
    ['স্কিন কেয়ার', 'রূপচর্চা', 'সৌন্দর্য পণ্য', 'skincare', 'beauty product', 'face care'].forEach((k) => tagSet.add(k));
  }

  // 4. Color Keywords (Add if valid human color name)
  if (Array.isArray(colors)) {
    colors.slice(0, 3).forEach((c) => {
      if (c && c.name && !c.name.includes('Option') && !c.name.includes('Design')) {
        tagSet.add(c.name.toLowerCase());
      }
    });
  }

  // 5. General Search Booster Tags
  tagSet.add('অনলাইন শপিং');
  tagSet.add('ক্যাশ অন ডেলিভারি');
  tagSet.add('Kintesi');

  // 6. Strict Sanitization: Remove ANY dropshipping patterns
  const finalTags = Array.from(tagSet).filter((tag) => {
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

async function main() {
  console.log('🔄 Loading dropshippingCatalog.json...');
  const jsonPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  const catalog = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log(`Processing all ${catalog.length} products...`);
  const catDistribution = {};

  for (let i = 0; i < catalog.length; i++) {
    const p = catalog[i];
    const { category_id, sub_category, gender } = classifyProduct(p.title, p.category_id, p.brand);
    const tags = generateCleanTags(p.title, category_id, sub_category, p.brand, p.colors);

    p.category_id = category_id;
    p.sub_category = sub_category;
    p.gender = gender;
    p.tags = tags;
    p.specifications = {
      ...(typeof p.specifications === 'object' && p.specifications !== null ? p.specifications : {}),
      sub_category: sub_category,
    };

    catDistribution[category_id] = (catDistribution[category_id] || 0) + 1;
  }

  console.log('\n📊 New Category Distribution:');
  console.log(catDistribution);

  // Save to JSON catalog
  console.log('\n💾 Writing updated catalog to dropshippingCatalog.json...');
  fs.writeFileSync(jsonPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('✅ dropshippingCatalog.json updated successfully!');

  // Sync to Supabase in batches
  console.log('\n⚡ Syncing categories, gender, specifications, and tags to Supabase...');
  const BATCH = 35;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < catalog.length; i += BATCH) {
    const chunk = catalog.slice(i, i + BATCH);
    await Promise.all(
      chunk.map(async (p) => {
        const { error } = await supabase
          .from('products')
          .update({
            category_id: p.category_id,
            gender: p.gender,
            tags: p.tags,
            specifications: p.specifications,
            updated_at: new Date().toISOString(),
          })
          .eq('id', p.id);

        if (error) {
          console.error(`Error updating product ${p.id}:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      })
    );

    if ((i + BATCH) % 200 === 0 || i + BATCH >= catalog.length) {
      console.log(`  Synced ${Math.min(i + BATCH, catalog.length)} / ${catalog.length} products to Supabase...`);
    }
  }

  console.log(`\n🎉 COMPLETED! All ${successCount} products verified, categorized, and tagged in Supabase with ${errorCount} errors!`);
}

main().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMDIwNiwiZXhwIjoyMTA0NDk2MjA2fQ.7M3tSiIGGj2E0aG1JFm0bvHgWQ8024J5Pvuz2P58k8s';

const DROPSHIPPING_CONFIG = {
  API_KEY: 'A8niclztH9JtzS4t',
  API_SECRET: '2ff380917a11d3a7c97bcf6dddfb8adf38194c7d6b726ab12c4d0d5fb136fef8',
  BASE_URL: 'https://mohasagor.com.bd/api/reseller/product',
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function slugify(text) {
  return (text || 'product')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapCategory(catRaw, titleRaw) {
  const cat = (catRaw || '').toLowerCase();
  const title = (titleRaw || '').toLowerCase();

  if (
    cat.includes('women') ||
    title.includes('saree') ||
    title.includes('sharee') ||
    title.includes('kurti') ||
    title.includes('hijab') ||
    title.includes('borka') ||
    title.includes('abaya') ||
    title.includes('lehenga') ||
    title.includes('bra') ||
    title.includes('gown')
  ) {
    return {
      category_id: 'womens-fashion',
      sub_category: title.includes('saree') || title.includes('sharee')
        ? 'Sharee'
        : title.includes('kurti') || title.includes('kameez')
        ? 'Salwar Kameez & Kurtis'
        : title.includes('borka') || title.includes('abaya') || title.includes('hijab')
        ? 'Borka, Abaya & Hijab'
        : title.includes('bag')
        ? 'Bags & Clutches'
        : "Women's Footwear & Heels",
    };
  }

  if (
    cat.includes('men') ||
    cat.includes('winter') ||
    title.includes('hoodie') ||
    title.includes('jacket') ||
    title.includes('panjabi') ||
    title.includes('shirt') ||
    title.includes('t-shirt') ||
    title.includes('polo') ||
    title.includes('trouser') ||
    title.includes('jeans')
  ) {
    return {
      category_id: 'mens-fashion',
      sub_category: title.includes('hoodie') || title.includes('jacket') || cat.includes('winter')
        ? 'Jackets, Hoodies & Winterwear'
        : title.includes('panjabi')
        ? 'Panjabi & Payjama'
        : title.includes('polo') || title.includes('t-shirt') || title.includes('tshirt')
        ? 'T-Shirts & Polos'
        : title.includes('shirt')
        ? 'Casual & Formal Shirts'
        : title.includes('shoe') || title.includes('sneaker')
        ? "Men's Footwear & Sneakers"
        : 'Activewear & Sportswear',
    };
  }

  if (
    cat.includes('gadget') ||
    cat.includes('electronic') ||
    cat.includes('watch') ||
    title.includes('charger') ||
    title.includes('cable') ||
    title.includes('earbuds') ||
    title.includes('tws') ||
    title.includes('headphone') ||
    title.includes('speaker') ||
    title.includes('bluetooth') ||
    title.includes('power bank') ||
    title.includes('smart watch') ||
    title.includes('watch')
  ) {
    return {
      category_id: 'gadgets-electronics',
      sub_category: title.includes('watch') || cat.includes('watch')
        ? 'Smart Watches'
        : title.includes('headphone') || title.includes('earbuds') || title.includes('tws')
        ? 'Audio & Headphones'
        : title.includes('charger') || title.includes('power bank') || title.includes('cable')
        ? 'Smartphones & Accessories'
        : 'Gadgets & Electronics',
    };
  }

  if (
    cat.includes('computer') ||
    cat.includes('gaming') ||
    title.includes('mouse') ||
    title.includes('keyboard') ||
    title.includes('laptop') ||
    title.includes('usb')
  ) {
    return {
      category_id: 'computer-gaming',
      sub_category: 'Mechanical Keyboards & Mice',
    };
  }

  if (
    cat.includes('home') ||
    cat.includes('lifestyle') ||
    cat.includes('kitchen') ||
    title.includes('light') ||
    title.includes('lamp') ||
    title.includes('bed') ||
    title.includes('pillow') ||
    title.includes('cooker') ||
    title.includes('blender') ||
    title.includes('mop')
  ) {
    return {
      category_id: 'home-living',
      sub_category: title.includes('light') || title.includes('lamp')
        ? 'Home Decor, Lights & Lamps'
        : title.includes('blender') || title.includes('cook') || title.includes('kitchen')
        ? 'Cookware & Non-Stick Pans'
        : 'Cleaning Tools & Organizers',
    };
  }

  if (
    cat.includes('kid') ||
    cat.includes('baby') ||
    title.includes('toy') ||
    title.includes('baby') ||
    title.includes('doll')
  ) {
    return {
      category_id: 'baby-kids',
      sub_category: 'Baby Toys & Games',
    };
  }

  if (
    cat.includes('beauty') ||
    cat.includes('health') ||
    title.includes('serum') ||
    title.includes('cream') ||
    title.includes('oil') ||
    title.includes('perfume') ||
    title.includes('hair')
  ) {
    return {
      category_id: 'health-beauty',
      sub_category: title.includes('hair')
        ? 'Hair Care, Shampoos & Oils'
        : title.includes('perfume') || title.includes('attar')
        ? 'Perfumes, Attars & Body Sprays'
        : 'Serums, Creams & Moisturizers',
    };
  }

  return {
    category_id: 'mens-fashion',
    sub_category: 'General Accessories',
  };
}

function generateKeywords(title, categoryName, subCategory, productCode, brand) {
  const tags = new Set();
  const lowerTitle = (title || '').toLowerCase();

  // 1. Clean words from title
  const words = lowerTitle
    .replace(/[^\w\s\u0980-\u09FF-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !['with', 'from', 'this', 'that', 'your', 'and', 'for', 'the'].includes(w));
  
  words.slice(0, 8).forEach((w) => tags.add(w));

  // 2. Add category and sub-category
  if (categoryName) tags.add(categoryName.toLowerCase());
  if (subCategory) tags.add(subCategory.toLowerCase());

  // 3. Product code / SKU
  if (productCode) {
    tags.add(`ds-${productCode}`);
    tags.add(String(productCode));
    tags.add(`code ${productCode}`);
  }

  // 4. Brand
  if (brand && brand !== 'Kintesi') {
    tags.add(brand.toLowerCase());
  }

  // 5. Intelligent Bengali + English semantic mapping
  if (lowerTitle.includes('hoodie') || lowerTitle.includes('winter') || lowerTitle.includes('jacket')) {
    ['হুডি', 'শীতের পোশাক', 'উইন্টার কালেকশন', 'হুডি জ্যাকেট', 'জ্যাকেট', 'winter hoodie', 'hoodie bd'].forEach((t) => tags.add(t));
  }
  if (lowerTitle.includes('charger') || lowerTitle.includes('battery') || lowerTitle.includes('adapter')) {
    ['চার্জার', 'ব্যাটারি চার্জার', 'ফাস্ট চার্জার', 'মোবাইল চার্জার', 'battery charger', 'fast charger'].forEach((t) => tags.add(t));
  }
  if (lowerTitle.includes('watch') || lowerTitle.includes('smartwatch')) {
    ['ঘড়ি', 'স্মার্ট ওয়াচ', 'হাত ঘড়ি', 'স্মার্ট ওয়াচ কালেকশন', 'smart watch', 'wrist watch'].forEach((t) => tags.add(t));
  }
  if (lowerTitle.includes('earbuds') || lowerTitle.includes('headphone') || lowerTitle.includes('earphone') || lowerTitle.includes('tws')) {
    ['ইয়ারফোন', 'হেডফোন', 'ব্লুটুথ ইয়ারফোন', 'এয়ারবাডস', 'tws earbuds', 'wireless headphone'].forEach((t) => tags.add(t));
  }
  if (lowerTitle.includes('shirt') || lowerTitle.includes('polo') || lowerTitle.includes('t-shirt') || lowerTitle.includes('tshirt')) {
    ['টি শার্ট', 'পোলো শার্ট', 'ছেলেদের টি শার্ট', 'শার্ট', 't shirt', 'polo shirt'].forEach((t) => tags.add(t));
  }
  if (lowerTitle.includes('panjabi')) {
    ['পাঞ্জাবি', 'পাঞ্জাবী কালেকশন', 'ঈদ কালেকশন', 'panjabi', 'men panjabi'].forEach((t) => tags.add(t));
  }
  if (lowerTitle.includes('saree') || lowerTitle.includes('sharee')) {
    ['শাড়ি', 'সিল্ক শাড়ি', 'জর্জেট শাড়ি', 'কাতান শাড়ি', 'saree', 'sharee collection'].forEach((t) => tags.add(t));
  }
  if (lowerTitle.includes('kurti') || lowerTitle.includes('salwar') || lowerTitle.includes('kameez')) {
    ['কুর্তি', 'থ্রি পিস', 'লেডিস কুর্তি', 'kurti', 'three piece'].forEach((t) => tags.add(t));
  }
  if (lowerTitle.includes('abaya') || lowerTitle.includes('borka') || lowerTitle.includes('hijab')) {
    ['বোরকা', 'আবায়া', 'হিজাব', 'লেডিস বোরকা', 'abaya', 'borka', 'hijab'].forEach((t) => tags.add(t));
  }
  if (lowerTitle.includes('bag') || lowerTitle.includes('backpack') || lowerTitle.includes('wallet')) {
    ['ব্যাগ', 'লেডিস ব্যাগ', 'ব্যাকপ্যাক', 'মানিব্যাগ', 'leather wallet', 'backpack'].forEach((t) => tags.add(t));
  }
  if (lowerTitle.includes('shoe') || lowerTitle.includes('sneaker') || lowerTitle.includes('sandal')) {
    ['জুতা', 'স্নিকার্স', 'জুতো', 'ছেলেদের জুতা', 'sneakers', 'mens shoes'].forEach((t) => tags.add(t));
  }
  if (lowerTitle.includes('light') || lowerTitle.includes('lamp') || lowerTitle.includes('led')) {
    ['লাইট', 'ল্যাম্প', 'রুম ডেকোর লাইট', 'এলইডি লাইট', 'led light'].forEach((t) => tags.add(t));
  }
  if (lowerTitle.includes('kitchen') || lowerTitle.includes('blender') || lowerTitle.includes('cooker') || lowerTitle.includes('pan')) {
    ['কিচেন গ্যাজেট', 'রান্নাঘরের জিনিস', 'ব্লেন্ডার', 'kitchen gadget'].forEach((t) => tags.add(t));
  }
  if (lowerTitle.includes('baby') || lowerTitle.includes('kid') || lowerTitle.includes('toy')) {
    ['বাচ্চাদের খেলনা', 'টয়', 'বেবি প্রোডাক্ট', 'kids toy'].forEach((t) => tags.add(t));
  }
  if (lowerTitle.includes('beauty') || lowerTitle.includes('serum') || lowerTitle.includes('cream') || lowerTitle.includes('lotion')) {
    ['বিউটি প্রোডাক্ট', 'স্কিন কেয়ার', 'ফেসিয়াল ক্রিম', 'skin care', 'beauty cream'].forEach((t) => tags.add(t));
  }

  // 6. Universal high-ranking e-commerce tags
  ['অনলাইন শপিং', 'ক্যাশ অন ডেলিভারি', 'Kintesi'].forEach((t) => tags.add(t));

  return Array.from(tags).slice(0, 15);
}

function cleanHtmlDescription(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchPage(page) {
  const url = `${DROPSHIPPING_CONFIG.BASE_URL}?page=${page}`;
  const res = await fetch(url, {
    headers: {
      'api-key': DROPSHIPPING_CONFIG.API_KEY,
      'secret-key': DROPSHIPPING_CONFIG.API_SECRET,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch page ${page}: HTTP ${res.status}`);
  }

  return await res.json();
}

async function main() {
  console.log('🚀 Starting Dropshipping BD Full Catalog Import...');
  console.log('Connecting to Dropshipping BD API (https://mohasagor.com.bd)...');

  // Step 1: Fetch Page 1 to know total pages
  const firstPage = await fetchPage(1);
  const totalProducts = firstPage.total || 2951;
  const lastPage = firstPage.last_page || 15;
  console.log(`📊 Catalog Stats: Total Products = ${totalProducts}, Pages = ${lastPage}`);

  const allRawProducts = [...(firstPage.products || [])];

  // Step 2: Fetch remaining pages
  for (let p = 2; p <= lastPage; p++) {
    try {
      console.log(`📥 Fetching page ${p} of ${lastPage}...`);
      const pageData = await fetchPage(p);
      if (pageData && Array.isArray(pageData.products)) {
        allRawProducts.push(...pageData.products);
      }
      // Small delay to be polite to the upstream API
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      console.warn(`⚠️ Error on page ${p}:`, err.message, '- Retrying once...');
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const retryData = await fetchPage(p);
        if (retryData && Array.isArray(retryData.products)) {
          allRawProducts.push(...retryData.products);
        }
      } catch (retryErr) {
        console.error(`❌ Failed page ${p} after retry:`, retryErr.message);
      }
    }
  }

  console.log(`✅ Total raw products retrieved: ${allRawProducts.length}`);

  // Step 3: Transform & normalize all products
  const transformedProducts = [];
  const usedSlugs = new Set();

  for (let i = 0; i < allRawProducts.length; i++) {
    const raw = allRawProducts[i];
    if (!raw || !raw.name) continue;

    const prodIdNum = Number(raw.id || i + 1);
    const codeNum = raw.product_code || prodIdNum;

    // UUID formatted
    const idHex = String(codeNum || prodIdNum).padStart(12, '0').slice(-12);
    const uuid = `00000000-0000-4000-8000-${idHex}`;

    // Unique Slug
    let baseSlug = slugify(raw.slug || raw.name);
    let finalSlug = `${baseSlug}-${codeNum}`;
    let slugCounter = 1;
    while (usedSlugs.has(finalSlug)) {
      finalSlug = `${baseSlug}-${codeNum}-${slugCounter++}`;
    }
    usedSlugs.add(finalSlug);

    // Pricing
    const retail = Number(raw.price) > 0
      ? Number(raw.price)
      : Number(raw.sale_price) > 0
      ? Math.round(Number(raw.sale_price) * 1.4)
      : 500;
    
    const wholesale = Number(raw.sale_price) > 0 ? Number(raw.sale_price) : Math.round(retail * 0.7);

    // Markup over retail: "retail er theke samanno kiso price besi rekhe"
    const markup = retail <= 300 ? 20 : retail <= 800 ? 30 : retail <= 1500 ? 50 : 80;
    const sellingPrice = retail + markup; // discount_price (the final customer price)

    // 7% to 10% discount: "7 - 10 % discount add kore dibe sob golo te"
    const discPercent = 7 + (prodIdNum % 4); // 7, 8, 9, or 10%
    const rawRegular = Math.round(sellingPrice / (1 - discPercent / 100));
    const regularPrice = Math.ceil(rawRegular / 5) * 5; // e.g. 545, 580, etc.

    // Images
    const images = [];
    if (raw.thumbnail_img) {
      let tUrl = raw.thumbnail_img.trim();
      if (!tUrl.startsWith('http')) {
        tUrl = `https://mohasagor.com.bd/public/storage/images/products/${tUrl}`;
      }
      images.push(tUrl);
    }

    if (Array.isArray(raw.product_images)) {
      raw.product_images.forEach((img) => {
        let pUrl = (img?.product_image || '').trim();
        if (pUrl) {
          if (!pUrl.startsWith('http')) {
            pUrl = `https://mohasagor.com.bd/public/storage/images/products/${pUrl}`;
          }
          if (!images.includes(pUrl)) images.push(pUrl);
        }
      });
    }

    if (images.length === 0) {
      images.push('/logo.webp');
    }

    // Category
    const { category_id, sub_category } = mapCategory(raw.category, raw.name);

    // Brand detection
    const lowerName = raw.name.toLowerCase();
    let detectedBrand = 'Kintesi';
    const knownBrands = ['Sony', 'Apple', 'Nike', 'Adidas', 'Xiaomi', 'Samsung', 'Lenovo', 'Remax', 'Havit', 'Baseus', 'Anker', 'Realme', 'Casio', 'Curren', 'Naviforce'];
    for (const b of knownBrands) {
      if (lowerName.includes(b.toLowerCase())) {
        detectedBrand = b;
        break;
      }
    }

    // Variants
    const customAttributes = [];
    if (Array.isArray(raw.product_variants) && raw.product_variants.length > 0) {
      raw.product_variants.forEach((v) => {
        if (v && v.variant) {
          customAttributes.push({
            attribute: v.attribute || 'Variant',
            name: String(v.variant).trim(),
            price_offset: 0,
            stock: 50,
          });
        }
      });
    }

    // Keywords & Ranking Tags
    const tags = generateKeywords(raw.name, raw.category, sub_category, codeNum, detectedBrand);

    // Clean Description
    const plainDesc = cleanHtmlDescription(raw.details);

    transformedProducts.push({
      id: uuid,
      title: raw.name.trim(),
      slug: finalSlug,
      description: plainDesc || raw.name.trim(),
      price: regularPrice,
      discount_price: sellingPrice,
      category_id: category_id,
      stock: Number(raw.stock) > 0 ? Number(raw.stock) : 50,
      images: images,
      rating: 4.8 + ((prodIdNum % 3) * 0.1),
      review_count: 5 + (prodIdNum % 20),
      is_featured: i < 30, // Top 30 items featured
      is_trending: i % 10 === 0,
      brand: detectedBrand,
      sku: `DS-${codeNum}`,
      tags: tags,
      sizes: [],
      colors: [],
      custom_attributes: customAttributes,
      dropshipping_url: `https://dropshipping.com.bd/product/${raw.slug || codeNum}`,
      allowed_payment_methods: ['cod', 'bkash', 'nagad', 'rocket', 'bank'],
      specifications: {
        wholesale_cost: wholesale,
        retail_suggested: retail,
        profit_margin: sellingPrice - wholesale,
        discount_percent: discPercent,
        dropshipping_id: raw.id,
        sub_category: sub_category,
        spec_mode: category_id.includes('gadget') ? 'gadgets' : category_id.includes('fashion') ? 'fashion' : 'none',
      },
      origin: 'Made in Bangladesh',
      gender: category_id === 'womens-fashion' ? 'Women' : category_id === 'mens-fashion' ? 'Men' : 'Unisex',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  console.log(`✨ Transformed ${transformedProducts.length} products ready for database.`);

  // Step 4: Save local JSON cache as well for instant frontend access & backup
  const outJsonPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  fs.writeFileSync(outJsonPath, JSON.stringify(transformedProducts, null, 2), 'utf-8');
  console.log(`💾 Saved catalog JSON cache to ${outJsonPath} (${(fs.statSync(outJsonPath).size / 1024 / 1024).toFixed(2)} MB)`);

  // Step 5: Upsert into Supabase in batches of 75 items
  const BATCH_SIZE = 75;
  const totalBatches = Math.ceil(transformedProducts.length / BATCH_SIZE);
  console.log(`⚡ Inserting into Supabase Database in ${totalBatches} batches...`);

  let insertedCount = 0;
  let failedCount = 0;

  for (let b = 0; b < totalBatches; b++) {
    const chunk = transformedProducts.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    try {
      const { data, error } = await supabase
        .from('products')
        .upsert(chunk, { onConflict: 'slug' });

      if (error) {
        console.warn(`⚠️ Batch ${b + 1}/${totalBatches} error:`, error.message);
        // Fallback: insert one by one in this chunk to rescue valid items
        for (const item of chunk) {
          const { error: singleErr } = await supabase.from('products').upsert(item, { onConflict: 'slug' });
          if (!singleErr) insertedCount++;
          else failedCount++;
        }
      } else {
        insertedCount += chunk.length;
        if ((b + 1) % 5 === 0 || b === totalBatches - 1) {
          console.log(` Progress: ${insertedCount}/${transformedProducts.length} items saved (${Math.round((insertedCount / transformedProducts.length) * 100)}%)`);
        }
      }
    } catch (batchErr) {
      console.error(`❌ Batch ${b + 1} fatal error:`, batchErr.message);
      failedCount += chunk.length;
    }
  }

  console.log('\n==========================================');
  console.log(`🎉 IMPORT COMPLETE!`);
  console.log(`✅ Successfully saved: ${insertedCount} products`);
  if (failedCount > 0) console.log(`⚠️ Failed items: ${failedCount}`);
  console.log('==========================================');
}

main().catch((err) => {
  console.error('Fatal import error:', err);
  process.exit(1);
});

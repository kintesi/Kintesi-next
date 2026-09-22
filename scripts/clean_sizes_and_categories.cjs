const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MjAyMDYsImV4cCI6MjEwNDQ5NjIwNn0.kDSjx7F7tYhDwbL-LbYANEEuDiQuclKnFp5mwJc6Y0A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const catalogPath = path.resolve('src/data/dropshippingCatalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Regex to identify products that are DEFINITELY apparel
const MENS_APPAREL_REGEX = /\b(panjabi|punjabi|payjama|pyjama|shirt|t-shirt|polo|trouser|trousers|pant|pants|jeans|hoodie|jacket|tracksuit|boxer|lungi|suit|blazer|katua|sweatpant)\b/i;
const WOMENS_APPAREL_REGEX = /\b(saree|shari|kurti|kurtis|borka|burqa|abaya|hijab|salwar|kameez|three\s*piece|3\s*piece|lehenga|gown|plazo|palazzo|khimar|petticoat)\b/i;
const KIDS_APPAREL_REGEX = /\b(baby|kids|children|child)\b.*\b(hoodie|t-shirt|t\s*shirt|shirt|pant|jacket|romper|frock|dress|set|raincoat|clothing|wear)\b/i;

// Regex to identify products that are DEFINITELY NON-APPAREL
const DEFINITELY_NON_APPAREL_REGEX = /\b(tumbler|cup|mug|bottle|flask|tasbih|fan|charger|cable|adapter|powerbank|battery|mouse|keyboard|headphone|earphone|airpod|earbud|speaker|light|lamp|bulb|torch|flashlight|tripod|stand|holder|bracket|shelf|rack|organizer|knife|knives|pan|pans|pot|cooker|kettle|blender|grinder|trimmer|shaver|dryer|curler|iron|remover|roller|brush|sponge|soap|shampoo|oil|cream|serum|lotion|honey|tea|coffee|snack|ghee|spice|cleaner|pump|scale|meter|toy|robot|watch|clock|strap|case|cover|camera|router|wallet|cardholder|ring|necklace|earring|jewelry|jewellery|bangle|pendant|sunglass|glasses|specs|drone|helicopter|car|lock|alarm|mat|sheet|blanket|pillow|cushion)\b/i;

let fixedCount = 0;
let sizesCleared = 0;
let reCategorized = 0;
let kidsClothingFixed = 0;
const modifiedProducts = [];

for (const p of catalog) {
  let modified = false;
  const title = p.title || '';

  // 1. Fix Stanley Tumbler specific bug
  if (title.includes('Stanley The Quencher')) {
    p.sizes = [];
    p.custom_attributes = [];
    p.slug = 'stanley-the-quencher-h2-0-flowstate-tumbler';
    p.category_id = 'home-living';
    p.sub_category = 'Home & Kitchen Essentials';
    if (!p.specifications) p.specifications = {};
    p.specifications.sub_category = 'Home & Kitchen Essentials';
    p.tags = ['stanley', 'quencher', 'tumbler', 'home-living', 'kitchen'];
    modified = true;
    sizesCleared++;
  }

  // 2. Fix Apparel that got miscategorized into home-living or electronic
  if (p.category_id === 'home-living' || p.category_id === 'lifestyle-hobbies') {
    if (KIDS_APPAREL_REGEX.test(title)) {
      p.category_id = 'mother-baby';
      p.sub_category = 'Kids Clothing & Fashion';
      if (!p.specifications) p.specifications = {};
      p.specifications.sub_category = 'Kids Clothing & Fashion';
      modified = true;
      reCategorized++;
    } else if (WOMENS_APPAREL_REGEX.test(title)) {
      p.category_id = 'womens-fashion';
      if (!p.sub_category) p.sub_category = 'Western Wear & Tops';
      modified = true;
      reCategorized++;
    } else if (MENS_APPAREL_REGEX.test(title) && !/bed|sheet|cover|curtain/i.test(title)) {
      p.category_id = 'mens-fashion';
      if (!p.sub_category) p.sub_category = 'Casual & Formal Shirts';
      modified = true;
      reCategorized++;
    }
  }

  // 3. Fix Kids clothing subcategories (was 'Toys, Walkers & Learning')
  if (p.category_id === 'mother-baby' || KIDS_APPAREL_REGEX.test(title)) {
    if (KIDS_APPAREL_REGEX.test(title) || /baby\s*t-shirt|kids\s*hoodie|baby\s*hoodie|বেবি\s*টি-শার্ট/i.test(title)) {
      p.category_id = 'mother-baby';
      if (p.sub_category === 'Toys, Walkers & Learning' || !p.sub_category) {
        p.sub_category = 'Kids Clothing & Fashion';
        if (!p.specifications) p.specifications = {};
        p.specifications.sub_category = 'Kids Clothing & Fashion';
        modified = true;
        kidsClothingFixed++;
      }
    }
  }

  // 4. Strip sizes from NON-APPAREL products
  const isGenuineApparel =
    (p.category_id === 'mens-fashion' && MENS_APPAREL_REGEX.test(title) && !/wallet|belt|perfume|sunglass/i.test(title)) ||
    (p.category_id === 'womens-fashion' && (WOMENS_APPAREL_REGEX.test(title) || /dress|frock|skirt|top/i.test(title)) && !/jewelry|bag|wallet|sunglass|necklace|ring/i.test(title)) ||
    (p.category_id === 'mother-baby' && KIDS_APPAREL_REGEX.test(title));

  if (!isGenuineApparel) {
    if (DEFINITELY_NON_APPAREL_REGEX.test(title) ||
        p.category_id === 'home-living' ||
        p.category_id === 'tv-home-appliances' ||
        p.category_id === 'computer-gaming' ||
        p.category_id === 'electronic-accessories' ||
        p.category_id === 'phones-accessories' ||
        p.category_id === 'health-beauty' ||
        p.category_id === 'groceries-pet-supplies' ||
        p.category_id === 'automotives-motorbikes') {
      
      if (p.sizes && p.sizes.length > 0) {
        p.sizes = [];
        modified = true;
        sizesCleared++;
      }
      if (p.custom_attributes && Array.isArray(p.custom_attributes)) {
        const filtered = p.custom_attributes.filter(a => {
          const attr = (a.attribute || a.attributeName || '').toLowerCase();
          return attr !== 'size';
        });
        if (filtered.length !== p.custom_attributes.length) {
          p.custom_attributes = filtered;
          modified = true;
          sizesCleared++;
        }
      }
    }
  }

  // 5. Deduplicate and clean apparel sizes
  if (p.sizes && Array.isArray(p.sizes) && p.sizes.length > 0) {
    const seen = new Set();
    const uniqueSizes = [];
    for (const s of p.sizes) {
      if (!s) continue;
      const trimmed = String(s).trim();
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueSizes.push(trimmed);
      }
    }
    if (uniqueSizes.length !== p.sizes.length) {
      p.sizes = uniqueSizes;
      modified = true;
    }
  }

  // 6. Deduplicate custom_attributes
  if (p.custom_attributes && Array.isArray(p.custom_attributes) && p.custom_attributes.length > 0) {
    const seen = new Set();
    const uniqueAttrs = [];
    for (const a of p.custom_attributes) {
      if (!a) continue;
      const key = ((a.attribute || a.attributeName || '') + '___' + (a.name || '')).trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueAttrs.push(a);
      }
    }
    if (uniqueAttrs.length !== p.custom_attributes.length) {
      p.custom_attributes = uniqueAttrs;
      modified = true;
    }
  }

  // 7. Ensure sub_category in specifications matches product.sub_category
  if (p.sub_category) {
    if (!p.specifications) p.specifications = {};
    if (p.specifications.sub_category !== p.sub_category) {
      p.specifications.sub_category = p.sub_category;
      modified = true;
    }
  }

  if (modified) {
    fixedCount++;
    modifiedProducts.push({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      category_id: p.category_id,
      sub_category: p.sub_category,
      sizes: p.sizes,
      custom_attributes: p.custom_attributes,
      specifications: p.specifications,
      tags: p.tags
    });
  }
}

// Write back cleaned catalog
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');

console.log('=== AUDIT COMPLETE ===');
console.log('Total fixed products:', fixedCount);
console.log('Sizes cleared on non-apparel items:', sizesCleared);
console.log('Apparel re-categorized out of home/lifestyle:', reCategorized);
console.log('Kids clothing subcategory fixed:', kidsClothingFixed);

// Now sync modified products to Supabase via individual/batched updates
async function syncToSupabase() {
  console.log(`\nSyncing ${modifiedProducts.length} fixed products to Supabase...`);
  let successCount = 0;
  
  // Use Promise.all with chunks of 15 for fast concurrency
  for (let i = 0; i < modifiedProducts.length; i += 15) {
    const chunk = modifiedProducts.slice(i, i + 15);
    await Promise.all(
      chunk.map(async (p) => {
        const { error } = await supabase
          .from('products')
          .update({
            category_id: p.category_id,
            sizes: p.sizes,
            custom_attributes: p.custom_attributes,
            specifications: p.specifications,
            slug: p.slug,
            tags: p.tags
          })
          .eq('id', p.id);

        if (!error) {
          successCount++;
        } else {
          console.warn(`Error updating ${p.id}:`, error.message);
        }
      })
    );
    process.stdout.write(`Updated ${Math.min(i + 15, modifiedProducts.length)} / ${modifiedProducts.length}\r`);
  }
  console.log(`\nSupabase sync complete! Successfully updated ${successCount} products.`);
  process.exit(0);
}

syncToSupabase();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase setup
const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMDIwNiwiZXhwIjoyMTA0NDk2MjA2fQ.7M3tSiIGGj2E0aG1JFm0bvHgWQ8024J5Pvuz2P58k8s';
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Cloudinary setup
const CLOUD_NAME = 'dv8woouru';
const UPLOAD_PRESET = 'kt_sec_up_8x4_880_9pKi_hz_00';

// Paths
const CATALOG_PATH = path.join(__dirname, '../src/data/dropshippingCatalog.json');
const CACHE_PATH = path.join(__dirname, 'cloudinary_image_cache.json');

// Load Cache
let cache = {};
if (fs.existsSync(CACHE_PATH)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    console.log(`📦 Loaded existing cache with ${Object.keys(cache).length} entries.`);
  } catch {
    cache = {};
  }
}

function saveCache() {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
}

// Convert image from Mohasagor URL to WebP and upload to Cloudinary
async function uploadToCloudinary(url, retryCount = 3) {
  if (!url || typeof url !== 'string' || !url.includes('mohasagor.com.bd')) {
    return url;
  }

  // Check cache first
  if (cache[url]) {
    return cache[url];
  }

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rawBuffer = Buffer.from(await res.arrayBuffer());

      // Sharp resize to max 800x800 and convert to high-efficiency WebP
      const webpBuffer = await sharp(rawBuffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

      const cleanBaseName = url.split('/').pop().replace(/\.[^/.]+$/, '');
      const blob = new Blob([webpBuffer], { type: 'image/webp' });
      const formData = new FormData();
      formData.append('file', blob, `${cleanBaseName}.webp`);
      formData.append('upload_preset', UPLOAD_PRESET);

      const upRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!upRes.ok) {
        const errText = await upRes.text();
        throw new Error(`Cloudinary error ${upRes.status}: ${errText}`);
      }

      const upData = await upRes.json();
      const secureUrl = upData.secure_url;

      cache[url] = secureUrl;
      return secureUrl;
    } catch (err) {
      if (attempt === retryCount) {
        console.warn(`⚠️ Failed to upload ${url} after ${retryCount} attempts: ${err.message}`);
        return url; // fallback to original on persistent failure
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return url;
}

// Process a queue of items with a fixed concurrency worker pool
async function pMap(items, mapper, concurrency = 8) {
  const results = new Array(items.length);
  let index = 0;
  let active = 0;
  let completed = 0;

  return new Promise((resolve) => {
    function next() {
      if (index >= items.length && active === 0) {
        return resolve(results);
      }

      while (active < concurrency && index < items.length) {
        const curIndex = index++;
        active++;

        mapper(items[curIndex], curIndex, items.length)
          .then((res) => {
            results[curIndex] = res;
          })
          .catch((err) => {
            console.error(`Error at index ${curIndex}:`, err);
          })
          .finally(() => {
            active--;
            completed++;
            if (completed % 25 === 0 || completed === items.length) {
              saveCache();
            }
            next();
          });
      }
    }

    next();
  });
}

async function main() {
  console.log('🚀 Starting Mohasagor to Cloudinary Migration...');
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  console.log(`📦 Loaded ${catalog.length} products from catalog.`);

  // 1. Gather all unique Mohasagor URLs (Main images first for maximum user impact)
  const mainImageUrls = [];
  const secondaryImageUrls = [];
  const seenUrls = new Set();

  for (const p of catalog) {
    const mainImg = p.image || (p.images && p.images[0]);
    if (mainImg && mainImg.includes('mohasagor.com.bd') && !seenUrls.has(mainImg)) {
      seenUrls.add(mainImg);
      mainImageUrls.push(mainImg);
    }
  }

  for (const p of catalog) {
    for (const img of p.images || []) {
      if (img && img.includes('mohasagor.com.bd') && !seenUrls.has(img)) {
        seenUrls.add(img);
        secondaryImageUrls.push(img);
      }
    }
    for (const c of p.colors || []) {
      if (c.image && c.image.includes('mohasagor.com.bd') && !seenUrls.has(c.image)) {
        seenUrls.add(c.image);
        secondaryImageUrls.push(c.image);
      }
      for (const img of c.images || []) {
        if (img && img.includes('mohasagor.com.bd') && !seenUrls.has(img)) {
          seenUrls.add(img);
          secondaryImageUrls.push(img);
        }
      }
    }
  }

  console.log(`🎯 Unique Main Images to process: ${mainImageUrls.length}`);
  console.log(`🎯 Unique Secondary/Gallery Images to process: ${secondaryImageUrls.length}`);
  console.log(`🎯 Total unique images: ${seenUrls.size}`);

  const alreadyCached = [...seenUrls].filter((u) => cache[u]).length;
  console.log(`⚡ Already in cache / Cloudinary: ${alreadyCached} (${((alreadyCached / seenUrls.size) * 100).toFixed(1)}%)`);

  // Phase 1: Upload all Main Images first
  console.log('\n--- Phase 1: Processing Main Product Images ---');
  let doneCount = 0;
  await pMap(
    mainImageUrls,
    async (url, idx, total) => {
      const isCached = Boolean(cache[url]);
      const cloudUrl = await uploadToCloudinary(url);
      doneCount++;
      if (doneCount % 10 === 0 || doneCount === total) {
        process.stdout.write(
          `\r[Main Images] ${doneCount}/${total} (${((doneCount / total) * 100).toFixed(1)}%) | Cached: ${isCached ? 'HIT' : 'UPLOADED'}`
        );
      }
      return { original: url, cloudinary: cloudUrl };
    },
    8
  );

  saveCache();
  console.log('\n✅ Phase 1 complete! All primary product cards now have Cloudinary images ready.');

  // Phase 2: Upload Secondary / Gallery Images
  console.log('\n--- Phase 2: Processing Secondary & Variant Images ---');
  let secDone = 0;
  await pMap(
    secondaryImageUrls,
    async (url, idx, total) => {
      const isCached = Boolean(cache[url]);
      const cloudUrl = await uploadToCloudinary(url);
      secDone++;
      if (secDone % 25 === 0 || secDone === total) {
        process.stdout.write(
          `\r[Gallery Images] ${secDone}/${total} (${((secDone / total) * 100).toFixed(1)}%) | Cached: ${isCached ? 'HIT' : 'UPLOADED'}`
        );
      }
      return { original: url, cloudinary: cloudUrl };
    },
    8
  );

  saveCache();
  console.log('\n✅ Phase 2 complete! All gallery images processed.');

  // Phase 3: Apply Cloudinary URLs to dropshippingCatalog.json
  console.log('\n--- Phase 3: Updating Local dropshippingCatalog.json ---');
  let updatedProducts = 0;
  for (const p of catalog) {
    let changed = false;

    if (p.image && cache[p.image]) {
      p.image = cache[p.image];
      changed = true;
    }

    if (Array.isArray(p.images)) {
      p.images = p.images.map((img) => {
        if (cache[img]) {
          changed = true;
          return cache[img];
        }
        return img;
      });
    }

    if (Array.isArray(p.colors)) {
      for (const c of p.colors) {
        if (c.image && cache[c.image]) {
          c.image = cache[c.image];
          changed = true;
        }
        if (Array.isArray(c.images)) {
          c.images = c.images.map((img) => {
            if (cache[img]) {
              changed = true;
              return cache[img];
            }
            return img;
          });
        }
      }
    }

    if (changed) updatedProducts++;
  }

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`💾 Saved updated dropshippingCatalog.json (${updatedProducts} products updated).`);

  // Phase 4: Sync to Supabase in batches
  console.log('\n--- Phase 4: Syncing Updated Images to Supabase ---');
  const BATCH_SIZE = 50;
  let syncedCount = 0;

  for (let i = 0; i < catalog.length; i += BATCH_SIZE) {
    const batch = catalog.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (p) => {
        try {
          const { error } = await supabase
            .from('products')
            .update({
              images: p.images || (p.image ? [p.image] : []),
              colors: p.colors || [],
            })
            .eq('id', p.id);

          if (!error) syncedCount++;
        } catch (e) {
          console.warn(`Error updating product ${p.id}:`, e.message);
        }
      })
    );

    process.stdout.write(
      `\r[Supabase Sync] ${syncedCount}/${catalog.length} (${((syncedCount / catalog.length) * 100).toFixed(1)}%)`
    );
  }

  console.log(`\n🎉 All done! ${syncedCount} products fully synchronized with Cloudinary!`);
}

main().catch(console.error);

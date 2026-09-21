import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMDIwNiwiZXhwIjoyMTA0NDk2MjA2fQ.7M3tSiIGGj2E0aG1JFm0bvHgWQ8024J5Pvuz2P58k8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PALETTE = [
  { name: 'Red', hex: '#EF4444', rgb: [220, 38, 38] },
  { name: 'Maroon', hex: '#800000', rgb: [128, 0, 0] },
  { name: 'Blue', hex: '#2563EB', rgb: [37, 99, 235] },
  { name: 'Navy Blue', hex: '#1E3A8A', rgb: [30, 58, 138] },
  { name: 'Sky Blue', hex: '#38BDF8', rgb: [56, 189, 248] },
  { name: 'Green', hex: '#16A34A', rgb: [22, 163, 74] },
  { name: 'Olive Green', hex: '#556B2F', rgb: [85, 107, 47] },
  { name: 'Neon Green', hex: '#84CC16', rgb: [132, 204, 22] },
  { name: 'Yellow', hex: '#EAB308', rgb: [234, 179, 8] },
  { name: 'Gold', hex: '#D97706', rgb: [217, 119, 6] },
  { name: 'Orange', hex: '#F97316', rgb: [249, 115, 22] },
  { name: 'Pink', hex: '#EC4899', rgb: [236, 72, 153] },
  { name: 'Purple', hex: '#9333EA', rgb: [147, 51, 234] },
  { name: 'Teal', hex: '#14B8A6', rgb: [20, 184, 166] },
  { name: 'Brown', hex: '#78350F', rgb: [120, 53, 15] },
  { name: 'Black', hex: '#000000', rgb: [25, 25, 25] },
  { name: 'White', hex: '#FFFFFF', rgb: [245, 245, 245] },
  { name: 'Silver', hex: '#9CA3AF', rgb: [160, 165, 175] },
  { name: 'Ash', hex: '#6B7280', rgb: [107, 114, 128] },
  { name: 'Beige', hex: '#F5F5DC', rgb: [245, 245, 220] },
];

function closestColor(rgb) {
  let minD = Infinity;
  let best = PALETTE[0];
  for (const c of PALETTE) {
    const d = Math.sqrt(
      Math.pow(rgb[0] - c.rgb[0], 2) +
      Math.pow(rgb[1] - c.rgb[1], 2) +
      Math.pow(rgb[2] - c.rgb[2], 2)
    );
    if (d < minD) {
      minD = d;
      best = c;
    }
  }
  return best;
}

async function extractSaturatedColor(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const { data, info } = await sharp(buf).resize(150, 150).raw().toBuffer({ resolveWithObject: true });

    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      if (max - min > 30 && max > 50) {
        rSum += r;
        gSum += g;
        bSum += b;
        count++;
      }
    }

    if (count > 0) {
      const avgR = Math.round(rSum / count);
      const avgG = Math.round(gSum / count);
      const avgB = Math.round(bSum / count);
      const matched = closestColor([avgR, avgG, avgB]);
      const hex = '#' + [avgR, avgG, avgB].map(x => x.toString(16).padStart(2, '0')).join('');
      return { name: matched.name, hex };
    }

    // If mostly neutral (black, white, grey)
    let totalR = 0, totalG = 0, totalB = 0, totalPx = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      totalR += data[i];
      totalG += data[i + 1];
      totalB += data[i + 2];
      totalPx++;
    }
    const mean = (totalR + totalG + totalB) / (totalPx * 3);
    if (mean < 60) return { name: 'Black', hex: '#000000' };
    if (mean > 200) return { name: 'White', hex: '#FFFFFF' };
    return { name: 'Ash', hex: '#6B7280' };
  } catch {
    return null;
  }
}

async function main() {
  console.log('🔄 Loading dropshipping catalog...');
  const jsonPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  const catalog = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const updatedProducts = [];

  // 1. Fix the Car Wheel Rim Quartz Watch specifically
  const wheelWatch = catalog.find(x => (x.colors || []).some(c => c.sku === 'DS-13299'));
  if (wheelWatch) {
    console.log('🎯 Fixing Car Wheel Rim Quartz Watch...');
    wheelWatch.category_id = 'watches-bags';
    wheelWatch.gender = 'Men';
    wheelWatch.tags = (wheelWatch.tags || []).filter(
      t => !/^ds-\d+/i.test(t) && !/^\d{4,5}$/.test(t) && !/^code \d+/i.test(t) && !/^option/i.test(t)
    );
    wheelWatch.tags.push('ঘড়ি', 'হাতের ঘড়ি', 'কার হুইল ওয়াচ', 'wheel watch', 'men watch', 'sports watch');

    wheelWatch.colors = [
      {
        name: 'Neon Green',
        hex: '#80af2e',
        price: 1045,
        discount_price: 940,
        discount_percent: 10,
        image: 'https://mohasagor.com.bd/public/storage/images/products/W4K4aa7M8oNjKhTQW3PY6CuXL3bVQoa0kERVRrMU.png',
        images: [
          'https://mohasagor.com.bd/public/storage/images/products/W4K4aa7M8oNjKhTQW3PY6CuXL3bVQoa0kERVRrMU.png',
          'https://mohasagor.com.bd/public/storage/images/products/H7GRZfseWzoFNkn1q7cNumQTtrN3F2dNLn2U8DzL.png',
          'https://mohasagor.com.bd/public/storage/images/products/0WhjLH7fMFSfWVNsfwa47HbQziIupfhtpm9cqP7h.png'
        ],
        stock: 50,
        sku: 'DS-13299',
        dropshipping_url: 'https://dropshipping.com.bd/product/wheel-rim-rotating-watch-13299'
      },
      {
        name: 'Emerald Green',
        hex: '#4ea046',
        price: 1015,
        discount_price: 940,
        discount_percent: 7,
        image: 'https://mohasagor.com.bd/public/storage/images/products/JdgK3a5brWRkCFtJevWq2DLOGRqSQi4K69gKa056.png',
        images: [
          'https://mohasagor.com.bd/public/storage/images/products/JdgK3a5brWRkCFtJevWq2DLOGRqSQi4K69gKa056.png',
          'https://mohasagor.com.bd/public/storage/images/products/22KGnmHvg8BAApE6vdMp7Af1OHAbYp6D2JsROVfe.png',
          'https://mohasagor.com.bd/public/storage/images/products/l2dWTpfv1lDy7eEE5FStdIzj8dgjv6JnTvU8LCRd.png'
        ],
        stock: 50,
        sku: 'DS-13300',
        dropshipping_url: 'https://dropshipping.com.bd/product/wheel-rim-rotating-watch-13300'
      },
      {
        name: 'Royal Blue',
        hex: '#295d98',
        price: 1035,
        discount_price: 940,
        discount_percent: 9,
        image: 'https://mohasagor.com.bd/public/storage/images/products/5fM51EbWLajlNLVTIzELz26Z4p9KJW6XIEGI6pBd.png',
        images: [
          'https://mohasagor.com.bd/public/storage/images/products/5fM51EbWLajlNLVTIzELz26Z4p9KJW6XIEGI6pBd.png',
          'https://mohasagor.com.bd/public/storage/images/products/UctRbnyiyCM2U70d3IkB8z0tnyBMfFhyupmV4HUW.png',
          'https://mohasagor.com.bd/public/storage/images/products/ILxbkNljIPVCiOPeR5P5FNzaD4TI5IrbVftIq0yo.png'
        ],
        stock: 50,
        sku: 'DS-13302',
        dropshipping_url: 'https://dropshipping.com.bd/product/wheel-rim-rotating-watch-13302'
      },
      {
        name: 'Ocean Blue',
        hex: '#196fa9',
        price: 1045,
        discount_price: 940,
        discount_percent: 10,
        image: 'https://mohasagor.com.bd/public/storage/images/products/fgkSzrn6Sb0Aoudq5Gu0H9GX6k8aeOdoTKzx1awx.png',
        images: [
          'https://mohasagor.com.bd/public/storage/images/products/fgkSzrn6Sb0Aoudq5Gu0H9GX6k8aeOdoTKzx1awx.png',
          'https://mohasagor.com.bd/public/storage/images/products/ALPQiOuS5aBe2BC1Ei1OIbnIOSyH2qkjRhqDbFZ9.png',
          'https://mohasagor.com.bd/public/storage/images/products/ZJa28CFBPYmdTBH479jieXv2RPm9VjA7hX5TIFZZ.png'
        ],
        stock: 50,
        sku: 'DS-13303',
        dropshipping_url: 'https://dropshipping.com.bd/product/wheel-rim-rotating-watch-13303'
      },
      {
        name: 'Gold',
        hex: '#b6941e',
        price: 1015,
        discount_price: 940,
        discount_percent: 7,
        image: 'https://mohasagor.com.bd/public/storage/images/products/m5SdKWZLzcvqueXyeUpZjtrWyVTevRovwe5rJKxx.png',
        images: [
          'https://mohasagor.com.bd/public/storage/images/products/m5SdKWZLzcvqueXyeUpZjtrWyVTevRovwe5rJKxx.png',
          'https://mohasagor.com.bd/public/storage/images/products/eM1eiyYgCQVOY3tOYZkYsXdhr8RPLhWIqoxLOVsh.png'
        ],
        stock: 50,
        sku: 'DS-13304',
        dropshipping_url: 'https://dropshipping.com.bd/product/wheel-rim-rotating-watch-13304'
      },
      {
        name: 'Yellow Gold',
        hex: '#c3a33e',
        price: 1025,
        discount_price: 940,
        discount_percent: 8,
        image: 'https://mohasagor.com.bd/public/storage/images/products/stQFGZgQYeAZ76sBU2Hw1KcIUMuudTqoxTsMo1dI.png',
        images: [
          'https://mohasagor.com.bd/public/storage/images/products/stQFGZgQYeAZ76sBU2Hw1KcIUMuudTqoxTsMo1dI.png',
          'https://mohasagor.com.bd/public/storage/images/products/qXoCFVGF8Pgs6TfXISXAiUWqIVWTW34Iw1ojZaen.png'
        ],
        stock: 50,
        sku: 'DS-13305',
        dropshipping_url: 'https://dropshipping.com.bd/product/wheel-rim-rotating-watch-13305'
      },
      {
        name: 'Bronze Gold',
        hex: '#c79e19',
        price: 1035,
        discount_price: 940,
        discount_percent: 9,
        image: 'https://mohasagor.com.bd/public/storage/images/products/ys35oWBaJXwIPx8k0qzDZpu8vhehAhHI1VlPlnmG.png',
        images: [
          'https://mohasagor.com.bd/public/storage/images/products/ys35oWBaJXwIPx8k0qzDZpu8vhehAhHI1VlPlnmG.png',
          'https://mohasagor.com.bd/public/storage/images/products/Awd0JttWRdvJjFcX5KUCDBMdC9ogoYwTs0PUBVSM.png'
        ],
        stock: 50,
        sku: 'DS-13306',
        dropshipping_url: 'https://dropshipping.com.bd/product/wheel-rim-rotating-watch-13306'
      },
      {
        name: 'Rose Gold',
        hex: '#9a734c',
        price: 1045,
        discount_price: 940,
        discount_percent: 10,
        image: 'https://mohasagor.com.bd/public/storage/images/products/US06pXaDOrGADbn3xl1Ntw6BiJrKKMB23tTkxfEJ.png',
        images: [
          'https://mohasagor.com.bd/public/storage/images/products/US06pXaDOrGADbn3xl1Ntw6BiJrKKMB23tTkxfEJ.png',
          'https://mohasagor.com.bd/public/storage/images/products/LsF7Y25qYLbHuipDdAej501JFYdHRr1UG800BWgJ.png'
        ],
        stock: 50,
        sku: 'DS-13307',
        dropshipping_url: 'https://dropshipping.com.bd/product/wheel-rim-rotating-watch-13307'
      }
    ];

    updatedProducts.push(wheelWatch);
  }

  // 2. Scan all products to clean tags from DS references
  for (const p of catalog) {
    let tagsModified = false;
    if (Array.isArray(p.tags)) {
      const cleanTags = p.tags.filter(
        t => !/^ds-\d+/i.test(t) && !/^\d{4,5}$/.test(t) && !/^code \d+/i.test(t) && !/^option/i.test(t)
      );
      if (cleanTags.length !== p.tags.length) {
        p.tags = cleanTags;
        tagsModified = true;
      }
    }
    if (tagsModified && !updatedProducts.includes(p)) {
      updatedProducts.push(p);
    }
  }

  // 3. Scan products with fake Red #EF4444 variants and re-analyze with sharp
  const fakeRedProducts = catalog.filter(p =>
    p !== wheelWatch && (p.colors || []).some(c => c.name === 'Red' && c.hex === '#EF4444')
  );
  console.log(`Found ${fakeRedProducts.length} other products with potential default Red variants.`);

  for (const p of fakeRedProducts) {
    let pChanged = false;
    for (const c of p.colors) {
      if (c.name === 'Red' && c.hex === '#EF4444' && c.image && c.image.startsWith('http')) {
        const detected = await extractSaturatedColor(c.image);
        if (detected && (detected.name !== 'Red' || detected.hex !== '#EF4444')) {
          c.name = detected.name;
          c.hex = detected.hex;
          pChanged = true;
        }
      }
    }
    if (pChanged && !updatedProducts.includes(p)) {
      updatedProducts.push(p);
    }
  }

  console.log(`✨ Total products updated: ${updatedProducts.length}`);

  // Save to JSON
  fs.writeFileSync(jsonPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('💾 Saved dropshippingCatalog.json');

  // Sync to Supabase in batches
  console.log(`⚡ Syncing ${updatedProducts.length} updated products to Supabase...`);
  const BATCH = 50;
  for (let i = 0; i < updatedProducts.length; i += BATCH) {
    const batch = updatedProducts.slice(i, i + BATCH).map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      discount_price: p.discount_price,
      category_id: p.category_id,
      stock: p.stock,
      images: p.images,
      colors: p.colors,
      gender: p.gender,
      tags: p.tags,
      specifications: p.specifications || {},
      dropshipping_url: p.dropshipping_url || null,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('products').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`❌ Batch error:`, error.message);
    } else {
      console.log(`✅ Batch ${Math.floor(i / BATCH) + 1} synced (${Math.min(i + BATCH, updatedProducts.length)}/${updatedProducts.length})`);
    }
  }

  console.log('🎉 Done fixing all products and database!');
}

main().catch(console.error);

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

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function classifyHsl(h, s, l) {
  if (s < 14) {
    if (l < 25) return { name: 'Black', hex: '#111827' };
    if (l > 82) return { name: 'White', hex: '#FFFFFF' };
    return { name: 'Silver Grey', hex: '#9CA3AF' };
  }
  if (h >= 345 || h < 12) {
    if (l < 28) return { name: 'Maroon', hex: '#800000' };
    if (s > 40 && l > 65) return { name: 'Pink', hex: '#EC4899' };
    return { name: 'Red', hex: '#EF4444' };
  }
  if (h >= 12 && h < 40) {
    if (l < 35) return { name: 'Brown', hex: '#78350F' };
    if (l > 75) return { name: 'Beige', hex: '#F5F5DC' };
    return { name: 'Orange', hex: '#F97316' };
  }
  if (h >= 40 && h < 68) {
    if (l < 48) return { name: 'Gold', hex: '#D97706' };
    return { name: 'Yellow', hex: '#EAB308' };
  }
  if (h >= 68 && h < 95) {
    return { name: 'Neon Green', hex: '#84CC16' };
  }
  if (h >= 95 && h < 155) {
    if (l < 28) return { name: 'Deep Green', hex: '#14532D' };
    if (h < 120 && s < 45) return { name: 'Olive Green', hex: '#556B2F' };
    if (l > 60) return { name: 'Mint Green', hex: '#6EE7B7' };
    return { name: 'Green', hex: '#16A34A' };
  }
  if (h >= 155 && h < 195) {
    if (l < 30) return { name: 'Dark Teal', hex: '#115E59' };
    return { name: 'Teal', hex: '#14B8A6' };
  }
  if (h >= 195 && h < 218) {
    return { name: 'Sky Blue', hex: '#38BDF8' };
  }
  if (h >= 218 && h < 248) {
    if (l < 26) return { name: 'Navy Blue', hex: '#1E3A8A' };
    return { name: 'Royal Blue', hex: '#2563EB' };
  }
  if (h >= 248 && h < 285) {
    if (l < 30) return { name: 'Deep Purple', hex: '#581C87' };
    return { name: 'Purple', hex: '#9333EA' };
  }
  if (h >= 285 && h < 345) {
    if (l > 60) return { name: 'Light Pink', hex: '#F472B6' };
    return { name: 'Magenta', hex: '#DB2777' };
  }
  return { name: 'Multicolor', hex: '#6B7280' };
}

async function extractColorFromImage(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const { data, info } = await sharp(buf).resize(150, 150).raw().toBuffer({ resolveWithObject: true });

    const satPixels = [];
    const nonBgPixels = [];

    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const [h, s, l] = rgbToHsl(r, g, b);

      // Studio background: pure white or near white low-sat background
      if (l > 92 && s < 15) continue;
      // Pitch black canvas borders
      if (l < 5) continue;

      nonBgPixels.push({ r, g, b, h, s, l });

      if (s > 18 && l > 12 && l < 88) {
        satPixels.push({ r, g, b, h, s, l });
      }
    }

    if (satPixels.length > 40) {
      // Find the dominant saturated hue cluster
      // Bin into 12 hue segments
      const bins = Array.from({ length: 12 }, () => []);
      for (const p of satPixels) {
        const binIdx = Math.floor(p.h / 30) % 12;
        bins[binIdx].push(p);
      }
      bins.sort((a, b) => b.length - a.length);
      const topBin = bins[0];

      // Sort by saturation within the top bin
      topBin.sort((a, b) => b.s - a.s);
      const topSamples = topBin.slice(0, Math.max(10, Math.floor(topBin.length * 0.5)));

      const avgH = Math.round(topSamples.reduce((acc, p) => acc + p.h, 0) / topSamples.length);
      const avgS = Math.round(topSamples.reduce((acc, p) => acc + p.s, 0) / topSamples.length);
      const avgL = Math.round(topSamples.reduce((acc, p) => acc + p.l, 0) / topSamples.length);
      const avgR = Math.round(topSamples.reduce((acc, p) => acc + p.r, 0) / topSamples.length);
      const avgG = Math.round(topSamples.reduce((acc, p) => acc + p.g, 0) / topSamples.length);
      const avgB = Math.round(topSamples.reduce((acc, p) => acc + p.b, 0) / topSamples.length);
      const hex = '#' + [avgR, avgG, avgB].map((x) => x.toString(16).padStart(2, '0')).join('');

      const classified = classifyHsl(avgH, avgS, avgL);
      return {
        name: classified.name,
        hex: hex,
        h: avgH,
        s: avgS,
        l: avgL,
        satRatio: satPixels.length / (nonBgPixels.length || 1),
      };
    } else if (nonBgPixels.length > 20) {
      const avgL = Math.round(nonBgPixels.reduce((acc, p) => acc + p.l, 0) / nonBgPixels.length);
      if (avgL < 28) return { name: 'Black', hex: '#111827', h: 0, s: 0, l: avgL, satRatio: 0 };
      if (avgL > 78) return { name: 'White', hex: '#FFFFFF', h: 0, s: 0, l: avgL, satRatio: 0 };
      return { name: 'Silver', hex: '#9CA3AF', h: 0, s: 0, l: avgL, satRatio: 0 };
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log('🔄 Loading dropshippingCatalog.json...');
  const jsonPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  const catalog = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Find products that have bad color variants
  const targetProducts = catalog.filter((p) => {
    if (!Array.isArray(p.colors) || p.colors.length === 0) return false;
    const hasDesign = p.colors.some((c) => /\(Design/i.test(c.name));
    const hasDupes = new Set(p.colors.map((c) => (c.name || '').toLowerCase().trim())).size !== p.colors.length;
    return hasDesign || hasDupes;
  });

  console.log(`🎯 Found ${targetProducts.length} products with corrupted/duplicate color variants.`);

  // Collect all unique image URLs
  const uniqueUrls = new Set();
  for (const p of targetProducts) {
    for (const c of p.colors) {
      if (c.image && c.image.startsWith('http')) {
        uniqueUrls.add(c.image);
      }
    }
  }

  const urlList = Array.from(uniqueUrls);
  console.log(`📸 Analyzing ${urlList.length} unique variant images with sharp HSL...`);

  const colorCache = new Map();
  const CONCURRENCY = 25;

  for (let i = 0; i < urlList.length; i += CONCURRENCY) {
    const chunk = urlList.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (url) => {
        const result = await extractColorFromImage(url);
        if (result) colorCache.set(url, result);
      })
    );
    if ((i + CONCURRENCY) % 100 === 0 || i + CONCURRENCY >= urlList.length) {
      console.log(`  Processed ${Math.min(i + CONCURRENCY, urlList.length)} / ${urlList.length} images...`);
    }
  }

  console.log(`✅ Extracted colors for ${colorCache.size} images!`);

  // Now update each target product's colors
  let updatedCount = 0;
  for (const p of targetProducts) {
    const variantColors = [];
    for (const c of p.colors) {
      const extracted = c.image ? colorCache.get(c.image) : null;
      if (extracted) {
        variantColors.push({
          origColor: c,
          name: extracted.name,
          hex: extracted.hex,
          h: extracted.h,
          s: extracted.s,
          l: extracted.l,
        });
      } else {
        variantColors.push({
          origColor: c,
          name: c.name.replace(/\s*\(Design\s*\d+\)/gi, '').trim() || 'Multicolor',
          hex: c.hex || '#1E293B',
          h: 0,
          s: 0,
          l: 50,
        });
      }
    }

    // Deduplicate within the same product using intelligent qualifiers (Shade, Light/Dark, Deep, Antique)
    const nameGroups = {};
    for (const vc of variantColors) {
      nameGroups[vc.name] = nameGroups[vc.name] || [];
      nameGroups[vc.name].push(vc);
    }

    for (const [colName, group] of Object.entries(nameGroups)) {
      if (group.length > 1) {
        // Sort by lightness
        group.sort((a, b) => a.l - b.l);
        if (group.length === 2) {
          if (colName === 'Blue' || colName === 'Royal Blue') {
            group[0].name = 'Navy Blue';
            group[1].name = 'Royal Blue';
          } else if (colName === 'Green') {
            group[0].name = 'Deep Green';
            group[1].name = 'Light Green';
          } else if (colName === 'Silver' || colName === 'Silver Grey') {
            group[0].name = 'Dark Grey';
            group[1].name = 'Silver Grey';
          } else if (colName === 'Gold') {
            group[0].name = 'Antique Gold';
            group[1].name = 'Bright Gold';
          } else if (colName === 'Black') {
            group[0].name = 'Matte Black';
            group[1].name = 'Jet Black';
          } else {
            group[0].name = `Dark ${colName}`;
            group[1].name = `Light ${colName}`;
          }
        } else {
          // 3 or more variants sharing same base color name
          const prefixes = ['Deep', 'Medium', 'Light', 'Classic', 'Royal', 'Soft', 'Pure', 'Vibrant'];
          group.forEach((item, idx) => {
            const prefix = prefixes[idx] || `Shade ${idx + 1}`;
            item.name = `${prefix} ${colName}`;
          });
        }
      }
    }

    // Apply back to product colors
    p.colors = variantColors.map((vc) => ({
      ...vc.origColor,
      name: vc.name,
      hex: vc.hex,
    }));

    updatedCount++;
  }

  console.log(`💾 Updating ${updatedCount} products in dropshippingCatalog.json...`);
  fs.writeFileSync(jsonPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('✅ dropshippingCatalog.json successfully updated!');

  // Sync to Supabase
  console.log(`⚡ Syncing ${targetProducts.length} updated products to Supabase...`);
  const BATCH = 40;
  for (let i = 0; i < targetProducts.length; i += BATCH) {
    const chunk = targetProducts.slice(i, i + BATCH).map((p) => ({
      id: p.id,
      title: p.title,
      colors: p.colors,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('products').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`❌ Batch ${i} Supabase error:`, error.message);
    } else {
      console.log(`  Synced batch ${i + 1}-${Math.min(i + BATCH, targetProducts.length)} to Supabase`);
    }
  }

  console.log('🎉 ALL PRODUCT COLORS FIXED AND SYNCED SUCCESSFULLY!');
}

main().catch(console.error);

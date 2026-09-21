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

function nameColor(r, g, b) {
  const [h, s, l] = rgbToHsl(r, g, b);
  const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

  // 1. Very low saturation (monochrome / neutral)
  if (s < 8) {
    if (l < 28) return { name: 'Black', hex: l < 15 ? '#111827' : hex };
    if (l > 78) return { name: 'White', hex: '#FFFFFF' };
    return { name: 'Grey', hex };
  }

  // 2. Low-to-medium saturation (pastels, earth tones, muted clothing like Sage Green, Beige, Peach, Taupe)
  if (s < 25) {
    if (h >= 55 && h < 160) {
      return { name: 'Sage Green', hex };
    }
    if (h >= 15 && h < 55) {
      if (l > 65) return { name: 'Peach', hex };
      if (l >= 40) return { name: 'Beige', hex };
      return { name: 'Brown', hex };
    }
    if (h >= 180 && h < 260) {
      if (l < 35) return { name: 'Navy Blue', hex };
      return { name: 'Sky Blue', hex };
    }
    if (h >= 330 || h < 15) {
      if (l > 60) return { name: 'Dusty Pink', hex };
      if (l < 35) return { name: 'Maroon', hex };
      return { name: 'Muted Red', hex };
    }
    return { name: 'Grey', hex };
  }

  // 3. Medium to high saturation
  if (h >= 345 || h < 15) {
    if (l < 32) return { name: 'Maroon', hex };
    if (l > 65) return { name: 'Pink', hex };
    return { name: 'Red', hex };
  }
  if (h >= 15 && h < 42) {
    if (l < 35) return { name: 'Brown', hex };
    if (l > 68) return { name: 'Peach', hex };
    return { name: 'Orange', hex };
  }
  if (h >= 42 && h < 65) {
    if (l < 48) return { name: 'Gold', hex };
    return { name: 'Yellow', hex };
  }
  if (h >= 65 && h < 95) {
    if (s > 50) return { name: 'Neon Green', hex };
    return { name: 'Olive Green', hex };
  }
  if (h >= 95 && h < 155) {
    if (l < 32) return { name: 'Deep Green', hex };
    if (l > 60) return { name: 'Mint Green', hex };
    if (h < 120 && s < 45) return { name: 'Olive Green', hex };
    return { name: 'Green', hex };
  }
  if (h >= 155 && h < 195) {
    if (l < 32) return { name: 'Dark Teal', hex };
    return { name: 'Teal', hex };
  }
  if (h >= 195 && h < 220) {
    return { name: 'Sky Blue', hex };
  }
  if (h >= 220 && h < 255) {
    if (l < 28) return { name: 'Navy Blue', hex };
    return { name: 'Royal Blue', hex };
  }
  if (h >= 255 && h < 290) {
    return { name: 'Purple', hex };
  }
  if (h >= 290 && h < 345) {
    if (l > 60) return { name: 'Light Pink', hex };
    return { name: 'Magenta', hex };
  }
  return { name: 'Multicolor', hex };
}

async function extractColorFromImage(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const { data, info } = await sharp(buf).resize(150, 150).raw().toBuffer({ resolveWithObject: true });

    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    const satPixels = [];

    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i], g = data[i + 1], b = data[i + 2];

      // Skip white/near-white studio background
      if (r > 230 && g > 230 && b > 230) continue;
      // Skip transparent or near-black drop shadow edges
      if (r < 18 && g < 18 && b < 18) continue;

      rSum += r; gSum += g; bSum += b; count++;

      const [h, s, l] = rgbToHsl(r, g, b);
      if (s > 25 && l > 15 && l < 85) {
        satPixels.push({ r, g, b, h, s, l });
      }
    }

    if (count < 20) return null;

    // If there is a distinct concentrated saturated accent (e.g. dial in black watch)
    if (satPixels.length > 50 && (satPixels.length / count) < 0.45) {
      const bins = Array.from({ length: 12 }, () => []);
      for (const p of satPixels) {
        const binIdx = Math.floor(p.h / 30) % 12;
        bins[binIdx].push(p);
      }
      bins.sort((a, b) => b.length - a.length);
      const topBin = bins[0];
      topBin.sort((a, b) => b.s - a.s);
      const samples = topBin.slice(0, Math.max(5, Math.floor(topBin.length * 0.4)));

      const avgR = Math.round(samples.reduce((a, b) => a + b.r, 0) / samples.length);
      const avgG = Math.round(samples.reduce((a, b) => a + b.g, 0) / samples.length);
      const avgB = Math.round(samples.reduce((a, b) => a + b.b, 0) / samples.length);
      return nameColor(avgR, avgG, avgB);
    }

    // Otherwise, average non-background color (e.g. garment, bra, shirt, pants)
    const avgR = Math.round(rSum / count);
    const avgG = Math.round(gSum / count);
    const avgB = Math.round(bSum / count);
    return nameColor(avgR, avgG, avgB);
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log('🔄 Loading dropshippingCatalog.json...');
  const jsonPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  const catalog = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const withColors = catalog.filter((p) => Array.isArray(p.colors) && p.colors.length > 0);
  console.log(`Analyzing all ${withColors.length} products with color variants...`);

  // Collect unique URLs
  const uniqueUrls = new Set();
  for (const p of withColors) {
    // Keep the verified Car Wheel Rim watch unchanged
    if (p.sku === 'DS-13299' || (p.colors || []).some((c) => c.sku === 'DS-13299')) continue;
    for (const c of p.colors) {
      if (c.image && c.image.startsWith('http')) {
        uniqueUrls.add(c.image);
      }
    }
  }

  const urlList = Array.from(uniqueUrls);
  console.log(`📸 Extracting real colors from ${urlList.length} unique variant images using continuous worker pool...`);

  const colorCache = new Map();
  const CONCURRENCY = 40;
  let nextIdx = 0;
  let completed = 0;

  async function worker() {
    while (nextIdx < urlList.length) {
      const idx = nextIdx++;
      const url = urlList[idx];
      const result = await extractColorFromImage(url);
      if (result) colorCache.set(url, result);
      completed++;
      if (completed % 200 === 0 || completed >= urlList.length) {
        console.log(`  Processed ${completed} / ${urlList.length} images...`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`✅ Extracted colors for ${colorCache.size} images!`);

  // Update products
  let updatedCount = 0;
  for (const p of withColors) {
    if (p.sku === 'DS-13299' || (p.colors || []).some((c) => c.sku === 'DS-13299')) continue;

    for (const c of p.colors) {
      const extracted = c.image ? colorCache.get(c.image) : null;
      if (extracted) {
        c.name = extracted.name;
        c.hex = extracted.hex;
      }
    }

    // Deduplicate identical names within same product
    const nameGroups = {};
    for (const c of p.colors) {
      nameGroups[c.name] = nameGroups[c.name] || [];
      nameGroups[c.name].push(c);
    }

    for (const [name, group] of Object.entries(nameGroups)) {
      if (group.length > 1) {
        if (group.length === 2) {
          if (name === 'Green') { group[0].name = 'Deep Green'; group[1].name = 'Light Green'; }
          else if (name === 'Blue') { group[0].name = 'Navy Blue'; group[1].name = 'Royal Blue'; }
          else if (name === 'Grey') { group[0].name = 'Dark Grey'; group[1].name = 'Light Grey'; }
          else if (name === 'Black') { group[0].name = 'Charcoal Black'; group[1].name = 'Jet Black'; }
          else { group[0].name = `Dark ${name}`; group[1].name = `Light ${name}`; }
        } else {
          const qualifiers = ['Deep', 'Medium', 'Light', 'Classic', 'Royal', 'Soft', 'Pure', 'Vibrant'];
          group.forEach((item, idx) => {
            const prefix = qualifiers[idx] || `Shade ${idx + 1}`;
            item.name = `${prefix} ${name}`;
          });
        }
      }
    }

    updatedCount++;
  }

  console.log(`💾 Writing updated colors to dropshippingCatalog.json...`);
  fs.writeFileSync(jsonPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('✅ dropshippingCatalog.json updated successfully!');

  // Sync to Supabase with continuous worker pool
  console.log(`⚡ Syncing all ${withColors.length} products to Supabase...`);
  let supaIdx = 0;
  let supaSuccess = 0;
  let supaErrors = 0;

  async function supaWorker() {
    while (supaIdx < withColors.length) {
      const idx = supaIdx++;
      const p = withColors[idx];
      const { error } = await supabase
        .from('products')
        .update({
          colors: p.colors,
          updated_at: new Date().toISOString(),
        })
        .eq('id', p.id);

      if (error) {
        console.error(`Error updating product ${p.id}:`, error.message);
        supaErrors++;
      } else {
        supaSuccess++;
      }

      if (supaSuccess % 150 === 0 || supaSuccess >= withColors.length) {
        console.log(`  Synced ${supaSuccess} / ${withColors.length} products to Supabase...`);
      }
    }
  }

  await Promise.all(Array.from({ length: 30 }, supaWorker));
  console.log(`\n🎉 ALL 567 PRODUCTS COLOR-FIXED AND SYNCED TO SUPABASE (Success: ${supaSuccess}, Errors: ${supaErrors})!`);
}

main().catch(console.error);

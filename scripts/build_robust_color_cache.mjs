import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        return Buffer.from(await res.arrayBuffer());
      }
    } catch (err) {
      if (attempt === retries) return null;
      await new Promise(r => setTimeout(r, 400 * attempt));
    }
  }
  return null;
}

async function extractColorFromUrl(url) {
  const buf = await fetchWithRetry(url);
  if (!buf) return null;

  try {
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

    // Saturated accent (e.g. watch dial on black watch)
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

    // Garment / Product average color
    const avgR = Math.round(rSum / count);
    const avgG = Math.round(gSum / count);
    const avgB = Math.round(bSum / count);
    return nameColor(avgR, avgG, avgB);
  } catch (err) {
    return null;
  }
}

async function main() {
  const cachePath = path.join(__dirname, 'color_cache.json');
  let cache = {};
  if (fs.existsSync(cachePath)) {
    try { cache = JSON.parse(fs.readFileSync(cachePath, 'utf8')); } catch {}
  }

  const catalogPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  const withColors = catalog.filter((p) => Array.isArray(p.colors) && p.colors.length > 0);
  const allUrls = new Set();
  for (const p of withColors) {
    for (const c of p.colors) {
      if (c.image && c.image.startsWith('http')) {
        allUrls.add(c.image);
      }
    }
  }

  const urlList = Array.from(allUrls);
  console.log(`Total unique URLs: ${urlList.length}. Already cached: ${Object.keys(cache).length}`);

  const missingUrls = urlList.filter(u => !cache[u] || !cache[u].name || !cache[u].hex);
  console.log(`Missing URLs to process: ${missingUrls.length}`);

  const CONCURRENCY = 15;
  let nextIdx = 0;
  let doneCount = 0;

  async function worker() {
    while (nextIdx < missingUrls.length) {
      const idx = nextIdx++;
      const url = missingUrls[idx];
      const res = await extractColorFromUrl(url);
      if (res) {
        cache[url] = res;
      }
      doneCount++;
      if (doneCount % 50 === 0 || doneCount >= missingUrls.length) {
        console.log(`  Processed ${doneCount} / ${missingUrls.length} (Cache size: ${Object.keys(cache).length})...`);
        fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
  console.log(`\n🎉 Cache complete! Total cached images: ${Object.keys(cache).length}`);
}

main().catch(console.error);

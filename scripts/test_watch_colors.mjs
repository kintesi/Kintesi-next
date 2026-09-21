import sharp from 'sharp';

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

function nameHsl(h, s, l) {
  if (s < 14) {
    if (l < 25) return { name: 'Black', hex: '#111827' };
    if (l > 82) return { name: 'White', hex: '#FFFFFF' };
    return { name: 'Silver', hex: '#9CA3AF' };
  }
  if (h >= 345 || h < 12) {
    if (l < 28) return { name: 'Maroon', hex: '#800000' };
    if (s > 45 && l > 65) return { name: 'Pink', hex: '#EC4899' };
    return { name: 'Red', hex: '#EF4444' };
  }
  if (h >= 12 && h < 42) {
    if (l < 35) return { name: 'Brown', hex: '#78350F' };
    if (l > 75) return { name: 'Beige', hex: '#F5F5DC' };
    return { name: 'Orange', hex: '#F97316' };
  }
  if (h >= 42 && h < 68) {
    if (l < 48) return { name: 'Golden', hex: '#D97706' };
    return { name: 'Yellow', hex: '#EAB308' };
  }
  if (h >= 68 && h < 100) {
    return { name: 'Neon Green', hex: '#84CC16' };
  }
  if (h >= 100 && h < 155) {
    if (l < 30) return { name: 'Olive Green', hex: '#556B2F' };
    return { name: 'Green', hex: '#16A34A' };
  }
  if (h >= 155 && h < 195) {
    return { name: 'Teal', hex: '#14B8A6' };
  }
  if (h >= 195 && h < 218) {
    return { name: 'Sky Blue', hex: '#38BDF8' };
  }
  if (h >= 218 && h < 255) {
    if (l < 28) return { name: 'Navy Blue', hex: '#1E3A8A' };
    return { name: 'Royal Blue', hex: '#2563EB' };
  }
  if (h >= 255 && h < 290) {
    return { name: 'Purple', hex: '#9333EA' };
  }
  if (h >= 290 && h < 345) {
    return { name: 'Pink', hex: '#EC4899' };
  }
  return { name: 'Multicolor', hex: '#6B7280' };
}

const testUrls = [
  'https://mohasagor.com.bd/public/storage/images/products/W4K4aa7M8oNjKhTQW3PY6CuXL3bVQoa0kERVRrMU.png',
  'https://mohasagor.com.bd/public/storage/images/products/JdgK3a5brWRkCFtJevWq2DLOGRqSQi4K69gKa056.png',
  'https://mohasagor.com.bd/public/storage/images/products/5fM51EbWLajlNLVTIzELz26Z4p9KJW6XIEGI6pBd.png',
  'https://mohasagor.com.bd/public/storage/images/products/fgkSzrn6Sb0Aoudq5Gu0H9GX6k8aeOdoTKzx1awx.png',
  'https://mohasagor.com.bd/public/storage/images/products/m5SdKWZLzcvqueXyeUpZjtrWyVTevRovwe5rJKxx.png',
  'https://mohasagor.com.bd/public/storage/images/products/stQFGZgQYeAZ76sBU2Hw1KcIUMuudTqoxTsMo1dI.png',
  'https://mohasagor.com.bd/public/storage/images/products/ys35oWBaJXwIPx8k0qzDZpu8vhehAhHI1VlPlnmG.png',
  'https://mohasagor.com.bd/public/storage/images/products/US06pXaDOrGADbn3xl1Ntw6BiJrKKMB23tTkxfEJ.png'
];

async function analyze(url) {
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const { data, info } = await sharp(buf).resize(150, 150).raw().toBuffer({ resolveWithObject: true });

  const satPixels = [];
  const neutralPixels = [];

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i+1], b = data[i+2];
    const [h, s, l] = rgbToHsl(r, g, b);
    
    // Ignore pure white / near white background
    if (l > 92 && s < 15) continue;

    if (s > 22 && l > 12 && l < 85) {
      satPixels.push({ r, g, b, h, s, l });
    } else {
      neutralPixels.push({ r, g, b, h, s, l });
    }
  }

  if (satPixels.length > 50) {
    satPixels.sort((a, b) => (b.s * (100 - Math.abs(50 - b.l))) - (a.s * (100 - Math.abs(50 - a.l))));
    const topVivid = satPixels.slice(0, Math.max(10, Math.floor(satPixels.length * 0.35)));
    const avgH = Math.round(topVivid.reduce((acc, p) => acc + p.h, 0) / topVivid.length);
    const avgS = Math.round(topVivid.reduce((acc, p) => acc + p.s, 0) / topVivid.length);
    const avgL = Math.round(topVivid.reduce((acc, p) => acc + p.l, 0) / topVivid.length);
    const avgR = Math.round(topVivid.reduce((acc, p) => acc + p.r, 0) / topVivid.length);
    const avgG = Math.round(topVivid.reduce((acc, p) => acc + p.g, 0) / topVivid.length);
    const avgB = Math.round(topVivid.reduce((acc, p) => acc + p.b, 0) / topVivid.length);
    const hex = '#' + [avgR, avgG, avgB].map(x => x.toString(16).padStart(2, '0')).join('');
    return { ...nameHsl(avgH, avgS, avgL), avgH, avgS, avgL, hex, satCount: satPixels.length };
  } else {
    const avgL = neutralPixels.reduce((acc, p) => acc + p.l, 0) / (neutralPixels.length || 1);
    if (avgL < 30) return { name: 'Black', hex: '#000000', satCount: 0 };
    if (avgL > 75) return { name: 'White', hex: '#FFFFFF', satCount: 0 };
    return { name: 'Silver', hex: '#9CA3AF', satCount: 0 };
  }
}

for (let i = 0; i < testUrls.length; i++) {
  const res = await analyze(testUrls[i]);
  console.log(`Watch ${i+1}: ${res.name} (${res.hex}) - H: ${res.avgH}, S: ${res.avgS}, L: ${res.avgL}`);
}

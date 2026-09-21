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

const urls = [
  'https://mohasagor.com.bd/public/storage/images/products/qonJPpLYuT3h7ShX09sTdT4jtXfsf3zsH0DEunlP.png',
  'https://mohasagor.com.bd/public/storage/images/products/pX6P9MsvbpQeKVdPxOk1H6NkJ7PGUe9L3jwfAskZ.png',
  'https://mohasagor.com.bd/public/storage/images/products/Eq2ADvQg4OaJ8J5NIgn11xBtacbb9QwqTAeh8zx1.png',
  'https://mohasagor.com.bd/public/storage/images/products/1GBiHK3lvURU56UsFWwG7BgscUoIwkvYJTheKPxh.png'
];

for (let idx = 0; idx < urls.length; idx++) {
  const res = await fetch(urls[idx]);
  const buf = Buffer.from(await res.arrayBuffer());
  const { data, info } = await sharp(buf).resize(150, 150).raw().toBuffer({ resolveWithObject: true });

  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i+1], b = data[i+2];
    if (r > 232 && g > 232 && b > 232) continue; // background
    if (r < 18 && g < 18 && b < 18) continue; // shadow

    rSum += r; gSum += g; bSum += b; count++;
  }

  const avgR = Math.round(rSum / count);
  const avgG = Math.round(gSum / count);
  const avgB = Math.round(bSum / count);
  const [h, s, l] = rgbToHsl(avgR, avgG, avgB);
  const hex = '#' + [avgR, avgG, avgB].map(x => x.toString(16).padStart(2, '0')).join('');

  console.log(`Image ${idx + 1}: RGB(${avgR}, ${avgG}, ${avgB}) - Hex: ${hex} - HSL(${h}, ${s}%, ${l}%)`);
}

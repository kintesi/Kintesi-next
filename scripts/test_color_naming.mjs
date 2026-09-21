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

  // 1. Very low saturation (achromatic)
  if (s < 8) {
    if (l < 30) return { name: 'Black', hex };
    if (l > 75) return { name: 'White', hex };
    return { name: 'Grey', hex };
  }

  // 2. Low to medium saturation (pastels, earth tones, muted tones)
  if (s < 25) {
    if (h >= 55 && h < 155) {
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
      return { name: 'Red', hex };
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
    if (l > 65) return { name: 'Peach', hex };
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

const testSamples = [
  { desc: 'Bra Img 1', r: 68, g: 67, b: 71 },
  { desc: 'Bra Img 2', r: 213, g: 159, b: 134 },
  { desc: 'Bra Img 3', r: 141, g: 149, b: 106 },
  { desc: 'Bra Img 4', r: 161, g: 144, b: 134 },
];

for (const s of testSamples) {
  const res = nameColor(s.r, s.g, s.b);
  console.log(`${s.desc}: ${res.name} (${res.hex})`);
}

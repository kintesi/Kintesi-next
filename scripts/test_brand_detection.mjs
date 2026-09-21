import fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/data/dropshippingCatalog.json', 'utf8'));

// Curated authentic brands list
const authenticBrands = [
  // Multi-word brands first (crucial for precedence)
  'Pagani Design', 'Arctic Hunter', 'Anaya Hoor', 'Ali Leather', 'Mark Ryden',
  'Mini Focus', 'Hannah Martin', 'Charles Delon', 'Under Armour', 'New Balance',
  'Louis Vuitton', 'Tommy Hilfiger', 'Calvin Klein', 'Royal Kludge', 'Cooler Master',
  'SteelSeries', 'Golden Field', 'VEN-DENS', 'TP-Link', 'Western Digital', 'Bin Saeed',
  'Gul Ahmed', 'North Edge', 'Fire-Boltt', 'SoundPEATS',

  // Single-word brands
  'OLEVS', 'Poedagar', 'Curren', 'Naviforce', 'Casio', 'SKMEI', 'Binbond', 'LIGE', 'Benyar',
  'Megir', 'Chenxi', 'Sanda', 'WWOOR', 'SMAEL', 'Kademan', 'Sinobi', 'Crnaira', 'Nibosi',
  'Bidigo', 'Fastrack', 'Fossil', 'Titan', 'Citizen', 'Seiko', 'Tissot', 'Rolex', 'Rado',
  'Omega', 'Hublot', 'Zeblaze', 'Colmi', 'Amazfit', 'boAt', 'Dizo', 'Kospet',
  'Apple', 'Samsung', 'Xiaomi', 'Realme', 'OnePlus', 'Infinix', 'Tecno', 'Vivo', 'Oppo',
  'Sony', 'Lenovo', 'Remax', 'Havit', 'Baseus', 'Anker', 'Oraimo', 'Awei', 'Joyroom',
  'LDNIO', 'Hoco', 'Borofone', 'WiWU', 'Mcdodo', 'Usams', 'Ugreen', 'Vention', 'Orico',
  'Choetech', 'Essager', 'Kuulaa', 'Toocki', 'Haylou', 'QCY', 'Sanag', 'Celebrat', 'Yison',
  'Plextone', 'Edifier', 'Microlab', 'F&D', 'Jmary', 'Yunteng', 'Boya', 'Maxline', 'Joykaly',
  'Defender', 'Gree', 'Haier', 'Midea', 'G-Tide', 'Kisonli', 'Zealot', 'Tronsmart',
  'Logitech', 'Fantech', 'A4Tech', 'Rapoo', 'Redragon', 'Meetion', 'Motospeed', 'Dareu',
  'Ajazz', 'Keychron', 'Corsair', 'Razer', 'HyperX', 'Asus', 'MSI', 'Gigabyte', 'HP',
  'Dell', 'Acer', 'Tenda', 'Mercusys', 'D-Link', 'Netgear', 'V380', 'Hikvision', 'Dahua',
  'Imou', 'Ezviz', 'SanDisk', 'Kingston', 'Transcend', 'Lexar', 'Netac', 'Seagate',
  'Kemei', 'VGR', 'Gemei', 'HTC', 'Nova', 'Philips', 'Panasonic', 'Braun', 'Enchen',
  'ShowSee', 'Miyako', 'Walton', 'Singer', 'Bajaj', 'Jaipan', 'Prestige', 'Hawkins',
  'Geepas', 'Bange', 'Tigernu', 'Bullcaptain', 'Baellerry', 'Wildcraft', 'Samsonite',
  'Nike', 'Adidas', 'Puma', 'Reebok', 'Vans', 'Converse', 'Gucci', 'Zara', 'H&M',
  'Tawakkal', 'Bata', 'Apex', 'Lotto', 'Kaizar', 'Rezzel', 'SnowSoft'
];

export function detectBrand(title, desc) {
  const t = title || '';
  const d = desc || '';

  // 1. Check description explicit Brand: pattern
  const descMatch = d.match(/(?:brand|ব্র্যান্ড|Brand Name)\s*[:：\-–]\s*([^\r\n,<|.]+)/i);
  if (descMatch) {
    const rawB = descMatch[1].trim().split(/(?:model|sku|color|colour|material|origin|size|movement|dial|water|type|made|quality)/i)[0].trim();
    if (/no\s*brand|non[\s-]*brand|china|kintesi/i.test(rawB)) {
      // Explicitly unbranded
      return 'No Brand';
    }
    for (const b of authenticBrands) {
      if (new RegExp('^' + b.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i').test(rawB) ||
          new RegExp('\\b' + b.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i').test(rawB)) {
        return b;
      }
    }
  }

  // 2. Check title against authentic brands
  for (const b of authenticBrands) {
    const escaped = b.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp('(?:^|[\\s\\[\\(\\/\\-_])' + escaped + '(?:$|[\\s\\]\\)\\/\\-_:,])', 'i');
    if (regex.test(t)) {
      // Special exclusion checks to avoid false positives:
      // - "Vision" not after "Night" or "Clear"
      if (b.toLowerCase() === 'vision' && /night\s+vision|clear\s+vision/i.test(t)) {
        continue;
      }
      // - "Nova" in "Super Nova"
      if (b.toLowerCase() === 'nova' && /super\s+nova/i.test(t)) {
        continue;
      }
      return b;
    }
  }

  // Default to 'No Brand' as requested by user
  return 'No Brand';
}

const brandCounts = {};
let noBrandCount = 0;
let brandedCount = 0;

for (const p of data) {
  const b = detectBrand(p.title, p.description);
  brandCounts[b] = (brandCounts[b] || 0) + 1;
  if (b === 'No Brand') noBrandCount++;
  else brandedCount++;
}

console.log(`Total Products: ${data.length}`);
console.log(`Branded Products: ${brandedCount}`);
console.log(`No Brand Products: ${noBrandCount}`);
console.log('\nBrand distribution:');
const sorted = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]);
console.log(sorted.slice(0, 30));

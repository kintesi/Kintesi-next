import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMDIwNiwiZXhwIjoyMTA0NDk2MjA2fQ.7M3tSiIGGj2E0aG1JFm0bvHgWQ8024J5Pvuz2P58k8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function getCorrectCategoryAndSub(p) {
  const t = (p.title || '').toLowerCase();
  const c = p.category_id || '';
  const s = p.sub_category || (p.specifications && p.specifications.sub_category) || '';

  let newCat = c;
  let newSub = s;

  // 1. Maternity / Feeding Bra
  if (t.includes('maternity bra') || t.includes('feeding cotton bra') || t.includes('feeding bra') || t.includes('nursing bra')) {
    newCat = 'mother-baby';
    newSub = 'Maternity & Nursing Wear';
  }
  // 2. Hair towel (not salwar kameez!)
  else if (t.includes('hair towel')) {
    newCat = 'home-living';
    newSub = 'Bathroom Accessories & Towels';
  }
  // 3. Women's 3-piece salwar kameez
  else if ((t.includes('3 piece') || t.includes('three piece')) && !t.includes('beewax') && !t.includes('knife') && !t.includes('usb') && !t.includes('fan') && !t.includes('towel')) {
    newCat = 'womens-fashion';
    newSub = 'Salwar Kameez & 3 Piece';
  }
  // 4. Jewelry / Rings dumped in home-living
  else if (c === 'home-living' && ((t.includes('ring') && !t.includes('spring') && !t.includes('key ring') && !t.includes('keyring') && !t.includes('string') && !t.includes('pancake') && !t.includes('phil light') && !t.includes('ringlight') && !t.includes('iron') && !t.includes('soldering') && !t.includes('bearing') && !t.includes('sewing') && !t.includes('bbq') && !t.includes('grill') && !t.includes('towel ring')) || t.includes('jewellery') || t.includes('zirconia') || t.includes('heartstone') || t.includes('crystal crown ring'))) {
    newCat = 'womens-fashion';
    newSub = 'Fashion Jewelry & Ornaments';
  }
  // 5. Watches dumped in womens-fashion nightwear or home-living
  else if (t.includes('watch') && !t.includes('swatch') && !t.includes('patch') && !t.includes('matching') && !t.includes('straps') && !t.includes('stopwatch') && (c === 'home-living' || (c === 'womens-fashion' && s.includes('Nightwear')))) {
    newCat = 'watches-bags';
    if (t.includes('women') || t.includes('ladies') || t.includes('female')) {
      newSub = "Women's Designer Watches";
    } else {
      newSub = "Men's Analog & Luxury Watches";
    }
  }
  // 6. Audio glasses & Sunglasses in watches-bags or home
  else if (t.includes('audio glasses') || t.includes('smart glasses') || (c === 'watches-bags' && (t.includes('sunglasses') || t.includes('sun glasses') || t.includes('eyewear') || t.includes('eyeglass')))) {
    newCat = 'watches-bags';
    newSub = 'Sunglasses & Eyewear';
  }
  // 7. Belts in watches-bags
  else if (c === 'watches-bags' && (t.includes('leather belt') || t.includes('buckle leather belt') || t.includes('artificial leather belt'))) {
    newSub = 'Belts & Leather Accessories';
  }
  // 8. Skincare / Makeup in home-living
  else if (c === 'home-living' && (t.includes('melasma') || t.includes('whitening pearl') || t.includes('whitening night') || t.includes('sasi oil control powder') || t.includes('translucent powder') || t.includes('powder cake'))) {
    newCat = 'health-beauty';
    if (t.includes('powder')) {
      newSub = 'Makeup & Cosmetics';
    } else {
      newSub = 'Serums, Creams & Moisturizers';
    }
  }
  // 9. Hearing aid in home-living
  else if (t.includes('hearing aid')) {
    newCat = 'health-beauty';
    newSub = 'Medical Supplies & First Aid';
  }
  // 10. Hot water / Ice bag for pain relief
  else if (t.includes('hot water bag') || t.includes('ice bag, hot & cold therapy')) {
    newCat = 'health-beauty';
    newSub = 'Medical Supplies & First Aid';
  }
  // 11. Slimming capsules
  else if (t.includes('slimming capsules')) {
    newCat = 'health-beauty';
    newSub = 'Vitamins, Supplements & Nutrition';
  }
  // 12. Hair comb
  else if (t.includes('cushion comb') || t.includes('hair comb')) {
    newCat = 'health-beauty';
    newSub = 'Hair Care, Shampoos & Oils';
  }
  // 13. Bed sheets, pillows, blankets in Home & Kitchen Essentials
  else if (c === 'home-living' && (t.includes('bed sheet') || t.includes('bedsheet') || (t.includes('pillow') && !t.includes('speaker')) || (t.includes('cushion') && !t.includes('comb')) || (t.includes('blanket') && !t.includes('baby')))) {
    newSub = 'Bedding, Sheets & Blankets';
  }
  // 14. Bags mistakenly in home-living
  else if (c === 'home-living' && (t.includes('ladies bag') || t.includes('tote bag') || t.includes('fashionbag') || t.includes('shoulder bag') || t.includes('cross-body bag') || t.includes('messenger bag') || t.includes('side bag') || t.includes('travel/sports bag') || t.includes('gym bag') || t.includes('shopping bag') || t.includes('waist fashionable bag') || t.includes('3 pics bag combo') || t.includes('prettest bag') || t.includes('oxford cloth bag') || t.includes('anti-theft fashion'))) {
    newCat = 'watches-bags';
    if (t.includes('backpack') || t.includes('anti-theft')) {
      newSub = 'Backpacks & Laptop Bags';
    } else if (t.includes('travel') || t.includes('gym') || t.includes('luggage')) {
      newSub = 'Travel Luggage & Trolley Bags';
    } else if (t.includes('cross-body') || t.includes('shoulder') || t.includes('messenger') || t.includes('side bag') || t.includes('waist')) {
      newSub = 'Crossbody & Sling Bags';
    } else {
      newSub = "Women's Handbags & Purses";
    }
  }
  // 15. Tools & Multimeters in Home
  else if (c === 'home-living' && (t.includes('soldering') || t.includes('multimeter') || t.includes('welding') || t.includes('tatal'))) {
    newSub = 'Tools, DIY & Hardware';
  }
  // 16. Lamp holders in Bedding or elsewhere
  else if (c === 'home-living' && (t.includes('lamp holder') || t.includes('bulb holder'))) {
    newSub = 'Home Decor, Lights & Lamps';
  }
  // 17. Laser pointer
  else if (t.includes('laser pointer')) {
    newCat = 'electronic-accessories';
    newSub = 'Smart Gadgets & Accessories';
  }
  // 18. Egg dispenser & juice dispenser
  else if (c === 'home-living' && (t.includes('egg dispenser') || t.includes('juice dispenser') || t.includes('water and juice dispenser'))) {
    newSub = 'Kitchen Storage & Containers';
  }
  // 19. Cleaning brush
  else if (c === 'home-living' && t.includes('magic electric cleaning brush')) {
    newSub = 'Cleaning Tools & Organizers';
  }
  // 20. Car oil film cleaning brush
  else if (t.includes('oil film cleaning brush')) {
    newCat = 'automotives-motorbikes';
    newSub = 'Car & Bike Cleaning Wash / Polish';
  }
  // 21. Mosquito killer lamp
  else if (c === 'home-living' && t.includes('mosquito killer')) {
    newSub = 'Home Decor, Lights & Lamps';
  }
  // 22. Caps / Tupi
  else if (c === 'home-living' && (t.includes('supporter cap') || t.includes('customized cap') || t.includes('baseball cap') || t.includes('tupi') || t.includes('iqra'))) {
    if (t.includes('tupi') || t.includes('iqra')) {
      newCat = 'lifestyle-hobbies';
      newSub = 'Religious & Spiritual Items';
    } else {
      newCat = 'mens-fashion';
      newSub = 'Activewear & Sportswear';
    }
  }
  // 23. Pet sleeping bag
  else if (t.includes('cat sleeping bag')) {
    newCat = 'groceries-pet-supplies';
    newSub = 'Pet Toys & Grooming';
  }
  // 24. Dumbbell shape water bottle
  else if (t.includes('dumbbell shape water bottle')) {
    newCat = 'sports-outdoors';
    newSub = 'Water Bottles & Shakers';
  }
  // 25. Motorcycle ceramic mug
  else if (t.includes('motorcycle mug')) {
    newCat = 'home-living';
    newSub = 'Dinnerware & Cutlery';
  }
  // 26. Bulb humidifier in automotives
  else if (c === 'automotives-motorbikes' && t.includes('bulb humidifier')) {
    newCat = 'home-living';
    newSub = 'Home Decor, Lights & Lamps';
  }
  // 27. Over the door hanger in mens-fashion
  else if (t.includes('over the door 19-hook hanger')) {
    newCat = 'home-living';
    newSub = 'Cleaning Tools & Organizers';
  }
  // 28. Shoe bag in mens-fashion
  else if (t.includes('waterproof travel shoe bag')) {
    newCat = 'watches-bags';
    newSub = 'Travel Luggage & Trolley Bags';
  }
  // 29. Bicycle foot pump
  else if (t.includes('bicycle foot pumper')) {
    newCat = 'sports-outdoors';
    newSub = 'Cycling & Bicycles';
  }
  // 30. Camping stove in backpacks
  else if (t.includes('portable outdoor camping stove')) {
    newCat = 'home-living';
    newSub = 'Cookware & Non-Stick Pans';
  }
  // 31. Cameras / security in home-living, mother-baby, or computer-gaming
  else if ((t.includes('v380') || t.includes('spy pen camera') || t.includes('action camera') || t.includes('metal detector') || t.includes('chest mount camera') || t.includes('a9 wi-fi')) && !t.includes('children digital camera')) {
    newCat = 'electronic-accessories';
    newSub = 'Smart Gadgets & Accessories';
  }
  // 32. Multiplugs / chargers in home-living or computer-gaming
  else if (t.includes('multiplug') || t.includes('rack charger')) {
    newCat = 'electronic-accessories';
    newSub = 'Fast Chargers & Adapters';
  }
  // 33. Bluetooth tracker in home-living
  else if (t.includes('smart bluetooth tracker') || t.includes('item finder')) {
    newCat = 'electronic-accessories';
    newSub = 'Smart Gadgets & Accessories';
  }
  // 34. Portable printers in home-living
  else if (t.includes('pocket printer') || t.includes('portable thermal printer')) {
    newCat = 'computer-gaming';
    newSub = 'Printers, Scanners & Inks';
  }
  // 35. Shoulder / sling bags in home-living
  else if (t.includes('sport sling anti-theft shoulder bag')) {
    newCat = 'watches-bags';
    newSub = 'Crossbody & Sling Bags';
  }
  // 36. Fans in computer-gaming or home-living
  else if ((c === 'computer-gaming' || c === 'home-living') && (t.includes('desktop fan') || t.includes('air cooler') || t.includes('folding fan'))) {
    newCat = 'tv-home-appliances';
    newSub = 'Ceiling & Standing Fans';
  }
  // 37. Tissue box in computer-gaming
  else if (t.includes('ecoco multifunctional large tissue box')) {
    newCat = 'home-living';
    newSub = 'Home & Kitchen Essentials';
  }
  // 38. Phone holder mount in kitchen storage
  else if (t.includes('neck phone holder mount')) {
    newCat = 'electronic-accessories';
    newSub = 'Smart Gadgets & Accessories';
  }
  // 39. Mobile radiator cooler in cables
  else if (t.includes('cooling radiator') && c === 'electronic-accessories') {
    newSub = 'Smart Gadgets & Accessories';
  }
  // 40. Bluetooth speakers / phone stands in computer-gaming
  else if (c === 'computer-gaming' && (t.includes('bluetooth speaker') || t.includes('desktop phone') || t.includes('light stand') || t.includes('tripod'))) {
    newCat = 'electronic-accessories';
    if (t.includes('bluetooth speaker')) {
      newSub = 'Bluetooth Speakers';
    } else {
      newSub = 'Smart Gadgets & Accessories';
    }
  }
  // 41. Lavalier microphone in computer-gaming
  else if (t.includes('wireless lavalier microphone')) {
    newCat = 'electronic-accessories';
    newSub = 'Webcams & Microphones';
  }
  // 42. Mother-Baby specific fixes
  else if (c === 'mother-baby') {
    if (t.includes('baby blanket')) {
      newSub = 'Baby Cots & Bedding';
    } else if (t.includes('potty training') || t.includes('potty')) {
      newSub = 'Baby Bath & Grooming Kits';
    } else if (t.includes('safety wrist link') || t.includes('head protector helmet')) {
      newSub = 'Baby Safety & Accessories';
    } else if (t.includes('gyro bowl') || t.includes('snack bowl') || t.includes('water bottle for kids')) {
      newSub = 'Baby Feeding & Tableware';
    } else if (t.includes('panjabi')) {
      newSub = 'Kids Clothing & Fashion';
    } else if (t.includes('boxing set') || t.includes('handwriting practice book') || t.includes('children digital camera') || t.includes('walkie talkie')) {
      newSub = 'Toys, Walkers & Learning';
    } else if (t.includes('mosquito killer')) {
      newCat = 'home-living';
      newSub = 'Home & Kitchen Essentials';
    } else if (t.includes('labubu doll wireless earbuds')) {
      newCat = 'electronic-accessories';
      newSub = 'Wireless Earbuds & TWS';
    }
  }
  // 43. Health & Beauty specific fixes
  else if (c === 'health-beauty') {
    if (t.includes('dish washing gloves') || t.includes('beewax')) {
      newCat = 'home-living';
      newSub = 'Cleaning Tools & Organizers';
    } else if (t.includes('shower head')) {
      newCat = 'home-living';
      newSub = 'Bathroom Accessories & Towels';
    } else if (t.includes('fabric shaver & lint remover')) {
      newCat = 'tv-home-appliances';
      newSub = 'Irons & Garment Steamers';
    } else if (t.includes('attar') || t.includes('perfume')) {
      newSub = 'Perfumes, Attars & Body Sprays';
    } else if (t.includes('electric toothbrush') || t.includes('toothpaste dispenser') || t.includes('dental floss')) {
      newSub = 'Oral Care & Toothbrushes';
    } else if (t.includes('liquid concealer') || t.includes('facial powder')) {
      newSub = 'Makeup & Cosmetics';
    } else if (t.includes('hair clipper') || t.includes('beard trimmer') || t.includes('shaver') || t.includes('hair remover') || t.includes('grooming kit')) {
      newSub = 'Personal Care & Hygiene';
    }
  }
  // 44. TV & Home Appliances specific fixes
  else if (c === 'tv-home-appliances') {
    if (t.includes('water filter') || t.includes('purifier')) {
      newSub = 'Water Purifiers & Filters';
    } else if (t.includes('fridge storage box') || t.includes('cabinet pad for refrigerator')) {
      newCat = 'home-living';
      newSub = 'Kitchen Storage & Containers';
    }
  }

  return { newCat, newSub };
}

async function main() {
  const jsonPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  const catalog = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const modifiedProducts = [];

  catalog.forEach((p) => {
    const c = p.category_id || '';
    const s = p.sub_category || (p.specifications && p.specifications.sub_category) || '';
    const { newCat, newSub } = getCorrectCategoryAndSub(p);

    if (newCat !== c || newSub !== s) {
      p.category_id = newCat;
      p.sub_category = newSub;
      if (!p.specifications) {
        p.specifications = {};
      }
      p.specifications.sub_category = newSub;

      modifiedProducts.push({
        id: p.id,
        sku: p.sku,
        title: p.title,
        fromCat: c,
        fromSub: s,
        toCat: newCat,
        toSub: newSub,
        specifications: p.specifications,
      });
    }
  });

  console.log(`✅ Total modified products in catalog: ${modifiedProducts.length}`);

  // Write updated catalog to file
  fs.writeFileSync(jsonPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`💾 Saved updated catalog to ${jsonPath}`);

  if (modifiedProducts.length === 0) {
    console.log('No new updates needed in Supabase.');
    return;
  }

  // Sync to Supabase
  console.log(`⚡ Updating Supabase products table (${modifiedProducts.length} items)...`);
  const CONCURRENCY = 25;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < modifiedProducts.length; i += CONCURRENCY) {
    const chunk = modifiedProducts.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (item) => {
        const { error } = await supabase
          .from('products')
          .update({
            category_id: item.toCat,
            specifications: item.specifications,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        if (error) {
          console.error(`❌ Error updating [${item.sku}] ${item.id}:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      })
    );
    console.log(`Processed ${Math.min(i + CONCURRENCY, modifiedProducts.length)} / ${modifiedProducts.length}`);
  }

  console.log(`\n🎉 SYNC COMPLETE!`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

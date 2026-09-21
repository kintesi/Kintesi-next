import fs from 'fs';

const catalogPath = 'd:/kintesi/src/data/dropshippingCatalog.json';
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

export function smartClassify(title, existingCat = '', brand = '') {
  const t = (title || '').toLowerCase().trim();

  // 1. MOTHER & BABY / KIDS
  if (
    /(\bbaby\b|\bkids\b|\bkid\b|\binfant\b|\btoddler\b|\bnewborn\b|বাচ্চা|শিশুদের|শিশুর)/i.test(t) ||
    /(\btoy\b|\btoys\b|\bdoll\b|talking tom|teddy bear|action figure|remote control car|rc car|খেলনা)/i.test(t) ||
    /(\bdiaper\b|\bpampers\b|baby wipes|feeding bottle|\bteether\b|\bstroller\b|\bpram\b)/i.test(t)
  ) {
    let sub = 'Toys, Walkers & Learning';
    if (/diaper|wipes/i.test(t)) sub = 'Baby Diapers & Wipes';
    else if (/bottle|feeding|teether/i.test(t)) sub = 'Feeding Bottles & Teethers';
    else if (/cloth|romper|dress|frock/i.test(t)) sub = 'Baby Clothing & Rompers';
    return { category_id: 'mother-baby', sub_category: sub, gender: 'Kids' };
  }

  // 2. WOMEN'S FASHION (Saree, Salwar Kameez, Borka, Hijab, Gown, Bra, Jewelry)
  if (
    /(saree|sharee|শাড়ি|শাড়ি|শাড়ী|kota|জামদানি|কাতান)/i.test(t) ||
    /(kurti|kurtis|kameez|salwar|three piece|থ্রি পিস|কামিজ|কুর্তি|কটি|tunic|kaftan|co-ord)/i.test(t) ||
    /(borka|abaya|hijab|khimar|বোরকা|বোরখা|আবায়া|হিজাব|burqa)/i.test(t) ||
    /(lehenga|party wear|\bgown\b|western dress|crop top|palazzo|nightwear|nighty)/i.test(t) ||
    /(\bbra\b|\bbras\b|brassiere|lingerie|\bpanty\b|\bpanties\b|ladies undergarment)/i.test(t) ||
    /(necklace|earring|earrings|pendant|bracelet|\bbangle\b|\bbangles\b|payel|shita haar|নাকফুল|দুল|হার|গহনা|জুয়েলারি|জুয়েলারি|\bchoker\b)/i.test(t) ||
    /(ladies heel|women heel|ladies shoe|ladies sandal|ladies footwear|high heel)/i.test(t) ||
    /((women|ladies|girl|female|মহিলা|মেয়ে).*(dress|top|clothing|heel|sandal|shoe))/i.test(t) ||
    (/women|ladies|girl|female/i.test(t) && /hoodie|jacket|t-shirt|tshirt|shirt|pant|trouser/i.test(t))
  ) {
    let sub = 'Western Wear & Tops';
    if (/saree|sharee|শাড়ি|শাড়ি/i.test(t)) sub = 'Sharee';
    else if (/kurti|kameez|salwar|three piece/i.test(t)) sub = 'Salwar Kameez & Kurtis';
    else if (/borka|abaya|hijab|khimar|বোরকা/i.test(t)) sub = 'Borka, Abaya & Hijab';
    else if (/lehenga|party wear/i.test(t)) sub = 'Lehenga & Party Wear';
    else if (/gown|dress/i.test(t)) sub = 'Dresses & Gowns';
    else if (/bra|lingerie|panty|nightwear|nighty/i.test(t)) sub = 'Nightwear & Loungewear';
    else if (/heel|sandal|shoe|footwear/i.test(t)) sub = "Women's Footwear & Heels";
    else if (/necklace|earring|pendant|bangle|bracelet|payel|haar|দুল|হার|গহনা/i.test(t)) sub = 'Fashion Jewelry & Ornaments';
    return { category_id: 'womens-fashion', sub_category: sub, gender: 'Women' };
  }

  // 3. MEN'S FASHION (T-Shirts, Polos, Shirts, Panjabi, Jeans, Pants, Hoodies, Jackets, Footwear)
  if (
    /(panjabi|punjabi|পাঞ্জাবি|পাঞ্জাবী|kurta|katua|fatua|পায়জামা|payjama)/i.test(t) ||
    /(t-shirt|tshirt|t shirt|\bpolo\b|polo shirt|টি-শার্ট|টি শার্ট|drop shoulder|drop-shoulder|half sleeve|round neck|jersey febric|jersey)/i.test(t) ||
    /(casual shirt|formal shirt|\bshirt\b|\bshirts\b|শার্ট|ডেনিম শার্ট)/i.test(t) ||
    /(jeans|chino|chinos|gabardine|\bpant\b|\bpants\b|trouser|trousers|sweatpant|jogger|joggers|shorts|প্যান্ট)/i.test(t) ||
    /(hoodie|hoodies|jacket|jackets|winterwear|sweater|sweatshirt|windbreaker|blazer|suit|হুডি|জ্যাকেট)/i.test(t) ||
    /(sneaker|sneakers|loafer|loafers|\bshoes\b|\bshoe\b|sandal|sandals|জুতা|জুতো|স্যান্ডেল|slides|slippers)/i.test(t) ||
    /(boxer|boxers|lungi|লুঙ্গি|men.*undergarment|briefs)/i.test(t) ||
    /(tracksuit|track suit|activewear)/i.test(t)
  ) {
    let sub = 'T-Shirts & Polos';
    if (/panjabi|punjabi|kurta|katua|fatua|পাঞ্জাবি/i.test(t)) sub = 'Panjabi & Payjama';
    else if (/t-shirt|tshirt|t shirt|polo|টি-শার্ট|drop shoulder|jersey/i.test(t)) sub = 'T-Shirts & Polos';
    else if (/shirt|shirts|শার্ট/i.test(t)) sub = 'Casual & Formal Shirts';
    else if (/jeans|chino|gabardine|pant|trouser|sweatpant|jogger|shorts|প্যান্ট/i.test(t)) sub = 'Jeans, Chinos & Trousers';
    else if (/hoodie|jacket|sweater|sweatshirt|winter/i.test(t)) sub = 'Jackets, Hoodies & Winterwear';
    else if (/sneaker|loafer|shoe|sandal|জুতা|জুতো/i.test(t)) sub = "Men's Footwear & Sneakers";
    else if (/blazer|suit/i.test(t)) sub = 'Formal Suits & Blazers';
    else if (/boxer|lungi|undergarment|brief/i.test(t)) sub = 'Underwear & Loungewear';
    return { category_id: 'mens-fashion', sub_category: sub, gender: 'Men' };
  }

  // 4. WATCHES, BAGS & EYEWEAR
  if (
    /(\bwatch\b|\bwatches\b|smartwatch|chronograph|quartz watch|ঘড়ি|ঘড়ি)/i.test(t) ||
    /(sunglasses|sunglass|eyewear|anti-glare|polarized|sun glass|choshma|সানগ্লাস)/i.test(t) ||
    /(backpack|backpacks|laptop bag|school bag|travel bag|luggage|trolley|duffel bag|duffle)/i.test(t) ||
    /(wallet|cardholder|card holder|purse|handbag|clutch|crossbody|sling bag|মানিব্যাগ)/i.test(t) ||
    /(leather belt)/i.test(t)
  ) {
    let sub = "Men's Analog & Luxury Watches";
    let gender = 'Unisex';
    if (/smartwatch/i.test(t)) sub = 'Smartwatches & Fitness Bands';
    else if (/watch/i.test(t)) {
      if (/women|ladies|girl/i.test(t)) { sub = "Women's Designer Watches"; gender = 'Women'; }
      else { sub = "Men's Analog & Luxury Watches"; gender = 'Men'; }
    } else if (/sunglass|eyewear|glasses/i.test(t)) sub = 'Watch Straps & Accessories';
    else if (/wallet|cardholder|মানিব্যাগ|leather belt/i.test(t)) { sub = 'Leather Wallets & Cardholders'; gender = 'Men'; }
    else if (/luggage|trolley|travel/i.test(t)) sub = 'Travel Luggage & Trolley Bags';
    else if (/handbag|purse|clutch|ladies bag/i.test(t)) { sub = "Women's Handbags & Purses"; gender = 'Women'; }
    else sub = 'Backpacks & Laptop Bags';
    return { category_id: 'watches-bags', sub_category: sub, gender };
  }

  // 5. TV & HOME APPLIANCES (Kitchen electronic appliances, heavy electronics, fans)
  if (
    /(grinder|blender|juicer|food processor|mixer|spice grinder|meat grinder)/i.test(t) ||
    /(air fryer|deep fryer|electric cooker|rice cooker|pressure cooker|slow cooker|induction cooker|electric kettle|\bkettle\b)/i.test(t) ||
    /(vacuum cleaner|robot vacuum|garment steamer|steam iron|electric iron|sewing machine)/i.test(t) ||
    /(refrigerator|freezer|air conditioner|inverter ac|washing machine|microwave oven|electric oven)/i.test(t) ||
    /(water purifier|water dispenser|water filter|ro purifier)/i.test(t) ||
    /(turbo fan|rechargeable fan|standing fan|ceiling fan|table fan|mini fan|neck fan|handheld fan|portable fan|cooling fan|exhaust fan)/i.test(t)
  ) {
    let sub = 'Home & Kitchen Appliances';
    if (/grinder|blender|juicer|food processor|mixer/i.test(t)) sub = 'Blenders, Grinders & Juicers';
    else if (/air fryer|cooker|kettle|fryer|oven/i.test(t)) sub = 'Air Fryers & Electric Cookers';
    else if (/fan|cooler/i.test(t)) sub = 'Ceiling & Standing Fans';
    else if (/purifier|dispenser|filter/i.test(t)) sub = 'Water Purifiers & Filters';
    else if (/iron|steamer/i.test(t)) sub = 'Irons & Garment Steamers';
    return { category_id: 'tv-home-appliances', sub_category: sub, gender: 'Unisex' };
  }

  // 6. COMPUTER & GAMING
  if (
    /(keyboard|mechanical keyboard|keycap)/i.test(t) ||
    /(gaming mouse|wireless mouse|\bmouse\b)/i.test(t) ||
    /(laptop|desktop|notebook|\bpc\b|computer|monitor)/i.test(t) ||
    /(router|wifi|wi-fi|broadband|repeater|access point)/i.test(t) ||
    /(graphic card|graphics card|gpu|motherboard|\bram\b|\bssd\b|hard drive|internal hdd|pen drive|flash drive)/i.test(t) ||
    /(gamepad|controller|gaming console|joystick)/i.test(t)
  ) {
    let sub = 'PC Components & Graphics Cards';
    if (/router|wifi|wi-fi/i.test(t)) sub = 'Routers & Networking Gear';
    else if (/keyboard|mouse/i.test(t)) sub = 'Mechanical Keyboards & Mice';
    else if (/laptop/i.test(t)) sub = 'Laptops & Ultrabooks';
    else if (/monitor/i.test(t)) sub = 'Gaming Monitors';
    else if (/controller|gamepad|console/i.test(t)) sub = 'Gaming Consoles & Controllers';
    return { category_id: 'computer-gaming', sub_category: sub, gender: 'Unisex' };
  }

  // 7. ELECTRONIC ACCESSORIES / GADGETS (Earbuds, Speakers, Cables, Chargers, Mic)
  if (
    /(\bearbuds\b|\btws\b|\bheadphone\b|\bheadphones\b|\bearphone\b|\bearphones\b|\bairpods\b|\bheadset\b)/i.test(t) ||
    /(\bspeaker\b|\bspeakers\b|bluetooth speaker|soundbar)/i.test(t) ||
    /(fast charger|charger|adapter|wall charger|wireless charger)/i.test(t) ||
    /(power bank|powerbank|portable battery)/i.test(t) ||
    /(\bcable\b|charging cable|usb cable|type-c|type c|hdmi|\botg\b|converter|\bhub\b)/i.test(t) ||
    /(mobile cooler|radiator|phone trigger|selfie stick|tripod|ring light|\bmicrophone\b|\bmic\b)/i.test(t) ||
    /(projector|smart gadget)/i.test(t)
  ) {
    let sub = 'Smart Gadgets & Accessories';
    if (/earbud|tws|headphone|earphone|headset/i.test(t)) sub = 'Wireless Earbuds & TWS';
    else if (/speaker/i.test(t)) sub = 'Bluetooth Speakers';
    else if (/charger|adapter/i.test(t)) sub = 'Fast Chargers & Adapters';
    else if (/power bank|powerbank/i.test(t)) sub = 'Power Banks & Portable Batteries';
    else if (/cable|type-c|converter|hub/i.test(t)) sub = 'Cables, Converters & Hubs';
    return { category_id: 'electronic-accessories', sub_category: sub, gender: 'Unisex' };
  }

  // 8. HEALTH & BEAUTY
  if (
    /(heating pad|period belt|pain relief.*belt|posture corrector|back support|body shaper|slimming belt|sweat slim|toning belt)/i.test(t) ||
    /(serum|cream|lotion|sunscreen|spf|face wash|facewash|facial|cleanser|scrub|soap|moisturizer|aloe vera)/i.test(t) ||
    /(shampoo|conditioner|hair oil|hair care|hair mask|hair serum|hair removal|wax)/i.test(t) ||
    /(perfume|attar|body spray|fragrance|deodorant|bodyspray|আতর|পারফিউম)/i.test(t) ||
    /(makeup|lipstick|mascara|eyeliner|foundation|compact powder|concealer|blush)/i.test(t) ||
    /(derma roller|blackhead|acne|pore|scar|ointment|massager|massage)/i.test(t) ||
    /(shaver|trimmer|hair clipper|hair dryer|straightener|nail clipper|manicure|pedicure)/i.test(t) ||
    /(oral care|toothbrush|toothpaste|teeth|weight gain|supplement|protein shake|vitamins)/i.test(t)
  ) {
    let sub = 'Serums, Creams & Moisturizers';
    if (/hair|shampoo|conditioner|oil/i.test(t)) sub = 'Hair Care, Shampoos & Oils';
    else if (/perfume|attar|spray|fragrance/i.test(t)) sub = 'Perfumes, Attars & Body Sprays';
    else if (/makeup|lipstick|mascara|cosmetics/i.test(t)) sub = 'Makeup & Cosmetics';
    else if (/belt|pad|posture|support|shaper|massager|trimmer|shaver|dryer/i.test(t)) sub = 'Personal Care & Hygiene';
    else if (/face wash|facewash|cleanser/i.test(t)) sub = 'Face Cleansers & Face Wash';
    else if (/sunscreen|spf/i.test(t)) sub = 'Sunscreen & SPF Care';
    else if (/supplement|weight gain|protein|vitamin/i.test(t)) sub = 'Vitamins, Supplements & Nutrition';
    return { category_id: 'health-beauty', sub_category: sub, gender: 'Unisex' };
  }

  // 9. AUTOMOTIVES & MOTORBIKES
  if (
    /(car hammer|window breaker|seat belt cutter|glass breaker)/i.test(t) ||
    /(helmet|riding gear|bike light|led indicator|motorcycle|motorbike)/i.test(t) ||
    /(car polish|car wash|car shampoo|car perfume|air freshener|seat cover|car mat|car cleaner|car tire|tyre puncture|car security)/i.test(t) ||
    /(car mount|bike mount|mobile holder.*(bike|car)|(bike|car).*mobile holder)/i.test(t)
  ) {
    let sub = 'Car & Bike Accessories';
    if (/helmet|riding/i.test(t)) sub = 'Helmets & Riding Gear';
    else if (/light|led/i.test(t)) sub = 'Bike Lights & LED Indicators';
    else if (/mount|holder/i.test(t)) sub = 'Mobile Holders for Bikes/Cars';
    else if (/perfume|freshener/i.test(t)) sub = 'Car Perfumes & Air Fresheners';
    else if (/clean|wash|polish/i.test(t)) sub = 'Car & Bike Cleaning Wash / Polish';
    return { category_id: 'automotives-motorbikes', sub_category: sub, gender: 'Unisex' };
  }

  // 10. HOME & LIVING (Fallback default)
  let sub = 'Home & Kitchen Essentials';
  if (/mop|bucket|hanger|cleaner|clothesline|organizer|hook/i.test(t)) sub = 'Cleaning Tools & Organizers';
  else if (/shoe rack|rack|shelf|storage|box|container|condiment/i.test(t)) sub = 'Kitchen Storage & Containers';
  else if (/pan|pot|cookware|wok|strainer|lighter|stove|chopper|slicer|cutter|grater|knife|cleaver/i.test(t)) sub = 'Cookware & Non-Stick Pans';
  else if (/table cloth|cover|bedsheet|blanket|pillow|curtain|carpet|mat/i.test(t)) sub = 'Bedding, Sheets & Blankets';
  else if (/bulb|light|lamp/i.test(t)) sub = 'Home Decor, Lights & Lamps';
  else if (/screwdriver|wire stripper|tool|hardware|baton|wrench|drill/i.test(t)) sub = 'Tools, DIY & Hardware';
  else if (/spoon|fork|dinnerware|cutlery|mug|cup|bottle|flask/i.test(t)) sub = 'Dinnerware & Cutlery';
  else if (/bath|towel|shower|faucet/i.test(t)) sub = 'Bathroom Accessories & Towels';
  return { category_id: 'home-living', sub_category: sub, gender: 'Unisex' };
}

// Verification checks
console.log('1. Jersey Febrics T-shirt with Islamic Message (Ash):', smartClassify('Jersey Febrics T-shirt with Islamic Message (Ash)'));
console.log('2. Men\'s Jersey Febrics T-Shirt with Islamic calligraphy:', smartClassify('Men\'s Jersey Febrics T-Shirt with Islamic calligraphy (White)'));
console.log('3. Islam is light Islamic Hoodie:', smartClassify('Islam is light Islamic Hoodie'));
console.log('4. Polarized Sunglasses:', smartClassify('Premium Luxury Polarized Sunglasses - High-Grade...'));
console.log('5. Maternity Bra:', smartClassify('Maternity Bra (Beige)'));
console.log('6. Fast Wireless Earbuds:', smartClassify('Pro TWS Wireless Earbuds Bluetooth 5.3'));
console.log('7. Rechargeable Fan:', smartClassify('Mini Portable Rechargeable Neck Fan'));

let misclassified = 0;
for (const p of catalog) {
  const res = smartClassify(p.title);
  if (res.category_id === 'electronic-accessories' && /t-shirt|shirt|hoodie|jersey/i.test(p.title)) {
    misclassified++;
    console.log('Still misclassified:', p.title);
  }
}
console.log('Total clothing in electronic accessories with smartClassify:', misclassified);

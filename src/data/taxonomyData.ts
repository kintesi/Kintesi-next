export interface TaxonomyCategory {
  id: string;
  name: string;
  bnName: string;
  sector: 'personal_care' | 'health_wellness' | 'gadgets' | 'fashion_men' | 'fashion_women' | 'jewelry_watches' | 'beauty' | 'groceries' | 'home' | 'kids' | 'sports' | 'automotive' | 'books_stationery' | 'pets' | 'general';
  suggestedCategoryId: string;
  tags: string[];
}

export const SECTOR_TABS = [
  {
    "id": "all",
    "label": "🌐 All Categories (সকল ক্যাটাগরি)"
  },
  {
    "id": "personal_care",
    "label": "🧴 Personal Care & Intimate (ব্যক্তিগত যত্ন ও হাইজিন)"
  },
  {
    "id": "health_wellness",
    "label": "💊 Health & First Aid (স্বাস্থ্য ও ফার্স্ট এইড)"
  },
  {
    "id": "gadgets",
    "label": "⚡ Gadgets & Tech (গ্যাজেট ও টেক)"
  },
  {
    "id": "fashion_men",
    "label": "👔 Men's Fashion (পুরুষদের ফ্যাশন)"
  },
  {
    "id": "fashion_women",
    "label": "👗 Women's Fashion (নারীদের ফ্যাশন)"
  },
  {
    "id": "jewelry_watches",
    "label": "⌚ Watches & Jewelry (ঘড়ি ও গহনা)"
  },
  {
    "id": "beauty",
    "label": "✨ Beauty & Cosmetics (প্রসাধন)"
  },
  {
    "id": "groceries",
    "label": "🍃 Groceries & Food (খাবার ও মুদি)"
  },
  {
    "id": "home",
    "label": "🏠 Home & Kitchen (গৃহস্থালি ও কিচেন)"
  },
  {
    "id": "kids",
    "label": "👶 Baby & Kids (বাচ্চাদের পণ্য)"
  },
  {
    "id": "sports",
    "label": "⚽ Sports & Fitness (খেলাধুলা ও ফিটনেস)"
  },
  {
    "id": "automotive",
    "label": "🏍️ Bike & Car (বাইক ও গাড়ি)"
  },
  {
    "id": "books_stationery",
    "label": "📚 Books & Stationery (বই ও স্টেশনারি)"
  },
  {
    "id": "pets",
    "label": "🐾 Pet Care (পোষা প্রাণী)"
  }
] as const;

export const TAXONOMY_DATA: TaxonomyCategory[] = [
  {
    id: "shaving-beard-grooming",
    name: "Shaving, Beard Care & Trimmers",
    bnName: "শেভিং, বিয়ার্ড কেয়ার ও ট্রিমার",
    sector: "personal_care",
    suggestedCategoryId: "beauty-skincare",
    tags: ["shaving cream","shaving foam","shaving gel","razor","razor blade","safety razor","disposable razor","aftershave","after shave lotion","beard oil","beard balm","beard serum","beard growth oil","trimmer","beard trimmer","electric shaver","shaving brush","gillette","clipper","grooming kit","শেভিং ফোম","শেভিং ক্রিম","রেজর","ব্লেড","আফটার শেভ","দাড়ি কামানোর রেজর","দাড়ি কাটার ট্রিমার","বিয়ার্ড অয়েল","ট্রিমার","শেভার","বিয়ার্ড গ্রুমিং","শেভিং ব্রাশ","জিলট","দাড়ির যত্ন"]
  },

  {
    id: "sanitary-pads-feminine-hygiene",
    name: "Sanitary Napkins, Tampons & Period Care",
    bnName: "স্যানিটারি ন্যাপকিন, প্যাড ও পিরিয়ড কেয়ার",
    sector: "personal_care",
    suggestedCategoryId: "beauty-skincare",
    tags: ["sanitary pad","sanitary napkin","ultra thin pad","heavy flow pad","wings pad","cottony soft pad","menstrual pad","tampon","panty liner","period care","period panties","overnight pad","whisper","stayfree","senora","freedom","joya","femi9","anion pad","স্যানিটারি প্যাড","স্যানিটারি ন্যাপকিন","পিরিয়ড প্যাড","মেনস্ট্রুয়াল প্যাড","উইংস প্যাড","প্যান্টি লাইনার","ট্যাম্পন","পিরিয়ড কেয়ার","স্যানিটারি তোয়ালে","পিরিয়ড প্যান্টি","মেয়েদের প্যাড"]
  },

  {
    id: "menstrual-cups-intimate-wash",
    name: "Menstrual Cups & Intimate Wash",
    bnName: "মেনস্ট্রুয়াল কাপ ও ইন্টিমেট ওয়াশ",
    sector: "personal_care",
    suggestedCategoryId: "beauty-skincare",
    tags: ["menstrual cup","silicone menstrual cup","reusable menstrual cup","intimate wash","feminine wash","v-wash","ph balanced wash","intimate hygiene","intimate wipes","cleansing foam","vagina wash","মেনস্ট্রুয়াল কাপ","ইন্টিমেট ওয়াশ","ভি ওয়াশ","ফেমিনিন ওয়াশ","পিএইচ ব্যালেন্স ওয়াশ","ইন্টিমেট ওয়াইপস","মেয়েদের ইন্টিমেট কেয়ার","সিলিকন কাপ","গোপন অঙ্গের পরিচ্ছন্নতা"]
  },

  {
    id: "sexual-wellness-contraception",
    name: "Condoms, Lubricants & Sexual Wellness",
    bnName: "কনডম, লুব্রিকেন্ট ও সেক্সুয়াল ওয়েলনেস",
    sector: "personal_care",
    suggestedCategoryId: "beauty-skincare",
    tags: ["condoms","dotted condoms","ribbed condoms","thin condoms","ultra thin condom","extra lubricated condom","flavored condom","delay spray","climax control spray","personal lubricant","water based lubricant","silicone lube","durex","moods","sensations","pleasure","sexual wellness","protection","contraceptive","safe sex","pregnancy test kit","strip test","কনডম","ডটেড কনডম","আল্ট্রা থিন কনডম","লুব্রিকেটেড কনডম","লুব্রিকেন্ট জেল","পার্সোনাল লুব্রিকেন্ট","ডিলে স্প্রে","সেক্সুয়াল ওয়েলনেস","জন্মনিয়ন্ত্রণ","প্রটেকশন","প্রেগন্যান্সি টেস্ট কিট","ডুরেক্স"]
  },

  {
    id: "mens-intimate-grooming",
    name: "Men's Intimate & Groin Grooming",
    bnName: "পুরুষদের ইন্টিমেট ও গ্রুমিং কেয়ার",
    sector: "personal_care",
    suggestedCategoryId: "beauty-skincare",
    tags: ["mens intimate wash","intimate wash for men","manscaping trimmer","ball trimmer","groin trimmer","pubic hair trimmer","anti chafing cream","chafing stick","groin wash","sweat defense powder","body hair trimmer","men intimate hygiene","পুরুষদের ইন্টিমেট ওয়াশ","গ্রোইন ট্রিমার","মেনস পার্সোনাল কেয়ার","পুরুষদের গোপন অঙ্গের পরিচ্ছন্নতা","বডি হেয়ার ট্রিমার","অ্যান্টি চ্যাফিং ক্রিম","মেনস হাইজিন"]
  },

  {
    id: "oral-dental-care",
    name: "Toothbrushes, Toothpaste & Dental Care",
    bnName: "টুথব্রাশ, টুথপেস্ট ও ডেন্টাল কেয়ার",
    sector: "personal_care",
    suggestedCategoryId: "beauty-skincare",
    tags: ["toothbrush","electric toothbrush","charcoal toothbrush","soft bristle toothbrush","bamboo toothbrush","toothpaste","fluoride toothpaste","herbal toothpaste","sensitive toothpaste","whitening toothpaste","sensodyne","colgate","closeup","pepsodent","mouthwash","listerine","dental floss","floss picks","tongue cleaner","teeth whitening kit","টুথব্রাশ","ইলেকট্রিক টুথব্রাশ","টুথপেস্ট","মাউথওয়াশ","দাঁতের মাজন","ডেন্টাল ফ্লস","সেনসোডাইন","কোলগেট","ক্লোজআপ","দাঁত সাদা করার কিট","জিহ্বা পরিষ্কারক","মাড়ির যত্ন"]
  },

  {
    id: "bath-body-wash",
    name: "Bath Soaps, Shower Gels & Scrubs",
    bnName: "সাবান, বডি ওয়াশ ও বাথ স্ক্রাব",
    sector: "personal_care",
    suggestedCategoryId: "beauty-skincare",
    tags: ["soap","bath soap","beauty soap","antibacterial soap","organic soap","handmade soap","body wash","shower gel","moisturizing body wash","body scrub","exfoliating scrub","coffee scrub","loofah","bath sponge","back scrubber","bath salt","dove soap","dettol soap","lifebuoy","সাবান","বডি ওয়াশ","শাওয়ার জেল","গোসলের সাবান","ডোভ সাবান","ডেটল সাবান","বডি স্ক্রাব","লোফা","বাথ স্পঞ্জ","বডি এক্সফোলিয়েটর"]
  },

  {
    id: "deodorants-rollons",
    name: "Deodorants, Roll-ons & Antiperspirants",
    bnName: "ডিওডোরেন্ট, রোল-অন ও বডি স্প্রে",
    sector: "personal_care",
    suggestedCategoryId: "beauty-skincare",
    tags: ["deodorant","roll on","underarm roll on","antiperspirant","deodorant stick","body spray","fragrance spray","armpit lightening","sweat control","48h fresh","nivea roll on","rexona","fogg","axe","ডিওডোরেন্ট","রোল অন","আন্ডারআর্ম রোল অন","ঘামের দুর্গন্ধ নাশক","বডি স্প্রে","আন্ডারআর্ম ব্রাইটনিং","ঘাম প্রতিরোধক","বগল ফর্সাকারী রোল অন"]
  },

  {
    id: "hair-removal-waxing",
    name: "Hair Removal Creams, Wax & Epilators",
    bnName: "হেয়ার রিমুভাল ক্রিম, ওয়াক্স ও এপিলেটর",
    sector: "personal_care",
    suggestedCategoryId: "beauty-skincare",
    tags: ["hair removal cream","depilatory cream","veet cream","wax strips","cold wax","hot wax","wax beans","epilator","bikini razor","eyebrow razor","facial hair remover","derma planning","painless hair remover","হেয়ার রিমুভাল ক্রিম","ভিট ক্রিম","ওয়াক্স স্ট্রিপ","ওয়াক্সিং কিট","এপিলেটর","বিকিনি রেজর","ফেসিয়াল হেয়ার রিমুভার","লোম দূর করার ক্রিম"]
  },

  {
    id: "mens-innerwear-boxers",
    name: "Men's Boxers, Briefs & Vests",
    bnName: "পুরুষদের বক্সার, আন্ডারওয়্যার ও গেঞ্জি",
    sector: "personal_care",
    suggestedCategoryId: "mens-fashion",
    tags: ["boxers","boxer briefs","briefs","trunks","cotton underwear","seamless underwear","sando genji","vest","sleeveless vest","undershirt","innerwear","thermal innerwear","calvin klein","jockey","rupa","বক্সার","ব্রিফ","আন্ডারওয়্যার","জাঙ্গিয়া","স্যান্ডো গেঞ্জি","ভেস্ট","কটন আন্ডারওয়্যার","পুরুষদের ইনারওয়্যার","অন্তর্বাস"]
  },

  {
    id: "womens-innerwear-lingerie",
    name: "Women's Bras, Panties & Shapewear",
    bnName: "ব্রা, প্যান্টি, নাইটি ও নারীদের ইনারওয়্যার",
    sector: "personal_care",
    suggestedCategoryId: "womens-fashion",
    tags: ["bra","padded bra","non padded bra","push up bra","sports bra","t-shirt bra","seamless bra","cotton bra","nursing bra","panties","seamless panty","hipsters","thongs","boy shorts","shapewear","tummy tucker","body shaper","nighty","nightdress","lingerie","slip","camisole","ব্রা","প্যাডেড ব্রা","স্পোর্টস ব্রা","টি-শার্ট ব্রা","সুতি ব্রা","প্যান্টি","সিমলেস প্যান্টি","শেপওয়্যার","টামি টাকার","নাইটি","নারীদের অন্তর্বাস","স্লিপ"]
  },

  {
    id: "hand-foot-care",
    name: "Foot Creams, Crack Creams & Nail Care",
    bnName: "পা ফাটার ক্রিম, হ্যান্ড ক্রিম ও নেইল কেয়ার",
    sector: "personal_care",
    suggestedCategoryId: "beauty-skincare",
    tags: ["crack cream","heel balm","foot cream","foot scrubber","pumice stone","nail cutter","nail clipper","manicure set","pedicure kit","hand cream","hand wash","liquid soap","hand sanitizer","পা ফাটার ক্রিম","হিল বাম","ফুট স্ক্রাবার","নেইল কাটার","ম্যানিকিউর কিট","পেডিকিউর সেট","হ্যান্ড ক্রিম","হ্যান্ড ওয়াশ","হাত ও পায়ের যত্ন"]
  },

  {
    id: "first-aid-medical-supplies",
    name: "First Aid, Antiseptics & Bandages",
    bnName: "ফার্স্ট এইড, স্যাভলন ও প্রাথমিক চিকিৎসা",
    sector: "health_wellness",
    suggestedCategoryId: "groceries-daily-essentials",
    tags: ["first aid box","first aid kit","antiseptic liquid","savlon","dettol","band aid","adhesive bandage","cotton roll","sterile gauze","surgical tape","burn cream","burn heal","antiseptic ointment","povidone iodine","surgical mask","n95 mask","gloves","ফার্স্ট এইড বক্স","প্রাথমিক চিকিৎসা","স্যাভলন","ডেটল","ব্যান্ড এইড","গজ ব্যান্ডেজ","তুলো","কাঁচি","পোড়া ক্ষতের ক্রিম","অ্যান্টিসেপটিক মলম","মাস্ক","সার্জিক্যাল মাস্ক"]
  },

  {
    id: "health-monitors-devices",
    name: "BP Monitors, Thermometers & Nebulizers",
    bnName: "বিপি মেশিন, থার্মোমিটার ও মেডিক্যাল ডিভাইস",
    sector: "health_wellness",
    suggestedCategoryId: "smartphones-tablets",
    tags: ["digital thermometer","mercury thermometer","blood pressure monitor","bp machine","omron bp machine","pulse oximeter","glucometer","blood sugar test strips","nebulizer","nebulizer machine","hot water bag","ice bag","weighing scale","body weight machine","heating pad","ডিজিটাল থার্মোমিটার","বিপি মেশিন","প্রেশার মাপার যন্ত্র","পালস অক্সিমিটার","গ্লুকোমিটার","সুগার টেস্ট স্ট্রিপ","নেবুলাইজার","হট ওয়াটার ব্যাগ","ওজন মাপার মেশিন"]
  },

  {
    id: "vitamins-supplements-nutrition",
    name: "Vitamins, Fish Oil & Dietary Supplements",
    bnName: "মাল্টিভিটামিন, ফিশ অয়েল ও সাপ্লিমেন্ট",
    sector: "health_wellness",
    suggestedCategoryId: "groceries-daily-essentials",
    tags: ["multivitamin","vitamin c","vitamin c 1000mg","vitamin d3","calcium tablet","zinc supplement","omega 3","fish oil","cod liver oil","biotin","biotin 10000mcg","collagen peptides","whey protein","creatine","immunity booster","dietary supplement","iron supplement","folic acid","মাল্টিভিটামিন","ভিটামিন সি","ভিটামিন ডি","জিংক","ক্যালসিয়াম","ওমেগা ৩","ফিশ অয়েল","বায়োটিন","কোলাজেন","প্রোটিন সাপ্লিমেন্ট","রোগ প্রতিরোধ ক্ষমতা"]
  },

  {
    id: "herbal-ayurvedic-superfoods",
    name: "Organic Superfoods, Honey & Herbal Oil",
    bnName: "খাঁটি মধু, কালোজিরা তেল ও অর্গানিক সুপারফুড",
    sector: "health_wellness",
    suggestedCategoryId: "groceries-daily-essentials",
    tags: ["black seed oil","kalonji oil","pure honey","raw honey","sundarban honey","khalisa honey","chia seeds","isabgol husk","flax seeds","moringa powder","spirulina","tulsi powder","amla juice","triphala","organic ghee","mustard oil","apple cider vinegar","কালোজিরা তেল","খাঁটি মধু","সুন্দরবনের মধু","চিয়া সিড","ইসবগুলের ভুসি","তিসি বীজ","সজিনা পাতা গুঁড়া","মোরিঙ্গা","খাঁটি সরিষার তেল","অর্গানিক ঘি","ঘৃতকুমারী","আমলকী"]
  },

  {
    id: "pain-relief-ortho-supports",
    name: "Pain Sprays, Balms & Orthopedic Supports",
    bnName: "ব্যথানাশক স্প্রে, বাম ও অর্থোপেডিক বেল্ট",
    sector: "health_wellness",
    suggestedCategoryId: "beauty-skincare",
    tags: ["pain relief spray","moov spray","iodex","tiger balm","volini gel","muscle pain relief","knee cap","knee brace","back pain belt","lumbar support belt","posture corrector","cervical collar","wrist support","ankle brace","orthopedic belt","ব্যথানাশক স্প্রে","মুভ স্প্রে","টাইগার বাম","ব্যথার মলম","নি ক্যাপ","হাঁটু সাপোর্ট","কোমর ব্যথার বেল্ট","ঘাড়ের কলার","কব্জির সাপোর্ট","পেইন কিলার স্প্রে"]
  },

  {
    id: "mens-luxury-watches",
    name: "Men's Formal, Quartz & Mechanical Watches",
    bnName: "পুরুষদের ফরমাল ও মেকানিক্যাল ঘড়ি",
    sector: "jewelry_watches",
    suggestedCategoryId: "smartphones-tablets",
    tags: ["men watch","luxury watch","quartz watch","mechanical watch","leather strap watch","stainless steel watch","chronograph watch","curren watch","naviforce","skmei","casio watch","ঘড়ি","হাতের ঘড়ি","পুরুষদের ঘড়ি","লেদার বেল্ট ঘড়ি","মেটাল ঘড়ি","ওয়াটারপ্রুফ ঘড়ি"]
  },

  {
    id: "womens-watches-bracelets",
    name: "Women's Elegant Watches & Charm Bracelets",
    bnName: "নারীদের ঘড়ি ও ব্রেসলেট",
    sector: "jewelry_watches",
    suggestedCategoryId: "smartphones-tablets",
    tags: ["women watch","ladies watch","rose gold watch","magnetic strap watch","bracelet watch","charm bracelet","women bracelet","মেয়েদের ঘড়ি","লেডিস ঘড়ি","রোজ গোল্ড ঘড়ি","ব্রেসলেট"]
  },

  {
    id: "necklaces-chokers",
    name: "Necklaces, Chokers & Pendants",
    bnName: "নেকলেস, চোকার ও লকেট",
    sector: "jewelry_watches",
    suggestedCategoryId: "womens-fashion",
    tags: ["necklace","choker","gold plated necklace","pearl necklace","pendant","chain with pendant","oxidized necklace","party necklace","নেকলেস","গলার মালা","লকেট","চোকার","মুক্তার মালা"]
  },

  {
    id: "earrings-jhumka-tops",
    name: "Earrings, Jhumkas & Stud Tops",
    bnName: "কানের দুল, ঝুমকা ও টপস",
    sector: "jewelry_watches",
    suggestedCategoryId: "womens-fashion",
    tags: ["earrings","jhumka","kundan jhumka","chandbali","stud earrings","tassel earrings","hoop earrings","কানের দুল","ঝুমকা","কুন্দন ঝুমকা","টপস","দুল"]
  },

  {
    id: "bangles-rings-nosepins",
    name: "Bangles, Rings, Hijab Pins & Nose Pins",
    bnName: "চুড়ি, আংটি, হিজাব পিন ও নোজ পিন",
    sector: "jewelry_watches",
    suggestedCategoryId: "womens-fashion",
    tags: ["bangles","glass bangles","metal bangles","churi","finger ring","adjustable ring","nose pin","hijab pin","magnetic hijab pin","brooch","চুড়ি","কাঁচের চুড়ি","আংটি","নাকফুল","নোজ পিন","হিজাব পিন","ব্রোচ"]
  },

  {
    id: "bike-riding-gear-helmets",
    name: "Helmets, Riding Gloves & Raincoats",
    bnName: "হেলমেট, রাইডিং গ্লাভস ও রেইনকোট",
    sector: "automotive",
    suggestedCategoryId: "footwear-sneakers",
    tags: ["helmet","full face helmet","riding gloves","bike gloves","bike raincoat","waterproof raincoat","riding jacket","knee guard","elbow guard","balaclava","riding boots","shoe cover","হেলমেট","রাইডিং গ্লাভস","বাইকার রেইনকোট","রেইনকোট","বাইক জ্যাকেট","নি গার্ড","রাইডিং গিয়ার"]
  },

  {
    id: "bike-accessories-care",
    name: "Bike Covers, Phone Holders & Security Locks",
    bnName: "বাইক কভার, মোবাইল হোল্ডার ও লক",
    sector: "automotive",
    suggestedCategoryId: "smartphones-tablets",
    tags: ["bike cover","waterproof bike cover","bike mobile holder","mobile mount","disc lock","alarm disc lock","cable lock","engine oil","motul engine oil","chain lube","chain cleaner","bike polish","বাইক কভার","মোবাইল হোল্ডার","ডিস্ক লক","বাইক সিকিউরিটি লক","ইঞ্জিন অয়েল","চেইন লুব","বাইক পলিশ"]
  },

  {
    id: "car-accessories-care",
    name: "Car Chargers, Perfumes & Dash Cams",
    bnName: "কার চার্জার, পারফিউম ও ড্যাশক্যাম",
    sector: "automotive",
    suggestedCategoryId: "smartphones-tablets",
    tags: ["car charger","fast car charger","car air freshener","car perfume","car phone holder","dash cam","dash camera","car vacuum cleaner","microfiber cloth","car wash shampoo","neck pillow","কার চার্জার","কার পারফিউম","এয়ার ফ্রেশনার","ড্যাশক্যাম","কার ভ্যাকুয়াম","মাইক্রোফাইবার কাপড়"]
  },

  {
    id: "books-islamic-literature",
    name: "Islamic Books, Novels & Self-Help",
    bnName: "ইসলামিক বই, উপন্যাস ও আত্মউন্নয়ন",
    sector: "books_stationery",
    suggestedCategoryId: "home-kitchen",
    tags: ["books","islamic books","quran sharif","tafsir","hadith books","self development books","motivational books","bangla novel","humayun ahmed","thriller books","english learning books","বই","ইসলামিক বই","কোরআন শরীফ","তাফসির","হাদিস","আত্মউন্নয়নমূলক বই","উপন্যাস","গল্পের বই"]
  },

  {
    id: "stationery-office-art",
    name: "Diaries, Notebooks, Pens & Art Supplies",
    bnName: "ডায়েরি, নোটবুক, কলম ও স্টেশনারি",
    sector: "books_stationery",
    suggestedCategoryId: "home-kitchen",
    tags: ["diary","notebook","hardcover notebook","gel pen","ballpoint pen","fountain pen","highlighter","permanent marker","whiteboard marker","sticky notes","calculator","file folder","color pencils","ডায়েরি","নোটবুক","খাতা","জেল পেন","কলম","হাইলাইটার","মার্কার","স্টিকি নোটস","ক্যালকুলেটর"]
  },

  {
    id: "cat-food-litter-care",
    name: "Cat Food, Cat Litter & Accessories",
    bnName: "ক্যাট ফুড, ক্যাট লিটার ও বিড়ালের যত্ন",
    sector: "pets",
    suggestedCategoryId: "groceries-daily-essentials",
    tags: ["cat food","dry cat food","wet cat food","whiskas","drools","smartheart","cat litter","bentonite litter","litter box","litter scoop","cat collar","cat harness","cat shampoo","cat toys","ক্যাট ফুড","বিড়ালের খাবার","ক্যাট লিটার","লিটার বক্স","বিড়ালের বেল্ট","বিড়ালের শ্যাম্পু","বিড়ালের খেলনা"]
  },

  {
    id: "dog-bird-fish-supplies",
    name: "Dog Food, Bird Seeds & Aquarium Supplies",
    bnName: "ডগ ফুড, পাখির খাবার ও অ্যাকোয়ারিয়াম",
    sector: "pets",
    suggestedCategoryId: "groceries-daily-essentials",
    tags: ["dog food","pedigree","dog collar","dog leash","bird food","bird seed mix","fish food","aquarium filter","air pump","aquarium heater","fish tank accessories","ডগ ফুড","কুকুরের খাবার","পাখির খাবার","ফিশ ফুড","মাছের খাবার","অ্যাকোয়ারিয়াম ফিল্টার"]
  },

  // ==========================================
  // EXISTING CORE CATALOG CATEGORIES
  // ==========================================
// ==========================================
  // GADGETS & ELECTRONICS
  // ==========================================
  {
    id: 'tws-earbuds',
    name: 'TWS & Wireless Earbuds',
    bnName: 'ওয়্যারলেস ইয়ারবাডস ও হেডফোন',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['tws', 'earbuds', 'wireless earbuds', 'bluetooth earbuds', 'anc earbuds', 'gaming earbuds', 'ইয়ারবাড', 'হেডফোন', 'bass', 'noise cancelling']
  },
  {
    id: 'smartwatches',
    name: 'Smartwatches & Fitness Bands',
    bnName: 'স্মার্টওয়াচ ও ফিটনেস ট্র্যাকার',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['smartwatch', 'fitness tracker', 'calling watch', 'amoled smartwatch', 'smart band', 'স্মার্টওয়াচ', 'ঘড়ি', 'bluetooth calling', 'heart rate', 'waterproof watch']
  },
  {
    id: 'smartphones',
    name: 'Smartphones & Mobile Phones',
    bnName: 'স্মার্টফোন ও মোবাইল',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['smartphone', 'mobile', 'android phone', 'iphone', '5g phone', 'gaming phone', 'স্মার্টফোন', 'মোবাইল', 'dual sim', 'camera phone', 'flagship']
  },
  {
    id: 'powerbanks',
    name: 'Power Banks & Fast Chargers',
    bnName: 'পাওয়ার ব্যাংক ও চার্জার',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['power bank', 'fast charger', 'gan charger', 'type-c charger', '20000mah', 'quick charge', 'পাওয়ার ব্যাংক', 'চার্জার', 'wireless charger', 'cable', 'fast charging']
  },
  {
    id: 'charging-cables',
    name: 'Cables & Converters',
    bnName: 'ক্যাবল ও কনভার্টার',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['type-c cable', 'lightning cable', 'usb cable', 'hdmi cable', 'otg', 'braided cable', 'চার্জিং ক্যাবল', 'কনভার্টার', 'fast cable', '65w cable']
  },
  {
    id: 'bluetooth-speakers',
    name: 'Bluetooth Speakers & Soundbars',
    bnName: 'ব্লুটুথ স্পিকার ও সাউন্ডবার',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['bluetooth speaker', 'soundbar', 'portable speaker', 'bass speaker', 'waterproof speaker', 'স্পিকার', 'সাউন্ডবক্স', 'party speaker', 'wireless speaker']
  },
  {
    id: 'gaming-accessories',
    name: 'Gaming Gear & Accessories',
    bnName: 'গেমিং গিয়ার ও এক্সেসরিজ',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['gaming mouse', 'mechanical keyboard', 'rgb keyboard', 'gaming headset', 'mousepad', 'গেমিং মাউস', 'কিবোর্ড', 'controller', 'gamepad']
  },
  {
    id: 'computer-laptops',
    name: 'Laptops & Ultrabooks',
    bnName: 'ল্যাপটপ ও আল্ট্রাবুক',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['laptop', 'ultrabook', 'gaming laptop', 'macbook', 'ssd laptop', 'ল্যাপটপ', 'notebook', 'workstation', 'core i5', 'core i7', 'ryzen']
  },
  {
    id: 'phone-covers',
    name: 'Phone Cases & Screen Protectors',
    bnName: 'মোবাইল ব্যাককভার ও গ্লাস',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['phone case', 'back cover', 'tempered glass', 'screen protector', 'silicone case', 'ব্যাককভার', 'মোবাইল কভার', 'camera protector', 'matte glass']
  },
  {
    id: 'cameras-gimbals',
    name: 'Cameras, Drones & Gimbals',
    bnName: 'ক্যামেরা, ড্রোন ও গিম্বল',
    sector: 'gadgets',
    suggestedCategoryId: 'smartphones-tablets',
    tags: ['action camera', 'gimbal', 'vlogging camera', 'drone', 'tripod', 'ring light', 'ক্যামেরা', 'গিম্বল', 'vlog setup', 'microphone', 'wireless mic']
  },

  // ==========================================
  // MEN'S FASHION & APPAREL
  // ==========================================
  {
    id: 'panjabi-pajama',
    name: "Men's Panjabi & Pajama Sets",
    bnName: 'পাঞ্জাবি ও পায়জামা',
    sector: 'fashion_men',
    suggestedCategoryId: 'mens-fashion',
    tags: ['panjabi', 'punjabi', 'পাঞ্জাবি', 'eid panjabi', 'cotton panjabi', 'semiformal panjabi', 'kabli set', 'পায়জামা', 'pajama', 'embroidered panjabi', 'designer panjabi']
  },
  {
    id: 'polo-tshirts',
    name: 'Polo Shirts & Collared T-Shirts',
    bnName: 'পোলো শার্ট ও টি-শার্ট',
    sector: 'fashion_men',
    suggestedCategoryId: 'mens-fashion',
    tags: ['polo shirt', 'polo', 'পোলো শার্ট', 'cotton polo', 'solid polo', 'premium polo', 'slim fit polo', 'casual polo', 'collar t-shirt']
  },
  {
    id: 'casual-tshirts',
    name: 'Crewneck & Graphic T-Shirts',
    bnName: 'ক্যাজুয়াল টি-শার্ট',
    sector: 'fashion_men',
    suggestedCategoryId: 'mens-fashion',
    tags: ['t-shirt', 'tshirt', 'টি-শার্ট', 'graphic tee', 'oversized tshirt', 'cotton tshirt', 'drop shoulder', 'printed tshirt', 'basic tee', 'streetwear']
  },
  {
    id: 'formal-casual-shirts',
    name: 'Casual & Formal Shirts',
    bnName: 'ক্যাজুয়াল ও ফরমাল শার্ট',
    sector: 'fashion_men',
    suggestedCategoryId: 'mens-fashion',
    tags: ['shirt', 'formal shirt', 'casual shirt', 'শার্ট', 'linen shirt', 'denim shirt', 'cotton shirt', 'check shirt', 'oxford shirt', 'full sleeve shirt']
  },
  {
    id: 'denim-jeans',
    name: 'Denim Jeans & Chino Pants',
    bnName: 'জিন্স প্যান্ট ও চিনো',
    sector: 'fashion_men',
    suggestedCategoryId: 'mens-fashion',
    tags: ['jeans', 'denim jeans', 'জিন্স', 'chino pants', 'slim fit jeans', 'stretchable jeans', 'formal pant', 'trouser', 'cargo pants', 'প্যান্ট']
  },
  {
    id: 'jackets-hoodies',
    name: 'Hoodies, Jackets & Winter Wear',
    bnName: 'হুডি, জ্যাকেট ও শীতের পোশাক',
    sector: 'fashion_men',
    suggestedCategoryId: 'mens-fashion',
    tags: ['hoodie', 'jacket', 'হুডি', 'জ্যাকেট', 'bomber jacket', 'denim jacket', 'windbreaker', 'sweatshirt', 'winter collection', 'fleece hoodie']
  },
  {
    id: 'mens-footwear',
    name: "Men's Loafers, Sneakers & Sandals",
    bnName: 'জুতা, স্নিকার্স ও স্যান্ডেল',
    sector: 'fashion_men',
    suggestedCategoryId: 'footwear-sneakers',
    tags: ['sneakers', 'loafers', 'জুতা', 'leather shoes', 'casual shoes', 'স্যান্ডেল', 'sandals', 'running shoes', 'slippers', 'formal shoes']
  },
  {
    id: 'mens-accessories',
    name: 'Wallets, Belts & Sunglasses',
    bnName: 'মানিব্যাগ, বেল্ট ও সানগ্লাস',
    sector: 'fashion_men',
    suggestedCategoryId: 'mens-fashion',
    tags: ['leather wallet', 'belt', 'মানিব্যাগ', 'বেল্ট', 'sunglasses', 'card holder', 'leather belt', 'polarized sunglasses', 'cufflinks']
  },

  // ==========================================
  // WOMEN'S FASHION & LUXURY
  // ==========================================
  {
    id: 'sarees-traditional',
    name: 'Exclusive Sarees & Jamdani',
    bnName: 'শাড়ি, জামদানি ও সিল্ক',
    sector: 'fashion_women',
    suggestedCategoryId: 'womens-fashion',
    tags: ['saree', 'sharee', 'শাড়ি', 'jamdani', 'silk saree', 'cotton saree', 'georgette saree', 'party saree', 'kota cotton', 'tangail saree', 'traditional saree']
  },
  {
    id: 'salwar-kameez-three-piece',
    name: 'Three Piece & Salwar Kameez',
    bnName: 'থ্রি-পিস ও সালোয়ার কামিজ',
    sector: 'fashion_women',
    suggestedCategoryId: 'womens-fashion',
    tags: ['three piece', 'salwar kameez', 'থ্রি পিস', 'unstitched three piece', 'lawn three piece', 'cotton three piece', 'boutique three piece', 'designer dress']
  },
  {
    id: 'kurtis-tunics',
    name: 'Kurtis, Tunics & Tops',
    bnName: 'কুর্তি ও টিউনিক',
    sector: 'fashion_women',
    suggestedCategoryId: 'womens-fashion',
    tags: ['kurti', 'kurtis', 'কুর্তি', 'tunic', 'ladies tops', 'cotton kurti', 'short kurti', 'long kurti', 'fusion wear', 'casual kurti']
  },
  {
    id: 'abayas-hijabs',
    name: 'Abayas, Borka & Hijabs',
    bnName: 'আবায়া, বোরকা ও হিজাব',
    sector: 'fashion_women',
    suggestedCategoryId: 'womens-fashion',
    tags: ['abaya', 'borka', 'বোরকা', 'hijab', 'হিজাব', 'modest fashion', 'dubai abaya', 'georgette hijab', 'instant hijab', 'khimar', 'namaz chador']
  },
  {
    id: 'womens-handbags',
    name: 'Handbags, Totes & Clutches',
    bnName: 'হ্যান্ডব্যাগ ও পার্স',
    sector: 'fashion_women',
    suggestedCategoryId: 'womens-fashion',
    tags: ['handbag', 'tote bag', 'হ্যান্ডব্যাগ', 'purse', 'shoulder bag', 'crossbody bag', 'ladies wallet', 'clutch', 'leather handbag', 'পার্স']
  },
  {
    id: 'womens-jewelry',
    name: 'Jewelry, Earrings & Necklaces',
    bnName: 'গহনা, কানের দুল ও নেকলেস',
    sector: 'fashion_women',
    suggestedCategoryId: 'womens-fashion',
    tags: ['jewelry', 'earrings', 'গহনা', 'necklace', 'choker', 'bangles', 'bracelet', 'ring', 'kundan jewelry', 'silver jewelry', 'দুলের সেট']
  },
  {
    id: 'womens-footwear',
    name: 'Heels, Flats & Party Sandals',
    bnName: 'হিল, ফ্ল্যাট ও পার্টি জুতা',
    sector: 'fashion_women',
    suggestedCategoryId: 'footwear-sneakers',
    tags: ['heels', 'flats', 'মহিলাদের জুতা', 'party sandals', 'wedge heels', 'block heels', 'kolhapuri', 'ladies slippers']
  },

  // ==========================================
  // GROCERIES & PANTRY
  // ==========================================
  {
    id: 'organic-oils-ghee',
    name: 'Pure Oils, Mustard Oil & Premium Ghee',
    bnName: 'খাঁটি তেল, সরিষার তেল ও গাওয়া ঘি',
    sector: 'groceries',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['mustard oil', 'ঘি', 'সরিষার তেল', 'pure ghee', 'coconut oil', 'olive oil', 'soybean oil', 'organic oil', 'cold pressed oil', 'kachi ghani']
  },
  {
    id: 'organic-honey',
    name: 'Sundarban & Pure Natural Honey',
    bnName: 'খাঁটি মধু ও সুন্দরবনের মধু',
    sector: 'groceries',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['honey', 'মধু', 'pure honey', 'sundarban honey', 'natural honey', 'khalisha honey', 'raw honey', 'black seed honey', 'কালোজিরা মধু']
  },
  {
    id: 'premium-rice',
    name: 'Aromatic & Miniket Premium Rice',
    bnName: 'পোলাও চাল, বাসমতী ও মিনিকেট চাল',
    sector: 'groceries',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['rice', 'চাল', 'miniket rice', 'basmati rice', 'chinigura rice', 'polao rice', 'nazirshail', 'brown rice', 'পোলাও চাল', 'বাসমতী চাল']
  },
  {
    id: 'dry-fruits-nuts',
    name: 'Dry Fruits, Dates & Premium Nuts',
    bnName: 'ড্রাই ফ্রুটস, খেজুর ও বাদাম',
    sector: 'groceries',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['dry fruits', 'dates', 'বাদাম', 'খেজুর', 'almonds', 'cashew nuts', 'kaju badam', 'walnuts', 'chia seed', 'কাঠবাদাম', 'কাজুবাদাম', 'চিয়া সিড']
  },
  {
    id: 'spices-masala',
    name: 'Natural Spices & Pure Masala',
    bnName: 'প্রাকৃতিক মশলা ও গুঁড়া মশলা',
    sector: 'groceries',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['spices', 'মশলা', 'turmeric powder', 'chili powder', 'haldi', 'cumin', 'coriander', 'garam masala', 'black pepper', 'দারুচিনি', 'এলাচ', 'হলুদ গুঁড়া']
  },
  {
    id: 'tea-coffee',
    name: 'Premium Tea Leaves & Coffee',
    bnName: 'চা পাতা ও কফি',
    sector: 'groceries',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['tea', 'coffee', 'চা পাতা', 'green tea', 'black tea', 'sylhet tea', 'instant coffee', 'roasted coffee', 'গ্রিন টি', 'কফি']
  },
  {
    id: 'breakfast-cereals',
    name: 'Oats, Atta, Cereals & Snacks',
    bnName: 'ওটস, আটা, ময়দা ও নুডলস',
    sector: 'groceries',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['oats', 'atta', 'আটা', 'ময়দা', 'noodles', 'biscuits', 'cornflakes', 'breakfast cereals', 'pasta', 'নুডলস']
  },

  // ==========================================
  // BEAUTY, SKINCARE & PERSONAL CARE
  // ==========================================
  {
    id: 'facial-cleansers',
    name: 'Face Wash & Cleansers',
    bnName: 'ফেসওয়াশ ও ক্লিনজার',
    sector: 'beauty',
    suggestedCategoryId: 'beauty-skincare',
    tags: ['face wash', 'cleanser', 'ফেসওয়াশ', 'salicylic acid', 'foam cleanser', 'gentle cleanser', 'brightening face wash', 'acne face wash']
  },
  {
    id: 'serums-moisturizers',
    name: 'Serums, Creams & Moisturizers',
    bnName: 'সিরাম, ময়েশ্চারাইজার ও ক্রিম',
    sector: 'beauty',
    suggestedCategoryId: 'beauty-skincare',
    tags: ['serum', 'moisturizer', 'সিরাম', 'niacinamide', 'vitamin c serum', 'hyaluronic acid', 'night cream', 'day cream', 'ত্বকের যত্ন', 'গ্লোয়িং স্কিন']
  },
  {
    id: 'sunscreens',
    name: 'Sunscreen & UV Protection',
    bnName: 'সানস্ক্রিন ও সানব্লক',
    sector: 'beauty',
    suggestedCategoryId: 'beauty-skincare',
    tags: ['sunscreen', 'sunblock', 'সানস্ক্রিন', 'spf 50', 'matte sunscreen', 'aqua sunscreen', 'no white cast', 'sun protection']
  },
  {
    id: 'hair-care',
    name: 'Shampoo, Conditioner & Hair Oils',
    bnName: 'শ্যাম্পু, কন্ডিশনার ও চুলের তেল',
    sector: 'beauty',
    suggestedCategoryId: 'beauty-skincare',
    tags: ['shampoo', 'conditioner', 'শ্যাম্পু', 'hair oil', 'anti-dandruff', 'hair fall control', 'onion hair oil', 'keratin', 'চুলের যত্ন']
  },
  {
    id: 'fragrances-perfumes',
    name: 'Perfumes, Attar & Body Sprays',
    bnName: 'পারফিউম, আতর ও বডি স্প্রে',
    sector: 'beauty',
    suggestedCategoryId: 'beauty-skincare',
    tags: ['perfume', 'attar', 'আতর', 'পারফিউম', 'body spray', 'deodorant', 'oudh', 'long lasting perfume', 'french perfume']
  },

  // ==========================================
  // HOME, KITCHEN & APPLIANCES
  // ==========================================
  {
    id: 'kitchen-appliances',
    name: 'Blenders, Air Fryers & Cookers',
    bnName: 'ব্লেন্ডার, এয়ার ফ্রায়ার ও কুকার',
    sector: 'home',
    suggestedCategoryId: 'home-kitchen',
    tags: ['blender', 'air fryer', 'ব্লেন্ডার', 'electric kettle', 'rice cooker', 'induction cooker', 'grinder', 'kitchen appliance', 'কেতলি']
  },
  {
    id: 'cookware-kitchenware',
    name: 'Pans, Pots & Kitchen Accessories',
    bnName: 'কড়াই, ফ্রাইপ্যান ও ক্রোকারিজ',
    sector: 'home',
    suggestedCategoryId: 'home-kitchen',
    tags: ['cookware', 'frying pan', 'non-stick pan', 'knife set', 'pressure cooker', 'dinner set', 'water bottle', 'lunch box', 'কড়াই']
  },
  {
    id: 'home-bedding-decor',
    name: 'Bedsheets, Curtains & Home Decor',
    bnName: 'বেডশিট, পর্দা ও হোম ডেকর',
    sector: 'home',
    suggestedCategoryId: 'home-kitchen',
    tags: ['bedsheet', 'curtains', 'বেডশিট', 'pillow cover', 'blanket', 'comforter', 'wall art', 'home decor', 'towel', 'বাথ টাওয়েল']
  },

  // ==========================================
  // BABY & KIDS
  // ==========================================
  {
    id: 'baby-care-diapers',
    name: 'Baby Diapers & Skincare',
    bnName: 'ডায়াপার ও বেবি কেয়ার',
    sector: 'kids',
    suggestedCategoryId: 'groceries-daily-essentials',
    tags: ['diaper', 'baby wipes', 'ডায়াপার', 'baby lotion', 'baby shampoo', 'baby oil', 'feeder', 'baby care']
  },
  {
    id: 'baby-toys-clothing',
    name: 'Kids Toys, Frocks & Panjabi',
    bnName: 'বাচ্চাদের খেলনা ও পোশাক',
    sector: 'kids',
    suggestedCategoryId: 'mens-fashion',
    tags: ['toys', 'educational toys', 'kids dress', 'baby clothes', 'খেলনা', 'baby frock', 'kids panjabi', 'stroller', 'tricycle']
  },

  // ==========================================
  // SPORTS & FITNESS
  // ==========================================
  {
    id: 'gym-fitness',
    name: 'Gym Equipment, Yoga Mats & Dumbbells',
    bnName: 'জিম ইকুইপমেন্ট ও ডাম্বেল',
    sector: 'sports',
    suggestedCategoryId: 'footwear-sneakers',
    tags: ['dumbbell', 'gym equipment', 'yoga mat', 'resistance band', 'fitness', 'workout', 'push up bar', 'jump rope', 'ডাম্বেল']
  },
  {
    id: 'sports-gear',
    name: 'Cricket, Football & Badminton Gear',
    bnName: 'ক্রিকেট, ফুটবল ও ব্যাডমিন্টন সরঞ্জাম',
    sector: 'sports',
    suggestedCategoryId: 'footwear-sneakers',
    tags: ['cricket bat', 'football', 'badminton racket', 'shuttlecock', 'sports jersey', 'jersey', 'ক্রিকেট ব্যাট', 'ফুটবল', 'বুট জুতা']
  }
];

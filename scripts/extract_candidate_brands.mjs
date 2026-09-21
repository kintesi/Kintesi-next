import fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/data/dropshippingCatalog.json', 'utf8'));

// Find all capitalized words / sequences in titles that could be brand names
const titleWords = new Map();

for (const p of data) {
  const words = (p.title || '').split(/[\s\-_\/:]+/);
  for (let i = 0; i < Math.min(3, words.length); i++) {
    const w = words[i].replace(/[^\w]/g, '');
    if (w.length >= 3 && !/^\d+$/.test(w)) {
      titleWords.set(w, (titleWords.get(w) || 0) + 1);
    }
  }
}

// Let's filter out standard English descriptor words:
const ignoreWords = new Set([
  'The', 'And', 'For', 'With', 'New', 'Hot', 'Best', 'Top', 'Free', 'Mini', 'Pro', 'Max',
  'Plus', 'Ultra', 'Super', 'Original', 'High', 'Quality', 'Premium', 'Exclusive', 'Stylish',
  'Fashion', 'Fashionable', 'Casual', 'Formal', 'Smart', 'Luxury', 'Classic', 'Elegant',
  'Modern', 'Vintage', 'Cotton', 'Silk', 'Leather', 'Denim', 'Jersey', 'Linen', 'Velvet',
  'Georgette', 'Chiffon', 'Woolen', 'Polyester', 'Nylon', 'Plastic', 'Steel', 'Stainless',
  'Metal', 'Glass', 'Wooden', 'Silicone', 'Rubber', 'Ceramic', 'Men', 'Mens', 'Women', 'Womens',
  'Lady', 'Ladies', 'Girl', 'Girls', 'Boy', 'Boys', 'Baby', 'Kids', 'Child', 'Children',
  'Unisex', 'Adult', 'Winter', 'Summer', 'Autumn', 'Spring', 'Short', 'Long', 'Full', 'Half',
  'Sleeve', 'Sleeveless', 'Collar', 'Round', 'Neck', 'V-Neck', 'O-Neck', 'Printed', 'Digital',
  'Solid', 'Plain', 'Striped', 'Checkered', 'Embroidered', 'Handmade', 'Crafted', 'Designed',
  'Collection', 'Style', 'Design', 'Piece', 'Pieces', 'Pcs', 'Set', 'Sets', 'Pack', 'Packs',
  'Color', 'Colors', 'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple',
  'Orange', 'Brown', 'Grey', 'Gray', 'Golden', 'Silver', 'Navy', 'Maroon', 'Olive', 'Sky',
  'Portable', 'Rechargeable', 'Wireless', 'Bluetooth', 'Electric', 'Electronic', 'Automatic',
  'Manual', 'Digital', 'Analog', 'Waterproof', 'Water', 'Resistant', 'Dustproof', 'Shockproof',
  'Foldable', 'Adjustable', 'Multi', 'Multifunction', 'Multifunctional', 'Universal', 'Magnetic',
  'Flexible', 'Heavy', 'Duty', 'Light', 'Lightweight', 'Slim', 'Thin', 'Thick', 'Large', 'Small',
  'Medium', 'Big', 'Size', 'Sizes', 'Free', 'Standard', 'Universal', 'Home', 'Office', 'Car',
  'Travel', 'Outdoor', 'Indoor', 'Kitchen', 'Bathroom', 'Bedroom', 'Living', 'Room', 'Garden',
  'Computer', 'Laptop', 'Phone', 'Mobile', 'Tablet', 'Camera', 'Audio', 'Sound', 'Music',
  'Voice', 'Video', 'Photo', 'Display', 'Screen', 'Cable', 'Wire', 'Cord', 'Adapter', 'Charger',
  'Charging', 'Power', 'Bank', 'Battery', 'Dock', 'Stand', 'Holder', 'Mount', 'Tripod', 'Case',
  'Cover', 'Pouch', 'Bag', 'Bags', 'Backpack', 'Wallet', 'Purse', 'Card', 'Belt', 'Strap',
  'Watch', 'Watches', 'Clock', 'Glasses', 'Sunglasses', 'Jewelry', 'Necklace', 'Bracelet',
  'Earrings', 'Ring', 'Shoes', 'Shoe', 'Sneakers', 'Sandals', 'Boots', 'Slippers', 'Socks',
  'Underwear', 'Boxer', 'Briefs', 'Panties', 'Bra', 'Lingerie', 'Nightwear', 'Sleepwear',
  'Pajama', 'Panjabi', 'Kurti', 'Kameez', 'Saree', 'Sharee', 'Salwar', 'Dupatta', 'Burka',
  'Borka', 'Abaya', 'Hijab', 'Khimar', 'Gown', 'Dress', 'Frock', 'T-Shirt', 'Tshirt', 'Polo',
  'Shirt', 'Pants', 'Pant', 'Trousers', 'Jeans', 'Leggings', 'Palazzo', 'Joggers', 'Shorts',
  'Hoodie', 'Hoodies', 'Sweater', 'Sweatshirt', 'Jacket', 'Coat', 'Blazer', 'Windbreaker',
  'Cap', 'Hat', 'Beanie', 'Scarf', 'Muffler', 'Gloves', 'Mask', 'Clean', 'Cleaner', 'Cleaning',
  'Wash', 'Washer', 'Washing', 'Care', 'Beauty', 'Skin', 'Hair', 'Face', 'Body', 'Eye', 'Lip',
  'Nose', 'Hand', 'Foot', 'Health', 'Fitness', 'Sports', 'Game', 'Gaming', 'Play', 'Toy', 'Toys',
  'Gift', 'Gifts', 'Special', 'Custom', 'Customize', 'Personalized', 'Unique', 'Creative',
  'Magic', 'Smart', 'Cute', 'Sweet', 'Lovely', 'Pretty', 'Cool', 'Awesome', 'China', 'Chinese',
  'Imported', 'Export', 'Bangladesh', 'Bangladeshi', 'Indian', 'Dubai', 'Korean', 'Japanese',
  'Traditional', 'Islamic', 'Arabic', 'Muslim', 'Kintesi', 'One', 'Two', 'Three', 'Four',
  'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'First', 'Second', 'Third', 'Night', 'Day',
  'Double', 'Single', 'Dual', 'Triple', 'Air', 'Comfort', 'Soft', 'Warm', 'Cool', 'Dry', 'Fast',
  'Speed', 'Safe', 'Safety', 'Protect', 'Protection', 'Anti', 'Non', 'Super', 'Extra', 'Mega',
  'Micro', 'Nano', 'True', 'Real', 'Pure', 'Natural', 'Organic', 'Fresh', 'Fine', 'Great',
  'Good', 'Better', 'Best', 'Perfect', 'Ideal', 'Essential', 'Ultimate', 'Simple', 'Easy',
  'Quick', 'Convenient', 'Useful', 'Helpful', 'Handy', 'Durable', 'Strong', 'Sturdy', 'Tough',
  'Solid', 'Compact', 'Space', 'Saving', 'Modern', 'Trendy', 'Stylish', 'Fashionable',
  'Butter', 'Fly', 'Lock'
]);

const candidateBrands = [];
for (const [word, count] of titleWords.entries()) {
  if (!ignoreWords.has(word) && !ignoreWords.has(word.toLowerCase()) && !ignoreWords.has(word[0].toUpperCase() + word.slice(1).toLowerCase())) {
    candidateBrands.push({ word, count });
  }
}

candidateBrands.sort((a, b) => b.count - a.count);
console.log('Candidate brand words (count >= 2):');
console.log(candidateBrands.filter(c => c.count >= 2).slice(0, 100));

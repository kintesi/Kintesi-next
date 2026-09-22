import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const catalogPath = path.resolve('src/data/dropshippingCatalog.json');
const rawData = fs.readFileSync(catalogPath, 'utf8');
const products = JSON.parse(rawData);

console.log(`Generating Excel catalog for ${products.length} products...`);

const rows = products.map((p, index) => {
  const sizesStr = Array.isArray(p.sizes) ? p.sizes.join(', ') : (p.sizes || '');
  const colorsStr = Array.isArray(p.colors)
    ? p.colors.map(c => typeof c === 'string' ? c : (c.name || '')).filter(Boolean).join(', ')
    : '';
  const primaryImage = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '';
  const regularPrice = Number(p.price) || 0;
  const discountPrice = Number(p.discount_price) || regularPrice;
  const stockNum = Number(p.stock) || 0;

  return {
    'SL': index + 1,
    'Product ID': p.id || '',
    'SKU': p.sku || '',
    'Product Title': p.title || '',
    'Category ID': p.category_id || '',
    'Sub Category': p.sub_category || '',
    'Brand': p.brand || '',
    'Regular Price (BDT)': regularPrice,
    'Discount Price (BDT)': discountPrice,
    'Stock': stockNum,
    'Sizes': sizesStr,
    'Colors': colorsStr,
    'Dropshipping Supplier URL': p.dropshipping_url || '',
    'Storefront URL': `https://kintesi.com/product/${p.slug}`,
    'Local Dev URL': `http://localhost:5173/product/${p.slug}`,
    'Primary Image URL': primaryImage,
    'Rating': Number(p.rating) || 5,
    'Reviews': Number(p.review_count) || 0,
    'Is Featured': p.is_featured ? 'Yes' : 'No',
    'Is Trending': p.is_trending ? 'Yes' : 'No',
  };
});

const worksheet = XLSX.utils.json_to_sheet(rows);

// Set column widths for readability
const colWidths = [
  { wch: 6 },   // SL
  { wch: 38 },  // Product ID
  { wch: 14 },  // SKU
  { wch: 45 },  // Product Title
  { wch: 18 },  // Category ID
  { wch: 22 },  // Sub Category
  { wch: 16 },  // Brand
  { wch: 18 },  // Regular Price
  { wch: 18 },  // Discount Price
  { wch: 10 },  // Stock
  { wch: 30 },  // Sizes
  { wch: 30 },  // Colors
  { wch: 65 },  // Dropshipping Supplier URL
  { wch: 55 },  // Storefront URL
  { wch: 55 },  // Local Dev URL
  { wch: 65 },  // Primary Image URL
  { wch: 8 },   // Rating
  { wch: 10 },  // Reviews
  { wch: 12 },  // Is Featured
  { wch: 12 },  // Is Trending
];
worksheet['!cols'] = colWidths;

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'All Products Catalog');

// Destination paths
const outWorkspaceExcel = path.resolve('kintesi_all_products_catalog.xlsx');
const outPublicExcel = path.resolve('public/kintesi_all_products_catalog.xlsx');
const outArtifactExcel = 'C:/Users/tamim/.gemini/antigravity/brain/7a8c0468-99b7-4fa5-9d6c-a0221bd46596/kintesi_all_products_catalog.xlsx';

XLSX.writeFile(workbook, outWorkspaceExcel);
console.log(`Saved workspace Excel to: ${outWorkspaceExcel}`);

// Also copy to public/ folder so user/admin can download it via button or direct link
fs.mkdirSync(path.dirname(outPublicExcel), { recursive: true });
fs.copyFileSync(outWorkspaceExcel, outPublicExcel);
console.log(`Saved public Excel to: ${outPublicExcel}`);

// Copy to brain artifacts folder
try {
  fs.mkdirSync(path.dirname(outArtifactExcel), { recursive: true });
  fs.copyFileSync(outWorkspaceExcel, outArtifactExcel);
  console.log(`Saved artifact Excel to: ${outArtifactExcel}`);
} catch (e) {
  console.warn('Could not copy to brain artifact dir:', e.message);
}

// Also export CSV for quick lightweight editing
const csvData = XLSX.utils.sheet_to_csv(worksheet);
fs.writeFileSync(path.resolve('kintesi_all_products_catalog.csv'), csvData, 'utf8');
console.log('Saved CSV to: kintesi_all_products_catalog.csv');
console.log('All catalog exports completed successfully!');

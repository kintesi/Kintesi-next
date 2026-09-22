import { Product, ProductCustomAttributeOption } from '../types';

export const DROPSHIPPING_CONFIG = {
  API_KEY: 'A8niclztH9JtzS4t',
  API_SECRET: '2ff380917a11d3a7c97bcf6dddfb8adf38194c7d6b726ab12c4d0d5fb136fef8',
  BASE_URL: 'https://mohasagor.com.bd/api/reseller/product',
  PROVIDER_NAME: 'Dropshipping BD',
  FALLBACK_STORE_URL: 'https://dropshipping.com.bd',
};

export interface DropshippingVariant {
  id: number;
  product_id: number;
  attribute: string;
  variant: string;
}

export interface DropshippingImage {
  id: number;
  product_id: number;
  product_image: string;
}

export interface DropshippingProduct {
  id: number;
  name: string;
  product_code: number | string;
  category: string;
  thumbnail_img: string;
  slug: string;
  price: number;
  sale_price: number;
  details: string;
  status: string;
  stock_status: string;
  stock: number;
  product_variants?: DropshippingVariant[];
  product_images?: DropshippingImage[];
}

export interface DropshippingApiResponse {
  status: number;
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  products: DropshippingProduct[];
}

// In-memory cache to make browsing and searching blazing fast
const dropshipCache = new Map<number, DropshippingApiResponse>();

/**
 * Fetch a paginated page of products from Dropshipping BD API
 */
export async function fetchDropshippingProducts(page: number = 1): Promise<DropshippingApiResponse> {
  if (dropshipCache.has(page)) {
    return dropshipCache.get(page)!;
  }

  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const candidateEndpoints = [
    // 1. Local Vite dev middleware / Vercel API proxy (CORS-free same-origin)
    `/api/dropshipping-proxy?page=${page}`,
    // 2. Supabase Edge Function
    supabaseUrl ? `${supabaseUrl}/functions/v1/dropshipping-proxy?page=${page}` : null,
    // 3. Direct upstream API
    `${DROPSHIPPING_CONFIG.BASE_URL}?page=${page}`,
  ].filter(Boolean) as string[];

  let lastError: any = null;

  for (const endpoint of candidateEndpoints) {
    try {
      const isDirect = endpoint.includes('mohasagor.com.bd');
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (isDirect) {
        headers['api-key'] = DROPSHIPPING_CONFIG.API_KEY;
        headers['secret-key'] = DROPSHIPPING_CONFIG.API_SECRET;
      }

      const res = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        throw new Error(`Endpoint ${endpoint} returned HTTP ${res.status}`);
      }

      const data: DropshippingApiResponse = await res.json();
      if (data && Array.isArray(data.products)) {
        dropshipCache.set(page, data);
        return data;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Dropshipping fetch notice for ${endpoint}:`, err?.message || err);
    }
  }

  throw lastError || new Error('Dropshipping BD API থেকে তথ্য পাওয়া যায়নি');
}

/**
 * Search products by Product Code or Name
 */
export async function searchDropshippingProducts(
  query: string,
  page: number = 1
): Promise<{
  products: DropshippingProduct[];
  total: number;
  currentPage: number;
  lastPage: number;
}> {
  const trimmed = query.trim().toLowerCase();
  
  // If no query, return regular page
  if (!trimmed) {
    const data = await fetchDropshippingProducts(page);
    return {
      products: data.products,
      total: data.total,
      currentPage: data.current_page,
      lastPage: data.last_page,
    };
  }

  // Check current page first
  const currentData = await fetchDropshippingProducts(page);
  
  // Direct match on current page
  let matches = currentData.products.filter((p) => {
    const codeStr = String(p.product_code || '').toLowerCase();
    const nameStr = (p.name || '').toLowerCase();
    const catStr = (p.category || '').toLowerCase();
    return codeStr.includes(trimmed) || nameStr.includes(trimmed) || catStr.includes(trimmed);
  });

  // If searching by specific code and not on page 1, search cached pages or fetch up to 3 pages
  if (matches.length === 0 && (/^\d+$/.test(trimmed) || trimmed.length >= 3)) {
    for (let p = 1; p <= Math.min(5, currentData.last_page); p++) {
      if (p === page) continue;
      try {
        const d = await fetchDropshippingProducts(p);
        const subMatches = d.products.filter((prod) => {
          const codeStr = String(prod.product_code || '').toLowerCase();
          const nameStr = (prod.name || '').toLowerCase();
          return codeStr.includes(trimmed) || nameStr.includes(trimmed);
        });
        if (subMatches.length > 0) {
          matches.push(...subMatches);
          break;
        }
      } catch (err) {
        // continue
      }
    }
  }

  return {
    products: matches,
    total: matches.length,
    currentPage: 1,
    lastPage: 1,
  };
}

/**
 * Fetch a single product by exact product_code
 */
export async function fetchDropshippingProductByCode(
  code: string | number
): Promise<DropshippingProduct | null> {
  const targetCode = String(code).trim().toLowerCase();
  if (!targetCode) return null;

  // Search in cached pages first
  for (const [, data] of dropshipCache.entries()) {
    const found = data.products.find(
      (p) => String(p.product_code).trim().toLowerCase() === targetCode
    );
    if (found) return found;
  }

  // Search up to 5 pages
  try {
    for (let page = 1; page <= 5; page++) {
      const data = await fetchDropshippingProducts(page);
      const found = data.products.find(
        (p) => String(p.product_code).trim().toLowerCase() === targetCode
      );
      if (found) return found;
      if (page >= data.last_page) break;
    }
  } catch (err) {
    console.warn('Error finding product by code:', err);
  }

  return null;
}

/**
 * Maps Dropshipping BD categories to Kintesi's canonical category slugs
 */
export function mapDropshippingCategory(dsCategory?: string): string {
  const c = (dsCategory || '').toLowerCase();
  if (c.includes('gadget') || c.includes('electronic')) return 'electronic-accessories';
  if (c.includes('watch')) return 'watches-bags';
  if (c.includes('men')) return 'mens-fashion';
  if (c.includes('women')) return 'womens-fashion';
  if (c.includes('home') || c.includes('lifestyle')) return 'home-living';
  if (c.includes('kid') || c.includes('baby')) return 'mother-baby';
  if (c.includes('winter')) return 'mens-fashion';
  if (c.includes('phone') || c.includes('mobile')) return 'phones-accessories';
  if (c.includes('computer') || c.includes('gaming')) return 'computer-gaming';
  if (c.includes('health') || c.includes('beauty')) return 'health-beauty';
  return 'lifestyle-hobbies';
}

const KNOWN_BRANDS = [
  'Pagani Design', 'Arctic Hunter', 'Anaya Hoor', 'Ali Leather', 'Mark Ryden',
  'Mini Focus', 'Hannah Martin', 'Charles Delon', 'Under Armour', 'New Balance',
  'Louis Vuitton', 'Tommy Hilfiger', 'Calvin Klein', 'Royal Kludge', 'Cooler Master',
  'SteelSeries', 'Golden Field', 'VEN-DENS', 'TP-Link', 'Western Digital', 'Bin Saeed',
  'Gul Ahmed', 'North Edge', 'Fire-Boltt', 'SoundPEATS', 'Zero Lifestyle',
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

export function detectDropshippingBrand(title?: string, desc?: string): string {
  const t = title || '';
  const d = desc || '';

  const descMatch = d.match(/(?:brand|ব্র্যান্ড|Brand Name)\s*[:：\-–]\s*([^\r\n,<|.]+)/i);
  if (descMatch) {
    const rawB = descMatch[1].trim().split(/(?:model|sku|color|colour|material|origin|size|movement|dial|water|type|made|quality)/i)[0].trim();
    if (/no\s*brand|non[\s-]*brand|china|kintesi/i.test(rawB)) {
      return 'No Brand';
    }
    for (const b of KNOWN_BRANDS) {
      if (new RegExp('^' + b.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i').test(rawB) ||
          new RegExp('\\b' + b.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i').test(rawB)) {
        return b;
      }
    }
  }

  for (const b of KNOWN_BRANDS) {
    const escaped = b.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp('(?:^|[\\s\\[\\(\\/\\-_])' + escaped + '(?:$|[\\s\\]\\)\\/\\-_:,])', 'i');
    if (regex.test(t)) {
      if (b.toLowerCase() === 'vision' && /night\s+vision|clear\s+vision/i.test(t)) continue;
      if (b.toLowerCase() === 'nova' && /super\s+nova/i.test(t)) continue;
      return b;
    }
  }

  return 'No Brand';
}

/**
 * Converts a Dropshipping BD product into Kintesi Product format
 */
export function convertDropshippingToKintesiProduct(dropProd: DropshippingProduct): Partial<Product> {
  // 1. Gather all unique image URLs
  const allImages: string[] = [];
  if (dropProd.thumbnail_img) {
    allImages.push(dropProd.thumbnail_img);
  }
  if (Array.isArray(dropProd.product_images)) {
    dropProd.product_images.forEach((item) => {
      if (item.product_image && !allImages.includes(item.product_image)) {
        allImages.push(item.product_image);
      }
    });
  }
  if (allImages.length === 0) allImages.push('/logo.webp');

  // 2. Map category
  const categorySlug = mapDropshippingCategory(dropProd.category);

  // 3. Map variants to custom_attributes
  const customAttributes: ProductCustomAttributeOption[] = [];
  if (Array.isArray(dropProd.product_variants)) {
    dropProd.product_variants.forEach((v, idx) => {
      customAttributes.push({
        id: `ds_attr_${v.id || idx}_${Date.now()}`,
        attributeName: v.attribute || 'Variant',
        name: v.variant,
      });
    });
  }

  // 4. Calculate pricing & discounts
  const regularPrice = dropProd.price || 0;
  const wholesalePrice = dropProd.sale_price || 0;
  const hasDiscount = wholesalePrice > 0 && wholesalePrice < regularPrice;

  return {
    title: dropProd.name,
    slug: dropProd.slug || `ds-${dropProd.product_code}`,
    description: (dropProd.details || '').trim(),
    price: regularPrice,
    discount_price: hasDiscount ? wholesalePrice : null,
    category_id: categorySlug,
    sub_category: dropProd.category || '',
    sku: `DS-${dropProd.product_code}`,
    stock: dropProd.stock > 0 ? dropProd.stock : (dropProd.stock_status === 'available' ? 100 : 25),
    images: allImages,
    rating: 0,
    review_count: 0,
    is_featured: false,
    dropshipping_url: `${DROPSHIPPING_CONFIG.FALLBACK_STORE_URL}/product/${dropProd.slug}`,
    custom_attributes: customAttributes,
    specifications: {
      source: 'Dropshipping BD',
      product_code: dropProd.product_code,
      original_category: dropProd.category,
      supplier_wholesale_price: wholesalePrice,
      suggested_retail_price: regularPrice,
      supplier_status: dropProd.status || dropProd.stock_status,
    },
    brand: detectDropshippingBrand(dropProd.name, dropProd.details),
    tags: [
      'Dropshipping',
      dropProd.category,
      `Code-${dropProd.product_code}`,
    ].filter(Boolean),
  };
}

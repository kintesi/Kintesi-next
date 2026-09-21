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
    rating: 5,
    review_count: Math.floor(Math.random() * 12) + 4,
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
    tags: [
      'Dropshipping',
      dropProd.category,
      `Code-${dropProd.product_code}`,
    ].filter(Boolean),
  };
}

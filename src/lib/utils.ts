import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string | null | undefined): string {
  let num: number;
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[^0-9.-]+/g, '');
    num = parseFloat(cleaned);
  } else {
    num = Number(amount);
  }
  const safeAmount = isNaN(num) || !isFinite(num) ? 0 : num;
  try {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount).replace('BDT', '৳');
  } catch {
    return `৳${Math.round(safeAmount).toLocaleString('en-US')}`;
  }
}

export function calculateDiscount(price: number, discountPrice?: number | null): number {
  if (!discountPrice || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CF-${timestamp}-${randomStr}`;
}

export function generateSlug(text?: string | null): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getProductUrl(product?: { slug?: string; id?: string; title?: string } | null): string {
  if (!product) return '/shop';
  const slug = product.slug?.trim() || (product.title ? generateSlug(product.title) : '') || product.id || '';
  return `/product/${slug}`;
}

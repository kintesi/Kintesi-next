export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: 'admin' | 'customer';
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  created_at?: string;
}

export interface Address {
  id: string;
  user_id?: string | null;
  label: 'Home' | 'Office' | 'Other' | string;
  recipient_name: string;
  phone: string;
  street_address: string;
  city: string;
  postal_code?: string;
  is_default: boolean;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  image?: string;
  icon?: string;
  subcategories?: string[];
}

export interface SellerPaymentConfig {
  use_custom_payment?: boolean;
  seller_name?: string;
  seller_phone?: string;
  bkash_number?: string;
  bkash_type?: 'Merchant' | 'Personal' | 'Agent';
  nagad_number?: string;
  nagad_type?: 'Merchant' | 'Personal';
  rocket_number?: string;
  rocket_type?: 'Merchant' | 'Personal';
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_branch?: string;
  bank_routing_number?: string;
  custom_payment_note?: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discount_price?: number | null;
  category_id: string;
  sub_category?: string;
  stock: number;
  images: string[];
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_trending?: boolean;
  is_affiliate_enabled?: boolean;
  affiliate_commission_rate?: number; // percentage (e.g. 10 for 10%)
  brand?: string;
  sku?: string;
  warranty?: string;
  delivery_note?: string;
  dropshipping_url?: string;
  allowed_payment_methods?: string[]; // e.g. ['cod', 'bkash', 'nagad', 'card', 'bank']
  payment_instruction?: string;
  seller_payment?: SellerPaymentConfig;
  highlights?: string[];
  fabric?: string;
  material?: string;
  fit_type?: string;
  care_instructions?: string;
  origin?: string;
  gender?: string;
  specifications?: Record<string, any>;
  spec_mode?: 'auto' | 'gadgets' | 'fashion' | 'groceries' | 'none' | string;
  tags?: string[];
  sizes?: string[];
  colors?: ProductColorOption[];
  custom_attributes?: ProductCustomAttributeOption[];
  created_at?: string;
}

export interface ProductColorOption {
  name: string;
  hex: string;
  price?: number | null;
  discount_price?: number | null;
  discount_percent?: number | null;
  image?: string | null;
  images?: string[];
  stock?: number | null;
}

export interface ProductCustomAttributeOption {
  id: string;
  attributeName: string;
  name: string;
  price?: number | null;
  stock?: number | null;
  image?: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  customPrice?: number;
  variantImage?: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  selectedColor?: string;
  selectedSize?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  postal_code?: string;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total_amount: number;
  payment_method: 'cod' | 'bkash' | 'nagad' | 'rocket' | 'card' | 'bank';
  payment_status: 'pending' | 'paid' | 'failed';
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  transaction_id?: string;
  bank_receipt_note?: string;
  seller_payment_snapshot?: SellerPaymentConfig;
  customer_note?: string;
  affiliate_code?: string;
  affiliate_user_id?: string;
  affiliate_commission_amount?: number;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_percent: number;
  discount_value?: number;
  max_discount?: number;
  min_order_value?: number;
  is_active: boolean;
  is_new_user_only?: boolean;
  expires_at?: string;
  usage_limit_per_user?: number;
  times_used?: number;
  created_at?: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  coupon_code: string;
  user_id?: string;
  customer_email: string;
  order_id?: string;
  discount_amount: number;
  created_at: string;
}

export interface AffiliateUser {
  id: string;
  user_id?: string | null;
  affiliate_code: string; // e.g. "KAF-78291"
  name: string;
  phone: string;
  address: string;
  email?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  total_clicks: number;
  total_orders: number;
  total_sales_amount: number;
  total_commission_earned: number;
  available_balance: number;
  total_withdrawn: number;
  payment_method?: 'bkash' | 'nagad' | 'rocket' | 'bank';
  account_number?: string;
  account_details?: string;
  created_at: string;
}

export interface AffiliateWithdrawal {
  id: string;
  affiliate_id: string;
  affiliate_code: string;
  affiliate_name: string;
  affiliate_phone: string;
  amount: number;
  payment_method: 'bkash' | 'nagad' | 'rocket' | 'bank';
  account_number: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_trx_id?: string;
  admin_note?: string;
  created_at: string;
  processed_at?: string;
}

export interface AffiliateClick {
  id: string;
  affiliate_code: string;
  product_id?: string;
  created_at: string;
}

export interface GeneratedAffiliateProduct {
  id: string; // product id
  title: string;
  sku: string;
  slug?: string;
  price: number;
  discount_price?: number | null;
  image?: string;
  commission_rate: number;
  commission_amount: number;
  affiliate_link: string;
  created_at: string;
}


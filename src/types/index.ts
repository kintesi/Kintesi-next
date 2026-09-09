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
  icon?: string;
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
  stock: number;
  images: string[];
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_trending?: boolean;
  brand?: string;
  sku?: string;
  warranty?: string;
  delivery_note?: string;
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
  specifications?: Record<string, string>;
  tags?: string[];
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
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
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  max_discount?: number;
  min_order_value?: number;
  is_active: boolean;
}

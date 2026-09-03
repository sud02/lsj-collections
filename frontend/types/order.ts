export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "packed"
  | "dispatched"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentStatus = "pending" | "paid" | "failed";

/**
 * Mirrors the live `orders` table (schema is production and not migrated), so
 * most numeric columns come back as varchar strings — run them through Number()
 * before formatting. `id` is the primary key used in URLs; `order_id` is the
 * human-facing reference (e.g. "LSJ-1788460831120-1337") and the key that
 * `order_products` rows join on.
 */
export interface Order {
  id: number;
  order_id: string;
  user_id: string;
  order_status: OrderStatus | string;
  payment_status: PaymentStatus;
  payment_mode?: string;
  payment_reference?: string;
  payment_date?: string | null;

  billing_fullname: string;
  billing_email: string;
  billing_mobile: string;
  billing_address1: string;
  billing_address2?: string;
  billing_city: string;
  billing_state: string;
  billing_pincode: string;

  shipping_fullname?: string;
  shipping_email?: string;
  shipping_mobile?: string;
  shipping_address1?: string;
  shipping_address2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;

  total_products: string;
  subtotal: string;
  gst: string;
  total: string;
  grandtotal: string;
  discount: string;
  coupon?: string;
  coupon_type?: string;

  created_at: string;
  updated_at?: string | null;
}

/** Mirrors `order_products`. */
export interface OrderItem {
  id: number;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  product_slug: string;
  quantity: number;
  product_price: string;
  product_actual_price: string;
  product_weight?: string;
  featured_image_url?: string;
}

/** Shape of GET /orders/:id — the order and its items are separate keys. */
export interface OrderDetailResponse {
  order: Order;
  items: OrderItem[];
}

export interface Address {
  full_name: string;
  email: string;
  mobile: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pin_code: string;
}

export interface CreateOrderPayload {
  billing: Address;
  shipping: Address;
  items: Array<{ product_id: number; quantity: number; variation_id?: number }>;
  coupon_code?: string;
}

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

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variation_label?: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: OrderStatus;
  items: OrderItem[];
  billing: Address;
  shipping: Address;
  subtotal: number;
  gst: number;
  shipping_charge: number;
  discount: number;
  coupon_code?: string;
  grand_total: number;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_method?: string;
  created_at: string;
  estimated_delivery?: string;
}

export interface CreateOrderPayload {
  billing: Address;
  shipping: Address;
  items: Array<{ product_id: number; quantity: number; variation_id?: number }>;
  coupon_code?: string;
}

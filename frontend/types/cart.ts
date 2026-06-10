import { Product } from "./product";

export interface CartItem {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  variation_id?: number;
  variation_label?: string;
}

export interface CartTotals {
  subtotal: number;
  gst: number;
  shipping: number;
  discount: number;
  grand_total: number;
}

export interface Coupon {
  code: string;
  discount_amount: number;
  message: string;
}

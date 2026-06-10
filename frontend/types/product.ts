export interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  subcategories?: SubCategory[];
}

export interface SubCategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  image_url: string;
}

export interface ProductVariation {
  id: number;
  attribute_name: string;
  attribute_value: string;
  price_delta?: number;
}

export interface ProductReview {
  id: number;
  product_id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  rating: number;
  review: string;
  image_url?: string;
  created_at: string;
}

export interface Product {
  id: number;
  slug: string;
  product_name: string;
  short_description?: string;
  description?: string;
  featured_image_url: string;
  additional_images?: string[];
  video_url?: string;
  price: number;
  mrp: number;
  discount_percent?: number;
  weight_grams?: number;
  weight?: string;
  stock: number;
  is_in_stock: boolean;
  is_new_arrival?: boolean;
  is_popular?: boolean;
  is_lakshmi_kubera?: boolean;
  category_id?: number;
  category_name?: string;
  subcategory_id?: number;
  subcategory_name?: string;
  average_rating?: number;
  review_count?: number;
  variations?: ProductVariation[];
  reviews?: ProductReview[];
  created_at?: string;
}

export interface Advertisement {
  id: number;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  cta_text?: string;
  position?: "hero" | "split" | "strip";
}

export interface GoldRate {
  rate_22k: number;
  rate_24k: number;
  updated_at: string;
}

export interface Testimonial {
  id: number;
  name: string;
  rating: number;
  review: string;
  image_url?: string;
  created_at: string;
}

export interface RatingBreakdown {
  average: number;
  total: number;
  distribution: { [key: number]: number };
}

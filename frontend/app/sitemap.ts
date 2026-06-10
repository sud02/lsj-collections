import type { MetadataRoute } from "next";
import axios from "axios";
import { Product } from "@/types/product";

const BASE = "https://lsjcollections.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.lsjcollections.com/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/products",
    "/popular",
    "/new-arrivals",
    "/lakshmi-kubera",
    "/contact",
    "/faqs",
    "/terms-conditions",
    "/privacy-policy",
    "/shipping-policy",
    "/return-refund-policy",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data } = await axios.get<{ success: boolean; data: Product[] }>(
      `${API_URL}/products?limit=200`,
      { timeout: 10000 }
    );
    const products = data?.data ?? [];
    productRoutes = products.map((p) => ({
      url: `${BASE}/products/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    // proceed without product routes
  }

  return [...staticRoutes, ...productRoutes];
}

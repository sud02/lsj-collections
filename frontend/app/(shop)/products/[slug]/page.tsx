import type { Metadata } from "next";
import { notFound } from "next/navigation";
import axios from "axios";
import { Product } from "@/types/product";
import ProductDetailClient from "./ProductDetailClient";
import RelatedProducts from "@/components/product/RelatedProducts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.lsjcollections.com/api";

interface Envelope<T> { success: boolean; data: T }

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const { data } = await axios.get<Envelope<Product>>(`${API_URL}/products/${slug}`, {
      timeout: 15000,
    });
    return data?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) {
    return { title: "Product Not Found" };
  }
  return {
    title: `${product.product_name} | LSJ Collections`,
    description:
      product.short_description ||
      `${product.product_name} — certified hallmark jewellery from LSJ Collections.`,
    openGraph: {
      title: product.product_name,
      description: product.short_description,
      images: product.featured_image_url
        ? [{ url: product.featured_image_url }]
        : undefined,
      type: "website",
    },
  };
}

export async function generateStaticParams() {
  try {
    const { data } = await axios.get<Envelope<Product[]>>(`${API_URL}/products?limit=50`);
    const products = data?.data ?? [];
    return products.slice(0, 50).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export const revalidate = 1800;

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  return (
    <>
      <ProductDetailClient product={product} />
      <RelatedProducts
        productId={product.id}
        subcategoryId={product.subcategory_id}
      />
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Product } from "@/types/product";
import ProductGrid from "@/components/product/ProductGrid";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Spinner from "@/components/ui/Spinner";

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Product[]>("/products/new-arrivals")
      .then((r) => setProducts(r.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-cream min-h-screen">
      <div className="container-lsj py-6">
        <Breadcrumb items={[{ label: "New Arrivals" }]} />

        <div className="mt-2 mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            Fresh off the atelier
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-dark mt-1">
            New Arrivals
          </h1>
          <div className="w-16 h-[2px] bg-gold mx-auto mt-3" />
          <p className="text-sm text-gray mt-4 max-w-2xl mx-auto">
            Newly added pieces you&apos;ll want to see first — handcrafted and
            hallmark-certified.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={32} />
          </div>
        ) : (
          <ProductGrid products={products} columns={4} />
        )}
      </div>
    </div>
  );
}

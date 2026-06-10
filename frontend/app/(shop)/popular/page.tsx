"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Product } from "@/types/product";
import ProductGrid from "@/components/product/ProductGrid";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Spinner from "@/components/ui/Spinner";

export default function PopularPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Product[]>("/products/popular")
      .then((r) => setProducts(r.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-cream min-h-screen">
      <div className="container-lsj py-6">
        <Breadcrumb items={[{ label: "Popular Collections" }]} />

        <div className="mt-2 mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            Customer favourites
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-dark mt-1">
            Popular Collections
          </h1>
          <div className="w-16 h-[2px] bg-gold mx-auto mt-3" />
          <p className="text-sm text-gray mt-4 max-w-2xl mx-auto">
            Best-loved pieces from across our catalogue — worn, gifted and
            celebrated by our LSJ family.
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

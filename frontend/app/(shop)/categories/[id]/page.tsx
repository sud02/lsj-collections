"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Category, SubCategory, Product } from "@/types/product";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductGrid from "@/components/product/ProductGrid";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

export default function CategoryPage() {
  const params = useParams();
  const id = Number(params.id);
  const [category, setCategory] = useState<Category | null>(null);
  const [subs, setSubs] = useState<SubCategory[]>([]);
  const [activeSub, setActiveSub] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);

  // Load category meta (name + subcategories) once
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { data: cats } = await api.get<Category[]>("/categories");
        if (!alive) return;
        const current = cats.find((c) => c.id === id) || null;
        setCategory(current);
        setSubs(current?.subcategories || []);
      } catch {
        if (alive) setCategory(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // Load products — all in the category, or filtered by the selected subcategory
  useEffect(() => {
    let alive = true;
    (async () => {
      setProductsLoading(true);
      try {
        const paramsObj = activeSub
          ? { subcategory: activeSub, limit: 60 }
          : { category: id, limit: 60 };
        const { data } = await api.get<Product[]>("/products", { params: paramsObj });
        if (alive) setProducts(data);
      } catch {
        if (alive) setProducts([]);
      } finally {
        if (alive) setProductsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, activeSub]);

  const chip = (label: string, value: number | null) => (
    <button
      key={value ?? "all"}
      onClick={() => setActiveSub(value)}
      className={cn(
        "px-4 py-1.5 rounded-pill text-sm border transition-colors whitespace-nowrap",
        activeSub === value
          ? "bg-gold text-white border-gold"
          : "bg-white text-dark border-border hover:border-gold hover:text-gold"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-cream min-h-screen">
      <div className="container-lsj py-6">
        <Breadcrumb
          items={[
            { label: "Shop", href: "/products" },
            { label: category?.name || "Category" },
          ]}
        />

        <div className="mt-2 mb-6">
          <h1 className="font-serif text-3xl md:text-4xl text-dark">
            {category?.name || "Category"}
          </h1>
          <div className="w-16 h-[2px] bg-gold mt-2" />
        </div>

        {/* Subcategory filters */}
        {subs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {chip("All", null)}
            {subs.map((s) => chip(s.name, s.id))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={32} />
          </div>
        ) : productsLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size={28} />
          </div>
        ) : products.length > 0 ? (
          <ProductGrid products={products} columns={4} />
        ) : (
          <div className="text-center py-20 bg-white rounded-lg border border-border">
            <h3 className="font-serif text-2xl text-dark">Coming Soon</h3>
            <div className="gold-divider" />
            <p className="text-sm text-gray">
              {activeSub
                ? "No products in this subcategory yet."
                : "This collection is being curated. Please check back shortly."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

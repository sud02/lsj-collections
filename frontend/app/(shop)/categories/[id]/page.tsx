"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Category, SubCategory, Product } from "@/types/product";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductGrid from "@/components/product/ProductGrid";
import Spinner from "@/components/ui/Spinner";

export default function CategoryPage() {
  const params = useParams();
  const id = Number(params.id);
  const [category, setCategory] = useState<Category | null>(null);
  const [subs, setSubs] = useState<SubCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"subs" | "products">("subs");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: cats } = await api.get<Category[]>("/categories");
        const current = cats.find((c) => c.id === id) || null;
        setCategory(current);
        const subList = current?.subcategories || [];
        setSubs(subList);
        if (subList.length === 0) {
          const { data } = await api.get<Product[]>("/products", {
            params: { category: id },
          });
          setProducts(data);
          setView("products");
        } else {
          setView("subs");
        }
      } catch {
        setCategory(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div className="bg-cream min-h-screen">
      <div className="container-lsj py-6">
        <Breadcrumb
          items={[
            { label: "Shop", href: "/products" },
            { label: category?.name || "Category" },
          ]}
        />

        <div className="mt-2 mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-dark">
            {category?.name || "Category"}
          </h1>
          <div className="w-16 h-[2px] bg-gold mt-2" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={32} />
          </div>
        ) : view === "subs" && subs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {subs.map((s) => (
              <Link
                key={s.id}
                href={`/products?subcategory=${s.id}`}
                className="group relative h-64 rounded-lg overflow-hidden border border-border"
              >
                {s.image_url && (
                  <Image
                    src={s.image_url}
                    alt={s.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent group-hover:from-black/80 transition-all" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-serif text-lg text-white">{s.name}</h3>
                  <div className="w-10 h-[2px] bg-gold mt-2 group-hover:w-16 transition-all" />
                  <p className="text-xs text-white/80 mt-1">Shop collection →</p>
                </div>
              </Link>
            ))}
          </div>
        ) : products.length > 0 ? (
          <ProductGrid products={products} columns={4} />
        ) : (
          <div className="text-center py-20 bg-white rounded-lg border border-border">
            <h3 className="font-serif text-2xl text-dark">Coming Soon</h3>
            <div className="gold-divider" />
            <p className="text-sm text-gray">
              This collection is being curated. Please check back shortly.
            </p>
            <Link
              href="/products"
              className="inline-block mt-6 btn-outline"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

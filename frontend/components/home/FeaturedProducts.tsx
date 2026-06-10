"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { Product } from "@/types/product";
import ProductGrid from "@/components/product/ProductGrid";
import Spinner from "@/components/ui/Spinner";

interface Props {
  title: string;
  endpoint: string;
  viewAllHref: string;
  subtitle?: string;
  limit?: number;
}

export default function FeaturedProducts({
  title,
  endpoint,
  viewAllHref,
  subtitle,
  limit = 8,
}: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Product[]>(endpoint)
      .then((r) => setProducts(r.data.slice(0, limit)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [endpoint, limit]);

  return (
    <section className="py-14">
      <div className="container-lsj">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-dark">{title}</h2>
            <div className="w-16 h-[2px] bg-gold mt-2" />
            {subtitle && (
              <p className="text-sm text-gray mt-3 max-w-lg">{subtitle}</p>
            )}
          </div>
          <Link
            href={viewAllHref}
            className="group hidden sm:inline-flex items-center gap-1 text-sm text-gold hover:text-gold-dark font-medium"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <ProductGrid products={products} columns={4} />
        )}

        <div className="sm:hidden text-center mt-6">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-sm text-gold font-medium"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

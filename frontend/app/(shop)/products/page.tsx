"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Grid3x3, List } from "lucide-react";
import api from "@/lib/api";
import { Product } from "@/types/product";
import ProductCard from "@/components/product/ProductCard";
import ProductFilters, { Filters } from "@/components/product/ProductFilters";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const params = useSearchParams();
  const search = params.get("search") || "";
  const subcategory = params.get("subcategory") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "popular">("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<Filters | null>(null);
  const [visible, setVisible] = useState(24);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const qs: Record<string, string> = {};
        if (search) qs.search = search;
        if (subcategory) qs.subcategory = subcategory;
        if (sort) qs.sort = sort;
        const { data } = await api.get<Product[]>("/products", { params: qs });
        setProducts(data);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, subcategory, sort]);

  const filtered = useMemo(() => {
    if (!filters) return products;
    return products.filter((p) => {
      if (p.price < filters.priceMin || p.price > filters.priceMax) return false;
      if (filters.rating && (p.average_rating ?? 0) < filters.rating) return false;
      if (p.weight_grams !== undefined) {
        if (
          p.weight_grams < filters.weightRange[0] ||
          p.weight_grams > filters.weightRange[1]
        )
          return false;
      }
      return true;
    });
  }, [products, filters]);

  const visibleItems = filtered.slice(0, visible);

  return (
    <div className="bg-cream min-h-screen">
      <div className="container-lsj py-6">
        <Breadcrumb
          items={[
            { label: "Shop", href: "/products" },
            { label: search ? `Search: "${search}"` : "All Products" },
          ]}
        />

        <div className="mt-2 mb-6">
          <h1 className="font-serif text-3xl md:text-4xl text-dark">
            {search ? `Search Results` : "All Products"}
          </h1>
          <div className="w-16 h-[2px] bg-gold mt-2" />
          {search && (
            <p className="text-sm text-gray mt-2">
              Showing results for <span className="text-dark font-medium">&quot;{search}&quot;</span>
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <ProductFilters onChange={setFilters} />

          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-3 bg-white border border-border rounded-lg">
              <p className="text-xs text-gray">
                Showing <span className="text-dark font-medium">{visibleItems.length}</span> of{" "}
                <span className="text-dark font-medium">{filtered.length}</span> products
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="h-10 px-3 bg-gray-light border border-border rounded text-xs focus:outline-none focus:border-gold"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="popular">Most Popular</option>
                </select>
                <div className="hidden sm:flex border border-border rounded overflow-hidden">
                  <button
                    onClick={() => setView("grid")}
                    className={cn(
                      "p-2 transition-colors",
                      view === "grid" ? "bg-gold text-white" : "bg-white text-gray hover:bg-gold-bg"
                    )}
                    aria-label="Grid view"
                  >
                    <Grid3x3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={cn(
                      "p-2 transition-colors",
                      view === "list" ? "bg-gold text-white" : "bg-white text-gray hover:bg-gold-bg"
                    )}
                    aria-label="List view"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner size={32} />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<PackageSearch className="w-8 h-8" />}
                title="No products found"
                description="Try adjusting your filters or searching something else."
                actionLabel="Clear & Browse All"
                actionHref="/products"
              />
            ) : (
              <>
                <div
                  className={cn(
                    "grid gap-4 md:gap-5",
                    view === "grid"
                      ? "grid-cols-2 md:grid-cols-3"
                      : "grid-cols-1 md:grid-cols-2"
                  )}
                >
                  {visibleItems.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {visible < filtered.length && (
                  <div className="flex justify-center mt-10">
                    <button
                      onClick={() => setVisible((v) => v + 24)}
                      className="btn-outline px-10"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

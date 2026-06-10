import { Product } from "@/types/product";
import ProductCard from "./ProductCard";
import EmptyState from "@/components/ui/EmptyState";
import { PackageSearch } from "lucide-react";

interface Props {
  products: Product[];
  columns?: 2 | 3 | 4;
  emptyTitle?: string;
  emptyDesc?: string;
}

const cols: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
};

export default function ProductGrid({
  products,
  columns = 4,
  emptyTitle = "No products found",
  emptyDesc = "Try adjusting your filters or search query.",
}: Props) {
  if (!products?.length) {
    return (
      <EmptyState
        icon={<PackageSearch className="w-8 h-8" />}
        title={emptyTitle}
        description={emptyDesc}
        actionLabel="Browse All Products"
        actionHref="/products"
      />
    );
  }

  return (
    <div className={`grid gap-4 md:gap-5 ${cols[columns]}`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

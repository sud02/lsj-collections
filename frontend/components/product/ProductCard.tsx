"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { Product } from "@/types/product";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import { formatINR, computeDiscount, cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import RatingStars from "./RatingStars";

export default function ProductCard({ product }: { product: Product }) {
  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const discount = product.discount_percent ?? computeDiscount(product.mrp, product.price);
  const outOfStock = !product.is_in_stock || product.stock <= 0;

  const onAddCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    await addToCart(product, 1);
    toast.success("Added to cart");
  };

  const onWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      toast("Please log in to save items", { icon: "💛" });
      openAuthModal();
      return;
    }
    await toggleWishlist(product);
    toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden border border-border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gold-bg">
          {product.featured_image_url ? (
            <Image
              src={product.featured_image_url}
              alt={product.product_name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-mid text-xs">
              No image
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && <Badge variant="gold">-{discount}%</Badge>}
            {product.is_new_arrival && <Badge variant="teal">New</Badge>}
          </div>

          {/* Wishlist icon */}
          <button
            onClick={onWishlist}
            aria-label="Toggle wishlist"
            className={cn(
              "absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm transition-all",
              isWishlisted ? "text-red-500" : "text-dark hover:text-red-500"
            )}
          >
            <Heart className={cn("w-4 h-4", isWishlisted && "fill-red-500")} />
          </button>

          {/* Hover action bar */}
          <div className="absolute inset-x-0 bottom-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex gap-1.5">
              <button
                onClick={onAddCart}
                disabled={outOfStock}
                className="flex-1 h-10 bg-dark text-white text-xs font-medium rounded flex items-center justify-center gap-1.5 hover:bg-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                {outOfStock ? "Sold Out" : "Add to Cart"}
              </button>
              <Link
                href={`/products/${product.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="h-10 w-10 bg-white border border-border text-dark rounded flex items-center justify-center hover:bg-gold hover:text-white hover:border-gold transition-colors"
                aria-label="View product"
              >
                <Eye className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {outOfStock && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
              <span className="px-4 py-1.5 bg-dark text-white text-xs rounded-pill font-medium">
                Sold Out
              </span>
            </div>
          )}
        </div>

        <div className="p-3.5 space-y-1.5">
          <h4 className="font-serif text-sm text-dark line-clamp-1 group-hover:text-gold transition-colors">
            {product.product_name}
          </h4>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-base text-gold font-semibold">
                {formatINR(product.price)}
              </span>
              {product.mrp > product.price && (
                <span className="text-[11px] text-gray-mid line-through">
                  {formatINR(product.mrp)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray">
            {(product.review_count ?? 0) > 0 ? (
              <div className="flex items-center gap-1">
                <RatingStars value={product.average_rating || 0} size={12} />
                <span>({product.review_count})</span>
              </div>
            ) : (
              <span>&nbsp;</span>
            )}
            {product.weight_grams && (
              <span className="text-gold">{product.weight_grams}g</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

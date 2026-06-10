"use client";
import { useState } from "react";
import { Minus, Plus, Heart, Share2, ShieldCheck, Truck, Award, Upload, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { Product, ProductReview } from "@/types/product";
import { formatINR, computeDiscount, cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import ProductGallery from "@/components/product/ProductGallery";
import ProductVariations from "@/components/product/ProductVariations";
import RatingStars from "@/components/product/RatingStars";
import ReviewSection from "@/components/product/ReviewSection";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function ProductDetailClient({ product: initial }: { product: Product }) {
  const [product, setProduct] = useState(initial);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"description" | "reviews">("description");
  const [selectedVars, setSelectedVars] = useState<Record<string, number>>({});

  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const { isLoggedIn, openAuthModal } = useAuthStore();

  const discount = product.discount_percent ?? computeDiscount(product.mrp, product.price);
  const outOfStock = !product.is_in_stock || product.stock <= 0;
  const images = [product.featured_image_url, ...(product.additional_images || [])].filter(Boolean) as string[];

  const handleVariation = (attr: string, id: number) => {
    setSelectedVars((s) => ({ ...s, [attr]: id }));
  };

  const onAdd = async () => {
    if (outOfStock) return;
    await addToCart(product, qty);
    toast.success(`${qty} × ${product.product_name} added to cart`);
  };

  const onWishlist = async () => {
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }
    await toggleWishlist(product);
    toast.success(isWishlisted ? "Removed from wishlist" : "Saved to wishlist");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const onReviewAdded = (r: ProductReview) => {
    setProduct((p) => ({
      ...p,
      reviews: [r, ...(p.reviews || [])],
      review_count: (p.review_count || 0) + 1,
    }));
  };

  return (
    <div className="bg-white">
      <div className="container-lsj py-4">
        <Breadcrumb
          items={[
            { label: "Shop", href: "/products" },
            ...(product.category_name
              ? [{ label: product.category_name, href: `/categories/${product.category_id}` }]
              : []),
            { label: product.product_name },
          ]}
        />
      </div>

      <div className="container-lsj pb-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Gallery */}
          <div className="lg:col-span-5">
            <ProductGallery
              images={images}
              video={product.video_url}
              alt={product.product_name}
            />
          </div>

          {/* Info */}
          <div className="lg:col-span-7">
            <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl text-dark leading-tight">
              {product.product_name}
            </h1>

            <div className="flex items-center gap-4 mt-3 text-xs text-gray">
              {(product.review_count ?? 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <RatingStars value={product.average_rating || 0} size={14} />
                  <span>({product.review_count} reviews)</span>
                </div>
              )}
              {product.weight_grams && (
                <span className="text-gold font-medium">{product.weight_grams}g</span>
              )}
              {product.category_name && (
                <span className="px-2 py-0.5 bg-gold-bg rounded-pill text-dark">
                  {product.category_name}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3 mt-5">
              <span className="font-serif text-3xl md:text-4xl text-gold font-semibold">
                {formatINR(product.price)}
              </span>
              {product.mrp > product.price && (
                <>
                  <span className="text-base text-gray-mid line-through">
                    {formatINR(product.mrp)}
                  </span>
                  {discount > 0 && <Badge variant="green">Save {discount}%</Badge>}
                </>
              )}
            </div>
            <p className="text-[11px] text-gray mt-1">Inclusive of all taxes · GST included</p>

            {product.short_description && (
              <p className="text-sm text-gray mt-5 leading-relaxed">
                {product.short_description}
              </p>
            )}

            {product.variations && product.variations.length > 0 && (
              <div className="mt-6">
                <ProductVariations
                  variations={product.variations}
                  selected={selectedVars}
                  onChange={handleVariation}
                />
              </div>
            )}

            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-dark font-medium mb-2">
                Quantity
              </p>
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center border border-border rounded overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-11 flex items-center justify-center hover:bg-gold-bg"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 h-11 text-center border-x border-border text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="w-10 h-11 flex items-center justify-center hover:bg-gold-bg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-gray">
                  {product.stock > 0 && product.stock < 10 ? (
                    <span className="text-orange-600">Only {product.stock} left!</span>
                  ) : outOfStock ? (
                    <span className="text-red-600">Out of stock</span>
                  ) : (
                    <span className="text-green-700">In stock</span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button size="lg" fullWidth disabled={outOfStock} onClick={onAdd}>
                {outOfStock ? "Sold Out" : "Add to Cart"}
              </Button>
              <Button
                size="lg"
                fullWidth
                variant="outline"
                onClick={onWishlist}
                leftIcon={
                  <Heart
                    className={cn("w-4 h-4", isWishlisted && "fill-current")}
                  />
                }
              >
                {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
              </Button>
            </div>

            <div className="mt-5 p-4 border border-dashed border-gold rounded-lg bg-gold-bg/30">
              <p className="text-xs font-medium text-dark mb-2 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-gold" />
                Want customization? Upload a reference image
              </p>
              {isLoggedIn ? (
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="flex-1 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-gold file:text-white file:text-xs file:cursor-pointer"
                  />
                  <Button size="sm">Upload</Button>
                </div>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="text-xs text-gold underline hover:text-gold-dark"
                >
                  Login to upload a reference
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 text-xs text-gray hover:text-gold"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Link
              </button>
              <button className="inline-flex items-center gap-1.5 text-xs text-gray hover:text-gold">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-7 pt-6 border-t border-border text-xs">
              <div className="text-center">
                <Award className="w-5 h-5 text-gold mx-auto mb-1" />
                <p className="text-dark font-medium">Hallmark</p>
                <p className="text-gray text-[11px]">BIS Certified</p>
              </div>
              <div className="text-center">
                <Truck className="w-5 h-5 text-gold mx-auto mb-1" />
                <p className="text-dark font-medium">Free Shipping</p>
                <p className="text-gray text-[11px]">Above ₹5,000</p>
              </div>
              <div className="text-center">
                <ShieldCheck className="w-5 h-5 text-gold mx-auto mb-1" />
                <p className="text-dark font-medium">15-Day Return</p>
                <p className="text-gray text-[11px]">Hassle-free</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-14">
          <div className="flex gap-1 border-b border-border">
            <button
              onClick={() => setTab("description")}
              className={cn(
                "px-5 py-3 text-sm font-medium relative transition-colors",
                tab === "description" ? "text-gold" : "text-gray hover:text-dark"
              )}
            >
              Description
              {tab === "description" && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-gold" />
              )}
            </button>
            <button
              onClick={() => setTab("reviews")}
              className={cn(
                "px-5 py-3 text-sm font-medium relative transition-colors",
                tab === "reviews" ? "text-gold" : "text-gray hover:text-dark"
              )}
            >
              Reviews ({product.review_count ?? product.reviews?.length ?? 0})
              {tab === "reviews" && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-gold" />
              )}
            </button>
          </div>

          <div className="py-8">
            {tab === "description" ? (
              <div
                className="prose prose-sm max-w-none text-gray leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: product.description || "<p>No description available.</p>",
                }}
              />
            ) : (
              <ReviewSection
                productId={product.id}
                reviews={product.reviews || []}
                onAdded={onReviewAdded}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

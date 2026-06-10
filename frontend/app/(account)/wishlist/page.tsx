"use client";
import { useEffect } from "react";
import { Heart } from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductGrid from "@/components/product/ProductGrid";
import EmptyState from "@/components/ui/EmptyState";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const { isLoggedIn, openAuthModal, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && !isLoggedIn) openAuthModal();
  }, [hydrated, isLoggedIn, openAuthModal]);

  return (
    <div className="bg-cream min-h-screen">
      <div className="container-lsj py-6">
        <Breadcrumb items={[{ label: "My Wishlist" }]} />

        <div className="mt-2 mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-dark">My Wishlist</h1>
          <div className="w-16 h-[2px] bg-gold mt-2" />
          <p className="text-sm text-gray mt-3">
            {items.length} item{items.length !== 1 && "s"} saved for later
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-border rounded-lg">
            <EmptyState
              icon={<Heart className="w-8 h-8" />}
              title="Your wishlist is empty"
              description="Tap the heart icon on any product to save it here for later."
              actionLabel="Browse Products"
              actionHref="/products"
            />
          </div>
        ) : (
          <ProductGrid products={items} columns={4} />
        )}
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import Breadcrumb from "@/components/ui/Breadcrumb";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import EmptyState from "@/components/ui/EmptyState";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);

  return (
    <div className="bg-cream min-h-screen">
      <div className="container-lsj py-6">
        <Breadcrumb items={[{ label: "Shopping Cart" }]} />

        <div className="mt-2 mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-dark">Your Cart</h1>
          <div className="w-16 h-[2px] bg-gold mt-2" />
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg border border-border">
            <EmptyState
              icon={<ShoppingBag className="w-8 h-8" />}
              title="Your cart is empty"
              description="Looks like you haven't added anything yet. Explore our collection to find something that catches your eye."
              actionLabel="Continue Shopping"
              actionHref="/products"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-3">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
              <Link
                href="/products"
                className="inline-block text-sm text-gold hover:text-gold-dark font-medium pt-2"
              >
                ← Continue Shopping
              </Link>
            </div>
            <div className="lg:col-span-4">
              <CartSummary subtotal={total} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

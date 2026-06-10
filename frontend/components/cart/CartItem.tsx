"use client";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { CartItem as CartItemType } from "@/types/cart";
import { useCartStore } from "@/store/cartStore";
import { formatINR } from "@/lib/utils";

export default function CartItem({ item }: { item: CartItemType }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const onRemove = async () => {
    await removeItem(item.id);
    toast.success("Removed from cart");
  };

  return (
    <div className="flex gap-4 p-4 bg-white border border-border rounded-lg hover:shadow-sm transition-shadow">
      <Link
        href={`/products/${item.product.slug}`}
        className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gold-bg relative border border-border"
      >
        {item.product.featured_image_url && (
          <Image
            src={item.product.featured_image_url}
            alt={item.product.product_name}
            fill
            sizes="80px"
            className="object-cover"
          />
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/products/${item.product.slug}`}
              className="font-serif text-sm md:text-base text-dark hover:text-gold transition-colors line-clamp-2"
            >
              {item.product.product_name}
            </Link>
            {item.variation_label && (
              <p className="text-xs text-gray mt-0.5">{item.variation_label}</p>
            )}
            <p className="text-xs text-gray mt-0.5">
              Unit: <span className="text-dark font-medium">{formatINR(item.unit_price)}</span>
            </p>
          </div>
          <button
            onClick={onRemove}
            aria-label="Remove item"
            className="shrink-0 text-gray hover:text-red-600 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="inline-flex items-center border border-border rounded overflow-hidden">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-gold-bg"
              aria-label="Decrease"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              value={item.quantity}
              onChange={(e) => {
                const n = parseInt(e.target.value) || 1;
                updateQuantity(item.id, n);
              }}
              className="w-10 h-8 text-center text-sm border-x border-border focus:outline-none"
            />
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-gold-bg"
              aria-label="Increase"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <span className="font-serif text-base text-gold font-semibold">
            {formatINR(item.unit_price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}

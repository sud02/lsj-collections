"use client";
import Image from "next/image";
import { CartItem } from "@/types/cart";
import { formatINR, computeTotals } from "@/lib/utils";

interface Props {
  items: CartItem[];
  discount?: number;
}

export default function OrderSummary({ items, discount = 0 }: Props) {
  const subtotal = items.reduce((a, i) => a + i.unit_price * i.quantity, 0);
  const totals = computeTotals(subtotal, discount);

  return (
    <div className="bg-white border border-border rounded-lg p-5">
      <h4 className="font-serif text-lg text-dark mb-4">Order Summary</h4>

      <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
            <div className="relative w-14 h-14 rounded overflow-hidden bg-gold-bg shrink-0 border border-border">
              {i.product.featured_image_url && (
                <Image
                  src={i.product.featured_image_url}
                  alt={i.product.product_name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              )}
              <span className="absolute top-0 right-0 bg-dark text-white text-[10px] rounded-bl px-1.5">
                ×{i.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm text-dark line-clamp-2">
                {i.product.product_name}
              </p>
              <p className="text-xs text-gray">Unit: {formatINR(i.unit_price)}</p>
            </div>
            <span className="text-sm font-medium text-dark">
              {formatINR(i.unit_price * i.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray">Subtotal</span>
          <span className="text-dark">{formatINR(totals.subtotal)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Discount</span>
            <span>- {formatINR(totals.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray">GST (18%)</span>
          <span className="text-dark">{formatINR(totals.gst)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray">Shipping</span>
          <span className="text-green-700">Free</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <span className="font-serif text-base text-dark">Grand Total</span>
        <span className="font-serif text-xl text-gold font-semibold">
          {formatINR(totals.grand_total)}
        </span>
      </div>
    </div>
  );
}

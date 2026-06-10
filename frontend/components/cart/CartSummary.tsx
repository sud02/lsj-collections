"use client";
import Link from "next/link";
import { ShieldCheck, Award } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatINR, computeTotals } from "@/lib/utils";

interface Props {
  subtotal: number;
  discount?: number;
  primaryHref?: string;
  primaryLabel?: string;
  onPrimaryClick?: () => void;
  primaryLoading?: boolean;
  showContinue?: boolean;
}

export default function CartSummary({
  subtotal,
  discount = 0,
  primaryHref = "/checkout",
  primaryLabel = "Proceed to Checkout",
  onPrimaryClick,
  primaryLoading,
  showContinue = true,
}: Props) {
  const totals = computeTotals(subtotal, discount);

  const PrimaryBtn = (
    <Button
      fullWidth
      size="lg"
      onClick={onPrimaryClick}
      loading={primaryLoading}
    >
      {primaryLabel}
    </Button>
  );

  return (
    <aside className="bg-white border border-border rounded-lg p-5 md:p-6 sticky top-28 shadow-sm">
      <h4 className="font-serif text-lg text-dark mb-4">Order Summary</h4>
      <ul className="text-sm space-y-2.5 pb-4 border-b border-border">
        <li className="flex justify-between">
          <span className="text-gray">Subtotal</span>
          <span className="text-dark font-medium">{formatINR(totals.subtotal)}</span>
        </li>
        {totals.discount > 0 && (
          <li className="flex justify-between text-green-700">
            <span>Coupon Discount</span>
            <span>- {formatINR(totals.discount)}</span>
          </li>
        )}
        <li className="flex justify-between">
          <span className="text-gray">GST (18%)</span>
          <span className="text-dark font-medium">{formatINR(totals.gst)}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-gray">Shipping</span>
          <span className="text-green-700 font-medium">Free</span>
        </li>
      </ul>

      <div className="flex items-center justify-between py-4 border-b border-border">
        <span className="font-serif text-base text-dark">Grand Total</span>
        <span className="font-serif text-2xl text-gold font-semibold">
          {formatINR(totals.grand_total)}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {onPrimaryClick ? (
          PrimaryBtn
        ) : (
          <Link href={primaryHref}>{PrimaryBtn}</Link>
        )}
        {showContinue && (
          <Link href="/products" className="block">
            <Button variant="outline" fullWidth>
              Continue Shopping
            </Button>
          </Link>
        )}
      </div>

      <div className="mt-5 pt-5 border-t border-border space-y-2 text-xs text-gray">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
          <span>Secure Checkout · SSL Encrypted</span>
        </div>
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-gold shrink-0" />
          <span>Certified Hallmark Jewellery</span>
        </div>
      </div>
    </aside>
  );
}

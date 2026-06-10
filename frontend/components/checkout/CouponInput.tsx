"use client";
import { useState } from "react";
import { Tag, Check, X } from "lucide-react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

interface Props {
  grandTotal: number;
  onApplied: (code: string, discount: number) => void;
  onCleared: () => void;
  appliedCode?: string;
  appliedDiscount?: number;
}

export default function CouponInput({
  grandTotal,
  onApplied,
  onCleared,
  appliedCode,
  appliedDiscount,
}: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post<{ discount_amount: number; message?: string }>(
        "/coupons/validate",
        { code: code.trim().toUpperCase(), grand_total: grandTotal }
      );
      onApplied(code.trim().toUpperCase(), data.discount_amount);
      toast.success(data.message || "Coupon applied");
      setCode("");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid coupon code";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (appliedCode) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-700" />
          <div>
            <p className="text-sm font-medium text-green-800">{appliedCode}</p>
            <p className="text-xs text-green-700">
              You saved ₹{(appliedDiscount ?? 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        <button
          onClick={onCleared}
          aria-label="Remove coupon"
          className="text-green-700 hover:text-red-600 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply} className="bg-white border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Tag className="w-4 h-4 text-gold" />
        <span className="text-sm font-medium text-dark">Apply Coupon</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          className="flex-1 h-11 px-3 bg-gray-light border border-border rounded text-sm focus:outline-none focus:border-gold focus:bg-white"
        />
        <Button type="submit" size="sm" loading={loading} className="px-5">
          Apply
        </Button>
      </div>
    </form>
  );
}

"use client";
import { useFormContext } from "react-hook-form";
import BillingForm from "./BillingForm";
import type { CheckoutFormValues } from "./schema";

export default function ShippingForm() {
  const { watch, register } = useFormContext<CheckoutFormValues>();
  const shipDifferent = watch("ship_different");

  return (
    <>
      <label className="flex items-center gap-2 text-sm cursor-pointer py-3">
        <input
          type="checkbox"
          {...register("ship_different")}
          className="w-4 h-4 accent-gold"
        />
        Ship to a different address
      </label>

      {shipDifferent && (
        <BillingForm
          prefix="shipping"
          title="Shipping Address"
          optional={false}
        />
      )}
    </>
  );
}

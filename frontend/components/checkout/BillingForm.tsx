"use client";
import { useFormContext } from "react-hook-form";
import Input from "@/components/ui/Input";
import { INDIAN_STATES } from "@/lib/utils";
import type { CheckoutFormValues } from "./schema";

interface Props {
  prefix: "billing" | "shipping";
  title: string;
  optional?: boolean;
}

export default function BillingForm({ prefix, title, optional = false }: Props) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckoutFormValues>();

  const err = (field: string) => {
    const group = errors?.[prefix] as Record<string, { message?: string }> | undefined;
    return group?.[field]?.message;
  };

  return (
    <section className="bg-white border border-border rounded-lg p-5 md:p-6">
      <h4 className="font-serif text-xl text-dark mb-4">{title}</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          required={!optional}
          placeholder="Your full name"
          {...register(`${prefix}.full_name`)}
          error={err("full_name")}
        />
        <Input
          label="Email"
          type="email"
          required={!optional}
          placeholder="you@example.com"
          {...register(`${prefix}.email`)}
          error={err("email")}
        />
        <Input
          label="Mobile"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          required={!optional}
          placeholder="10-digit mobile number"
          {...register(`${prefix}.mobile`)}
          error={err("mobile")}
        />
        <Input
          label="PIN Code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          required={!optional}
          placeholder="6-digit PIN code"
          {...register(`${prefix}.pin_code`)}
          error={err("pin_code")}
        />
        <div className="md:col-span-2">
          <Input
            label="Address Line 1"
            required={!optional}
            placeholder="House / Street / Landmark"
            {...register(`${prefix}.address_line1`)}
            error={err("address_line1")}
          />
        </div>
        <div className="md:col-span-2">
          <Input
            label="Address Line 2"
            placeholder="Apartment, suite, etc. (optional)"
            {...register(`${prefix}.address_line2`)}
          />
        </div>
        <Input
          label="City"
          required={!optional}
          placeholder="City"
          {...register(`${prefix}.city`)}
          error={err("city")}
        />
        <div>
          <label className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wide">
            State {!optional && <span className="text-red-600">*</span>}
          </label>
          <select
            {...register(`${prefix}.state`)}
            className="w-full h-12 px-4 bg-gray-light border border-border rounded text-dark focus:outline-none focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20"
          >
            <option value="">Select State</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {err("state") && (
            <p className="text-xs text-red-600 mt-1">{err("state")}</p>
          )}
        </div>
      </div>
    </section>
  );
}

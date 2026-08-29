"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";

import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

import Breadcrumb from "@/components/ui/Breadcrumb";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import BillingForm from "@/components/checkout/BillingForm";
import ShippingForm from "@/components/checkout/ShippingForm";
import OrderSummary from "@/components/checkout/OrderSummary";
import CouponInput from "@/components/checkout/CouponInput";
import { checkoutFormSchema, CheckoutFormValues } from "@/components/checkout/schema";
import { ShoppingBag } from "lucide-react";
import { computeTotals } from "@/lib/utils";

// The order API expects name/address1/pincode; the form uses full_name/address_line1/pin_code.
const toApiAddress = (a?: Partial<CheckoutFormValues["billing"]>) => ({
  name: a?.full_name || "",
  email: a?.email || "",
  mobile: a?.mobile || "",
  address1: a?.address_line1 || "",
  address2: a?.address_line2 || "",
  city: a?.city || "",
  state: a?.state || "",
  pincode: a?.pin_code || "",
});

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const { isLoggedIn, user, openAuthModal, hydrated } = useAuthStore();

  const [submitting, setSubmitting] = useState(false);
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      billing: {
        full_name: user?.name || "",
        email: user?.email || "",
        mobile: user?.mobile || "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        pin_code: "",
      },
      ship_different: false,
    },
  });

  useEffect(() => {
    if (hydrated && !isLoggedIn) {
      openAuthModal();
    }
  }, [hydrated, isLoggedIn, openAuthModal]);

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setSubmitting(true);
    try {
      const { data: order } = await api.post<{ order_id: number; grandtotal: number }>(
        "/orders",
        {
          billing: toApiAddress(values.billing),
          shipping: toApiAddress(values.ship_different ? values.shipping : values.billing),
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          coupon_code: coupon?.code,
        }
      );

      const { data: payment } = await api.post<{ redirect_url: string }>(
        "/payment/initiate",
        { order_id: order.order_id }
      );

      await clearCart();

      if (payment.redirect_url) {
        window.location.href = payment.redirect_url;
      } else {
        router.push(`/order-success/${order.order_id}`);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to place order. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-cream min-h-screen">
        <div className="container-lsj py-8">
          <Breadcrumb items={[{ label: "Checkout" }]} />
          <div className="bg-white rounded-lg border border-border mt-4">
            <EmptyState
              icon={<ShoppingBag className="w-8 h-8" />}
              title="Your cart is empty"
              description="Add items to your cart before checking out."
              actionLabel="Shop Now"
              actionHref="/products"
            />
          </div>
        </div>
      </div>
    );
  }

  const totals = computeTotals(total, coupon?.discount || 0);

  return (
    <div className="bg-cream min-h-screen">
      <div className="container-lsj py-6">
        <Breadcrumb
          items={[
            { label: "Cart", href: "/cart" },
            { label: "Checkout" },
          ]}
        />

        <div className="mt-2 mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-dark">Checkout</h1>
          <div className="w-16 h-[2px] bg-gold mt-2" />
        </div>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-5">
              <BillingForm prefix="billing" title="Billing Address" />
              <ShippingForm />
            </div>

            <div className="lg:col-span-4 space-y-4">
              <OrderSummary items={items} discount={coupon?.discount || 0} />
              <CouponInput
                grandTotal={totals.grand_total}
                appliedCode={coupon?.code}
                appliedDiscount={coupon?.discount}
                onApplied={(code, discount) => setCoupon({ code, discount })}
                onCleared={() => setCoupon(null)}
              />
              <div className="bg-white border border-border rounded-lg p-5">
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={submitting}
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                >
                  Place Order Securely
                </Button>
                <p className="text-[11px] text-center text-gray mt-3">
                  Secured by PhonePe · SSL Encrypted · Hallmark Certified
                </p>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}

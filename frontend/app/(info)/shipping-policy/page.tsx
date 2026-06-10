import type { Metadata } from "next";
import PolicyLayout from "@/components/policy/PolicyLayout";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description: "Delivery timelines, charges, and coverage at LSJ Collections.",
};

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout
      title="Shipping Policy"
      subtitle="Free, fully insured shipping across India on every hallmark piece"
      lastUpdated="January 2026"
    >
      <h2>1. Coverage</h2>
      <p>
        We ship to all serviceable PIN codes in India. International shipping is currently
        not available — we&apos;re working on it.
      </p>

      <h2>2. Shipping Charges</h2>
      <ul>
        <li>Orders <strong>above ₹5,000</strong> — Free shipping</li>
        <li>Orders <strong>below ₹5,000</strong> — ₹150 flat shipping fee</li>
      </ul>

      <h2>3. Processing & Delivery Time</h2>
      <ul>
        <li><strong>Ready-to-ship</strong>: Dispatched within 24 hours · Delivered in 3–5 business days</li>
        <li><strong>Made-to-order</strong>: 7–14 business days production + 3–5 days delivery</li>
        <li><strong>Custom designs</strong>: 14–21 business days based on complexity</li>
      </ul>

      <h2>4. Insurance & Tracking</h2>
      <p>
        Every shipment is fully insured at the declared invoice value. You&apos;ll receive
        a tracking link via SMS, WhatsApp, and email once the package is dispatched.
      </p>

      <h2>5. Delivery Verification</h2>
      <p>
        For high-value orders, our courier partners may require government-issued ID
        verification at delivery. Please keep one ready (Aadhaar, PAN, or driving license).
      </p>

      <h2>6. Failed Delivery</h2>
      <p>
        If a package can&apos;t be delivered after 3 attempts, it returns to our hub. We&apos;ll
        contact you to confirm a re-delivery address — additional shipping charges may
        apply.
      </p>

      <h2>7. Damaged or Missing Items</h2>
      <p>
        Please record an unboxing video at the time of delivery. If your shipment arrives
        damaged or tampered with, email us within 24 hours at{" "}
        <a href="mailto:support@lsjcollections.com">support@lsjcollections.com</a>.
      </p>
    </PolicyLayout>
  );
}

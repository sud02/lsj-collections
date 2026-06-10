import type { Metadata } from "next";
import PolicyLayout from "@/components/policy/PolicyLayout";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Read the terms and conditions for shopping at LSJ Collections.",
};

export default function TermsPage() {
  return (
    <PolicyLayout
      title="Terms & Conditions"
      subtitle="Please read these terms carefully before using lsjcollections.com"
      lastUpdated="January 2026"
    >
      <p>
        Welcome to <strong>LSJ Collections</strong>. By accessing or using our website,
        you agree to be bound by these Terms &amp; Conditions and our Privacy Policy.
      </p>

      <h2>1. Use of the Website</h2>
      <p>
        You agree to use lsjcollections.com only for lawful purposes. You must not use
        the website in any way that may damage, disable, overburden, or impair our servers
        or networks.
      </p>

      <h2>2. Product Information</h2>
      <p>
        We strive to display product images, weights, and prices as accurately as possible.
        Slight variations may occur due to handcrafting, lighting, or screen calibration.
        All gold is BIS hallmark certified — purity and weight stamped on every piece.
      </p>

      <h2>3. Pricing & Payment</h2>
      <p>
        Prices are quoted in Indian Rupees (₹) and inclusive of GST. We reserve the right
        to modify prices at any time before order acceptance. Payment is processed
        securely through PhonePe.
      </p>

      <h2>4. Order Acceptance</h2>
      <p>
        Receipt of an order confirmation does not constitute acceptance of the order.
        We reserve the right to cancel any order due to stock unavailability, pricing
        errors, or suspicion of fraudulent activity.
      </p>

      <h2>5. Custom Orders</h2>
      <p>
        Customised, engraved, or made-to-order pieces cannot be cancelled, returned, or
        refunded once production has begun.
      </p>

      <h2>6. Intellectual Property</h2>
      <p>
        All content on this website — including images, text, logos, and design — is the
        property of LSJ Collections and protected by intellectual property laws.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        LSJ Collections shall not be liable for any indirect, incidental, or consequential
        damages arising from the use of our products or website.
      </p>

      <h2>8. Governing Law</h2>
      <p>
        These terms are governed by the laws of India. Any disputes shall be subject to
        the exclusive jurisdiction of courts in Tirupati, Andhra Pradesh.
      </p>

      <h2>9. Contact Us</h2>
      <p>
        Questions about these terms? Email{" "}
        <a href="mailto:support@lsjcollections.com">support@lsjcollections.com</a>.
      </p>
    </PolicyLayout>
  );
}

import type { Metadata } from "next";
import PolicyLayout from "@/components/policy/PolicyLayout";

export const metadata: Metadata = {
  title: "Return & Refund Policy",
  description: "Easy 15-day returns and quick refunds at LSJ Collections.",
};

export default function ReturnRefundPolicyPage() {
  return (
    <PolicyLayout
      title="Return & Refund Policy"
      subtitle="A hassle-free 15-day return window — because trust matters"
      lastUpdated="January 2026"
    >
      <h2>1. Return Window</h2>
      <p>
        We offer <strong>15 days</strong> from the date of delivery to return eligible products.
        Items must be unused, in their original condition, with the BIS hallmark tag and
        invoice intact.
      </p>

      <h2>2. Eligible Returns</h2>
      <ul>
        <li>Wrong product received</li>
        <li>Manufacturing defect or hallmark mismatch</li>
        <li>Sizing issues for rings and bangles (one-time free resize available)</li>
      </ul>

      <h2>3. Non-Returnable Items</h2>
      <ul>
        <li>Customised, engraved, or made-to-order pieces</li>
        <li>Pierced jewellery (earrings, nose pins) for hygiene reasons</li>
        <li>Items without original hallmark tag, invoice, or packaging</li>
        <li>Items showing signs of wear, damage, or alteration</li>
      </ul>

      <h2>4. How to Initiate a Return</h2>
      <ol>
        <li>Email <a href="mailto:support@lsjcollections.com">support@lsjcollections.com</a> with your order ID and reason</li>
        <li>Our team confirms eligibility within 24 hours</li>
        <li>We arrange a free reverse pickup for your address</li>
        <li>Item is inspected on receipt at our Tirupati facility</li>
      </ol>

      <h2>5. Refunds</h2>
      <p>
        Approved refunds are processed within <strong>5–7 business days</strong> back to
        your original payment method. UPI / wallet refunds are typically faster than card
        / netbanking refunds.
      </p>

      <h2>6. Exchanges</h2>
      <p>
        We offer free product exchanges within the 15-day window. Differences in price
        will be charged or refunded accordingly.
      </p>

      <h2>7. Gold Buyback</h2>
      <p>
        Gold purchased from us is eligible for buyback at the day&apos;s prevailing rate,
        anytime — no time limit. Bring the original invoice and hallmark tag.
      </p>
    </PolicyLayout>
  );
}

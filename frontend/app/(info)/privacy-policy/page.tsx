import type { Metadata } from "next";
import PolicyLayout from "@/components/policy/PolicyLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How LSJ Collections handles your personal data.",
};

export default function PrivacyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      subtitle="Your trust is the foundation of our craft. Here's how we protect your data."
      lastUpdated="January 2026"
    >
      <p>
        LSJ Collections (&ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your privacy and
        is committed to protecting your personal data. This policy explains what we
        collect, why, and how we use it.
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Account info:</strong> Name, mobile number, email, and address.</li>
        <li><strong>Order info:</strong> Items purchased, billing/shipping addresses, payment method.</li>
        <li><strong>Usage data:</strong> Device, browser, and pages visited (cookies/analytics).</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To process orders, payments, deliveries, and returns</li>
        <li>To send order confirmations and shipping updates</li>
        <li>To respond to your queries and support requests</li>
        <li>To improve our website, products, and services</li>
        <li>To send marketing emails (only with your consent — you can unsubscribe anytime)</li>
      </ul>

      <h2>3. Data Sharing</h2>
      <p>
        We do not sell or rent your data. We share information only with:
      </p>
      <ul>
        <li>Payment partners (PhonePe) to process transactions</li>
        <li>Logistics partners to fulfil deliveries</li>
        <li>Law enforcement when required by law</li>
      </ul>

      <h2>4. Data Security</h2>
      <p>
        All data is transmitted via HTTPS/SSL encryption. Payment details are tokenised by
        PhonePe — we never store full card or UPI credentials.
      </p>

      <h2>5. Cookies</h2>
      <p>
        We use essential cookies for cart, login, and analytics. You can disable cookies
        in your browser, but some features may not work.
      </p>

      <h2>6. Your Rights</h2>
      <p>
        You can request access to, correction of, or deletion of your data at any time
        by emailing <a href="mailto:support@lsjcollections.com">support@lsjcollections.com</a>.
      </p>

      <h2>7. Updates</h2>
      <p>
        We may update this policy occasionally. The &ldquo;Last updated&rdquo; date at the
        top reflects the most recent revision.
      </p>
    </PolicyLayout>
  );
}

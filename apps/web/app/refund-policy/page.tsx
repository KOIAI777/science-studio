import type {Metadata} from "next";
import Link from "next/link";
import {LegalPageShell} from "../../components/legal-page-shell";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund eligibility and request process for Science Studio one-time digital experiment-pack purchases.",
  alternates: {canonical: "/refund-policy"},
};

const sections = [
  {id: "scope", label: "What this policy covers"},
  {id: "digital", label: "Digital delivery"},
  {id: "exceptions", label: "When we review refunds"},
  {id: "request", label: "How to request help"},
  {id: "approved", label: "Approved refunds"},
  {id: "chargebacks", label: "Payment disputes"},
  {id: "contact", label: "Contact"},
];

export default function RefundPolicyPage() {
  return (
    <LegalPageShell eyebrow="Billing" title="Refund Policy" description="Science Studio sells immediate-access digital experiment packs through one-time payments. This policy explains when a payment may be refunded and how to contact us." sections={sections}>
      <section id="scope">
        <h2>What this policy covers</h2>
        <p>This policy applies to purchases made for Science Studio digital experiment packs at <strong>classroomlab.online</strong>. The current Middle School Physics Foundations pack costs <strong>US$9.90 as a one-time payment</strong>. It is not a subscription and does not renew.</p>
        <p>Payments are processed by <strong>Waffo Pancake</strong>. Science Studio determines refund eligibility under this policy, subject to mandatory rights under applicable law.</p>
      </section>

      <section id="digital">
        <h2>Immediate digital delivery</h2>
        <p>Paid access is normally granted as soon as a signed successful-payment event is verified. Because the digital content is delivered immediately, <strong>completed purchases are generally non-refundable once access has been provided</strong>, to the extent permitted by applicable law.</p>
        <p className="legal-callout">Nothing in this policy removes a refund, cancellation, or other remedy that applicable consumer law requires us to provide.</p>
      </section>

      <section id="exceptions">
        <h2>When we review refund requests</h2>
        <p>We will review a refund request when:</p>
        <ul>
          <li>the same purchase was charged more than once;</li>
          <li>the amount charged differs from the amount shown at checkout;</li>
          <li>payment completed but a verified technical problem prevents the purchaser from accessing the paid pack and we cannot restore access within a reasonable time;</li>
          <li>the payment was unauthorized and the claim can be reasonably verified; or</li>
          <li>applicable law requires a refund or cancellation right.</li>
        </ul>
        <p>A change of mind, failure to use the pack, curriculum preference, or deletion of the connected account does not normally qualify for a refund after digital access has been delivered.</p>
      </section>

      <section id="request">
        <h2>How to request billing help</h2>
        <p>Email <a href="mailto:billing@classroomlab.online">billing@classroomlab.online</a> from the address used for your Science Studio account. Include:</p>
        <ul>
          <li>the account email;</li>
          <li>the order reference shown on your payment-status or account page;</li>
          <li>the date and amount of the charge; and</li>
          <li>a brief description of the issue, including screenshots if access failed.</li>
        </ul>
        <p>Do not email full card numbers, security codes, passwords, or one-time sign-in links. We may ask for additional non-sensitive information needed to verify the order and request.</p>
      </section>

      <section id="approved">
        <h2>Approved refunds</h2>
        <p>If a refund is approved, we submit it through Waffo Pancake to the original payment method where possible. Paid access connected to the refunded order will be revoked; free experiments remain available.</p>
        <p>The time for funds to appear depends on Waffo Pancake, the card network, and your bank. Science Studio cannot guarantee a specific bank-processing time.</p>
      </section>

      <section id="chargebacks">
        <h2>Payment disputes</h2>
        <p>Please contact us before opening a chargeback so we can investigate duplicate, incorrect, or inaccessible purchases. This does not limit your right to dispute a charge with your payment provider. A chargeback or payment reversal may suspend the access granted by that order while the dispute is reviewed.</p>
        <p>For information about account and transaction records, see our <Link href="/privacy">Privacy Policy</Link>. Other service rules appear in our <Link href="/terms">Terms of Service</Link>.</p>
      </section>

      <section id="contact">
        <h2>Contact</h2>
        <p>Billing and refund requests: <a href="mailto:billing@classroomlab.online">billing@classroomlab.online</a></p>
        <address>Jia Zhenghao<br />Gechuang Digital Valley, Xiangzhou District<br />Zhuhai, Guangdong 519000, China</address>
      </section>
    </LegalPageShell>
  );
}

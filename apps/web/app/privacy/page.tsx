import type {Metadata} from "next";
import Link from "next/link";
import {LegalPageShell} from "../../components/legal-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Science Studio collects, uses, shares, stores, and deletes account and payment-related information.",
  alternates: {canonical: "/privacy"},
};

const sections = [
  {id: "scope", label: "Scope and controller"},
  {id: "collection", label: "Information collected"},
  {id: "use", label: "How information is used"},
  {id: "cookies", label: "Cookies"},
  {id: "sharing", label: "Service providers"},
  {id: "payments", label: "Payment data"},
  {id: "transfers", label: "International processing"},
  {id: "retention", label: "Retention and deletion"},
  {id: "rights", label: "Your privacy rights"},
  {id: "children", label: "Children"},
  {id: "security", label: "Security"},
  {id: "changes", label: "Changes and contact"},
];

export default function PrivacyPage() {
  return (
    <LegalPageShell eyebrow="Privacy" title="Privacy Policy" description="This policy describes the limited information Science Studio needs to authenticate teachers, deliver paid access, operate the website, and answer support requests." sections={sections}>
      <section id="scope">
        <h2>Scope and controller</h2>
        <p>This Privacy Policy applies to Science Studio at <strong>classroomlab.online</strong>. The data controller is <strong>Jia Zhenghao</strong>, an individual operator based in Zhuhai, Guangdong, China. Privacy requests can be sent to <a href="mailto:privacy@classroomlab.online">privacy@classroomlab.online</a>. A data protection officer has not been appointed because our current processing does not require one.</p>
        <p>This policy covers visitors, teacher account holders, and purchasers. Science Studio is designed as a teacher-led classroom tool and does not require student accounts.</p>
      </section>

      <section id="collection">
        <h2>Information we collect</h2>
        <h3>Account information</h3>
        <p>When you request a one-time sign-in link, we collect your email address and authentication identifiers needed to create and maintain your account. We do not store a Science Studio password.</p>
        <h3>Order and access information</h3>
        <p>When you start or complete checkout, we store order identifiers, product and price information, payment status, transaction references, account entitlement, and the timestamps needed to deliver and verify access.</p>
        <h3>Communications</h3>
        <p>If you email us, we receive your email address and the information contained in your message and attachments.</p>
        <h3>Technical and security data</h3>
        <p>Our hosting, authentication, and payment providers may process limited technical information such as IP address, browser and device details, request time, referral page, error records, and security events. We use this information to deliver the service, diagnose failures, and prevent abuse.</p>
      </section>

      <section id="use">
        <h2>How we use information</h2>
        <p>We use personal information only as needed to:</p>
        <ul>
          <li>send secure sign-in links and maintain authenticated sessions;</li>
          <li>create orders, confirm payment, grant or revoke paid access, and prevent duplicate fulfillment;</li>
          <li>answer support, privacy, billing, and dispute requests;</li>
          <li>maintain reliability, investigate errors or abuse, and protect the service; and</li>
          <li>meet accounting, tax, payment, fraud-prevention, and legal obligations.</li>
        </ul>
        <p>Depending on your location, these uses rely on performance of our contract with you, our legitimate interests in operating and securing the service, compliance with law, or your consent where law requires it.</p>
      </section>

      <section id="cookies">
        <h2>Cookies and similar technologies</h2>
        <p>Science Studio uses strictly necessary cookies and browser storage to maintain secure sign-in sessions, protect account routes, remember the state needed to complete authentication, and return you to the correct page after checkout. These technologies are required for the account and payment features to work.</p>
        <p>We do not currently use advertising cookies, marketing pixels, or a separate analytics service. You can block necessary cookies in your browser, but sign-in and paid access will not work correctly. If we add optional analytics or marketing technologies later, we will update this policy and provide any choices required by law before using them.</p>
      </section>

      <section id="sharing">
        <h2>Service providers and disclosure</h2>
        <p>We disclose information only where needed to operate Science Studio or comply with law. Current service categories include:</p>
        <ul>
          <li><strong>Supabase</strong> for account authentication, database storage, and related service infrastructure;</li>
          <li><strong>Vercel</strong> for website hosting, delivery, and operational request logs;</li>
          <li><strong>Waffo Pancake</strong> for checkout, payment processing, transaction status, refunds, and payment-fraud controls;</li>
          <li>the email delivery provider configured for Supabase authentication; and</li>
          <li><strong>Cloudflare Email Routing</strong> for forwarding messages sent to our public support addresses.</li>
        </ul>
        <p>Providers process information under their own terms and privacy notices. We may also disclose information when reasonably required by law, court order, payment dispute, fraud investigation, or to protect users and the service. <strong>We do not sell personal information.</strong></p>
      </section>

      <section id="payments">
        <h2>Payment data</h2>
        <p>Waffo Pancake collects and processes the payment details you enter at checkout. Science Studio does not receive or store your full card number, card verification code, or equivalent complete payment credential.</p>
        <p>We receive limited payment results and references, such as whether an order was completed, refunded, canceled, or failed. We use signed payment notifications to connect paid access to your Science Studio account.</p>
      </section>

      <section id="transfers">
        <h2>International processing</h2>
        <p>Science Studio serves users internationally. The website and primary service data are hosted and processed mainly in the United States through our providers. The operator is based in China and may access account, order, or support information from China when necessary to operate the service and respond to users.</p>
        <p>Your information may therefore be processed in countries whose privacy laws differ from those where you live. Where applicable law requires a transfer mechanism or additional safeguards, we will use the mechanism made available by our providers or otherwise required by law.</p>
      </section>

      <section id="retention">
        <h2>Retention and deletion</h2>
        <p>We keep active account and entitlement information while your account remains open and for as long as reasonably needed to provide the service. Support messages are kept only as long as needed to resolve the request and maintain necessary business records.</p>
        <p>If you request account deletion, we will delete or de-identify the active account, profile, and service data under our control within a reasonable period. We may retain limited order, transaction, tax, accounting, fraud-prevention, security, or dispute records when required or permitted by law. Backups and provider logs may expire on their normal protected retention cycles.</p>
      </section>

      <section id="rights">
        <h2>Your privacy rights</h2>
        <p>Depending on where you live, you may have rights to request access, correction, deletion, restriction, objection, portability, or withdrawal of consent. You may also have the right to complain to a local privacy authority.</p>
        <p>Send requests to <a href="mailto:privacy@classroomlab.online">privacy@classroomlab.online</a> from the email connected to your account. We may ask for reasonable verification before disclosing or deleting information. Account deletion ends access attached to that account and does not itself create a refund right; see our <Link href="/refund-policy">Refund Policy</Link>.</p>
      </section>

      <section id="children">
        <h2>Children</h2>
        <p>Science Studio is intended for teachers and users aged 13 or older. We do not knowingly collect personal information directly from children under 13 and students do not need accounts to view a teacher-led classroom presentation.</p>
        <p>If you believe a child under 13 has created an account or sent us personal information, contact <a href="mailto:privacy@classroomlab.online">privacy@classroomlab.online</a> so we can investigate and delete it where appropriate.</p>
      </section>

      <section id="security">
        <h2>Security</h2>
        <p>We use reasonable technical and organizational measures appropriate to a small online service, including email-based authentication, server-side access checks, and signed payment-event verification. No internet service can guarantee absolute security.</p>
        <p>If you believe your account or information has been compromised, contact <a href="mailto:support@classroomlab.online">support@classroomlab.online</a>.</p>
      </section>

      <section id="changes">
        <h2>Changes and contact</h2>
        <p>We may update this policy when our service, providers, or legal obligations change. We will post the revised policy here and update the date at the top.</p>
        <address>Privacy contact: <a href="mailto:privacy@classroomlab.online">privacy@classroomlab.online</a><br />Jia Zhenghao<br />Gechuang Digital Valley, Xiangzhou District<br />Zhuhai, Guangdong 519000, China</address>
      </section>
    </LegalPageShell>
  );
}

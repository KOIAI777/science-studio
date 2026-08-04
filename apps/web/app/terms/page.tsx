import type {Metadata} from "next";
import Link from "next/link";
import {LegalPageShell} from "../../components/legal-page-shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing teacher access to Science Studio interactive physics experiments and the Middle School Physics Foundations pack.",
  alternates: {canonical: "/terms"},
};

const sections = [
  {id: "operator", label: "Operator and acceptance"},
  {id: "service", label: "The service"},
  {id: "accounts", label: "Accounts"},
  {id: "purchases", label: "Purchases and payment"},
  {id: "use", label: "Acceptable use"},
  {id: "education", label: "Educational limitations"},
  {id: "ownership", label: "Ownership and license"},
  {id: "termination", label: "Suspension and deletion"},
  {id: "liability", label: "Disclaimers and liability"},
  {id: "law", label: "Governing law"},
  {id: "changes", label: "Changes and contact"},
];

export default function TermsPage() {
  return (
    <LegalPageShell eyebrow="Legal" title="Terms of Service" description="These terms explain the rules for using Science Studio, including free experiments, teacher accounts, and one-time experiment-pack purchases." sections={sections}>
      <section id="operator">
        <h2>Operator and acceptance</h2>
        <p>Science Studio is a ClassroomLab product available at <strong>classroomlab.online</strong>. It is operated by <strong>Jia Zhenghao</strong>, an individual operator based in Zhuhai, Guangdong, China. In these Terms, “Science Studio,” “ClassroomLab,” “we,” “us,” and “our” refer to this operator.</p>
        <p>By accessing the service, creating an account, or completing a purchase, you agree to these Terms and our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the service. You must be at least 13 years old and legally able to enter into these Terms.</p>
      </section>

      <section id="service">
        <h2>The service</h2>
        <p>Science Studio provides interactive physics demonstrations designed for teacher-led classroom explanation. Four experiments are available without payment. A teacher account is required to purchase and access paid experiment packs.</p>
        <p>Current paid access is the <strong>Middle School Physics Foundations</strong> pack. It includes ten released experiments and future middle-school experiments that we add to this pack after classroom and scientific review. High-school products, if released, will be separate unless a purchase page expressly says otherwise.</p>
        <p>We may improve, replace, or discontinue particular features or experiments. We will not intentionally remove the core paid pack as a way to avoid providing purchased access, but online service availability and future additions are not guaranteed forever.</p>
      </section>

      <section id="accounts">
        <h2>Accounts and sign-in</h2>
        <p>Science Studio uses one-time email sign-in links instead of passwords. You are responsible for controlling the email account connected to Science Studio and for activity performed through your authenticated session. Do not share a sign-in link or use another person’s email without permission.</p>
        <p>Purchases are linked to the verified email account used at checkout. Contact <a href="mailto:support@classroomlab.online">support@classroomlab.online</a> if you lose access to that email or believe your account has been used without authorization.</p>
      </section>

      <section id="purchases">
        <h2>Purchases and payment</h2>
        <p>The Middle School Physics Foundations pack is currently offered for a <strong>one-time payment of US$9.90</strong>. It is not a subscription, does not renew automatically, and does not include usage credits. The exact product, price, currency, and included access are shown before checkout.</p>
        <p>Payments are processed by <strong>Waffo Pancake</strong>. We do not receive or store your full card number. Waffo Pancake may apply its own checkout and payment-processing terms. Access is granted only after Science Studio verifies a signed successful-payment notification.</p>
        <p>Paid digital access is normally delivered immediately after payment confirmation. Refund eligibility is governed by our <Link href="/refund-policy">Refund Policy</Link>. For duplicate or incorrect charges, payment questions, or an inaccessible purchase, contact <a href="mailto:billing@classroomlab.online">billing@classroomlab.online</a>.</p>
      </section>

      <section id="use">
        <h2>Acceptable use</h2>
        <p>You may use Science Studio for your own teaching, lesson preparation, classroom presentation, and reasonable school-related demonstration. You must not:</p>
        <ul>
          <li>resell, sublicense, or provide paid-pack access as a competing hosted service;</li>
          <li>circumvent access controls, payment checks, or technical restrictions;</li>
          <li>probe, disrupt, overload, or introduce malicious code into the service;</li>
          <li>use automated extraction to reproduce a substantial part of the experiment library; or</li>
          <li>use the service in a way that violates law or the rights of another person.</li>
        </ul>
      </section>

      <section id="education">
        <h2>Educational limitations</h2>
        <p>Science Studio uses deterministic educational models, stated assumptions, and SI units to make physics concepts visible. It supports explanation and demonstration; it does not replace physical laboratory work, professional engineering analysis, safety testing, certification, or expert advice.</p>
        <p>Models simplify real-world systems. Teachers remain responsible for checking that an experiment, parameter range, and explanation fit their curriculum, learners, equipment, and local requirements.</p>
      </section>

      <section id="ownership">
        <h2>Ownership and license</h2>
        <p>Science Studio, its interface, experiment implementations, text, graphics, and original teaching sequences are owned by the operator or used under license. These Terms grant you a limited, non-exclusive, non-transferable right to use the service for the permitted teaching purposes above. They do not transfer ownership of the software or content.</p>
        <p>You retain ownership of feedback you provide, but you allow us to use it without obligation to improve the service. Do not send confidential material as feedback.</p>
      </section>

      <section id="termination">
        <h2>Suspension and account deletion</h2>
        <p>We may restrict or suspend access when reasonably necessary to address fraud, payment reversal, security risk, legal obligations, or a material breach of these Terms. A verified refund or payment reversal may remove the access granted by that order.</p>
        <p>You may request account deletion at any time by emailing <a href="mailto:privacy@classroomlab.online">privacy@classroomlab.online</a> from your account email. Deletion removes your active account, profile, and service data, subject to records we must retain for tax, accounting, fraud prevention, disputes, or other legal obligations. Deleting an account ends access linked to that account and does not by itself create a refund right.</p>
      </section>

      <section id="liability">
        <h2>Disclaimers and liability</h2>
        <p>To the extent permitted by applicable law, the service is provided “as available” without warranties that it will always be uninterrupted, error-free, or suitable for every curriculum or device. Nothing in these Terms excludes a warranty or remedy that cannot lawfully be excluded.</p>
        <p>To the extent permitted by law, Science Studio is not liable for indirect, incidental, special, or consequential loss arising from use of the service. Our total liability relating to a paid pack will not exceed the amount you paid for that pack during the twelve months before the event giving rise to the claim. This limitation does not apply where prohibited by law or to liability that cannot legally be limited.</p>
      </section>

      <section id="law">
        <h2>Governing law and disputes</h2>
        <p>These Terms are governed by the laws of the People’s Republic of China, without limiting any mandatory consumer rights that apply in the country or state where you live. Please contact <a href="mailto:support@classroomlab.online">support@classroomlab.online</a> first so we can try to resolve a dispute directly.</p>
        <p>If a dispute cannot be resolved, it may be brought before a court with lawful jurisdiction at the operator’s location, unless mandatory law gives you the right to bring it elsewhere.</p>
      </section>

      <section id="changes">
        <h2>Changes and contact</h2>
        <p>We may update these Terms to reflect changes to the service, payment process, or law. The updated version will be posted here with a new “Last updated” date. Material changes will apply prospectively, except where a faster change is required for security or law.</p>
        <address>Jia Zhenghao<br />Gechuang Digital Valley, Xiangzhou District<br />Zhuhai, Guangdong 519000, China<br /><a href="mailto:support@classroomlab.online">support@classroomlab.online</a></address>
      </section>
    </LegalPageShell>
  );
}

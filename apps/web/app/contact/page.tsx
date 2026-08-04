import type {Metadata} from "next";
import {LegalPageShell} from "../../components/legal-page-shell";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Science Studio for product support, billing questions, privacy requests, or account deletion.",
  alternates: {canonical: "/contact"},
};

const sections = [
  {id: "channels", label: "Contact channels"},
  {id: "include", label: "What to include"},
  {id: "operator", label: "Operator information"},
];

export default function ContactPage() {
  return (
    <LegalPageShell eyebrow="Support" title="Contact Science Studio" description="Choose the address that matches your request. These mailboxes are monitored and route to the Science Studio operator." sections={sections}>
      <section id="channels">
        <h2>Contact channels</h2>
        <h3>Product and account support</h3>
        <p>For sign-in problems, experiment access, technical errors, and general questions: <a href="mailto:support@classroomlab.online">support@classroomlab.online</a></p>
        <h3>Billing and refunds</h3>
        <p>For duplicate or incorrect charges, payment status, inaccessible paid content, and refund requests: <a href="mailto:billing@classroomlab.online">billing@classroomlab.online</a></p>
        <h3>Privacy and account deletion</h3>
        <p>For access, correction, deletion, or other privacy requests: <a href="mailto:privacy@classroomlab.online">privacy@classroomlab.online</a></p>
      </section>

      <section id="include">
        <h2>What to include</h2>
        <p>Write from the email connected to your Science Studio account whenever possible. For access or billing issues, include the experiment name, order reference if available, and a short description of what happened.</p>
        <p>Do not send a full card number, card security code, password, private key, or one-time sign-in link by email. We will ask only for the limited information needed to verify and resolve your request.</p>
      </section>

      <section id="operator">
        <h2>Operator information</h2>
        <p>Science Studio is the interactive physics product of ClassroomLab and is operated by <strong>Jia Zhenghao</strong> as an individual operator.</p>
        <address>Gechuang Digital Valley<br />Xiangzhou District<br />Zhuhai, Guangdong 519000<br />China</address>
        <p>Website: <a href="https://www.classroomlab.online">www.classroomlab.online</a></p>
      </section>
    </LegalPageShell>
  );
}

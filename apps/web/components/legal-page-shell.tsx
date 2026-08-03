import {ArrowLeft, FlaskConical, Mail} from "lucide-react";
import Link from "next/link";
import type {ReactNode} from "react";

interface LegalSectionLink {
  id: string;
  label: string;
}

interface LegalPageShellProps {
  children: ReactNode;
  description: string;
  eyebrow: string;
  sections: LegalSectionLink[];
  title: string;
  updated?: string;
}

export function LegalPageShell({children, description, eyebrow, sections, title, updated = "August 3, 2026"}: LegalPageShellProps) {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="legal-header-inner">
          <Link className="legal-brand" href="/" aria-label="Science Studio home">
            <span><FlaskConical size={17} /></span>
            <strong>Science Studio</strong>
          </Link>
          <nav aria-label="Legal and support navigation">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refund-policy">Refunds</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </header>

      <main className="legal-main">
        <Link className="legal-back-link" href="/"><ArrowLeft size={14} />Back to Science Studio</Link>
        <header className="legal-title-block">
          <span className="legal-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>

        <dl className="legal-facts">
          <div><dt>Last updated</dt><dd>{updated}</dd></div>
          <div><dt>Operator</dt><dd>Jia Zhenghao, individual</dd></div>
          <div><dt>Service</dt><dd>classroomlab.online</dd></div>
        </dl>

        <div className="legal-document-layout">
          <aside className="legal-index">
            <strong>On this page</strong>
            <nav aria-label={`${title} sections`}>
              {sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.label}</a>)}
            </nav>
          </aside>
          <article className="legal-document">{children}</article>
        </div>

        <section className="legal-help">
          <div>
            <span><Mail size={18} /></span>
            <div><strong>Need help with this document?</strong><p>Contact the monitored Science Studio support address.</p></div>
          </div>
          <a href="mailto:support@classroomlab.online">support@classroomlab.online</a>
        </section>
      </main>

      <footer className="legal-footer">
        <span>© 2026 Science Studio</span>
        <nav aria-label="Footer navigation"><Link href="/experiments">Experiments</Link><Link href="/account">Account</Link><Link href="/contact">Contact</Link></nav>
      </footer>
    </div>
  );
}

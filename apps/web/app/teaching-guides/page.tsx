import type {Metadata} from "next";
import {ArrowRight, BookOpenCheck, CircuitBoard, Clock3, FlaskConical, UserRound} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {PrimarySiteNavigation} from "../../components/primary-site-navigation";

export const metadata: Metadata = {
  title: "Physics Teaching Guides",
  description: "Practical, teacher-led physics lesson guides with a concise classroom procedure, expected observations, equations, misconceptions, and interactive demos.",
  alternates: {canonical: "/teaching-guides"},
  openGraph: {
    title: "Physics Teaching Guides | Science Studio",
    description: "Practical, teacher-led physics lesson guides linked to interactive classroom demos.",
    url: "/teaching-guides",
    images: [{url: "/experiments/dc-circuits-diagram.png", width: 1280, height: 720, alt: "Series and parallel circuit teaching guide"}],
  },
};

export default function TeachingGuidesPage() {
  return (
    <div className="guide-page">
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" href="/" aria-label="Science Studio home"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link>
          <PrimarySiteNavigation active="guides" />
          <div className="site-actions"><Link className="header-account-link" href="/account"><UserRound size={15} /><span>Account</span></Link></div>
        </div>
      </header>
      <main className="guide-index-main">
        <div className="guide-breadcrumb"><Link href="/">Home</Link><span>/</span><span>Teaching guides</span></div>
        <section className="guide-index-heading">
          <span className="section-kicker"><BookOpenCheck size={15} />Teacher-led physics lessons</span>
          <h1>Teaching guides for the first fifteen minutes of class.</h1>
          <p>Each guide starts with the question students need to answer, then gives a short sequence for using one interactive demo on a classroom screen.</p>
        </section>
        <section className="guide-index-list" aria-label="Published teaching guides">
          <Link className="guide-index-card" href="/teaching-guides/series-and-parallel-circuits">
            <Image src="/experiments/dc-circuits-diagram.png" alt="Series and parallel circuit simulation with measurement displays" width={1280} height={720} />
            <div>
              <span><CircuitBoard size={14} />Electricity · Middle school</span>
              <h2>How to teach series and parallel circuits with one interactive demo</h2>
              <p>Start with a prediction, change one resistance, and use the measurements to distinguish what stays the same from what splits.</p>
              <small><Clock3 size={14} />15-minute classroom sequence <ArrowRight size={14} /></small>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}

import type {Metadata} from "next";
import {ArrowRight, BookOpenCheck, CircuitBoard, Clock3, Droplets, FlaskConical, Presentation, UserRound, Zap} from "lucide-react";
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

const guides = [
  {
    href: "/teaching-guides/physics-simulations-classroom-projector",
    image: "/experiments/inclined-plane-diagram.png",
    alt: "Projected inclined-plane physics diagram with force vectors and measurements",
    icon: Presentation,
    eyebrow: "Teacher workflow · Any physics topic",
    title: "How to use interactive physics simulations on a classroom projector",
    summary: "Prepare a readable starting state, ask for a prediction, change one parameter, and pause where the visual evidence explains the result.",
    duration: "15-minute projection workflow",
  },
  {
    href: "/teaching-guides/series-and-parallel-circuits",
    image: "/experiments/dc-circuits-diagram.png",
    alt: "Series and parallel circuit simulation with measurement displays",
    icon: CircuitBoard,
    eyebrow: "Electricity · Middle school",
    title: "How to teach series and parallel circuits with one interactive demo",
    summary: "Start with a prediction, change one resistance, and use the measurements to distinguish what stays the same from what splits.",
    duration: "15-minute classroom sequence",
  },
  {
    href: "/teaching-guides/ohms-law-interactive-circuit",
    image: "/experiments/ohms-law-diagram.png",
    alt: "Ohm's law circuit with voltage, resistance, current, and equation",
    icon: Zap,
    eyebrow: "Electricity · Middle school",
    title: "How to teach Ohm's law with an interactive circuit",
    summary: "Use two controlled comparisons to show how current responds when voltage or resistance changes.",
    duration: "10-minute classroom sequence",
  },
  {
    href: "/teaching-guides/density-and-buoyancy",
    image: "/experiments/density-buoyancy-classroom-diagram.png",
    alt: "Density and buoyancy simulation comparing the same object in two fluids",
    icon: Droplets,
    eyebrow: "Fluids · Middle school",
    title: "How to teach density and buoyancy with an interactive simulation",
    summary: "Compare the same object in two fluids, then connect density predictions to buoyant force and the final equilibrium.",
    duration: "15-minute classroom sequence",
  },
] as const;

export default function TeachingGuidesPage() {
  return (
    <div className="guide-page">
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" href="/" aria-label="Science Studio by ClassroomLab home"><span className="brand-mark"><FlaskConical size={17} /></span><span className="brand-copy"><strong>Science Studio</strong><small>by ClassroomLab</small></span></Link>
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
          {guides.map(({href, image, alt, icon: Icon, eyebrow, title, summary, duration}) => (
            <Link className="guide-index-card" href={href} key={href}>
              <span className="guide-index-card-media"><Image src={image} alt={alt} width={1280} height={720} /></span>
              <div>
                <span><Icon size={14} />{eyebrow}</span>
                <h2>{title}</h2>
                <p>{summary}</p>
                <small><Clock3 size={14} />{duration} <ArrowRight size={14} /></small>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}

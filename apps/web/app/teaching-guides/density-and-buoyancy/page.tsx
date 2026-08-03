import type {Metadata} from "next";
import {ArrowLeft, ArrowRight, BookOpenCheck, Calculator, Check, CircleHelp, Droplets, FlaskConical, Lightbulb, MonitorPlay, Timer, UserRound} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {PrimarySiteNavigation} from "../../../components/primary-site-navigation";

const title = "How to Teach Density and Buoyancy with an Interactive Simulation";
const description = "A 15-minute middle-school lesson for explaining floating, sinking, and suspension using density, displaced volume, force diagrams, and Archimedes' principle.";
const path = "/teaching-guides/density-and-buoyancy";
const previewImage = "/experiments/density-buoyancy-classroom-diagram.png";

export const metadata: Metadata = {
  title,
  description,
  alternates: {canonical: path},
  openGraph: {type: "article", title: `${title} | Science Studio`, description, url: path, images: [{url: previewImage, width: 1200, height: 676, alt: "Interactive density and buoyancy comparison in two fluids"}]},
  twitter: {card: "summary_large_image", title, description, images: [previewImage]},
};

const lessonSteps = [
  ["0-3 min", "Predict from density", "Show the object density and the two fluid densities before release. Students predict rise, sink, or suspension in each fluid and explain the comparison they used."],
  ["3-6 min", "Release the same object", "Run both containers from the same starting depth. Because the object is identical, any difference in motion must come from the fluid and the forces it produces."],
  ["6-9 min", "Pause on the force diagram", "Compare weight with buoyant force while the object is fully submerged. Identify the direction of the net force before discussing the final position."],
  ["9-12 min", "Follow the floating object", "As the object rises out of the fluid, displaced volume decreases. Pause when buoyant force equals weight and connect that balance to the submerged fraction."],
  ["12-15 min", "Test a boundary case", "Set object density equal to fluid density. With zero initial velocity, the ideal model suspends the object because buoyant force and weight balance at full submersion."],
] as const;

const misconceptions = [
  ["Large objects always sink", "Size alone does not decide the outcome. Average object density compared with fluid density predicts whether a fully submerged object initially rises or sinks."],
  ["A floating object has no weight", "Weight still acts downward. At rest, the upward buoyant force has the same magnitude, so the net vertical force is zero."],
  ["Buoyant force is always constant", "For an incompressible fluid it depends on displaced volume. It stays constant while a rigid object is fully submerged, then decreases as a floating object emerges."],
] as const;

export default function DensityAndBuoyancyGuidePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:5173";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["Article", "LearningResource"],
    headline: title,
    description,
    url: new URL(path, siteUrl).toString(),
    image: new URL(previewImage, siteUrl).toString(),
    datePublished: "2026-08-03",
    dateModified: "2026-08-03",
    inLanguage: "en",
    educationalLevel: "Middle school",
    learningResourceType: "Lesson plan",
    timeRequired: "PT15M",
    teaches: ["Density", "Buoyant force", "Archimedes' principle", "Floating equilibrium", "Displaced volume"],
    audience: {"@type": "EducationalAudience", educationalRole: "teacher"},
    isAccessibleForFree: true,
    author: {"@type": "Organization", name: "Science Studio"},
    publisher: {"@type": "Organization", name: "Science Studio", url: siteUrl},
  };

  return (
    <div className="guide-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}} />
      <header className="site-header"><div className="site-header-inner"><Link className="site-brand" href="/" aria-label="Science Studio home"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link><PrimarySiteNavigation active="guides" /><div className="site-actions"><Link className="header-account-link" href="/account"><UserRound size={15} /><span>Account</span></Link></div></div></header>
      <main className="guide-main">
        <div className="guide-breadcrumb"><Link href="/teaching-guides"><ArrowLeft size={14} />Teaching guides</Link><span>/</span><span>Density and buoyancy</span></div>
        <article>
          <header className="guide-hero">
            <div className="guide-hero-copy">
              <span className="section-kicker"><Droplets size={15} />Fluids · Middle school · 15 minutes</span>
              <h1>How to teach density and buoyancy with an interactive simulation</h1>
              <p className="guide-answer"><strong>Use the same object in two fluids so density is the only reason the outcomes differ.</strong> Compare weight and buoyant force while the object moves, then show that a floating object settles when reduced displaced volume makes those forces equal.</p>
              <div className="guide-hero-actions"><Link className="guide-primary-action" href="/experiments/density-buoyancy">Open the buoyancy experiment <ArrowRight size={16} /></Link><a className="guide-secondary-action" href="#lesson">View lesson sequence</a></div>
            </div>
            <aside className="guide-facts" aria-label="Lesson details"><div><Timer size={18} /><span><small>Class time</small><strong>15 minutes</strong></span></div><div><BookOpenCheck size={18} /><span><small>Learning goal</small><strong>Explain float or sink</strong></span></div><div><MonitorPlay size={18} /><span><small>Materials</small><strong>One projected browser</strong></span></div></aside>
          </header>

          <figure className="guide-figure"><Image src={previewImage} alt="Density and buoyancy experiment comparing the same object in two fluids with force arrows and measurements" width={1200} height={676} priority /><figcaption>Keep object mass and volume identical in both containers. Fluid density then determines the different buoyant forces.</figcaption></figure>

          <section className="guide-objective" aria-labelledby="objective-title"><Lightbulb size={23} /><div><span>By the end of the demo</span><h2 id="objective-title">Students can use density to predict the direction of motion and force balance to explain the final state.</h2></div></section>

          <section className="guide-section guide-lesson" id="lesson"><div className="guide-section-heading"><span className="section-kicker"><Timer size={15} />Classroom procedure</span><h2>Move from a density prediction to a force explanation.</h2></div><ol className="guide-timeline">{lessonSteps.map(([time, heading, body], index) => <li key={heading}><span className="guide-step-number">{index + 1}</span><time>{time}</time><div><h3>{heading}</h3><p>{body}</p></div></li>)}</ol></section>

          <section className="guide-two-column">
            <div className="guide-section"><div className="guide-section-heading"><span className="section-kicker"><CircleHelp size={15} />Misconceptions to surface</span><h2>Separate the motion question from the force question.</h2></div><div className="guide-misconceptions">{misconceptions.map(([claim, correction]) => <article key={claim}><h3>{claim}</h3><p>{correction}</p></article>)}</div></div>
            <aside className="guide-formulas" aria-label="Density and buoyancy equations"><span className="section-kicker"><Calculator size={15} />Equations</span><dl><div><dt>Object density</dt><dd>ρ = m / V</dd></div><div><dt>Buoyant force</dt><dd>F<sub>B</sub> = ρ<sub>f</sub>gV<sub>d</sub></dd></div><div><dt>Weight</dt><dd>W = mg</dd></div><div><dt>Floating equilibrium</dt><dd>F<sub>B</sub> = W</dd></div></dl><p>For a uniform floating object, the submerged fraction is ρobject / ρfluid in the ideal incompressible-fluid model.</p></aside>
          </section>

          <section className="guide-section guide-observations"><div className="guide-section-heading"><span className="section-kicker"><Check size={15} />Expected observations</span><h2>What the animation and measurements should agree on.</h2></div><div className="guide-observation-grid"><article><h3>Object is denser</h3><p>Weight exceeds the fully submerged buoyant force, so the initial net force is downward and the object sinks.</p></article><article><h3>Object is less dense</h3><p>The fully submerged buoyant force exceeds weight, so the object rises until a smaller displaced volume produces equilibrium.</p></article><article><h3>Densities match</h3><p>For a fully submerged object released from rest, buoyant force equals weight and the ideal object remains suspended.</p></article></div></section>

          <section className="guide-sources" aria-labelledby="sources-title"><span className="section-kicker"><BookOpenCheck size={15} />Sources and model scope</span><h2 id="sources-title">The comparison assumes uniform density, incompressible fluids, and constant gravity.</h2><p>The displaced-fluid relationship follows <a href="https://openstax.org/books/college-physics-2e/pages/11-7-archimedes-principle" target="_blank" rel="noreferrer">OpenStax College Physics 2e, 11.7: Archimedes&apos; Principle</a>. Drag affects how quickly the object settles, but the final floating condition comes from buoyant force balancing weight.</p></section>

          <section className="guide-demo-callout"><div><span className="section-kicker"><Droplets size={15} />Ready to compare</span><h2>Release one object into two different fluids.</h2><p>Track displaced volume, weight, buoyancy, drag, and the final force balance in one synchronized classroom view.</p></div><Link className="guide-primary-action" href="/experiments/density-buoyancy">Open Density &amp; Buoyancy <ArrowRight size={16} /></Link></section>
        </article>
      </main>
    </div>
  );
}

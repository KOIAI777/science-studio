import type {Metadata} from "next";
import {ArrowLeft, ArrowRight, BookOpenCheck, Calculator, Check, CircleHelp, CircuitBoard, FlaskConical, Lightbulb, MonitorPlay, Timer, UserRound} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {PrimarySiteNavigation} from "../../../components/primary-site-navigation";

const title = "How to Teach Ohm's Law with an Interactive Circuit";
const description = "A 10-minute middle-school Ohm's law lesson using an interactive circuit to compare voltage, resistance, and current with controlled predictions.";
const path = "/teaching-guides/ohms-law-interactive-circuit";
const previewImage = "/experiments/ohms-law-diagram.png";

export const metadata: Metadata = {
  title,
  description,
  alternates: {canonical: path},
  openGraph: {type: "article", title: `${title} | Science Studio`, description, url: path, images: [{url: previewImage, width: 728, height: 684, alt: "Interactive Ohm's law circuit with source, resistor, switch, current, and equation"}]},
  twitter: {card: "summary_large_image", title, description, images: [previewImage]},
};

const lessonSteps = [
  ["0-2 min", "Establish one complete circuit", "Close the switch and identify the source voltage, resistance, and measured current. Ask students which quantity is the cause, constraint, and response in this first comparison."],
  ["2-4 min", "Predict a voltage change", "Keep resistance fixed and ask what happens to current if the source voltage doubles. Record the prediction before moving the control."],
  ["4-6 min", "Test the voltage prediction", "Double voltage without changing resistance. The measured current should double because the ratio V/R doubled."],
  ["6-8 min", "Predict a resistance change", "Return to the starting voltage, then double resistance. Students should predict that current becomes half as large."],
  ["8-10 min", "State the relationship", "Use both comparisons to explain I = V/R. Finish by opening the switch so students distinguish a calculated closed-circuit current from zero current in an incomplete path."],
] as const;

const misconceptions = [
  ["Voltage flows through the circuit", "Voltage is a potential difference between two points. Current is the rate of charge flow through the closed path."],
  ["The resistor uses up current", "In a one-loop steady circuit, the same current passes through every point. The resistor transfers electrical energy; it does not consume charge."],
  ["V, I, and R can all be changed independently", "For an ohmic resistor at a fixed temperature, any two quantities determine the third. A controlled comparison changes one input while holding the other fixed."],
] as const;

export default function OhmsLawInteractiveCircuitGuidePage() {
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
    timeRequired: "PT10M",
    teaches: ["Ohm's law", "Voltage", "Current", "Resistance", "Controlled variables"],
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
        <div className="guide-breadcrumb"><Link href="/teaching-guides"><ArrowLeft size={14} />Teaching guides</Link><span>/</span><span>Ohm&apos;s law</span></div>
        <article>
          <header className="guide-hero">
            <div className="guide-hero-copy">
              <span className="section-kicker"><CircuitBoard size={15} />Electricity · Middle school · 10 minutes</span>
              <h1>How to teach Ohm&apos;s law with an interactive circuit</h1>
              <p className="guide-answer"><strong>Teach Ohm&apos;s law as two controlled comparisons, not as a triangle to memorize.</strong> Hold resistance fixed while voltage changes, then hold voltage fixed while resistance changes. Students can use the measured current to explain both patterns.</p>
              <div className="guide-hero-actions"><Link className="guide-primary-action" href="/experiments/ohms-law">Open the free Ohm&apos;s law lab <ArrowRight size={16} /></Link><a className="guide-secondary-action" href="#lesson">View lesson sequence</a></div>
            </div>
            <aside className="guide-facts" aria-label="Lesson details"><div><Timer size={18} /><span><small>Class time</small><strong>10 minutes</strong></span></div><div><BookOpenCheck size={18} /><span><small>Learning goal</small><strong>Explain I = V/R</strong></span></div><div><MonitorPlay size={18} /><span><small>Materials</small><strong>One projected browser</strong></span></div></aside>
          </header>

          <figure className="guide-figure guide-figure-contained"><Image src={previewImage} alt="Ohm's law circuit showing a battery, resistor, switch, current direction, measurements, and V equals IR" width={728} height={684} priority /><figcaption>Keep the circuit topology fixed. The lesson is about how one measured current responds when either voltage or resistance changes.</figcaption></figure>

          <section className="guide-objective" aria-labelledby="objective-title"><Lightbulb size={23} /><div><span>By the end of the demo</span><h2 id="objective-title">Students can predict whether current increases or decreases and justify the direction using I = V/R.</h2></div></section>

          <section className="guide-section guide-lesson" id="lesson"><div className="guide-section-heading"><span className="section-kicker"><Timer size={15} />Classroom procedure</span><h2>Two comparisons are enough to make the relationship visible.</h2></div><ol className="guide-timeline">{lessonSteps.map(([time, heading, body], index) => <li key={heading}><span className="guide-step-number">{index + 1}</span><time>{time}</time><div><h3>{heading}</h3><p>{body}</p></div></li>)}</ol></section>

          <section className="guide-two-column">
            <div className="guide-section"><div className="guide-section-heading"><span className="section-kicker"><CircleHelp size={15} />Misconceptions to surface</span><h2>Correct the language before correcting the arithmetic.</h2></div><div className="guide-misconceptions">{misconceptions.map(([claim, correction]) => <article key={claim}><h3>{claim}</h3><p>{correction}</p></article>)}</div></div>
            <aside className="guide-formulas" aria-label="Ohm's law equations"><span className="section-kicker"><Calculator size={15} />Equations</span><dl><div><dt>Ohm&apos;s law</dt><dd>V = IR</dd></div><div><dt>Solve for current</dt><dd>I = V / R</dd></div><div><dt>Electrical power</dt><dd>P = VI</dd></div><div><dt>Open switch</dt><dd>I = 0</dd></div></dl><p>The proportional comparisons assume an ohmic resistor whose resistance remains constant during each run.</p></aside>
          </section>

          <section className="guide-section guide-observations"><div className="guide-section-heading"><span className="section-kicker"><Check size={15} />Expected observations</span><h2>What the measurements should show.</h2></div><div className="guide-observation-grid"><article><h3>Double V</h3><p>At fixed resistance, doubling the source voltage doubles current. The ratio V/I remains equal to R.</p></article><article><h3>Double R</h3><p>At fixed voltage, doubling resistance halves current. The circuit still has one complete current path.</p></article><article><h3>Open switch</h3><p>An incomplete path has zero steady current, even though the source still maintains a potential difference.</p></article></div></section>

          <section className="guide-sources" aria-labelledby="sources-title"><span className="section-kicker"><BookOpenCheck size={15} />Sources and model scope</span><h2 id="sources-title">The demo models an ideal DC source, wires, switch, and ohmic resistor.</h2><p>The relationship and controlled comparisons follow <a href="https://openstax.org/books/college-physics-2e/pages/20-2-ohms-law-resistance-and-simple-circuits" target="_blank" rel="noreferrer">OpenStax College Physics 2e, 20.2: Ohm&apos;s Law</a>. Real components can change resistance as temperature changes, so the model&apos;s fixed-resistance assumption should be stated.</p></section>

          <section className="guide-demo-callout"><div><span className="section-kicker"><CircuitBoard size={15} />Free classroom demo</span><h2>Run both Ohm&apos;s law comparisons in one circuit.</h2><p>Adjust voltage and resistance independently, close or open the switch, and keep the measured current synchronized with the equation.</p></div><Link className="guide-primary-action" href="/experiments/ohms-law">Open Ohm&apos;s Law Lab <ArrowRight size={16} /></Link></section>
        </article>
      </main>
    </div>
  );
}

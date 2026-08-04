import type {Metadata} from "next";
import {ArrowLeft, ArrowRight, BookOpenCheck, Calculator, Check, CircleHelp, CircuitBoard, FlaskConical, Lightbulb, MonitorPlay, Timer, UserRound} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {PrimarySiteNavigation} from "../../../components/primary-site-navigation";

const headline = "How to Teach Series and Parallel Circuits with One Interactive Demo";
const metaTitle = "Series and Parallel Circuits Teaching Guide";
const description = "A 15-minute middle-school physics lesson plan for teaching series and parallel circuits: predictions, procedure, observations, equations, misconceptions, and an interactive circuit demo.";
const path = "/teaching-guides/series-and-parallel-circuits";

export const metadata: Metadata = {
  title: metaTitle,
  description,
  alternates: {canonical: path},
  openGraph: {
    title: `${metaTitle} | Science Studio`,
    description,
    url: path,
    type: "article",
    images: [{url: "/experiments/dc-circuits-diagram.png", width: 1280, height: 720, alt: "Series and parallel circuit measurement comparison"}],
  },
  twitter: {card: "summary_large_image", title: metaTitle, description, images: ["/experiments/dc-circuits-diagram.png"]},
};

const lessonSteps = [
  ["0-2 min", "Ask for a prediction", "Show two identical lamps and ask: if one lamp is added, which circuit makes both lamps dimmer? Keep the answer hidden for now."],
  ["2-6 min", "Build the series circuit", "Set both resistors to the same value. Point to the single current path, then compare the current through R1 and R2 with the source current."],
  ["6-10 min", "Switch to parallel", "Keep the source voltage and both resistances unchanged. Show that each branch has the source voltage while the branch currents add at the source."],
  ["10-13 min", "Change one resistor", "Increase R2 only. Students should see the R2 branch current decrease while the R1 branch remains unchanged in the ideal parallel model."],
  ["13-15 min", "Explain the result", "Return to the prediction. Have students justify the difference using current paths, voltage, and equivalent resistance rather than brightness alone."],
] as const;

const misconceptions = [
  ["Current is used up", "In a series circuit, current is the same at every component. Energy is transferred by the charges; the charge flow is not consumed."],
  ["Voltage is the same everywhere", "Voltage is a difference between two points. In series it divides across components; in parallel each branch is connected across the same two source terminals."],
  ["A new parallel branch steals current", "For an ideal voltage source, adding a parallel branch lowers equivalent resistance and increases total source current. An existing branch keeps the same voltage."],
] as const;

export default function SeriesAndParallelCircuitsGuidePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:5173";
  const url = new URL(path, siteUrl).toString();
  const image = new URL("/experiments/dc-circuits-diagram.png", siteUrl).toString();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["Article", "LearningResource"],
    headline,
    description,
    url,
    image,
    inLanguage: "en",
    educationalLevel: "Middle school",
    learningResourceType: "Lesson plan",
    timeRequired: "PT15M",
    teaches: ["Series circuits", "Parallel circuits", "Current", "Voltage", "Equivalent resistance", "Ohm's law"],
    audience: {"@type": "EducationalAudience", educationalRole: "teacher"},
    about: {"@type": "Thing", name: "Series and parallel circuits"},
    isAccessibleForFree: true,
    publisher: {"@type": "Organization", name: "Science Studio", url: siteUrl},
  };

  return (
    <div className="guide-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}} />
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" href="/" aria-label="Science Studio home"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link>
          <PrimarySiteNavigation active="guides" />
          <div className="site-actions"><Link className="header-account-link" href="/account"><UserRound size={15} /><span>Account</span></Link></div>
        </div>
      </header>
      <main className="guide-main">
        <div className="guide-breadcrumb"><Link href="/teaching-guides"><ArrowLeft size={14} />Teaching guides</Link><span>/</span><span>Series and parallel circuits</span></div>
        <article>
          <header className="guide-hero">
            <div className="guide-hero-copy">
              <span className="section-kicker"><CircuitBoard size={15} />Electricity · Middle school · 15 minutes</span>
              <h1>How to teach series and parallel circuits with one interactive demo</h1>
              <p className="guide-answer"><strong>Start with a prediction, then change just one variable at a time.</strong> Students can see that series components share one current path, while parallel branches share source voltage and split the total current.</p>
              <div className="guide-hero-actions"><Link className="guide-primary-action" href="/experiments/dc-circuits">Open the interactive circuit demo <ArrowRight size={16} /></Link><a className="guide-secondary-action" href="#lesson">View lesson sequence</a></div>
            </div>
            <aside className="guide-facts" aria-label="Lesson details">
              <div><Timer size={18} /><span><small>Class time</small><strong>15 minutes</strong></span></div>
              <div><BookOpenCheck size={18} /><span><small>Learning goal</small><strong>Compare current and voltage</strong></span></div>
              <div><MonitorPlay size={18} /><span><small>Materials</small><strong>One projected browser</strong></span></div>
            </aside>
          </header>

          <figure className="guide-figure">
            <Image src="/experiments/dc-circuits-diagram.png" alt="A comparison of a single-resistor, series, and parallel DC circuit with current paths and measurements" width={1280} height={720} priority />
            <figcaption>Use the same source voltage and two equal resistors first. That makes the topology, not the numbers, the reason students must explain.</figcaption>
          </figure>

          <section className="guide-objective" aria-labelledby="objective-title">
            <Lightbulb size={23} />
            <div><span>By the end of the demo</span><h2 id="objective-title">Students can predict and explain which quantities are shared, divided, or added in each circuit.</h2></div>
          </section>

          <section className="guide-section guide-lesson" id="lesson">
            <div className="guide-section-heading"><span className="section-kicker"><Timer size={15} />Classroom procedure</span><h2>A short sequence with one visible question at a time.</h2></div>
            <ol className="guide-timeline">
              {lessonSteps.map(([time, heading, body], index) => <li key={heading}><span className="guide-step-number">{index + 1}</span><time>{time}</time><div><h3>{heading}</h3><p>{body}</p></div></li>)}
            </ol>
          </section>

          <section className="guide-two-column">
            <div className="guide-section">
              <div className="guide-section-heading"><span className="section-kicker"><CircleHelp size={15} />Misconceptions to surface</span><h2>Listen for these explanations.</h2></div>
              <div className="guide-misconceptions">
                {misconceptions.map(([claim, correction]) => <article key={claim}><h3>{claim}</h3><p>{correction}</p></article>)}
              </div>
            </div>
            <aside className="guide-formulas" aria-label="Equations to connect to the observations">
              <span className="section-kicker"><Calculator size={15} />Equations</span>
              <dl>
                <div><dt>Ohm's law</dt><dd>V = IR</dd></div>
                <div><dt>Series resistance</dt><dd>R<sub>eq</sub> = R<sub>1</sub> + R<sub>2</sub></dd></div>
                <div><dt>Parallel resistance</dt><dd>1 / R<sub>eq</sub> = 1 / R<sub>1</sub> + 1 / R<sub>2</sub></dd></div>
                <div><dt>Parallel current</dt><dd>I<sub>total</sub> = I<sub>1</sub> + I<sub>2</sub></dd></div>
              </dl>
              <p>These relationships assume an ideal source and resistive components, matching the demo model.</p>
            </aside>
          </section>

          <section className="guide-section guide-observations">
            <div className="guide-section-heading"><span className="section-kicker"><Check size={15} />Expected observations</span><h2>What the measurements should show.</h2></div>
            <div className="guide-observation-grid">
              <article><h3>Series</h3><p>One path means the source current, R1 current, and R2 current are equal. The source voltage is the sum of the resistor voltage drops.</p></article>
              <article><h3>Parallel</h3><p>Each branch has the source voltage. The source current is the sum of branch currents, so total current rises when another branch is added.</p></article>
              <article><h3>One resistor changes</h3><p>With an ideal source, changing R2 in parallel changes only its branch current. It does not change the voltage across R1.</p></article>
            </div>
          </section>

          <section className="guide-sources" aria-labelledby="sources-title">
            <span className="section-kicker"><BookOpenCheck size={15} />Sources and model scope</span>
            <h2 id="sources-title">The demo uses ideal wires, an ideal DC source, and ohmic resistors.</h2>
            <p>That scope lets students isolate the circuit relationships before discussing non-ideal batteries, lamps, or heating effects. The series and parallel relationships in this guide follow <a href="https://openstax.org/books/physics-2e/pages/10-3-resistors-in-series-and-parallel" target="_blank" rel="noreferrer">OpenStax Physics 2e, 10.3: Resistors in Series and Parallel</a>.</p>
          </section>

          <section className="guide-demo-callout">
            <div><span className="section-kicker"><CircuitBoard size={15} />Ready to present</span><h2>Run the comparison in the interactive circuit experiment.</h2><p>Switch among single, series, and parallel topologies, then reveal the readings and equations as students explain their prediction.</p></div>
            <Link className="guide-primary-action" href="/experiments/dc-circuits">Open DC Circuits <ArrowRight size={16} /></Link>
          </section>
        </article>
      </main>
    </div>
  );
}

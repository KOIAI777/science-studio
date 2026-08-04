import type {Metadata} from "next";
import {ArrowLeft, ArrowRight, BookOpenCheck, Check, CircleHelp, FlaskConical, Lightbulb, MonitorPlay, Presentation, Timer, UserRound} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {PrimarySiteNavigation} from "../../../components/primary-site-navigation";

const headline = "How to Use Interactive Physics Simulations on a Classroom Projector";
const metaTitle = "Physics Simulations for Classroom Projectors";
const description = "A practical 15-minute teacher workflow for presenting an interactive physics simulation on a projector: setup, pacing, questions, visibility, and model limits.";
const path = "/teaching-guides/physics-simulations-classroom-projector";
const previewImage = "/experiments/inclined-plane-diagram.png";

export const metadata: Metadata = {
  title: metaTitle,
  description,
  alternates: {canonical: path},
  openGraph: {type: "article", title: `${metaTitle} | Science Studio`, description, url: path, images: [{url: previewImage, width: 1200, height: 675, alt: "Projected interactive inclined-plane physics diagram with forces and measurements"}]},
  twitter: {card: "summary_large_image", title: metaTitle, description, images: [previewImage]},
};

const lessonSteps = [
  ["Before class", "Prepare one readable starting state", "Open the simulation before students arrive, select a 16:9 canvas, fit it to the screen, and check that the smallest labels remain readable from the back row."],
  ["0-2 min", "Show the question before the motion", "Freeze the starting state and ask one prediction question. Students need time to inspect the diagram before animation competes for their attention."],
  ["2-7 min", "Change one parameter", "Adjust only the value named in the question. Keep the camera, units, and other parameters fixed so students can attribute the result to one cause."],
  ["7-12 min", "Pause at the explanatory frame", "Stop when the relevant vectors, measurements, or equation are visible together. Ask students to connect one visual change to one term in the equation."],
  ["12-15 min", "Replay and name the model boundary", "Run the comparison once more, then state what the simulation assumes or omits. Finish by asking whether the prediction still holds under those assumptions."],
] as const;

const pitfalls = [
  ["Starting with animation", "Movement attracts attention before students know what to observe. Begin from a still frame with a visible question."],
  ["Changing several controls", "Multiple changes make cause and effect ambiguous. Lock the example, then vary only one parameter per comparison."],
  ["Treating the model as proof", "A simulation shows the consequences of its model. It should support explanation and prediction, not replace measurement or a physical investigation."],
] as const;

export default function PhysicsSimulationsClassroomProjectorGuidePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:5173";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["Article", "LearningResource"],
    headline,
    description,
    url: new URL(path, siteUrl).toString(),
    image: new URL(previewImage, siteUrl).toString(),
    datePublished: "2026-08-03",
    dateModified: "2026-08-03",
    inLanguage: "en",
    educationalLevel: "Middle school",
    learningResourceType: "Teaching guide",
    timeRequired: "PT15M",
    teaches: ["Classroom simulation presentation", "Scientific modeling", "Prediction", "Controlled comparison"],
    audience: {"@type": "EducationalAudience", educationalRole: "teacher"},
    isAccessibleForFree: true,
    author: {"@id": new URL("/#organization", siteUrl).toString()},
    publisher: {"@id": new URL("/#organization", siteUrl).toString()},
    isPartOf: {"@id": new URL("/#website", siteUrl).toString()},
  };

  return (
    <div className="guide-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}} />
      <header className="site-header"><div className="site-header-inner"><Link className="site-brand" href="/" aria-label="Science Studio by ClassroomLab home"><span className="brand-mark"><FlaskConical size={17} /></span><span className="brand-copy"><strong>Science Studio</strong><small>by ClassroomLab</small></span></Link><PrimarySiteNavigation active="guides" /><div className="site-actions"><Link className="header-account-link" href="/account"><UserRound size={15} /><span>Account</span></Link></div></div></header>
      <main className="guide-main">
        <div className="guide-breadcrumb"><Link href="/teaching-guides"><ArrowLeft size={14} />Teaching guides</Link><span>/</span><span>Classroom projector workflow</span></div>
        <article>
          <header className="guide-hero">
            <div className="guide-hero-copy">
              <span className="section-kicker"><Presentation size={15} />Teacher workflow · Any physics topic · 15 minutes</span>
              <h1>How to use interactive physics simulations on a classroom projector</h1>
              <p className="guide-answer"><strong>Start from a still, readable question rather than a moving scene.</strong> Ask for a prediction, change one parameter, pause where the diagram and equation explain the result, and finish by naming the model assumptions.</p>
              <div className="guide-hero-actions"><Link className="guide-primary-action" href="/experiments/inclined-plane">Try a free projected demo <ArrowRight size={16} /></Link><a className="guide-secondary-action" href="#lesson">View the 15-minute workflow</a></div>
            </div>
            <aside className="guide-facts" aria-label="Guide details">
              <div><Timer size={18} /><span><small>Class time</small><strong>15 minutes</strong></span></div>
              <div><BookOpenCheck size={18} /><span><small>Teaching pattern</small><strong>Predict, change, explain</strong></span></div>
              <div><MonitorPlay size={18} /><span><small>Equipment</small><strong>Projector or shared screen</strong></span></div>
            </aside>
          </header>

          <figure className="guide-figure"><Image src={previewImage} alt="Science Studio inclined-plane experiment with a large force diagram, equation, and measurements for classroom projection" width={1200} height={675} priority /><figcaption>Use one synchronized frame: the physical diagram, measured values, and equation should describe the same state.</figcaption></figure>

          <section className="guide-objective" aria-labelledby="objective-title"><Lightbulb size={23} /><div><span>The projector rule</span><h2 id="objective-title">Students should know what to look for before anything moves.</h2></div></section>

          <section className="guide-section guide-lesson" id="lesson">
            <div className="guide-section-heading"><span className="section-kicker"><Timer size={15} />Projection sequence</span><h2>Use the screen to pace an explanation, not to fill time.</h2></div>
            <ol className="guide-timeline">{lessonSteps.map(([time, heading, body], index) => <li key={heading}><span className="guide-step-number">{index + 1}</span><time>{time}</time><div><h3>{heading}</h3><p>{body}</p></div></li>)}</ol>
          </section>

          <section className="guide-two-column">
            <div className="guide-section">
              <div className="guide-section-heading"><span className="section-kicker"><CircleHelp size={15} />Common presentation mistakes</span><h2>Three ways a useful simulation becomes visual noise.</h2></div>
              <div className="guide-misconceptions">{pitfalls.map(([claim, correction]) => <article key={claim}><h3>{claim}</h3><p>{correction}</p></article>)}</div>
            </div>
            <aside className="guide-formulas" aria-label="Before-class projection checklist">
              <span className="section-kicker"><MonitorPlay size={15} />Before class</span>
              <dl>
                <div><dt>Canvas</dt><dd>16:9</dd></div>
                <div><dt>Starting state</dt><dd>Paused</dd></div>
                <div><dt>Comparison</dt><dd>One variable</dd></div>
                <div><dt>Visibility</dt><dd>Back-row check</dd></div>
              </dl>
              <p>Use fullscreen only after the correct example and text size are set. Keep browser zoom predictable so labels do not shift during the explanation.</p>
            </aside>
          </section>

          <section className="guide-section guide-observations">
            <div className="guide-section-heading"><span className="section-kicker"><Check size={15} />A useful projected demo</span><h2>What students should be able to do afterward.</h2></div>
            <div className="guide-observation-grid">
              <article><h3>Predict</h3><p>State what should change before the simulation runs and identify the variable held constant.</p></article>
              <article><h3>Point</h3><p>Locate the visual evidence, measurement, or vector that supports the result on the shared screen.</p></article>
              <article><h3>Explain</h3><p>Connect the observed change to the relevant equation and state the assumptions under which the comparison is valid.</p></article>
            </div>
          </section>

          <section className="guide-sources" aria-labelledby="sources-title"><span className="section-kicker"><BookOpenCheck size={15} />Teaching source</span><h2 id="sources-title">Prediction and guided questioning should frame the simulation.</h2><p>This workflow follows the emphasis on learning goals, student reasoning, and active questioning in the University of Colorado Boulder&apos;s <a href="https://phet.colorado.edu/en/teaching-resources/teaching-with-phet" target="_blank" rel="noreferrer">Teaching with PhET</a> guidance. Science Studio adds a presentation-first sequence with synchronized diagrams, measurements, and equations.</p></section>

          <section className="guide-demo-callout"><div><span className="section-kicker"><Presentation size={15} />Ready to project</span><h2>Try the workflow with a free force diagram.</h2><p>Set an angle and friction value, pause on the force decomposition, then ask students to predict whether the block will slide.</p></div><Link className="guide-primary-action" href="/experiments/inclined-plane">Open Inclined Plane <ArrowRight size={16} /></Link></section>
        </article>
      </main>
    </div>
  );
}

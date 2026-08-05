import type {Metadata} from "next";
import type {LucideIcon} from "lucide-react";
import {ArrowLeft, ArrowRight, BookOpenCheck, Calculator, Check, CircleHelp, FlaskConical, Lightbulb, MonitorPlay, Timer, UserRound} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {PrimarySiteNavigation} from "./primary-site-navigation";

interface LessonStep {
  time: string;
  heading: string;
  body: string;
}

interface TeachingGuideConfig {
  headline: string;
  metaTitle: string;
  description: string;
  path: string;
  previewImage: string;
  previewImageAlt: string;
  previewImageWidth: number;
  previewImageHeight: number;
  topic: string;
  duration: string;
  minutes: number;
  icon: LucideIcon;
  experimentPath: string;
  experimentName: string;
  answer: string;
  objective: string;
  learningGoal: string;
  caption: string;
  lessonHeading: string;
  lessonSteps: readonly LessonStep[];
  misconceptions: readonly {claim: string; correction: string}[];
  equations: readonly {label: string; value: string}[];
  equationScope: string;
  observations: readonly {heading: string; body: string}[];
  source: {title: string; href: string; label: string; context: string};
  teaches: readonly string[];
  faqs: readonly {question: string; answer: string}[];
}

export function teachingGuideMetadata(config: TeachingGuideConfig): Metadata {
  return {
    title: config.metaTitle,
    description: config.description,
    alternates: {canonical: config.path},
    openGraph: {
      type: "article",
      title: `${config.metaTitle} | Science Studio`,
      description: config.description,
      url: config.path,
      images: [{url: config.previewImage, width: config.previewImageWidth, height: config.previewImageHeight, alt: config.previewImageAlt}],
    },
    twitter: {card: "summary_large_image", title: config.metaTitle, description: config.description, images: [config.previewImage]},
  };
}

export function TeachingGuidePage({config}: {config: TeachingGuideConfig}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:5173";
  const TopicIcon = config.icon;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Article", "LearningResource"],
        headline: config.headline,
        description: config.description,
        url: new URL(config.path, siteUrl).toString(),
        image: new URL(config.previewImage, siteUrl).toString(),
        datePublished: "2026-08-05",
        dateModified: "2026-08-05",
        inLanguage: "en",
        educationalLevel: "Middle school",
        learningResourceType: "Lesson plan",
        timeRequired: `PT${config.minutes}M`,
        teaches: config.teaches,
        audience: {"@type": "EducationalAudience", educationalRole: "teacher"},
        isAccessibleForFree: true,
        author: {"@id": new URL("/#organization", siteUrl).toString()},
        publisher: {"@id": new URL("/#organization", siteUrl).toString()},
        isPartOf: {"@id": new URL("/#website", siteUrl).toString()},
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {"@type": "ListItem", position: 1, name: "Home", item: new URL("/", siteUrl).toString()},
          {"@type": "ListItem", position: 2, name: "Teaching guides", item: new URL("/teaching-guides", siteUrl).toString()},
          {"@type": "ListItem", position: 3, name: config.metaTitle, item: new URL(config.path, siteUrl).toString()},
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: config.faqs.map(({question, answer}) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: {"@type": "Answer", text: answer},
        })),
      },
    ],
  };

  return (
    <div className="guide-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}} />
      <header className="site-header"><div className="site-header-inner"><Link className="site-brand" href="/" aria-label="Science Studio by ClassroomLab home"><span className="brand-mark"><FlaskConical size={17} /></span><span className="brand-copy"><strong>Science Studio</strong><small>by ClassroomLab</small></span></Link><PrimarySiteNavigation active="guides" /><div className="site-actions"><Link className="header-account-link" href="/account"><UserRound size={15} /><span>Account</span></Link></div></div></header>
      <main className="guide-main">
        <div className="guide-breadcrumb"><Link href="/teaching-guides"><ArrowLeft size={14} />Teaching guides</Link><span>/</span><span>{config.metaTitle}</span></div>
        <article>
          <header className="guide-hero">
            <div className="guide-hero-copy">
              <span className="section-kicker"><TopicIcon size={15} />{config.topic} · Middle school · {config.duration}</span>
              <h1>{config.headline}</h1>
              <p className="guide-answer"><strong>{config.answer}</strong></p>
              <div className="guide-hero-actions"><Link className="guide-primary-action" href={config.experimentPath}>Open the interactive experiment <ArrowRight size={16} /></Link><a className="guide-secondary-action" href="#lesson">View lesson sequence</a></div>
            </div>
            <aside className="guide-facts" aria-label="Lesson details"><div><Timer size={18} /><span><small>Class time</small><strong>{config.duration}</strong></span></div><div><BookOpenCheck size={18} /><span><small>Learning goal</small><strong>{config.learningGoal}</strong></span></div><div><MonitorPlay size={18} /><span><small>Materials</small><strong>One projected browser</strong></span></div></aside>
          </header>

          <figure className="guide-figure"><Image src={config.previewImage} alt={config.previewImageAlt} width={config.previewImageWidth} height={config.previewImageHeight} priority /><figcaption>{config.caption}</figcaption></figure>

          <section className="guide-objective" aria-labelledby="objective-title"><Lightbulb size={23} /><div><span>By the end of the demo</span><h2 id="objective-title">{config.objective}</h2></div></section>

          <section className="guide-section guide-lesson" id="lesson"><div className="guide-section-heading"><span className="section-kicker"><Timer size={15} />Classroom procedure</span><h2>{config.lessonHeading}</h2></div><ol className="guide-timeline">{config.lessonSteps.map(({time, heading, body}, index) => <li key={heading}><span className="guide-step-number">{index + 1}</span><time>{time}</time><div><h3>{heading}</h3><p>{body}</p></div></li>)}</ol></section>

          <section className="guide-two-column">
            <div className="guide-section"><div className="guide-section-heading"><span className="section-kicker"><CircleHelp size={15} />Misconceptions to surface</span><h2>Make students explain the evidence, not just name the effect.</h2></div><div className="guide-misconceptions">{config.misconceptions.map(({claim, correction}) => <article key={claim}><h3>{claim}</h3><p>{correction}</p></article>)}</div></div>
            <aside className="guide-formulas" aria-label="Equations to connect to the observations"><span className="section-kicker"><Calculator size={15} />Equations</span><dl>{config.equations.map(({label, value}) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p>{config.equationScope}</p></aside>
          </section>

          <section className="guide-section guide-observations"><div className="guide-section-heading"><span className="section-kicker"><Check size={15} />Expected observations</span><h2>What the animation and measurements should agree on.</h2></div><div className="guide-observation-grid">{config.observations.map(({heading, body}) => <article key={heading}><h3>{heading}</h3><p>{body}</p></article>)}</div></section>

          <section className="guide-sources" aria-labelledby="sources-title"><span className="section-kicker"><BookOpenCheck size={15} />Sources and model scope</span><h2 id="sources-title">{config.source.title}</h2><p><a href={config.source.href} target="_blank" rel="noreferrer">{config.source.label}</a>. {config.source.context}</p></section>

          <section className="guide-section"><div className="guide-section-heading"><span className="section-kicker"><CircleHelp size={15} />Quick questions</span><h2>Questions teachers can use before or after the demonstration.</h2></div><div className="guide-misconceptions">{config.faqs.map(({question, answer}) => <article key={question}><h3>{question}</h3><p>{answer}</p></article>)}</div></section>

          <section className="guide-demo-callout"><div><span className="section-kicker"><TopicIcon size={15} />Ready to present</span><h2>Run the comparison in the interactive experiment.</h2><p>Keep one visible question on screen, change one parameter, then pause when the diagram and measurements answer it together.</p></div><Link className="guide-primary-action" href={config.experimentPath}>Open {config.experimentName} <ArrowRight size={16} /></Link></section>
        </article>
      </main>
    </div>
  );
}

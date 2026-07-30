import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FlaskConical,
  Gauge,
  LockKeyhole,
  Search,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type {CatalogPage, CatalogQuery} from "../lib/experiment-catalog-data";
import type {ExperimentAvailability, ExperimentCatalogItem, GradeLevel, SubjectArea} from "../lib/experiment-catalog";

const gradeLabels: Record<GradeLevel, string> = {
  elementary: "Elementary",
  middle: "Middle school",
  high: "High school",
};

const subjectLabels: Record<SubjectArea, string> = {
  mechanics: "Mechanics",
  electricity: "Electricity",
  waves: "Waves",
};

function buildCatalogHref(filters: CatalogQuery, overrides: Partial<CatalogQuery>) {
  const next = {...filters, ...overrides};
  const params = new URLSearchParams();
  if (next.grade) params.set("grade", next.grade);
  if (next.subject) params.set("subject", next.subject);
  if (next.query) params.set("q", next.query);
  if (next.page > 1) params.set("page", String(next.page));
  const query = params.toString();
  return query ? `/experiments?${query}` : "/experiments";
}

const experimentPreviewImages: Record<string, {src: string; alt: string}> = {
  "inclined-plane": {
    src: "/experiments/inclined-plane-diagram.png",
    alt: "Actual Science Studio inclined-plane output showing the block, force vectors, ramp, and angle.",
  },
  "energy-track": {
    src: "/experiments/energy-track-diagram.png",
    alt: "Actual Science Studio energy-track output showing the cart, force vectors, return height, and live energy budget.",
  },
  "forces-and-motion": {
    src: "/experiments/forces-and-motion-diagram.png",
    alt: "Actual Science Studio free-body diagram showing normal force, weight, applied force, and friction on a sliding block.",
  },
};

function ExperimentPreview({experiment}: {experiment: ExperimentCatalogItem}) {
  const preview = experimentPreviewImages[experiment.slug];
  if (!preview) return null;

  return (
    <div className="catalog-preview catalog-preview-image">
      <Image src={preview.src} alt={preview.alt} fill priority sizes="(max-width: 520px) calc(100vw - 32px), (max-width: 1040px) 50vw, 33vw" />
    </div>
  );
}

function AvailabilityLabel({availability}: {availability: ExperimentAvailability}) {
  if (availability === "free") return <span className="availability free"><Check size={12} />Free now</span>;
  if (availability === "pack") return <span className="availability pack"><LockKeyhole size={12} />Future level pack</span>;
  return <span className="availability planned"><Sparkles size={12} />Planned</span>;
}

function ExperimentCard({experiment}: {experiment: ExperimentCatalogItem}) {
  const isAvailable = experiment.availability === "free" && Boolean(experimentPreviewImages[experiment.slug]);
  const content = <>
    <ExperimentPreview experiment={experiment} />
    <div className="experiment-card-body">
      <div className="experiment-card-status"><AvailabilityLabel availability={experiment.availability} /><span><Clock3 size={12} />{experiment.lessonMinutes} min lesson</span></div>
      <h2>{experiment.title}</h2>
      <p>{experiment.summary}</p>
      <div className="concept-list">{experiment.concepts.map((concept) => <span key={concept}>{concept}</span>)}</div>
      <div className="experiment-card-action">{isAvailable ? <><Gauge size={14} />Open experiment<ChevronRight size={15} /></> : <>{experiment.availability === "pack" ? "Future level pack" : "Planned"}<LockKeyhole size={13} /></>}</div>
    </div>
  </>;

  return isAvailable
    ? <Link className="experiment-card available" href={`/experiments/${experiment.slug}`}>{content}</Link>
    : <article className="experiment-card unavailable" aria-disabled="true">{content}</article>;
}

export function ExperimentLibrary({catalog, filters}: {catalog: CatalogPage; filters: CatalogQuery}) {
  const start = catalog.total === 0 ? 0 : (catalog.page - 1) * 6 + 1;
  const end = Math.min(catalog.page * 6, catalog.total);

  return (
    <div className="library-page">
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" href="/" aria-label="Science Studio home"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link>
          <nav className="site-nav" aria-label="Primary navigation">
            <Link className="active" href="/experiments">Experiment library</Link>
            <Link href="/#workflow">How it works</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/#faq">FAQ</Link>
          </nav>
          <div className="site-actions"><Link className="header-cta" href="/experiments/inclined-plane">Try a free experiment<ChevronRight size={15} /></Link></div>
        </div>
      </header>

      <main className="library-main">
        <div className="library-breadcrumb"><Link href="/"><ArrowLeft size={14} />Home</Link><span>/</span><span>Experiment library</span></div>
        <section className="library-heading">
          <div><span className="section-kicker">Experiment library</span><h1>One clear place for every grade level</h1></div>
          <p>Find classroom-ready physics experiments by grade and subject. Start with three free mechanics lessons while the wider curriculum is being reviewed.</p>
        </section>

        <section className="library-toolbar" aria-label="Experiment filters">
          <div className="library-filter-group">
            <span>Grade level</span>
            <Link className={!filters.grade ? "active" : ""} href={buildCatalogHref(filters, {grade: undefined, page: 1})}>All</Link>
            {(Object.keys(gradeLabels) as GradeLevel[]).map((grade) => <Link className={filters.grade === grade ? "active" : ""} href={buildCatalogHref(filters, {grade, page: 1})} key={grade}>{gradeLabels[grade]}</Link>)}
          </div>
          <div className="library-filter-group">
            <span>Subject</span>
            <Link className={!filters.subject ? "active" : ""} href={buildCatalogHref(filters, {subject: undefined, page: 1})}>All</Link>
            {(Object.keys(subjectLabels) as SubjectArea[]).map((subject) => <Link className={filters.subject === subject ? "active" : ""} href={buildCatalogHref(filters, {subject, page: 1})} key={subject}>{subjectLabels[subject]}</Link>)}
          </div>
          <form className="library-search" action="/experiments">
            {filters.grade && <input type="hidden" name="grade" value={filters.grade} />}
            {filters.subject && <input type="hidden" name="subject" value={filters.subject} />}
            <Search size={16} />
            <input type="search" name="q" defaultValue={filters.query} placeholder="Search experiments" aria-label="Search experiments" />
            <button type="submit">Search</button>
          </form>
        </section>

        <div className="library-results-meta">
          <span>{catalog.total === 0 ? "No experiments" : `Showing ${start}-${end} of ${catalog.total} experiments`}</span>
          <span>{catalog.source === "supabase" ? "Supabase catalog" : catalog.source === "postgres" ? "Local PostgreSQL" : "Local preview data"}</span>
        </div>

        {catalog.experiments.length ? <div className="library-grid">{catalog.experiments.map((experiment) => <ExperimentCard experiment={experiment} key={experiment.id} />)}</div> : (
          <div className="catalog-empty"><Search size={22} /><strong>No experiments match these filters.</strong><Link href="/experiments">Clear filters</Link></div>
        )}

        {catalog.pageCount > 1 && <nav className="catalog-pagination" aria-label="Experiment pages">
          {catalog.page > 1 ? <Link className="pagination-step" href={buildCatalogHref(filters, {page: catalog.page - 1})}><ChevronLeft size={15} />Previous</Link> : <span className="pagination-step disabled"><ChevronLeft size={15} />Previous</span>}
          <div>{Array.from({length: catalog.pageCount}, (_, index) => index + 1).map((page) => <Link className={catalog.page === page ? "active" : ""} href={buildCatalogHref(filters, {page})} aria-current={catalog.page === page ? "page" : undefined} key={page}>{page}</Link>)}</div>
          {catalog.page < catalog.pageCount ? <Link className="pagination-step" href={buildCatalogHref(filters, {page: catalog.page + 1})}>Next<ChevronRight size={15} /></Link> : <span className="pagination-step disabled">Next<ChevronRight size={15} /></span>}
        </nav>}
      </main>
    </div>
  );
}

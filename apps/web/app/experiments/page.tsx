import type {Metadata} from "next";
import {ExperimentLibrary} from "../../components/experiment-library";
import {getExperimentCatalogPage} from "../../lib/experiment-catalog-data";
import type {GradeLevel, SubjectArea} from "../../lib/experiment-catalog";

export const metadata: Metadata = {
  title: "Interactive Physics Experiment Library",
  description: "Browse classroom-ready interactive physics experiments by subject, with grade context on every lesson.",
  alternates: {canonical: "/experiments"},
  openGraph: {
    title: "Interactive Physics Experiment Library",
    description: "Classroom-ready middle-school physics experiments across mechanics, electricity, waves, and fluids.",
    url: "/experiments",
    images: [{url: "/opengraph-image", width: 1200, height: 630, alt: "Science Studio interactive physics experiment library"}],
  },
  twitter: {card: "summary_large_image", title: "Interactive Physics Experiment Library", description: "Classroom-ready middle-school physics experiments across mechanics, electricity, waves, and fluids.", images: ["/opengraph-image"]},
};

interface ExperimentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const grades = new Set<GradeLevel>(["elementary", "middle", "high"]);
const subjects = new Set<SubjectArea>(["mechanics", "electricity", "waves", "fluids"]);

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ExperimentsPage({searchParams}: ExperimentsPageProps) {
  const params = await searchParams;
  const gradeValue = first(params.grade) as GradeLevel | undefined;
  const subjectValue = first(params.subject) as SubjectArea | undefined;
  const pageValue = Number.parseInt(first(params.page) ?? "1", 10);
  const filters = {
    grade: gradeValue && grades.has(gradeValue) ? gradeValue : undefined,
    subject: subjectValue && subjects.has(subjectValue) ? subjectValue : undefined,
    query: first(params.q)?.trim().slice(0, 80) || undefined,
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
  };
  const catalog = await getExperimentCatalogPage(filters);

  return <ExperimentLibrary catalog={catalog} filters={{...filters, page: catalog.page}} />;
}

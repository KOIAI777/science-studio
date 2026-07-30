export type GradeLevel = "elementary" | "middle" | "high";
export type SubjectArea = "mechanics" | "electricity" | "waves";
export type ExperimentAvailability = "free" | "pack" | "planned";

export interface ExperimentCatalogItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  gradeLevel: GradeLevel;
  subject: SubjectArea;
  availability: ExperimentAvailability;
  lessonMinutes: number;
  concepts: string[];
  preview: "incline" | "lever" | "motion" | "energy" | "circuit" | "projectile" | "collision" | "orbit" | "waves";
  published?: boolean;
  sortOrder?: number;
}

export const experimentCatalog: ExperimentCatalogItem[] = [
  {
    id: "middle-incline",
    slug: "inclined-plane",
    title: "Inclined Plane & Friction",
    summary: "Resolve gravity and predict when a block begins to slide.",
    gradeLevel: "middle",
    subject: "mechanics",
    availability: "free",
    lessonMinutes: 12,
    concepts: ["Forces", "Friction", "Acceleration"],
    preview: "incline",
  },
  {
    id: "middle-energy-track",
    slug: "energy-track",
    title: "Energy Track",
    summary: "Follow potential, kinetic, and thermal energy through one complete run.",
    gradeLevel: "middle",
    subject: "mechanics",
    availability: "free",
    lessonMinutes: 12,
    concepts: ["Energy", "Conservation", "Friction"],
    preview: "energy",
  },
];

export const EXPERIMENTS_PER_PAGE = 6;

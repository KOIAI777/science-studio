import {createClient} from "@supabase/supabase-js";
import postgres, {type Sql} from "postgres";
import {
  EXPERIMENTS_PER_PAGE,
  experimentCatalog,
  type ExperimentCatalogItem,
  type GradeLevel,
  type SubjectArea,
} from "./experiment-catalog";
import {isLocalPaidExperimentPreviewEnabled} from "./supabase/config";

export interface CatalogQuery {
  grade?: GradeLevel;
  subject?: SubjectArea;
  query?: string;
  page: number;
}

export interface CatalogPage {
  experiments: ExperimentCatalogItem[];
  total: number;
  page: number;
  pageCount: number;
  source: "supabase" | "postgres" | "local";
}

interface ExperimentRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  grade_level: GradeLevel;
  subject: SubjectArea;
  availability: ExperimentCatalogItem["availability"];
  lesson_minutes: number;
  concepts: string[];
  preview: ExperimentCatalogItem["preview"];
  published: boolean;
  sort_order: number;
}

const globalForPostgres = globalThis as typeof globalThis & {
  scienceStudioPostgres?: Sql;
};

function getLocalPostgresClient(databaseUrl: string) {
  if (!globalForPostgres.scienceStudioPostgres) {
    globalForPostgres.scienceStudioPostgres = postgres(databaseUrl, {
      max: 3,
      idle_timeout: 20,
    });
  }
  return globalForPostgres.scienceStudioPostgres;
}

function toCatalogItem(row: ExperimentRow): ExperimentCatalogItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    gradeLevel: row.grade_level,
    subject: row.subject,
    availability: row.availability,
    lessonMinutes: row.lesson_minutes,
    concepts: row.concepts,
    preview: row.preview,
    published: row.published,
    sortOrder: row.sort_order,
  };
}

function getLocalCatalogPage(filters: CatalogQuery): CatalogPage {
  const normalizedQuery = filters.query?.trim().toLowerCase() ?? "";
  const matches = experimentCatalog.filter((experiment) => {
    const gradeMatches = !filters.grade || experiment.gradeLevel === filters.grade;
    const subjectMatches = !filters.subject || experiment.subject === filters.subject;
    const queryMatches = !normalizedQuery || [experiment.title, experiment.summary, ...experiment.concepts]
      .some((value) => value.toLowerCase().includes(normalizedQuery));
    return gradeMatches && subjectMatches && queryMatches;
  });
  const pageCount = Math.max(1, Math.ceil(matches.length / EXPERIMENTS_PER_PAGE));
  const page = Math.min(filters.page, pageCount);
  const from = (page - 1) * EXPERIMENTS_PER_PAGE;

  return {
    experiments: matches.slice(from, from + EXPERIMENTS_PER_PAGE),
    total: matches.length,
    page,
    pageCount,
    source: "local",
  };
}

export async function getExperimentCatalogPage(filters: CatalogQuery): Promise<CatalogPage> {
  if (isLocalPaidExperimentPreviewEnabled()) return getLocalCatalogPage(filters);

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const sql = getLocalPostgresClient(databaseUrl);
    const query = filters.query?.trim() || null;
    const grade = filters.grade ?? null;
    const subject = filters.subject ?? null;
    const requestedFrom = (filters.page - 1) * EXPERIMENTS_PER_PAGE;
    const [countRows, rows] = await Promise.all([
      sql<{count: string}[]>`
        select count(*)::text as count
        from public.experiments
        where published = true
          and (${grade}::text is null or grade_level = ${grade}::text)
          and (${subject}::text is null or subject = ${subject}::text)
          and (${query}::text is null or search_document @@ websearch_to_tsquery('english', ${query}::text))
      `,
      sql<ExperimentRow[]>`
        select id, slug, title, summary, grade_level, subject, availability,
          lesson_minutes, concepts, preview, published, sort_order
        from public.experiments
        where published = true
          and (${grade}::text is null or grade_level = ${grade}::text)
          and (${subject}::text is null or subject = ${subject}::text)
          and (${query}::text is null or search_document @@ websearch_to_tsquery('english', ${query}::text))
        order by sort_order asc
        limit ${EXPERIMENTS_PER_PAGE} offset ${requestedFrom}
      `,
    ]);
    const total = Number(countRows[0]?.count ?? 0);
    const pageCount = Math.max(1, Math.ceil(total / EXPERIMENTS_PER_PAGE));
    if (filters.page > pageCount) return getExperimentCatalogPage({...filters, page: pageCount});
    return {
      experiments: rows.map(toCatalogItem),
      total,
      page: filters.page,
      pageCount,
      source: "postgres",
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) return getLocalCatalogPage(filters);

  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: {persistSession: false, autoRefreshToken: false},
  });
  const requestedFrom = (filters.page - 1) * EXPERIMENTS_PER_PAGE;
  const requestedTo = requestedFrom + EXPERIMENTS_PER_PAGE - 1;
  let request = supabase
    .from("experiments")
    .select("id,slug,title,summary,grade_level,subject,availability,lesson_minutes,concepts,preview,published,sort_order", {count: "exact"})
    .eq("published", true)
    .order("sort_order", {ascending: true})
    .range(requestedFrom, requestedTo);

  if (filters.grade) request = request.eq("grade_level", filters.grade);
  if (filters.subject) request = request.eq("subject", filters.subject);
  if (filters.query) request = request.textSearch("search_document", filters.query, {config: "english", type: "websearch"});

  const {data, count, error} = await request;
  if (error) {
    console.error("Supabase experiment catalog query failed; using local catalog.", error.message);
    return getLocalCatalogPage(filters);
  }

  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / EXPERIMENTS_PER_PAGE));
  if (filters.page > pageCount) return getExperimentCatalogPage({...filters, page: pageCount});

  return {
    experiments: (data as ExperimentRow[]).map(toCatalogItem),
    total,
    page: filters.page,
    pageCount,
    source: "supabase",
  };
}

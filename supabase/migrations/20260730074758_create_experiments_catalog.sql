do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end;
$$;

create table public.experiments (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text not null,
  grade_level text not null check (grade_level in ('elementary', 'middle', 'high')),
  subject text not null check (subject in ('mechanics', 'electricity', 'waves')),
  availability text not null check (availability in ('free', 'pack', 'planned')),
  lesson_minutes integer not null check (lesson_minutes between 1 and 180),
  concepts text[] not null default '{}',
  preview text not null check (preview in ('incline', 'lever', 'motion', 'energy', 'circuit', 'projectile', 'collision', 'orbit', 'waves')),
  published boolean not null default false,
  sort_order integer not null default 0,
  search_document tsvector not null default ''::tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create schema if not exists private;

create function private.set_experiment_search_document()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.search_document := to_tsvector(
    'english'::regconfig,
    new.title || ' ' || new.summary || ' ' || array_to_string(new.concepts, ' ')
  );
  return new;
end;
$$;

create trigger set_experiment_search_document
before insert or update of title, summary, concepts
on public.experiments
for each row execute function private.set_experiment_search_document();

create index experiments_catalog_order_idx on public.experiments (published, sort_order);
create index experiments_grade_subject_idx on public.experiments (grade_level, subject);
create index experiments_search_idx on public.experiments using gin (search_document);

alter table public.experiments enable row level security;

grant select on public.experiments to anon, authenticated;

create policy "published experiments are publicly readable"
on public.experiments
for select
to anon, authenticated
using (published = true);

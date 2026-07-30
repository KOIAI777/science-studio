insert into public.experiments
  (id, slug, title, summary, grade_level, subject, availability, lesson_minutes, concepts, preview, published, sort_order)
values
  ('middle-incline', 'inclined-plane', 'Inclined Plane & Friction', 'Resolve gravity and predict when a block begins to slide.', 'middle', 'mechanics', 'free', 12, array['Forces', 'Friction', 'Acceleration'], 'incline', true, 10),
  ('middle-energy-track', 'energy-track', 'Energy Track', 'Follow potential, kinetic, and thermal energy through one complete run.', 'middle', 'mechanics', 'free', 12, array['Energy', 'Conservation', 'Friction'], 'energy', true, 20)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  grade_level = excluded.grade_level,
  subject = excluded.subject,
  availability = excluded.availability,
  lesson_minutes = excluded.lesson_minutes,
  concepts = excluded.concepts,
  preview = excluded.preview,
  published = excluded.published,
  sort_order = excluded.sort_order,
  updated_at = now();

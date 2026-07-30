insert into public.experiments
  (id, slug, title, summary, grade_level, subject, availability, lesson_minutes, concepts, preview, published, sort_order)
values
  ('middle-incline', 'inclined-plane', 'Inclined Plane & Friction', 'Resolve gravity and predict when a block begins to slide.', 'middle', 'mechanics', 'free', 12, array['Forces', 'Friction', 'Acceleration'], 'incline', true, 10),
  ('middle-energy-track', 'energy-track', 'Energy Track', 'Follow potential, kinetic, and thermal energy through one complete run.', 'middle', 'mechanics', 'free', 12, array['Energy', 'Conservation', 'Friction'], 'energy', true, 20),
  ('middle-forces-motion', 'forces-and-motion', 'Forces & Motion', 'Balance friction, find the net force, and follow the motion after a push ends.', 'middle', 'mechanics', 'free', 10, array['Net Force', 'Friction', 'Newton''s Second Law'], 'motion', true, 30),
  ('middle-ohms-law', 'ohms-law', 'Ohm''s Law Lab', 'Close a single circuit, measure current, and test how voltage and resistance are related.', 'middle', 'electricity', 'free', 10, array['Voltage', 'Current', 'Resistance', 'Ohm''s Law'], 'circuit', true, 40)
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

insert into public.experiments
  (id, slug, title, summary, grade_level, subject, availability, lesson_minutes, concepts, preview, published, sort_order)
values
  ('middle-incline', 'inclined-plane', 'Inclined Plane & Friction', 'Resolve gravity and predict when a block begins to slide.', 'middle', 'mechanics', 'free', 12, array['Forces', 'Friction', 'Acceleration'], 'incline', true, 10),
  ('middle-energy-track', 'energy-track', 'Energy Track', 'Follow potential, kinetic, and thermal energy through one complete run.', 'middle', 'mechanics', 'free', 12, array['Energy', 'Conservation', 'Friction'], 'energy', true, 20),
  ('middle-forces-motion', 'forces-and-motion', 'Forces & Motion', 'Balance friction, find the net force, and follow the motion after a push ends.', 'middle', 'mechanics', 'free', 10, array['Net Force', 'Friction', 'Newton''s Second Law'], 'motion', true, 30),
  ('middle-ohms-law', 'ohms-law', 'Ohm''s Law Lab', 'Close a single circuit, measure current, and test how voltage and resistance are related.', 'middle', 'electricity', 'free', 10, array['Voltage', 'Current', 'Resistance', 'Ohm''s Law'], 'circuit', true, 40),
  ('middle-dc-circuits', 'dc-circuits', 'DC Circuits: Series & Parallel', 'Compare current, voltage, and power in three fixed DC circuit topologies.', 'middle', 'electricity', 'pack', 15, array['Series Circuits', 'Parallel Circuits', 'Equivalent Resistance', 'Kirchhoff''s Laws'], 'circuit', true, 50),
  ('middle-traveling-wave', 'waves', 'Waves: Frequency, Wavelength & Speed', 'Measure a traveling wave and compare how frequency changes wavelength at a fixed speed.', 'middle', 'waves', 'pack', 12, array['Amplitude', 'Frequency', 'Wavelength', 'Wave Speed'], 'waves', true, 60),
  ('middle-density-buoyancy', 'density-buoyancy', 'Density & Buoyancy: Float, Sink or Suspend', 'Compare the same object in two fluids and connect displaced volume to buoyant force.', 'middle', 'fluids', 'pack', 15, array['Density', 'Buoyant Force', 'Displacement', 'Archimedes'' Principle'], 'buoyancy', true, 70),
  ('middle-momentum-collisions', 'momentum-collisions', 'Momentum & Collisions', 'Compare elastic and inelastic cart collisions using momentum, impulse, and kinetic energy.', 'middle', 'mechanics', 'pack', 15, array['Momentum', 'Impulse', 'Collisions', 'Energy Transfer'], 'collision', true, 80),
  ('middle-refraction-tir', 'refraction-total-internal-reflection', 'Refraction & Total Internal Reflection', 'Construct reflected and refracted rays, apply Snell''s law, and test the critical-angle condition.', 'middle', 'optics', 'pack', 15, array['Reflection', 'Refraction', 'Snell''s Law', 'Critical Angle'], 'optics', true, 90),
  ('middle-levers-balance', 'levers-and-balance', 'Levers & Balance: Moments in Equilibrium', 'Compare opposing moments about one pivot and solve the missing mass or lever arm for balance.', 'middle', 'mechanics', 'pack', 15, array['Moments', 'Torque', 'Equilibrium', 'Levers'], 'lever', true, 100)
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

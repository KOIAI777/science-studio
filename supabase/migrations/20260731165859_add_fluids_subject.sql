alter table public.experiments
  drop constraint if exists experiments_subject_check;

alter table public.experiments
  add constraint experiments_subject_check
  check (subject in ('mechanics', 'electricity', 'waves', 'fluids'));

alter table public.experiments
  drop constraint if exists experiments_preview_check;

alter table public.experiments
  add constraint experiments_preview_check
  check (preview in ('incline', 'lever', 'motion', 'energy', 'circuit', 'projectile', 'collision', 'orbit', 'waves', 'buoyancy'));

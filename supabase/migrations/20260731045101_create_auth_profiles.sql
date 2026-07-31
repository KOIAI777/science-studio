create type public.user_role as enum ('teacher', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  role public.user_role not null default 'teacher',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;
grant usage on type public.user_role to authenticated;

create policy "users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    'teacher'::public.user_role
  );
  return new;
end;
$$;

insert into public.profiles (id, display_name, role)
select
  id,
  nullif(trim(coalesce(raw_user_meta_data ->> 'full_name', '')), ''),
  'teacher'::public.user_role
from auth.users
on conflict (id) do nothing;

create trigger create_profile_after_user_signup
after insert on auth.users
for each row execute function private.create_profile_for_new_user();

create function private.set_profile_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_profile_updated_at
before update on public.profiles
for each row execute function private.set_profile_updated_at();

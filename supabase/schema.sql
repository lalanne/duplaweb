-- Dupla Consulting — auth schema
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run.

-- 1. User roles: a candidate (job seeker) or a company (employer).
create type public.user_role as enum ('candidate', 'company');

-- 2. Profile row per user, linked 1:1 to the auth user.
create table public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  role         public.user_role not null,
  display_name text,
  email        text,
  created_at   timestamptz not null default now()
);

-- 3. Row-level security: each user can only see/edit their own profile.
alter table public.profiles enable row level security;

create policy "Profiles are viewable by their owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 4. Auto-create a profile when a new auth user signs up, reading the
--    role + display_name we pass as user metadata during signUp().
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'candidate'),
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.email
    ),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Test results: one row per completed assessment (e.g. Mini-IPIP Big Five).
create table public.test_results (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  test_key          text not null default 'mini_ipip',
  extraversion      numeric(3, 2) not null,
  agreeableness     numeric(3, 2) not null,
  conscientiousness numeric(3, 2) not null,
  neuroticism       numeric(3, 2) not null,
  openness          numeric(3, 2) not null,
  answers           jsonb not null,
  created_at        timestamptz not null default now()
);

alter table public.test_results enable row level security;

create policy "Users can view their own results"
  on public.test_results for select
  using (auth.uid() = user_id);

create policy "Users can insert their own results"
  on public.test_results for insert
  with check (auth.uid() = user_id);

-- 6. Let companies browse candidates and their results.
-- Helper reads the caller's role with definer rights to avoid RLS recursion.
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "Companies can view candidate profiles"
  on public.profiles for select
  using (role = 'candidate' and public.current_user_role() = 'company');

create policy "Companies can view candidate results"
  on public.test_results for select
  using (public.current_user_role() = 'company');

-- Foreign key so PostgREST can embed the candidate's profile into result queries.
alter table public.test_results
  add constraint test_results_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- 7. Richer candidate profile: contact details + professional info that
--    companies can read to decide if they're interested in a candidate.
--    Existing RLS already lets the owner update and companies select these.
alter table public.profiles
  add column if not exists phone            text,
  add column if not exists contact_email    text,
  add column if not exists birth_date       date,
  add column if not exists location         text,  -- comuna / región
  add column if not exists headline         text,  -- e.g. "Ingeniero Comercial"
  add column if not exists summary          text,  -- "sobre mí"
  add column if not exists linkedin_url     text,
  add column if not exists years_experience smallint,
  add column if not exists education_level  text,
  add column if not exists desired_role     text,
  add column if not exists cv_path          text;  -- object path inside the `cvs` bucket

-- 8. Private storage bucket for CVs. Each candidate keeps a single file at
--    cvs/<user_id>/cv.<ext>; companies read it through short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

-- Candidates manage only files inside their own user-id folder.
create policy "Candidates manage own CV"
  on storage.objects for all
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

-- Companies can read any CV (needed to mint signed URLs server-side).
create policy "Companies can read CVs"
  on storage.objects for select
  using (bucket_id = 'cvs' and public.current_user_role() = 'company');

-- 9. Admin role: Dupla Consulting matchmakers. They see every candidate and
--    every company and decide which candidates become visible to which company.
--    NB: comparisons below use ::text so this whole file can run in one go
--    (a freshly-added enum value can't be referenced as a literal in the same
--    transaction).
alter type public.user_role add value if not exists 'admin';

-- 10. Matches: an admin makes a candidate visible to a specific company.
create table if not exists public.matches (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  company_id   uuid not null references public.profiles(id) on delete cascade,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  unique (candidate_id, company_id)
);

alter table public.matches enable row level security;

-- Security-definer helper: is the calling company matched to this candidate?
-- Definer rights keep the matches lookup out of the caller's RLS scope.
create or replace function public.is_candidate_visible(candidate uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.matches m
    where m.candidate_id = candidate and m.company_id = auth.uid()
  );
$$;

-- 11. Re-scope visibility now that matches gate company access.

-- Admins see everything.
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.current_user_role()::text = 'admin');

create policy "Admins can view all results"
  on public.test_results for select
  using (public.current_user_role()::text = 'admin');

-- Companies no longer see every candidate — only the ones matched to them.
drop policy if exists "Companies can view candidate profiles" on public.profiles;
drop policy if exists "Companies can view candidate results" on public.test_results;

create policy "Companies see matched candidates"
  on public.profiles for select
  using (
    role = 'candidate'
    and public.current_user_role() = 'company'
    and public.is_candidate_visible(id)
  );

create policy "Companies see matched results"
  on public.test_results for select
  using (
    public.current_user_role() = 'company'
    and public.is_candidate_visible(user_id)
  );

-- Matches: admins manage; the matched company and candidate can read theirs.
create policy "Admins manage matches"
  on public.matches for all
  using (public.current_user_role()::text = 'admin')
  with check (public.current_user_role()::text = 'admin');

create policy "Companies read their matches"
  on public.matches for select
  using (company_id = auth.uid());

create policy "Candidates read their matches"
  on public.matches for select
  using (candidate_id = auth.uid());

-- CV access follows the same rules: admins read all; companies read only the
-- CVs of candidates matched to them (path is cvs/<candidate_id>/cv.<ext>).
drop policy if exists "Companies can read CVs" on storage.objects;

create policy "Admins read CVs"
  on storage.objects for select
  using (bucket_id = 'cvs' and public.current_user_role()::text = 'admin');

create policy "Companies read matched CVs"
  on storage.objects for select
  using (
    bucket_id = 'cvs'
    and public.current_user_role() = 'company'
    and public.is_candidate_visible(((storage.foldername(name))[1])::uuid)
  );

-- 12. Recruitment processes ("Procesos"): a search an admin runs for a company.
--     Admins create/update/delete; the owning company can read its own.
create table if not exists public.processes (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  role_name   text not null,
  description text,
  stage       text not null default 'solicitud_recibida',
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.processes enable row level security;

create policy "Admins manage processes"
  on public.processes for all
  using (public.current_user_role()::text = 'admin')
  with check (public.current_user_role()::text = 'admin');

create policy "Companies read their processes"
  on public.processes for select
  using (company_id = auth.uid());

-- 13. Process events: each stage change is logged so the company sees a
--     package-tracking-style timeline with timestamps.
create table if not exists public.process_events (
  id         uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  stage      text not null,
  note       text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.process_events enable row level security;

-- Security-definer helper keeps the processes lookup out of the caller's scope.
create or replace function public.owns_process(pid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.processes p
    where p.id = pid and p.company_id = auth.uid()
  );
$$;

create policy "Admins manage process events"
  on public.process_events for all
  using (public.current_user_role()::text = 'admin')
  with check (public.current_user_role()::text = 'admin');

create policy "Companies read their process events"
  on public.process_events for select
  using (public.owns_process(process_id));

-- Dupla Consulting — auth schema
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run.

-- 1. User roles: a candidate (job seeker) or a company (employer).
create type public.user_role as enum ('candidate', 'company');

-- 2. Profile row per user, linked 1:1 to the auth user.
create table public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  role         public.user_role not null,
  display_name text,
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
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'candidate'),
    new.raw_user_meta_data ->> 'display_name'
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

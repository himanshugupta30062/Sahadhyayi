-- Separate, private assessment history for Explain Science Around You.
-- This table is intentionally independent from brain_assessment_attempts / IQ Test.
create table if not exists public.everyday_science_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_count integer not null default 10 check (question_count between 1 and 20),
  overall_score integer not null check (overall_score between 0 and 100),
  category_scores jsonb not null default '{}'::jsonb
    check (jsonb_typeof(category_scores) = 'object'),
  answers jsonb not null default '[]'::jsonb
    check (jsonb_typeof(answers) = 'array'),
  evaluation jsonb not null default '{}'::jsonb
    check (jsonb_typeof(evaluation) = 'object'),
  question_set_version text not null default 'everyday-science-v1'
    check (char_length(question_set_version) between 1 and 60),
  created_at timestamptz not null default now()
);

create index if not exists everyday_science_attempts_user_created_idx
  on public.everyday_science_attempts (user_id, created_at desc);

alter table public.everyday_science_attempts enable row level security;

drop policy if exists "Users can read their own everyday science attempts"
  on public.everyday_science_attempts;
create policy "Users can read their own everyday science attempts"
  on public.everyday_science_attempts
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own everyday science attempts"
  on public.everyday_science_attempts;
create policy "Users can create their own everyday science attempts"
  on public.everyday_science_attempts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own everyday science attempts"
  on public.everyday_science_attempts;
create policy "Users can delete their own everyday science attempts"
  on public.everyday_science_attempts
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.everyday_science_attempts from anon, public;
grant select, insert, delete on table public.everyday_science_attempts to authenticated;

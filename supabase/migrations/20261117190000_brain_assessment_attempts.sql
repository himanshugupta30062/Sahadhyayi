-- Persist signed-in users' completed IQ practice attempts without storing answer keys.
create table if not exists public.brain_assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'general'
    check (mode in ('general', 'practice', 'daily', 'visual', 'classical', 'cognitive')),
  difficulty text
    check (difficulty is null or difficulty in ('Easy', 'Medium', 'Hard')),
  question_count integer not null check (question_count > 0 and question_count <= 200),
  correct_count integer not null check (correct_count >= 0 and correct_count <= question_count),
  duration_seconds integer not null default 0 check (duration_seconds >= 0 and duration_seconds <= 14400),
  domain_scores jsonb not null default '{}'::jsonb
    check (jsonb_typeof(domain_scores) = 'object'),
  question_set_version text not null default 'v1'
    check (char_length(question_set_version) between 1 and 40),
  completed_at timestamptz not null default now()
);

create index if not exists brain_assessment_attempts_user_completed_idx
  on public.brain_assessment_attempts (user_id, completed_at desc);

alter table public.brain_assessment_attempts enable row level security;

drop policy if exists "Users can read their own brain assessment attempts"
  on public.brain_assessment_attempts;
create policy "Users can read their own brain assessment attempts"
  on public.brain_assessment_attempts
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own brain assessment attempts"
  on public.brain_assessment_attempts;
create policy "Users can create their own brain assessment attempts"
  on public.brain_assessment_attempts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own brain assessment attempts"
  on public.brain_assessment_attempts;
create policy "Users can delete their own brain assessment attempts"
  on public.brain_assessment_attempts
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.brain_assessment_attempts from anon, public;
grant select, insert, delete on table public.brain_assessment_attempts to authenticated;

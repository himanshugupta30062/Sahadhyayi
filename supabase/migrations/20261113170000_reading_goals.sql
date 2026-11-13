-- Personal annual reading goals; private to each reader.
create table if not exists public.reading_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_year integer not null check (goal_year between 2000 and 2100),
  target_books integer not null default 12 check (target_books between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, goal_year)
);
alter table public.reading_goals enable row level security;
drop policy if exists "Readers manage their own goals" on public.reading_goals;
create policy "Readers manage their own goals" on public.reading_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists reading_goals_user_year_idx on public.reading_goals(user_id, goal_year desc);

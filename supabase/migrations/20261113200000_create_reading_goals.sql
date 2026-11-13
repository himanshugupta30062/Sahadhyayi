create table if not exists public.reading_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  annual_book_target integer not null default 24 check (annual_book_target between 1 and 500),
  monthly_page_target integer not null default 100 check (monthly_page_target between 1 and 100000),
  updated_at timestamptz not null default now()
);
alter table public.reading_goals enable row level security;
create policy "Users can view their own reading goals"
  on public.reading_goals for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert their own reading goals"
  on public.reading_goals for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own reading goals"
  on public.reading_goals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

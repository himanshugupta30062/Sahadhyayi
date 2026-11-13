-- Reading habit P0: durable daily log entries with owner-only journal notes.
-- Keep reading_progress as the current bookmark; reading_logs is the append-only history.
create table if not exists public.reading_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books_library(id) on delete cascade,
  pages_read integer check (pages_read is null or pages_read > 0),
  current_page integer check (current_page is null or current_page > 0),
  total_pages integer check (total_pages is null or total_pages > 0),
  minutes_read integer check (minutes_read is null or minutes_read > 0),
  percentage numeric(5,2) check (percentage is null or (percentage >= 0 and percentage <= 100)),
  journal_note text check (journal_note is null or char_length(journal_note) <= 5000),
  logged_at timestamptz not null default now(),
  constraint reading_logs_has_activity check (
    pages_read is not null or current_page is not null or minutes_read is not null or journal_note is not null
  )
);
create index if not exists reading_logs_user_logged_at_idx
  on public.reading_logs(user_id, logged_at desc);
create index if not exists reading_logs_user_book_idx
  on public.reading_logs(user_id, book_id, logged_at desc);
alter table public.reading_logs enable row level security;
drop policy if exists "Readers manage their own reading logs" on public.reading_logs;
create policy "Readers manage their own reading logs"
  on public.reading_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id;

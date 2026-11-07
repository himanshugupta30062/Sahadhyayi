-- Reader text highlights are private and synced across a reader's devices.
create table if not exists public.reader_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books_library(id) on delete cascade,
  text text not null check (length(trim(text)) > 0 and length(text) <= 10000),
  location text,
  page integer not null default 1 check (page > 0),
  color text not null default 'yellow' check (color in ('yellow', 'green', 'blue', 'pink')),
  created_at timestamptz not null default now()
);
create index if not exists reader_highlights_user_book_idx
  on public.reader_highlights(user_id, book_id, created_at desc);
alter table public.reader_highlights enable row level security;
drop policy if exists "Users manage their own reader highlights" on public.reader_highlights;
create policy "Users manage their own reader highlights"
  on public.reader_highlights for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

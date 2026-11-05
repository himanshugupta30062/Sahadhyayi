-- Persistent, cross-device reader bookmarks.
create table if not exists public.reader_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books_library(id) on delete cascade,
  location text not null,
  page integer not null default 1 check (page > 0),
  label text,
  created_at timestamptz not null default now(),
  unique (user_id, book_id, location)
);
create index if not exists reader_bookmarks_user_book_idx
  on public.reader_bookmarks(user_id, book_id, created_at desc);
alter table public.reader_bookmarks enable row level security;
drop policy if exists "Users manage their own reader bookmarks" on public.reader_bookmarks;
create policy "Users manage their own reader bookmarks"
  on public.reader_bookmarks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Private notes are personal journal entries and never visible to other readers.
alter table public.margin_notes drop constraint if exists margin_notes_visibility_check;
alter table public.margin_notes add constraint margin_notes_visibility_check
  check (visibility in ('public', 'friends', 'private'));

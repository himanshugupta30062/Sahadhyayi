-- Private cloud storage for reader-saved quotes.
-- Quotes are personal by default; sharing belongs to a separate explicit feature.
create table if not exists public.saved_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quote_text text not null check (char_length(trim(quote_text)) between 1 and 10000),
  source text,
  note text,
  book_id uuid references public.books_library(id) on delete set null,
  page integer check (page is null or page >= 0),
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_quotes_user_created_idx
  on public.saved_quotes (user_id, created_at desc);

alter table public.saved_quotes enable row level security;

create policy "Users can read their own saved quotes"
  on public.saved_quotes for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own saved quotes"
  on public.saved_quotes for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own saved quotes"
  on public.saved_quotes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own saved quotes"
  on public.saved_quotes for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.saved_quotes to authenticated;

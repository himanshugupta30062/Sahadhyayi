-- 1) Table
create table if not exists public.book_ratings (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books_library(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (book_id, user_id)
);

-- 2) Helpful indexes
create index if not exists idx_book_ratings_book_id on public.book_ratings(book_id);
create index if not exists idx_book_ratings_user_id on public.book_ratings(user_id);

-- 3) Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_book_ratings_updated_at on public.book_ratings;
create trigger trg_book_ratings_updated_at
before update on public.book_ratings
for each row execute function public.set_updated_at();

-- 4) View for aggregates
create or replace view public.book_ratings_agg as
select
  br.book_id,
  avg(br.rating)::numeric(3,2) as avg_rating,
  count(*)::int as rating_count
from public.book_ratings br
group by br.book_id;

-- 5) RLS
alter table public.book_ratings enable row level security;

-- Allow anyone to read aggregates via the view
-- (Views inherit RLS from base table; use a policy to allow select on base rows)
create policy book_ratings_select
on public.book_ratings
for select using (true);

-- Insert/Upsert: only the logged-in user can insert their own rating
create policy book_ratings_insert
on public.book_ratings
for insert
to authenticated
with check (auth.uid() = user_id);

-- Update: only the owner can update their rating
create policy book_ratings_update
on public.book_ratings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Delete (optional): allow user to remove their own rating
create policy book_ratings_delete
on public.book_ratings
for delete
to authenticated
using (auth.uid() = user_id);

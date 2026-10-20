-- Durable, spoiler-aware reader reviews. Ratings remain in book_ratings.
create table if not exists public.book_reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books_library(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  review_text text not null check (char_length(btrim(review_text)) between 1 and 5000),
  contains_spoilers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_reviews_one_per_user_book unique (book_id, user_id)
);

create index if not exists idx_book_reviews_book_created
  on public.book_reviews(book_id, created_at desc);
create index if not exists idx_book_reviews_user
  on public.book_reviews(user_id);

alter table public.book_reviews enable row level security;

drop policy if exists "Authenticated readers can view book reviews" on public.book_reviews;
create policy "Authenticated readers can view book reviews"
  on public.book_reviews for select to authenticated using (true);

drop policy if exists "Readers can create their own book reviews" on public.book_reviews;
create policy "Readers can create their own book reviews"
  on public.book_reviews for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Readers can update their own book reviews" on public.book_reviews;
create policy "Readers can update their own book reviews"
  on public.book_reviews for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Readers can delete their own book reviews" on public.book_reviews;
create policy "Readers can delete their own book reviews"
  on public.book_reviews for delete to authenticated using (auth.uid() = user_id);

drop trigger if exists trg_book_reviews_updated_at on public.book_reviews;
create trigger trg_book_reviews_updated_at
  before update on public.book_reviews
  for each row execute function public.set_updated_at();

revoke all on public.book_reviews from anon;
grant select, insert, update, delete on public.book_reviews to authenticated;

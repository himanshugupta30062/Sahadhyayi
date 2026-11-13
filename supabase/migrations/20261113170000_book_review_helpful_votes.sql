-- Persistent helpful votes for book reviews. One vote per reader/review.
create table if not exists public.book_review_helpful_votes (
 review_id uuid not null references public.book_reviews(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (review_id,user_id)
);
create index if not exists idx_book_review_helpful_votes_review on public.book_review_helpful_votes(review_id);
alter table public.book_review_helpful_votes enable row level security;
drop policy if exists "Authenticated readers can view review helpful votes" on public.book_review_helpful_votes;
create policy "Authenticated readers can view review helpful votes" on public.book_review_helpful_votes for select to authenticated using (true);
drop policy if exists "Readers can vote helpful on others reviews" on public.book_review_helpful_votes;
create policy "Readers can vote helpful on others reviews" on public.book_review_helpful_votes for insert to authenticated with check (auth.uid()=user_id and exists (select 1 from public.book_reviews br where br.id=review_id and br.user_id<>auth.uid()));
drop policy if exists "Readers can remove own helpful vote" on public.book_review_helpful_votes;
create policy "Readers can remove own helpful vote" on public.book_review_helpful_votes for delete to authenticated using (auth.uid()=user_id);

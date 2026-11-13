-- Rich review dimensions and reader emotion, extending the existing durable book_reviews model.
-- Scores are optional so readers can write a review without rating every dimension.
create table if not exists public.book_review_dimensions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.book_reviews(id) on delete cascade,
  dimension text not null check (dimension in ('writing','characters','plot','pacing','worldbuilding','originality')),
  score smallint not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_review_dimensions_one_per_review unique (review_id, dimension)
);

create index if not exists idx_book_review_dimensions_review
  on public.book_review_dimensions(review_id);

alter table public.book_review_dimensions enable row level security;

drop policy if exists "Readers can view review dimensions" on public.book_review_dimensions;
create policy "Readers can view review dimensions"
  on public.book_review_dimensions for select to authenticated using (true);

drop policy if exists "Review authors manage dimensions" on public.book_review_dimensions;
create policy "Review authors manage dimensions"
  on public.book_review_dimensions for all to authenticated
  using (exists (
    select 1 from public.book_reviews r
    where r.id = review_id and r.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.book_reviews r
    where r.id = review_id and r.user_id = auth.uid()
  ));

revoke all on public.book_review_dimensions from public, anon;
grant select, insert, update, delete on public.book_review_dimensions to authenticated;

-- A single optional mood reaction describes the reviewer's experience.
alter table public.book_reviews
  add column if not exists reader_reaction text
  check (reader_reaction is null or reader_reaction in
    ('joyful','thoughtful','inspired','heartbroken','tense','surprised','comforted','challenged'));


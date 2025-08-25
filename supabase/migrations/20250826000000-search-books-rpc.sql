-- Enable required extensions
create extension if not exists unaccent;
create extension if not exists pg_trgm;

-- Indexes for performance
create index if not exists books_library_search_gin on public.books_library using gin(search_vec);
create index if not exists books_library_title_trgm on public.books_library using gin(title gin_trgm_ops);
create index if not exists books_library_author_trgm on public.books_library using gin(author gin_trgm_ops);

-- RPC: search_books
create or replace function public.search_books(
  q text,
  max_results int,
  lang text default null,
  min_popularity numeric default null,
  genres_filter text[] default null
) returns table (
  id uuid,
  title text,
  author text,
  genres text[],
  language text,
  cover_url text,
  popularity numeric,
  snippet text,
  rank numeric
) security definer stable
language plpgsql as $$
declare
  query tsquery;
begin
  query := websearch_to_tsquery('simple', unaccent(q));
  return query
  with ranked as (
    select
      b.id,
      b.title,
      b.author,
      b.genres,
      b.language,
      b.cover_url,
      b.popularity,
      ts_rank_cd(b.search_vec, query) + similarity(b.title, q) * 0.5 + similarity(b.author, q) * 0.3 as rank,
      ts_headline(
        'simple',
        coalesce(b.description, ''),
        query,
        'MaxFragments=2, MinWords=5, MaxWords=12, StartSel=<mark>, StopSel=</mark>'
      ) as snippet
    from public.books_library b
    where
      (
        b.search_vec @@ query
        or similarity(b.title, q) > 0.25
        or similarity(b.author, q) > 0.25
      )
      and (lang is null or b.language = lang)
      and (min_popularity is null or b.popularity >= min_popularity)
      and (genres_filter is null or array_length(genres_filter,1) = 0 or b.genres && genres_filter)
  )
  select *
  from ranked
  order by rank desc
  limit greatest(10, max_results);
end;
$$;

grant execute on function public.search_books(text,int,text,numeric,text[]) to anon, authenticated;

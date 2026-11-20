-- From Page to Screen: curated book-to-film adaptation catalogue.
-- Book records remain owned by books_library; this feature only references them.
create table if not exists public.adaptation_movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  release_year integer check (release_year is null or release_year between 1888 and 2200),
  director text,
  original_language text,
  country text,
  runtime_minutes integer check (runtime_minutes is null or runtime_minutes > 0),
  poster_url text,
  synopsis text,
  official_trailer_url text,
  metadata_source_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_movie_adaptations (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.adaptation_movies(id) on delete cascade,
  book_library_id uuid references public.books_library(id) on delete set null,
  book_title text not null,
  book_author text,
  book_publication_year integer,
  book_cover_url text,
  genre text,
  language text,
  adaptation_type text not null default 'film' check (adaptation_type in ('film', 'television', 'streaming', 'short_film', 'other')),
  synopsis text,
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  source_url text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_movie_adaptations_movie_book_title_unique unique (movie_id, book_title)
);

create index if not exists idx_adaptation_movies_status_year
  on public.adaptation_movies (status, release_year desc);
create index if not exists idx_adaptation_movies_title
  on public.adaptation_movies using gin (to_tsvector('simple', title));
create index if not exists idx_book_movie_adaptations_status_featured
  on public.book_movie_adaptations (status, is_featured desc, created_at desc);
create index if not exists idx_book_movie_adaptations_book_library
  on public.book_movie_adaptations (book_library_id) where book_library_id is not null;
create index if not exists idx_book_movie_adaptations_genre
  on public.book_movie_adaptations (genre);

alter table public.adaptation_movies enable row level security;
alter table public.book_movie_adaptations enable row level security;

drop policy if exists "Published adaptation movies are publicly readable" on public.adaptation_movies;
create policy "Published adaptation movies are publicly readable"
  on public.adaptation_movies for select to anon, authenticated
  using (status = 'published');

drop policy if exists "Published book movie adaptations are publicly readable" on public.book_movie_adaptations;
create policy "Published book movie adaptations are publicly readable"
  on public.book_movie_adaptations for select to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.adaptation_movies movie
      where movie.id = book_movie_adaptations.movie_id and movie.status = 'published'
    )
  );

revoke all on public.adaptation_movies from anon, authenticated;
revoke all on public.book_movie_adaptations from anon, authenticated;
grant select on public.adaptation_movies to anon, authenticated;
grant select on public.book_movie_adaptations to anon, authenticated;
grant all on public.adaptation_movies to service_role;
grant all on public.book_movie_adaptations to service_role;

comment on table public.adaptation_movies is
  'Movie and screen-adaptation metadata for Sahadhyayi From Page to Screen.';
comment on table public.book_movie_adaptations is
  'Links a screen adaptation to its original book; book_library_id reuses books_library records when available.';

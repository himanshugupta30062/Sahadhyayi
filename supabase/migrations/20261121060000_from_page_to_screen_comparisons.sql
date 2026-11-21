-- Structured, source-backed book-to-screen comparisons and admin authoring access.
create table if not exists public.adaptation_sources (
  id uuid primary key default gen_random_uuid(),
  adaptation_id uuid not null references public.book_movie_adaptations(id) on delete cascade,
  label text not null,
  source_url text not null,
  source_type text not null default 'editorial' check (source_type in ('official', 'publisher', 'book_text', 'film_credit', 'interview', 'editorial', 'other')),
  notes text,
  verification_status text not null default 'needs_review' check (verification_status in ('needs_review', 'verified', 'disputed')),
  created_at timestamptz not null default now()
);

create table if not exists public.adaptation_story_differences (
  id uuid primary key default gen_random_uuid(),
  adaptation_id uuid not null references public.book_movie_adaptations(id) on delete cascade,
  source_id uuid references public.adaptation_sources(id) on delete set null,
  category text not null default 'plot' check (category in ('opening', 'plot', 'subplot', 'scene_added', 'scene_removed', 'timeline', 'ending', 'theme', 'other')),
  title text not null,
  book_summary text not null,
  movie_summary text not null,
  narrative_impact text,
  spoiler_level text not null default 'spoiler' check (spoiler_level in ('spoiler_free', 'spoiler')),
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.adaptation_character_comparisons (
  id uuid primary key default gen_random_uuid(),
  adaptation_id uuid not null references public.book_movie_adaptations(id) on delete cascade,
  source_id uuid references public.adaptation_sources(id) on delete set null,
  character_name text not null,
  change_type text not null default 'portrayal_changed' check (change_type in ('faithful', 'portrayal_changed', 'removed', 'introduced', 'relationship_changed', 'arc_changed')),
  book_portrayal text,
  movie_portrayal text,
  comparison_notes text,
  spoiler_level text not null default 'spoiler' check (spoiler_level in ('spoiler_free', 'spoiler')),
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_adaptation_sources_adaptation on public.adaptation_sources(adaptation_id);
create index if not exists idx_adaptation_story_public on public.adaptation_story_differences(adaptation_id, status, sort_order);
create index if not exists idx_adaptation_characters_public on public.adaptation_character_comparisons(adaptation_id, status, sort_order);

alter table public.adaptation_sources enable row level security;
alter table public.adaptation_story_differences enable row level security;
alter table public.adaptation_character_comparisons enable row level security;

grant select, insert, update, delete on public.adaptation_movies to authenticated;
grant select, insert, update, delete on public.book_movie_adaptations to authenticated;
grant select, insert, update, delete on public.adaptation_sources to authenticated;
grant select, insert, update, delete on public.adaptation_story_differences to authenticated;
grant select, insert, update, delete on public.adaptation_character_comparisons to authenticated;

drop policy if exists "Admins manage adaptation movies" on public.adaptation_movies;
create policy "Admins manage adaptation movies" on public.adaptation_movies
for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage book movie adaptations" on public.book_movie_adaptations;
create policy "Admins manage book movie adaptations" on public.book_movie_adaptations
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Published adaptation sources are readable" on public.adaptation_sources;
create policy "Published adaptation sources are readable" on public.adaptation_sources
for select to anon, authenticated using (
  verification_status = 'verified' and exists (
    select 1 from public.book_movie_adaptations a
    join public.adaptation_movies m on m.id = a.movie_id
    where a.id = adaptation_id and a.status = 'published' and m.status = 'published'
  )
);
drop policy if exists "Admins manage adaptation sources" on public.adaptation_sources;
create policy "Admins manage adaptation sources" on public.adaptation_sources
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Published story differences are readable" on public.adaptation_story_differences;
create policy "Published story differences are readable" on public.adaptation_story_differences
for select to anon, authenticated using (
  status = 'published' and exists (
    select 1 from public.book_movie_adaptations a
    join public.adaptation_movies m on m.id = a.movie_id
    where a.id = adaptation_id and a.status = 'published' and m.status = 'published'
  )
);
drop policy if exists "Admins manage story differences" on public.adaptation_story_differences;
create policy "Admins manage story differences" on public.adaptation_story_differences
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Published character comparisons are readable" on public.adaptation_character_comparisons;
create policy "Published character comparisons are readable" on public.adaptation_character_comparisons
for select to anon, authenticated using (
  status = 'published' and exists (
    select 1 from public.book_movie_adaptations a
    join public.adaptation_movies m on m.id = a.movie_id
    where a.id = adaptation_id and a.status = 'published' and m.status = 'published'
  )
);
drop policy if exists "Admins manage character comparisons" on public.adaptation_character_comparisons;
create policy "Admins manage character comparisons" on public.adaptation_character_comparisons
for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.adaptation_sources, public.adaptation_story_differences, public.adaptation_character_comparisons from anon, authenticated;
grant select on public.adaptation_sources, public.adaptation_story_differences, public.adaptation_character_comparisons to anon, authenticated;
grant insert, update, delete on public.adaptation_sources, public.adaptation_story_differences, public.adaptation_character_comparisons to authenticated;
grant all on public.adaptation_sources, public.adaptation_story_differences, public.adaptation_character_comparisons to service_role;

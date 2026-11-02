create table if not exists public.research_paper_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  openalex_id text not null,
  paper jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint research_paper_bookmarks_user_openalex_key unique (user_id, openalex_id),
  constraint research_paper_bookmarks_openalex_id_check check (openalex_id ~ '^https://openalex\\.org/W[0-9]+$')
);

create index if not exists research_paper_bookmarks_user_created_idx
  on public.research_paper_bookmarks (user_id, created_at desc);

alter table public.research_paper_bookmarks enable row level security;
revoke all on public.research_paper_bookmarks from anon;
grant select, insert, delete on public.research_paper_bookmarks to authenticated;

create policy "Users can read their own research paper bookmarks"
  on public.research_paper_bookmarks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can save their own research papers"
  on public.research_paper_bookmarks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can remove their own research paper bookmarks"
  on public.research_paper_bookmarks for delete to authenticated
  using ((select auth.uid()) = user_id);

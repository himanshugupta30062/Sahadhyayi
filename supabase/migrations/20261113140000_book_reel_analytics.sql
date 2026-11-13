-- Book Reel view events and creator-only aggregate analytics.
create table if not exists public.book_reel_views (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.book_reels(id) on delete cascade,
  viewer_id uuid null references auth.users(id) on delete set null,
  viewed_at timestamptz not null default now()
);
create index if not exists book_reel_views_reel_viewed_idx on public.book_reel_views(reel_id, viewed_at desc);
create index if not exists book_reel_views_viewer_idx on public.book_reel_views(viewer_id) where viewer_id is not null;
alter table public.book_reel_views enable row level security;
drop policy if exists "Anyone can record reel views" on public.book_reel_views;
create policy "Anyone can record reel views" on public.book_reel_views
 for insert to anon, authenticated
 with check (viewer_id is null or viewer_id = auth.uid());
-- No direct reads: creator analytics are exposed through an aggregate RPC only.
revoke all on public.book_reel_views from anon, authenticated;
grant insert on public.book_reel_views to anon, authenticated;

create or replace function public.get_my_book_reel_analytics()
returns table(reel_id uuid, book_title text, created_at timestamptz, view_count bigint, unique_viewers bigint, reaction_count bigint, comment_count bigint)
language sql stable security definer set search_path = public
as $$
 select r.id, coalesce(r.book_title, 'Reader moment'), r.created_at,
   (select count(*) from public.book_reel_views v where v.reel_id = r.id),
   (select count(distinct v.viewer_id) from public.book_reel_views v where v.reel_id = r.id and v.viewer_id is not null),
   (select count(*) from public.book_reel_reactions x where x.reel_id = r.id),
   (select count(*) from public.book_reel_comments c where c.reel_id = r.id)
 from public.book_reels r
 where r.user_id = auth.uid()
 order by r.created_at desc;
$$;
revoke all on function public.get_my_book_reel_analytics() from public;
grant execute on function public.get_my_book_reel_analytics() to authenticated;

create table if not exists public.book_reel_retention_events (id uuid primary key default gen_random_uuid(), reel_id uuid not null references public.book_reels(id) on delete cascade, viewer_id uuid null references auth.users(id) on delete set null, checkpoint smallint not null check(checkpoint in (25,50,75,100)), created_at timestamptz not null default now(), unique(reel_id,viewer_id,checkpoint,created_at));
create index if not exists book_reel_retention_reel_idx on public.book_reel_retention_events(reel_id,checkpoint);
alter table public.book_reel_retention_events enable row level security;
drop policy if exists "Record reel retention checkpoints" on public.book_reel_retention_events;
create policy "Record reel retention checkpoints" on public.book_reel_retention_events for insert to anon,authenticated with check(viewer_id is null or viewer_id=auth.uid());
revoke all on public.book_reel_retention_events from anon,authenticated;
grant insert on public.book_reel_retention_events to anon,authenticated;
create or replace function public.get_my_book_reel_retention()
returns table(checkpoint smallint, viewers bigint)
language sql stable security definer set search_path=public as $$
 select c.checkpoint,count(distinct (e.viewer_id,e.created_at))::bigint
 from (values (25::smallint),(50::smallint),(75::smallint),(100::smallint)) c(checkpoint)
 left join public.book_reel_retention_events e on e.checkpoint=c.checkpoint and e.reel_id in (select id from public.book_reels where user_id=auth.uid())
 group by c.checkpoint order by c.checkpoint;
$$;
revoke all on function public.get_my_book_reel_retention() from public;
grant execute on function public.get_my_book_reel_retention() to authenticated;
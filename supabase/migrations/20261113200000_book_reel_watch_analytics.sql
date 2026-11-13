-- Persist authenticated Book Reel watch sessions without exposing viewer-level rows.
create table if not exists public.book_reel_watch_sessions (
 id uuid primary key default gen_random_uuid(), reel_id uuid not null references public.book_reels(id) on delete cascade,
 viewer_id uuid not null references auth.users(id) on delete cascade, session_id uuid not null,
 watched_seconds numeric(8,2) not null default 0 check (watched_seconds >= 0 and watched_seconds <= 60),
 completed boolean not null default false, updated_at timestamptz not null default now(),
 unique (reel_id, viewer_id, session_id)
);
create index if not exists book_reel_watch_sessions_reel_idx on public.book_reel_watch_sessions(reel_id);
alter table public.book_reel_watch_sessions enable row level security;
revoke all on public.book_reel_watch_sessions from anon, authenticated;
create or replace function public.record_book_reel_watch(p_reel_id uuid,p_session_id uuid,p_watched_seconds numeric,p_completed boolean default false)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if p_watched_seconds is null or p_watched_seconds<0 or p_watched_seconds>60 then raise exception 'Invalid watched duration'; end if;
 if not exists(select 1 from public.book_reels where id=p_reel_id) then raise exception 'Reel not found'; end if;
 insert into public.book_reel_watch_sessions(reel_id,viewer_id,session_id,watched_seconds,completed)
 values(p_reel_id,v_user,p_session_id,least(p_watched_seconds,10),coalesce(p_completed,false))
 on conflict(reel_id,viewer_id,session_id) do update set
 watched_seconds=greatest(book_reel_watch_sessions.watched_seconds,excluded.watched_seconds),
 completed=book_reel_watch_sessions.completed or excluded.completed,updated_at=now();
end $$;
revoke all on function public.record_book_reel_watch(uuid,uuid,numeric,boolean) from public,anon;
grant execute on function public.record_book_reel_watch(uuid,uuid,numeric,boolean) to authenticated;
create or replace function public.get_my_book_reel_watch_analytics()
returns table(reel_id uuid,book_title text,session_count bigint,completed_sessions bigint,total_watched_seconds numeric,average_watched_seconds numeric,completion_rate numeric)
language sql stable security definer set search_path=public as $$
 select r.id,coalesce(r.book_title,'Reader moment'),count(w.id),count(w.id) filter(where w.completed),
 coalesce(sum(w.watched_seconds),0),coalesce(round(avg(w.watched_seconds),2),0),
 case when count(w.id)=0 then 0 else round(100.0*(count(w.id) filter(where w.completed))/count(w.id),2) end
 from public.book_reels r left join public.book_reel_watch_sessions w on w.reel_id=r.id
 where r.user_id=auth.uid() group by r.id,r.book_title,r.created_at order by r.created_at desc;
$$;
revoke all on function public.get_my_book_reel_watch_analytics() from public,anon;
grant execute on function public.get_my_book_reel_watch_analytics() to authenticated;

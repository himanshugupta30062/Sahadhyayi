create or replace function public.get_my_book_reel_daily_analytics(p_days integer default 14)
returns table(day date, views bigint, watch_seconds bigint, completions bigint)
language sql stable security definer set search_path=public as $$
 with owned as (select id from public.book_reels where user_id=auth.uid()),
 days as (select generate_series(current_date-greatest(1,least(coalesce(p_days,14),90))+1,current_date,interval '1 day')::date as day)
 select d.day,
   (select count(*) from public.book_reel_views v join owned r on r.id=v.reel_id where v.viewed_at >= d.day and v.viewed_at < d.day+1),
   (select coalesce(sum(w.watched_seconds),0) from public.book_reel_watch_events w join owned r on r.id=w.reel_id where w.created_at >= d.day and w.created_at < d.day+1),
   (select count(*) from public.book_reel_watch_events w join owned r on r.id=w.reel_id where w.completed and w.created_at >= d.day and w.created_at < d.day+1)
 from days d order by d.day;
$$;
revoke all on function public.get_my_book_reel_daily_analytics(integer) from public;
grant execute on function public.get_my_book_reel_daily_analytics(integer) to authenticated;
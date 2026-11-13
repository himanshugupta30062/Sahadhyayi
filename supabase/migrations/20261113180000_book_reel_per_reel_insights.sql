-- Creator-only daily detail for an owned Book Reel.
create or replace function public.get_my_book_reel_daily_detail(p_reel_id uuid, p_days integer default 14)
returns table(day date, views bigint)
language sql stable security definer set search_path = public
as $$
  with owned as (
    select id from public.book_reels where id = p_reel_id and user_id = auth.uid()
  ), days as (
    select generate_series(current_date - greatest(1, least(coalesce(p_days,14),90)) + 1,
                           current_date, interval '1 day')::date as day
  )
  select d.day, count(v.id)::bigint
  from days d cross join owned o
  left join public.book_reel_views v on v.reel_id=o.id and v.viewed_at >= d.day and v.viewed_at < d.day + interval '1 day'
  group by d.day order by d.day;
$$;
revoke all on function public.get_my_book_reel_daily_detail(uuid,integer) from public;
grant execute on function public.get_my_book_reel_daily_detail(uuid,integer) to authenticated;

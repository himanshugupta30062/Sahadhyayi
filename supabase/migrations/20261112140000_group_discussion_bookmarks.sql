create table if not exists public.group_reading_discussion_bookmarks (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.group_reading_discussions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(discussion_id,user_id)
);
alter table public.group_reading_discussion_bookmarks enable row level security;
revoke all on public.group_reading_discussion_bookmarks from public, anon, authenticated;

create or replace function public.toggle_group_reading_discussion_bookmark(p_discussion_id uuid)
returns boolean language plpgsql security definer set search_path=public
as $$
declare v_group_id uuid; v_member boolean; v_exists boolean;
begin
  select group_id into v_group_id from public.group_reading_discussions where id=p_discussion_id;
  if v_group_id is null then raise exception 'Discussion not found'; end if;
  select exists(select 1 from public.group_chat_members where group_id=v_group_id and user_id=auth.uid() and status='active') into v_member;
  if not v_member then raise exception 'Active group membership required'; end if;
  select exists(select 1 from public.group_reading_discussion_bookmarks where discussion_id=p_discussion_id and user_id=auth.uid()) into v_exists;
  if v_exists then
    delete from public.group_reading_discussion_bookmarks where discussion_id=p_discussion_id and user_id=auth.uid();
    return false;
  end if;
  insert into public.group_reading_discussion_bookmarks(discussion_id,user_id) values(p_discussion_id,auth.uid()) on conflict do nothing;
  return true;
end $$;
create or replace function public.list_my_group_discussion_bookmarks()
returns table(discussion_id uuid, bookmarked_at timestamptz)
language sql security definer set search_path=public
as $$
 select b.discussion_id,b.created_at from public.group_reading_discussion_bookmarks b
 where b.user_id=auth.uid()
 and exists(select 1 from public.group_reading_discussions d join public.group_chat_members m on m.group_id=d.group_id
 where d.id=b.discussion_id and m.user_id=auth.uid() and m.status='active')
 order by b.created_at desc;
$$;
revoke all on function public.toggle_group_reading_discussion_bookmark(uuid) from public,anon;
revoke all on function public.list_my_group_discussion_bookmarks() from public,anon;
grant execute on function public.toggle_group_reading_discussion_bookmark(uuid) to authenticated;
grant execute on function public.list_my_group_discussion_bookmarks() to authenticated;

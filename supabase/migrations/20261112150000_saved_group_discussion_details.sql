create or replace function public.get_saved_group_reading_discussions(p_discussion_ids uuid[])
returns table(id uuid,group_id uuid,title text,body text,book_title text,author_name text,topic_type text,chapter_number integer,spoiler_chapter integer,created_at timestamptz)
language plpgsql security definer set search_path=public
as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 return query
 select d.id,d.group_id,d.title,d.body,b.book_title,
 coalesce(p.display_name,p.username,'Reader')::text,d.topic_type::text,d.chapter_number,d.spoiler_chapter,d.created_at
 from public.group_reading_discussion_bookmarks bm
 join public.group_reading_discussions d on d.id=bm.discussion_id
 join public.group_reading_books b on b.id=d.group_reading_book_id
 left join public.profiles p on p.id=d.created_by
 join public.group_chat_members m on m.group_id=d.group_id and m.user_id=auth.uid() and m.status='active'
 where bm.user_id=auth.uid() and d.id=any(coalesce(p_discussion_ids,'{}'::uuid[]))
 and (d.spoiler_chapter=0 or exists(select 1 from public.group_reading_progress rp where rp.group_reading_book_id=d.group_reading_book_id and rp.user_id=auth.uid() and rp.current_chapter>=d.spoiler_chapter));
end $$;
revoke all on function public.get_saved_group_reading_discussions(uuid[]) from public,anon;
grant execute on function public.get_saved_group_reading_discussions(uuid[]) to authenticated;

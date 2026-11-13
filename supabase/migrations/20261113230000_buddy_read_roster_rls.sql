-- Let enrolled readers see the roster and shared progress without recursive membership RLS.
create or replace function public.is_buddy_read_participant(read_id uuid, viewer_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.buddy_read_members m where m.buddy_read_id=read_id and m.user_id=viewer_id) $$;
revoke all on function public.is_buddy_read_participant(uuid,uuid) from public;
grant execute on function public.is_buddy_read_participant(uuid,uuid) to authenticated;
drop policy if exists "members view buddy read membership" on public.buddy_read_members;
create policy "participants view buddy read roster" on public.buddy_read_members for select to authenticated
using (public.is_buddy_read_participant(buddy_read_id,auth.uid()));

-- Reconcile Buddy Reads migrations with the production schema repair.
-- Safe to run against databases where the original Buddy Reads migrations already ran.
create table if not exists public.buddy_read_milestone_completions (
  milestone_id uuid not null references public.buddy_read_milestones(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (milestone_id, user_id)
);

create index if not exists buddy_read_discussions_author_idx
  on public.buddy_read_discussions(author_id);
create index if not exists buddy_read_invites_created_by_idx
  on public.buddy_read_invites(created_by);
create index if not exists buddy_read_members_read_user_idx
  on public.buddy_read_members(buddy_read_id, user_id);

alter table public.buddy_reads enable row level security;
alter table public.buddy_read_members enable row level security;
alter table public.buddy_read_milestones enable row level security;
alter table public.buddy_read_invites enable row level security;
alter table public.buddy_read_discussions enable row level security;
alter table public.buddy_read_milestone_completions enable row level security;

-- Private helper avoids recursive membership SELECT policies and is not exposed
-- through the public PostgREST schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
create or replace function private.is_buddy_read_participant(read_id uuid, viewer_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.buddy_read_members m
    where m.buddy_read_id = read_id and m.user_id = viewer_id
  );
$$;
revoke all on function private.is_buddy_read_participant(uuid,uuid) from public, anon, authenticated;
grant execute on function private.is_buddy_read_participant(uuid,uuid) to authenticated;

-- Replace legacy policies (including policies that recursively query the same table).
do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies
    where schemaname='public' and tablename in (
      'buddy_reads','buddy_read_members','buddy_read_milestones',
      'buddy_read_invites','buddy_read_discussions','buddy_read_milestone_completions'
    )
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

create policy buddy_reads_select_participants on public.buddy_reads
for select to authenticated using (
  (select auth.uid()) is not null and (
    created_by=(select auth.uid()) or
    private.is_buddy_read_participant(id,(select auth.uid()))
  )
);
create policy buddy_reads_insert_owner on public.buddy_reads
for insert to authenticated with check ((select auth.uid()) is not null and created_by=(select auth.uid()));
create policy buddy_reads_update_owner on public.buddy_reads
for update to authenticated using ((select auth.uid()) is not null and created_by=(select auth.uid()))
with check ((select auth.uid()) is not null and created_by=(select auth.uid()));
create policy buddy_reads_delete_owner on public.buddy_reads
for delete to authenticated using ((select auth.uid()) is not null and created_by=(select auth.uid()));

create policy buddy_members_select_participants on public.buddy_read_members
for select to authenticated using ((select auth.uid()) is not null and
  private.is_buddy_read_participant(buddy_read_id,(select auth.uid())));
create policy buddy_members_insert_self_or_host on public.buddy_read_members
for insert to authenticated with check ((select auth.uid()) is not null and (
  user_id=(select auth.uid()) or exists (
    select 1 from public.buddy_reads b where b.id=buddy_read_id and b.created_by=(select auth.uid())
  )
));
create policy buddy_members_update_self on public.buddy_read_members
for update to authenticated using ((select auth.uid()) is not null and user_id=(select auth.uid()))
with check ((select auth.uid()) is not null and user_id=(select auth.uid()));
create policy buddy_members_delete_self_or_host on public.buddy_read_members
for delete to authenticated using ((select auth.uid()) is not null and (
  user_id=(select auth.uid()) or exists (
    select 1 from public.buddy_reads b where b.id=buddy_read_id and b.created_by=(select auth.uid())
  )
));

create policy buddy_milestones_select_participants on public.buddy_read_milestones
for select to authenticated using ((select auth.uid()) is not null and
  private.is_buddy_read_participant(buddy_read_id,(select auth.uid())));
create policy buddy_milestones_manage_host on public.buddy_read_milestones
for all to authenticated using ((select auth.uid()) is not null and exists (
  select 1 from public.buddy_reads b where b.id=buddy_read_id and b.created_by=(select auth.uid())
)) with check ((select auth.uid()) is not null and exists (
  select 1 from public.buddy_reads b where b.id=buddy_read_id and b.created_by=(select auth.uid())
));

create policy buddy_invites_manage_host on public.buddy_read_invites
for all to authenticated using ((select auth.uid()) is not null and created_by=(select auth.uid()))
with check ((select auth.uid()) is not null and created_by=(select auth.uid()));

create policy buddy_discussions_select_participants on public.buddy_read_discussions
for select to authenticated using ((select auth.uid()) is not null and
  private.is_buddy_read_participant(buddy_read_id,(select auth.uid())));
create policy buddy_discussions_insert_participants on public.buddy_read_discussions
for insert to authenticated with check ((select auth.uid()) is not null and
  author_id=(select auth.uid()) and private.is_buddy_read_participant(buddy_read_id,(select auth.uid())));
create policy buddy_discussions_update_author on public.buddy_read_discussions
for update to authenticated using ((select auth.uid()) is not null and author_id=(select auth.uid()))
with check ((select auth.uid()) is not null and author_id=(select auth.uid()) and
  private.is_buddy_read_participant(buddy_read_id,(select auth.uid())));
create policy buddy_discussions_delete_author on public.buddy_read_discussions
for delete to authenticated using ((select auth.uid()) is not null and author_id=(select auth.uid()));

create policy buddy_completions_manage_self on public.buddy_read_milestone_completions
for all to authenticated using ((select auth.uid()) is not null and user_id=(select auth.uid()) and
  private.is_buddy_read_participant(
    (select m.buddy_read_id from public.buddy_read_milestones m where m.id=milestone_id),
    (select auth.uid())
  ))
with check ((select auth.uid()) is not null and user_id=(select auth.uid()) and
  private.is_buddy_read_participant(
    (select m.buddy_read_id from public.buddy_read_milestones m where m.id=milestone_id),
    (select auth.uid())
  ));

-- The invite endpoint is intentionally SECURITY DEFINER: invitees cannot read host
-- invite rows directly. It validates the token and enrolls only auth.uid().
create or replace function public.accept_buddy_read_invite(invite_token uuid)
returns uuid language plpgsql security definer set search_path=public
as $$
declare invite_row public.buddy_read_invites%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in to join this Buddy Read'; end if;
  select * into invite_row from public.buddy_read_invites
    where token=invite_token for update;
  if not found or invite_row.revoked_at is not null or invite_row.expires_at < now()
     or (invite_row.max_uses is not null and invite_row.uses >= invite_row.max_uses) then
    raise exception 'This invitation is invalid, expired, or fully used';
  end if;
  insert into public.buddy_read_members(buddy_read_id,user_id,role)
    values(invite_row.buddy_read_id,auth.uid(),'member')
    on conflict(buddy_read_id,user_id) do nothing;
  update public.buddy_read_invites set uses=uses+1 where id=invite_row.id;
  return invite_row.buddy_read_id;
end $$;
revoke all on function public.accept_buddy_read_invite(uuid) from public, anon;
grant execute on function public.accept_buddy_read_invite(uuid) to authenticated;

grant select,insert,update,delete on public.buddy_reads, public.buddy_read_members,
  public.buddy_read_milestones, public.buddy_read_invites, public.buddy_read_discussions,
  public.buddy_read_milestone_completions to authenticated;
revoke all on public.buddy_reads, public.buddy_read_members, public.buddy_read_milestones,
  public.buddy_read_invites, public.buddy_read_discussions, public.buddy_read_milestone_completions from anon;

notify pgrst, 'reload schema';

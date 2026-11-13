-- Buddy Read invitation links and authenticated joining.
create table if not exists public.buddy_read_invites (
  id uuid primary key default gen_random_uuid(),
  buddy_read_id uuid not null references public.buddy_reads(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '30 days'),
  max_uses integer,
  uses integer not null default 0,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists buddy_read_invites_read_idx on public.buddy_read_invites(buddy_read_id);
alter table public.buddy_read_invites enable row level security;
create policy "hosts manage buddy read invites" on public.buddy_read_invites for all to authenticated
using (created_by=auth.uid()) with check (created_by=auth.uid());

-- SECURITY DEFINER validates invite lifecycle and enrolls the signed-in user atomically.
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
revoke all on function public.accept_buddy_read_invite(uuid) from public;
grant execute on function public.accept_buddy_read_invite(uuid) to authenticated;

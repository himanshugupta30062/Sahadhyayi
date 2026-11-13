-- Buddy Reads: shared reading plans with milestones and participant progress.
create table if not exists public.buddy_reads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  book_id uuid,
  book_title text not null,
  book_author text,
  cover_url text,
  description text,
  created_by uuid not null references auth.users(id) on delete cascade,
  starts_at date,
  target_date date,
  visibility text not null default 'friends' check (visibility in ('private','friends')),
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.buddy_read_members (
  id uuid primary key default gen_random_uuid(),
  buddy_read_id uuid not null references public.buddy_reads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('host','member')),
  progress_page integer not null default 0 check (progress_page >= 0),
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  joined_at timestamptz not null default now(),
  unique(buddy_read_id,user_id)
);
create table if not exists public.buddy_read_milestones (
  id uuid primary key default gen_random_uuid(),
  buddy_read_id uuid not null references public.buddy_reads(id) on delete cascade,
  title text not null,
  target_page integer check (target_page is null or target_page >= 0),
  target_date date,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists buddy_reads_created_by_idx on public.buddy_reads(created_by,created_at desc);
create index if not exists buddy_read_members_user_idx on public.buddy_read_members(user_id,buddy_read_id);
create index if not exists buddy_read_milestones_order_idx on public.buddy_read_milestones(buddy_read_id,position);

alter table public.buddy_reads enable row level security;
alter table public.buddy_read_members enable row level security;
alter table public.buddy_read_milestones enable row level security;

-- A read is visible only to its creator or enrolled participants.
create policy "buddy reads visible to participants" on public.buddy_reads for select to authenticated
using (created_by = auth.uid() or exists(select 1 from public.buddy_read_members m where m.buddy_read_id=id and m.user_id=auth.uid()));
create policy "users create buddy reads" on public.buddy_reads for insert to authenticated with check (created_by=auth.uid());
create policy "hosts update buddy reads" on public.buddy_reads for update to authenticated using (created_by=auth.uid()) with check (created_by=auth.uid());
create policy "hosts delete buddy reads" on public.buddy_reads for delete to authenticated using (created_by=auth.uid());

create policy "members view buddy read membership" on public.buddy_read_members for select to authenticated
using (user_id=auth.uid() or exists(select 1 from public.buddy_reads b where b.id=buddy_read_id and b.created_by=auth.uid()));
create policy "hosts add buddy read members" on public.buddy_read_members for insert to authenticated
with check (exists(select 1 from public.buddy_reads b where b.id=buddy_read_id and b.created_by=auth.uid()) or user_id=auth.uid());
create policy "members update own progress" on public.buddy_read_members for update to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "hosts remove members" on public.buddy_read_members for delete to authenticated
using (exists(select 1 from public.buddy_reads b where b.id=buddy_read_id and b.created_by=auth.uid()) or user_id=auth.uid());

create policy "participants view milestones" on public.buddy_read_milestones for select to authenticated
using (exists(select 1 from public.buddy_read_members m where m.buddy_read_id=buddy_read_id and m.user_id=auth.uid()));
create policy "hosts manage milestones" on public.buddy_read_milestones for all to authenticated
using (exists(select 1 from public.buddy_reads b where b.id=buddy_read_id and b.created_by=auth.uid()))
with check (exists(select 1 from public.buddy_reads b where b.id=buddy_read_id and b.created_by=auth.uid()));

-- Automatically enroll the creator as host.
create or replace function public.buddy_read_enroll_host() returns trigger language plpgsql security definer set search_path=public
as $$ begin insert into public.buddy_read_members(buddy_read_id,user_id,role) values(new.id,new.created_by,'host') on conflict(buddy_read_id,user_id) do nothing; return new; end $$;
drop trigger if exists buddy_read_host_enrollment on public.buddy_reads;
create trigger buddy_read_host_enrollment after insert on public.buddy_reads for each row execute function public.buddy_read_enroll_host();

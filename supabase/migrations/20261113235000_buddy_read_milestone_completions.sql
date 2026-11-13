-- Per-reader completion state for shared Buddy Read milestones.
create table if not exists public.buddy_read_milestone_completions (
  milestone_id uuid not null references public.buddy_read_milestones(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (milestone_id,user_id)
);
alter table public.buddy_read_milestone_completions enable row level security;
create policy "participants view milestone completions" on public.buddy_read_milestone_completions
for select to authenticated using (
  public.is_buddy_read_participant((select m.buddy_read_id from public.buddy_read_milestones m where m.id=milestone_id),auth.uid()
);
create policy "readers manage own milestone completion" on public.buddy_read_milestone_completions
for all to authenticated using (
  user_id=auth.uid() and public.is_buddy_read_participant((select m.buddy_read_id from public.buddy_read_milestones m where m.id=milestone_id),auth.uid()
) with check (
  user_id=auth.uid() and public.is_buddy_read_participant((select m.buddy_read_id from public.buddy_read_milestones m where m.id=milestone_id),auth.uid()
);
create index if not exists buddy_read_milestone_completion_user_idx on public.buddy_read_milestone_completions(user_id,milestone_id);

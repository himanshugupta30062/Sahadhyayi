-- Science Lab community publishing requires explicit consent and moderator approval.
alter table public.science_experiment_attempts
  add column if not exists moderation_status text not null default 'private'
    check (moderation_status in ('private','pending','approved','rejected')),
  add column if not exists moderated_at timestamptz,
  add column if not exists moderation_note text
    check (moderation_note is null or char_length(moderation_note) <= 500);

-- Existing community submissions are not grandfathered into public visibility.
update public.science_experiment_attempts
set moderation_status = case when share_public then 'pending' else 'private' end
where moderation_status = 'private' and share_public = true;

drop policy if exists "Users can read public experiment attempts" on public.science_experiment_attempts;
create policy "Users can read approved public experiment attempts"
  on public.science_experiment_attempts for select to anon, authenticated
  using (
    (share_public = true and moderation_status = 'approved')
    or (select auth.uid()) = user_id
    or public.is_admin()
  );

drop policy if exists "Admins can moderate science experiment attempts" on public.science_experiment_attempts;
create policy "Admins can moderate science experiment attempts"
  on public.science_experiment_attempts for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Users may request sharing, but cannot approve or reject their own submissions.
create or replace function public.guard_science_experiment_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.moderation_status := case when new.share_public then 'pending' else 'private' end;
    new.moderated_at := null;
    new.moderation_note := null;
    return new;
  end if;

  if auth.role() = 'service_role' or public.is_admin() then
    if new.moderation_status is distinct from old.moderation_status then
      new.moderated_at := now();
    end if;
    return new;
  end if;

  -- Ignore client attempts to change moderation fields.
  new.moderation_status := old.moderation_status;
  new.moderated_at := old.moderated_at;
  new.moderation_note := old.moderation_note;

  if new.share_public is distinct from old.share_public then
    if new.share_public then
      new.moderation_status := 'pending';
      new.moderated_at := null;
      new.moderation_note := null;
    else
      new.moderation_status := 'private';
      new.moderated_at := null;
      new.moderation_note := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_science_experiment_moderation on public.science_experiment_attempts;
create trigger trg_guard_science_experiment_moderation
before insert or update on public.science_experiment_attempts
for each row execute function public.guard_science_experiment_moderation();

create index if not exists science_experiment_attempts_moderation_idx
  on public.science_experiment_attempts (moderation_status, created_at desc)
  where share_public = true;

comment on column public.science_experiment_attempts.moderation_status is
  'Community visibility state. Only admins may approve or reject a public sharing request.';

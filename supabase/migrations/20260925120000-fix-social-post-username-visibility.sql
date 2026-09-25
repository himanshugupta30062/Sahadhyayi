-- ============================================================================
-- Fix: posts created on the Social Media page were not visible in the feed.
--
-- Root cause (verified against the live project rknxtatvlzunatpyqxro):
--   * public.social_posts exists and its SELECT policy is open, BUT the table
--     contains ZERO rows — the post INSERT was silently failing because the
--     `username` column had a NOT NULL constraint while the client copies it
--     from public.user_profile, which RLS makes invisible to everyone except
--     the owner (and most accounts have no user_profile row at all), so
--     username resolved to null and Postgres rejected the insert
--     ("null value in column \"username\" violates not-null constraint").
--
-- This migration:
--   1. Relaxes social_posts.username (nullable + length cap) so a missing
--      display name can never make publishing fail again.
--   2. Adds a BEFORE INSERT trigger that backfills a sensible username from
--      user_profile / profiles / email prefix when none was supplied.
--   3. Auto-creates the missing user_profile row for the posting user
--      (owner-only visibility preserved; this only fixes the broken flow that
--      left many accounts without any profile row).
-- ============================================================================

alter table public.social_posts alter column username drop not null;
alter table public.social_posts
  add constraint social_posts_username_length check (username is null or char_length(username) <= 100);

create or replace function public.populate_social_post_username()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_email    text;
begin
  -- Prefer an explicit username supplied by the client.
  if new.username is not null and trim(new.username) <> '' then
    return new;
  end if;

  select coalesce(nullif(trim(up.username), ''), nullif(trim(up.name), ''))
    into v_username
  from public.user_profile up
  where up.id = new.user_id;

  if v_username is null then
    select nullif(trim(p.full_name), '')
      into v_username
    from public.profiles p
    where p.id = new.user_id;
  end if;

  if v_username is null then
    select split_part(u.email, '@', 1)
      into v_email
    from auth.users u
    where u.id = new.user_id;
    v_username := coalesce(nullif(v_email, ''), 'reader');
  end if;

  new.username := v_username;
  return new;
end;
$$;

drop trigger if exists trg_populate_social_post_username on public.social_posts;
create trigger trg_populate_social_post_username
  before insert on public.social_posts
  for each row execute function public.populate_social_post_username();

-- Ensure a (private) user_profile row exists whenever someone publishes,
-- so future posts show the real display name instead of the fallback.
create or replace function public.ensure_user_profile_for_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profile (id, username, name, email)
  select
    new.user_id,
    new.username,
    coalesce(
      nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
      new.username
    ),
    u.email
  from auth.users u
  where u.id = new.user_id
  on conflict (id) do nothing;
  return new;
exception when others then
  -- Never let profile bookkeeping break publishing.
  return new;
end;
$$;

drop trigger if exists trg_ensure_user_profile_on_post on public.social_posts;
create trigger trg_ensure_user_profile_on_post
  after insert on public.social_posts
  for each row execute function public.ensure_user_profile_for_post();

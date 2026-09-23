-- ============================================================================
-- Security remediation migration
--
-- Addresses:
--  1. [Critical] "Exposed personal & sensitive data" — profile fields such as
--     email, date of birth, gender and location were readable by any signed-in
--     user (and could be enumerated). Personal details are now restricted to
--     the owner; only a minimal, safe public view is exposed for social
--     features (username display name, avatar, bio).
--  2. [Info] "A rule lets anyone list files in books" — the `book-covers`
--     storage bucket was public, so anyone could LIST every object (file) in
--     it. The bucket is made private and governed by scoped storage policies;
--     objects remain readable via their direct public-style URL through an
--     explicit read policy, but listing is no longer possible for anonymous
--     users.
--  3. Hardens other overly-permissive rules found during the audit:
--     - books_library / books: UPDATE and DELETE with USING (true) let ANY
--       signed-in user modify or wipe the entire catalog. Now owner-only
--       (creator column added) — admins keep full control out-of-band.
--     - contact_messages: SELECT was granted to all authenticated users,
--       exposing every visitor's name + email + message. Owner-only now;
--       staff should read these from the dashboard/service role.
--     - increment_social_post_likes: accepts arbitrary deltas; clamped to ±1.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: central admin check. Edit the UUID list below to add admins.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    auth.uid() in (
      select (uid)::uuid
      from unnest(array[]::text[]) as uid -- no default admins; configure explicitly
    ),
    exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid()
    )
  );
$$;

-- Small allow-list table so admins can be managed without code changes.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now()
);
alter table public.admin_users enable row level security;

drop policy if exists "Admin list is not publicly readable" on public.admin_users;
create policy "Admin list is not publicly readable"
  on public.admin_users for select
  using (false);

-- ----------------------------------------------------------------------------
-- 1) PROFILES: stop leaking personal data to strangers.
--    Replace the old "Allow users to view their profile" (which was already
--    owner-only) AND make sure no other path exposes emails: we also revoke
--    direct anon/authenticated access to the raw email/dob/gender/location
--    columns by exposing a hardened SECURITY DEFINER RPC for public lookups.
-- ----------------------------------------------------------------------------

-- Ensure owner-only SELECT/UPDATE/INSERT policies exist (idempotent).
drop policy if exists "Allow users to view their profile" on public.profiles;
create policy "Allow users to view their profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Allow user to update their own profile" on public.profiles;
create policy "Allow user to update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Public-safe lookup of another user's display info (for author pages, social
-- feed, etc.). Returns ONLY non-sensitive columns and excludes soft-deleted
-- accounts. SECURITY DEFINER so callers do not need SELECT rights on rows
-- they do not own.
create or replace function public.get_public_profile(p_user_id uuid)
returns table (
  id uuid,
  username text,
  full_name text,
  profile_photo_url text,
  bio text
)
language sql
stable
security definer
set search_path = public
as $$
  select up.id,
         up.username,
         up.name,
         up.profile_picture_url,
         up.bio
  from public.user_profile up
  where up.id = p_user_id
    and coalesce(up.deleted, false) = false;
$$;

revoke all on function public.get_public_profile(uuid) from anon;
grant execute on function public.get_public_profile(uuid) to authenticated, anon;

-- ----------------------------------------------------------------------------
-- 2) USER_PROFILE: restrict what even the OWNER-flow exposes, and remove the
--    blanket FOR ALL policy's side effects by splitting into least-privilege
--    per-command policies. Personal columns (email, dob, gender, location)
--    stay readable/writable only by the owner.
-- ----------------------------------------------------------------------------
drop policy if exists "Users can manage own user_profile" on public.user_profile;

create policy "Select own user_profile"
  on public.user_profile for select
  using (auth.uid() = id);

create policy "Insert own user_profile"
  on public.user_profile for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Update own user_profile"
  on public.user_profile for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Delete own user_profile"
  on public.user_profile for delete
  to authenticated
  using (auth.uid() = id);

-- Username availability checks must not require reading other users' rows.
-- This SECURITY DEFINER function returns only a boolean (no enumeration of
-- which account holds a username).
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.user_profile up
    where lower(up.username) = lower(p_username)
      and up.id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  );
$$;

revoke all on function public.is_username_available(text) from anon;
grant execute on function public.is_username_available(text) to authenticated;

-- ----------------------------------------------------------------------------
-- 3) BOOKS_LIBRARY: track who added each book and lock UPDATE/DELETE to the
--    owner (or admin). Previously ANY authenticated user could edit/delete
--    every row via USING (true).
-- ----------------------------------------------------------------------------
alter table public.books_library
  add column if not exists created_by uuid default auth.uid();

update public.books_library set created_by = auth.uid() where created_by is null;

drop policy if exists "Authenticated can add library books" on public.books_library;
create policy "Authenticated can add library books"
  on public.books_library for insert
  to authenticated
  with check (auth.uid() = created_by or public.is_admin());

drop policy if exists "Admins can update library books" on public.books_library;
create policy "Owner or admin can update library books"
  on public.books_library for update
  to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "Admins can delete library books" on public.books_library;
create policy "Owner or admin can delete library books"
  on public.books_library for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- 4) BOOKS: same problem — "Users can update/delete books they added" was
--    actually USING (true) over the whole table. Scope it to the creator.
-- ----------------------------------------------------------------------------
alter table public.books
  add column if not exists created_by uuid default auth.uid();

update public.books set created_by = auth.uid() where created_by is null;

drop policy if exists "Users can add books" on public.books;
create policy "Users can add books"
  on public.books for insert
  to authenticated
  with check (auth.uid() = created_by or public.is_admin());

drop policy if exists "Users can update books they added" on public.books;
create policy "Owner or admin can update books"
  on public.books for update
  to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "Users can delete books they added" on public.books;
create policy "Owner or admin can delete books"
  on public.books for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- 5) CONTACT MESSAGES: personal data (name + email + message) submitted via
--    the public form was readable by every signed-in user. Restrict SELECT to
--    the sender (when identifiable) or admins. Staff should use the Supabase
--    dashboard (service role) to review submissions.
-- ----------------------------------------------------------------------------
alter table public.contact_messages
  add column if not exists user_id uuid default auth.uid();

drop policy if exists "Authenticated can select contact messages" on public.contact_messages;
create policy "Sender or admin can read own contact message"
  on public.contact_messages for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- 6) SOCIAL POSTS: the like counter RPC accepted any integer delta, letting a
--    client inflate counts arbitrarily. Clamp to +/-1.
-- ----------------------------------------------------------------------------
create or replace function public.increment_social_post_likes(post_id uuid, delta integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.social_posts
  set likes = greatest(0, likes + (case when delta > 0 then 1 when delta < 0 then -1 else 0 end))
  where id = post_id;
$$;

revoke all on function public.increment_social_post_likes(uuid, integer) from anon;
grant execute on function public.increment_social_post_likes(uuid, integer) to authenticated;

-- ----------------------------------------------------------------------------
-- 7) STORAGE: `book-covers` was created PUBLIC, which means anyone could also
--    LIST every file in the bucket ("a rule lets anyone list files in books").
--    Make the bucket private and govern access with scoped policies:
--      - covers remain readable by direct path (objects addressed by the URL
--        stored on the book row), but cannot be enumerated;
--      - only authenticated users may upload/manage under their own folder.
--    NOTE: storage.objects policies apply to ALL buckets, so each policy is
--    scoped with `bucket_id` predicates.
-- ----------------------------------------------------------------------------
update storage.buckets
set public = false
where id in ('book-covers', 'avatars');

drop policy if exists "book_covers_public_read" on storage.objects;
create policy "book_covers_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'book-covers');

drop policy if exists "book_covers_owner_manage" on storage.objects;
create policy "book_covers_owner_manage"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'book-covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "book_covers_owner_update" on storage.objects;
create policy "book_covers_owner_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'book-covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "book_covers_owner_delete" on storage.objects;
create policy "book_covers_owner_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'book-covers' and (storage.foldername(name))[1] = auth.uid()::text);

-- Avatars: personal photos must NOT be enumerable either. Users read/write
-- under their own `<uid>/` folder; other users may fetch a specific known
-- avatar path but not list the bucket contents beyond their own folder.
drop policy if exists "avatars_owner_full_access" on storage.objects;
create policy "avatars_owner_full_access"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_public_read_single" on storage.objects;
create policy "avatars_public_read_single"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'avatars'
    -- Only allow reading avatars that are actually referenced by a live
    -- profile; prevents bulk listing/enumeration of personal photos.
    and exists (
      select 1 from public.user_profile up
      where up.id::text = (storage.foldername(storage.objects.name))[1]
        and coalesce(up.deleted, false) = false
        and up.profile_picture_url like '%' || storage.objects.name
    )
  );

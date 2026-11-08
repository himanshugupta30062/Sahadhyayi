-- Private Reading Cabinet saves for social posts and literary quotes.
-- Saved items are visible only to their owner; post audience policies remain unchanged.
create table if not exists public.social_post_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  saved_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create index if not exists social_post_bookmarks_user_saved_idx
  on public.social_post_bookmarks(user_id, saved_at desc, post_id);

alter table public.social_post_bookmarks enable row level security;

drop policy if exists "Users manage their own social post bookmarks" on public.social_post_bookmarks;
create policy "Users manage their own social post bookmarks"
  on public.social_post_bookmarks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.social_post_bookmarks is
  'Private Reading Cabinet saves. A bookmark never changes the visibility of its referenced post.';

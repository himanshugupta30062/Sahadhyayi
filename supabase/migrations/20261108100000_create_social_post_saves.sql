-- Private saved social posts: each reader owns their Reading Cabinet.
create table if not exists public.social_post_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);
create index if not exists social_post_saves_user_created_idx
  on public.social_post_saves(user_id, created_at desc);
alter table public.social_post_saves enable row level security;
drop policy if exists "Readers manage their own saved posts" on public.social_post_saves;
create policy "Readers manage their own saved posts"
  on public.social_post_saves for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

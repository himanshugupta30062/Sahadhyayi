-- Social media posts table for the /reviews (Social Media) section
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  username text,
  image_url text,
  caption text not null check (char_length(caption) > 0 and char_length(caption) <= 2000),
  likes integer not null default 0,
  comments integer not null default 0,
  created_at timestamp with time zone not null default now()
);

-- Enable RLS
alter table public.social_posts enable row level security;

-- Anyone signed in can view all posts
create policy "Select social posts" on public.social_posts
  for select using (true);

-- Users can only publish posts as themselves
create policy "Insert own social posts" on public.social_posts
  for insert with check (auth.uid() = user_id);

-- Users can manage their own posts
create policy "Update own social posts" on public.social_posts
  for update using (auth.uid() = user_id);
create policy "Delete own social posts" on public.social_posts
  for delete using (auth.uid() = user_id);

-- Like/unlike is an atomic counter update allowed for any authenticated user
create function public.increment_social_post_likes(post_id uuid, delta integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.social_posts
  set likes = greatest(0, likes + delta)
  where id = post_id;
$$;

revoke all on function public.increment_social_post_likes(uuid, integer) from anon;
grant execute on function public.increment_social_post_likes(uuid, integer) to authenticated;

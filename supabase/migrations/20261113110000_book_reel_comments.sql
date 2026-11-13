-- Reader discussion on community book reels
create table if not exists public.book_reel_comments (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.book_reels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists book_reel_comments_reel_created_idx on public.book_reel_comments(reel_id, created_at);
alter table public.book_reel_comments enable row level security;
create policy "Comments are publicly readable" on public.book_reel_comments for select using (true);
create policy "Users can add own reel comments" on public.book_reel_comments for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete own reel comments" on public.book_reel_comments for delete to authenticated using (auth.uid() = user_id);

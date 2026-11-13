-- Private bookmarks for community Book Reels
create table if not exists public.book_reel_saves (
  reel_id uuid not null references public.book_reels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);
alter table public.book_reel_saves enable row level security;
create policy "Users can view their own reel saves" on public.book_reel_saves for select to authenticated using (auth.uid() = user_id);
create policy "Users can save reels for themselves" on public.book_reel_saves for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can unsave their own reels" on public.book_reel_saves for delete to authenticated using (auth.uid() = user_id);

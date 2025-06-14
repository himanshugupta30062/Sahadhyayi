
-- Stories table for text/audio stories
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  content text,
  format text check (format in ('text', 'audio')),
  created_at timestamp with time zone not null default now(),
  audio_url text
);

-- Reading Progress table
create table if not exists public.reading_progress (
  id serial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  book_title text not null,
  total_pages integer not null check (total_pages > 0),
  current_page integer not null default 1,
  cover_image_url text
);

-- Enable RLS
alter table public.stories enable row level security;
alter table public.reading_progress enable row level security;

-- Allow users to manage their own stories
create policy "Select own stories" on public.stories for select using (auth.uid() = user_id);
create policy "Insert own stories" on public.stories for insert with check (auth.uid() = user_id);
create policy "Update own stories" on public.stories for update using (auth.uid() = user_id);
create policy "Delete own stories" on public.stories for delete using (auth.uid() = user_id);

-- Allow users to manage their own reading progress
create policy "Select own reading_progress" on public.reading_progress for select using (auth.uid() = user_id);
create policy "Insert own reading_progress" on public.reading_progress for insert with check (auth.uid() = user_id);
create policy "Update own reading_progress" on public.reading_progress for update using (auth.uid() = user_id);
create policy "Delete own reading_progress" on public.reading_progress for delete using (auth.uid() = user_id);

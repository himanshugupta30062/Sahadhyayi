
-- User Profiles (linked to auth.users for extended user info)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamp with time zone not null default now()
);

-- Books table
create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  description text,
  cover_url text,
  created_at timestamp with time zone not null default now()
);

-- User-Books join (personal library, e.g. bookshelf)
create table public.user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  book_id uuid references public.books(id) on delete cascade,
  status text default 'unread',
  added_at timestamp with time zone not null default now()
);

-- Reading groups
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now()
);

-- Group members
create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamp with time zone not null default now()
);

-- Contact messages (from About page)
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamp with time zone not null default now()
);

-- Enable RLS and add policies

alter table public.profiles enable row level security;
alter table public.user_books enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.books enable row level security;
alter table public.contact_messages enable row level security;

-- Book policies: Public can SELECT
create policy "Books are public" on public.books for select using (true);

-- User books policies: allow users to view, insert, delete their own entries
create policy "Select own user_books" on public.user_books for select using (auth.uid() = user_id);
create policy "Insert own user_books" on public.user_books for insert with check (auth.uid() = user_id);
create policy "Delete own user_books" on public.user_books for delete using (auth.uid() = user_id);

-- Profiles policies
create policy "Allow users to view their profile" on public.profiles for select using (auth.uid() = id);
create policy "Allow user to update their own profile" on public.profiles for update using (auth.uid() = id);

-- Group policies: public SELECT
create policy "Groups are public" on public.groups for select using (true);

-- Group members: user can select/insert/delete own membership
create policy "Select own group_members" on public.group_members for select using (auth.uid() = user_id);
create policy "Insert own group_members" on public.group_members for insert with check (auth.uid() = user_id);
create policy "Delete own group_members" on public.group_members for delete using (auth.uid() = user_id);

-- Contact messages: anyone can insert (for contact form)
create policy "Anyone can create contact messages" on public.contact_messages for insert with check (true);


-- Literary creator directory: reviewers, critics and book-content creators.
create table if not exists public.literary_creators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  bio text,
  avatar_url text,
  creator_roles text[] not null default '{}',
  genres text[] not null default '{}',
  languages text[] not null default '{}',
  website_url text,
  featured boolean not null default false,
  verified boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  claimed_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint literary_creators_roles_check check (
    creator_roles <@ array['reviewer','critic','booktuber','bookstagrammer','booktok','blogger']::text[]
  ),
  constraint literary_creators_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint literary_creators_website_check check (website_url is null or website_url ~* '^https?://')
);

create index if not exists literary_creators_status_featured_idx
  on public.literary_creators(status, featured desc, name);
create index if not exists literary_creators_roles_idx
  on public.literary_creators using gin(creator_roles);
create index if not exists literary_creators_genres_idx
  on public.literary_creators using gin(genres);

create table if not exists public.creator_social_links (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.literary_creators(id) on delete cascade,
  platform text not null check (platform in ('youtube','instagram','tiktok','x','substack','website','goodreads','other')),
  label text,
  handle text,
  url text not null check (url ~* '^https?://'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists creator_social_links_creator_idx
  on public.creator_social_links(creator_id, sort_order);

create table if not exists public.creator_publications (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.literary_creators(id) on delete cascade,
  book_id uuid references public.books(id) on delete set null,
  title text not null,
  publication_type text not null check (publication_type in ('review','criticism','video','podcast','essay','other')),
  source_url text not null check (source_url ~* '^https?://'),
  excerpt text,
  published_at timestamptz,
  status text not null default 'pending' check (status in ('pending','published','rejected','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists creator_publications_creator_date_idx
  on public.creator_publications(creator_id, status, published_at desc);
create index if not exists creator_publications_book_idx
  on public.creator_publications(book_id, status, published_at desc);

alter table public.literary_creators enable row level security;
alter table public.creator_social_links enable row level security;
alter table public.creator_publications enable row level security;

-- Public directory is read-only to visitors; write access is restricted to admin helpers.
create policy "Published literary creators are public"
  on public.literary_creators for select to anon, authenticated
  using (status = 'published');

create policy "Creator social links for published profiles are public"
  on public.creator_social_links for select to anon, authenticated
  using (exists (
    select 1 from public.literary_creators c
    where c.id = creator_id and c.status = 'published'
  ));

create policy "Published creator publications are public"
  on public.creator_publications for select to anon, authenticated
  using (status = 'published' and exists (
    select 1 from public.literary_creators c
    where c.id = creator_id and c.status = 'published'
  ));

-- No direct insert/update/delete policies: use the trusted admin workflow or
-- a future verified creator-claim RPC with explicit authorization.

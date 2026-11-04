-- Sahadhyayi book and literary events: curated, source-verified listings.
create table if not exists public.book_event_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.book_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 3 and 300),
  slug text not null unique,
  description text,
  category_id uuid not null references public.book_event_categories(id) on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz,
  timezone text not null default 'Asia/Kolkata',
  venue text,
  city text,
  state text,
  country text not null default 'India',
  is_online boolean not null default false,
  registration_url text,
  official_source_url text not null,
  image_url text,
  organizer_name text,
  price_type text not null default 'unknown' check (price_type in ('free','paid','registration-required','unknown')),
  status text not null default 'draft' check (status in ('draft','published','cancelled','postponed','completed')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','needs_review')),
  featured boolean not null default false,
  last_verified_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_events_end_after_start check (end_at is null or end_at >= start_at),
  constraint book_events_location check (is_online or city is not null or venue is not null)
);

create index if not exists book_events_published_start_idx on public.book_events(start_at) where status = 'published';
create index if not exists book_events_category_start_idx on public.book_events(category_id,start_at) where status = 'published';
create index if not exists book_events_city_start_idx on public.book_events(lower(city),start_at) where status = 'published';
create index if not exists book_events_featured_idx on public.book_events(start_at) where status = 'published' and featured = true;

alter table public.book_event_categories enable row level security;
alter table public.book_events enable row level security;
revoke all on public.book_event_categories from anon, authenticated;
revoke all on public.book_events from anon, authenticated;
grant select on public.book_event_categories to anon, authenticated;
grant select on public.book_events to anon, authenticated;
grant insert, update, delete on public.book_events to authenticated;
grant insert, update, delete on public.book_event_categories to authenticated;

create policy "Anyone can view active event categories"
  on public.book_event_categories for select to anon, authenticated using (is_active = true or public.is_admin());
create policy "Anyone can view published book events"
  on public.book_events for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy "Admins manage event categories"
  on public.book_event_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage book events"
  on public.book_events for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.book_event_categories (name,slug,description,icon,sort_order) values
 ('Book Fairs & Exhibitions','book-fair','Book fairs, expos and publisher exhibitions','book-open',10),
 ('Literature Festivals','literature-festival','Literary festivals and cultural celebrations','landmark',20),
 ('Book Launches & Signings','book-launch','New releases, launch events and signing sessions','book-marked',30),
 ('Author Talks & Readings','author-talk','Author conversations, readings and panels','mic',40),
 ('Writing & Learning','workshop','Writing, translation and publishing workshops','pencil',50),
 ('Reader Meetups','reader-meetup','Book clubs, reading circles and book swaps','users',60),
 ('BookTech & Hackathons','booktech','Reading technology, AI and publishing innovation','laptop',70),
 ('Online Events','online','Virtual talks, webinars and digital readings','video',80)
on conflict (slug) do update set name=excluded.name,description=excluded.description,icon=excluded.icon,sort_order=excluded.sort_order,is_active=true;

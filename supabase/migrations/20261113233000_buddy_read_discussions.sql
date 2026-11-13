create table if not exists public.buddy_read_discussions (
 id uuid primary key default gen_random_uuid(),
 buddy_read_id uuid not null references public.buddy_reads(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 body text not null check (char_length(body) between 1 and 2000),
 spoiler_page integer,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists buddy_discussions_read_created_idx on public.buddy_read_discussions(buddy_read_id,created_at desc);
alter table public.buddy_read_discussions enable row level security;
create policy "participants read buddy discussions" on public.buddy_read_discussions for select to authenticated
using (public.is_buddy_read_participant(buddy_read_id,auth.uid()));
create policy "participants post buddy discussions" on public.buddy_read_discussions for insert to authenticated
with check (author_id=auth.uid() and public.is_buddy_read_participant(buddy_read_id,auth.uid()));
create policy "authors edit own buddy discussions" on public.buddy_read_discussions for update to authenticated
using (author_id=auth.uid()) with check (author_id=auth.uid() and public.is_buddy_read_participant(buddy_read_id,auth.uid()));
create policy "authors delete own buddy discussions" on public.buddy_read_discussions for delete to authenticated
using (author_id=auth.uid());

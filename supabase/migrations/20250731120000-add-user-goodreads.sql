create table if not exists public.user_goodreads (
  id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  access_token_secret text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_ug_updated on public.user_goodreads;
create trigger trg_ug_updated before update on public.user_goodreads
for each row execute function public.touch_updated_at();

alter table public.user_goodreads enable row level security;

create policy ug_owner_select on public.user_goodreads
for select to authenticated using (auth.uid() = id);

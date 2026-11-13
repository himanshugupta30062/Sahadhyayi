-- Personal Up Next queue with five ranked slots per user.
alter table public.user_bookshelf
  add column if not exists up_next_rank smallint;

alter table public.user_bookshelf
  drop constraint if exists user_bookshelf_up_next_rank_check;
alter table public.user_bookshelf
  add constraint user_bookshelf_up_next_rank_check
  check (up_next_rank is null or up_next_rank between 1 and 5);

create unique index if not exists user_bookshelf_up_next_rank_unique
  on public.user_bookshelf(user_id, up_next_rank)
  where up_next_rank is not null;

create index if not exists user_bookshelf_up_next_order
  on public.user_bookshelf(user_id, up_next_rank)
  where up_next_rank is not null;

-- Up Next queue (max five ranked books) and Did Not Finish shelf status.
alter table public.user_bookshelf
  add column if not exists up_next_rank smallint;

do $$
declare
  status_constraint text;
begin
  select c.conname into status_constraint
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public' and t.relname = 'user_bookshelf'
    and c.contype = 'c' and pg_get_constraintdef(c.oid) ilike '%status%';
  if status_constraint is not null then
    execute format('alter table public.user_bookshelf drop constraint %I', status_constraint);
    alter table public.user_bookshelf
      add constraint user_bookshelf_status_check
      check (status in ('want_to_read', 'reading', 'completed', 'did_not_finish'));
  end if;
end $$;

alter table public.user_bookshelf
  add constraint user_bookshelf_up_next_rank_check
  check (up_next_rank is null or up_next_rank between 1 and 5);

create unique index if not exists user_bookshelf_up_next_rank_unique
  on public.user_bookshelf(user_id, up_next_rank)
  where up_next_rank is not null;

create index if not exists user_bookshelf_up_next_order
  on public.user_bookshelf(user_id, up_next_rank)
  where up_next_rank is not null;

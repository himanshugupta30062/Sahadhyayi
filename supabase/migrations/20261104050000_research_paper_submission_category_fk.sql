do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'research_paper_submissions_category_fk'
      and conrelid = 'public.research_paper_submissions'::regclass
  ) then
    alter table public.research_paper_submissions
      add constraint research_paper_submissions_category_fk
      foreign key (paper_type)
      references public.research_paper_categories(slug)
      on update cascade
      on delete restrict;
  end if;
end
$$;

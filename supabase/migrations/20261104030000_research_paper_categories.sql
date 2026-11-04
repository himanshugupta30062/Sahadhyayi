-- Canonical categories for the research catalogue (used by UI labels and filters).
create table if not exists public.research_paper_categories (
  slug text primary key,
  name text not null unique,
  description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.research_paper_categories enable row level security;
drop policy if exists "Research paper categories are public read" on public.research_paper_categories;
create policy "Research paper categories are public read"
  on public.research_paper_categories for select using (true);
insert into public.research_paper_categories (slug,name,description,display_order) values
 ('article','Research article','Original research published in a scholarly journal',1),
 ('review','Review paper','Synthesis and review of existing research',2),
 ('preprint','Preprint','Research manuscript shared before peer review',3),
 ('conference-paper','Conference paper','Research presented at an academic conference',4),
 ('book-chapter','Book chapter','Scholarly chapter published in an edited volume',5),
 ('other','Other research','Other scholarly work types',6)
on conflict (slug) do update set name=excluded.name, description=excluded.description, display_order=excluded.display_order;

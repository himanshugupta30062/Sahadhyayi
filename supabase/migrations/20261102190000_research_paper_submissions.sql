-- Research paper contributions: private uploads and admin-reviewed catalogue submissions.
create table if not exists public.research_paper_submissions (
 id uuid primary key default gen_random_uuid(),
 submitter_id uuid not null references auth.users(id) on delete cascade,
 submission_kind text not null check (submission_kind in ('publish','contribute')),
 title text not null check (length(trim(title)) between 3 and 300),
 abstract text,
 authors text not null check (length(trim(authors)) between 2 and 2000),
 doi text,
 source_url text,
 publication_year integer check (publication_year between 1600 and extract(year from now())::integer + 1),
 paper_type text not null default 'article' check (paper_type in ('article','review','preprint','conference-paper','book-chapter','other')),
 file_path text,
 status text not null default 'pending_review' check (status in ('pending_review','approved','rejected')),
 moderator_id uuid references auth.users(id),
 moderator_note text,
 catalogue_work_id text,
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 constraint research_paper_submissions_doi_unique unique (doi)
);
create index if not exists research_paper_submissions_user_idx on public.research_paper_submissions(submitter_id,created_at desc);
create index if not exists research_paper_submissions_status_idx on public.research_paper_submissions(status,created_at);
alter table public.research_paper_submissions enable row level security;
revoke all on public.research_paper_submissions from anon, authenticated;
grant select, insert on public.research_paper_submissions to authenticated;
create policy "Users create own pending submissions" on public.research_paper_submissions for insert to authenticated with check (submitter_id = (select auth.uid()) and status = 'pending_review' and moderator_id is null and reviewed_at is null);
create policy "Submitters read own research submissions" on public.research_paper_submissions for select to authenticated using (submitter_id = (select auth.uid()) or public.is_admin());
create policy "Admins moderate research submissions" on public.research_paper_submissions for update to authenticated using (public.is_admin()) with check (public.is_admin());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('research-paper-quarantine','research-paper-quarantine',false,52428800,array['application/pdf']) on conflict(id) do update set public=false,file_size_limit=52428800,allowed_mime_types=array['application/pdf'];
create policy "Users upload own research quarantine files" on storage.objects for insert to authenticated with check (bucket_id='research-paper-quarantine' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Submitters and admins read research quarantine files" on storage.objects for select to authenticated using (bucket_id='research-paper-quarantine' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin()));
create policy "Users delete own research quarantine files" on storage.objects for delete to authenticated using (bucket_id='research-paper-quarantine' and (storage.foldername(name))[1]=(select auth.uid())::text);

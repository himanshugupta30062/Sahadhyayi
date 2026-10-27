-- Admin-controlled PDF uploads for the book catalog.
-- PDFs in this bucket are publicly readable because the library's existing pdf_url
-- field is consumed as a direct URL. Only verified admins may upload new files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('book-pdfs', 'book-pdfs', true, 52428800, array['application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read catalog PDFs" on storage.objects;
create policy "Public can read catalog PDFs"
on storage.objects for select
to public
using (bucket_id = 'book-pdfs');

drop policy if exists "Admins can upload catalog PDFs" on storage.objects;
create policy "Admins can upload catalog PDFs"
on storage.objects for insert
to authenticated
with check (bucket_id = 'book-pdfs' and public.is_admin());

drop policy if exists "Admins can update catalog PDFs" on storage.objects;
create policy "Admins can update catalog PDFs"
on storage.objects for update
to authenticated
using (bucket_id = 'book-pdfs' and public.is_admin())
with check (bucket_id = 'book-pdfs' and public.is_admin());

create table if not exists public.book_pdf_admin_audit (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books_library(id) on delete restrict,
  previous_pdf_url text,
  pdf_url text not null,
  source_url text not null,
  rights_basis text not null check (rights_basis in ('public_domain', 'open_license', 'authorized', 'publisher_hosted')),
  rights_notes text not null,
  file_name text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 52428800),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.book_pdf_admin_audit enable row level security;

drop policy if exists "Admins can read PDF audit records" on public.book_pdf_admin_audit;
create policy "Admins can read PDF audit records"
on public.book_pdf_admin_audit for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can create PDF audit records" on public.book_pdf_admin_audit;
create policy "Admins can create PDF audit records"
on public.book_pdf_admin_audit for insert
to authenticated
with check (public.is_admin() and uploaded_by = (select auth.uid()));

grant select, insert on public.book_pdf_admin_audit to authenticated;

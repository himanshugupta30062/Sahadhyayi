-- Persist link audit results for catalog reading sources.
alter table public.books_library
  add column if not exists reader_link_status text not null default 'unchecked'
    check (reader_link_status in ('unchecked','working','preview_only','broken','restricted','no_source')),
  add column if not exists reader_link_checked_at timestamptz,
  add column if not exists reader_link_http_status integer,
  add column if not exists reader_link_content_type text,
  add column if not exists reader_link_note text;
create index if not exists books_library_reader_link_status_idx
  on public.books_library(reader_link_status);
update public.books_library
set reader_link_status='no_source', reader_link_note='No reading URL is configured'
where coalesce(trim(pdf_url),'')='';
update public.books_library
set reader_link_status='preview_only',
    reader_link_note='Google Books preview; full-book access is not guaranteed'
where pdf_url ilike '%books.google.%' and reader_link_status='unchecked';

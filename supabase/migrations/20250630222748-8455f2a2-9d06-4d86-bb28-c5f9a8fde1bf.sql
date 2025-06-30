
-- Remove the internet_archive_url column from books_library table
ALTER TABLE books_library DROP COLUMN IF EXISTS internet_archive_url;

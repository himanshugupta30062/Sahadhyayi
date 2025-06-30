
-- Remove unwanted/unused columns from books_library table
ALTER TABLE public.books_library 
DROP COLUMN IF EXISTS pdf_url,
DROP COLUMN IF EXISTS amazon_url,
DROP COLUMN IF EXISTS google_books_url;

-- Keep only the essential columns:
-- id, title, author, genre, description, author_bio, cover_image_url, 
-- price, internet_archive_url, isbn, publication_year, pages, language, created_at

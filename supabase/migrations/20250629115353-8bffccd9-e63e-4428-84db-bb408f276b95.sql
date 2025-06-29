
-- Add new columns to books_library table to store complete book information
ALTER TABLE public.books_library 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS author_bio text,
ADD COLUMN IF NOT EXISTS price numeric(10,2),
ADD COLUMN IF NOT EXISTS amazon_url text,
ADD COLUMN IF NOT EXISTS google_books_url text,
ADD COLUMN IF NOT EXISTS internet_archive_url text,
ADD COLUMN IF NOT EXISTS isbn text,
ADD COLUMN IF NOT EXISTS publication_year integer,
ADD COLUMN IF NOT EXISTS pages integer,
ADD COLUMN IF NOT EXISTS language text DEFAULT 'English';

-- Insert the "A Brief History of Time" book
INSERT INTO public.books_library (
  title,
  author,
  genre,
  description,
  author_bio,
  cover_image_url,
  price,
  amazon_url,
  google_books_url,
  internet_archive_url,
  isbn,
  publication_year,
  pages,
  language
) VALUES (
  'A Brief History of Time',
  'Stephen Hawking',
  'Science',
  'A Brief History of Time is Stephen Hawking''s classic introduction to cosmology. It explains complex concepts like the Big Bang, black holes, and quantum physics in language accessible to non-scientists, making it one of the bestselling science books of all time.',
  'Stephen Hawking (1942–2018) was a British theoretical physicist and cosmologist renowned for his work on black holes and relativity. He was the Lucasian Professor of Mathematics at Cambridge and authored several popular science books, inspiring millions worldwide.',
  'https://covers.openlibrary.org/b/id/240726-L.jpg',
  10.99,
  'https://www.amazon.com/dp/B004Q3QSWQ',
  'https://books.google.com/books?id=zHduDwAAQBAJ',
  'https://archive.org/details/briefhistoryofti00step_1',
  '9780553380163',
  1988,
  256,
  'English'
);

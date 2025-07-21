-- Insert missing authors based on books_library entries
INSERT INTO public.authors
  (name, bio, profile_image_url, location, website_url, social_links, genres, books_count, followers_count, rating, upcoming_events)
VALUES
  ('Stephen Hawking', 'British theoretical physicist known for his work on black holes and cosmology.', NULL, 'Oxford, England', NULL, '{}', ARRAY['Science','Non-Fiction'], 0, 0, 4.8, 0),
  ('F. Scott Fitzgerald', 'American novelist famous for "The Great Gatsby".', NULL, 'USA', NULL, '{}', ARRAY['Fiction'], 0, 0, 4.5, 0),
  ('Jane Austen', 'English novelist noted for romance and social commentary.', NULL, 'England', NULL, '{}', ARRAY['Romance','Classic'], 0, 0, 4.7, 0),
  ('George Orwell', 'English writer known for dystopian works like "1984".', NULL, 'England', NULL, '{}', ARRAY['Dystopian Fiction'], 0, 0, 4.6, 0),
  ('Harper Lee', 'American author best known for "To Kill a Mockingbird".', NULL, 'Alabama, USA', NULL, '{}', ARRAY['Fiction'], 0, 0, 4.7, 0),
  ('J.D. Salinger', 'American writer known for "The Catcher in the Rye".', NULL, 'USA', NULL, '{}', ARRAY['Fiction'], 0, 0, 4.4, 0),
  ('J.K. Rowling', 'British author of the Harry Potter series.', NULL, 'United Kingdom', NULL, '{}', ARRAY['Fantasy'], 0, 0, 4.8, 0),
  ('J.R.R. Tolkien', 'English writer and philologist, author of "The Lord of the Rings".', NULL, 'United Kingdom', NULL, '{}', ARRAY['Fantasy'], 0, 0, 4.9, 0),
  ('Yuval Noah Harari', 'Israeli historian and philosopher, author of "Sapiens".', NULL, 'Israel', NULL, '{}', ARRAY['Non-Fiction','History'], 0, 0, 4.7, 0),
  ('Paulo Coelho', 'Brazilian novelist best known for "The Alchemist".', NULL, 'Brazil', NULL, '{}', ARRAY['Philosophy','Fiction'], 0, 0, 4.6, 0),
  ('Michelle Obama', 'American attorney and author of the memoir "Becoming".', NULL, 'USA', NULL, '{}', ARRAY['Biography'], 0, 0, 4.8, 0),
  ('Dharamvir Bharati', 'Influential Hindi novelist, poet and playwright.', NULL, 'Allahabad, India', NULL, '{}', ARRAY['Fiction'], 0, 0, 4.6, 0),
  ('Kamala Das', 'Indian writer known for her autobiography and poetry.', NULL, 'India', NULL, '{}', ARRAY['Autobiography','Poetry'], 0, 0, 4.5, 0),
  ('Shrilal Shukla', 'Hindi satirist famous for "Rag Darbari".', NULL, 'India', NULL, '{}', ARRAY['Satire'], 0, 0, 4.6, 0),
  ('Mannu Bhandari', 'Hindi author noted for realistic narratives.', NULL, 'India', NULL, '{}', ARRAY['Fiction'], 0, 0, 4.5, 0)
ON CONFLICT (name) DO NOTHING;

-- Update book counts for all authors
SELECT update_author_book_counts();

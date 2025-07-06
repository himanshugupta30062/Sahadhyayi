-- Create alternative books table for testing
CREATE TABLE public.books_test (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  author text,
  genre text,
  cover_image_url text,
  description text,
  author_bio text,
  isbn text,
  publication_year integer,
  pages integer,
  language text DEFAULT 'English',
  pdf_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.books_test ENABLE ROW LEVEL SECURITY;

-- Create policies for the test table
CREATE POLICY "Anyone can read test books" ON public.books_test FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert test books" ON public.books_test FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update test books" ON public.books_test FOR UPDATE USING (true);

-- Create updated_at trigger
CREATE TRIGGER books_test_updated_at
  BEFORE UPDATE ON public.books_test
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create unique constraint to prevent duplicates
CREATE UNIQUE INDEX books_test_isbn_unique ON public.books_test (isbn) WHERE isbn IS NOT NULL;
CREATE UNIQUE INDEX books_test_title_author_unique ON public.books_test (title, author) WHERE title IS NOT NULL AND author IS NOT NULL;
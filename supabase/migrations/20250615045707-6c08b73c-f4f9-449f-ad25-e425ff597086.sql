
-- 1. Central books library for global sharing
CREATE TABLE IF NOT EXISTS public.books_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  genre TEXT,
  pdf_url TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable RLS on the table
ALTER TABLE public.books_library ENABLE ROW LEVEL SECURITY;

-- 3. Public read access
CREATE POLICY "Anyone can read library books"
  ON public.books_library
  FOR SELECT
  USING (true);

-- 4. Allow authenticated users to add
CREATE POLICY "Authenticated can add library books"
  ON public.books_library
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Allow authenticated users to update
CREATE POLICY "Admins can update library books"
  ON public.books_library
  FOR UPDATE
  TO authenticated
  USING (true);

-- 6. Allow authenticated users to delete
CREATE POLICY "Admins can delete library books"
  ON public.books_library
  FOR DELETE
  TO authenticated
  USING (true);

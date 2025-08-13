
-- Create user_bookshelf table for users to add books to their personal collection
CREATE TABLE IF NOT EXISTS public.user_bookshelf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books_library(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'want_to_read' CHECK (status IN ('want_to_read', 'reading', 'completed')),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  UNIQUE(user_id, book_id)
);

-- Enable RLS on user_bookshelf
ALTER TABLE public.user_bookshelf ENABLE ROW LEVEL SECURITY;

-- Create policies for user_bookshelf
CREATE POLICY "Users can manage their own bookshelf" ON public.user_bookshelf
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create edge function for speech-to-text
CREATE OR REPLACE FUNCTION public.get_user_bookshelf_stats(user_uuid UUID)
RETURNS TABLE (
  total_books BIGINT,
  reading_books BIGINT,
  completed_books BIGINT,
  want_to_read_books BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_books,
    COUNT(*) FILTER (WHERE status = 'reading')::BIGINT as reading_books,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_books,
    COUNT(*) FILTER (WHERE status = 'want_to_read')::BIGINT as want_to_read_books
  FROM public.user_bookshelf 
  WHERE user_id = user_uuid;
END;
$$;

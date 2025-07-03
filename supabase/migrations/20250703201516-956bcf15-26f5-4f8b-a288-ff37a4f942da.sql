-- Create book summaries table for 15-minute summaries
CREATE TABLE IF NOT EXISTS public.book_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES public.books_library(id) ON DELETE CASCADE,
  summary_type TEXT NOT NULL DEFAULT 'full_book', -- 'full_book', 'chapter', 'page_range'
  content TEXT NOT NULL,
  page_start INTEGER,
  page_end INTEGER,
  chapter_number INTEGER,
  duration_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on book_summaries
ALTER TABLE public.book_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for book_summaries
CREATE POLICY "Anyone can read book summaries" 
ON public.book_summaries 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create summaries" 
ON public.book_summaries 
FOR INSERT 
WITH CHECK (true);

-- Create updated_at trigger for book_summaries
CREATE TRIGGER update_book_summaries_updated_at
BEFORE UPDATE ON public.book_summaries
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
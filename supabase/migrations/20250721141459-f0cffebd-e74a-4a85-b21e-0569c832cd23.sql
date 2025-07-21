-- Create user_books_location table for tracking reader locations
CREATE TABLE public.user_books_location (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_user_books_location_book_id ON public.user_books_location(book_id);
CREATE INDEX idx_user_books_location_user_id ON public.user_books_location(user_id);

-- Enable RLS
ALTER TABLE public.user_books_location ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can insert their own location data" 
ON public.user_books_location 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location data" 
ON public.user_books_location 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own location data" 
ON public.user_books_location 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view location data for maps" 
ON public.user_books_location 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_user_books_location_updated_at
BEFORE UPDATE ON public.user_books_location
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
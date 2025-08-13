
-- Create a dedicated authors table with proper data
CREATE TABLE IF NOT EXISTS public.authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  location TEXT DEFAULT 'Unknown',
  website_url TEXT,
  social_links JSONB DEFAULT '{}',
  genres TEXT[] DEFAULT '{}',
  books_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 4.0,
  upcoming_events INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view authors" ON public.authors FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert authors" ON public.authors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update authors" ON public.authors FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert some sample authors based on existing books
INSERT INTO public.authors (name, bio, location, genres, books_count, followers_count, rating, upcoming_events)
VALUES 
  ('Rabindranath Tagore', 'Nobel Prize-winning Bengali polymath who reshaped Bengali literature and music.', 'Kolkata, India', ARRAY['Poetry', 'Literature', 'Philosophy'], 15, 25000, 4.8, 2),
  ('Bankim Chandra Chattopadhyay', 'Bengali novelist, poet and journalist, known as the author of Vande Mataram.', 'West Bengal, India', ARRAY['Historical Fiction', 'Patriotic Literature'], 8, 18000, 4.6, 1),
  ('Sarat Chandra Chattopadhyay', 'Popular Bengali novelist and short story writer of the early 20th century.', 'West Bengal, India', ARRAY['Social Drama', 'Romance'], 12, 22000, 4.7, 3),
  ('Bibhutibhushan Bandopadhyay', 'Bengali author known for his autobiographical novel Pather Panchali.', 'West Bengal, India', ARRAY['Autobiographical Fiction', 'Rural Literature'], 6, 15000, 4.5, 0),
  ('Michael Madhusudan Dutt', 'Bengali poet and dramatist, pioneer of blank verse in Bengali literature.', 'West Bengal, India', ARRAY['Poetry', 'Drama'], 5, 12000, 4.4, 1)
ON CONFLICT (name) DO NOTHING;

-- Create function to update author book counts
CREATE OR REPLACE FUNCTION update_author_book_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.authors 
  SET books_count = (
    SELECT COUNT(*) 
    FROM public.books_library 
    WHERE LOWER(TRIM(books_library.author)) = LOWER(TRIM(authors.name))
  ),
  updated_at = NOW();
END;
$$ LANGUAGE plpgsql
  SET search_path = 'public, pg_catalog';

-- Execute the function to update book counts
SELECT update_author_book_counts();


-- Drop the table if it exists to start fresh
DROP TABLE IF EXISTS public.authors CASCADE;

-- Create the authors table with proper structure
CREATE TABLE public.authors (
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
  rating DECIMAL(3,2) DEFAULT 4.0,
  upcoming_events INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

-- Create policies for the authors table
CREATE POLICY "Anyone can view authors" ON public.authors FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert authors" ON public.authors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update authors" ON public.authors FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete authors" ON public.authors FOR DELETE USING (auth.role() = 'authenticated');

-- Insert comprehensive sample data with real author information
INSERT INTO public.authors (name, bio, profile_image_url, location, website_url, social_links, genres, books_count, followers_count, rating, upcoming_events)
VALUES 
  -- Indian/Bengali Authors
  (
    'Rabindranath Tagore', 
    'Nobel Prize-winning Bengali polymath who reshaped Bengali literature and music. He was a poet, writer, playwright, composer, philosopher, social reformer and painter.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Rabindranath_Tagore_in_1909.jpg/256px-Rabindranath_Tagore_in_1909.jpg',
    'Kolkata, India',
    'https://en.wikipedia.org/wiki/Rabindranath_Tagore',
    '{"wikipedia": "https://en.wikipedia.org/wiki/Rabindranath_Tagore", "goodreads": "https://www.goodreads.com/author/show/36314.Rabindranath_Tagore"}',
    ARRAY['Poetry', 'Literature', 'Philosophy', 'Drama'],
    25, 45000, 4.8, 2
  ),
  (
    'Bankim Chandra Chattopadhyay', 
    'Bengali novelist, poet and journalist, known as the author of Vande Mataram and considered one of the key figures in literary renaissance of Bengal.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Bankim_Chandra_Chattopadhyay.jpg/256px-Bankim_Chandra_Chattopadhyay.jpg',
    'West Bengal, India',
    'https://en.wikipedia.org/wiki/Bankim_Chandra_Chatterjee',
    '{"wikipedia": "https://en.wikipedia.org/wiki/Bankim_Chandra_Chatterjee"}',
    ARRAY['Historical Fiction', 'Patriotic Literature', 'Social Commentary'],
    12, 28000, 4.6, 1
  ),
  (
    'Sarat Chandra Chattopadhyay', 
    'Popular Bengali novelist and short story writer of the early 20th century. His works dealt with contemporary social problems and the lives of ordinary people.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Sarat_Chandra_Chattopadhyay.jpg/256px-Sarat_Chandra_Chattopadhyay.jpg',
    'West Bengal, India',
    'https://en.wikipedia.org/wiki/Sarat_Chandra_Chattopadhyay',
    '{"wikipedia": "https://en.wikipedia.org/wiki/Sarat_Chandra_Chattopadhyay"}',
    ARRAY['Social Drama', 'Romance', 'Family Saga'],
    18, 32000, 4.7, 3
  ),
  (
    'Bibhutibhushan Bandopadhyay', 
    'Bengali author known for his autobiographical novel Pather Panchali, which was later adapted into acclaimed films by Satyajit Ray.',
    NULL,
    'West Bengal, India',
    'https://en.wikipedia.org/wiki/Bibhutibhushan_Bandyopadhyay',
    '{"wikipedia": "https://en.wikipedia.org/wiki/Bibhutibhushan_Bandyopadhyay"}',
    ARRAY['Autobiographical Fiction', 'Rural Literature', 'Coming of Age'],
    8, 22000, 4.5, 0
  ),
  -- International Authors
  (
    'Gabriel García Márquez', 
    'Colombian novelist, short-story writer, screenwriter, and journalist. Nobel Prize winner known for popularizing magical realism.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Gabriel_Garcia_Marquez.jpg/256px-Gabriel_Garcia_Marquez.jpg',
    'Colombia',
    'https://en.wikipedia.org/wiki/Gabriel_García_Márquez',
    '{"wikipedia": "https://en.wikipedia.org/wiki/Gabriel_García_Márquez", "goodreads": "https://www.goodreads.com/author/show/13450.Gabriel_Garc_a_M_rquez"}',
    ARRAY['Magical Realism', 'Literary Fiction', 'Latin American Literature'],
    15, 89000, 4.9, 0
  ),
  (
    'Haruki Murakami', 
    'Japanese writer whose books and stories have been bestsellers in Japan as well as internationally, with his work being translated into 50 languages.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Haruki_Murakami_2018.jpg/256px-Haruki_Murakami_2018.jpg',
    'Tokyo, Japan',
    'https://en.wikipedia.org/wiki/Haruki_Murakami',
    '{"wikipedia": "https://en.wikipedia.org/wiki/Haruki_Murakami", "goodreads": "https://www.goodreads.com/author/show/3354.Haruki_Murakami"}',
    ARRAY['Surrealism', 'Contemporary Fiction', 'Magical Realism'],
    22, 125000, 4.7, 4
  ),
  (
    'Virginia Woolf', 
    'English writer, considered one of the most important modernist 20th-century authors and a pioneer in the use of stream of consciousness.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/George_Charles_Beresford_-_Virginia_Woolf_in_1902.jpg/256px-George_Charles_Beresford_-_Virginia_Woolf_in_1902.jpg',
    'London, England',
    'https://en.wikipedia.org/wiki/Virginia_Woolf',
    '{"wikipedia": "https://en.wikipedia.org/wiki/Virginia_Woolf", "goodreads": "https://www.goodreads.com/author/show/6765.Virginia_Woolf"}',
    ARRAY['Modernist Literature', 'Feminist Literature', 'Stream of Consciousness'],
    19, 67000, 4.6, 1
  ),
  (
    'Toni Morrison', 
    'American novelist, essayist, book editor, and college professor. Her novels are known for their epic themes, vivid dialogue, and richly detailed African-American characters.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Toni_Morrison_2008.jpg/256px-Toni_Morrison_2008.jpg',
    'Ohio, USA',
    'https://en.wikipedia.org/wiki/Toni_Morrison',
    '{"wikipedia": "https://en.wikipedia.org/wiki/Toni_Morrison", "goodreads": "https://www.goodreads.com/author/show/29.Toni_Morrison"}',
    ARRAY['African-American Literature', 'Historical Fiction', 'Literary Fiction'],
    11, 78000, 4.8, 2
  ),
  -- Contemporary Authors
  (
    'Elena Ferrante', 
    'Pseudonymous Italian novelist. Her four-book series of Neapolitan Novels achieved international success.',
    NULL,
    'Naples, Italy',
    NULL,
    '{"goodreads": "https://www.goodreads.com/author/show/254493.Elena_Ferrante"}',
    ARRAY['Contemporary Fiction', 'Feminist Literature', 'Italian Literature'],
    8, 95000, 4.5, 5
  ),
  (
    'Chimamanda Ngozi Adichie', 
    'Nigerian writer whose works include novels, short stories and nonfiction. She was described in The Times Literary Supplement as "the most prominent" of a "procession of critically acclaimed young anglophone authors."',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Chimamanda_Ngozi_Adichie_Commonwealth_Writers_Prize.jpg/256px-Chimamanda_Ngozi_Adichie_Commonwealth_Writers_Prize.jpg',
    'Lagos, Nigeria',
    'https://en.wikipedia.org/wiki/Chimamanda_Ngozi_Adichie',
    '{"wikipedia": "https://en.wikipedia.org/wiki/Chimamanda_Ngozi_Adichie", "goodreads": "https://www.goodreads.com/author/show/10560.Chimamanda_Ngozi_Adichie", "twitter": "https://twitter.com/ChimamandaReal"}',
    ARRAY['Contemporary Fiction', 'Postcolonial Literature', 'Feminist Literature'],
    5, 156000, 4.9, 8
  );

-- Update the function to ensure it returns the correct data
CREATE OR REPLACE FUNCTION get_authors_data()
RETURNS TABLE (
  id UUID,
  name TEXT,
  bio TEXT,
  profile_image_url TEXT,
  location TEXT,
  website_url TEXT,
  social_links JSONB,
  genres TEXT[],
  books_count INTEGER,
  followers_count INTEGER,
  rating DECIMAL(3,2),
  upcoming_events INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.bio,
    a.profile_image_url,
    a.location,
    a.website_url,
    a.social_links,
    a.genres,
    a.books_count,
    a.followers_count,
    a.rating,
    a.upcoming_events,
    a.created_at,
    a.updated_at
  FROM public.authors a
  ORDER BY a.books_count DESC, a.followers_count DESC;
END;
$$;

-- Update book counts based on existing books in books_library table
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
$$ LANGUAGE plpgsql;

-- Execute the function to update book counts based on actual books in the library
SELECT update_author_book_counts();

-- Snap Map Reading Spots, Literary Events Coordinates, and Saved Map Places
-- Adds geospatial discovery for verified public places (libraries, bookstores, literary cafes, study spaces)
-- and literary events on the Sahadhyayi Book Explore Map.

-- 1. Extend literary_events with coordinates
ALTER TABLE public.literary_events 
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'literary_events_lat_check'
  ) THEN
    ALTER TABLE public.literary_events
      ADD CONSTRAINT literary_events_lat_check
      CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'literary_events_lng_check'
  ) THEN
    ALTER TABLE public.literary_events
      ADD CONSTRAINT literary_events_lng_check
      CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS literary_events_coords_idx 
  ON public.literary_events (latitude, longitude) 
  WHERE status = 'published' AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- 2. Create reading_spots table
CREATE TABLE IF NOT EXISTS public.reading_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 200),
  slug text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('library', 'bookstore', 'cafe', 'park', 'study_space')),
  address text NOT NULL,
  city text NOT NULL,
  state text,
  country text NOT NULL DEFAULT 'India',
  latitude numeric NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  image_url text,
  description text,
  amenities jsonb DEFAULT '[]'::jsonb,
  is_verified boolean NOT NULL DEFAULT true,
  website_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reading_spots_coords_idx 
  ON public.reading_spots (latitude, longitude) 
  WHERE is_verified = true;

CREATE INDEX IF NOT EXISTS reading_spots_category_city_idx 
  ON public.reading_spots (category, lower(city));

ALTER TABLE public.reading_spots ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.reading_spots FROM anon, authenticated;
GRANT SELECT ON public.reading_spots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reading_spots TO authenticated;

DROP POLICY IF EXISTS "Anyone can view verified reading spots" ON public.reading_spots;
CREATE POLICY "Anyone can view verified reading spots"
  ON public.reading_spots FOR SELECT TO anon, authenticated
  USING (is_verified = true OR (auth.uid() IS NOT NULL AND public.is_admin()));

DROP POLICY IF EXISTS "Admins can manage reading spots" ON public.reading_spots;
CREATE POLICY "Admins can manage reading spots"
  ON public.reading_spots FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Create saved_map_places table
CREATE TABLE IF NOT EXISTS public.saved_map_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id uuid NOT NULL REFERENCES public.reading_spots(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, spot_id)
);

CREATE INDEX IF NOT EXISTS saved_map_places_user_idx ON public.saved_map_places (user_id);

ALTER TABLE public.saved_map_places ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.saved_map_places FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_map_places TO authenticated;

DROP POLICY IF EXISTS "Users can view their own saved places" ON public.saved_map_places;
CREATE POLICY "Users can view their own saved places"
  ON public.saved_map_places FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save places" ON public.saved_map_places;
CREATE POLICY "Users can save places"
  ON public.saved_map_places FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own saved places" ON public.saved_map_places;
CREATE POLICY "Users can remove their own saved places"
  ON public.saved_map_places FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4. Server-side RPC for Explore Map items
DROP FUNCTION IF EXISTS public.get_explore_map_items(numeric, numeric, numeric, text);
CREATE OR REPLACE FUNCTION public.get_explore_map_items(
  p_lat numeric DEFAULT NULL,
  p_lng numeric DEFAULT NULL,
  p_radius_km numeric DEFAULT 50,
  p_category text DEFAULT 'all'
)
RETURNS TABLE (
  id uuid,
  item_type text,
  title text,
  slug text,
  category text,
  latitude numeric,
  longitude numeric,
  address text,
  city text,
  image_url text,
  description text,
  distance_km numeric,
  extra_meta jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_radius numeric := LEAST(GREATEST(COALESCE(p_radius_km, 50), 1), 200);
BEGIN
  -- 1. Reading Spots
  RETURN QUERY
  SELECT
    rs.id,
    'reading_spot'::text AS item_type,
    rs.name AS title,
    rs.slug,
    rs.category,
    rs.latitude,
    rs.longitude,
    rs.address,
    rs.city,
    rs.image_url,
    rs.description,
    CASE
      WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        round((6371 * acos(
          LEAST(1::double precision, GREATEST(-1::double precision,
            cos(radians(p_lat::double precision)) * cos(radians(rs.latitude::double precision)) *
            cos(radians(rs.longitude::double precision) - radians(p_lng::double precision)) +
            sin(radians(p_lat::double precision)) * sin(radians(rs.latitude::double precision))
          ))
        ))::numeric, 1)
      ELSE NULL
    END AS distance_km,
    jsonb_build_object(
      'amenities', rs.amenities,
      'website_url', rs.website_url,
      'country', rs.country
    ) AS extra_meta
  FROM public.reading_spots AS rs
  WHERE rs.is_verified = true
    AND (
      p_category = 'all'
      OR (p_category = 'places' AND rs.category IN ('library', 'bookstore', 'cafe', 'park', 'study_space'))
      OR (p_category = rs.category)
    )
    AND (
      p_lat IS NULL OR p_lng IS NULL OR
      (6371 * acos(
        LEAST(1::double precision, GREATEST(-1::double precision,
          cos(radians(p_lat::double precision)) * cos(radians(rs.latitude::double precision)) *
          cos(radians(rs.longitude::double precision) - radians(p_lng::double precision)) +
          sin(radians(p_lat::double precision)) * sin(radians(rs.latitude::double precision))
        ))
      )) <= v_radius
    )

  UNION ALL

  -- 2. Published Literary Events with coordinates
  SELECT
    le.id,
    'literary_event'::text AS item_type,
    le.title,
    le.slug,
    'event'::text AS category,
    le.latitude,
    le.longitude,
    COALESCE(le.venue, le.city) AS address,
    le.city,
    le.image_url,
    le.description,
    CASE
      WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        round((6371 * acos(
          LEAST(1::double precision, GREATEST(-1::double precision,
            cos(radians(p_lat::double precision)) * cos(radians(le.latitude::double precision)) *
            cos(radians(le.longitude::double precision) - radians(p_lng::double precision)) +
            sin(radians(p_lat::double precision)) * sin(radians(le.latitude::double precision))
          ))
        ))::numeric, 1)
      ELSE NULL
    END AS distance_km,
    jsonb_build_object(
      'start_at', le.start_at,
      'end_at', le.end_at,
      'price_type', le.price_type,
      'registration_url', le.registration_url,
      'organizer_name', le.organizer_name
    ) AS extra_meta
  FROM public.literary_events AS le
  WHERE le.status = 'published'
    AND le.latitude IS NOT NULL
    AND le.longitude IS NOT NULL
    AND (p_category = 'all' OR p_category = 'events' OR p_category = 'event')
    AND (
      p_lat IS NULL OR p_lng IS NULL OR
      (6371 * acos(
        LEAST(1::double precision, GREATEST(-1::double precision,
          cos(radians(p_lat::double precision)) * cos(radians(le.latitude::double precision)) *
          cos(radians(le.longitude::double precision) - radians(p_lng::double precision)) +
          sin(radians(p_lat::double precision)) * sin(radians(le.latitude::double precision))
        ))
      )) <= v_radius
    )
  ORDER BY distance_km NULLS LAST;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_explore_map_items(numeric, numeric, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_explore_map_items(numeric, numeric, numeric, text) TO anon, authenticated;

-- 5. Seed verified Indian reading spots (libraries, bookstores, literary cafes)
INSERT INTO public.reading_spots (name, slug, category, address, city, state, latitude, longitude, image_url, description, amenities, website_url)
VALUES
  ('National Library of India', 'national-library-of-india', 'library', 'Belvedere Estate, Alipore', 'Kolkata', 'West Bengal', 22.5337, 88.3323, 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80', 'India’s largest library by volume and public record, holding millions of manuscripts, rare books and periodicals.', '["free_wifi", "quiet_zone", "archive_access", "study_desks"]'::jsonb, 'https://nationallibrary.gov.in'),
  ('Asiatic Society Library (Town Hall)', 'asiatic-society-library-mumbai', 'library', 'Shahid Bhagat Singh Rd, Fort', 'Mumbai', 'Maharashtra', 18.9298, 72.8361, 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800&q=80', 'Historic neoclassical library founded in 1804 with magnificent Doric steps, rare manuscripts including Dante’s 14th-century Divine Comedy.', '["rare_manuscripts", "quiet_zone", "historic_architecture"]'::jsonb, 'https://asiaticsociety.org.in'),
  ('Delhi Public Library (Central Library)', 'delhi-public-library-sp-mukherjee', 'library', 'Opposite Old Delhi Railway Station, Chandni Chowk', 'Delhi', 'Delhi', 28.6582, 77.2285, 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=800&q=80', 'Inaugurated by Jawaharlal Nehru in 1951, a cornerstone UNESCO model public library serving the reader community of Delhi.', '["braille_section", "children_library", "reading_room", "free_membership"]'::jsonb, 'https://dpl.gov.in'),
  ('State Central Library (Seshadri Iyer Memorial)', 'state-central-library-cubbon-park', 'library', 'Cubbon Park, Kasturba Road', 'Bangalore', 'Karnataka', 12.9763, 77.5929, 'https://images.unsplash.com/photo-1507842229451-9f750b284988?auto=format&fit=crop&w=800&q=80', 'Iconic red Pompeiian-style heritage library nestled within lush Cubbon Park, home to over 300,000 volumes.', '["garden_surroundings", "quiet_hall", "newspaper_archive"]'::jsonb, 'https://karnataka.gov.in'),
  ('Connemara Public Library', 'connemara-public-library-chennai', 'library', 'Pantheon Road, Egmore', 'Chennai', 'Tamil Nadu', 13.0694, 80.2570, 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80', 'One of the four National Depository Libraries in India receiving copies of all published Indian books and periodicals since 1890.', '["depository_collection", "stained_glass_ceilings", "research_hall"]'::jsonb, 'https://connemarapubliclibrarychennai.com'),
  ('State Central Library (Afzal Gunj)', 'state-central-library-hyderabad', 'library', 'Afzal Gunj, High Court Road', 'Hyderabad', 'Telangana', 17.3712, 78.4739, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80', 'Splendid heritage library overlooking the Musi River established in 1891 with palm-leaf manuscripts and 500,000+ volumes.', '["heritage_architecture", "urdu_persian_archives", "spacious_reading_halls"]'::jsonb, 'https://publiclibraries.telangana.gov.in'),
  ('Kitab Khana', 'kitab-khana-fort-mumbai', 'bookstore', 'Somaiya Bhavan, 45/47 Mahatma Gandhi Road, Fort', 'Mumbai', 'Maharashtra', 18.9322, 72.8315, 'https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=800&q=80', 'A beloved boutique bookstore in a 160-year-old heritage building with high ceilings, warm wooden bookshelves, and a cozy in-house cafe.', '["in_house_cafe", "curated_fiction", "poetry_corner", "children_room"]'::jsonb, 'https://kitabkhana.in'),
  ('Bahrisons Booksellers (Khan Market)', 'bahrisons-booksellers-khan-market', 'bookstore', 'Opposite Main Market, Khan Market', 'New Delhi', 'Delhi', 28.5996, 77.2272, 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=800&q=80', 'Founded in 1953 by Balraj Bahri, a legendary institution for bibliophiles, diplomats, authors and scholars.', '["author_signings", "south_asian_history", "coffee_shop_partner"]'::jsonb, 'https://bahrisonsbooksellers.com'),
  ('Oxford Bookstore (Park Street)', 'oxford-bookstore-park-street', 'bookstore', '17 Park Street', 'Kolkata', 'West Bengal', 22.5529, 88.3533, 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80', 'Over a century old, housing the famous Cha Bar where readers sip artisanal teas while reading the latest literary arrivals.', '["cha_bar_cafe", "literary_sessions", "magazine_hub", "art_gallery"]'::jsonb, 'https://oxfordbookstore.com'),
  ('Blossoms Book House (Church Street)', 'blossoms-book-house-church-street', 'bookstore', '84/1 Church Street', 'Bangalore', 'Karnataka', 12.9750, 77.6050, 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80', 'Three storeys of floor-to-ceiling second-hand and new books on Church Street; an iconic sanctuary for Bangalore readers.', '["rare_second_hand_books", "comics_graphic_novels", "technical_section"]'::jsonb, 'https://blossombookhouse.in'),
  ('Kunzum Books & Cafe (GK2 M-Block)', 'kunzum-books-gk2-delhi', 'cafe', 'M-60, M Block Market, Greater Kailash II', 'New Delhi', 'Delhi', 28.5348, 77.2432, 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80', 'A vibrant literary hub and coffee shop where readers get complimentary coffee with book purchases, attending regular author talks.', '["free_coffee_with_book", "live_author_talks", "wi_fi", "acoustics_music"]'::jsonb, 'https://kunzum.com'),
  ('Champaca Bookstore, Cafe & Library', 'champaca-bookstore-cafe-bangalore', 'cafe', '7/1 Edward Road, Vasanth Nagar', 'Bangalore', 'Karnataka', 12.9868, 77.5938, 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80', 'An independent, women-run bookstore and rooftop cafe nestled beneath avocado and champaca trees with thoughtful curation.', '["rooftop_garden_seating", "independent_presses", "pet_friendly", "craft_coffee"]'::jsonb, 'https://champaca.in'),
  ('Pagdandi Books Chai Cafe', 'pagdandi-books-chai-cafe-pune', 'cafe', 'Shop 6, Regent Plaza, Baner Pashan Link Rd', 'Pune', 'Maharashtra', 18.5583, 73.7915, 'https://images.unsplash.com/photo-1445116572660-23842988c889?auto=format&fit=crop&w=800&q=80', 'Cozy community space promoting slow reading, herbal chai, organic bakery treats, acoustic open-mics and book exchanges.', '["book_exchange", "herbal_teas", "acoustic_sessions", "board_games"]'::jsonb, 'https://pagdandi.org')
ON CONFLICT (slug) DO UPDATE SET
  address = EXCLUDED.address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  amenities = EXCLUDED.amenities,
  updated_at = now();

-- 6. Update coordinates for existing prominent literary events in India
UPDATE public.literary_events
SET latitude = 26.8833, longitude = 75.8083
WHERE slug = 'jaipur-literature-festival' OR title ILIKE '%jaipur literature festival%';

UPDATE public.literary_events
SET latitude = 28.6186, longitude = 77.2425
WHERE slug = 'new-delhi-world-book-fair' OR title ILIKE '%world book fair%';

UPDATE public.literary_events
SET latitude = 22.5855, longitude = 88.4140
WHERE slug = 'kolkata-international-book-fair' OR title ILIKE '%kolkata%book fair%';

NOTIFY pgrst, 'reload schema';

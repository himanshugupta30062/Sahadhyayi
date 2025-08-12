-- Create table to store individual user ratings per book
CREATE TABLE IF NOT EXISTS public.book_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_book_user UNIQUE (book_id, user_id)
);

-- Enable RLS
ALTER TABLE public.book_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for book_ratings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'book_ratings' AND policyname = 'Users can view their own ratings'
  ) THEN
    CREATE POLICY "Users can view their own ratings"
    ON public.book_ratings
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'book_ratings' AND policyname = 'Users can insert their own ratings'
  ) THEN
    CREATE POLICY "Users can insert their own ratings"
    ON public.book_ratings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'book_ratings' AND policyname = 'Users can update their own ratings'
  ) THEN
    CREATE POLICY "Users can update their own ratings"
    ON public.book_ratings
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'book_ratings' AND policyname = 'Users can delete their own ratings'
  ) THEN
    CREATE POLICY "Users can delete their own ratings"
    ON public.book_ratings
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Update updated_at automatically on updates
DROP TRIGGER IF EXISTS trg_book_ratings_updated_at ON public.book_ratings;
CREATE TRIGGER trg_book_ratings_updated_at
BEFORE UPDATE ON public.book_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Aggregate table to expose public averages and counts per book
CREATE TABLE IF NOT EXISTS public.book_ratings_agg (
  book_id UUID PRIMARY KEY,
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and allow public reads of aggregates
ALTER TABLE public.book_ratings_agg ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'book_ratings_agg' AND policyname = 'Anyone can view rating aggregates'
  ) THEN
    CREATE POLICY "Anyone can view rating aggregates"
    ON public.book_ratings_agg
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Function to refresh a single book's aggregates
CREATE OR REPLACE FUNCTION public.refresh_book_ratings_agg(target_book UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.book_ratings_agg (book_id, avg_rating, rating_count, updated_at)
  SELECT target_book,
         COALESCE(ROUND(AVG(rating)::numeric, 2), 0)::NUMERIC(3,2) AS avg_rating,
         COALESCE(COUNT(*), 0)::INT AS rating_count,
         now()
  FROM public.book_ratings
  WHERE book_id = target_book
  ON CONFLICT (book_id) DO UPDATE SET
    avg_rating = EXCLUDED.avg_rating,
    rating_count = EXCLUDED.rating_count,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- Trigger function to update aggregates on DML
CREATE OR REPLACE FUNCTION public.book_ratings_agg_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b UUID;
BEGIN
  b := COALESCE(NEW.book_id, OLD.book_id);
  PERFORM public.refresh_book_ratings_agg(b);
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Triggers on book_ratings
DROP TRIGGER IF EXISTS trg_book_ratings_agg_insert ON public.book_ratings;
DROP TRIGGER IF EXISTS trg_book_ratings_agg_update ON public.book_ratings;
DROP TRIGGER IF EXISTS trg_book_ratings_agg_delete ON public.book_ratings;

CREATE TRIGGER trg_book_ratings_agg_insert
AFTER INSERT ON public.book_ratings
FOR EACH ROW EXECUTE FUNCTION public.book_ratings_agg_trigger();

CREATE TRIGGER trg_book_ratings_agg_update
AFTER UPDATE ON public.book_ratings
FOR EACH ROW EXECUTE FUNCTION public.book_ratings_agg_trigger();

CREATE TRIGGER trg_book_ratings_agg_delete
AFTER DELETE ON public.book_ratings
FOR EACH ROW EXECUTE FUNCTION public.book_ratings_agg_trigger();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_book_ratings_book ON public.book_ratings (book_id);
CREATE INDEX IF NOT EXISTS idx_book_ratings_user ON public.book_ratings (user_id);

-- Backfill aggregates if any ratings exist already
INSERT INTO public.book_ratings_agg (book_id, avg_rating, rating_count)
SELECT book_id,
       ROUND(AVG(rating)::numeric, 2)::NUMERIC(3,2) AS avg_rating,
       COUNT(*)::INT AS rating_count
FROM public.book_ratings
GROUP BY book_id
ON CONFLICT (book_id) DO UPDATE SET
  avg_rating = EXCLUDED.avg_rating,
  rating_count = EXCLUDED.rating_count,
  updated_at = now();
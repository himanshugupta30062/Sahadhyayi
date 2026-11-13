-- Reader reaction and additional review dimension scores.
ALTER TABLE public.book_reviews ADD COLUMN IF NOT EXISTS reader_reaction text;
ALTER TABLE public.book_reviews DROP CONSTRAINT IF EXISTS book_reviews_reader_reaction_check;
ALTER TABLE public.book_reviews ADD CONSTRAINT book_reviews_reader_reaction_check CHECK (reader_reaction IS NULL OR reader_reaction IN ('joyful','thoughtful','inspired','heartbroken','tense','surprised','comforted','challenged'));
CREATE TABLE IF NOT EXISTS public.book_review_dimensions (
 review_id uuid NOT NULL REFERENCES public.book_reviews(id) ON DELETE CASCADE,
 dimension text NOT NULL CHECK (dimension IN ('writing','characters','plot','pacing','worldbuilding','originality')),
 score smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (review_id, dimension)
);
ALTER TABLE public.book_review_dimensions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Review dimensions are publicly readable" ON public.book_review_dimensions;
CREATE POLICY "Review dimensions are publicly readable" ON public.book_review_dimensions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage dimensions on own reviews" ON public.book_review_dimensions;
CREATE POLICY "Users manage dimensions on own reviews" ON public.book_review_dimensions FOR ALL
 USING (EXISTS (SELECT 1 FROM public.book_reviews r WHERE r.id = review_id AND r.user_id = auth.uid()))
 WITH CHECK (EXISTS (SELECT 1 FROM public.book_reviews r WHERE r.id = review_id AND r.user_id = auth.uid()));
GRANT SELECT ON public.book_review_dimensions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.book_review_dimensions TO authenticated;

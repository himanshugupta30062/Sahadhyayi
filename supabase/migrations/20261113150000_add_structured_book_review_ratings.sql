-- Add structured ratings to reader reviews (1–5 stars).
ALTER TABLE public.book_reviews
  ADD COLUMN IF NOT EXISTS overall_rating smallint,
  ADD COLUMN IF NOT EXISTS plot_rating smallint,
  ADD COLUMN IF NOT EXISTS characters_rating smallint,
  ADD COLUMN IF NOT EXISTS writing_rating smallint;

ALTER TABLE public.book_reviews
  DROP CONSTRAINT IF EXISTS book_reviews_overall_rating_check,
  DROP CONSTRAINT IF EXISTS book_reviews_plot_rating_check,
  DROP CONSTRAINT IF EXISTS book_reviews_characters_rating_check,
  DROP CONSTRAINT IF EXISTS book_reviews_writing_rating_check;

ALTER TABLE public.book_reviews
  ADD CONSTRAINT book_reviews_overall_rating_check CHECK (overall_rating BETWEEN 1 AND 5),
  ADD CONSTRAINT book_reviews_plot_rating_check CHECK (plot_rating IS NULL OR plot_rating BETWEEN 1 AND 5),
  ADD CONSTRAINT book_reviews_characters_rating_check CHECK (characters_rating IS NULL OR characters_rating BETWEEN 1 AND 5),
  ADD CONSTRAINT book_reviews_writing_rating_check CHECK (writing_rating IS NULL OR writing_rating BETWEEN 1 AND 5);

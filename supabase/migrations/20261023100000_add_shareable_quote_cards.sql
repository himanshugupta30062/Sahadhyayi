-- Shareable literary quote cards for the social feed.
-- Additive-only schema change: existing posts and audience/RLS policies are unchanged.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS post_kind text NOT NULL DEFAULT 'post',
  ADD COLUMN IF NOT EXISTS quote_text text,
  ADD COLUMN IF NOT EXISTS quote_author text,
  ADD COLUMN IF NOT EXISTS quote_source text,
  ADD COLUMN IF NOT EXISTS quote_context text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.posts'::regclass
      AND conname = 'posts_post_kind_valid'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_post_kind_valid
      CHECK (post_kind IN ('post', 'quote'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.posts'::regclass
      AND conname = 'posts_quote_content_valid'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_quote_content_valid
      CHECK (
        (post_kind = 'post')
        OR (
          post_kind = 'quote'
          AND quote_text IS NOT NULL
          AND length(btrim(quote_text)) BETWEEN 1 AND 500
        )
      );
  END IF;
END $$;

COMMENT ON COLUMN public.posts.post_kind IS 'Post presentation type: ordinary post or attributed literary quote card.';
COMMENT ON COLUMN public.posts.quote_text IS 'User-supplied short quotation displayed as a shareable literary card.';
COMMENT ON COLUMN public.posts.quote_author IS 'Attribution for the quoted words, when known.';
COMMENT ON COLUMN public.posts.quote_source IS 'Book, poem, speech, page, chapter, or other source attribution.';
COMMENT ON COLUMN public.posts.quote_context IS 'Reader reflection explaining why the quote matters or the person/situation it evokes.';

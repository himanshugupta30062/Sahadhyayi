-- Add accessible image descriptions to social posts.
-- Nullable by design: existing media remains valid and the UI falls back to a
-- descriptive generic label when older posts have no user-provided alt text.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS image_alt text;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_image_alt_length_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_image_alt_length_check
  CHECK (image_alt IS NULL OR char_length(image_alt) <= 250);

COMMENT ON COLUMN public.posts.image_alt IS
  'Optional user-provided alternative text for the post image; limited to 250 characters.';

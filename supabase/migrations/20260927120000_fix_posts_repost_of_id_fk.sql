-- Clean up any orphaned repost_of_id references before adding the FK constraint
UPDATE public.posts AS p
SET repost_of_id = NULL
WHERE p.repost_of_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.posts AS r WHERE r.id = p.repost_of_id);

-- Create the FK constraint that PostgREST needs to resolve the
-- reposted_post:posts!posts_repost_of_id_fkey(...) embed in the feed query.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_repost_of_id_fkey'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_repost_of_id_fkey
      FOREIGN KEY (repost_of_id) REFERENCES public.posts(id) ON DELETE SET NULL
      NOT VALID;
  END IF;
END
$$;

ALTER TABLE public.posts VALIDATE CONSTRAINT posts_repost_of_id_fkey;

NOTIFY pgrst, 'reload schema';

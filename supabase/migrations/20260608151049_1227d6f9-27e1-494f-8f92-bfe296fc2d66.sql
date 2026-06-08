-- Add FK from posts/post_comments/post_likes user_id to profiles.id so PostgREST
-- can resolve the embeds the client uses (profiles!posts_user_id_profiles_fkey etc.).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'post_comments_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.post_comments
      ADD CONSTRAINT post_comments_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'post_likes_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.post_likes
      ADD CONSTRAINT post_likes_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
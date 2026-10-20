-- Phase 1: one-way reader follows, separate from mutual friendships.
-- The table deliberately exposes relationship rows only to either participant.
CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_follows_pkey PRIMARY KEY (follower_id, following_id),
  CONSTRAINT user_follows_not_self CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS user_follows_following_id_created_at_idx
  ON public.user_follows (following_id, created_at DESC);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own follow relationships" ON public.user_follows;
CREATE POLICY "Users can read their own follow relationships"
  ON public.user_follows
  FOR SELECT
  TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

DROP POLICY IF EXISTS "Users can follow as themselves" ON public.user_follows;
CREATE POLICY "Users can follow as themselves"
  ON public.user_follows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id AND follower_id <> following_id);

DROP POLICY IF EXISTS "Users can unfollow as themselves" ON public.user_follows;
CREATE POLICY "Users can unfollow as themselves"
  ON public.user_follows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

REVOKE ALL ON TABLE public.user_follows FROM anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.user_follows TO authenticated;

COMMENT ON TABLE public.user_follows IS
  'One-way reader follow relationships. Separate from mutual friendships; RLS restricts reads to either participant.';

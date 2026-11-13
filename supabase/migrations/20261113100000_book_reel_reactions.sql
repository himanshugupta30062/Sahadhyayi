CREATE TABLE IF NOT EXISTS public.book_reel_reactions (
  reel_id uuid NOT NULL REFERENCES public.book_reels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (emoji IN ('❤️','😭','☕','🔥')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reel_id,user_id)
);
CREATE INDEX IF NOT EXISTS book_reel_reactions_reel_idx ON public.book_reel_reactions(reel_id);
ALTER TABLE public.book_reel_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read reel reactions" ON public.book_reel_reactions;
CREATE POLICY "Anyone can read reel reactions" ON public.book_reel_reactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage own reel reactions" ON public.book_reel_reactions;
CREATE POLICY "Users manage own reel reactions" ON public.book_reel_reactions FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

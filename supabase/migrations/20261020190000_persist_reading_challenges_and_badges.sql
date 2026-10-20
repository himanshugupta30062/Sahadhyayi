-- Persist reading challenges, participation progress, and reading-specific badges.
-- Progress is based only on books a reader has explicitly marked "completed"
-- in their own Sahadhyayi bookshelf; no mock achievements are generated.

CREATE TABLE IF NOT EXISTS public.reading_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  goal integer NOT NULL CHECK (goal > 0),
  challenge_type text NOT NULL DEFAULT 'books_completed',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.reading_challenges(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0),
  completed boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_challenges_user_challenge_unique UNIQUE (user_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS public.reading_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '📚',
  requirement_books integer NOT NULL CHECK (requirement_books > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_reading_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.reading_badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_reading_badges_user_badge_unique UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS user_challenges_user_id_idx
  ON public.user_challenges (user_id);
CREATE INDEX IF NOT EXISTS user_reading_badges_user_id_idx
  ON public.user_reading_badges (user_id);

ALTER TABLE public.reading_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active reading challenges are public" ON public.reading_challenges;
CREATE POLICY "Active reading challenges are public"
  ON public.reading_challenges FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Active reading badges are public" ON public.reading_badges;
CREATE POLICY "Active reading badges are public"
  ON public.reading_badges FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can read their own reading challenge entries" ON public.user_challenges;
CREATE POLICY "Users can read their own reading challenge entries"
  ON public.user_challenges FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can join active reading challenges" ON public.user_challenges;
CREATE POLICY "Users can join active reading challenges"
  ON public.user_challenges FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.reading_challenges AS rc
      WHERE rc.id = user_challenges.challenge_id
        AND rc.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can leave their own reading challenges" ON public.user_challenges;
CREATE POLICY "Users can leave their own reading challenges"
  ON public.user_challenges FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read their own earned reading badges" ON public.user_reading_badges;
CREATE POLICY "Users can read their own earned reading badges"
  ON public.user_reading_badges FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Explicitly keep public/anonymous access read-only and prevent clients from
-- directly editing progress or awarding themselves badges.
REVOKE ALL PRIVILEGES ON TABLE public.reading_challenges FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.reading_challenges TO anon, authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.reading_badges FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.reading_badges TO anon, authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.user_challenges FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.user_challenges TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.user_reading_badges FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.user_reading_badges TO authenticated;

INSERT INTO public.reading_challenges (slug, name, description, goal, challenge_type, is_active)
VALUES
  ('read-5-books', 'Read 5 Books', 'Complete 5 books and mark them as Completed on your Sahadhyayi bookshelf.', 5, 'books_completed', true),
  ('read-12-books', 'Read 12 Books', 'Complete 12 books and mark them as Completed on your Sahadhyayi bookshelf.', 12, 'books_completed', true)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    goal = EXCLUDED.goal,
    challenge_type = EXCLUDED.challenge_type,
    is_active = true;

INSERT INTO public.reading_badges (slug, name, description, icon, requirement_books, is_active)
VALUES
  ('first-book-completed', 'First Book Read', 'Completed your first book on Sahadhyayi.', '📚', 1, true),
  ('five-books-completed', 'Bookworm', 'Completed five books on your Sahadhyayi bookshelf.', '🐛', 5, true),
  ('ten-books-completed', 'Avid Reader', 'Completed ten books on your Sahadhyayi bookshelf.', '🏆', 10, true)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    requirement_books = EXCLUDED.requirement_books,
    is_active = true;

CREATE OR REPLACE FUNCTION public.sync_reading_challenge_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_completed_books integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;

  IF v_user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  SELECT count(*)::integer
    INTO v_completed_books
  FROM public.user_bookshelf
  WHERE user_id = v_user_id
    AND status = 'completed';

  UPDATE public.user_challenges AS uc
  SET progress = LEAST(v_completed_books, rc.goal),
      completed = (v_completed_books >= rc.goal),
      updated_at = now()
  FROM public.reading_challenges AS rc
  WHERE uc.challenge_id = rc.id
    AND uc.user_id = v_user_id;

  -- Earned badges are permanent achievements, even if a reader later edits
  -- or removes a bookshelf entry.
  INSERT INTO public.user_reading_badges (user_id, badge_id)
  SELECT v_user_id, rb.id
  FROM public.reading_badges AS rb
  WHERE rb.is_active
    AND v_completed_books >= rb.requirement_books
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_reading_challenge_progress() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sync_reading_challenges_from_bookshelf ON public.user_bookshelf;
CREATE TRIGGER sync_reading_challenges_from_bookshelf
  AFTER INSERT OR UPDATE OR DELETE ON public.user_bookshelf
  FOR EACH ROW EXECUTE FUNCTION public.sync_reading_challenge_progress();

DROP TRIGGER IF EXISTS initialize_reading_challenge_progress ON public.user_challenges;
CREATE TRIGGER initialize_reading_challenge_progress
  AFTER INSERT ON public.user_challenges
  FOR EACH ROW EXECUTE FUNCTION public.sync_reading_challenge_progress();

-- Backfill badges using existing, explicitly completed bookshelf entries.
-- This does not infer completion dates or fabricate historical challenge progress.
INSERT INTO public.user_reading_badges (user_id, badge_id)
SELECT completed.user_id, rb.id
FROM (
  SELECT user_id, count(*)::integer AS completed_books
  FROM public.user_bookshelf
  WHERE status = 'completed'
  GROUP BY user_id
) AS completed
JOIN public.reading_badges AS rb
  ON completed.completed_books >= rb.requirement_books
WHERE rb.is_active
ON CONFLICT (user_id, badge_id) DO NOTHING;

COMMENT ON TABLE public.user_challenges IS
  'Reader participation in lifetime reading challenges; progress is maintained from completed user_bookshelf rows by a database trigger.';
COMMENT ON TABLE public.user_reading_badges IS
  'Persisted reading achievements earned from completed user_bookshelf rows; users can read their own awards but cannot self-award.';

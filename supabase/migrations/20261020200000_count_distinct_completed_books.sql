-- Count distinct completed books so duplicate shelf entries cannot inflate
-- reading-challenge progress or unlock reading badges prematurely.

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

  SELECT count(DISTINCT book_id)::integer
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

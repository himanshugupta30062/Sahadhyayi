ALTER TABLE public.content_feedback DROP CONSTRAINT content_feedback_feedback_type_check;
ALTER TABLE public.content_feedback ADD CONSTRAINT content_feedback_feedback_type_check CHECK (feedback_type = ANY (ARRAY['like','dislike','suggestion','idea','issue','improvement','reader_comment','reader_quote','sequel_vote']::text[]));

CREATE OR REPLACE FUNCTION public.get_sequel_vote_counts(p_book_id uuid)
RETURNS TABLE(yes_count bigint, no_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE r record; payload jsonb; yes_total bigint := 0; no_total bigint := 0; seen_users uuid[] := ARRAY[]::uuid[];
BEGIN
  FOR r IN SELECT user_id, comment FROM public.content_feedback WHERE feedback_type = 'sequel_vote' ORDER BY created_at DESC, id DESC LOOP
    BEGIN
      payload := r.comment::jsonb;
    EXCEPTION WHEN invalid_text_representation THEN
      CONTINUE;
    END;
    IF payload->>'bookId' = p_book_id::text AND payload->>'vote' IN ('yes','no') AND NOT (r.user_id = ANY(seen_users)) THEN
      seen_users := array_append(seen_users, r.user_id);
      IF payload->>'vote' = 'yes' THEN yes_total := yes_total + 1; ELSE no_total := no_total + 1; END IF;
    END IF;
  END LOOP;
  RETURN QUERY SELECT yes_total, no_total;
END;
$$;
REVOKE ALL ON FUNCTION public.get_sequel_vote_counts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sequel_vote_counts(uuid) TO anon, authenticated, service_role;